---
phase: testing
title: Testing Strategy
description: Define testing approach, test cases, and quality assurance
---

# Testing Strategy - Cart Management

## Test Coverage Goals

**What level of testing do we aim for?**

- **Unit test coverage target:** 100% cho tất cả code mới (CartService, CartItemService, ProductAppClient, CartController)
- **Integration test scope:**
  - Tất cả NATS message handlers
  - Database operations với Prisma
  - RPC calls đến product-app (mocked trong unit, real trong E2E)
  - Error handling và edge cases
- **End-to-end test scenarios:**
  - Full user journeys: add → update → get → remove → clear
  - Guest cart merge flow
  - Product not found handling
- **Alignment:** Tất cả acceptance criteria trong `feature-cart-management.md` requirements được cover

## Unit Tests

**What individual components need testing?**

### Component 1: ProductAppClient (`product-app.client.spec.ts`)

#### Test Suite: getProductById()

- [ ] **Test 1.1:** Should return product when found
  - Mock: `client.send()` returns valid product
  - Expect: Product object returned
- [ ] **Test 1.2:** Should throw EntityNotFoundRpcException when product not found
  - Mock: `client.send()` throws 404 error
  - Expect: EntityNotFoundRpcException thrown

- [ ] **Test 1.3:** Should throw ServiceUnavailableRpcException on timeout
  - Mock: `client.send()` delays > 5s
  - Expect: ServiceUnavailableRpcException with message "Product service không phản hồi"

- [ ] **Test 1.4:** Should propagate other RPC errors
  - Mock: `client.send()` throws InternalServerRpcException
  - Expect: Same exception re-thrown

#### Test Suite: getProductsByIds()

- [ ] **Test 2.1:** Should return array of products for valid IDs
  - Mock: `client.send()` returns array [product1, product2]
  - Expect: Array returned with correct length

- [ ] **Test 2.2:** Should return empty array for empty input
  - Input: `[]`
  - Expect: `[]` (no RPC call made)

- [ ] **Test 2.3:** Should handle timeout gracefully
  - Mock: Timeout after 5s
  - Expect: ServiceUnavailableRpcException

**Coverage target:** 100% (all branches)

---

### Component 2: CartService (`cart.service.spec.ts`)

#### Test Suite: getOrCreateCart()

- [ ] **Test 3.1:** Should return existing cart if found
  - Mock: `prisma.cart.findUnique()` returns cart with items
  - Expect: Cart returned, no create call

- [ ] **Test 3.2:** Should create new cart if not found
  - Mock: `prisma.cart.findUnique()` returns null
  - Mock: `prisma.cart.create()` returns new cart
  - Expect: New cart returned

- [ ] **Test 3.3:** Should include items in result
  - Mock: Cart with 2 items
  - Expect: `cart.items.length === 2`

#### Test Suite: getCartWithProducts()

- [ ] **Test 4.1:** Should return cart with enriched product data
  - Mock: Cart with 2 items (productId: 'p1', 'p2')
  - Mock: `productClient.getProductsByIds()` returns [product1, product2]
  - Expect: Items have `product` field populated
  - Expect: `totalInt` calculated correctly

- [ ] **Test 4.2:** Should handle product not found gracefully
  - Mock: Cart with 2 items, but product2 deleted
  - Mock: `productClient.getProductsByIds()` returns [product1]
  - Expect: item1.product = product1, item2.product = null
  - Expect: Total only includes product1 price

- [ ] **Test 4.3:** Should return empty cart with totalInt = 0
  - Mock: Cart with no items
  - Expect: No RPC call to product-app
  - Expect: `totalInt = 0`

- [ ] **Test 4.4:** Should calculate total correctly
  - Mock: Cart with items: [{ productId: 'p1', quantity: 2 }, { productId: 'p2', quantity: 3 }]
  - Mock: Products: [{ id: 'p1', priceInt: 1000 }, { id: 'p2', priceInt: 2000 }]
  - Expect: `totalInt = (2 * 1000) + (3 * 2000) = 8000`

#### Test Suite: clearCart()

- [ ] **Test 5.1:** Should delete all items from cart
  - Mock: Cart exists with 3 items
  - Mock: `prisma.cartItem.deleteMany()` succeeds
  - Expect: `{ success: true }`

- [ ] **Test 5.2:** Should be idempotent if cart not found
  - Mock: `prisma.cart.findUnique()` returns null
  - Expect: `{ success: true }`, no deleteMany call

- [ ] **Test 5.3:** Should be idempotent if cart is already empty
  - Mock: Cart exists but no items
  - Expect: `{ success: true }`

#### Test Suite: mergeGuestItems()

- [ ] **Test 6.1:** Should add new items from guest cart
  - Mock: User cart empty
  - Input: guestItems = [{ productId: 'p1', quantity: 2 }]
  - Expect: CartItem created with quantity 2

- [ ] **Test 6.2:** Should merge duplicate items (add quantities)
  - Mock: User cart has item { productId: 'p1', quantity: 3 }
  - Input: guestItems = [{ productId: 'p1', quantity: 2 }]
  - Expect: CartItem updated to quantity 5

- [ ] **Test 6.3:** Should handle mix of new and duplicate items
  - Mock: User cart has [{ productId: 'p1', quantity: 1 }]
  - Input: guestItems = [{ productId: 'p1', quantity: 2 }, { productId: 'p2', quantity: 3 }]
  - Expect: p1 quantity = 3, p2 created with quantity 3

- [ ] **Test 6.4:** Should skip items with quantity <= 0
  - Input: guestItems = [{ productId: 'p1', quantity: 0 }, { productId: 'p2', quantity: -1 }]
  - Expect: No items created

- [ ] **Test 6.5:** Should use transaction for consistency
  - Verify: `prisma.$transaction()` called
  - Expect: All operations inside transaction

**Coverage target:** 100%

---

### Component 3: CartItemService (`cart-item.service.spec.ts`)

#### Test Suite: addItem()

- [ ] **Test 7.1:** Should create new CartItem if not exists
  - Mock: Product exists
  - Mock: CartItem not found → create new
  - Expect: CartItem created with correct quantity

- [ ] **Test 7.2:** Should increment quantity if item already exists
  - Mock: Product exists
  - Mock: CartItem exists with quantity 3
  - Input: Add quantity 2
  - Expect: Quantity updated to 5 (via upsert increment)

- [ ] **Test 7.3:** Should throw ValidationRpcException if quantity <= 0
  - Input: quantity = 0
  - Expect: ValidationRpcException("Số lượng phải lớn hơn 0")
- [ ] **Test 7.4:** Should throw EntityNotFoundRpcException if product not found
  - Mock: `productClient.getProductById()` throws EntityNotFoundRpcException
  - Expect: Same exception propagated

- [ ] **Test 7.5:** Should use Prisma upsert for atomicity
  - Verify: `prisma.cartItem.upsert()` called
  - Expect: Correct where clause (cartId_productId)

#### Test Suite: updateQuantity()

- [ ] **Test 8.1:** Should update quantity to new value
  - Mock: CartItem exists with quantity 3
  - Input: Update to quantity 5
  - Expect: CartItem.quantity = 5

- [ ] **Test 8.2:** Should delete item if quantity = 0
  - Mock: CartItem exists
  - Input: Update to quantity 0
  - Expect: `prisma.cartItem.delete()` called
  - Expect: Return null

- [ ] **Test 8.3:** Should throw ValidationRpcException if quantity < 0
  - Input: quantity = -1
  - Expect: ValidationRpcException("Số lượng không hợp lệ")

- [ ] **Test 8.4:** Should throw EntityNotFoundRpcException if item not found
  - Mock: CartItem not found
  - Expect: EntityNotFoundRpcException("CartItem", productId)

#### Test Suite: removeItem()

- [ ] **Test 9.1:** Should delete item if exists
  - Mock: CartItem exists
  - Expect: `prisma.cartItem.deleteMany()` called
  - Expect: `{ success: true }`

- [ ] **Test 9.2:** Should be idempotent if item not exists
  - Mock: deleteMany returns { count: 0 }
  - Expect: `{ success: true }`, no error

**Coverage target:** 100%

---

### Component 4: CartController (`cart.controller.spec.ts`)

#### Test Suite: Message Handlers

- [ ] **Test 10.1:** getCart() should call CartService.getCartWithProducts()
  - Mock: Service returns cart data
  - Expect: Same data returned from handler

- [ ] **Test 10.2:** addItem() should call getOrCreateCart + addItem
  - Mock: Both service methods
  - Expect: CartItem returned

- [ ] **Test 10.3:** updateItem() should call updateQuantity()
  - Mock: Service returns updated item
  - Expect: Updated item returned

- [ ] **Test 10.4:** removeItem() should call removeItem()
  - Mock: Service succeeds
  - Expect: `{ success: true }`

- [ ] **Test 10.5:** clearCart() should call clearCart()
  - Mock: Service succeeds
  - Expect: `{ success: true }`

- [ ] **Test 10.6:** mergeGuestCart() should call mergeGuestItems()
  - Mock: Service returns cart summary
  - Expect: Cart summary returned

#### Test Suite: Error Handling

- [ ] **Test 11.1:** Should re-throw RPC exceptions
  - Mock: Service throws ValidationRpcException
  - Expect: Same exception thrown from controller

- [ ] **Test 11.2:** Should wrap unexpected errors
  - Mock: Service throws generic Error
  - Expect: InternalServerRpcException thrown

- [ ] **Test 11.3:** Should log errors with context
  - Mock: Service throws error
  - Verify: console.error called with userId, productId

**Coverage target:** 100%

---

## Integration Tests (E2E)

**How do we test component interactions?**

### Setup: `apps/cart-app/test/cart.e2e-spec.ts`

```typescript
import { INestMicroservice } from '@nestjs/common';
import { ClientProxy, Transport } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { firstValueFrom } from 'rxjs';
import { EVENTS } from '@shared/events';
import { PrismaService } from '../prisma/prisma.service';

describe('Cart E2E Tests', () => {
  let app: INestMicroservice;
  let client: ClientProxy;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Setup test app
    const moduleRef = await Test.createTestingModule({
      imports: [CartAppModule],
    }).compile();

    app = moduleRef.createNestMicroservice({
      transport: Transport.NATS,
      options: { servers: ['nats://localhost:4222'] },
    });

    await app.listen();

    // Setup test client
    client = new ClientProxy({ ... });
    await client.connect();

    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await client.close();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
  });
});
```

### E2E Test Scenarios

#### Scenario 1: Add Item Flow

- [ ] **E2E-1.1:** Add item to new cart
  - Call: `cart.addItem` với userId mới
  - Expect: Cart created automatically
  - Expect: CartItem created with correct quantity
  - Verify: Database has 1 Cart, 1 CartItem

- [ ] **E2E-1.2:** Add same item twice (quantity increases)
  - Call: `cart.addItem` lần 1 với quantity 2
  - Call: `cart.addItem` lần 2 với quantity 3
  - Expect: CartItem quantity = 5
  - Verify: Database has only 1 CartItem (not 2)

- [ ] **E2E-1.3:** Add item with invalid product ID
  - Mock: product-app returns 404
  - Call: `cart.addItem` với productId không tồn tại
  - Expect: EntityNotFoundRpcException (404)

- [ ] **E2E-1.4:** Add item with quantity <= 0
  - Call: `cart.addItem` với quantity 0
  - Expect: ValidationRpcException (400)

#### Scenario 2: Update Item Flow

- [ ] **E2E-2.1:** Update quantity of existing item
  - Setup: Cart with item quantity 3
  - Call: `cart.updateItem` với quantity 5
  - Expect: CartItem.quantity = 5
  - Verify: Database updated

- [ ] **E2E-2.2:** Update quantity to 0 (delete item)
  - Setup: Cart with 2 items
  - Call: `cart.updateItem` với quantity 0
  - Expect: Item deleted
  - Verify: Database has only 1 CartItem remaining

- [ ] **E2E-2.3:** Update non-existing item
  - Call: `cart.updateItem` với productId không có trong cart
  - Expect: EntityNotFoundRpcException (404)

- [ ] **E2E-2.4:** Update with negative quantity
  - Call: `cart.updateItem` với quantity -1
  - Expect: ValidationRpcException (400)

#### Scenario 3: Remove Item Flow

- [ ] **E2E-3.1:** Remove existing item
  - Setup: Cart with 2 items
  - Call: `cart.removeItem` với productId của item 1
  - Expect: `{ success: true }`
  - Verify: Database has only 1 CartItem

- [ ] **E2E-3.2:** Remove non-existing item (idempotent)
  - Call: `cart.removeItem` với productId không tồn tại
  - Expect: `{ success: true }`, no error

#### Scenario 4: Get Cart Flow

- [ ] **E2E-4.1:** Get cart with products
  - Setup: Cart with 2 items (productId: 'p1', 'p2')
  - Mock: product-app returns both products
  - Call: `cart.get`
  - Expect: Cart returned với items enriched
  - Expect: `totalInt` calculated correctly

- [ ] **E2E-4.2:** Get empty cart (auto-create)
  - Call: `cart.get` với userId mới
  - Expect: Empty cart created
  - Expect: `items = []`, `totalInt = 0`

- [ ] **E2E-4.3:** Get cart when product deleted
  - Setup: Cart with item (productId: 'deleted-product')
  - Mock: product-app returns 404 for that product
  - Call: `cart.get`
  - Expect: Item has `product: null`
  - Expect: Total excludes deleted product

#### Scenario 5: Clear Cart Flow

- [ ] **E2E-5.1:** Clear cart with items
  - Setup: Cart with 3 items
  - Call: `cart.clear`
  - Expect: `{ success: true }`
  - Verify: Database has 0 CartItems for that cart

- [ ] **E2E-5.2:** Clear empty cart (idempotent)
  - Setup: Cart with no items
  - Call: `cart.clear`
  - Expect: `{ success: true }`, no error

- [ ] **E2E-5.3:** Clear non-existing cart (idempotent)
  - Call: `cart.clear` với userId không có cart
  - Expect: `{ success: true }`, no error

#### Scenario 6: Merge Guest Cart Flow

- [ ] **E2E-6.1:** Merge into empty user cart
  - Setup: User has no cart
  - Input: guestItems = [{ productId: 'p1', quantity: 2 }, { productId: 'p2', quantity: 3 }]
  - Call: `cart.merge`
  - Expect: Cart created with 2 items
  - Verify: Database has correct items

- [ ] **E2E-6.2:** Merge with duplicate products (add quantities)
  - Setup: User cart has [{ productId: 'p1', quantity: 3 }]
  - Input: guestItems = [{ productId: 'p1', quantity: 2 }]
  - Call: `cart.merge`
  - Expect: p1 quantity = 5
  - Verify: Database has 1 CartItem with quantity 5

- [ ] **E2E-6.3:** Merge with mix of new and duplicate
  - Setup: User cart has [{ productId: 'p1', quantity: 1 }]
  - Input: guestItems = [{ productId: 'p1', quantity: 2 }, { productId: 'p2', quantity: 3 }]
  - Call: `cart.merge`
  - Expect: 2 items: p1 (quantity 3), p2 (quantity 3)

- [ ] **E2E-6.4:** Merge empty guest cart (no-op)
  - Setup: User cart has items
  - Input: guestItems = []
  - Call: `cart.merge`
  - Expect: User cart unchanged

#### Scenario 7: Complex Workflows

- [ ] **E2E-7.1:** Full workflow: Add → Update → Get → Remove → Clear
  1. Add item 'p1' quantity 2
  2. Update 'p1' to quantity 5
  3. Get cart (verify quantity 5, total correct)
  4. Add item 'p2' quantity 3
  5. Remove 'p1'
  6. Get cart (verify only 'p2' remains)
  7. Clear cart
  8. Get cart (verify empty)

- [ ] **E2E-7.2:** Concurrent users (isolation test)
  - User A adds item 'p1' to their cart
  - User B adds item 'p1' to their cart
  - Verify: Each user has separate cart
  - Verify: User A's cart doesn't affect User B

#### Scenario 8: Error Scenarios

- [ ] **E2E-8.1:** Product-app timeout
  - Mock: product-app takes > 5s to respond
  - Call: `cart.get`
  - Expect: ServiceUnavailableRpcException (503)

- [ ] **E2E-8.2:** Database connection lost
  - Mock: Prisma throws connection error
  - Call: `cart.addItem`
  - Expect: InternalServerRpcException (500)

## Test Data

**What data do we use for testing?**

### Test Fixtures

```typescript
// Mock Products
export const mockProducts = {
  p1: {
    id: 'p1',
    name: 'Product 1',
    sku: 'SKU001',
    priceInt: 10000,
    imageUrls: ['https://example.com/p1.jpg'],
    slug: 'product-1',
    stock: 100,
  },
  p2: {
    id: 'p2',
    name: 'Product 2',
    sku: 'SKU002',
    priceInt: 20000,
    imageUrls: ['https://example.com/p2.jpg'],
    slug: 'product-2',
    stock: 50,
  },
};

// Mock Users
export const mockUsers = {
  user1: 'user-123-abc',
  user2: 'user-456-def',
};
```

### Seed Data (E2E Tests)

```typescript
async function seedCart(
  prisma: PrismaService,
  userId: string,
  items: Array<{ productId: string; quantity: number }>,
) {
  const cart = await prisma.cart.create({
    data: { userId },
  });

  for (const item of items) {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: item.productId,
        quantity: item.quantity,
      },
    });
  }

  return cart;
}
```

## Test Reporting & Coverage

**How do we verify and communicate test results?**

### Coverage Commands

```bash
# Run unit tests with coverage
pnpm run test --coverage -- apps/cart-app/src

# Run E2E tests
pnpm run test:e2e -- apps/cart-app/test/cart.e2e-spec.ts

# Generate coverage report
pnpm run test:cov
```

### Coverage Thresholds

- **Lines:** 100%
- **Functions:** 100%
- **Branches:** 100%
- **Statements:** 100%

### Coverage Report

```
File                       | % Stmts | % Branch | % Funcs | % Lines |
---------------------------|---------|----------|---------|---------|
cart.service.ts            |  100    |   100    |   100   |   100   |
cart-item.service.ts       |  100    |   100    |   100   |   100   |
cart.controller.ts         |  100    |   100    |   100   |   100   |
product-app.client.ts      |  100    |   100    |   100   |   100   |
```

### Coverage Gaps

**None expected.** Nếu có coverage < 100%, document lý do:

- Edge cases không thể test (VD: Prisma internal errors)
- Third-party library code (không thuộc trách nhiệm)

## Manual Testing

**What requires human validation?**

### Manual Testing Checklist

- [ ] **Test 1:** Start cart-app và verify NATS connection
  - Command: `pnpm run start:dev cart-app`
  - Check logs: "Microservice is listening"

- [ ] **Test 2:** Test via Gateway HTTP endpoints
  - Use `https/cart.http` file (create if needed)
  - Test: POST /cart/items (add item)
  - Test: GET /cart (get cart)
  - Test: PATCH /cart/items/:productId (update)
  - Test: DELETE /cart/items/:productId (remove)
  - Test: DELETE /cart (clear)
  - Test: POST /cart/merge (merge guest cart)

- [ ] **Test 3:** Verify database state
  - Tool: PgAdmin or `psql`
  - Check: Carts table has correct userId
  - Check: CartItems have correct quantities
  - Check: No orphan CartItems after delete

- [ ] **Test 4:** Test error messages
  - Try add invalid product → should see "Sản phẩm không tồn tại"
  - Try update with negative quantity → should see "Số lượng không hợp lệ"

### Browser/Device Compatibility

**Out of scope:** Cart-app is backend microservice, no browser testing

### Smoke Tests After Deployment

- [ ] Health check: `GET /health` (if implemented)
- [ ] Add item flow end-to-end
- [ ] Get cart flow end-to-end
- [ ] Check logs for errors

## Performance Testing

**How do we validate performance?**

### Load Testing Scenarios (Optional)

**Out of scope for MVP**, nhưng có thể thêm sau:

- **Scenario 1:** 100 concurrent users add items
  - Tool: Artillery or k6
  - Metric: Response time < 200ms (p95)

- **Scenario 2:** Get cart with 50 items
  - Measure: Product-app batch fetch time
  - Target: < 100ms

### Stress Testing

**Out of scope for luận văn**

### Performance Benchmarks

- ✅ `cart.addItem`: < 100ms
- ✅ `cart.get`: < 200ms (with 50 items)
- ✅ `cart.merge`: < 500ms (with 20 guest items)
- ✅ RPC timeout: 5s max

## Bug Tracking

**How do we manage issues?**

### Issue Tracking Process

1. **Discover bug** (unit test, E2E test, hoặc manual test)
2. **Document bug:**
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Error message/stack trace
3. **Fix bug** và add regression test
4. **Verify fix** với test suite

### Bug Severity Levels

- **Critical:** Application crash, data loss
- **High:** Feature không hoạt động, blocking
- **Medium:** Feature hoạt động nhưng có lỗi nhỏ
- **Low:** UI/UX issue, không ảnh hưởng functionality

### Regression Testing Strategy

- ✅ All unit tests re-run after mỗi code change
- ✅ All E2E tests re-run trước khi merge
- ✅ Add new test case cho mỗi bug fix

## Test Execution Checklist

**Before marking feature complete:**

- [ ] All unit tests pass (100% coverage)
- [ ] All E2E tests pass
- [ ] Manual testing checklist completed
- [ ] No linter errors (`pnpm run lint`)
- [ ] Code formatted (`pnpm run format`)
- [ ] Documentation updated (this file, implementation notes)
- [ ] Coverage report generated và reviewed
- [ ] All RPC exceptions tested (404, 400, 503, 500)
- [ ] Edge cases covered (empty cart, deleted products, concurrent users)

## Next Steps After Testing

1. ✅ Review test coverage report
2. ✅ Run `/code-review` command (if available)
3. ✅ Update `feature-cart-management-implementation.md` với testing notes
4. ✅ Prepare for deployment (update CHANGELOG, README if needed)
5. ✅ Create Pull Request với test results in description
