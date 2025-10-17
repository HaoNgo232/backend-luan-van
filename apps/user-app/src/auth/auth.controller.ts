import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from '@user-app/auth/auth.service';
import { EVENTS } from '@shared/events';
import { LoginDto, VerifyDto, RefreshDto } from '@shared/dto/auth.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(EVENTS.AUTH.LOGIN)
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern(EVENTS.AUTH.VERIFY)
  verify(@Payload() dto: VerifyDto) {
    return this.authService.verify(dto);
  }

  @MessagePattern(EVENTS.AUTH.REFRESH)
  refresh(@Payload() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }
}
