import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
} from 'class-validator';

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
