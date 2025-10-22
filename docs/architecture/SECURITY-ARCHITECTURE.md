# Security Architecture - Perimeter Security Model

## 📋 Tổng Quan

Hệ thống áp dụng mô hình **Perimeter Security** (bảo mật vòng ngoài) cho kiến trúc microservices.

## 🏗️ Kiến Trúc Bảo Mật

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP Request + JWT
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY                                │
│  ┌────────────────────────────────────────────────────┐     │
│  │          🛡️ AuthGuard (JWT Verification)          │     │
│  │   - Xác thực JWT bằng RSA Public Key              │     │
│  │   - Validate token structure & expiry              │     │
│  │   - Extract userId từ token payload                │     │
│  │   - Attach userId vào message headers              │     │
│  └────────────────────────────────────────────────────┘     │
│                  ✅ AUTHENTICATION LAYER                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ NATS Message + userId in headers
                      │ (Trusted Internal Network)
                      │
        ┌─────────────┴─────────────┬─────────────┬──────────┐
        │                           │             │          │
        ▼                           ▼             ▼          ▼
┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌───────────┐
│ User Service │  │Product Service│  │Cart Svc  │  │Order Svc  │
│              │  │               │  │          │  │           │
│ ⚙️ No Guard  │  │ ⚙️ No Guard   │  │⚙️ No Guard│ │⚙️ No Guard│
│              │  │               │  │          │  │           │
│ Tin tưởng    │  │ Tin tưởng     │  │Tin tưởng │  │Tin tưởng  │
│ Gateway      │  │ Gateway       │  │Gateway   │  │Gateway    │
└──────────────┘  └──────────────┘  └──────────┘  └───────────┘
```

## 🎯 Nguyên Tắc Thiết Kế

### 1. Single Point of Authentication (Điểm xác thực duy nhất)

**Gateway là "lính gác cổng" duy nhất:**

```typescript
// apps/gateway/src/auth/auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Xác thực JWT với RSA Public Key
    const token = this.extractToken(request);
    const payload = await this.jwtService.verifyToken(token);

    // Attach userId vào request để các controller sử dụng
    request.userId = payload.sub;
    return true;
  }
}
```

**Tất cả HTTP requests "nhạy cảm" đều được bảo vệ:**

```typescript
@Controller('users')
export class UsersController {
  @UseGuards(AuthGuard) // ✅ Gateway guard
  @Get('profile')
  async getProfile(@Request() req) {
    const userId = req.userId; // userId đã được verify
    return this.usersService.send(EVENTS.USER.FIND_ONE, { userId });
  }
}
```

### 2. Trusted Internal Network (Mạng nội bộ tin cậy)

**NATS message broker được coi là mạng nội bộ an toàn:**

- Chỉ các microservices trong hệ thống mới kết nối được NATS
- Gateway đã xác thực → message từ NATS = tin cậy
- Không cần xác thực lại ở từng microservice

**Microservices không có guard:**

```typescript
// apps/user-app/src/users/users.controller.ts
@Controller()
export class UsersController {
  // ❌ KHÔNG CÓ @UseGuards(AuthGuard)

  @MessagePattern(EVENTS.USER.FIND_ONE)
  async findOne(@Payload() payload: { userId: string }) {
    // Tin tưởng rằng userId đã được Gateway verify
    return this.usersService.findOne(payload.userId);
  }
}
```

### 3. Gateway Attaches User Context (Gateway gắn thông tin user)

**Flow xử lý:**

```typescript
// 1. Client gửi request với JWT
GET /users/profile
Authorization: Bearer eyJhbGc...

// 2. Gateway xác thực JWT
AuthGuard extracts & verifies JWT → userId = "123"

// 3. Gateway gửi message vào NATS với userId
this.userClient.send(EVENTS.USER.FIND_ONE, {
  userId: "123", // ✅ Đã verify bởi Gateway
  headers: {
    userId: "123",
    requestId: "uuid"
  }
})

// 4. Microservice nhận message và xử lý
// Không cần verify lại userId
async findOne(payload: { userId: string }) {
  return this.prisma.user.findUnique({ where: { id: payload.userId } });
}
```

## ✅ Ưu Điểm

### 1. Đơn Giản & Rõ Ràng

- Logic xác thực tập trung tại một điểm (Gateway)
- Microservices tập trung vào business logic
- Dễ hiểu, dễ maintain

### 2. Performance Cao

- Không có overhead xác thực JWT nhiều lần
- Giảm độ phức tạp trong microservices
- Latency thấp hơn (không double-check)

### 3. Phù Hợp Với Scope Luận Văn

- Thể hiện hiểu biết về kiến trúc microservices
- Không quá phức tạp (over-engineering)
- Focus vào communication patterns, không phải deep security

### 4. Clear Separation of Concerns

- Gateway: Routing + Authentication
- Microservices: Business logic
- NATS: Message transport

## ⚠️ Hạn Chế & Trade-offs

### 1. Single Point of Failure

**Vấn đề:**

- Nếu Gateway bị compromise (hack), toàn bộ hệ thống nguy hiểm
- Attacker có thể send message bất kỳ vào NATS

**Giải pháp trong production:**

- Implement rate limiting ở Gateway
- Add API Gateway redundancy (multiple instances)
- Monitor Gateway health & security events

### 2. Lateral Movement Risk

**Vấn đề:**

- Nếu 1 microservice bị hack, nó có thể gọi các service khác
- Ví dụ: `product-app` bị hack → gọi `EVENTS.USER.DEACTIVATE`

**Giải pháp trong production:**

- Implement service-to-service authentication (mTLS)
- Add network policies (Kubernetes Network Policies)
- Event authorization layer (kiểm tra service nào được gọi event gì)

### 3. Không Phải Zero Trust

**Vấn đề:**

- Không tuân theo nguyên tắc "Never trust, always verify"
- Microservices tin tưởng tuyệt đối vào message từ NATS

**Giải pháp trong production:**

- Implement Zero Trust với service mesh (Istio, Linkerd)
- Mỗi service tự verify JWT
- Add request signing để verify message origin

## 🎓 Tại Sao Chọn Mô Hình Này Cho Luận Văn?

### 1. **Phù Hợp Phạm Vi Luận Văn**

Luận văn tập trung vào:

- ✅ Kiến trúc microservices
- ✅ Communication patterns (NATS)
- ✅ Service design (SOLID principles)
- ✅ Testing strategies

**KHÔNG phải:**

- ❌ Production-grade security
- ❌ Enterprise authentication systems
- ❌ Advanced threat modeling

### 2. **Complexity vs Value Trade-off**

| Aspect         | Perimeter Security | Zero Trust     |
| -------------- | ------------------ | -------------- |
| Complexity     | Thấp ⭐            | Cao ⭐⭐⭐⭐⭐ |
| Impl. Time     | 1 tuần             | 1-2 tháng      |
| Code Lines     | ~200               | ~1000+         |
| Learning Curve | Dễ                 | Khó            |
| Thesis Value   | ✅ Đủ              | ⚠️ Overkill    |

### 3. **Educational Value**

Mô hình này giúp thể hiện:

- ✅ Hiểu về authentication flow
- ✅ Biết cách tích hợp JWT với NestJS guards
- ✅ Understand trade-offs trong system design
- ✅ Document limitations (critical thinking)

## 🔐 Security Best Practices Được Áp Dụng

### 1. RSA-based JWT (Asymmetric Encryption)

```typescript
// Gateway verify với Public Key
const publicKey = await jose.importSPKI(process.env.JWT_PUBLIC_KEY, 'RS256');
const { payload } = await jose.jwtVerify(token, publicKey);
```

**Lợi ích:**

- Auth service (sign) và Gateway (verify) dùng keys khác nhau
- Public key leak không ảnh hưởng khả năng tạo token mới
- Best practice trong distributed systems

### 2. Token Expiration

```typescript
const token = await new jose.SignJWT({ sub: userId, email, role })
  .setProtectedHeader({ alg: 'RS256' })
  .setExpirationTime('15m') // ✅ Short-lived token
  .sign(privateKey);
```

### 3. Explicit Prisma Select (Không leak sensitive data)

```typescript
// ✅ ĐÚNG - Explicit select
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    // NEVER select passwordHash
  },
});

// ❌ SAI - Expose tất cả fields
const user = await prisma.user.findUnique({ where: { id } });
```

### 4. Input Validation (DTOs với class-validator)

```typescript
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
```

## 📚 Tài Liệu Tham Khảo Cho Thesis Defense

### Câu Hỏi Có Thể Gặp

**Q: Tại sao không implement Zero Trust?**

> A: Với phạm vi luận văn, mình tập trung vào kiến trúc microservices và communication patterns. Zero Trust sẽ làm hệ thống phức tạp hơn nhiều mà không mang lại giá trị học thuật tương xứng. Mình đã document rõ trade-offs và biết cách implement nếu cần.

**Q: Nếu một microservice bị hack thì sao?**

> A: Đây là limitation của mô hình Perimeter Security. Trong production, có thể implement thêm:
>
> - Service-to-service authentication (mTLS)
> - Network policies để isolate services
> - Event authorization layer
>
> Nhưng với scope luận văn, mình chấp nhận trade-off này để giữ hệ thống đơn giản.

**Q: JWT có thể bị đánh cắp không?**

> A: Có thể. Để giảm rủi ro:
>
> - ✅ Token expiry ngắn (15 phút)
> - ✅ HTTPS trong production
> - 💡 Có thể thêm refresh token mechanism (nếu có thời gian)

## 🔄 Nâng Cấp Trong Tương Lai

Nếu hệ thống cần đưa vào production, cần thêm:

### Phase 1: Enhanced Perimeter

- [ ] Rate limiting ở Gateway (Redis)
- [ ] Request logging & monitoring
- [ ] IP whitelisting cho internal services

### Phase 2: Defense in Depth

- [ ] Implement BaseAuthGuard cho critical services (User, Payment)
- [ ] Add request signing để verify message origin
- [ ] Database audit logs

### Phase 3: Zero Trust

- [ ] Service mesh (Istio/Linkerd)
- [ ] mTLS cho service-to-service communication
- [ ] Policy engine (OPA) cho authorization

## 📊 Metrics & Monitoring

Các metrics quan trọng cần theo dõi:

```typescript
// Gateway authentication metrics
-auth.attempts.total -
  auth.success.total -
  auth.failure.total -
  auth.latency.p99 -
  // JWT token metrics
  jwt.issued.total -
  jwt.expired.total -
  jwt.invalid.total;
```

## 🎯 Kết Luận

Mô hình **Perimeter Security** là lựa chọn phù hợp cho luận văn vì:

1. ✅ **Đủ tốt** để demonstrate hiểu biết về authentication
2. ✅ **Đơn giản** để focus vào core microservices concepts
3. ✅ **Có thể giải thích** rõ ràng trade-offs
4. ✅ **Production-ready** cho môi trường controlled (không public internet)

**Thesis takeaway:**

> "System design is about trade-offs. Chọn giải pháp phù hợp với context (scope, timeline, requirements) quan trọng hơn là chọn giải pháp 'perfect'."

---

**Document Version:** 1.0  
**Last Updated:** October 22, 2025  
**Author:** Backend Team
