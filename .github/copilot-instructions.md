# E-commerce Microservices Platform - Developer Instructions

## Project Overview

This is a NestJS-based e-commerce platform using microservices architecture with NATS messaging, Prisma ORM, and JWT authentication. The system consists of 8 independent services communicating via NATS message broker.

## Architecture

- **Gateway**: HTTP API Gateway (port 3000) - translates REST to NATS
- **Microservices**: user-app, product-app, order-app, payment-app, cart-app, report-app, ar-app
- **Transport**: NATS message broker (nats://localhost:4222)
- **Database**: PostgreSQL with separate databases per service
- **ORM**: Prisma with generated clients per service

## Folder Structure

```
/apps                    # All microservices
  /gateway              # HTTP API Gateway
  /user-app             # Users, auth, addresses
  /product-app          # Products and categories
  /order-app            # Orders and order items
  /payment-app          # Payment processing
  /cart-app             # Shopping cart
  /report-app           # Analytics and reports
  /ar-app               # AR snapshots
/libs
  /shared               # Shared DTOs, events, utilities
    /dto                # Data Transfer Objects
    events.ts           # NATS event patterns
    auth.ts             # Auth utilities
/prisma                 # Each app has its own schema
```

## Technology Stack

- **Framework**: NestJS 11.x with TypeScript 5.7
- **Transport**: NATS 2.x (@nestjs/microservices)
- **ORM**: Prisma 6.x with generated clients
- **Authentication**: JWT (@nestjs/jwt, jsonwebtoken)
- **Validation**: class-validator, class-transformer
- **Testing**: Jest 30.x
- **Linting**: ESLint 9.x with TypeScript ESLint

## Coding Standards

### TypeScript/NestJS Conventions

- Use **explicit return types** for all functions except controllers and main.ts
- Use **async/await** for all asynchronous operations
- Use **dependency injection** via constructor
- Follow NestJS **module-service-controller** pattern
- Use **DTOs** from `@shared/dto` for all data transfer
- Use **EVENTS** from `@shared/events` for NATS patterns

### Naming Conventions

- **Files**: kebab-case (e.g., `user.service.ts`, `auth.guard.ts`)
- **Classes**: PascalCase (e.g., `UserService`, `AuthGuard`)
- **Interfaces**: PascalCase with "I" prefix optional (e.g., `IUser` or `User`)
- **Functions/Methods**: camelCase (e.g., `findById`, `createUser`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `EVENTS.USER.FIND_BY_ID`)
- **DTOs**: Suffix with "Dto" (e.g., `CreateUserDto`)

### Import Organization

Order imports as follows:

1. NestJS core imports
2. Third-party libraries
3. Internal shared modules (`@shared/*`)
4. Internal app modules (`@user-app/*`, `@gateway/*`, etc.)
5. Relative imports

Example:

```typescript
import { Injectable } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EVENTS } from '@shared/events';
import { CreateUserDto } from '@shared/dto/user.dto';
import { prisma } from '@user-app/../prisma/prisma.client';
```

### Error Handling

- Use NestJS exceptions: `BadRequestException`, `NotFoundException`, `UnauthorizedException`, etc.
- Always wrap async operations in try-catch
- Log errors with context: `console.error('[ServiceName]', error)`
- Return meaningful error messages to clients

### Prisma Usage

- Import prisma client: `import { prisma } from '../prisma/prisma.client'`
- Always use generated Prisma types
- Handle unique constraint violations
- Use transactions for multi-step operations
- Close connections in module destroy hooks when needed

## Authentication & Authorization

### JWT Implementation

- **Access tokens**: 15 minutes expiry, contains userId, email, role
- **Refresh tokens**: 7 days expiry, stored in database
- **Password hashing**: Use bcrypt with 10 rounds
- **Token verification**: Use `@nestjs/jwt` JwtService
- **Guards**: Apply `AuthGuard` to protected routes

### Auth Flow

1. **Login**: POST to `/auth/login` → returns access + refresh tokens
2. **Verify**: Middleware checks Bearer token via `verifyJwtFromHeader()`
3. **Refresh**: POST to `/auth/refresh` with refresh token
4. **Protected routes**: Attach `Authorization: Bearer <token>` header

## Microservices Communication

### Gateway → Service Pattern

```typescript
// In Gateway controller
async getUser(@Query('id') id: string) {
  return firstValueFrom(
    this.userService
      .send(EVENTS.USER.FIND_BY_ID, id)
      .pipe(timeout(5000), retry(1))
  );
}
```

### Service Message Handler Pattern

```typescript
// In microservice controller
@MessagePattern(EVENTS.USER.FIND_BY_ID)
async findById(@Payload() id: string) {
  return this.userService.findById(id);
}
```

### Adding Headers to NATS Messages

When authentication is required, pass headers:

```typescript
this.userService.send(EVENTS.USER.UPDATE, {
  id,
  dto,
  headers: { authorization: `Bearer ${token}` },
});
```

## Database Patterns

### Prisma Client Setup

Each service has its own Prisma client:

```typescript
// apps/user-app/prisma/prisma.client.ts
import { PrismaClient } from './generated/client';

export const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_USER },
  },
});
```

### Schema Management

- Each service has `apps/SERVICE/prisma/schema.prisma`
- Generate clients: `pnpm db:generate:SERVICE`
- Generate all: `pnpm db:generate:all`
- Never share Prisma clients between services

### Common Patterns

```typescript
// Find by ID
const user = await prisma.user.findUnique({ where: { id } });
if (!user) throw new NotFoundException('User not found');

// Create with validation
const user = await prisma.user.create({
  data: { email, passwordHash, fullName },
});

// Update
await prisma.user.update({
  where: { id },
  data: { fullName, phone },
});

// List with pagination
const users = await prisma.user.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  where: { isActive: true },
});
```

## Testing

- Unit tests: Test service logic with mocked Prisma
- E2E tests: Use supertest for gateway endpoints
- Mock NATS clients in tests
- Use `jest.mock()` for external dependencies

## Price Handling

**IMPORTANT**: All prices are stored as integers (smallest currency unit).

- Store: `priceInt` in cents/pennies (e.g., $19.99 = 1999)
- Display: Divide by 100 and format
- Calculations: Always use integers to avoid floating-point errors

## Environment Variables

Required variables per service:

- `NATS_URL`: NATS connection string
- `DATABASE_URL_[SERVICE]`: PostgreSQL connection per service
- `JWT_SECRET`: Secret for signing tokens
- `JWT_EXPIRES_IN`: Access token expiry (e.g., "15m")
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiry (e.g., "7d")

## Common Mistakes to Avoid

1. **Don't** share Prisma clients between services
2. **Don't** use floating-point for money calculations
3. **Don't** forget to validate DTOs with class-validator
4. **Don't** expose internal errors to clients
5. **Don't** forget to handle NATS timeouts
6. **Don't** use localStorage/sessionStorage in Node.js services
7. **Don't** commit `.env` files (use `.env.example` only)
8. **Don't** generate Prisma clients into the same folder

## Development Commands

```bash
# Install dependencies
pnpm install

# Generate all Prisma clients
pnpm db:generate:all

# Start gateway in dev mode
pnpm start:dev gateway

# Start specific service
pnpm start:dev user-app

# Run linter
pnpm lint

# Run tests
pnpm test
```

## Code Review Checklist

- [ ] DTOs are properly validated with decorators
- [ ] Errors are caught and logged
- [ ] Prisma queries use proper types
- [ ] NATS patterns match EVENTS constants
- [ ] JWT tokens are verified in protected routes
- [ ] Prices use integer representation
- [ ] No hardcoded secrets or credentials
- [ ] TypeScript strict mode passes
- [ ] ESLint passes without warnings
