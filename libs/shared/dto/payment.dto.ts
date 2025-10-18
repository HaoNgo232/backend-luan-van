import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsPositive,
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
  @IsPositive()
  amount: number;
}

export class PaymentVerifyDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
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
