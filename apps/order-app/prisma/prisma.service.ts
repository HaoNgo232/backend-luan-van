import { INestMicroservice, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from './generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestMicroservice): Promise<void> {
    this.$on('beforeExit' as never, () => {
      void app.close();
    });
    return Promise.resolve();
  }
}
