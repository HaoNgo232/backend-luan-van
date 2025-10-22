# Security Quick Reference - Developer Guide

> **TL;DR:** Chỉ Gateway check JWT. Microservices tin tưởng message từ NATS.

## 🚦 Authentication Flow

```
Client → Gateway (✅ AuthGuard) → NATS → Microservices (❌ No Guard)
```

## ✅ Khi Nào Dùng Guard?

### Gateway Controllers

**PHẢI dùng `@UseGuards(AuthGuard)` khi:**

- Endpoint yêu cầu user đã đăng nhập
- Cần biết userId của người gọi
- Thao tác với dữ liệu cá nhân

```typescript
// ✅ ĐÚNG
@Controller('users')
export class UsersController {
  @UseGuards(AuthGuard) // ✅ Protect endpoint
  @Get('profile')
  async getProfile(@Request() req) {
    const userId = req.userId; // Verified by guard
    return this.userClient.send(EVENTS.USER.FIND_ONE, { userId });
  }
}
```

**KHÔNG dùng guard khi:**

- Public endpoint (login, register, health check)
- Không cần authentication

```typescript
// ✅ ĐÚNG - Public endpoint
@Controller('auth')
export class AuthController {
  // ❌ KHÔNG dùng @UseGuards(AuthGuard)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authClient.send(EVENTS.AUTH.LOGIN, dto);
  }
}
```

### Microservice Controllers

**KHÔNG BAO GIỜ dùng guard:**

```typescript
// ✅ ĐÚNG - Microservice controller
@Controller()
export class UsersController {
  // ❌ KHÔNG dùng @UseGuards(AuthGuard)

  @MessagePattern(EVENTS.USER.FIND_ONE)
  async findOne(@Payload() payload: { userId: string }) {
    // Tin tưởng userId đã được Gateway verify
    return this.usersService.findOne(payload.userId);
  }
}
```

## 🔑 Accessing User Context

### Trong Gateway Controller

```typescript
@Controller('products')
export class ProductsController {
  @UseGuards(AuthGuard)
  @Post()
  async create(@Request() req, @Body() dto: CreateProductDto) {
    const userId = req.userId; // ✅ Available after AuthGuard

    return this.productClient.send(EVENTS.PRODUCT.CREATE, {
      ...dto,
      userId, // Pass to microservice
    });
  }
}
```

### Trong Microservice

```typescript
@MessagePattern(EVENTS.PRODUCT.CREATE)
async create(@Payload() payload: CreateProductDto & { userId: string }) {
  // userId đã được Gateway verify và pass vào
  return this.productsService.create(payload);
}
```

## 🛡️ Security Checklist

### Khi Tạo Gateway Endpoint

- [ ] Endpoint có cần authentication không?
- [ ] Nếu CÓ → Add `@UseGuards(AuthGuard)`
- [ ] Extract `userId` từ `req.userId`
- [ ] Pass `userId` vào message payload

### Khi Tạo Microservice Handler

- [ ] ❌ KHÔNG thêm `@UseGuards`
- [ ] Nhận `userId` từ payload (đã verify)
- [ ] Validate business logic (không cần verify JWT)

### Khi Truy Vấn Database

- [ ] ✅ Dùng explicit `select` (không expose sensitive fields)
- [ ] ❌ KHÔNG bao giờ select `passwordHash` trong API response

```typescript
// ✅ ĐÚNG
const user = await this.prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    // ❌ KHÔNG select passwordHash
  },
});

// ❌ SAI - Expose tất cả fields
const user = await this.prisma.user.findUnique({ where: { id } });
```

## 🚨 Common Mistakes

### ❌ Mistake 1: Thêm Guard vào Microservice

```typescript
// ❌ SAI - Microservice không cần guard
@Controller()
export class UsersController {
  @UseGuards(AuthGuard) // ❌ REMOVE THIS
  @MessagePattern(EVENTS.USER.FIND_ONE)
  async findOne(@Payload() payload) { ... }
}
```

### ❌ Mistake 2: Quên Guard ở Gateway

```typescript
// ❌ SAI - Gateway endpoint nhạy cảm thiếu guard
@Controller('users')
export class UsersController {
  @Get('profile') // ❌ Thiếu @UseGuards(AuthGuard)
  async getProfile(@Request() req) { ... }
}
```

### ❌ Mistake 3: Không Pass userId vào Microservice

```typescript
// ❌ SAI - Microservice không biết userId của ai
@UseGuards(AuthGuard)
@Post('products')
async create(@Body() dto: CreateProductDto) {
  return this.productClient.send(EVENTS.PRODUCT.CREATE, dto); // ❌ Thiếu userId
}

// ✅ ĐÚNG
@UseGuards(AuthGuard)
@Post('products')
async create(@Request() req, @Body() dto: CreateProductDto) {
  return this.productClient.send(EVENTS.PRODUCT.CREATE, {
    ...dto,
    userId: req.userId, // ✅ Pass userId
  });
}
```

## 📋 Code Templates

### Gateway Authenticated Endpoint

```typescript
import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

@Controller('resource')
export class ResourceController {
  @UseGuards(AuthGuard) // ✅ Guard for authentication
  @Post()
  async create(@Request() req, @Body() dto: CreateDto) {
    return this.resourceClient.send(EVENTS.RESOURCE.CREATE, {
      ...dto,
      userId: req.userId, // ✅ Pass verified userId
    });
  }
}
```

### Microservice Handler

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EVENTS } from '@shared/events';

@Controller()
export class ResourceController {
  // ❌ NO @UseGuards here

  @MessagePattern(EVENTS.RESOURCE.CREATE)
  async create(@Payload() payload: CreateDto & { userId: string }) {
    // ✅ userId is already verified by Gateway
    return this.resourceService.create(payload);
  }
}
```

## 🔍 Debugging Tips

### Kiểm Tra JWT Token

```bash
# Decode JWT token (không verify signature)
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq
```

### Kiểm Tra Guard Có Chạy Không

```typescript
// Thêm log trong guard để debug
async canActivate(context: ExecutionContext): Promise<boolean> {
  console.log('[AuthGuard] Checking authentication...');
  // ... guard logic
}
```

### Kiểm Tra userId Có Được Pass Không

```typescript
// Trong microservice handler
@MessagePattern(EVENTS.USER.FIND_ONE)
async findOne(@Payload() payload: any) {
  console.log('[Handler] Received payload:', payload);
  // Kiểm tra có userId không
}
```

## 📚 Related Documentation

- [Full Security Architecture](./SECURITY-ARCHITECTURE.md) - Chi tiết về mô hình bảo mật
- [JWT Implementation](../../libs/shared/jwt/README.md) - Cách JWT hoạt động
- [Testing Authentication](../testing/AUTH-TESTING.md) - Test authentication flow

## ❓ FAQ

**Q: Tại sao microservices không có guard?**  
A: Vì Gateway đã verify JWT rồi. NATS là mạng nội bộ tin cậy.

**Q: Làm sao biết endpoint nào cần guard?**  
A: Nếu endpoint cần biết "user nào đang gọi" → cần guard.

**Q: userId lấy từ đâu?**  
A: Gateway's AuthGuard extract từ JWT và gắn vào `req.userId`.

**Q: Có thể tự tạo userId trong microservice không?**  
A: ❌ KHÔNG. Luôn nhận userId từ payload (đã verify bởi Gateway).

---

**Remember:** Gateway = Gác cổng. Microservices = Tin tưởng. 🛡️
