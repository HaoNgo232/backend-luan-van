module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  rootDir: './',
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/libs/shared/$1',
    '^@gateway/(.*)$': '<rootDir>/apps/gateway/src/$1',
    '^@user-app/(.*)$': '<rootDir>/apps/user-app/src/$1',
    '^@product-app/(.*)$': '<rootDir>/apps/product-app/src/$1',
    '^@cart-app/(.*)$': '<rootDir>/apps/cart-app/src/$1',
    '^@order-app/(.*)$': '<rootDir>/apps/order-app/src/$1',
    '^@payment-app/(.*)$': '<rootDir>/apps/payment-app/src/$1',
    '^@ar-app/(.*)$': '<rootDir>/apps/ar-app/src/$1',
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
};
