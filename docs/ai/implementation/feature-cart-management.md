---
phase: implementation
title: Implementation Guide
description: Technical implementation notes, patterns, and code guidelines
---

# Implementation Guide - Cart Management

## Development Setup

**How do we get started?**

### Prerequisites

- Node.js 18+ và pnpm installed
- Docker và Docker Compose running
- PostgreSQL cart database (port 5435) running
- NATS broker (port 4222) running

### Environment Setup Steps

```bash
# 1. Start infrastructure
cd /home/hao/Desktop/luan-van/backend-luan-van
docker-compose up -d cart_db nats

# 2. Run Prisma migrations (if needed)
cd apps/cart-app
pnpm prisma migrate dev

# 3. Generate Prisma client
pnpm prisma generate

# 4. Start cart-app in dev mode
pnpm run start:dev cart-app
```

### Configuration

- **Database:** `DATABASE_URL` in `.env` (already configured)
- **NATS:** `NATS_URL=nats://localhost:4222` (default)
- **Port:** Cart-app runs on port 3003

## Code Structure

**How is the code organized?**

### Directory Structure

```
apps/cart-app/
├── prisma/
│   ├── schema.prisma           # Database schema (no changes)
│   ├── prisma.service.ts       # Prisma client wrapper
│   └── migrations/             # Database migrations
├── src/
│   ├── cart/
│   │   ├── cart.controller.ts  # NATS message handlers
│   │   ├── cart.service.ts     # Business logic
│   │   ├── cart.service.spec.ts # Unit tests
│   │   └── dto/
│   │       ├── get-cart.dto.ts
│   │       ├── add-item.dto.ts
│   │       ├── update-item.dto.ts
│   │       ├── merge-guest-cart.dto.ts
│   │       └── cart-response.dto.ts
│   ├── cart-item/
│   │   ├── cart-item.service.ts     # CartItem CRUD
│   │   ├── cart-item.service.spec.ts
│   │   └── dto/
│   │       └── cart-item.dto.ts
│   ├── product-app/
│   │   ├── product-app.client.ts    # RPC client for product-app
│   │   └── product-app.client.spec.ts
│   ├── cart-app.module.ts      # Module configuration
│   └── main.ts                 # Bootstrap
└── test/
    ├── cart.e2e-spec.ts        # E2E tests
    └── jest-e2e.json           # Jest config
```

### Module Organization

```typescript
@Module({
  imports: [
    // NATS Client for product-app
    ClientsModule.register([
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
        },
      },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService, CartItemService, ProductAppClient, PrismaService],
})
export class CartAppModule {}
```

### Naming Conventions

- **Services:** `*.service.ts` - Business logic
- **Controllers:** `*.controller.ts` - NATS message handlers
- **DTOs:** `*.dto.ts` - Data transfer objects với validation
- **Specs:** `*.spec.ts` - Unit tests
- **E2E:** `*.e2e-spec.ts` - Integration tests

## Implementation Notes

**Key technical details to remember:**

### Core Features

#### Feature 1: Product Integration (ProductAppClient)

**Purpose:** RPC client để gọi product-app

**Implementation:**

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { EntityNotFoundRpcException, ServiceUnavailableRpcException } from '@shared/exceptions';

@Injectable()
export class ProductAppClient {
  constructor(@Inject('PRODUCT_SERVICE') private readonly client: ClientProxy) {}

  async getProductById(productId: string) {
    try {
      const product = await firstValueFrom(
        this.client.send('product.getById', { id: productId }).pipe(
          timeout(5000), // 5s timeout
        ),
      );
      return product;
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new ServiceUnavailableRpcException('Product service không phản hồi');
      }
      // Product not found or other error
      throw error;
    }
  }

  async getProductsByIds(productIds: string[]) {
    if (productIds.length === 0) return [];

    try {
      // Note: Need to implement product.getByIds in product-app first!
      const products = await firstValueFrom(
        this.client.send('product.getByIds', { ids: productIds }).pipe(timeout(5000)),
      );
      return products;
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new ServiceUnavailableRpcException('Product service không phản hồi');
      }
      throw error;
    }
  }
}
```

**Key Points:**

- ✅ Inject `PRODUCT_SERVICE` ClientProxy
- ✅ Use `firstValueFrom()` để convert Observable → Promise
- ✅ Add `timeout(5000)` để tránh hang forever
- ✅ Handle `TimeoutError` → throw `ServiceUnavailableRpcException`
- ⚠️ **IMPORTANT:** Must verify/implement `product.getByIds` event in product-app first!

---

#### Feature 2: Cart Business Logic (CartService)

**Method: getOrCreateCart()**

```typescript
async getOrCreateCart(userId: string) {
  let cart = await this.prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  if (!cart) {
    cart = await this.prisma.cart.create({
      data: { userId },
      include: { items: true },
    });
  }

  return cart;
}
```

**Method: getCartWithProducts()**

```typescript
async getCartWithProducts(userId: string) {
  const cart = await this.getOrCreateCart(userId);

  if (cart.items.length === 0) {
    return {
      cart,
      totalInt: 0,
      items: [],
    };
  }

  // Batch fetch products
  const productIds = cart.items.map(item => item.productId);
  const products = await this.productClient.getProductsByIds(productIds);

  // Create product map for quick lookup
  const productMap = new Map(products.map(p => [p.id, p]));

  // Enrich items with product data
  const enrichedItems = cart.items.map(item => {
    const product = productMap.get(item.productId);
    return {
      ...item,
      product: product || null, // null if product deleted
    };
  });

  // Calculate total (only for available products)
  const totalInt = enrichedItems.reduce((sum, item) => {
    if (item.product) {
      return sum + (item.product.priceInt * item.quantity);
    }
    return sum;
  }, 0);

  return {
    cart: { ...cart, items: enrichedItems },
    totalInt,
  };
}
```

**Method: clearCart()**

```typescript
async clearCart(userId: string) {
  const cart = await this.prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    return { success: true }; // Idempotent
  }

  await this.prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return { success: true };
}
```

**Method: mergeGuestItems()**

```typescript
async mergeGuestItems(userId: string, guestItems: { productId: string; quantity: number }[]) {
  const cart = await this.getOrCreateCart(userId);

  // Use transaction for consistency
  await this.prisma.$transaction(async (tx) => {
    for (const guestItem of guestItems) {
      if (guestItem.quantity <= 0) continue; // Skip invalid items

      const existing = await tx.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: guestItem.productId,
          },
        },
      });

      if (existing) {
        // Add quantities
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + guestItem.quantity },
        });
      } else {
        // Create new item
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: guestItem.productId,
            quantity: guestItem.quantity,
          },
        });
      }
    }
  });

  return {
    cart: { id: cart.id, itemsCount: cart.items.length },
  };
}
```

---

#### Feature 3: CartItem Operations (CartItemService)

**Method: addItem()**

```typescript
async addItem(cartId: string, productId: string, quantity: number) {
  // Validate quantity
  if (quantity <= 0) {
    throw new ValidationRpcException('Số lượng phải lớn hơn 0');
  }

  // Validate product exists
  const product = await this.productClient.getProductById(productId);
  if (!product) {
    throw new EntityNotFoundRpcException('Product', productId);
  }

  // Upsert CartItem (add or update)
  const cartItem = await this.prisma.cartItem.upsert({
    where: {
      cartId_productId: { cartId, productId },
    },
    update: {
      quantity: { increment: quantity }, // Add to existing
    },
    create: {
      cartId,
      productId,
      quantity,
    },
  });

  return cartItem;
}
```

**Method: updateQuantity()**

```typescript
async updateQuantity(cartId: string, productId: string, quantity: number) {
  // Validate quantity
  if (quantity < 0) {
    throw new ValidationRpcException('Số lượng không hợp lệ');
  }

  const cartItem = await this.prisma.cartItem.findUnique({
    where: {
      cartId_productId: { cartId, productId },
    },
  });

  if (!cartItem) {
    throw new EntityNotFoundRpcException('CartItem', productId);
  }

  // Delete if quantity = 0
  if (quantity === 0) {
    await this.prisma.cartItem.delete({
      where: { id: cartItem.id },
    });
    return null;
  }

  // Update quantity
  const updated = await this.prisma.cartItem.update({
    where: { id: cartItem.id },
    data: { quantity },
  });

  return updated;
}
```

**Method: removeItem()**

```typescript
async removeItem(cartId: string, productId: string) {
  // Idempotent: no error if not exists
  await this.prisma.cartItem.deleteMany({
    where: {
      cartId,
      productId,
    },
  });

  return { success: true };
}
```

---

#### Feature 4: Controller Message Handlers (CartController)

**Pattern:** All handlers follow same structure:

1. Extract data from payload
2. Validate DTO
3. Call service method
4. Handle errors
5. Return result

**Example: addItem()**

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { EVENTS } from '@shared/events';
import { AddItemDto } from './dto/add-item.dto';

@Controller()
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly cartItemService: CartItemService,
  ) {}

  @MessagePattern(EVENTS.CART.ADD_ITEM)
  async addItem(data: AddItemDto) {
    try {
      const cart = await this.cartService.getOrCreateCart(data.userId);
      const cartItem = await this.cartItemService.addItem(cart.id, data.productId, data.quantity);
      return { cartItem };
    } catch (error) {
      console.error('[CartController] addItem error:', {
        userId: data.userId,
        productId: data.productId,
        error: error.message,
      });

      // Re-throw RPC exceptions
      if (error instanceof RpcException) {
        throw error;
      }

      // Wrap unexpected errors
      throw new InternalServerRpcException('Lỗi thêm sản phẩm vào giỏ hàng');
    }
  }
}
```

**Key Points:**

- ✅ Use `@MessagePattern(EVENTS.CART.*)` decorator
- ✅ Log errors với context (userId, productId)
- ✅ Re-throw RPC exceptions as-is
- ✅ Wrap unknown errors trong `InternalServerRpcException`

### Patterns & Best Practices

#### Pattern 1: DTO Validation

**Use class-validator decorators:**

```typescript
import { IsString, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AddItemDto {
  @IsString()
  userId: string;

  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class MergeGuestCartDto {
  @IsString()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestItemDto)
  guestItems: GuestItemDto[];
}

class GuestItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
```

#### Pattern 2: Prisma Transactions

**Use for multi-step operations:**

```typescript
await this.prisma.$transaction(async (tx) => {
  // All operations use tx instead of this.prisma
  const cart = await tx.cart.findUnique(...);
  await tx.cartItem.create(...);
  await tx.cartItem.update(...);
});
```

#### Pattern 3: Prisma Upsert

**Use instead of findFirst + create/update:**

```typescript
// Good: Atomic upsert
const item = await this.prisma.cartItem.upsert({
  where: { cartId_productId: { cartId, productId } },
  update: { quantity: { increment: qty } },
  create: { cartId, productId, quantity: qty },
});

// Bad: Race condition possible
const existing = await this.prisma.cartItem.findFirst(...);
if (existing) {
  await this.prisma.cartItem.update(...);
} else {
  await this.prisma.cartItem.create(...);
}
```

#### Pattern 4: Error Logging

**Log errors with context:**

```typescript
try {
  // ... operation
} catch (error) {
  console.error('[ServiceName] methodName error:', {
    userId,
    productId,
    error: error.message,
    stack: error.stack, // Only in dev
  });
  throw error;
}
```

## Integration Points

**How do pieces connect?**

### Product-App Integration

**Events Used:**

- `product.getById` - Get single product
- `product.getByIds` - Batch get products (MUST IMPLEMENT!)

**Data Contract:**

```typescript
// Request: product.getById
{ id: string }

// Response
{
  id: string;
  name: string;
  sku: string;
  priceInt: number;
  imageUrls: string[];
  slug: string;
  stock: number;
  // ... other fields
}

// Request: product.getByIds
{ ids: string[] }

// Response
Array<ProductResponse>
```

### Gateway Integration

**Routes Already Defined in `apps/gateway/src/cart/`:**

- Verify routes exist and match events
- No changes needed if routes already set up

## Error Handling

**How do we handle failures?**

### RPC Exception Strategy

Follow `docs/knowledge/RPC-EXCEPTIONS-GUIDE.md`:

| Exception                        | When                   | Status | Example Message                   |
| -------------------------------- | ---------------------- | ------ | --------------------------------- |
| `EntityNotFoundRpcException`     | Product/Cart not found | 404    | `Sản phẩm không tồn tại`          |
| `ValidationRpcException`         | Invalid input          | 400    | `Số lượng phải lớn hơn 0`         |
| `ServiceUnavailableRpcException` | Product-app timeout    | 503    | `Service tạm thời không khả dụng` |
| `InternalServerRpcException`     | Unexpected error       | 500    | `Lỗi xử lý giỏ hàng`              |

### Logging Approach

- ✅ Console.error cho errors (includes stack trace)
- ✅ Console.log cho debug info (development only)
- ✅ Include context: userId, productId, cartId
- ❌ Không log sensitive data (passwords, tokens)

## Performance Considerations

**How do we keep it fast?**

### Optimization Strategy 1: Batch Product Fetch

**Problem:** N RPC calls for N products
**Solution:** 1 RPC call with array of IDs

```typescript
// Good: Batch fetch
const products = await this.productClient.getProductsByIds(productIds);

// Bad: N+1 queries
for (const item of items) {
  const product = await this.productClient.getProductById(item.productId);
}
```

### Optimization Strategy 2: Prisma Includes

**Problem:** Multiple queries for cart + items
**Solution:** Use `include`

```typescript
// Good: 1 query
const cart = await this.prisma.cart.findUnique({
  where: { userId },
  include: { items: true },
});

// Bad: 2 queries
const cart = await this.prisma.cart.findUnique({ where: { userId } });
const items = await this.prisma.cartItem.findMany({ where: { cartId: cart.id } });
```

### Caching Approach (Future Optimization)

**Out of scope for MVP, but consider:**

- Redis cache cho product data (TTL 5 min)
- In-memory cache cho cart (TTL 1 min)

### Resource Management

- ✅ RPC timeout: 5s
- ✅ Prisma connection pooling (default)
- ✅ Transaction timeout: default 5s (acceptable)

## Security Notes

**What security measures are in place?**

### Authentication/Authorization

- **Gateway validates JWT** và extract userId
- **Cart-app receives userId** từ gateway (trusted)
- **No additional auth needed** trong cart-app
- **User isolation:** Cart queries filtered by userId

### Input Validation

- ✅ All DTOs use `class-validator`
- ✅ Validate quantity > 0
- ✅ Validate productId format (string, not empty)
- ✅ Validate userId format (comes from JWT)

### Data Protection

- ❌ **No sensitive data in cart** (no credit cards, passwords)
- ✅ **Cart data scoped to user:** WHERE userId = ?
- ✅ **Prisma prevents SQL injection** (parameterized queries)

### Secrets Management

- ✅ Database URL in `.env` (not committed)
- ✅ NATS URL in environment variables
- ✅ No hardcoded credentials

## Testing Strategy Reference

**See `docs/ai/testing/feature-cart-management.md` for:**

- Unit test cases
- E2E test scenarios
- Coverage goals
- Test data setup

## Common Pitfalls to Avoid

❌ **Don't use `findFirst` + `create`** → Use `upsert` for atomicity
❌ **Don't forget timeout** on RPC calls → Always add `timeout(5000)`
❌ **Don't throw generic errors** → Use specific RPC exceptions
❌ **Don't log full product objects** → Log IDs only for performance
❌ **Don't validate stock in cart** → Only validate at checkout
