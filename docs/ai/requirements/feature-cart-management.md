---
phase: requirements
title: Requirements & Problem Understanding
description: Clarify the problem space, gather requirements, and define success criteria
---

# Requirements & Problem Understanding - Cart Management

## Problem Statement

**What problem are we solving?**

- **Vấn đề chính:** Cart-app hiện tại chỉ có cấu trúc cơ bản (schema, module, controller rỗng) nhưng chưa có logic nghiệp vụ thực tế để quản lý giỏ hàng
- **Người bị ảnh hưởng:** Khách hàng không thể thêm sản phẩm vào giỏ hàng, cập nhật số lượng, hay xem tổng giá trị đơn hàng
- **Tình trạng hiện tại:** Frontend phải lưu toàn bộ giỏ hàng trong localStorage, không đồng bộ với backend, mất dữ liệu khi đổi thiết bị

## Goals & Objectives

**What do we want to achieve?**

### Primary Goals

- ✅ **Thêm sản phẩm vào giỏ hàng:** Cho phép khách hàng thêm sản phẩm với số lượng tùy ý
- ✅ **Cập nhật số lượng:** Tăng/giảm số lượng sản phẩm đã có trong giỏ
- ✅ **Xóa sản phẩm:** Xóa 1 sản phẩm cụ thể hoặc xóa toàn bộ giỏ hàng
- ✅ **Tính tổng giá trị:** Hiển thị tổng giá trị giỏ hàng dựa trên giá realtime từ product-app
- ✅ **Hỗ trợ guest cart:** Khách chưa login lưu dữ liệu trong localStorage, sau khi login merge vào database

### Secondary Goals

- 🔄 Đồng bộ giỏ hàng giữa frontend và backend khi user login
- 🔄 Validation số lượng sản phẩm (không âm)
- 🔄 Gọi product-app để lấy giá realtime khi hiển thị giỏ hàng

### Non-goals (out of scope)

- ❌ **Không check stock khi add to cart:** Chỉ check stock ở bước checkout (để đơn giản)
- ❌ **Không replicate product data:** Cart chỉ lưu productId, gọi product-app để lấy thông tin chi tiết
- ❌ **Không có cart expiration:** Giỏ hàng không tự động xóa sau thời gian nhất định (đây là project luận văn)
- ❌ **Không áp dụng mã giảm giá:** Promotion/coupon là feature khác, không làm trong phase này

## User Stories & Use Cases

**How will users interact with the solution?**

### User Story 1: Thêm sản phẩm vào giỏ

- **Là khách hàng,** tôi muốn thêm sản phẩm vào giỏ hàng để mua sau
- **Acceptance Criteria:**
  - Khi chưa login: Frontend lưu vào localStorage, backend không lưu
  - Khi đã login: Gọi API `cart.addItem` → backend lưu vào database
  - Nếu sản phẩm đã tồn tại trong giỏ → tăng số lượng
  - Nếu sản phẩm chưa có → tạo CartItem mới

### User Story 2: Cập nhật số lượng sản phẩm

- **Là khách hàng,** tôi muốn cập nhật số lượng sản phẩm trong giỏ để điều chỉnh đơn hàng
- **Acceptance Criteria:**
  - Gọi API `cart.updateItem` với productId và quantity mới
  - Validate: quantity > 0
  - Nếu quantity = 0 → xóa CartItem
  - Nếu quantity âm → throw ValidationRpcException

### User Story 3: Xóa sản phẩm khỏi giỏ

- **Là khách hàng,** tôi muốn xóa sản phẩm không cần thiết khỏi giỏ hàng
- **Acceptance Criteria:**
  - Gọi API `cart.removeItem` với productId
  - Xóa CartItem khỏi database
  - Không throw error nếu sản phẩm không tồn tại (idempotent)

### User Story 4: Xem tổng giá trị giỏ hàng

- **Là khách hàng,** tôi muốn xem tổng giá trị đơn hàng trước khi thanh toán
- **Acceptance Criteria:**
  - Gọi API `cart.get` → trả về danh sách CartItem
  - Backend gọi product-app để lấy giá realtime cho từng productId
  - Tính tổng: `sum(product.priceInt * cartItem.quantity)`
  - Nếu sản phẩm không tồn tại (deleted) → bỏ qua hoặc đánh dấu unavailable

### User Story 5: Merge guest cart khi login

- **Là khách hàng,** tôi muốn giữ lại sản phẩm trong giỏ sau khi login
- **Acceptance Criteria:**
  - Frontend gửi guest cart data từ localStorage khi login
  - Backend merge với cart hiện tại của user trong DB:
    - Nếu productId đã có → cộng dồn quantity
    - Nếu productId chưa có → thêm mới
  - Frontend xóa localStorage sau khi merge thành công

### User Story 6: Xóa toàn bộ giỏ hàng

- **Là khách hàng,** tôi muốn xóa toàn bộ giỏ hàng để bắt đầu lại
- **Acceptance Criteria:**
  - Gọi API `cart.clear`
  - Xóa tất cả CartItem của cart này
  - Không xóa Cart entity (giữ lại để reuse)

## Success Criteria

**How will we know when we're done?**

### Functional Success

- ✅ **100% unit test coverage** cho CartService và CartItemService
- ✅ **E2E tests pass** cho tất cả API endpoints (add, update, remove, clear, get, merge)
- ✅ **RPC exceptions đúng:** EntityNotFound (404), Validation (400), Internal (500)
- ✅ **Integration với product-app:** Lấy giá sản phẩm thành công qua NATS

### Performance Benchmarks

- ⚡ **Response time < 200ms** cho cart.get với 50 items
- ⚡ **Response time < 100ms** cho cart.addItem
- 🔄 **RPC call timeout:** product-app không respond sau 5s → fallback hoặc throw ServiceUnavailable

### Data Integrity

- 🔒 **Validation:** Quantity luôn > 0 (hoặc = 0 để xóa)
- 🔒 **Referential integrity:** productId reference đến product-app (không lưu foreign key trực tiếp)
- 🔒 **User isolation:** Cart của user A không ảnh hưởng đến user B

## Constraints & Assumptions

**What limitations do we need to work within?**

### Technical Constraints

- **Database:** PostgreSQL cho cart-app (đã có sẵn, port 5435)
- **ORM:** Prisma (đã có schema.prisma)
- **Communication:** NATS message queue (async RPC)
- **Language:** TypeScript + NestJS
- **Existing Schema:** Cart và CartItem models đã định nghĩa trong `apps/cart-app/prisma/schema.prisma`

### Business Constraints

- **Guest cart:** Backend không lưu guest cart, frontend tự quản lý trong localStorage
- **Merge logic:** Xử lý bởi backend khi frontend gửi guest data lên
- **No stock validation:** Không check stock khi add to cart (để đơn giản)
- **Price source:** Giá lấy từ product-app realtime, không cache

### Assumptions

- ✅ Product-app đã hoàn thiện và có API `product.getById` để lấy thông tin sản phẩm
- ✅ User-app đã hoàn thiện để xác thực userId
- ✅ NATS message broker đang chạy và stable
- ✅ Gateway đã có routing cho cart events
- ✅ Frontend sẽ handle localStorage cho guest cart (không phải trách nhiệm backend)

## Questions & Open Items

**What do we still need to clarify?**

### Resolved Questions ✅

- ✅ **Q:** Cart có expire sau thời gian không hoạt động không?  
  **A:** Không, project luận văn nên giữ đơn giản

- ✅ **Q:** Có cần check stock khi add to cart không?  
  **A:** Không, chỉ check ở bước checkout

- ✅ **Q:** Giá sản phẩm lấy từ đâu?  
  **A:** Realtime từ product-app qua RPC call

- ✅ **Q:** Guest cart được lưu như thế nào?  
  **A:** Frontend lưu localStorage, backend không lưu guest cart

- ✅ **Q:** Merge guest cart khi nào?  
  **A:** Khi user login hoặc khi nhấn nút đặt hàng/thanh toán

### Open Questions ❓

- ❓ **Q:** Khi sản phẩm bị xóa khỏi product-app, cart có tự động xóa CartItem không?  
  **A:** [TBD] Đề xuất: Giữ lại CartItem, khi user view cart → show message "Sản phẩm không còn tồn tại"

- ❓ **Q:** Nếu product-app không response (timeout), cart.get trả về gì?  
  **A:** [TBD] Đề xuất: Trả về CartItem với price = null, frontend hiển thị "Giá không khả dụng"

- ❓ **Q:** Cart có cần pagination khi có quá nhiều items không?  
  **A:** [TBD] Trong scope luận văn, không cần pagination (giả định < 100 items)

- ❓ **Q:** Có cần API để list all carts (admin)?  
  **A:** [TBD] Không trong scope MVP, có thể thêm sau
