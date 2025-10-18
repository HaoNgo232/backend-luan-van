---
applyTo: '**/*.spec.ts,**/*.e2e-spec.ts'
---

# Testing Standards & Coverage Requirements

## 🎯 TARGET: ≥70% Coverage for Core Services

---

## 📋 MANDATORY TEST CASES

### For Every Service Method:

#### 1. Happy Path (Success Case)

```typescript
it('should return entity when found', async () => {
  // Setup mock
  // Call method
  // Assert success
  expect(result).toEqual(expected);
});
```

#### 2. Not Found Scenario

```typescript
it('should throw NotFoundException when not found', async () => {
  mockRepository.findUnique.mockResolvedValue(null);

  await expect(service.findById('999')).rejects.toThrow(NotFoundException);
});
```

#### 3. Validation Errors

```typescript
it('should throw BadRequestException when email exists', async () => {
  mockRepository.findUnique.mockResolvedValue(existingUser);

  await expect(service.create(dto)).rejects.toThrow(BadRequestException);
});
```

#### 4. Edge Cases

```typescript
it('should handle empty string', async () => {
  // Test edge case
});
```

---

## 🚨 TEST QUALITY CHECKS

**AI MUST VERIFY:**

✅ Mocks are properly setup  
✅ Assertions are meaningful (not just `toBeDefined()`)  
✅ Error cases are tested  
✅ Mock data is realistic  
✅ Tests are independent (no shared state)

---

## ❌ BAD TESTS TO FLAG

### Test Does Nothing

```typescript
// ❌ USELESS TEST
it('should be defined', () => {
  expect(service).toBeDefined();
});
```

### Missing Error Handling Test

```typescript
// ❌ INCOMPLETE - Only tests happy path
describe('UserService', () => {
  it('should create user', async () => {
    // Only success case, no error testing
  });
});
```

---

## ✅ GOOD TEST STRUCTURE

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let mockPrisma: MockType;

  beforeEach(async () => {
    // Setup
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      // Happy path
    });

    it('should throw BadRequestException when email exists', async () => {
      // Error case
    });

    it('should hash password before saving', async () => {
      // Security test
    });
  });
});
```

---

## 📊 COVERAGE REMINDER

**After user writes service:**

```
✅ {ServiceName} implementation complete!

⏭️ NEXT: Write tests
🎯 Coverage Goal: ≥70%

Required test cases:
□ Happy path: {method1}, {method2}
□ Error cases: Not found, validation errors
□ Edge cases: Empty data, invalid input
□ Security: Password hashing, data sanitization

Run: npm test -- {ServiceName}.spec.ts
Check coverage: npm run test:cov
```
