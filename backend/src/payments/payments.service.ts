import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { OrderStatus, PaymentStatus, TicketStatus } from '../types/prisma-enums';
import * as mercadopago from 'mercadopago';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private client: any;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // Initialize MercadoPago
    const accessToken = this.config.get('MP_ACCESS_TOKEN');
    
    if (!accessToken) {
      this.logger.warn('MercadoPago ACCESS_TOKEN not configured');
    } else {
      this.client = new mercadopago.MercadoPagoConfig({
        accessToken: accessToken,
      });
      this.logger.log('✅ MercadoPago SDK initialized');
    }
  }

async createPreference(orderId: string, userId: string) {
  // 1. Get order details
  const order = await this.prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      event: true,
      user: true,
    },
  });

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  if (order.status !== OrderStatus.PENDING) {
    throw new BadRequestException('Order is not pending payment');
  }

  // 2. Check if order expired
  if (!order.expiresAt || new Date(order.expiresAt) < new Date()) {
    throw new BadRequestException('Order has expired');
  }

  // 3. Check if payment already exists
  const existingPayment = await this.prisma.payment.findUnique({
    where: { orderId },
  });

  if (existingPayment?.mpPreferenceId) {
    return {
      preferenceId: existingPayment.mpPreferenceId,
      orderId: order.id,
      orderNumber: order.orderNumber,
    };
  }

  // 4. Create MercadoPago Preference
  try {
    const preference = new mercadopago.Preference(this.client);

    const preferenceData = {
      items: [
        {
          id: order.event.id,
          title: `${order.event.title} - ${order.quantity} ticket(s)`,
          description: order.event.description,
          category_id: 'tickets',
          quantity: order.quantity,
          unit_price: Number(order.event.price),
        },
      ],
      payer: {
        email: order.user.email,
        name: order.user.firstName,
        surname: order.user.lastName,
      },
      external_reference: order.id,
      statement_descriptor: 'TICKETING',
    };

    const response = await preference.create({ body: preferenceData });

    // 5. Save payment record
    await this.prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        mpPreferenceId: response.id,
        amount: order.totalAmount,
        currency: 'ARS',
        status: PaymentStatus.PENDING,
      },
      update: {
        mpPreferenceId: response.id,
      },
    });

    return {
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
      orderId: order.id,
      orderNumber: order.orderNumber,
    };
  } catch (error) {
    this.logger.error('MercadoPago preference creation failed', error);
    throw new BadRequestException('Failed to create payment preference');
  }
}

  async handleWebhook(data: any) {
    this.logger.log(`Webhook received: ${JSON.stringify(data)}`);

    // MercadoPago sends payment updates via webhook
    if (data.type === 'payment') {
      const paymentId = data.data?.id;

      if (!paymentId) {
        this.logger.warn('Webhook missing payment ID');
        return { received: true };
      }

      try {
        // Get payment details from MercadoPago
        const payment = new mercadopago.Payment(this.client);
        const mpPayment = await payment.get({ id: paymentId });

        this.logger.log(`Payment status: ${mpPayment.status}`);

        // Find our payment record by external_reference (orderId)
        const orderId = mpPayment.external_reference;

        if (!orderId) {
          this.logger.warn('Payment missing external_reference');
          return { received: true };
        }

        // Update payment in database
        await this.updatePaymentStatus(orderId, paymentId, mpPayment);

        return { received: true };
      } catch (error) {
        this.logger.error('Webhook processing error', error);
        return { received: true, error: error.message };
      }
    }

    return { received: true };
  }

  private async updatePaymentStatus(orderId: string, mpPaymentId: string, mpPayment: any) {
    const status = mpPayment.status;
    const paymentType = mpPayment.payment_type_id;
    const paymentMethod = mpPayment.payment_method_id;

    // Map MercadoPago status to our status
    let paymentStatus: PaymentStatus;
    let orderStatus: OrderStatus;

    switch (status) {
      case 'approved':
        paymentStatus = PaymentStatus.APPROVED;
        orderStatus = OrderStatus.PAID;
        break;
      case 'rejected':
      case 'cancelled':
        paymentStatus = PaymentStatus.REJECTED;
        orderStatus = OrderStatus.CANCELLED;
        break;
      case 'refunded':
        paymentStatus = PaymentStatus.REFUNDED;
        orderStatus = OrderStatus.CANCELLED;
        break;
      default:
        paymentStatus = PaymentStatus.PENDING;
        orderStatus = OrderStatus.PENDING;
    }

    // Update in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { orderId },
        data: {
          mpPaymentId,
          mpStatus: status,
          status: paymentStatus,
          paymentMethod,
          paymentType,
          webhookReceived: true,
          webhookAttempts: { increment: 1 },
          lastWebhookAt: new Date(),
        },
      });

      // Update order
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: orderStatus },
        include: { event: true },
      });

      // If payment approved, generate tickets
      if (status === 'approved') {
        await this.generateTickets(tx, order);
      }

      // If payment failed, return tickets to inventory
      if (status === 'rejected' || status === 'cancelled') {
        await tx.event.update({
          where: { id: order.eventId },
          data: {
            availableTickets: { increment: order.quantity },
          },
        });
      }
    });

    this.logger.log(`Payment ${mpPaymentId} updated to ${status} for order ${orderId}`);
  }

  private async generateTickets(tx: any, order: any) {
    const ticketsData: Array<{
      orderId: string;
      eventId: string;
      qrCode: string;
      qrNonce: string;
      status: TicketStatus;
    }> = [];

    for (let i = 0; i < order.quantity; i++) {
      const qrNonce = this.generateNonce();
      const qrCode = this.generateQRCode(order.id, order.eventId, qrNonce);

      ticketsData.push({
        orderId: order.id,
        eventId: order.eventId,
        qrCode,
        qrNonce,
        status: TicketStatus.ACTIVE,
      });
    }

    await tx.ticket.createMany({
      data: ticketsData,
    });

    this.logger.log(`Generated ${ticketsData.length} tickets for order ${order.id}`);
  }

  private generateNonce(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateQRCode(orderId: string, eventId: string, nonce: string): string {
    // For now, simple concatenation. We'll add crypto signing later
    const payload = {
      orderId,
      eventId,
      nonce,
      timestamp: Date.now(),
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  async getPaymentStatus(orderId: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        order: { userId },
      },
      include: {
        order: {
          include: {
            event: {
              select: {
                title: true,
                date: true,
                venue: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }
}