// Load test environment variables before running tests
require('dotenv').config({ path: '.env.test' });

module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  rootDir: './',
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/libs/shared/$1',

    // Gateway
    '^@gateway/(.*)$': '<rootDir>/apps/gateway/src/$1',

    // User App
    '^@user-app/prisma/(.*)$': '<rootDir>/apps/user-app/prisma/$1',
    '^@user-app/(.*)$': '<rootDir>/apps/user-app/src/$1',

    // Product App
    '^@product-app/prisma/(.*)$': '<rootDir>/apps/product-app/prisma/$1',
    '^@product-app/(.*)$': '<rootDir>/apps/product-app/src/$1',

    // Cart App
    '^@cart-app/prisma/(.*)$': '<rootDir>/apps/cart-app/prisma/$1',
    '^@cart-app/(.*)$': '<rootDir>/apps/cart-app/src/$1',

    // Order App
    '^@order-app/prisma/(.*)$': '<rootDir>/apps/order-app/prisma/$1',
    '^@order-app/(.*)$': '<rootDir>/apps/order-app/src/$1',

    // Payment App
    '^@payment-app/prisma/(.*)$': '<rootDir>/apps/payment-app/prisma/$1',
    '^@payment-app/(.*)$': '<rootDir>/apps/payment-app/src/$1',

    // AR App
    '^@ar-app/prisma/(.*)$': '<rootDir>/apps/ar-app/prisma/$1',
    '^@ar-app/(.*)$': '<rootDir>/apps/ar-app/src/$1',

    // Report App
    '^@report-app/prisma/(.*)$': '<rootDir>/apps/report-app/prisma/$1',
    '^@report-app/(.*)$': '<rootDir>/apps/report-app/src/$1',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/dist',
    '<rootDir>/node_modules',
    'generated/',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/(coverage|dist|lib|tmp)/',
  ],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};
