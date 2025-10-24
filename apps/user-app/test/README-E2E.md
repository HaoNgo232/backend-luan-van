# E2E Testing Guide - User App

Hướng dẫn chạy E2E tests cho User App với test database.

## 📋 Các Test Controllers

- ✅ **UsersController** - CRUD operations cho users
- ✅ **AuthController** - Authentication flow (register, login, verify, refresh)
- ✅ **AddressController** - Quản lý địa chỉ người dùng

## 🛠️ Setup

### 1. Khởi động Test Databases

```bash
# Khởi động tất cả test databases
pnpm test:compose:up

# Chờ databases sẵn sàng
pnpm test:compose:wait
```

### 2. Chạy Migrations cho Test Database

```bash
# Chạy migrations cho tất cả databases
pnpm test:db:migrate
```

## 🧪 Chạy Tests

### Chạy E2E Tests cho User App

```bash
# Chạy tất cả E2E tests (với test database đã chạy)
dotenv -e .env.test -- jest --config ./jest.e2e.js apps/user-app

# Chạy một file test cụ thể
dotenv -e .env.test -- jest --config ./jest.e2e.js apps/user-app/test/users.e2e-spec.ts
dotenv -e .env.test -- jest --config ./jest.e2e.js apps/user-app/test/auth.e2e-spec.ts
dotenv -e .env.test -- jest --config ./jest.e2e.js apps/user-app/test/address.e2e-spec.ts

# Chạy với watch mode
dotenv -e .env.test -- jest --config ./jest.e2e.js --watch apps/user-app

# Chạy với coverage
dotenv -e .env.test -- jest --config ./jest.e2e.js --coverage apps/user-app
```

### Chạy Full Test Suite (Khuyến nghị)

```bash
# Chạy toàn bộ flow: start DB → migrate → test → stop DB
pnpm test:full
```

## 📝 Test Coverage

### UsersController Tests

- ✅ Create user successfully
- ✅ Throw error when creating duplicate email
- ✅ Find user by ID
- ✅ Throw NotFoundException when user not found
- ✅ Find user by email
- ✅ Update user
- ✅ Deactivate user
- ✅ List users with pagination
- ✅ Verify password is hashed before saving
- ✅ Verify passwordHash không được trả về trong response

### AuthController Tests

- ✅ Register new user successfully
- ✅ Fail registration with duplicate email
- ✅ Login successfully
- ✅ Fail login with wrong password
- ✅ Fail login with non-existent email
- ✅ Verify valid token
- ✅ Refresh token successfully

### AddressController Tests

- ✅ Create address successfully
- ✅ Set first address as default automatically
- ✅ Throw error when userId not found
- ✅ List all addresses for a user
- ✅ Return empty array for user with no addresses
- ✅ Update address successfully
- ✅ Throw error when updating non-existent address
- ✅ Set new default address and unset old default
- ✅ Delete address successfully
- ✅ Throw error when deleting default address with other addresses

## 🔧 Test Database Configuration

Test databases chạy trên các ports khác với development:

| Service    | Development Port | Test Port |
| ---------- | ---------------- | --------- |
| NATS       | 4222             | 4223      |
| User DB    | 5433             | 5533      |
| Product DB | 5434             | 5534      |
| Cart DB    | 5435             | 5535      |
| Order DB   | 5436             | 5536      |
| Payment DB | 5437             | 5537      |
| AR DB      | 5438             | 5538      |
| Report DB  | 5439             | 5539      |

## 🧹 Cleanup

### Dọn dẹp test data

```bash
# Stop và xóa tất cả test containers + volumes
pnpm test:compose:down
```

### Reset test database

```bash
# Start lại containers
pnpm test:compose:up

# Reset và chạy lại migrations
dotenv -e .env.test -- pnpm db:reset:all
```

## 📊 Test Helpers

File `test-helpers.ts` cung cấp:

### TestDatabaseHelper

- `setupTestApp()` - Khởi tạo NestJS app với test database
- `cleanDatabase()` - Xóa toàn bộ test data
- `closeApp()` - Đóng app sau khi test
- `getPrisma()` - Lấy PrismaService instance
- `getApp()` - Lấy INestApplication instance

### TestDataFactory

- `createUserData(override?)` - Tạo user data với email unique
- `createAddressData(userId, override?)` - Tạo address data
- `createLoginData(override?)` - Tạo login credentials

## 🎯 Best Practices

### 1. Database Isolation

Mỗi test case nên:

- Clean database trong `beforeEach()`
- Tạo data riêng cho test case đó
- Không phụ thuộc vào data của test khác

```typescript
beforeEach(async () => {
  await prisma.user.deleteMany({});
  await prisma.address.deleteMany({});
});
```

### 2. Unique Test Data

Sử dụng timestamp để tạo unique emails:

```typescript
const email = `test-${Date.now()}@example.com`;
```

### 3. Verify Database State

Ngoài kiểm tra response, verify trong database:

```typescript
const dbUser = await prisma.user.findUnique({
  where: { id: createdUserId },
});
expect(dbUser?.isActive).toBe(false);
```

### 4. Test Error Cases

Luôn test cả happy path và error cases:

```typescript
// Happy path
it('should create user successfully', async () => {
  // ...
});

// Error case
it('should throw BadRequestException when email exists', async () => {
  await expect(...).rejects.toThrow();
});
```

## 🐛 Troubleshooting

### Test bị fail do database connection

```bash
# Kiểm tra databases đang chạy
docker ps | grep test

# Xem logs của database container
docker logs user_db_test

# Restart test containers
pnpm test:compose:down
pnpm test:compose:up
pnpm test:compose:wait
```

### Migration issues

```bash
# Reset và chạy lại migrations
dotenv -e .env.test -- pnpm db:reset:all
pnpm test:db:migrate
```

### Port conflicts

Kiểm tra không có service nào đang dùng test ports (4223, 5533-5539):

```bash
# Linux/Mac
lsof -i :4223
lsof -i :5533

# Hoặc kill processes
sudo kill -9 $(lsof -t -i:4223)
```

## 📚 Tài liệu liên quan

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing/unit-testing)

## ✅ Coverage Goals

- **Target**: ≥70% coverage cho core services
- **Current User App Coverage**:
  - UsersController: Full coverage
  - AuthController: Full coverage
  - AddressController: Full coverage

---

**Lưu ý**: Tests này sử dụng test database riêng biệt, không ảnh hưởng đến development database.
