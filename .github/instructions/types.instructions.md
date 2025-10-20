---
applyTo: 'libs/shared/types/**/*.types.ts,apps/*/src/**/*.types.ts'
---

# TypeScript Types & Interfaces Standards

## 🚨 MANDATORY: TYPE SAFETY RULES

**NEVER use `any` type without explicit justification.**

---

## 📋 TYPE NAMING CONVENTIONS

### Response Types

```typescript
// ✅ CORRECT - Suffix with "Response"
export type UserResponse = {
  id: string;
  email: string;
  fullName: string | null;
};

// ❌ WRONG - Generic name
export type User = { ... };
```

### Request/DTO Types

```typescript
// ✅ CORRECT - Use DTO suffix (already in dto/ folder)
export class CreateUserDto { ... }

// Types for internal use
export type UserCreatePayload = { ... };
```

### Utility Types

```typescript
// ✅ CORRECT - Descriptive names
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};
```

---

## 🎯 TYPE STRUCTURE RULES

### 1. Use `type` for Simple Shapes

```typescript
// ✅ CORRECT - Simple object shapes
export type UserResponse = {
  id: string;
  email: string;
  role: string;
};

// ✅ CORRECT - Union types
export type UserRole = 'ADMIN' | 'CUSTOMER';
```

### 2. Use `interface` for Extensible Contracts

```typescript
// ✅ CORRECT - When inheritance is expected
export interface IPaymentGateway {
  processPayment(amount: number): Promise<PaymentResult>;
  refund(transactionId: string): Promise<void>;
}

// Can be extended later
export interface ISePayGateway extends IPaymentGateway {
  generateQRCode(): string;
}
```

### 3. Required vs Optional Fields

```typescript
// ✅ CORRECT - Clear optionality
export type ProductResponse = {
  id: string; // Required
  name: string; // Required
  description: string | null; // Can be null from DB
  model3dUrl?: string; // Optional field
};

// ❌ WRONG - Ambiguous
export type ProductResponse = {
  id: string;
  name: string;
  description: string; // Is this nullable?
  model3dUrl: string; // Is this optional?
};
```

---

## 🔒 NULL SAFETY PATTERNS

### Handle Prisma Nullable Fields

```typescript
// ✅ CORRECT - Match Prisma schema
// Prisma schema: fullName String?
export type UserResponse = {
  id: string;
  fullName: string | null; // Explicitly nullable
};

// When processing
function displayName(user: UserResponse): string {
  return user.fullName ?? 'Anonymous';
}
```

### Optional vs Nullable

```typescript
// Optional: Field may not exist
type Config = {
  apiKey?: string; // Field can be absent
};

// Nullable: Field exists but value can be null
type User = {
  phone: string | null; // Field always exists
};
```

---

## 📦 TYPE ORGANIZATION

### File Structure

```typescript
// libs/shared/types/user.types.ts

// 1. Domain entity types
export type UserResponse = { ... };

// 2. Related types
export type UserRole = 'ADMIN' | 'CUSTOMER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

// 3. Utility types for this domain
export type PublicUserInfo = Pick<UserResponse, 'id' | 'fullName'>;
```

### Exporting from Barrel File

```typescript
// libs/shared/types/index.ts
export * from './user.types';
export * from './product.types';
export * from './order.types';
```

---

## 🚫 ANTI-PATTERNS TO AVOID

### 1. Using `any`

```typescript
// ❌ WRONG
export type ApiResponse = {
  data: any; // No type safety!
};

// ✅ CORRECT
export type ApiResponse<T> = {
  data: T;
  status: number;
};
```

### 2. Mixing Domain Concerns

```typescript
// ❌ WRONG - Product type with cart logic
export type Product = {
  id: string;
  name: string;
  cartQuantity: number; // Cart concern in product type!
};

// ✅ CORRECT - Separate concerns
export type ProductResponse = {
  id: string;
  name: string;
};

export type CartItemResponse = {
  productId: string;
  quantity: number;
};
```

### 3. Overly Permissive Types

```typescript
// ❌ WRONG
export type Config = Record<string, any>;

// ✅ CORRECT
export type Config = {
  apiUrl: string;
  timeout: number;
  retries?: number;
};
```

---

## 🎨 GENERIC TYPES GUIDELINES

### When to Use Generics

```typescript
// ✅ CORRECT - Reusable pagination wrapper
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// Usage
type UserListResponse = PaginatedResponse<UserResponse>;
type ProductListResponse = PaginatedResponse<ProductResponse>;
```

### Constraining Generics

```typescript
// ✅ CORRECT - Constrained generic
export type WithId<T extends { id: string }> = T & {
  createdAt: Date;
};

// ❌ WRONG - Too permissive
export type WithId<T> = T & { createdAt: Date };
```

---

## 💡 UTILITY TYPE PATTERNS

### Common Patterns

```typescript
// Partial update
export type UpdateUserPayload = Partial<Omit<UserResponse, 'id' | 'createdAt'>>;

// Pick specific fields
export type UserSummary = Pick<UserResponse, 'id' | 'email' | 'fullName'>;

// Omit sensitive fields
export type PublicUser = Omit<UserResponse, 'passwordHash'>;

// Required fields
export type RequiredUser = Required<Pick<UserResponse, 'fullName' | 'phone'>>;
```

---

## 🔍 TYPE GUARDS

### Implementing Type Guards

```typescript
// ✅ CORRECT - Runtime type checking
export function isUserResponse(obj: unknown): obj is UserResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    typeof (obj as UserResponse).id === 'string'
  );
}

// Usage
if (isUserResponse(data)) {
  console.log(data.email); // TypeScript knows it's UserResponse
}
```

---

## 📊 AI VALIDATION CHECKLIST

**When user creates/modifies types, AI MUST CHECK:**

□ No `any` types (or justified)
□ Nullable fields use `| null` (not `| undefined`)
□ Optional fields use `?:`
□ Consistent naming (Response, Dto, Payload suffixes)
□ Exported from barrel file
□ Documented with JSDoc if complex
□ Matches Prisma schema nullability

**IMMEDIATE FEEDBACK:**

```
🚨 TYPE SAFETY VIOLATION

Found `any` type in UserResponse:
  data: any;  // Line 10

💡 Replace with specific type:
  data: Record<string, unknown> | UserData;
```

---

## 🎓 THESIS DEFENSE POINTS

When asked about types:

- "We use strict null checks to prevent runtime errors"
- "Response types mirror database schema for consistency"
- "Generic types reduce duplication across services"
- "Type guards provide runtime validation"

---

**Remember**: Types are documentation + safety. Make them explicit and descriptive!
