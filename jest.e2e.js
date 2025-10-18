const sharedConfig = require('./jest.config');

module.exports = {
  ...sharedConfig,
  displayName: 'e2e',
  testRegex: '.e2e-spec.ts$',
  testTimeout: 30000,
  maxWorkers: 1,
  coverageDirectory: 'coverage/e2e',
  collectCoverageFrom: [
    'apps/**/src/**/*.controller.ts',
    'apps/**/src/**/*.module.ts',
    '!**/node_modules/**',
    '!**/generated/**',
  ],
};
