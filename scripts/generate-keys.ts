#!/usr/bin/env tsx
/**
 * RSA Key Pair Generation Script
 *
 * Generates RSA-2048 key pair for JWT signing and verification.
 * Keys are exported as PEM format and base64-encoded for storage in environment variables.
 *
 * Usage:
 *   pnpm run generate:keys
 *
 * Output:
 *   - Prints base64-encoded private and public keys
 *   - Copy output to .env file
 */

import * as jose from 'jose';

async function main() {
  console.log('🔑 Generating RSA key pair for JWT...\n');

  try {
    // Generate RSA-2048 key pair for RS256 algorithm
    const { publicKey, privateKey } = await jose.generateKeyPair('RS256', {
      modulusLength: 2048,
      extractable: true,
    });

    console.log('✅ Key pair generated successfully!\n');

    // Export keys to PEM format
    console.log('📝 Exporting keys to PEM format...\n');
    const publicKeyPEM = await jose.exportSPKI(publicKey);
    const privateKeyPEM = await jose.exportPKCS8(privateKey);

    // Base64 encode for environment variables
    const publicKeyBase64 = Buffer.from(publicKeyPEM).toString('base64');
    const privateKeyBase64 = Buffer.from(privateKeyPEM).toString('base64');

    // Output instructions
    console.log('='.repeat(80));
    console.log('📋 COPY THE FOLLOWING TO YOUR .env FILE:');
    console.log('='.repeat(80));
    console.log('');
    console.log('# JWT Configuration');
    console.log('JWT_ALGORITHM=RS256');
    console.log('JWT_EXPIRES_IN=15m');
    console.log('JWT_REFRESH_EXPIRES_IN=7d');
    console.log('');
    console.log('# RSA Keys (Base64-encoded PEM format)');
    console.log('# For user-app: needs BOTH private and public keys');
    console.log(`JWT_PRIVATE_KEY_BASE64="${privateKeyBase64}"`);
    console.log(`JWT_PUBLIC_KEY_BASE64="${publicKeyBase64}"`);
    console.log('');
    console.log('# For other services: only public key needed');
    console.log(`# JWT_PUBLIC_KEY_BASE64="${publicKeyBase64}"`);
    console.log('');
    console.log('='.repeat(80));
    console.log('');
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('  - Keep JWT_PRIVATE_KEY_BASE64 secret (only in user-app)');
    console.log('  - Public key can be shared (used for verification)');
    console.log('  - Make sure .env is in .gitignore');
    console.log('  - For production, use secure secrets management');
    console.log('');
    console.log('✅ Key generation complete!');
  } catch (error) {
    console.error('❌ Error generating keys:', error);
    process.exit(1);
  }
}

main();
