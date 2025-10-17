import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
// import * as request from 'supertest';
import { CartAppModule } from './../src/cart-app.module';

describe('CartAppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CartAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
});
