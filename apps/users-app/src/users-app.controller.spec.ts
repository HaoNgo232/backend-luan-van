import { Test, TestingModule } from '@nestjs/testing';
import { UsersAppController } from './users-app.controller';
import { UsersAppService } from './users-app.service';

describe('UsersAppController', () => {
  let usersAppController: UsersAppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UsersAppController],
      providers: [UsersAppService],
    }).compile();

    usersAppController = app.get<UsersAppController>(UsersAppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(usersAppController.getHello()).toBe('Hello World!');
    });
  });
});
