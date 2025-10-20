# Implement Service - Guided Implementation

Help me implement [SERVICE_NAME] following best practices.

## Service Context

- Purpose: [Describe the service purpose]
- Related entities: [List database entities]
- Dependencies: [List service dependencies]

## Implementation Checklist

### 1. Service Layer

```typescript
@Injectable()
export class [ServiceName]Service {
  // TODO: Implement CRUD operations
  // - Each method has explicit return type
  // - Proper error handling with try-catch
  // - Business logic validation
  // - Meaningful variable names
}
```

### 2. Controller Layer

```typescript
@Controller()
export class [ServiceName]Controller {
  constructor(private readonly service: [ServiceName]Service) {}

  // TODO: Add message patterns
  // - Thin controllers (just routing)
  // - No return types needed
  // - Direct delegation to service
}
```

### 3. DTOs

```typescript
export class Create[EntityName]Dto {
  // TODO: Add validation decorators
  // @IsNotEmpty(), @IsString(), @IsEmail(), etc.
}
```

### 4. Unit Tests

```typescript
describe('[ServiceName]Service', () => {
  // TODO: Test cases
  // - Happy path
  // - Error cases
  // - Edge cases
  // - Business rules
});
```

## Quality Checks Before Completion

- [ ] All methods have explicit return types
- [ ] Try-catch blocks for error handling
- [ ] DTOs validated with decorators
- [ ] Unit tests written (≥70% coverage)
- [ ] No `any` types used
- [ ] Follows Single Responsibility Principle
- [ ] Prisma queries optimized
- [ ] Error messages are user-friendly

## Implementation Guidance

Please help me:

1. Design the service structure following SOLID
2. Implement each method with proper error handling
3. Write corresponding unit tests
4. Ensure code is clean and maintainable for thesis

Remind me of common pitfalls and best practices as we go!
