# JWT Key Management Guide

## Overview

Dự án sử dụng RSA asymmetric cryptography để ký và verify JWT tokens:

- **Private Key**: Chỉ user-app sử dụng để ký tokens
- **Public Key**: Tất cả services sử dụng để verify tokens

## Tạo Keys Mới

### Development

```bash
pnpm run generate:keys
```

Script sẽ tạo 2 files trong `keys/` directory:

- `keys/private-key.pem` - RSA private key (2048-bit)
- `keys/public-key.pem` - RSA public key

**⚠️ SECURITY**: `keys/` directory đã được thêm vào `.gitignore`. KHÔNG commit private key vào Git!

### Production

Trong production, sử dụng secrets management:

**AWS Secrets Manager Example:**

```bash
# Upload private key (user-app only)
aws secretsmanager create-secret \
  --name jwt-private-key \
  --secret-string file://keys/private-key.pem

# Upload public key (all services)
aws secretsmanager create-secret \
  --name jwt-public-key \
  --secret-string file://keys/public-key.pem
```

**Kubernetes Secret Example:**

```bash
kubectl create secret generic jwt-keys \
  --from-file=private-key.pem=keys/private-key.pem \
  --from-file=public-key.pem=keys/public-key.pem
```

## Cấu trúc Keys Directory

```
keys/
├── private-key.pem    # RSA private key - KEEP SECRET!
└── public-key.pem     # RSA public key - can be shared
```

## Services Configuration

### User-app (Authentication Service)

Cần **CẢ private và public key** để:

- Sign access tokens
- Sign refresh tokens
- Verify tokens

### Other Services (Gateway, Product-app, etc.)

Chỉ cần **public key** để:

- Verify access tokens từ users

## Key Loading

JwtService tự động load keys từ `keys/` directory khi khởi động:

```typescript
// libs/shared/jwt/jwt.service.ts
async onModuleInit() {
  await this.loadKeys(); // Load từ keys/private-key.pem và keys/public-key.pem
}
```

**Fallback behavior:**

- Nếu `public-key.pem` missing → Service crash (required)
- Nếu `private-key.pem` missing → Verification-only mode (OK cho non-auth services)

## Docker Deployment

### Development

```yaml
# docker-compose.yml
services:
  user-app:
    volumes:
      - ./keys:/app/keys:ro # Mount keys as read-only
```

### Production

```yaml
# docker-compose.prod.yml
services:
  user-app:
    volumes:
      - /var/secrets/jwt-keys:/app/keys:ro # Mount from secure location
```

## Key Rotation

Để rotate keys (recommended mỗi 6-12 tháng):

1. Generate new keys:

   ```bash
   pnpm run generate:keys
   mv keys/private-key.pem keys/private-key-new.pem
   mv keys/public-key.pem keys/public-key-new.pem
   ```

2. Keep old public key để verify existing tokens:

   ```bash
   mv keys/public-key-old.pem keys/public-key-old.pem
   ```

3. Update services dần dần với strategy:
   - Deploy new public keys to all services first
   - Wait for old tokens to expire (15 minutes)
   - Deploy new private key to user-app
   - Remove old keys after verification

## Troubleshooting

### Error: "JWT key initialization failed"

**Nguyên nhân:** `keys/public-key.pem` không tồn tại

**Giải pháp:**

```bash
pnpm run generate:keys
```

### Error: "Private key not found (verification-only mode)"

**Nguyên nhân:** Service không có `keys/private-key.pem`

**Giải pháp:**

- Nếu service là user-app → Copy private-key.pem vào keys/
- Nếu service khác → Ignore log này (verification-only OK)

### Keys bị commit vào Git

**Giải pháp:**

```bash
# Remove from git history
git rm --cached -r keys/
git commit -m "Remove sensitive keys"

# Regenerate keys
pnpm run generate:keys
```

## Security Best Practices

1. ✅ **NEVER commit private key** vào Git
2. ✅ **Rotate keys periodically** (mỗi 6-12 tháng)
3. ✅ **Use secrets management** trong production (AWS KMS, HashiCorp Vault, etc.)
4. ✅ **Limit private key access** chỉ user-app
5. ✅ **Monitor key usage** và audit logs
6. ✅ **Backup keys securely** với encryption
7. ✅ **Use read-only mounts** trong Docker
8. ✅ **Set proper file permissions**:
   ```bash
   chmod 600 keys/private-key.pem  # Only owner can read/write
   chmod 644 keys/public-key.pem    # Everyone can read
   ```

## Migration từ Environment Variables

Nếu project cũ sử dụng environment variables:

**Old way:**

```bash
JWT_PRIVATE_KEY_BASE64="..."
JWT_PUBLIC_KEY_BASE64="..."
```

**New way:**

1. Run `pnpm run generate:keys`
2. Remove JWT\_\*\_KEY_BASE64 từ .env files
3. Restart services (auto-load từ files)

## References

- [jose library documentation](https://github.com/panva/jose)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication)
