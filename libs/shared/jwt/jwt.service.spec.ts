import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from './jwt.service';
import * as jose from 'jose';

describe('JwtService', () => {
  let service: JwtService;
  let publicKey: jose.KeyLike;
  let privateKey: jose.KeyLike;

  beforeAll(async () => {
    // Generate test RSA keys
    const keyPair = await jose.generateKeyPair('RS256', {
      modulusLength: 2048,
    });
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;

    // Export to PEM format
    const publicKeyPEM = await jose.exportSPKI(publicKey);
    const privateKeyPEM = await jose.exportPKCS8(privateKey);

    // Base64 encode for environment variables
    process.env.JWT_PUBLIC_KEY_BASE64 = Buffer.from(publicKeyPEM).toString('base64');
    process.env.JWT_PRIVATE_KEY_BASE64 = Buffer.from(privateKeyPEM).toString('base64');
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtService],
    }).compile();

    service = module.get<JwtService>(JwtService);
    await service.onModuleInit();
  });

  afterAll(() => {
    // Clean up environment variables
    delete process.env.JWT_PUBLIC_KEY_BASE64;
    delete process.env.JWT_PRIVATE_KEY_BASE64;
  });

  describe('Module Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should load keys successfully on init', async () => {
      expect(service.canVerifyTokens()).toBe(true);
      expect(service.canSignTokens()).toBe(true);
    });

    it('should throw error if public key is missing', async () => {
      const publicKeyBackup = process.env.JWT_PUBLIC_KEY_BASE64;
      delete process.env.JWT_PUBLIC_KEY_BASE64;

      const testService = new JwtService();

      await expect(testService.onModuleInit()).rejects.toThrow('JWT key initialization failed');

      process.env.JWT_PUBLIC_KEY_BASE64 = publicKeyBackup;
    });

    it('should work without private key (verification-only mode)', async () => {
      const privateKeyBackup = process.env.JWT_PRIVATE_KEY_BASE64;
      delete process.env.JWT_PRIVATE_KEY_BASE64;

      const testService = new JwtService();
      await testService.onModuleInit();

      expect(testService.canVerifyTokens()).toBe(true);
      expect(testService.canSignTokens()).toBe(false);

      process.env.JWT_PRIVATE_KEY_BASE64 = privateKeyBackup;
    });
  });

  describe('Token Signing', () => {
    const testPayload = {
      sub: 'test-user-123',
      email: 'test@example.com',
      role: 'CUSTOMER',
    };

    it('should sign a valid JWT token', async () => {
      const token = await service.signToken(testPayload, 900);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should sign token with correct expiration', async () => {
      const expiresIn = 60; // 1 minute
      const token = await service.signToken(testPayload, expiresIn);

      const decoded = jose.decodeJwt(token);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();

      // exp should be approximately iat + expiresIn
      const expectedExp = decoded.iat! + expiresIn;
      expect(decoded.exp).toBeCloseTo(expectedExp, 0);
    });

    it('should include standard JWT claims', async () => {
      const token = await service.signToken(testPayload, 900);
      const decoded = jose.decodeJwt(token);

      expect(decoded.sub).toBe(testPayload.sub); // subject = userId
      expect(decoded.iss).toBe('luan-van-ecommerce'); // issuer
      expect(decoded.iat).toBeDefined(); // issued at
      expect(decoded.exp).toBeDefined(); // expiration
    });

    it('should include custom payload fields', async () => {
      const token = await service.signToken(testPayload, 900);
      const decoded = jose.decodeJwt(token);

      expect(decoded.sub).toBe(testPayload.sub);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should throw error if private key not loaded', async () => {
      const privateKeyBackup = process.env.JWT_PRIVATE_KEY_BASE64;
      delete process.env.JWT_PRIVATE_KEY_BASE64;

      const testService = new JwtService();
      await testService.onModuleInit();

      const payload = { sub: 'test-123', email: 'test@example.com', role: 'USER' };
      await expect(testService.signToken(payload, 900)).rejects.toThrow(
        'Cannot sign token: Private key not loaded',
      );

      process.env.JWT_PRIVATE_KEY_BASE64 = privateKeyBackup;
    });
  });

  describe('Token Verification', () => {
    const testPayload = {
      sub: 'test-user-456',
      email: 'verify@example.com',
      role: 'ADMIN',
    };

    it('should verify a valid token', async () => {
      const token = await service.signToken(testPayload, 900);
      const verified = await service.verifyToken(token);

      expect(verified).toBeDefined();
      expect(verified.sub).toBe(testPayload.sub);
      expect(verified.email).toBe(testPayload.email);
      expect(verified.role).toBe(testPayload.role);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      // Create a token that expires immediately
      const token = await service.signToken(testPayload, -10); // negative = already expired

      await expect(service.verifyToken(token)).rejects.toThrow(UnauthorizedException);

      await expect(service.verifyToken(token)).rejects.toThrow('Token has expired');
    });

    it('should throw UnauthorizedException for invalid signature', async () => {
      const token = await service.signToken(testPayload, 900);

      // Tamper with the token signature (change multiple characters in signature part)
      const parts = token.split('.');
      const tamperedSignature = parts[2].slice(0, -10) + 'XXXXXXXXXX';
      const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

      await expect(service.verifyToken(tamperedToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for malformed token', async () => {
      const malformedToken = 'not.a.valid.jwt.token';

      await expect(service.verifyToken(malformedToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for token with wrong issuer', async () => {
      // Create token with different issuer
      const wrongIssuerToken = await new jose.SignJWT({ ...testPayload })
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt()
        .setIssuer('wrong-issuer') // Different issuer
        .setExpirationTime('15m')
        .setSubject(testPayload.sub)
        .sign(privateKey);

      await expect(service.verifyToken(wrongIssuerToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should validate token structure', async () => {
      const token = await service.signToken(testPayload, 900);
      const verified = await service.verifyToken(token);

      // Standard JWT claims
      expect(verified.iat).toBeDefined();
      expect(verified.exp).toBeDefined();
      expect(verified.iss).toBe('luan-van-ecommerce');
      expect(verified.sub).toBe(testPayload.sub);

      // Custom payload
      expect(verified.sub).toBeDefined();
      expect(verified.email).toBeDefined();
      expect(verified.role).toBeDefined();
    });
  });

  describe('Token Decoding (without verification)', () => {
    const testPayload = {
      sub: 'decode-test-789',
      email: 'decode@example.com',
      role: 'CUSTOMER',
    };

    it('should decode valid token without verification', async () => {
      const token = await service.signToken(testPayload, 900);
      const { payload, header } = service.decodeToken(token);

      expect(payload).toBeDefined();
      expect(header).toBeDefined();

      expect(payload.sub).toBe(testPayload.sub);
      expect(payload.email).toBe(testPayload.email);
      expect(header.alg).toBe('RS256');
    });

    it('should decode expired token (no verification)', async () => {
      const token = await service.signToken(testPayload, -10);

      // Decode should work even for expired tokens
      const { payload } = service.decodeToken(token);
      expect(payload.sub).toBe(testPayload.sub);
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-valid-token';

      expect(() => service.decodeToken(malformedToken)).toThrow(UnauthorizedException);
    });

    it('should decode token header correctly', async () => {
      const token = await service.signToken(testPayload, 900);
      const { header } = service.decodeToken(token);

      expect(header.alg).toBe('RS256');
      expect(header.typ).toBeUndefined(); // jose might not include typ
    });
  });

  describe('Key Capability Checks', () => {
    it('should report signing capability when private key loaded', () => {
      expect(service.canSignTokens()).toBe(true);
    });

    it('should report verification capability when public key loaded', () => {
      expect(service.canVerifyTokens()).toBe(true);
    });

    it('should report no signing capability without private key', async () => {
      const privateKeyBackup = process.env.JWT_PRIVATE_KEY_BASE64;
      delete process.env.JWT_PRIVATE_KEY_BASE64;

      const testService = new JwtService();
      await testService.onModuleInit();

      expect(testService.canSignTokens()).toBe(false);
      expect(testService.canVerifyTokens()).toBe(true);

      process.env.JWT_PRIVATE_KEY_BASE64 = privateKeyBackup;
    });
  });

  describe('Integration: Sign and Verify Flow', () => {
    it('should successfully complete full JWT lifecycle', async () => {
      const payload = {
        sub: 'lifecycle-user-001',
        email: 'lifecycle@example.com',
        role: 'CUSTOMER',
      };

      // 1. Sign token
      const token = await service.signToken(payload, 3600);
      expect(token).toBeDefined();

      // 2. Verify token
      const verified = await service.verifyToken(token);
      expect(verified.sub).toBe(payload.sub);
      expect(verified.email).toBe(payload.email);
      expect(verified.role).toBe(payload.role);

      // 3. Decode token (debug)
      const { payload: decoded, header } = service.decodeToken(token);
      expect(decoded.sub).toBe(payload.sub);
      expect(header.alg).toBe('RS256');
    });

    it('should handle multiple concurrent token operations', async () => {
      const payloads = Array.from({ length: 10 }, (_, i) => ({
        sub: `concurrent-user-${i}`,
        email: `user${i}@example.com`,
        role: 'CUSTOMER',
      }));

      // Sign multiple tokens concurrently
      const tokens = await Promise.all(payloads.map(p => service.signToken(p, 900)));

      expect(tokens).toHaveLength(10);
      expect(tokens.every(t => typeof t === 'string')).toBe(true);

      // Verify all tokens concurrently
      const verifiedPayloads = await Promise.all(tokens.map(t => service.verifyToken(t)));

      expect(verifiedPayloads).toHaveLength(10);
      verifiedPayloads.forEach((verified, index) => {
        expect(verified.sub).toBe(payloads[index].sub);
        expect(verified.email).toBe(payloads[index].email);
      });
    });
  });
});
