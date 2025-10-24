import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class RegisterDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;
}

export class VerifyDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class RefreshDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
