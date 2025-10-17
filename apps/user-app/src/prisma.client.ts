import { PrismaClient } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_USER,
    },
  },
});
