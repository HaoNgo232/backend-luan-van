---
phase: requirements
title: Requirements & Problem Understanding
description: Clarify the problem space, gather requirements, and define success criteria
---

# Requirements & Problem Understanding - User Authorization

## Problem Statement

**What problem are we solving?**

- Hiện tại hệ thống chỉ có **authentication** (xác thực danh tính qua JWT), nhưng chưa có **authorization** (phân quyền truy cập dựa trên role)
- Tất cả các endpoint được bảo vệ bởi `AuthGuard` đều chỉ kiểm tra token hợp lệ, không kiểm tra quyền truy cập theo role (ADMIN, CUSTOMER)
- Developer phải tự viết logic kiểm tra role trong từng controller/service, dẫn đến code trùng lặp và dễ sai sót
- Không có cơ chế tập trung để quản lý authorization policy
- Các endpoint nhạy cảm (quản lý user, product, order status) có thể bị CUSTOMER truy cập nếu quên kiểm tra role

**Who is affected by this problem?**

- **Developers**: Phải viết logic kiểm tra role thủ công, dễ quên hoặc sai
- **Security**: Rủi ro bảo mật cao khi thiếu authorization layer
- **Business**: Admin không có quyền riêng để quản lý hệ thống
- **End Users (CUSTOMER)**: Có thể truy cập các API không được phép nếu thiếu kiểm tra

**What is the current situation/workaround?**

- Hiện tại: Chỉ có `AuthGuard` kiểm tra JWT token hợp lệ
- Workaround: Developer phải tự kiểm tra `request.user.role` trong từng controller method
- Vấn đề: Không nhất quán, dễ quên, khó maintain

## Goals & Objectives

**What do we want to achieve?**

### Primary Goals

1. **Tạo `RolesGuard`** - Guard decorator để kiểm tra role tự động
2. **Tạo `@Roles()` decorator** - Đánh dấu endpoint cần role gì (ADMIN, CUSTOMER)
3. **Tích hợp với `AuthGuard`** - Kết hợp authentication + authorization
4. **Hướng dẫn kích hoạt** - Documentation rõ ràng để developer tự áp dụng vào endpoint cần thiết

### Secondary Goals

5. **Type-safe role management** - Sử dụng enum `UserRole` đã có sẵn
6. **Clear error messages** - Message rõ ràng khi user không có quyền
7. **Logging** - Log các trường hợp bị từ chối để audit

### Non-goals (what's explicitly out of scope)

- ❌ **Permission-based authorization** (chỉ role-based, không làm fine-grained permissions)
- ❌ **Dynamic roles** (không cho phép user có nhiều role)
- ❌ **Role hierarchy** (ADMIN không tự động có quyền CUSTOMER)
- ❌ **Resource-based authorization** (không kiểm tra ownership, ví dụ: "user chỉ xem được order của mình")
- ❌ **Áp dụng tự động** vào tất cả endpoint (developer tự quyết định endpoint nào cần bảo vệ)

## User Stories & Use Cases

**How will users interact with the solution?**

### User Story 1: Admin quản lý users

**Là một ADMIN**, tôi muốn **truy cập các endpoint quản lý user** (create, update, deactivate, list) **để quản lý hệ thống**, trong khi CUSTOMER không thể truy cập các endpoint này.

- **Endpoint examples**: `POST /users`, `PATCH /users/:id`, `GET /users` (list all)
- **Expected behavior**:
  - ADMIN → 200 OK
  - CUSTOMER → 403 Forbidden
  - No token → 401 Unauthorized

### User Story 2: Admin quản lý products

**Là một ADMIN**, tôi muốn **tạo, cập nhật, xóa sản phẩm** **để quản lý catalog**, trong khi CUSTOMER chỉ được xem sản phẩm.

- **Endpoint examples**: `POST /products`, `PATCH /products/:id`, `DELETE /products/:id`
- **Expected behavior**:
  - ADMIN → 200 OK
  - CUSTOMER → 403 Forbidden

### User Story 3: Customer xem profile của mình

**Là một CUSTOMER**, tôi muốn **xem và cập nhật profile của mình** **để quản lý thông tin cá nhân**, mà không cần quyền ADMIN.

- **Endpoint examples**: `GET /users/me`, `PATCH /users/me`
- **Expected behavior**:
  - CUSTOMER → 200 OK (chỉ xem/sửa profile của mình)
  - ADMIN → 200 OK (có thể xem/sửa bất kỳ user nào)

### User Story 4: Admin cập nhật order status

**Là một ADMIN**, tôi muốn **cập nhật trạng thái đơn hàng** (CONFIRMED, SHIPPED, DELIVERED) **để quản lý fulfillment**, trong khi CUSTOMER chỉ được xem đơn hàng của mình.

- **Endpoint examples**: `PATCH /orders/:id/status`
- **Expected behavior**:
  - ADMIN → 200 OK
  - CUSTOMER → 403 Forbidden

### User Story 5: Developer áp dụng authorization

**Là một DEVELOPER**, tôi muốn **dễ dàng áp dụng role check** vào bất kỳ endpoint nào **bằng cách thêm decorator** `@Roles(UserRole.ADMIN)`.

- **Implementation**: Decorator-based, không cần viết if/else thủ công
- **Documentation**: Hướng dẫn rõ ràng trong README

### Edge Cases to Consider

1. **Token hợp lệ nhưng không có role field** → 401 Unauthorized (invalid token)
2. **Token có role không hợp lệ** (không phải ADMIN/CUSTOMER) → 401 Unauthorized
3. **Endpoint không có `@Roles()` decorator** → Chỉ cần authentication (như hiện tại)
4. **Endpoint có `@Roles()` nhưng không có `RolesGuard`** → Log warning, fallback về chỉ authentication
5. **User bị deactivate (isActive=false)** → Authentication service đã handle (out of scope)

## Success Criteria

**How will we know when we're done?**

### Functional Criteria

- [x] `RolesGuard` được tạo và hoạt động đúng
- [x] `@Roles()` decorator được tạo và hoạt động đúng
- [x] Tích hợp với `AuthGuard` thành công (có thể dùng cả 2 guards cùng lúc)
- [x] Endpoint có `@Roles(UserRole.ADMIN)` → chỉ ADMIN truy cập được
- [x] Endpoint có `@Roles(UserRole.CUSTOMER)` → chỉ CUSTOMER truy cập được
- [x] Endpoint có `@Roles(UserRole.ADMIN, UserRole.CUSTOMER)` → cả 2 đều truy cập được
- [x] Endpoint không có `@Roles()` → chỉ cần authentication (không check role)

### Error Handling

- [x] CUSTOMER truy cập endpoint ADMIN-only → `403 Forbidden` với message rõ ràng
- [x] Không có token → `401 Unauthorized` (AuthGuard xử lý)
- [x] Token không hợp lệ → `401 Unauthorized` (AuthGuard xử lý)

### Documentation

- [x] README hoặc implementation doc giải thích cách sử dụng
- [x] Code examples cho các use case phổ biến
- [x] Migration guide để developer áp dụng vào existing endpoints

### Testing

- [x] Unit tests cho `RolesGuard`
- [x] Integration tests cho các use case trên
- [x] E2E tests kiểm tra authorization end-to-end

## Constraints & Assumptions

**What limitations do we need to work within?**

### Technical Constraints

- Phải hoạt động với NestJS Guards existing (`AuthGuard`)
- Phải sử dụng `UserRole` enum đã có trong `libs/shared/dto/user.dto.ts`
- Không thay đổi JWT payload structure (đã có field `role`)
- Không thay đổi database schema (User model đã có field `role`)

### Business Constraints

- Chỉ hỗ trợ 2 roles: ADMIN và CUSTOMER (không thêm role mới trong scope này)
- Không có role hierarchy (ADMIN không tự động có quyền CUSTOMER)
- Developer tự quyết định endpoint nào cần authorization (không tự động áp dụng)

### Time/Budget Constraints

- Triển khai trong 1-2 ngày
- Không làm phức tạp hóa (KISS principle)
- Ưu tiên simplicity over flexibility

### Assumptions We're Making

- JWT token luôn có field `role` (AuthGuard đã validate)
- User role không thay đổi trong lúc token còn hiệu lực (không cần real-time role check)
- Developer sẽ đọc documentation trước khi áp dụng
- Testing sẽ được thực hiện kỹ lưỡng trước khi deploy

## Questions & Open Items

**What do we still need to clarify?**

### Resolved Questions

✅ **Q1**: Có cần hỗ trợ multiple roles cho 1 user không?

- **A**: Không. 1 user chỉ có 1 role (ADMIN hoặc CUSTOMER)

✅ **Q2**: Có cần role hierarchy không? (ADMIN tự động có quyền CUSTOMER)

- **A**: Không. Explicit better than implicit.

✅ **Q3**: Có cần permission-based authorization không?

- **A**: Không. Chỉ role-based trong scope này.

✅ **Q4**: Áp dụng RolesGuard tự động vào tất cả endpoints?

- **A**: Không. Developer tự thêm vào endpoint cần thiết.

### Unresolved Questions

❓ **Q5**: Có cần logging/auditing cho failed authorization attempts không?

- **Decision needed**: Có thể thêm trong implementation phase

❓ **Q6**: Error message có cần localized không? (Vietnamese/English)

- **Decision needed**: Mặc định tiếng Anh, có thể thêm sau

### Items Requiring Stakeholder Input

- Xác nhận list các endpoints cần áp dụng ADMIN-only (sẽ làm trong implementation phase)
- Review security policy với team lead

### Research Needed

- Best practices cho NestJS role-based authorization
- Kiểm tra existing endpoints nào đang thiếu authorization
