# Authorization Migration Checklist ✅

> **Hướng dẫn từng bước** để áp dụng User Authorization vào existing endpoints

## 📋 Overview

Checklist này giúp bạn:

- ✅ Xác định endpoints nào cần authorization
- ✅ Áp dụng guards và roles đúng cách
- ✅ Test và verify authorization logic
- ✅ Track tiến độ migration

---

## 🎯 Phase 1: Audit Existing Endpoints

### Step 1.1: List All Controllers

Liệt kê tất cả controllers trong Gateway:

```bash
# Find all controllers
find apps/gateway/src -name "*.controller.ts" -type f
```

**Expected output:**

```
apps/gateway/src/users/users.controller.ts
apps/gateway/src/products/products.controller.ts
apps/gateway/src/orders/orders.controller.ts
apps/gateway/src/cart/cart.controller.ts
apps/gateway/src/payments/payments.controller.ts
apps/gateway/src/addresses/addresses.controller.ts
apps/gateway/src/ar/ar.controller.ts
apps/gateway/src/auth/auth.controller.ts
apps/gateway/src/health.controller.ts
```

**Checklist:**

- [ ] Đã list tất cả controllers
- [ ] Đã ghi lại số lượng controllers: **\_\_**

---

### Step 1.2: Categorize Endpoints by Access Level

Phân loại từng endpoint theo access level:

| Endpoint                 | Current Status | Required Access                  | Priority |
| ------------------------ | -------------- | -------------------------------- | -------- |
| `POST /auth/login`       | Public         | Public (no guards)               | -        |
| `POST /auth/register`    | Public         | Public (no guards)               | -        |
| `GET /health`            | Public         | Public (no guards)               | -        |
| `GET /users`             | ❌ No guards   | 🔴 ADMIN only                    | HIGH     |
| `POST /users`            | ❌ No guards   | 🔴 ADMIN only                    | HIGH     |
| `GET /users/:id`         | ❌ No guards   | 🟡 ADMIN or owner                | MEDIUM   |
| `PUT /users/:id`         | ❌ No guards   | 🟡 ADMIN or owner                | MEDIUM   |
| `DELETE /users/:id`      | ❌ No guards   | 🔴 ADMIN only                    | HIGH     |
| `GET /products`          | ❌ No guards   | 🟢 Public or Both                | LOW      |
| `POST /products`         | ❌ No guards   | 🔴 ADMIN only                    | HIGH     |
| `PUT /products/:id`      | ❌ No guards   | 🔴 ADMIN only                    | HIGH     |
| `DELETE /products/:id`   | ❌ No guards   | 🔴 ADMIN only                    | HIGH     |
| `GET /orders`            | ❌ No guards   | 🟡 ADMIN (all) or CUSTOMER (own) | HIGH     |
| `POST /orders`           | ❌ No guards   | 🟢 CUSTOMER only                 | HIGH     |
| `GET /orders/:id`        | ❌ No guards   | 🟡 ADMIN or owner                | MEDIUM   |
| `PUT /orders/:id`        | ❌ No guards   | 🔴 ADMIN only                    | MEDIUM   |
| `DELETE /orders/:id`     | ❌ No guards   | 🔴 ADMIN only                    | MEDIUM   |
| `GET /cart`              | ❌ No guards   | 🟢 CUSTOMER only                 | HIGH     |
| `POST /cart/items`       | ❌ No guards   | 🟢 CUSTOMER only                 | HIGH     |
| `DELETE /cart/items/:id` | ❌ No guards   | 🟢 CUSTOMER only                 | HIGH     |
| `POST /payments`         | ❌ No guards   | 🟢 CUSTOMER only                 | HIGH     |
| `GET /payments/:id`      | ❌ No guards   | 🟡 ADMIN or owner                | MEDIUM   |
| `GET /addresses`         | ❌ No guards   | 🟢 CUSTOMER only                 | MEDIUM   |
| `POST /addresses`        | ❌ No guards   | 🟢 CUSTOMER only                 | MEDIUM   |
| `GET /ar/models`         | ❌ No guards   | 🟢 Both                          | LOW      |

**Legend:**

- 🔴 HIGH Priority: Critical admin operations or customer-sensitive data
- 🟡 MEDIUM Priority: Resource ownership checks needed
- 🟢 LOW Priority: Less sensitive but should still be protected
- Public: No authentication/authorization needed

**Checklist:**

- [ ] Đã phân loại tất cả endpoints
- [ ] Đã xác định priority cho từng endpoint
- [ ] Đã highlight HIGH priority endpoints

---

## 🔧 Phase 2: Apply Authorization

### Step 2.1: HIGH Priority Endpoints (Admin Operations)

#### Users Controller

**File:** `apps/gateway/src/users/users.controller.ts`

**Changes needed:**

```typescript
import { Controller, Get, Post, Put, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard, RolesGuard, Roles } from '../auth';
import { UserRole } from '@shared/dto/user.dto';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard) // Add guards
@Roles(UserRole.ADMIN) // All methods require ADMIN by default
export class UsersController {
  @Get()
  async listUsers() {}

  @Post()
  async createUser() {}

  @Delete(':id')
  async deleteUser() {}
}
```

**Checklist:**

- [ ] Added imports
- [ ] Added `@UseGuards(AuthGuard, RolesGuard)` to class
- [ ] Added `@Roles(UserRole.ADMIN)` to class
- [ ] Tested with ADMIN token (should work)
- [ ] Tested with CUSTOMER token (should fail with 403)
- [ ] Tested without token (should fail with 401)

---

#### Products Controller (Admin Operations)

**File:** `apps/gateway/src/products/products.controller.ts`

**Changes needed:**

```typescript
import { Controller, Get, Post, Put, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard, RolesGuard, Roles } from '../auth';
import { UserRole } from '@shared/dto/user.dto';

@Controller('products')
export class ProductsController {
  @Get()
  // Public endpoint - no guards
  async listProducts() {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createProduct() {}

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateProduct() {}

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteProduct() {}
}
```

**Checklist:**

- [ ] `GET /products` remains public
- [ ] `POST /products` requires ADMIN
- [ ] `PUT /products/:id` requires ADMIN
- [ ] `DELETE /products/:id` requires ADMIN
- [ ] Tested all endpoints

---

#### Orders Controller (Admin Operations)

**File:** `apps/gateway/src/orders/orders.controller.ts`

**Changes needed:**

```typescript
import { Controller, Get, Put, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard, RolesGuard, Roles } from '../auth';
import { UserRole } from '@shared/dto/user.dto';

@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrdersController {
  @Get()
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER) // Both can access (with logic inside)
  async listOrders(@Req() request: Request) {
    const user = request.user as UserResponse;
    // ADMIN sees all, CUSTOMER sees own
  }

  @Put(':id')
  @Roles(UserRole.ADMIN) // Only ADMIN can update status
  async updateOrder() {}

  @Delete(':id')
  @Roles(UserRole.ADMIN) // Only ADMIN can delete
  async deleteOrder() {}
}
```

**Checklist:**

- [ ] `GET /orders` allows both roles with conditional logic
- [ ] `PUT /orders/:id` requires ADMIN
- [ ] `DELETE /orders/:id` requires ADMIN
- [ ] Tested all scenarios

---

### Step 2.2: HIGH Priority Endpoints (Customer Operations)

#### Cart Controller

**File:** `apps/gateway/src/cart/cart.controller.ts`

**Changes needed:**

```typescript
import { Controller, Get, Post, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard, RolesGuard, Roles } from '../auth';
import { UserRole } from '@shared/dto/user.dto';

@Controller('cart')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER) // All cart operations for CUSTOMER only
export class CartController {
  @Get()
  async getCart(@Req() request: Request) {
    const user = request.user as UserResponse;
    // Get cart for current user
  }

  @Post('items')
  async addItem() {}

  @Delete('items/:id')
  async removeItem() {}
}
```

**Checklist:**

- [ ] All cart endpoints require CUSTOMER
- [ ] Cart operations use `request.user.id`
- [ ] Tested with CUSTOMER token (should work)
- [ ] Tested with ADMIN token (should fail with 403)

---

#### Payments Controller

**File:** `apps/gateway/src/payments/payments.controller.ts`

**Changes needed:**

```typescript
import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, RolesGuard, Roles } from '../auth';
import { UserRole } from '@shared/dto/user.dto';

@Controller('payments')
@UseGuards(AuthGuard, RolesGuard)
export class PaymentsController {
  @Post()
  @Roles(UserRole.CUSTOMER) // CUSTOMER creates payments
  async createPayment() {}

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER) // Both can view (with ownership check)
  async getPayment(@Param('id') id: string, @Req() request: Request) {
    const user = request.user as UserResponse;
    const payment = await this.findPayment(id);

    // ADMIN can see any payment
    if (user.role === UserRole.ADMIN) {
      return { payment };
    }

    // CUSTOMER can only see their own payments
    if (payment.userId !== user.id) {
      throw new ForbiddenException('You can only access your own payments');
    }

    return { payment };
  }
}
```

**Checklist:**

- [ ] `POST /payments` requires CUSTOMER
- [ ] `GET /payments/:id` has ownership check
- [ ] Tested payment creation
- [ ] Tested ownership validation

---

#### Orders Controller (Customer Operations)

**File:** `apps/gateway/src/orders/orders.controller.ts`

**Additional method:**

```typescript
@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrdersController {
  @Post()
  @Roles(UserRole.CUSTOMER) // CUSTOMER creates orders
  async createOrder(@Req() request: Request) {
    const user = request.user as UserResponse;
    // Create order for current user
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER) // Both can view (with ownership check)
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

**Checklist:**

- [ ] `POST /orders` requires CUSTOMER
- [ ] `GET /orders/:id` has ownership check
- [ ] Tested order creation
- [ ] Tested ownership validation

---

### Step 2.3: MEDIUM Priority Endpoints (Ownership Checks)

#### Users Controller (Self-Access)

**File:** `apps/gateway/src/users/users.controller.ts`

**Additional methods:**

```typescript
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  // ... existing ADMIN methods

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER) // Both roles
  async getUser(@Param('id') id: string, @Req() request: Request) {
    const user = request.user as UserResponse;

    // ADMIN can get any user
    if (user.role === UserRole.ADMIN) {
      return await this.findUser(id);
    }

    // CUSTOMER can only get their own profile
    if (user.id !== id) {
      throw new ForbiddenException('You can only access your own profile');
    }

    return await this.findUser(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER) // Both roles
  async updateUser(@Param('id') id: string, @Req() request: Request) {
    const user = request.user as UserResponse;

    // ADMIN can update any user
    if (user.role === UserRole.ADMIN) {
      return await this.updateUser(id);
    }

    // CUSTOMER can only update their own profile
    if (user.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    return await this.updateUser(id);
  }
}
```

**Checklist:**

- [ ] `GET /users/:id` has ownership check
- [ ] `PUT /users/:id` has ownership check
- [ ] ADMIN can access any user
- [ ] CUSTOMER can only access own profile
- [ ] Tested all scenarios

---

#### Addresses Controller

**File:** `apps/gateway/src/addresses/addresses.controller.ts`

**Changes needed:**

```typescript
import { Controller, Get, Post, Put, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard, RolesGuard, Roles } from '../auth';
import { UserRole } from '@shared/dto/user.dto';

@Controller('addresses')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER) // CUSTOMER manages their own addresses
export class AddressesController {
  @Get()
  async listAddresses(@Req() request: Request) {
    const user = request.user as UserResponse;
    // List addresses for current user
  }

  @Post()
  async createAddress(@Req() request: Request) {
    const user = request.user as UserResponse;
    // Create address for current user
  }

  @Put(':id')
  async updateAddress(@Param('id') id: string, @Req() request: Request) {
    const user = request.user as UserResponse;
    const address = await this.findAddress(id);

    // Ownership check
    if (address.userId !== user.id) {
      throw new ForbiddenException('You can only update your own addresses');
    }

    return await this.updateAddress(id);
  }

  @Delete(':id')
  async deleteAddress(@Param('id') id: string, @Req() request: Request) {
    const user = request.user as UserResponse;
    const address = await this.findAddress(id);

    // Ownership check
    if (address.userId !== user.id) {
      throw new ForbiddenException('You can only delete your own addresses');
    }

    return await this.deleteAddress(id);
  }
}
```

**Checklist:**

- [ ] All address operations require CUSTOMER
- [ ] Update/Delete have ownership checks
- [ ] Tested address CRUD operations
- [ ] Tested ownership validation

---

### Step 2.4: LOW Priority Endpoints

#### AR Controller

**File:** `apps/gateway/src/ar/ar.controller.ts`

**Decision:** Keep public or protect?

**Option 1: Keep Public**

```typescript
@Controller('ar')
export class ArController {
  @Get('models')
  async listModels() {
    // Public access
  }
}
```

**Option 2: Authenticated Access**

```typescript
@Controller('ar')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.CUSTOMER)
export class ArController {
  @Get('models')
  async listModels() {
    // Both roles can access
  }
}
```

**Checklist:**

- [ ] Decided on access level for AR endpoints
- [ ] Applied appropriate guards
- [ ] Tested access

---

## 🧪 Phase 3: Testing

### Step 3.1: Unit Tests

For each modified controller, add unit tests:

```typescript
describe('UsersController', () => {
  it('should list users (ADMIN)', async () => {
    // Mock user with ADMIN role
  });

  it('should deny CUSTOMER from listing users', async () => {
    // Mock user with CUSTOMER role
    // Expect 403
  });
});
```

**Checklist:**

- [ ] Unit tests cho Users controller
- [ ] Unit tests cho Products controller
- [ ] Unit tests cho Orders controller
- [ ] Unit tests cho Cart controller
- [ ] Unit tests cho Payments controller
- [ ] Unit tests cho Addresses controller

---

### Step 3.2: Integration Tests

Test guard interactions:

```bash
pnpm test:integration apps/gateway/src/auth/auth-roles.integration.spec.ts
```

**Checklist:**

- [ ] All integration tests pass
- [ ] Guards work together correctly

---

### Step 3.3: Manual Testing

#### Create Test Tokens

```bash
# Login as ADMIN
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'

# Save token
export ADMIN_TOKEN="<admin-jwt-token>"

# Login as CUSTOMER
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "password": "customer123"}'

# Save token
export CUSTOMER_TOKEN="<customer-jwt-token>"
```

#### Test Matrix

| Endpoint         | No Token | ADMIN Token | CUSTOMER Token | Expected Result  |
| ---------------- | -------- | ----------- | -------------- | ---------------- |
| `GET /users`     | 401      | 200         | 403            | ✅ ADMIN only    |
| `POST /products` | 401      | 200         | 403            | ✅ ADMIN only    |
| `GET /cart`      | 401      | 403         | 200            | ✅ CUSTOMER only |
| `POST /orders`   | 401      | 403         | 200            | ✅ CUSTOMER only |
| `GET /products`  | 200      | 200         | 200            | ✅ Public        |

**Test Commands:**

```bash
# Test: GET /users (ADMIN only)
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3000/users
# Expected: 200

curl -H "Authorization: Bearer $CUSTOMER_TOKEN" http://localhost:3000/users
# Expected: 403

curl http://localhost:3000/users
# Expected: 401

# Test: GET /cart (CUSTOMER only)
curl -H "Authorization: Bearer $CUSTOMER_TOKEN" http://localhost:3000/cart
# Expected: 200

curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3000/cart
# Expected: 403

# Test: POST /products (ADMIN only)
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Product"}' \
  http://localhost:3000/products
# Expected: 200

curl -X POST \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Product"}' \
  http://localhost:3000/products
# Expected: 403
```

**Checklist:**

- [ ] Tested all HIGH priority endpoints
- [ ] Tested all MEDIUM priority endpoints
- [ ] Tested all LOW priority endpoints
- [ ] Verified 401 for missing tokens
- [ ] Verified 403 for wrong roles
- [ ] Verified 200 for correct roles

---

## 📊 Phase 4: Tracking & Reporting

### Migration Progress

| Controller | Total Endpoints | Protected | Public | Progress |
| ---------- | --------------- | --------- | ------ | -------- |
| Auth       | 2               | 0         | 2      | 100%     |
| Health     | 1               | 0         | 1      | 100%     |
| Users      | 5               | 0         | 0      | 0%       |
| Products   | 4               | 0         | 1      | 0%       |
| Orders     | 5               | 0         | 0      | 0%       |
| Cart       | 3               | 0         | 0      | 0%       |
| Payments   | 2               | 0         | 0      | 0%       |
| Addresses  | 4               | 0         | 0      | 0%       |
| AR         | 1               | 0         | 1      | 0%       |
| **TOTAL**  | **27**          | **0**     | **5**  | **0%**   |

**Update this table as you complete each controller.**

---

### Issues Log

| Date       | Issue               | Controller | Status   | Notes                   |
| ---------- | ------------------- | ---------- | -------- | ----------------------- |
| 2025-10-23 | Guards not applying | Users      | Open     | Forgot @UseGuards()     |
| 2025-10-23 | Always 403          | Cart       | Resolved | Wrong role in decorator |

**Add any issues encountered during migration.**

---

## ✅ Final Checklist

### Code Changes

- [ ] All HIGH priority endpoints protected
- [ ] All MEDIUM priority endpoints protected
- [ ] All LOW priority endpoints reviewed
- [ ] Ownership checks implemented where needed
- [ ] Public endpoints remain public

### Testing

- [ ] Unit tests added for all controllers
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Test matrix verified

### Documentation

- [ ] Migration progress tracked
- [ ] Issues logged and resolved
- [ ] Team notified of changes

### Deployment

- [ ] Changes reviewed by team
- [ ] Security review completed
- [ ] Ready for production deployment

---

## 🚀 Completion

**Migration started:** ********\_\_\_\_********

**Migration completed:** ********\_\_\_\_********

**Completed by:** ********\_\_\_\_********

**Sign-off:** ********\_\_\_\_********

---

**Questions?** Check the [User Authorization Guide](./USER-AUTHORIZATION-GUIDE.md) or contact the development team.

**Last Updated:** October 23, 2025
