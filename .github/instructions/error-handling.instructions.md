---
applyTo: 'apps/*/src/**/*.service.ts,apps/*/src/**/*.controller.ts'
---

# Error Handling Standards

## 🚨 MANDATORY: ERROR HANDLING RULES

**ALL async operations MUST have try-catch blocks.**

---

## 📋 NESTJS EXCEPTION HIERARCHY

```
RpcException (Microservices)
  └─ Standard exceptions wrapped for RPC

HttpException (Gateway/HTTP)
  ├─ BadRequestException (400)
  ├─ UnauthorizedException (401)
  ├─ ForbiddenException (403)
  ├─ NotFoundException (404)
  ├─ ConflictException (409)
  └─ InternalServerErrorException (500)
```

---

## ✅ SERVICE LAYER ERROR HANDLING

### Standard Try-Catch Pattern

```typescript
async findById(id: string): Promise<UserResponse> {
  try {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
      }
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  } catch (error) {
    // Re-throw known exceptions
    if (error instanceof NotFoundException) {
      throw error;
    }

    // Log and wrap unknown errors
    console.error('[UsersService] findById error:', error);
    throw new BadRequestException('Failed to find user');
  }
}
```

### Error Handling Layers

```typescript
async create(dto: CreateUserDto): Promise<UserResponse> {
  try {
    // 1. Business Rule Validation
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // 2. Perform Operation
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { ...dto, passwordHash }
    });

    // 3. Return Success
    return user;

  } catch (error) {
    // 4. Error Handling
    if (error instanceof BadRequestException) {
      throw error;  // Known business error
    }

    console.error('[UsersService] create error:', error);
    throw new BadRequestException('Failed to create user');
  }
}
```

---

## 🎯 EXCEPTION TYPES & WHEN TO USE

### 1. BadRequestException (400)

**Use when**: Invalid input, business rule violation

```typescript
// ✅ Correct usage
if (existingUser) {
  throw new BadRequestException('Email already exists');
}

if (dto.items.length === 0) {
  throw new BadRequestException('Order must have at least one item');
}
```

### 2. UnauthorizedException (401)

**Use when**: Authentication fails, invalid credentials

```typescript
// ✅ Correct usage
if (!isPasswordValid) {
  throw new UnauthorizedException('Invalid email or password');
}

if (!user.isActive) {
  throw new UnauthorizedException('Account is deactivated');
}
```

### 3. ForbiddenException (403)

**Use when**: Authenticated but not authorized

```typescript
// ✅ Correct usage
if (user.role !== 'ADMIN') {
  throw new ForbiddenException('Admin access required');
}
```

### 4. NotFoundException (404)

**Use when**: Resource doesn't exist

```typescript
// ✅ Correct usage
if (!user) {
  throw new NotFoundException(`User ${id} not found`);
}

const product = await this.prisma.product.findUnique({ where: { id } });
if (!product) {
  throw new NotFoundException(`Product ${id} not found`);
}
```

### 5. ConflictException (409)

**Use when**: Resource state conflict

```typescript
// ✅ Correct usage
if (order.status === 'SHIPPED') {
  throw new ConflictException('Cannot cancel shipped order');
}
```

---

## 🚫 ANTI-PATTERNS TO AVOID

### 1. Silent Failures

```typescript
// ❌ WRONG - Swallowing errors
async findById(id: string) {
  try {
    return await this.prisma.user.findUnique({ where: { id } });
  } catch (error) {
    return null;  // Silently fails!
  }
}

// ✅ CORRECT - Proper error handling
async findById(id: string): Promise<UserResponse> {
  try {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  } catch (error) {
    if (error instanceof NotFoundException) throw error;
    console.error('[UsersService] findById error:', error);
    throw new BadRequestException('Failed to find user');
  }
}
```

### 2. Generic Error Messages

```typescript
// ❌ WRONG - Vague messages
throw new BadRequestException('Error');
throw new NotFoundException('Not found');

// ✅ CORRECT - Specific messages
throw new BadRequestException('Email already exists');
throw new NotFoundException(`User ${id} not found`);
```

### 3. Missing Context in Logs

```typescript
// ❌ WRONG - No context
catch (error) {
  console.error(error);
  throw new BadRequestException('Failed');
}

// ✅ CORRECT - With context
catch (error) {
  console.error('[UsersService] create error:', error);
  throw new BadRequestException('Failed to create user');
}
```

### 4. Not Re-throwing Known Exceptions

```typescript
// ❌ WRONG - Overwrites specific errors
catch (error) {
  throw new BadRequestException('Something went wrong');
}

// ✅ CORRECT - Preserve specific errors
catch (error) {
  if (error instanceof NotFoundException) throw error;
  if (error instanceof BadRequestException) throw error;

  console.error('[UsersService] error:', error);
  throw new BadRequestException('Operation failed');
}
```

---

## 🔧 PRISMA-SPECIFIC ERROR HANDLING

### Unique Constraint Violations

```typescript
try {
  return await this.prisma.user.create({ data: dto });
} catch (error) {
  // Prisma unique constraint error
  if (error.code === 'P2002') {
    throw new BadRequestException('Email already exists');
  }
  throw error;
}
```

### Foreign Key Violations

```typescript
try {
  return await this.prisma.orderItem.create({ data: dto });
} catch (error) {
  // Prisma foreign key constraint error
  if (error.code === 'P2003') {
    throw new NotFoundException('Referenced product not found');
  }
  throw error;
}
```

---

## 📦 GLOBAL ERROR FILTER

### RPC Exception Filter (Already Implemented)

```typescript
// libs/shared/filters/rpc-exception.filter.ts
@Catch(RpcException)
export class AllRpcExceptionsFilter
  implements RpcExceptionFilter<RpcException>
{
  catch(exception: RpcException, host: ArgumentsHost): Observable<never> {
    const error = exception.getError();

    const errorResponse = {
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
    };

    console.error('[RpcException]', errorResponse);
    return throwError(() => errorResponse);
  }
}
```

---

## 🎯 VALIDATION ERRORS

### DTO Validation (Automatic)

```typescript
// No try-catch needed - ValidationPipe handles it
@MessagePattern(EVENTS.USER.CREATE)
create(@Payload() dto: CreateUserDto) {
  return this.service.create(dto);
}

// If DTO validation fails, ValidationPipe throws BadRequestException
```

### Manual Validation in Service

```typescript
async create(dto: CreateUserDto): Promise<UserResponse> {
  try {
    // Business rules validation
    if (dto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // ... rest of creation
  } catch (error) {
    // ... error handling
  }
}
```

---

## 📊 AI VALIDATION CHECKLIST

**When user writes async function, AI MUST CHECK:**

□ Has try-catch block
□ Throws specific exception types (not generic Error)
□ Re-throws known exceptions
□ Logs errors with context
□ Returns meaningful error messages
□ Doesn't swallow errors silently

**IMMEDIATE FEEDBACK:**

```
⚠️ MISSING ERROR HANDLING

Async function lacks try-catch:
  async findById(id: string) {
    return await this.prisma.user.findUnique({ where: { id } });
  }

💡 Add proper error handling:
  async findById(id: string): Promise<UserResponse> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException(`User ${id} not found`);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('[Service] findById error:', error);
      throw new BadRequestException('Failed to find user');
    }
  }
```

---

## 🎓 THESIS DEFENSE POINTS

When asked about error handling:

- "All async operations wrapped in try-catch for reliability"
- "Specific exception types (404, 400, 401) for clear API responses"
- "Errors logged with context for debugging"
- "Known exceptions re-thrown, unknown wrapped with context"
- "Global RPC filter ensures consistent error format"

---

**Remember**: Good errors help debugging, bad errors hide problems!
