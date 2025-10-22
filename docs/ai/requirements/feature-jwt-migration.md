---
phase: requirements
title: Requirements & Problem Understanding
description: Clarify the problem space, gather requirements, and define success criteria
---

# Requirements & Problem Understanding - JWT Migration to Jose with RSA

## Problem Statement

**What problem are we solving?**

- **Current Issue**: Hệ thống đang sử dụng thư viện `jsonwebtoken` với **symmetric key** (JWT_SECRET_KEY) để sign và verify JWT tokens. Cách này yêu cầu tất cả microservices đều phải có access đến secret key, tạo ra rủi ro bảo mật nếu một service bị compromise.

- **Who is affected?**:
  - Developers: Phải manage secret key cho tất cả 8 microservices
  - System: Security risk khi tất cả services đều có quyền sign tokens
  - Infrastructure: Phải distribute sensitive secret key đến mọi nơi

- **Current workaround**:
  - Tất cả services đều dùng chung `JWT_SECRET_KEY` trong environment variables
  - Không có separation of concerns giữa token signing và verification
  - Syntax `jsonwebtoken` library không hiện đại, không hỗ trợ ESM tốt

## Goals & Objectives

**What do we want to achieve?**

### Primary Goals

1. **Migrate to RSA Asymmetric Cryptography**:
   - User-app giữ **private key** để sign tokens
   - Tất cả services khác chỉ có **public key** để verify tokens
   - Tăng cường bảo mật: chỉ user-app có khả năng tạo tokens hợp lệ

2. **Replace jsonwebtoken with jose**:
   - Thư viện hiện đại hơn, syntax rõ ràng
   - Zero dependencies, tree-shakeable
   - Support ESM và TypeScript native
   - Follow JOSE standards (RFC 7515-7519)

3. **Store keys in Environment Variables**:
   - Follow 12-factor app principles
   - Base64-encoded để dễ dàng store và deploy
   - Consistent với cách manage config hiện tại (.env files)

### Secondary Goals

- Tạo script tự động generate RSA key pairs
- Tổ chức code sạch hơn với dedicated JwtService
- Improve testability với dependency injection
- Chuẩn bị nền tảng cho token blacklist/rotation trong tương lai

### Non-Goals

- ❌ **Không** implement key rotation (out of scope cho luận văn)
- ❌ **Không** thêm Redis cache (keep it simple)
- ❌ **Không** implement token blacklist (có thể thêm sau)
- ❌ **Không** thay đổi JWT payload structure
- ❌ **Không** thay đổi auth flow hiện tại (login/verify/refresh)

## User Stories & Use Cases

**How will users interact with the solution?**

### Story 1: Developer Setup

**Là developer**, tôi muốn dễ dàng generate RSA keys cho môi trường local, để có thể chạy project ngay lập tức.

**Acceptance Criteria**:

- Chạy một script duy nhất: `pnpm run generate:keys`
- Script tạo RSA key pair và xuất base64
- Developer copy/paste vào `.env` file
- Tất cả services có thể khởi động bình thường

### Story 2: User Login (User-app signs token)

**Là user**, khi tôi login, user-app sẽ tạo JWT token với private key, để chỉ có user-app mới có khả năng tạo tokens hợp lệ.

**Acceptance Criteria**:

- User-app load private key từ `JWT_PRIVATE_KEY_BASE64`
- Sign token với RS256 algorithm
- Token payload giữ nguyên: `{ userId, email, role }`
- Return accessToken và refreshToken như cũ

### Story 3: Service Verifies Token (All services)

**Là microservice** (product-app, cart-app, etc.), khi nhận request có JWT token, tôi muốn verify token với public key, để đảm bảo token do user-app sign và không bị giả mạo.

**Acceptance Criteria**:

- Service load public key từ `JWT_PUBLIC_KEY_BASE64`
- Verify token signature với RS256
- Extract payload và gán vào `request.user`
- Reject token invalid/expired với error rõ ràng

### Story 4: Backwards Compatibility

**Là system**, sau khi migrate, tất cả existing tests và API endpoints phải hoạt động bình thường, để đảm bảo không có breaking changes.

**Acceptance Criteria**:

- Tất cả unit tests pass
- Tất cả E2E tests pass
- Auth flow không thay đổi từ client perspective
- Response format giữ nguyên

## Success Criteria

**How will we know when we're done?**

### Functional Requirements

- ✅ User-app có thể sign JWT với private key
- ✅ Tất cả services có thể verify JWT với public key
- ✅ Login/verify/refresh endpoints hoạt động bình thường
- ✅ BaseAuthGuard verify tokens thành công
- ✅ Invalid/expired tokens bị reject đúng cách

### Technical Requirements

- ✅ `jsonwebtoken` dependency đã bị remove
- ✅ `jose` library đã được cài đặt và sử dụng
- ✅ RSA keys được lưu trong `.env` dưới dạng base64
- ✅ JwtService module được tạo và export từ `libs/shared/`
- ✅ Tất cả 8 microservices đã update auth logic

### Testing Requirements

- ✅ Unit tests cho JwtService (sign, verify, errors)
- ✅ Integration tests cho auth flow (login → verify → refresh)
- ✅ E2E tests cho protected endpoints
- ✅ Test coverage >= 80% cho code mới

### Documentation Requirements

- ✅ `.env.example` có JWT config mới
- ✅ README cập nhật hướng dẫn generate keys
- ✅ Comments trong code giải thích RSA approach

## Constraints & Assumptions

**What limitations do we need to work within?**

### Technical Constraints

- **Monorepo structure**: Phải dùng shared library approach
- **NestJS framework**: Phải follow dependency injection patterns
- **NATS messaging**: Auth headers truyền qua NATS messages
- **Existing interfaces**: Giữ nguyên `JwtPayload` interface
- **Environment variables**: Base64-encoded keys (không dùng files)

### Business Constraints

- **Phạm vi luận văn**: Giữ implementation đơn giản, không cần key rotation
- **Timeline**: 4-6 giờ để hoàn thành
- **Zero downtime**: Phải có migration path rõ ràng

### Assumptions

- ✅ RSA-2048 đủ mạnh cho phạm vi luận văn (không cần RSA-4096)
- ✅ Keys không rotate thường xuyên (có thể manual rotate khi cần)
- ✅ `.env` files đã được gitignore và secure
- ✅ Developers hiểu cách base64 encode/decode
- ✅ Docker containers có thể đọc env vars từ docker-compose

## Questions & Open Items

**What do we still need to clarify?**

### Resolved Questions

- ✅ **Q**: Lưu keys ở file .pem hay env vars?  
  **A**: Environment variables với base64 encoding (12-factor app)

- ✅ **Q**: Dùng Option nào (1-4)?  
  **A**: Option 2 - Moderate migration với JwtService class

- ✅ **Q**: Algorithm nào (RS256/RS384/RS512)?  
  **A**: RS256 (cân bằng security và performance)

### Open Items

- [ ] Có cần document cách rotate keys manually không?
- [ ] Có cần thêm monitoring/logging cho token verification failures không?
- [ ] Có cần script để verify keys trong .env hợp lệ không?

---

**Status**: ✅ Requirements Approved  
**Next Phase**: Design
