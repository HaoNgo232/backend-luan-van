# CHANGELOG

## [2025-10-22] Security Architecture Cleanup

### 🎯 Objective

Làm rõ mô hình bảo mật của hệ thống - loại bỏ sự mâu thuẫn giữa code và implementation.

### ✅ Changes

#### Removed Files

- ❌ `apps/user-app/src/auth.guard.ts` - AuthGuard không được sử dụng
- ❌ `libs/shared/guards/base-auth.guard.ts` - BaseAuthGuard không được sử dụng
- ❌ `libs/shared/guards/index.ts` - Guards exports

**Lý do:**

- Các file này được tạo với ý định implement "Zero Trust" model
- Nhưng không hề được áp dụng trong code (không có `@UseGuards` trong microservices)
- Gây confusion về "hệ tư tưởng" thiết kế

#### Added Documentation

- ✅ `docs/architecture/SECURITY-ARCHITECTURE.md` - Chi tiết về Perimeter Security model
- ✅ `docs/architecture/SECURITY-QUICK-REFERENCE.md` - Quick guide cho developers

**Nội dung:**

- Giải thích mô hình Perimeter Security
- Flow authentication rõ ràng (Gateway → NATS → Microservices)
- Trade-offs và limitations
- Best practices & common mistakes
- FAQ cho thesis defense

#### Updated Files

- ✅ `README.md` - Thêm phần Security Model và links đến documentation

### 🏗️ Confirmed Architecture: Perimeter Security

```
Client → Gateway (AuthGuard) → NATS → Microservices (No Guards)
           ✅ JWT Verify         ✅ Trust
```

**Nguyên tắc:**

1. Gateway = Single point of authentication
2. NATS = Trusted internal network
3. Microservices = Trust messages from NATS

**Ưu điểm:**

- Đơn giản, rõ ràng
- Performance cao (no double-check)
- Phù hợp scope luận văn

**Hạn chế:**

- Single point of failure
- Lateral movement risk (documented)

### 📋 Migration Guide

**Không cần thay đổi code** - Đây chỉ là cleanup và documentation.

**Nếu đang develop:**

- Gateway endpoints nhạy cảm → Dùng `@UseGuards(AuthGuard)`
- Microservice handlers → KHÔNG dùng guards
- Xem: [Security Quick Reference](./docs/architecture/SECURITY-QUICK-REFERENCE.md)

### 🎓 Thesis Defense Notes

**Câu hỏi có thể gặp:**

**Q: Tại sao không implement guard cho từng microservice?**

> Với phạm vi luận văn, mình tập trung vào kiến trúc microservices và communication patterns. Perimeter Security đủ đơn giản để demonstrate understanding mà không over-engineering. Mình đã document rõ trade-offs.

**Q: Đây có phải best practice không?**

> Depends on context. Với internal network và controlled environment (luận văn), Perimeter Security là hợp lý. Production system sẽ cần thêm defense layers (mTLS, service mesh).

**Q: Biết cách implement Zero Trust không?**

> Có. Mình đã thiết kế BaseAuthGuard và AuthGuard (đã remove vì không dùng). Nếu cần, có thể implement lại bằng cách:
>
> 1. Add `@UseGuards(AuthGuard)` cho mỗi microservice handler
> 2. Verify JWT trong mỗi service
> 3. Nhưng sẽ làm hệ thống phức tạp hơn nhiều.

### 🔍 Files Kept (Gateway Security)

**GIỮ LẠI:**

- ✅ `apps/gateway/src/auth/auth.guard.ts` - Gateway's AuthGuard (ĐANG DÙNG)
- ✅ `apps/gateway/src/auth/auth.service.ts` - Authentication logic
- ✅ `libs/shared/jwt/jwt.service.ts` - JWT verification

### 📊 Impact Analysis

| Aspect               | Before    | After                 |
| -------------------- | --------- | --------------------- |
| Guard files          | 3 files   | 1 file (Gateway only) |
| Confusion level      | High ❌   | Clear ✅              |
| Documentation        | None      | Complete              |
| Architecture clarity | Mâu thuẫn | Rõ ràng               |
| Code maintainability | Unclear   | Improved              |

### ✨ Benefits

1. **Clarity**: Không còn confusion về "hệ tư tưởng" thiết kế
2. **Honesty**: Code phản ánh đúng implementation (no unused files)
3. **Documentation**: Đầy đủ, rõ ràng cho thesis defense
4. **Maintainability**: Developer hiểu rõ security model

### 🎯 Next Steps

1. ✅ Hoàn thành các microservices còn lại (Product, Cart, Order)
2. ✅ Viết tests (target ≥70% coverage)
3. ✅ Chuẩn bị documentation cho luận văn
4. 💡 Consider implementing request logging/monitoring

---

**Note:** Đây là architectural decision cho luận văn. Trong production, có thể cần review lại security model.
