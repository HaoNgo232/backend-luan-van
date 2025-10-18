import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
}

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(['ADMIN', 'CUSTOMER'])
  role?: 'ADMIN' | 'CUSTOMER';
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: 'ADMIN' | 'CUSTOMER';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListUsersDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  pageSize?: number;

  @IsOptional()
  @IsString()
  q?: string;
}
