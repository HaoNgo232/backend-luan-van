import { Injectable } from '@nestjs/common';
import { LoginDto, VerifyDto, RefreshDto } from '@shared/dto/auth.dto';

@Injectable()
export class AuthService {
  async login(_dto: LoginDto) {}

  async verify(_dto: VerifyDto) {}

  async refresh(_dto: RefreshDto) {}
}
