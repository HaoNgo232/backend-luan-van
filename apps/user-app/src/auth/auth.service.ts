import { Injectable } from '@nestjs/common';
import {
  LoginDto,
  VerifyDto,
  RefreshDto,
} from '../../../../libs/shared/dto/auth.dto';

@Injectable()
export class AuthService {
  async login(dto: LoginDto) {}

  async verify(dto: VerifyDto) {}

  async refresh(dto: RefreshDto) {}
}
