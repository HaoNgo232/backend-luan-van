---
phase: planning
title: Project Planning & Task Breakdown
description: Break down work into actionable tasks and estimate timeline
---

# Project Planning & Task Breakdown - Cart Management

## Milestones

**What are the major checkpoints?**

- [x] **M0:** Requirements & Design Documentation (COMPLETED)
- [ ] **M1:** Core Cart Logic Implementation (CartService + CartItemService)
- [ ] **M2:** Product Integration (RPC calls to product-app)
- [ ] **M3:** Unit Tests (100% coverage)
- [ ] **M4:** E2E Tests & Manual Testing
- [ ] **M5:** Code Review & Deployment Ready

## Task Breakdown

**What specific work needs to be done?**

### Phase 1: Foundation & Setup

**Goal:** Chuẩn bị codebase và dependencies

- [ ] **Task 1.1:** Review existing cart-app structure
  - Check `apps/cart-app/src/cart/` files
  - Check `apps/cart-app/src/cart-item/` files
  - Check Prisma schema in `apps/cart-app/prisma/schema.prisma`
  - Verify NATS events in `libs/shared/events.ts`
  - **Estimate:** 30 minutes

- [ ] **Task 1.2:** Verify shared DTOs
  - Check `libs/shared/dto/` for cart-related DTOs
  - Create missing DTOs if needed (AddItemDto, UpdateItemDto, etc.)
  - **Estimate:** 30 minutes

- [ ] **Task 1.3:** Setup ProductAppClient
  - Create `product-app.client.ts` in cart-app
  - Inject ClientProxy for NATS communication
  - Implement `getProductById()` and `getProductsByIds()` methods
  - Add timeout handling (5s)
  - **Estimate:** 1 hour

### Phase 2: Cart Service Implementation

**Goal:** Implement core business logic

- [ ] **Task 2.1:** Implement CartService.getOrCreateCart()
  - Find cart by userId
  - Auto-create if not exists
  - Return cart with items
  - **Estimate:** 30 minutes

- [ ] **Task 2.2:** Implement CartService.getCartWithProducts()
  - Get cart with items
  - Batch fetch product details from product-app
  - Enrich items with product data
  - Calculate totalInt
  - Handle product not found (set product: null)
  - **Estimate:** 1.5 hours

- [ ] **Task 2.3:** Implement CartService.clearCart()
  - Delete all CartItems for cart
  - Return success
  - **Estimate:** 30 minutes

- [ ] **Task 2.4:** Implement CartService.mergeGuestItems()
  - Get or create user cart
  - For each guest item:
    - Check if productId exists in cart → add quantity
    - Else create new CartItem
  - Validate quantity > 0
  - **Estimate:** 1.5 hours

### Phase 3: CartItem Service Implementation

**Goal:** CRUD operations cho CartItem

- [ ] **Task 3.1:** Implement CartItemService.addItem()
  - Validate product exists (call product-app)
  - Check if CartItem already exists → update quantity
  - Else create new CartItem
  - Validate quantity > 0
  - **Estimate:** 1 hour

- [ ] **Task 3.2:** Implement CartItemService.updateQuantity()
  - Find CartItem by cartId + productId
  - If quantity = 0 → delete CartItem
  - Else update quantity
  - Throw error if quantity < 0
  - **Estimate:** 45 minutes

- [ ] **Task 3.3:** Implement CartItemService.removeItem()
  - Delete CartItem by cartId + productId
  - Idempotent (no error if not exists)
  - **Estimate:** 30 minutes

- [ ] **Task 3.4:** Implement CartItemService.findByCartAndProduct()
  - Helper method to find CartItem
  - Used by other methods
  - **Estimate:** 15 minutes

### Phase 4: Controller Integration

**Goal:** Wire up NATS message handlers

- [ ] **Task 4.1:** Implement CartController.getCart()
  - Handle `EVENTS.CART.GET` message
  - Extract userId from payload
  - Call CartService.getCartWithProducts()
  - Handle errors and throw RPC exceptions
  - **Estimate:** 30 minutes

- [ ] **Task 4.2:** Implement CartController.addItem()
  - Handle `EVENTS.CART.ADD_ITEM` message
  - Validate DTO (AddItemDto)
  - Call CartService.getOrCreateCart() + CartItemService.addItem()
  - Return CartItem
  - **Estimate:** 45 minutes

- [ ] **Task 4.3:** Implement CartController.updateItem()
  - Handle `EVENTS.CART.UPDATE_ITEM` message
  - Validate DTO (UpdateItemDto)
  - Call CartItemService.updateQuantity()
  - Return updated CartItem or null (if deleted)
  - **Estimate:** 30 minutes

- [ ] **Task 4.4:** Implement CartController.removeItem()
  - Handle `EVENTS.CART.REMOVE_ITEM` message
  - Call CartItemService.removeItem()
  - Return success
  - **Estimate:** 20 minutes

- [ ] **Task 4.5:** Implement CartController.clearCart()
  - Handle `EVENTS.CART.CLEAR` message
  - Call CartService.clearCart()
  - Return success
  - **Estimate:** 20 minutes

- [ ] **Task 4.6:** Implement CartController.mergeGuestCart()
  - Handle `EVENTS.CART.MERGE` message
  - Validate DTO (MergeGuestCartDto)
  - Call CartService.mergeGuestItems()
  - Return cart summary
  - **Estimate:** 30 minutes

### Phase 5: Unit Testing

**Goal:** 100% coverage cho business logic

- [ ] **Task 5.1:** Unit tests cho CartService
  - Test getOrCreateCart() - new cart và existing cart
  - Test getCartWithProducts() - with products, without products, product not found
  - Test clearCart() - success case
  - Test mergeGuestItems() - merge logic, duplicate products
  - Mock PrismaService và ProductAppClient
  - **Estimate:** 3 hours

- [ ] **Task 5.2:** Unit tests cho CartItemService
  - Test addItem() - new item, existing item (quantity add), product not found
  - Test updateQuantity() - increase, decrease, zero (delete), negative (error)
  - Test removeItem() - exists, not exists (idempotent)
  - Test findByCartAndProduct()
  - Mock PrismaService và ProductAppClient
  - **Estimate:** 2.5 hours

- [ ] **Task 5.3:** Unit tests cho CartController
  - Test all message handlers
  - Test error handling (RPC exceptions)
  - Mock CartService và CartItemService
  - **Estimate:** 2 hours

- [ ] **Task 5.4:** Unit tests cho ProductAppClient
  - Test getProductById() - success, not found, timeout
  - Test getProductsByIds() - success, empty array
  - Mock ClientProxy
  - **Estimate:** 1 hour

### Phase 6: E2E Testing

**Goal:** Integration tests với database và NATS

- [ ] **Task 6.1:** Setup E2E test environment
  - Create `apps/cart-app/test/cart.e2e-spec.ts`
  - Setup test database (same as other e2e tests)
  - Setup NATS client
  - **Estimate:** 1 hour

- [ ] **Task 6.2:** E2E test - Add item flow
  - Test add new item
  - Test add existing item (quantity increase)
  - Test add with invalid product (404 error)
  - **Estimate:** 1.5 hours

- [ ] **Task 6.3:** E2E test - Update item flow
  - Test update quantity
  - Test update to zero (delete)
  - Test update with negative (validation error)
  - **Estimate:** 1 hour

- [ ] **Task 6.4:** E2E test - Remove item flow
  - Test remove existing item
  - Test remove non-existing item (idempotent)
  - **Estimate:** 45 minutes

- [ ] **Task 6.5:** E2E test - Get cart flow
  - Test get cart with products
  - Test get empty cart
  - Test with product not found (graceful handling)
  - **Estimate:** 1 hour

- [ ] **Task 6.6:** E2E test - Clear cart flow
  - Test clear cart with items
  - Test clear empty cart
  - **Estimate:** 30 minutes

- [ ] **Task 6.7:** E2E test - Merge guest cart flow
  - Test merge empty guest cart
  - Test merge with duplicate products
  - Test merge with new products
  - **Estimate:** 1.5 hours

- [ ] **Task 6.8:** E2E test - Complex scenarios
  - Test full workflow: add → update → get → remove → clear
  - Test concurrent operations (2 users)
  - **Estimate:** 1 hour

### Phase 7: Documentation & Cleanup

**Goal:** Finalize implementation notes

- [ ] **Task 7.1:** Update implementation doc
  - Document key implementation decisions
  - Add code examples
  - Note any deviations from design
  - **Estimate:** 1 hour

- [ ] **Task 7.2:** Update testing doc
  - Document test coverage results
  - Add manual testing checklist
  - **Estimate:** 30 minutes

- [ ] **Task 7.3:** Code cleanup
  - Remove debug logs
  - Format code (Prettier)
  - Check linter errors
  - **Estimate:** 30 minutes

## Dependencies

**What needs to happen in what order?**

### Critical Path

1. **Phase 1 (Foundation)** → Phải hoàn thành trước khi code logic
   - Task 1.3 (ProductAppClient) blocking Phase 2-3

2. **Phase 2-3 (Services)** → Business logic cốt lõi
   - Task 2.1 (getOrCreateCart) blocking Task 4.2, 4.6
   - Task 3.1 (addItem) blocking Task 4.2
   - Task 3.2 (updateQuantity) blocking Task 4.3

3. **Phase 4 (Controller)** → Requires Phase 2-3 complete
   - All controller tasks depend on services

4. **Phase 5 (Unit Tests)** → Can run parallel with Phase 4
   - Task 5.1-5.2 can start after Phase 2-3
   - Task 5.3 requires Phase 4

5. **Phase 6 (E2E Tests)** → Requires Phase 2-4 complete
   - Cannot start until all implementation done

6. **Phase 7 (Documentation)** → Final step after testing

### External Dependencies

- ✅ **product-app:** Must have `product.getById` and `product.getByIds` events implemented
- ✅ **NATS:** Must be running for E2E tests
- ✅ **PostgreSQL:** Cart DB (port 5435) must be running
- ✅ **Gateway:** Cart routes already exist (verified in project structure)

### Parallel Work Opportunities

- ✅ Task 5.1-5.2 (Unit tests for services) can run while doing Phase 4 (Controller)
- ✅ Task 1.2 (DTOs) can be done while Task 1.1 (Review) is ongoing
- ✅ Task 7.1-7.2 (Docs) can be updated incrementally during implementation

## Timeline & Estimates

**When will things be done?**

### Total Estimated Time

- **Phase 1:** 2 hours
- **Phase 2:** 4 hours
- **Phase 3:** 2.5 hours
- **Phase 4:** 2.5 hours
- **Phase 5:** 8.5 hours (unit tests)
- **Phase 6:** 7.5 hours (e2e tests)
- **Phase 7:** 2 hours
- **Total:** ~29 hours (~4 working days)

### Realistic Schedule (1 developer)

- **Day 1 (8h):** Phase 1-3 (Foundation + Services) - 8.5h
- **Day 2 (8h):** Phase 4-5 (Controller + Unit Tests) - 11h → split
- **Day 3 (8h):** Phase 5 (finish) + Phase 6 (E2E Tests start)
- **Day 4 (5h):** Phase 6 (finish) + Phase 7 (Documentation)

### Milestones Timeline

- **M1 (Core Logic):** End of Day 1
- **M2 (Product Integration):** End of Day 1 (included in services)
- **M3 (Unit Tests):** End of Day 2
- **M4 (E2E Tests):** End of Day 3
- **M5 (Ready):** End of Day 4

## Risks & Mitigation

**What could go wrong?**

### Risk 1: Product-app chưa có batch fetch API 🔴 HIGH

- **Impact:** Cannot implement efficient `getCartWithProducts()`
- **Probability:** Medium
- **Mitigation:**
  - ✅ Plan A: Implement `product.getByIds` trong product-app trước
  - ⚠️ Plan B: Fallback to multiple `product.getById` calls (slower but works)
  - ⚠️ Plan C: Implement batch API as part of this feature

### Risk 2: Prisma schema thiếu index 🟡 MEDIUM

- **Impact:** Slow queries khi cart có nhiều items
- **Probability:** Low
- **Mitigation:**
  - Check `@@unique([cartId, productId])` exists → OK
  - Add `@@index([userId])` if needed

### Risk 3: NATS timeout cho product calls 🟡 MEDIUM

- **Impact:** Cart.get slow hoặc fail
- **Probability:** Low (product-app should be fast)
- **Mitigation:**
  - Set 5s timeout
  - Graceful fallback: return `product: null` for failed products
  - Log timeout errors for monitoring

### Risk 4: Test data setup phức tạp 🟢 LOW

- **Impact:** E2E tests khó viết và maintain
- **Probability:** Medium
- **Mitigation:**
  - Reuse test helpers từ `libs/shared/testing/`
  - Create `cart-test-helpers.ts` for common setup
  - Mock product-app trong unit tests, use real product-app trong E2E

### Risk 5: Race condition khi add same product twice 🟢 LOW

- **Impact:** Quantity không chính xác
- **Probability:** Low
- **Mitigation:**
  - Prisma `@@unique([cartId, productId])` prevents duplicates
  - Use `upsert` instead of `findFirst` + `create`

## Resources Needed

**What do we need to succeed?**

### Team Members

- **1 Backend Developer:** Full-stack implementation + testing (YOU!)
- **AI Assistant:** Code review, testing guidance, debugging

### Tools & Services

- ✅ **NestJS + TypeScript:** Already setup
- ✅ **Prisma:** Already setup in cart-app
- ✅ **NATS:** Running via docker-compose
- ✅ **PostgreSQL:** Cart DB running (port 5435)
- ✅ **Jest:** Testing framework already configured

### Infrastructure

- ✅ **Development Environment:** Local docker-compose
- ✅ **Database Migrations:** Prisma migrate (no changes needed)
- ✅ **NATS Broker:** `docker-compose up -d nats`

### Documentation/Knowledge

- ✅ **RPC Exceptions Guide:** `docs/knowledge/RPC-EXCEPTIONS-GUIDE.md`
- ✅ **Testing Guide:** `docs/knowledge/TESTING.md`
- ✅ **Architecture Docs:** `docs/ai/design/README.md`
- ✅ **Existing E2E Tests:** `apps/user-app/test/` as reference

### Knowledge Gaps to Address

- ❓ **Product-app API:** Need to verify `product.getById` exists and response format
- ❓ **Batch API:** Check if `product.getByIds` exists, if not may need to implement
- ✅ **Cart Events:** Already defined in `libs/shared/events.ts` (verify)

## Next Steps

**What to do first?**

1. ✅ **Review this plan** với stakeholder (nếu có)
2. ▶️ **Start Phase 1:** Review codebase và verify dependencies
3. ▶️ **Execute `/execute-plan`:** Bắt đầu implementation theo task breakdown
4. 📝 **Update docs incrementally:** Ghi chú implementation decisions trong `feature-cart-management-implementation.md`
