import { IsNotEmpty, IsString, IsOptional, IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CartGetDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;
}

export class CartAddItemDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsPositive()
  quantity?: number;
}

export class CartRemoveItemDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsNotEmpty()
  @IsString()
  itemId: string;
}

export class CartClearDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;
}

export class CartTransferToUserDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}
