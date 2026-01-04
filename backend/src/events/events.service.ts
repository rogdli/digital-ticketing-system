import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventStatus } from '../types/prisma-enums';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        venue: dto.venue,
        address: dto.address,
        date: new Date(dto.date),
        totalTickets: dto.totalTickets,
        availableTickets: dto.totalTickets,
        price: dto.price,
        status: (dto.status as any) || EventStatus.DRAFT,
      },
    });

    return event;
  }

  async findAll(page: number = 1, limit: number = 10, status?: EventStatus) {
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: events,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPublished(page: number = 1, limit: number = 10) {
    return this.findAll(page, limit, EventStatus.PUBLISHED);
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tickets: true,
            orders: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.findOne(id);

    const updateData: any = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.venue !== undefined) updateData.venue = dto.venue;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.date !== undefined) updateData.date = new Date(dto.date);
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.status !== undefined) updateData.status = dto.status;

    if (dto.totalTickets !== undefined) {
    const event = await this.prisma.event.findUnique({
        where: { id },
        select: { totalTickets: true, availableTickets: true },
    });

    if (!event) {
        throw new NotFoundException('Event not found');
    }

  const soldTickets = event.totalTickets - event.availableTickets;

      if (dto.totalTickets < soldTickets) {
        throw new ForbiddenException(
          `Cannot reduce total tickets below ${soldTickets} (already sold)`,
        );
      }

      updateData.totalTickets = dto.totalTickets;
      updateData.availableTickets = dto.totalTickets - soldTickets;
    }

    return this.prisma.event.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    await this.findOne(id);

    const soldTicketsCount = await this.prisma.ticket.count({
      where: { eventId: id },
    });

    if (soldTicketsCount > 0) {
      throw new ForbiddenException(
        'Cannot delete event with sold tickets. Cancel the event instead.',
      );
    }

    await this.prisma.event.delete({
      where: { id },
    });

    return { message: 'Event deleted successfully' };
  }

  async publish(id: string) {
    await this.findOne(id);

    return this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.PUBLISHED },
    });
  }

  async cancel(id: string) {
    await this.findOne(id);

    return this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.CANCELLED },
    });
  }
}