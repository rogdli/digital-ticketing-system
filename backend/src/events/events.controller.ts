import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  // PUBLIC: Get published events
  @Get('published')
  getPublishedEvents(@Query() pagination: PaginationDto) {
    return this.eventsService.findPublished(pagination.page, pagination.limit);
  }

  // PUBLIC: Get single event details
  @Get(':id')
  getEvent(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  // ADMIN: Create event (for now, any authenticated user can create)
  @Post()
  @UseGuards(JwtAuthGuard)
  createEvent(@Body() dto: CreateEventDto, @GetUser('id') userId: string) {
    return this.eventsService.create(dto);
  }

  // ADMIN: Get all events (including drafts)
  @Get()
  @UseGuards(JwtAuthGuard)
  getAllEvents(@Query() pagination: PaginationDto) {
    return this.eventsService.findAll(pagination.page, pagination.limit);
  }

  // ADMIN: Update event
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateEvent(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  // ADMIN: Publish event
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  publishEvent(@Param('id') id: string) {
    return this.eventsService.publish(id);
  }

  // ADMIN: Cancel event
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancelEvent(@Param('id') id: string) {
    return this.eventsService.cancel(id);
  }

  // ADMIN: Delete event
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteEvent(@Param('id') id: string) {
    return this.eventsService.delete(id);
  }
}