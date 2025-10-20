---
applyTo: 'apps/*/prisma/schema.prisma,apps/*/prisma/migrations/**/*.sql'
---

# Prisma Schema & Migration Standards

## 🚨 MANDATORY: PRISMA RULES

**Each microservice has its own database and Prisma schema.**

---

## 📋 SCHEMA STRUCTURE

### Schema File Template

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL_SERVICENAME")
}

generator client {
  provider = "prisma-client-js"
  output   = "./generated/client"
}

// Models go here
model Entity {
  id        String   @id @default(cuid())
  // ... fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 🎯 FIELD NAMING CONVENTIONS

### Standard Fields

```prisma
model Product {
  id          String   @id @default(cuid())        // ✅ Always CUID
  name        String                                // ✅ Required string
  description String?                               // ✅ Optional (nullable)
  priceInt    Int                                   // ✅ Money in cents
  stock       Int      @default(0)                  // ✅ Default value
  isActive    Boolean  @default(true)               // ✅ Boolean with default
  createdAt   DateTime @default(now())              // ✅ Timestamp
  updatedAt   DateTime @updatedAt                   // ✅ Auto-update
}
```

### Money Fields - ALWAYS Integers

```prisma
// ✅ CORRECT - Store in cents
model Product {
  priceInt    Int  // 1999 = $19.99
}

model Order {
  totalInt    Int @default(0)  // Total in cents
}

// ❌ WRONG - Never use Decimal for money
model Product {
  price Decimal  // Floating point issues!
}
```

### String Arrays

```prisma
model Product {
  imageUrls String[]  // Array of URLs
  tags      String[]  // Array of tags
}
```

### JSON Fields

```prisma
model Product {
  attributes Json?  // Flexible metadata
}

model Payment {
  payload Json?  // Extended payment data
}
```

---

## 🔗 RELATIONSHIPS

### One-to-Many

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  addresses Address[]  // ✅ User has many addresses
}

model Address {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])
}
```

### Self-Referencing (Tree Structure)

```prisma
model Category {
  id          String     @id @default(cuid())
  name        String
  parentId    String?
  children    Category[] @relation("CategoryToCategory")
  parent      Category?  @relation("CategoryToCategory", fields: [parentId], references: [id])
}
```

### Optional Relations

```prisma
model Product {
  id         String    @id @default(cuid())
  categoryId String?   // ✅ Optional foreign key
  category   Category? @relation(fields: [categoryId], references: [id])
}
```

---

## 🔍 INDEXES & CONSTRAINTS

### Unique Constraints

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique  // ✅ Unique email
}

model Product {
  id   String @id @default(cuid())
  sku  String @unique  // ✅ Unique SKU
  slug String @unique  // ✅ Unique slug for URLs
}
```

### Composite Keys (If Needed)

```prisma
model CartItem {
  cartId    String
  productId String
  quantity  Int

  @@unique([cartId, productId])  // One product per cart
}
```

---

## 🚫 ANTI-PATTERNS TO AVOID

### 1. Missing Timestamps

```prisma
// ❌ WRONG - No tracking
model Product {
  id   String @id @default(cuid())
  name String
}

// ✅ CORRECT - Always include timestamps
model Product {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. Using Decimal for Money

```prisma
// ❌ WRONG
model Product {
  price Decimal @db.Decimal(10, 2)  // Floating point issues!
}

// ✅ CORRECT
model Product {
  priceInt Int  // Store cents: 1999 = $19.99
}
```

### 3. Missing Defaults

```prisma
// ❌ WRONG - No default
model User {
  isActive Boolean  // What if not set?
  role     String   // Default role?
}

// ✅ CORRECT - Explicit defaults
model User {
  isActive Boolean @default(true)
  role     String  @default("CUSTOMER")
}
```

---

## 📦 MIGRATION BEST PRACTICES

### Naming Migrations

```bash
# ✅ CORRECT - Descriptive names
pnpm prisma migrate dev --name add_product_model3d_url
pnpm prisma migrate dev --name create_cart_tables
pnpm prisma migrate dev --name add_user_phone_field

# ❌ WRONG - Generic names
pnpm prisma migrate dev --name update
pnpm prisma migrate dev --name fix
```

### Migration Commands

```bash
# Development (auto-generates migration)
pnpm prisma migrate dev --schema=apps/user-app/prisma/schema.prisma

# Production (apply existing migrations)
pnpm prisma migrate deploy --schema=apps/user-app/prisma/schema.prisma

# Reset database (DANGEROUS - deletes all data)
pnpm prisma migrate reset --schema=apps/user-app/prisma/schema.prisma

# Generate Prisma Client (after schema changes)
pnpm prisma generate --schema=apps/user-app/prisma/schema.prisma
```

---

## 🔧 PRISMA CLIENT USAGE

### Service Integration

```typescript
// apps/user-app/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from './generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}
```

### Using in Services

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@user-app/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserResponse> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        // ✅ Never select passwordHash in responses!
      },
    });
  }
}
```

---

## 🎯 QUERY PATTERNS

### Always Use Select

```typescript
// ✅ CORRECT - Explicit fields
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    fullName: true,
  },
});

// ❌ WRONG - Exposes all fields (including passwordHash!)
const user = await prisma.user.findUnique({
  where: { id },
});
```

### Transactions

```typescript
// ✅ CORRECT - Multiple operations in transaction
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.orderItem.createMany({ data: items });
  await tx.payment.create({ data: paymentData });
});
```

### Pagination

```typescript
// ✅ CORRECT - Proper pagination
const users = await prisma.user.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
});

const total = await prisma.user.count();
```

---

## 📊 AI VALIDATION CHECKLIST

**When user modifies schema, AI MUST CHECK:**

□ All models have `id`, `createdAt`, `updatedAt`
□ Money fields use `Int` (not Decimal)
□ Unique constraints on emails, slugs, SKUs
□ Relations have proper foreign keys
□ Optional fields marked with `?`
□ Defaults set for booleans and enums
□ Migration name is descriptive

**IMMEDIATE FEEDBACK:**

```
🚨 PRISMA SCHEMA VIOLATION

Model "Product" missing timestamps:
  model Product {
    id   String @id @default(cuid())
    name String
  }

💡 Add required timestamps:
  model Product {
    id        String   @id @default(cuid())
    name      String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
```

---

## 🎓 THESIS DEFENSE POINTS

When asked about database:

- "Each microservice has isolated database (database-per-service pattern)"
- "Prices stored as integers to avoid floating-point errors"
- "Prisma provides type-safe database access"
- "Migrations tracked in version control for reproducibility"

---

**Remember**: Schema is source of truth, migrations are history!
