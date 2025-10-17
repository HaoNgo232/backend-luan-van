import { Controller, Get } from '@nestjs/common';
import { UsersAppService } from './users-app.service';

@Controller()
export class UsersAppController {
  constructor(private readonly usersAppService: UsersAppService) {}

  @Get()
  getHello(): string {
    return this.usersAppService.getHello();
  }
}
