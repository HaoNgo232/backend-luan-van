# 🚀 API Gateway - E-commerce Microservices

API Gateway sử dụng **REST API** để giao tiếp với client và **NATS** để giao tiếp với các microservices.

## 📂 Cấu trúc

```
gateway/src/
├── auth/           # Authentication (login, register, refresh token)
├── users/          # User management (CRUD, profiles)
├── addresses/      # Shipping addresses
├── products/       # Products & Categories
├── cart/           # Shopping cart
├── orders/         # Order management
├── payments/       # Payment processing
├── ar/             # Augmented Reality features
├── health.controller.ts  # Health checks
└── main.ts         # Entry point
```

## 🔌 API Endpoints

### 🔐 Authentication (`/auth`)

- `POST /auth/register` - Đăng ký tài khoản mới
- `POST /auth/login` - Đăng nhập
- `POST /auth/refresh` - Làm mới token
- `POST /auth/verify` - Xác thực token
- `GET /auth/me` - Lấy thông tin user hiện tại (protected)

### 👤 Users (`/users`)

- `GET /users` - Danh sách users (admin)
- `GET /users/:id` - Chi tiết user
- `GET /users/email/:email` - Tìm user theo email
- `POST /users` - Tạo user mới (admin)
- `PUT /users/:id` - Cập nhật user
- `PUT /users/:id/deactivate` - Vô hiệu hóa user

### 📍 Addresses (`/addresses`)

- `GET /addresses` - Danh sách địa chỉ của user
- `POST /addresses` - Tạo địa chỉ mới
- `PUT /addresses/:id` - Cập nhật địa chỉ
- `DELETE /addresses/:id` - Xóa địa chỉ
- `PUT /addresses/:id/set-default` - Đặt địa chỉ mặc định

### 📦 Products (`/products`)

- `GET /products` - Danh sách sản phẩm (có phân trang, filter)
- `GET /products/:id` - Chi tiết sản phẩm
- `GET /products/slug/:slug` - Lấy sản phẩm theo slug
- `POST /products` - Tạo sản phẩm mới (admin)
- `PUT /products/:id` - Cập nhật sản phẩm (admin)
- `DELETE /products/:id` - Xóa sản phẩm (admin)

### 🏷️ Categories (`/categories`)

- `GET /categories` - Danh sách danh mục
- `GET /categories/:id` - Chi tiết danh mục
- `GET /categories/slug/:slug` - Lấy danh mục theo slug
- `POST /categories` - Tạo danh mục mới (admin)
- `PUT /categories/:id` - Cập nhật danh mục (admin)
- `DELETE /categories/:id` - Xóa danh mục (admin)

### 🛒 Cart (`/cart`)

- `GET /cart?sessionId=xxx` - Lấy giỏ hàng
- `POST /cart/items` - Thêm sản phẩm vào giỏ
- `DELETE /cart/items` - Xóa sản phẩm khỏi giỏ
- `DELETE /cart?sessionId=xxx` - Xóa toàn bộ giỏ hàng
- `POST /cart/transfer` - Chuyển giỏ hàng guest sang user (sau login)

### 📋 Orders (`/orders`)

- `GET /orders` - Danh sách đơn hàng của user
- `GET /orders/:id` - Chi tiết đơn hàng
- `POST /orders` - Tạo đơn hàng mới
- `PUT /orders/:id/status` - Cập nhật trạng thái (admin)
- `PUT /orders/:id/cancel` - Hủy đơn hàng

### 💳 Payments (`/payments`)

- `POST /payments/process` - Xử lý thanh toán
- `POST /payments/verify` - Xác thực callback thanh toán
- `GET /payments/:id` - Chi tiết thanh toán
- `GET /payments/order/:orderId` - Lấy thanh toán theo order

### 🥽 AR - Augmented Reality (`/ar`)

- `POST /ar/snapshots` - Tạo AR snapshot
- `GET /ar/snapshots` - Danh sách AR snapshots

## 🔒 Authentication Guard

Gateway verify JWT token **TRỰC TIẾP** bằng RSA Public Key (không qua NATS) để tối ưu performance!

```typescript
// Gateway's AuthGuard verify token locally (FAST!)
@Injectable()
export class AuthGuard {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const token = extractToken(request);
    const payload = await this.jwtService.verifyToken(token); // Local verify!
    request.user = { userId: payload.sub, email, role };
    return true;
  }
}
```

Sử dụng trong controller:

```typescript
@Get('me')
@UseGuards(AuthGuard)
async getCurrentUser(@Req() req) {
  return this.authService.getCurrentUser(req.user.userId);
}
```

**Lợi ích:**

- ⚡ **Nhanh**: Không cần gọi microservice qua NATS
- 🔒 **An toàn**: RSA signature verification
- 📈 **Scalable**: Giảm load cho user-app

## 🌐 NATS Communication

Gateway giao tiếp với microservices thông qua NATS:

```typescript
// Example: Forward request to user-service
async login(dto: LoginDto) {
  return firstValueFrom(
    this.userService.send(EVENTS.AUTH.LOGIN, dto).pipe(timeout(5000))
  );
}
```

## 🚦 Health Check

- `GET /health` - NATS health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

## ⚙️ Environment Variables

```env
# Server
PORT=3000
CORS_ORIGIN=http://localhost:3001,http://localhost:3002

# NATS
NATS_URL=nats://localhost:4222
```

## 🏃 Running

```bash
# Development
pnpm run start:dev gateway

# Production
pnpm run build gateway
pnpm run start:prod gateway
```

## 📝 Best Practices

1. **Module per Feature**: Mỗi domain có module riêng (auth, users, products, etc.)
2. **Service Layer**: Controllers chỉ forward requests, không chứa business logic
3. **DTO Validation**: Sử dụng `class-validator` cho validation
4. **Error Handling**: NATS errors được convert thành HTTP errors
5. **Timeouts**: Mỗi NATS request có timeout 5s
6. **Guards**: Authentication guard kiểm tra JWT token với user-service

## 🔗 Related Microservices

- **user-app**: User management, authentication
- **product-app**: Products & categories
- **cart-app**: Shopping cart
- **order-app**: Order processing
- **payment-app**: Payment integration
- **ar-app**: AR features
- **report-app**: Analytics & reports
