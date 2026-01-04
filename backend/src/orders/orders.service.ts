import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, EventStatus } from '../types/prisma-enums';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    // 1. Check if event exists and is published
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('Event is not available for purchase');
    }

    // 2. Check if event date hasn't passed
    if (new Date(event.date) < new Date()) {
      throw new BadRequestException('Event has already passed');
    }

    // 3. Check ticket availability (CRITICAL: This needs to be in a transaction)
    if (event.availableTickets < dto.quantity) {
      throw new BadRequestException(
        `Only ${event.availableTickets} tickets available`,
      );
    }

    // 4. Calculate total amount
    const totalAmount = Number(event.price) * dto.quantity;

    // 5. Create order with transaction (CONCURRENCY CONTROL)
    try {
      const order = await this.prisma.$transaction(async (tx) => {
        // Lock the event row and decrement available tickets
        const updatedEvent = await tx.event.update({
          where: { id: dto.eventId },
          data: {
            availableTickets: {
              decrement: dto.quantity,
            },
          },
        });

        // Double-check we didn't go negative (race condition protection)
        if (updatedEvent.availableTickets < 0) {
          throw new BadRequestException('Not enough tickets available');
        }

        // Create the order
        const newOrder = await tx.order.create({
          data: {
            userId,
            eventId: dto.eventId,
            quantity: dto.quantity,
            totalAmount,
            status: OrderStatus.PENDING,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
          },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                date: true,
                venue: true,
                price: true,
              },
            },
          },
        });

        return newOrder;
      });

      return order;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create order');
    }
  }

  async findUserOrders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              date: true,
              venue: true,
              imageUrl: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              mpPaymentId: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId, // Ensure user owns this order
      },
      include: {
        event: true,
        payment: true,
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            status: true,
            qrCode: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.findOne(orderId, userId);

    // Can only cancel pending orders
    if (order.status !== OrderStatus.PENDING) {
      throw new ForbiddenException('Can only cancel pending orders');
    }

    // Return tickets to inventory and cancel order
    await this.prisma.$transaction(async (tx) => {
      // Increment available tickets
      await tx.event.update({
        where: { id: order.eventId },
        data: {
          availableTickets: {
            increment: order.quantity,
          },
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });
    });

    return { message: 'Order cancelled successfully' };
  }

  // ADMIN: Get all orders
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              date: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.order.count(),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}