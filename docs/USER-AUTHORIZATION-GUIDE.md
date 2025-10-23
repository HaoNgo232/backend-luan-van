# User Authorization Guide 🔐

> **Quick Start Guide** cho developers để sử dụng Role-Based Authorization trong Gateway

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

### What is User Authorization?

**User Authorization** là tính năng kiểm tra quyền truy cập (role-based) cho các endpoints trong Gateway:

- ✅ Authenticate user (via JWT) - `AuthGuard`
- ✅ Check user role (ADMIN/CUSTOMER) - `RolesGuard`
- ✅ Allow/Deny access based on role

### Available Roles

```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
}
```

---

## Quick Start

### Step 1: Import Components

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, RolesGuard, Roles } from './auth';
import { UserRole } from '@shared/dto/user.dto';
```

### Step 2: Apply Guards

```typescript
@Controller('users')
@UseGuards(AuthGuard, RolesGuard) // Apply guards
export class UsersController {
  @Get()
  @Roles(UserRole.ADMIN) // Only ADMIN can access
  async listUsers() {
    return { users: [] };
  }
}
```

### Step 3: Test

```bash
# Without token → 401 Unauthorized
curl http://localhost:3000/users

# With CUSTOMER token → 403 Forbidden
curl -H "Authorization: Bearer <customer-token>" http://localhost:3000/users

# With ADMIN token → 200 OK
curl -H "Authorization: Bearer <admin-token>" http://localhost:3000/users
```

---

## Basic Usage

### 1. Single Role - Only ADMIN

```typescript
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  async getDashboard() {
    // Only ADMIN can access
    return { stats: {} };
  }
}
```

### 2. Single Role - Only CUSTOMER

```typescript
@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrdersController {
  @Get('my-orders')
  @Roles(UserRole.CUSTOMER)
  async getMyOrders() {
    // Only CUSTOMER can access
    return { orders: [] };
  }
}
```

### 3. Multiple Roles - OR Logic

```typescript
@Controller('products')
@UseGuards(AuthGuard, RolesGuard)
export class ProductsController {
  @Get()
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER) // Both can access
  async listProducts() {
    return { products: [] };
  }
}
```

### 4. No Roles - Authenticated Only

```typescript
@Controller('profile')
@UseGuards(AuthGuard) // Only AuthGuard, no RolesGuard
export class ProfileController {
  @Get()
  async getProfile() {
    // Any authenticated user can access
    return { profile: {} };
  }
}
```

---

## Advanced Usage

### 1. Class-Level Guards

Áp dụng guards cho toàn bộ controller:

```typescript
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard) // All methods protected
@Roles(UserRole.ADMIN) // All methods require ADMIN
export class AdminController {
  @Get('users')
  async listUsers() {
    // ADMIN only
  }

  @Post('users')
  async createUser() {
    // ADMIN only
  }
}
```

### 2. Method-Level Override

Override class-level roles ở method level:

```typescript
@Controller('products')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Default: ADMIN only
export class ProductsController {
  @Get()
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER) // Override: Both can access
  async listProducts() {
    return { products: [] };
  }

  @Post()
  // Uses class-level @Roles(ADMIN)
  async createProduct() {
    return { created: true };
  }
}
```

### 3. Mixed Guards

Kết hợp authenticated và non-authenticated endpoints:

```typescript
@Controller('products')
export class ProductsController {
  @Get('public')
  // No guards - public endpoint
  async getPublicProducts() {
    return { products: [] };
  }

  @Get('private')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPrivateProducts() {
    return { products: [] };
  }
}
```

### 4. Access User Info

Lấy thông tin user trong request:

```typescript
import { Request } from 'express';
import { UserResponse } from '@shared/types/user.types';

@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrdersController {
  @Get('my-orders')
  @Roles(UserRole.CUSTOMER)
  async getMyOrders(@Req() request: Request) {
    const user = request.user as UserResponse;

    // Use user info
    console.log(`User ${user.email} (${user.role}) accessing orders`);

    return { userId: user.id, orders: [] };
  }
}
```

---

## Common Patterns

### Pattern 1: Admin-Only Controller

```typescript
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  @Get('users')
  async listUsers() {
    /* ... */
  }

  @Delete('users/:id')
  async deleteUser() {
    /* ... */
  }

  @Get('reports')
  async getReports() {
    /* ... */
  }
}
```

### Pattern 2: Customer Self-Service

```typescript
@Controller('me')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class CustomerController {
  @Get('profile')
  async getProfile(@Req() request: Request) {
    const user = request.user as UserResponse;
    return { user };
  }

  @Get('orders')
  async getOrders(@Req() request: Request) {
    const user = request.user as UserResponse;
    return { orders: [] };
  }
}
```

### Pattern 3: Mixed Access with Logic

```typescript
@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrdersController {
  @Get()
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  async listOrders(@Req() request: Request) {
    const user = request.user as UserResponse;

    if (user.role === UserRole.ADMIN) {
      // Admin sees all orders
      return { orders: await this.getAllOrders() };
    } else {
      // Customer sees only their orders
      return { orders: await this.getUserOrders(user.id) };
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN) // Only ADMIN can delete
  async deleteOrder(@Param('id') id: string) {
    return { deleted: true };
  }
}
```

### Pattern 4: Resource Ownership Check

```typescript
@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrdersController {
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  async getOrder(@Param('id') id: string, @Req() request: Request) {
    const user = request.user as UserResponse;
    const order = await this.findOrder(id);

    // ADMIN can see any order
    if (user.role === UserRole.ADMIN) {
      return { order };
    }

    // CUSTOMER can only see their own orders
    if (order.userId !== user.id) {
      throw new ForbiddenException('You can only access your own orders');
    }

    return { order };
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Status             | Scenario                  | Cause                       |
| ------------------ | ------------------------- | --------------------------- |
| `401 Unauthorized` | Missing/invalid JWT token | `AuthGuard` blocks request  |
| `403 Forbidden`    | Valid token, wrong role   | `RolesGuard` blocks request |
| `200 OK`           | Valid token, correct role | Request allowed             |

### Error Response Format

#### 401 Unauthorized (AuthGuard)

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Possible causes:**

- No `Authorization` header
- Invalid token format
- Expired token
- Invalid signature

#### 403 Forbidden (RolesGuard)

```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: [ADMIN]. Your role: CUSTOMER",
  "error": "Forbidden"
}
```

**Possible causes:**

- User has wrong role (e.g., CUSTOMER trying to access ADMIN endpoint)
- User object missing from request (should not happen if AuthGuard works)

### Handling in Frontend

```typescript
// Example: Axios interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Show "Access Denied" message
      alert('You do not have permission to access this resource');
    }
    return Promise.reject(error);
  },
);
```

---

## Testing

### Unit Tests

Test your controllers with mocked guards:

```typescript
describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should list users', async () => {
    const result = await controller.listUsers();
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

Test guards with real logic:

```typescript
describe('Authorization Integration', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [AuthGuard, RolesGuard, JwtService, Reflector],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should block CUSTOMER from ADMIN endpoint', async () => {
    const customerToken = generateToken(UserRole.CUSTOMER);

    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });
});
```

### E2E Tests

Test full request flow:

```typescript
describe('Users API (e2e)', () => {
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    // Setup tokens
    adminToken = await getAdminToken();
    customerToken = await getCustomerToken();
  });

  it('GET /users - ADMIN should access', () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('GET /users - CUSTOMER should be denied', () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });
});
```

---

## Troubleshooting

### Issue 1: Always getting 401 Unauthorized

**Symptoms:**

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/users
# → 401 Unauthorized
```

**Possible causes:**

1. Token is invalid or expired
2. JWT keys not loaded properly
3. Token format is wrong (should be `Bearer <token>`)

**Solutions:**

```bash
# Check token expiration
echo "<token>" | cut -d'.' -f2 | base64 -d | jq .exp

# Verify JWT keys exist
ls -la keys/
# Should see: private-key.pem, public-key.pem

# Check token format
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3000/users
```

### Issue 2: Always getting 403 Forbidden

**Symptoms:**

```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: [ADMIN]. Your role: CUSTOMER"
}
```

**Possible causes:**

1. User has wrong role
2. Using wrong token (e.g., customer token for admin endpoint)

**Solutions:**

```typescript
// Check user role in token
const payload = jwt.decode(token);
console.log(payload.role); // Should match required role

// Verify endpoint requirements
@Roles(UserRole.ADMIN) // This requires ADMIN token
```

### Issue 3: Guards not applying

**Symptoms:**

- Endpoint accessible without authentication

**Possible causes:**

1. Forgot to add `@UseGuards()`
2. Guards in wrong order

**Solutions:**

```typescript
// ❌ WRONG - No guards
@Get()
@Roles(UserRole.ADMIN)
async getData() { }

// ✅ CORRECT - Guards applied
@Get()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async getData() { }

// ❌ WRONG - Wrong order (RolesGuard needs user from AuthGuard)
@UseGuards(RolesGuard, AuthGuard)

// ✅ CORRECT - AuthGuard first
@UseGuards(AuthGuard, RolesGuard)
```

### Issue 4: Cannot read user in request

**Symptoms:**

```typescript
const user = request.user; // undefined
```

**Possible causes:**

1. `AuthGuard` not applied
2. Reading user before guards execute

**Solutions:**

```typescript
// ✅ CORRECT - AuthGuard sets request.user
@Get()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async getData(@Req() request: Request) {
  const user = request.user as UserResponse; // ✅ Available
  console.log(user.id, user.role);
}
```

### Issue 5: Tests failing with "Reflect.getMetadata is not a function"

**Symptoms:**

```
TypeError: Reflect.getMetadata is not a function
```

**Solution:**

```typescript
// Add to top of test file
import 'reflect-metadata';
```

---

## Summary

### ✅ Do's

- ✅ Always apply `AuthGuard` before `RolesGuard`
- ✅ Use `@Roles()` decorator to specify required roles
- ✅ Use type assertion for `request.user` to get proper types
- ✅ Apply guards at class level for common requirements
- ✅ Test authorization logic with unit and integration tests

### ❌ Don'ts

- ❌ Don't apply `RolesGuard` without `AuthGuard`
- ❌ Don't forget to import guards and decorators
- ❌ Don't skip authorization on sensitive endpoints
- ❌ Don't use guards without `@Roles()` decorator (will allow all authenticated users)
- ❌ Don't expose admin endpoints without proper guards

---

## Next Steps

1. ✅ Read this guide
2. ✅ Apply guards to your endpoints
3. ✅ Test with different roles
4. ✅ Check [Migration Checklist](./AUTHORIZATION-MIGRATION-CHECKLIST.md) for existing endpoints
5. ✅ Review [Implementation Guide](./docs/ai/implementation/feature-user-authorization.md) for technical details

---

**Questions?** Check the implementation guide or contact the development team.

**Last Updated:** October 23, 2025
