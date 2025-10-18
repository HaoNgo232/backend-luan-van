# Hướng Dẫn Cấu Hình Biến Môi Trường

## Thông Tin Chung

Dự án này sử dụng kiến trúc **Microservices** với 7 services độc lập, mỗi service có database riêng.

## Tạo File `.env`

Tạo file `.env` ở thư mục gốc của project với nội dung sau:

```env
# User Service Database
DATABASE_URL_USER="postgresql://user:user_password@localhost:5433/user_db?schema=public"

# Product Service Database
DATABASE_URL_PRODUCT="postgresql://product:product_password@localhost:5434/product_db?schema=public"

# Cart Service Database
DATABASE_URL_CART="postgresql://cart:cart_password@localhost:5435/cart_db?schema=public"

# Order Service Database
DATABASE_URL_ORDER="postgresql://order:order_password@localhost:5436/order_db?schema=public"

# Payment Service Database
DATABASE_URL_PAYMENT="postgresql://payment:payment_password@localhost:5437/payment_db?schema=public"

# AR Service Database
DATABASE_URL_AR="postgresql://ar:ar_password@localhost:5438/ar_db?schema=public"

# Report Service Database
DATABASE_URL_REPORT="postgresql://report:report_password@localhost:5439/report_db?schema=public"

# NATS Message Queue Configuration
NATS_SERVERS="nats://localhost:4222"

# Optional: JWT Secret for authentication
JWT_SECRET="your-secret-key-change-this-in-production"
```

## Cấu Trúc Các Services

| Service     | Database   | Port | Username | Password         |
| ----------- | ---------- | ---- | -------- | ---------------- |
| User App    | user_db    | 5433 | user     | user_password    |
| Product App | product_db | 5434 | product  | product_password |
| Cart App    | cart_db    | 5435 | cart     | cart_password    |
| Order App   | order_db   | 5436 | order    | order_password   |
| Payment App | payment_db | 5437 | payment  | payment_password |
| AR App      | ar_db      | 5438 | ar       | ar_password      |
| Report App  | report_db  | 5439 | report   | report_password  |

## Khởi Động Services

### 1. Khởi động tất cả services với Docker Compose:

```bash
docker-compose up -d
```

### 2. Kiểm tra trạng thái các services:

```bash
docker-compose ps
```

### 3. Chạy Prisma migrations cho từng service:

```bash
# User Service
cd apps/user-app
pnpm prisma migrate deploy

# Product Service
cd apps/product-app
pnpm prisma migrate deploy

# Cart Service
cd apps/cart-app
pnpm prisma migrate deploy

# Order Service
cd apps/order-app
pnpm prisma migrate deploy

# Payment Service
cd apps/payment-app
pnpm prisma migrate deploy

# AR Service
cd apps/ar-app
pnpm prisma migrate deploy

# Report Service
cd apps/report-app
pnpm prisma migrate deploy
```

## Dừng Services

```bash
docker-compose down
```

### Xóa tất cả dữ liệu (volumes):

```bash
docker-compose down -v
```

## Ghi Chú Quan Trọng

⚠️ **Bảo Mật:**

- Không để username/password default trong production
- Thay đổi `JWT_SECRET` bằng một khóa bảo mật mạnh
- Sử dụng environment variables hoặc secret management tools trong production

⚠️ **Phát Triển:**

- Các passwords này chỉ dành cho development local
- Mỗi service có database riêng cho isolation tốt hơn
- NATS được sử dụng cho asynchronous communication giữa các services
