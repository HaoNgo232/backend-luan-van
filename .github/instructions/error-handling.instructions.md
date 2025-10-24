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

## ✅ SERVICE LAYER ERROR HANDLING - MICROSERVICES

### 🚨 CRITICAL: Use RpcException for Microservices!

**In microservices context, NEVER use HttpException.** Use `RpcException` from `@nestjs/microservices`:

```typescript
import { RpcException } from '@nestjs/microservices';

// ✅ CORRECT for Microservices
throw new RpcException({
  statusCode: 404,
  message: `User ${id} not found`,
});

// ❌ WRONG for Microservices (use only in Gateway/HTTP)
throw new NotFoundException(`User ${id} not found`);
```

### Standard Try-Catch Pattern for Microservices

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
      // ✅ Use RpcException with statusCode
      throw new RpcException({
        statusCode: 404,
        message: `User with ID ${id} not found`,
      });
    }

    return user;
  } catch (error) {
    // Re-throw known RpcExceptions
    if (error instanceof RpcException) {
      throw error;
    }

    // Log and wrap unknown errors
    console.error('[UsersService] findById error:', error);
    throw new RpcException({
      statusCode: 400,
      message: 'Failed to find user',
    });
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
      // ✅ Use RpcException
      throw new RpcException({
        statusCode: 400,
        message: 'Email already exists',
      });
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
    if (error instanceof RpcException) {
      throw error;  // Known business error
    }

    console.error('[UsersService] create error:', error);
    throw new RpcException({
      statusCode: 400,
      message: 'Failed to create user',
    });
  }
}
```

---

## 🎯 RpcException Status Codes

**Status codes for RpcException:**

- `400` - BadRequest: Invalid input, business rule violation
- `401` - Unauthorized: Authentication fails
- `403` - Forbidden: Authenticated but not authorized
- `404` - NotFound: Resource doesn't exist
- `409` - Conflict: Resource state conflict
- `500` - InternalServerError: Unexpected errors

### Usage Examples

```typescript
// ✅ Business rule violation
throw new RpcException({
  statusCode: 400,
  message: 'Email already exists',
});

// ✅ Not found
throw new RpcException({
  statusCode: 404,
  message: `User with ID ${id} not found`,
});

// ✅ Authentication failure
throw new RpcException({
  statusCode: 401,
  message: 'Invalid email or password',
});

// ✅ Authorization failure
throw new RpcException({
  statusCode: 403,
  message: 'Admin access required',
});

// ✅ Conflict state
throw new RpcException({
  statusCode: 409,
  message: 'Cannot cancel shipped order',
});
```

---

## 📋 NESTJS EXCEPTION HIERARCHY (REFERENCE)

```
RpcException (Microservices) ← USE THIS FOR MICROSERVICES
  └─ statusCode: number
  └─ message: string

HttpException (Gateway/HTTP) ← USE ONLY FOR GATEWAY
  ├─ BadRequestException (400)
  ├─ UnauthorizedException (401)
  ├─ ForbiddenException (403)
  ├─ NotFoundException (404)
  ├─ ConflictException (409)
  └─ InternalServerErrorException (500)
```

---

## 🚫 ANTI-PATTERNS TO AVOID

### 1. Using HttpException in Microservices

```typescript
// ❌ WRONG - HttpException không work trong microservices
if (!user) {
  throw new NotFoundException(`User ${id} not found`);
}

// ✅ CORRECT - Use RpcException
if (!user) {
  throw new RpcException({
    statusCode: 404,
    message: `User ${id} not found`,
  });
}
```

### 2. Silent Failures

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
      throw new RpcException({
        statusCode: 404,
        message: `User ${id} not found`,
      });
    }
    return user;
  } catch (error) {
    if (error instanceof RpcException) throw error;
    console.error('[UsersService] findById error:', error);
    throw new RpcException({
      statusCode: 400,
      message: 'Failed to find user',
    });
  }
}
```

### 3. Generic Error Messages

```typescript
// ❌ WRONG - Vague messages
throw new RpcException({
  statusCode: 400,
  message: 'Error',
});

// ✅ CORRECT - Specific messages
throw new RpcException({
  statusCode: 400,
  message: 'Email already exists',
});
```

### 4. Missing Context in Logs

```typescript
// ❌ WRONG - No context
catch (error) {
  console.error(error);
  throw new RpcException({ statusCode: 400, message: 'Failed' });
}

// ✅ CORRECT - With context
catch (error) {
  console.error('[UsersService] create error:', error);
  throw new RpcException({
    statusCode: 400,
    message: 'Failed to create user',
  });
}
```

### 5. Not Re-throwing Known Exceptions

```typescript
// ❌ WRONG - Overwrites specific errors
catch (error) {
  throw new RpcException({
    statusCode: 400,
    message: 'Something went wrong',
  });
}

// ✅ CORRECT - Preserve specific errors
catch (error) {
  if (error instanceof RpcException) throw error;

  console.error('[UsersService] error:', error);
  throw new RpcException({
    statusCode: 400,
    message: 'Operation failed',
  });
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
    throw new RpcException({
      statusCode: 400,
      message: 'Email already exists',
    });
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
    throw new RpcException({
      statusCode: 404,
      message: 'Referenced product not found',
    });
  }
  throw error;
}
```

---

## 📦 GLOBAL ERROR FILTER

### RPC Exception Filter (Already Implemented)

```typescript
// libs/shared/filters/rpc-exception.filter.ts
@Catch()
export class AllRpcExceptionsFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<never> {
    const contextType = host.getType();

    if (contextType === 'http') {
      // Gateway context - convert to HTTP response
      return this.handleHttpException(exception, host);
    }

    // Microservice context - return RPC response
    return this.handleRpcException(exception);
  }
}
```

---

## 🎯 VALIDATION ERRORS

### DTO Validation (Automatic)

```typescript
// ValidationPipe automatically validates and rejects invalid DTOs
@MessagePattern(EVENTS.USER.CREATE)
create(@Payload() dto: CreateUserDto) {
  return this.service.create(dto);
}

// If DTO validation fails, ValidationPipe throws RpcException
// ✅ RECOMMENDED: Use @IsNotEmpty(), @IsEmail(), etc in DTO
```

### Manual Validation in Service

```typescript
async create(dto: CreateUserDto): Promise<UserResponse> {
  try {
    // Business rules validation
    if (dto.password.length < 8) {
      throw new RpcException({
        statusCode: 400,
        message: 'Password must be at least 8 characters',
      });
    }

    // ... rest of creation
  } catch (error) {
    // ... error handling
  }
}
```

---

## 📊 AI VALIDATION CHECKLIST

**When user writes async function in microservice, AI MUST CHECK:**

□ Has try-catch block
□ Throws RpcException (NOT HttpException) in microservices
□ Re-throws known RpcExceptions
□ Logs errors with context (`[ServiceName] methodName error:`)
□ Returns meaningful error messages
□ Doesn't swallow errors silently
□ Uses correct statusCode (400, 401, 403, 404, 409)

**IMMEDIATE FEEDBACK:**

```
🚨 MICROSERVICE EXCEPTION VIOLATION

Using HttpException in microservice:
  ❌ throw new NotFoundException(`User ${id} not found`);

💡 Use RpcException instead:
  ✅ throw new RpcException({
       statusCode: 404,
       message: `User ${id} not found`,
     });
```

---

## 🎓 THESIS DEFENSE POINTS

When asked about error handling in microservices:

- "All async operations wrapped in try-catch for reliability"
- "Use RpcException specifically designed for microservices (not HttpException)"
- "Structured error format: { statusCode, message } for NATS compatibility"
- "Errors logged with context for debugging"
- "Known exceptions re-thrown, unknown wrapped with context"
- "Global RPC filter ensures consistent error format across all microservices"
- "This approach ensures message-based transport compatibility (NATS, Redis, gRPC)"

---

**Remember**: Good errors help debugging, bad errors hide problems!
**Critical**: RpcException is mandatory for microservices - HttpException will fail!

```

```
