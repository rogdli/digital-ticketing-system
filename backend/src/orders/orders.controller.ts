import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // Create a new order (initiate purchase)
  @Post()
  createOrder(@Body() dto: CreateOrderDto, @GetUser('id') userId: string) {
    return this.ordersService.create(userId, dto);
  }

  // Get current user's orders
  @Get('my-orders')
  getMyOrders(@GetUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.ordersService.findUserOrders(userId, pagination.page, pagination.limit);
  }

  // Get single order details
  @Get(':id')
  getOrder(@Param('id') orderId: string, @GetUser('id') userId: string) {
    return this.ordersService.findOne(orderId, userId);
  }

  // Cancel order (return tickets to inventory)
  @Delete(':id')
  cancelOrder(@Param('id') orderId: string, @GetUser('id') userId: string) {
    return this.ordersService.cancelOrder(orderId, userId);
  }

  // ADMIN: Get all orders
  @Get()
  getAllOrders(@Query() pagination: PaginationDto) {
    return this.ordersService.findAll(pagination.page, pagination.limit);
  }
}