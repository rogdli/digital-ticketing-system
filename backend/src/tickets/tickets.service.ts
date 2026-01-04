import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TicketStatus } from '../types/prisma-enums';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  // Get user's tickets
  async getUserTickets(userId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        order: {
          userId,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            venue: true,
            address: true,
            imageUrl: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tickets;
  }

  // Get single ticket details
  async getTicket(ticketId: string, userId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        order: {
          userId,
        },
      },
      include: {
        event: true,
        order: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  // Validate QR code (OPERATOR/SCANNER endpoint)
  async validateQRCode(qrCode: string, operatorId: string) {
    try {
      // 1. Decode QR code
      const decoded = Buffer.from(qrCode, 'base64').toString('utf-8');
      const payload = JSON.parse(decoded);

      // 2. Find ticket by QR nonce
      const ticket = await this.prisma.ticket.findUnique({
        where: { qrNonce: payload.nonce },
        include: {
          event: {
            select: {
              title: true,
              date: true,
              venue: true,
            },
          },
          order: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!ticket) {
        throw new BadRequestException('Invalid ticket');
      }

      // 3. Verify QR code matches ticket
      if (ticket.qrCode !== qrCode) {
        throw new BadRequestException('QR code mismatch');
      }

      // 4. Check ticket status
      if (ticket.status === TicketStatus.SCANNED) {
        return {
          valid: false,
          message: 'Ticket already used',
          scannedAt: ticket.scannedAt,
          scannedBy: ticket.scannedBy,
          ticket,
        };
      }

      if (ticket.status === TicketStatus.CANCELLED) {
        return {
          valid: false,
          message: 'Ticket has been cancelled',
          ticket,
        };
      }

      if (ticket.status !== TicketStatus.ACTIVE) {
        return {
          valid: false,
          message: `Ticket is not active (status: ${ticket.status})`,
          ticket,
        };
      }

      /*
      // 5. Check event date (optional: prevent scanning too early)
      const eventDate = new Date(ticket.event.date);
      const now = new Date();
      const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilEvent > 24) {
        return {
          valid: false,
          message: 'Event is more than 24 hours away',
          ticket,
        };
      } */

      // 6. Mark ticket as scanned
      const updatedTicket = await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: TicketStatus.SCANNED,
          scannedAt: new Date(),
          scannedBy: operatorId,
        },
        include: {
          event: {
            select: {
              title: true,
              date: true,
              venue: true,
            },
          },
          order: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return {
        valid: true,
        message: 'Ticket validated successfully',
        ticket: updatedTicket,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid QR code format');
    }
  }

  // Get ticket by QR code (for preview before scanning)
  async getTicketByQR(qrCode: string) {
    try {
      const decoded = Buffer.from(qrCode, 'base64').toString('utf-8');
      const payload = JSON.parse(decoded);

      const ticket = await this.prisma.ticket.findUnique({
        where: { qrNonce: payload.nonce },
        include: {
          event: {
            select: {
              title: true,
              date: true,
              venue: true,
              address: true,
            },
          },
          order: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      return ticket;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid QR code');
    }
  }

  // ADMIN: Get all tickets
  async getAllTickets(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          event: {
            select: {
              title: true,
              date: true,
            },
          },
          order: {
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.ticket.count(),
    ]);

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ADMIN: Get event statistics
  async getEventStats(eventId: string) {
    const [totalTickets, scannedTickets, activeTickets, cancelledTickets] = await Promise.all([
      this.prisma.ticket.count({ where: { eventId } }),
      this.prisma.ticket.count({ where: { eventId, status: TicketStatus.SCANNED } }),
      this.prisma.ticket.count({ where: { eventId, status: TicketStatus.ACTIVE } }),
      this.prisma.ticket.count({ where: { eventId, status: TicketStatus.CANCELLED } }),
    ]);

    return {
      eventId,
      totalTickets,
      scannedTickets,
      activeTickets,
      cancelledTickets,
      scanRate: totalTickets > 0 ? (scannedTickets / totalTickets) * 100 : 0,
    };
  }
}