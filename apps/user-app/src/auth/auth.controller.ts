import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from '@user-app/auth/auth.service';
import { EVENTS } from '@shared/events';
import { LoginDto, VerifyDto, RefreshDto } from '@shared/dto/auth.dto';
import { AuthTokens, JwtPayload } from '@shared/main';

export interface IAuthController {
  login(dto: LoginDto): Promise<AuthTokens & { user: object }>;
  verify(dto: VerifyDto): Promise<JwtPayload>;
  refresh(dto: RefreshDto): Promise<AuthTokens>;
}

@Controller()
export class AuthController implements IAuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(EVENTS.AUTH.LOGIN)
  login(@Payload() dto: LoginDto): Promise<AuthTokens & { user: object }> {
    return this.authService.login(dto);
  }

  @MessagePattern(EVENTS.AUTH.VERIFY)
  verify(@Payload() dto: VerifyDto): Promise<JwtPayload> {
    return this.authService.verify(dto);
  }

  @MessagePattern(EVENTS.AUTH.REFRESH)
  refresh(@Payload() dto: RefreshDto): Promise<AuthTokens> {
    return this.authService.refresh(dto);
  }
}
