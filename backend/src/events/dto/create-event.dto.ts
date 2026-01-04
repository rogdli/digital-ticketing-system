import { IsString, IsNotEmpty, IsDateString, IsInt, Min, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus } from '../../types/prisma-enums';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsString()
  @IsNotEmpty()
  venue: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsDateString()
  date: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalTickets: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  price: number;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}