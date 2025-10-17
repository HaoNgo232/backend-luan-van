import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
// import * as request from 'supertest';
import { ProductAppModule } from './../src/product-app.module';

describe('ProductAppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProductAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
});
