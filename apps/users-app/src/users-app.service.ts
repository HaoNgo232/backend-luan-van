import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersAppService {
  getHello(): string {
    return 'Hello World!';
  }
}
