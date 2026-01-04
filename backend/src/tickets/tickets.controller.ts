import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  // Get current user's tickets
  @Get('my-tickets')
  getMyTickets(@GetUser('id') userId: string) {
    return this.ticketsService.getUserTickets(userId);
  }

  // Get single ticket details
  @Get(':id')
  getTicket(@Param('id') ticketId: string, @GetUser('id') userId: string) {
    return this.ticketsService.getTicket(ticketId, userId);
  }

  // Preview ticket by QR (before scanning)
  @Post('preview')
  previewTicket(@Body() dto: ValidateTicketDto) {
    return this.ticketsService.getTicketByQR(dto.qrCode);
  }

  // Validate/Scan QR code (OPERATOR)
  @Post('validate')
  validateTicket(
    @Body() dto: ValidateTicketDto,
    @GetUser('id') operatorId: string,
  ) {
    return this.ticketsService.validateQRCode(dto.qrCode, operatorId);
  }

  // ADMIN: Get all tickets
  @Get()
  getAllTickets(@Query() pagination: PaginationDto) {
    return this.ticketsService.getAllTickets(pagination.page, pagination.limit);
  }

  // ADMIN: Get event statistics
  @Get('stats/:eventId')
  getEventStats(@Param('eventId') eventId: string) {
    return this.ticketsService.getEventStats(eventId);
  }
}