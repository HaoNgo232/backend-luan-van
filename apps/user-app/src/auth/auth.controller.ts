import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from '@user-app/auth/auth.service';
import { EVENTS } from '@shared/events';
import { LoginDto, VerifyDto, RefreshDto, RegisterDto } from '@shared/dto/auth.dto';
import { AuthTokens } from '@shared/main';
import { JWTPayload } from 'jose';

export interface IAuthController {
  login(dto: LoginDto): Promise<AuthTokens & { user: object }>;
  register(dto: RegisterDto): Promise<AuthTokens & { user: object }>;
  verify(dto: VerifyDto): Promise<JWTPayload>;
  refresh(dto: RefreshDto): Promise<{ accessToken: string; refreshToken: string }>;
}

@Controller()
export class AuthController implements IAuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(EVENTS.AUTH.LOGIN)
  login(@Payload() dto: LoginDto): Promise<AuthTokens & { user: object }> {
    return this.authService.login(dto);
  }

  @MessagePattern(EVENTS.AUTH.REGISTER)
  register(@Payload() dto: RegisterDto): Promise<AuthTokens & { user: object }> {
    return this.authService.register(dto);
  }

  @MessagePattern(EVENTS.AUTH.VERIFY)
  verify(@Payload() dto: VerifyDto): Promise<JWTPayload> {
    return this.authService.verify(dto);
  }

  @MessagePattern(EVENTS.AUTH.REFRESH)
  refresh(@Payload() dto: RefreshDto): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refresh(dto);
  }
}
