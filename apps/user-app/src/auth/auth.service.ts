import { Injectable } from '@nestjs/common';
import { LoginDto, VerifyDto, RefreshDto } from '@shared/dto/auth.dto';

@Injectable()
export class AuthService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async login(_dto: LoginDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verify(_dto: VerifyDto) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async refresh(_dto: RefreshDto) {}
}
