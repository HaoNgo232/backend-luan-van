import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsPositive,
  IsObject,
} from 'class-validator';

export enum PaymentMethod {
  COD = 'COD',
  SePay = 'SePay',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export class PaymentProcessDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  method: 'COD' | 'SePay';

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  amount: number;
}

export class PaymentVerifyDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsObject()
  payload: Record<string, unknown>;
}

export class PaymentIdDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class PaymentByOrderDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;
}
