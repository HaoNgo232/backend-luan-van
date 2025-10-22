# API Gateway Refactoring - Pattern Documentation

## 📋 Tổng Quan

API Gateway đã được refactor theo **Perimeter Security Pattern** với các cải tiến:

1. ✅ **Loại bỏ Service Layer không cần thiết** - Controllers gửi message trực tiếp qua NATS
2. ✅ **Type Safety hoàn toàn** - Tất cả methods có explicit return types
3. ✅ **BaseGatewayController cải tiến** - Generic type support, better error handling
4. ✅ **Perimeter Security Middleware** - Rate limiting và audit logging
5. ✅ **Type Definitions tổ chức tốt** - Tất cả types trong `libs/shared/types/`

## 🏗️ Kiến Trúc

```
Client → API Gateway (Perimeter Security) → NATS → Microservices
         ↑
         - Authentication/Authorization (JWT)
         - Rate Limiting
         - Audit Logging
         - Request Validation
         - Error Handling
```

## 📁 Cấu Trúc Files

### Gateway Controllers

```
apps/gateway/src/
├── base.controller.ts          # BaseGatewayController với generic types
├── middleware/
│   ├── rate-limit.middleware.ts    # Rate limiting cho DDoS protection
│   └── audit-log.middleware.ts     # Audit logging cho security monitoring
├── auth/
│   ├── auth.controller.ts          # ✅ Refactored - loại bỏ AuthService
│   ├── auth.guard.ts
│   └── auth.module.ts
├── users/
│   └── users.controller.ts         # ✅ Refactored với return types
├── products/
│   └── products.controller.ts      # ✅ Refactored với return types
├── cart/
│   └── cart.controller.ts          # ✅ Refactored với return types
├── orders/
│   └── orders.controller.ts        # ✅ Refactored với return types
└── addresses/
    └── addresses.controller.ts     # ✅ Refactored với return types
```

### Type Definitions

```
libs/shared/types/
├── index.ts                    # Export tất cả types
├── auth.types.ts              # AuthResponse, VerifyResponse
├── user.types.ts              # UserResponse, ListUsersResponse
├── product.types.ts           # ProductResponse, PaginatedProductsResponse
├── cart.types.ts              # CartResponse, CartItemResponse
├── order.types.ts             # OrderResponse, PaginatedOrdersResponse
├── address.types.ts           # AddressResponse
├── response.types.ts          # PaginatedResponse<T>, SuccessResponse
└── error.types.ts             # ErrorResponse
```

## 🎯 Pattern: BaseGatewayController

### Improved Implementation

```typescript
export abstract class BaseGatewayController {
  constructor(protected readonly client: ClientProxy) {}

  /**
   * Gửi request-response message với type safety
   */
  protected async send<TRequest, TResponse>(
    pattern: string,
    data: TRequest,
    options: SendOptions = {},
  ): Promise<TResponse> {
    // Implementation với timeout, retry, error handling
  }

  /**
   * Gửi fire-and-forget event
   */
  protected emit<TEvent>(pattern: string, data: TEvent): void {
    this.client.emit<void, TEvent>(pattern, data);
  }
}
```

### Usage Example

```typescript
@Controller('products')
export class ProductsController extends BaseGatewayController {
  constructor(@Inject('PRODUCT_SERVICE') protected readonly client: ClientProxy) {
    super(client);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProductResponse> {
    return this.send<string, ProductResponse>(EVENTS.PRODUCT.GET_BY_ID, id);
  }
}
```

### ✅ Best Practices Implemented

1. **Explicit Return Types** - Mọi method đều có return type rõ ràng
2. **Generic Type Parameters** - `send<TRequest, TResponse>` đảm bảo type safety
3. **No Service Layer** - Controllers gửi trực tiếp qua NATS (DRY principle)
4. **Consistent Naming** - `client` thay vì `service` để rõ ràng là NATS client

## 🛡️ Perimeter Security Implementation

### 1. Rate Limiting Middleware

```typescript
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly maxRequests = 100; // requests per window
  private readonly windowMs = 60000; // 1 minute

  use(req: Request, res: Response, next: NextFunction): void {
    // Giới hạn requests từ mỗi IP
  }
}
```

**Purpose:**

- Prevent DDoS attacks
- Brute force protection
- Resource abuse prevention

### 2. Audit Logging Middleware

```typescript
@Injectable()
export class AuditLogMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Log structured data: method, path, statusCode, duration, IP, userId
  }
}
```

**Purpose:**

- Security monitoring
- Attack detection
- Compliance (audit trail)

### 3. Registration in AppModule

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuditLogMiddleware, RateLimitMiddleware).forRoutes('*');
  }
}
```

## 📊 Type Definitions Pattern

### Common Response Types

```typescript
// Generic paginated response
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// Success response
export type SuccessResponse = {
  success: boolean;
  message?: string;
};
```

### Domain-Specific Types

```typescript
// libs/shared/types/auth.types.ts
export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
};

// libs/shared/types/product.types.ts
export type ProductResponse = {
  id: string;
  sku: string;
  name: string;
  priceInt: number;
  stock: number;
  // ...
};
```

### Usage in Controllers

```typescript
import { ProductResponse, PaginatedProductsResponse } from '@shared/types/product.types';

@Get()
async list(@Query() query: ProductListQueryDto): Promise<PaginatedProductsResponse> {
  return this.send<ProductListQueryDto, PaginatedProductsResponse>(
    EVENTS.PRODUCT.LIST,
    query
  );
}
```

## 🚫 Anti-Patterns Eliminated

### ❌ BEFORE: Service Layer Trùng Lặp

```typescript
// auth.service.ts (KHÔNG CẦN THIẾT)
@Injectable()
export class AuthService {
  async login(dto: LoginDto) {
    return this.sendWithRetry(EVENTS.AUTH.LOGIN, dto);
  }
}

// auth.controller.ts
@Post('login')
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto); // Extra layer
}
```

### ✅ AFTER: Direct Communication

```typescript
// auth.controller.ts
@Post('login')
async login(@Body() dto: LoginDto): Promise<AuthResponse> {
  return this.send<LoginDto, AuthResponse>(EVENTS.AUTH.LOGIN, dto);
}
```

### ❌ BEFORE: Missing Return Types

```typescript
async findById(@Param('id') id: string) {
  return this.sendWithRetry(EVENTS.USER.FIND_BY_ID, id); // Return type?
}
```

### ✅ AFTER: Explicit Return Types

```typescript
async findById(@Param('id') id: string): Promise<UserResponse> {
  return this.send<string, UserResponse>(EVENTS.USER.FIND_BY_ID, id);
}
```

## 🎓 Benefits Cho Thesis

### 1. Demonstrating SOLID Principles

- **Single Responsibility**: Controllers chỉ routing, không có business logic
- **Dependency Inversion**: Inject ClientProxy qua constructor
- **Open/Closed**: BaseGatewayController extensible qua inheritance

### 2. Security Best Practices

- **Perimeter Security Pattern**: API Gateway là điểm kiểm soát duy nhất
- **Defense in Depth**: Rate limiting + Audit logging + JWT authentication
- **Least Privilege**: AuthGuard bảo vệ protected routes

### 3. Type Safety & Maintainability

- **100% Type Coverage**: Không có `any` types
- **Compile-time Safety**: Catch errors trước khi runtime
- **Self-documenting Code**: Types serve as documentation

## 📝 Migration Guide

Để migrate controllers khác theo pattern này:

### Step 1: Tạo Type Definitions

```typescript
// libs/shared/types/your-domain.types.ts
export type YourResponse = {
  // Define response structure
};
```

### Step 2: Refactor Controller

```typescript
import { YourResponse } from '@shared/types/your-domain.types';

@Controller('your-route')
export class YourController extends BaseGatewayController {
  constructor(@Inject('YOUR_SERVICE') protected readonly client: ClientProxy) {
    super(client);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<YourResponse> {
    return this.send<string, YourResponse>(EVENTS.YOUR.FIND_BY_ID, id);
  }
}
```

### Step 3: Remove Service Layer (nếu có)

- Delete `your.service.ts`
- Update module để remove service from providers

## 🔍 Code Quality Checklist

Mỗi controller phải đáp ứng:

- [ ] Extends `BaseGatewayController`
- [ ] Inject `ClientProxy` với tên `client` (không phải `service`)
- [ ] Tất cả methods có explicit return types
- [ ] Sử dụng `send<TRequest, TResponse>()` với proper types
- [ ] Import types từ `@shared/types/`
- [ ] Có JSDoc comments cho mỗi endpoint
- [ ] Không có business logic trong controller
- [ ] Không có service layer trung gian

## 🎯 Testing Considerations

Controllers này dễ test vì:

1. **Pure Routing Logic**: Không có business logic phức tạp
2. **Mockable Dependencies**: ClientProxy có thể mock dễ dàng
3. **Type-safe**: Tests sẽ fail nếu types không match

Example test:

```typescript
describe('ProductsController', () => {
  let controller: ProductsController;
  let client: ClientProxy;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: 'PRODUCT_SERVICE',
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ProductsController);
    client = module.get('PRODUCT_SERVICE');
  });

  it('should return product by id', async () => {
    const mockProduct: ProductResponse = {
      /* ... */
    };
    jest.spyOn(client, 'send').mockReturnValue(of(mockProduct));

    const result = await controller.findById('123');
    expect(result).toEqual(mockProduct);
  });
});
```

## 📚 References

- NestJS Microservices: https://docs.nestjs.com/microservices/basics
- Perimeter Security Pattern: Design pattern cho API Gateway security
- SOLID Principles: Clean architecture cho maintainable code

## ✅ Status

**Hoàn thành:**

- ✅ BaseGatewayController refactored
- ✅ AuthController refactored (removed AuthService)
- ✅ ProductsController refactored
- ✅ CartController refactored
- ✅ OrdersController refactored
- ✅ UsersController refactored
- ✅ AddressesController refactored
- ✅ Type definitions organized
- ✅ Perimeter Security middleware implemented
- ✅ AppModule configured

**Cần làm tiếp (nếu cần):**

- [ ] Categories controller (nếu tồn tại)
- [ ] Payments controller (nếu cần implement)
- [ ] AR controller (nếu cần implement)

---

**Note:** Đây là implementation cho thesis project. Production systems nên:

- Sử dụng Redis cho rate limiting (thay vì in-memory store)
- Centralized logging system (ELK, CloudWatch)
- Circuit breaker pattern cho fault tolerance
- Distributed tracing (Jaeger, Zipkin)
