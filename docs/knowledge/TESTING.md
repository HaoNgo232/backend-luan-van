# Testing Guide

## Quick Start

Test databases hoàn toàn tách riêng từ development.

```bash
# Chạy toàn bộ test (containers up → migrate → run → down)
pnpm test:full

# Hoặc từng bước
pnpm test:compose:up          # Khởi động test containers
pnpm test:db:migrate           # Chạy migrations
pnpm test:run                  # Chạy tests
pnpm test:compose:down         # Tắt + xóa containers (giải phóng tài nguyên)
```

## Environment

- **Development**: `.env` (databases on ports 5433-5439)
- **Test**: `.env.test` (databases on ports 5533-5539, NATS on 4223)

Mỗi lần chạy `test:full`, containers được tạo fresh và xóa sạch sau khi test xong.

---

## 🚨 CRITICAL: NATS Microservices Error Handling

### ⚠️ Vấn Đề Phổ Biến

**NATS microservices KHÔNG throw exception như HTTP!**

```typescript
// ❌ SAI - Không work với NATS
await expect(firstValueFrom(client.send(EVENTS.ADDRESS.DELETE, 'invalid-id'))).rejects.toThrow();

// ❌ SAI - Sẽ không catch được error
try {
  await firstValueFrom(client.send(EVENTS.ADDRESS.DELETE, 'invalid-id'));
  fail('Should have thrown');
} catch (error) {
  expect(error.message).toContain('not found'); // Có thể undefined!
}
```

### ✅ Giải Pháp: Helper Function

Tạo helper function để handle NATS errors đúng cách:

```typescript
/**
 * Helper function to assert NATS RpcException errors
 *
 * NATS error format khác HTTP - error được trả qua error stream
 * với structure: { message: string } hoặc { msg: string }
 */
const expectRpcError = async (
  promise: Promise<unknown>,
  expectedMessage?: string,
): Promise<void> => {
  try {
    await promise;
    throw new Error('Expected RpcException but got success');
  } catch (error: unknown) {
    expect(error).toBeDefined();

    if (expectedMessage) {
      const err = error as Record<string, unknown>;
      const msg =
        (typeof err.message === 'string' ? err.message : '') ||
        (typeof err.msg === 'string' ? err.msg : '') ||
        '';
      expect(msg).toContain(expectedMessage);
    }
  }
};
```

### 📝 Cách Sử Dụng

```typescript
describe('ADDRESS.DELETE', () => {
  it('should throw error when deleting non-existent address', async () => {
    // ✅ ĐÚNG - Dùng helper function
    await expectRpcError(
      firstValueFrom(client.send(EVENTS.ADDRESS.DELETE, 'non-existent-id')),
      'không tồn tại', // Optional: check message content
    );
  });

  it('should throw error for invalid userId', async () => {
    const dto = { userId: 'invalid', fullName: 'Test' };

    // ✅ ĐÚNG - Check cả error message
    await expectRpcError(firstValueFrom(client.send(EVENTS.ADDRESS.CREATE, dto)), 'không tồn tại');
  });
});
```

---

## 🎯 Business Logic Best Practices

### Auto-Default Pattern

**Vấn đề:** Khi user tạo địa chỉ đầu tiên, nên tự động set làm default để improve UX.

**❌ Logic Cũ (Thiếu):**

```typescript
async create(dto: AddressCreateDto): Promise<AddressResponse> {
  // Chỉ tôn trọng dto.isDefault, không có logic auto
  const address = await this.prisma.address.create({
    data: {
      ...dto,
      isDefault: dto.isDefault ?? false, // ❌ First address vẫn false!
    },
  });
  return address;
}
```

**✅ Logic Đúng:**

```typescript
async create(dto: AddressCreateDto): Promise<AddressResponse> {
  // Kiểm tra xem user đã có địa chỉ nào chưa
  const existingAddressCount = await this.prisma.address.count({
    where: { userId: dto.userId },
  });

  // LOGIC QUAN TRỌNG: Địa chỉ đầu tiên tự động là default
  // Dù client set isDefault: false, địa chỉ đầu tiên LUÔN là default
  const isFirstAddress = existingAddressCount === 0;
  const shouldBeDefault = isFirstAddress || dto.isDefault;

  // Nếu set làm default → bỏ default của các địa chỉ cũ
  if (shouldBeDefault) {
    await this.prisma.address.updateMany({
      where: { userId: dto.userId },
      data: { isDefault: false },
    });
  }

  const address = await this.prisma.address.create({
    data: {
      ...dto,
      isDefault: shouldBeDefault, // ✅ First address = true
    },
  });

  return address;
}
```

**🧪 Test Case:**

```typescript
it('should set first address as default automatically', async () => {
  const createDto: AddressCreateDto = {
    userId: testUserId,
    fullName: 'First Address',
    phone: '0912345678',
    city: 'Hà Nội',
    district: 'Hoàn Kiếm',
    ward: 'Hàng Bài',
    street: '10 Phố Huế',
    isDefault: false, // ⚠️ Client set false nhưng...
  };

  const result = await firstValueFrom(client.send(EVENTS.ADDRESS.CREATE, createDto));

  // ✅ ...service tự động override thành true vì là first address
  expect(result.isDefault).toBe(true);
});
```

---

## 🏗️ E2E Test Structure

### Setup Pattern

```typescript
describe('ServiceController (e2e)', () => {
  let app: INestMicroservice;
  let client: ClientProxy;
  let prisma: PrismaService;
  let testUserId: string;

  beforeAll(async () => {
    // Setup test module & microservice
    const moduleFixture = await Test.createTestingModule({
      imports: [ServiceModule, ClientsModule.register([...])],
    }).compile();

    app = moduleFixture.createNestMicroservice({
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL ?? 'nats://localhost:4223'],
        queue: 'test-queue', // ⚠️ Unique queue name cho từng test
      },
    });

    await app.listen();
    client = moduleFixture.get('SERVICE_CLIENT');
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await client.connect();
  });

  afterAll(async () => {
    // ⚠️ Cleanup QUAN TRỌNG - tránh memory leaks
    await prisma.address.deleteMany({});
    await prisma.user.deleteMany({});
    await client.close();
    await app.close();
  });

  beforeEach(async () => {
    // ✅ Clean database trước MỖI test
    await prisma.address.deleteMany({});
    await prisma.user.deleteMany({});

    // Tạo test user mới cho mỗi test
    const registerDto: RegisterDto = {
      email: `test-${Date.now()}@example.com`, // ⚠️ Unique email
      password: 'Test@123456',
      fullName: 'Test User',
    };

    const authResult = await firstValueFrom(
      client.send(EVENTS.AUTH.REGISTER, registerDto)
    );
    testUserId = authResult.user.sub; // ⚠️ JWT uses 'sub' claim, not 'id'
  });

  describe('FEATURE_NAME', () => {
    it('should work correctly', async () => {
      // Test implementation
    });
  });
});
```

### Common Pitfalls

#### ❌ Pitfall 1: Wrong User ID Field

```typescript
// ❌ SAI
testUserId = authResult.user.id; // undefined!

// ✅ ĐÚNG - JWT standard uses 'sub' claim
testUserId = authResult.user.sub;
```

#### ❌ Pitfall 2: Shared State Between Tests

```typescript
// ❌ SAI - Tests phụ thuộc lẫn nhau
describe('Tests', () => {
  let sharedAddressId: string;

  it('test 1', async () => {
    const addr = await createAddress();
    sharedAddressId = addr.id; // ❌ Test 2 phụ thuộc test 1
  });

  it('test 2', async () => {
    await updateAddress(sharedAddressId); // ❌ Fail nếu test 1 skip
  });
});

// ✅ ĐÚNG - Tests độc lập
describe('Tests', () => {
  beforeEach(async () => {
    // Mỗi test có data riêng
    await cleanDatabase();
  });

  it('test 1', async () => {
    const addr = await createAddress();
    // Test logic...
  });

  it('test 2', async () => {
    const addr = await createAddress(); // ✅ Tạo mới, không reuse
    // Test logic...
  });
});
```

#### ❌ Pitfall 3: Not Cleaning Up

```typescript
// ❌ SAI - Không cleanup
afterAll(async () => {
  await app.close(); // ❌ NATS client vẫn còn connection!
});

// ✅ ĐÚNG - Full cleanup
afterAll(async () => {
  await prisma.address.deleteMany({}); // Clean data
  await prisma.user.deleteMany({});
  await client.close(); // ✅ Close NATS connection
  await app.close(); // ✅ Close microservice
});
```

---

## 📊 Test Coverage

### Coverage Goals

- **Core services**: ≥ 70% (user, product, cart)
- **Critical flows**: auth, checkout
- **E2E tests**: main features

### Run Coverage

```bash
# Unit tests with coverage
npm run test:cov

# E2E tests with coverage
npm run test:e2e:cov
```

---

## 🎓 Lessons Learned

### 1. NATS vs HTTP Error Handling

- **HTTP**: Exceptions trở thành HTTP status codes (404, 400, etc.)
- **NATS**: Exceptions trở thành error objects trong stream
- **Solution**: Dùng helper function để normalize error checking

### 2. Business Logic in Services, Not Tests

- ❌ **SAI**: Test expect client behavior
- ✅ **ĐÚNG**: Test expect business rules (e.g., first address = default)

### 3. Test Independence

- Mỗi test phải chạy độc lập
- Không assume database state từ test trước
- `beforeEach` để setup, `afterEach/afterAll` để cleanup

### 4. Type Safety

- Luôn dùng explicit types cho error handling
- Tránh `any` - dùng `unknown` + type guards
- Helper functions giúp centralize type checks

---

## 🔍 Debugging Tips

### NATS Connection Issues

```bash
# Check NATS is running
docker ps | grep nats

# Check NATS logs
docker logs <nats-container-id>

# Test NATS connection
telnet localhost 4223
```

### Database Issues

```bash
# Check test databases
docker ps | grep postgres

# Connect to test database
psql -h localhost -p 5533 -U user -d user_db_test

# Check migrations
npm run test:db:migrate
```

### Test Hanging

- ⚠️ Thường do không close connections
- Check `afterAll` có close client & app không
- Dùng `--detectOpenHandles` để debug:

```bash
npm test -- --detectOpenHandles
```

---

## 🎨 Recommended Testing Patterns

### Use Shared Test Helpers

```typescript
import { expectRpcError, createTestEmail } from '@shared/testing/rpc-test-helpers';

describe('UserService', () => {
  it('should throw error for invalid user', async () => {
    await expectRpcError(
      firstValueFrom(client.send(EVENTS.USER.GET, 'invalid-id')),
      'không tồn tại',
    );
  });

  it('should create user with unique email', async () => {
    const email = createTestEmail('user');
    const result = await firstValueFrom(
      client.send(EVENTS.USER.CREATE, { email, password: 'Test@123' }),
    );
    expect(result.email).toBe(email);
  });
});
```

### Use Typed RPC Exceptions

```typescript
import { EntityNotFoundRpcException } from '@shared/exceptions/rpc-exceptions';

// ✅ GOOD - Type-safe, consistent error format
async getUser(id: string) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new EntityNotFoundRpcException('User', id);
  }
  return user;
}

// ❌ BAD - Generic error, inconsistent format
async getUser(id: string) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new RpcException('User not found');
  }
  return user;
}
```

## 📚 Additional Resources

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NATS Messaging](https://docs.nats.io/)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)
