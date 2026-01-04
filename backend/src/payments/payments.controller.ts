import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // Create payment preference (get checkout link)
  @Post('create-preference')
  @UseGuards(JwtAuthGuard)
  createPreference(@Body() dto: CreatePaymentDto, @GetUser('id') userId: string) {
    return this.paymentsService.createPreference(dto.orderId, userId);
  }

  // mercadopago webhook (PUBLIC - no auth)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }

  // Get payment status
  @Get(':orderId')
  @UseGuards(JwtAuthGuard)
  getPaymentStatus(@Param('orderId') orderId: string, @GetUser('id') userId: string) {
    return this.paymentsService.getPaymentStatus(orderId, userId);
  }
}