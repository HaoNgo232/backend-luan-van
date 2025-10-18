# Testing Guide

## Quick Start

Test databases hoàn toàn tách riêng từ development.

```bash
# Chạy toàn bộ test (containers up → migrate → run → down)
pnpm test:full

# Hoặc từng bước
pnpm test:compose:up          # Khởi động test containers
pnpm test:db:migrate           # Chạy migrations
pnpm test:run                  # Chạy tests
pnpm test:compose:down         # Tắt + xóa containers (giải phóng tài nguyên)
```

## Environment

- **Development**: `.env` (databases on ports 5433-5439)
- **Test**: `.env.test` (databases on ports 5533-5539, NATS on 4223)

Mỗi lần chạy `test:full`, containers được tạo fresh và xóa sạch sau khi test xong.

## Best Practices

- ✅ Mock external services (NATS)
- ✅ Clean up test data sau mỗi test
- ✅ Viết tests độc lập (không phụ thuộc thứ tự)
- ✅ Dùng `.env.test` cho test environment

## Coverage Goals

- **Core services**: ≥ 70% (user, product, cart)
- **Critical flows**: auth, checkout
- **E2E tests**: main features
