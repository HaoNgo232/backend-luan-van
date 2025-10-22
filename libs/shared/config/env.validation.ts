/**
 * Environment Variable Validation
 * Ensures all required env vars are present before app starts
 */
export function validateEnvironment(): void {
  const requiredEnvVars = [
    'NATS_URL',
    'JWT_SECRET_KEY',
    'DATABASE_URL_USER',
    'DATABASE_URL_PRODUCT',
    'DATABASE_URL_CART',
    'DATABASE_URL_ORDER',
    'DATABASE_URL_PAYMENT',
    'DATABASE_URL_AR',
    'DATABASE_URL_REPORT',
  ];

  const missingVars = requiredEnvVars.filter(key => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n\nPlease check your .env file.`,
    );
  }

  // Validate JWT secret strength (minimum 32 characters)
  const jwtSecret = process.env.JWT_SECRET_KEY || '';
  if (jwtSecret.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET_KEY should be at least 32 characters for security');
  }

  console.log(' Environment variables validated successfully');
}

/**
 * Get database URL for specific service
 */
export function getDatabaseUrl(
  service: 'user' | 'product' | 'cart' | 'order' | 'payment' | 'ar' | 'report',
): string {
  const envKey = `DATABASE_URL_${service.toUpperCase()}`;
  const url = process.env[envKey];

  if (!url) {
    throw new Error(`Database URL not found for service: ${service}`);
  }

  return url;
}
