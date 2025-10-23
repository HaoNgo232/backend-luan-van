---
phase: planning
title: Project Planning & Task Breakdown
description: Break down work into actionable tasks and estimate timeline
---

# Project Planning & Task Breakdown - User Authorization

## Milestones

**What are the major checkpoints?**

- [x] Milestone 1: Documentation Complete (Requirements, Design, Planning)
- [ ] Milestone 2: Core Implementation (RolesGuard, @Roles() decorator)
- [ ] Milestone 3: Testing Complete (Unit, Integration, E2E)
- [ ] Milestone 4: Documentation & Deployment Ready

## Task Breakdown

**What specific work needs to be done?**

### Phase 1: Foundation & Setup

**Estimated: 2 hours**

- [ ] Task 1.1: Tạo `roles.decorator.ts`
  - Location: `apps/gateway/src/auth/roles.decorator.ts`
  - Export `@Roles()` decorator và `ROLES_KEY` constant
  - Import `UserRole` từ `@shared/dto/user.dto`
  - **Effort**: 15 minutes
  - **Dependencies**: None

- [ ] Task 1.2: Tạo `roles.guard.ts`
  - Location: `apps/gateway/src/auth/roles.guard.ts`
  - Implement `RolesGuard` với logic kiểm tra role
  - Sử dụng NestJS `Reflector` để đọc metadata
  - Handle edge cases (no decorator, missing user, etc.)
  - **Effort**: 45 minutes
  - **Dependencies**: Task 1.1

- [ ] Task 1.3: Export RolesGuard và @Roles từ auth module
  - Update `apps/gateway/src/auth/index.ts` (nếu có)
  - Đảm bảo dễ import từ controllers
  - **Effort**: 10 minutes
  - **Dependencies**: Task 1.1, 1.2

### Phase 2: Testing

**Estimated: 4 hours**

- [ ] Task 2.1: Unit tests cho `@Roles()` decorator
  - Test metadata được set đúng
  - Test với single role
  - Test với multiple roles
  - **Effort**: 30 minutes
  - **Dependencies**: Task 1.1

- [ ] Task 2.2: Unit tests cho `RolesGuard`
  - Mock Reflector
  - Test case: No @Roles() decorator → allow access
  - Test case: User role matches → allow
  - Test case: User role doesn't match → 403
  - Test case: Multiple roles, user has one → allow
  - Test case: Missing user.role → 403
  - Test case: No required roles → allow
  - **Effort**: 2 hours
  - **Dependencies**: Task 1.2

- [ ] Task 2.3: Integration tests cho AuthGuard + RolesGuard
  - Setup test module với cả 2 guards
  - Test: No token → 401
  - Test: Invalid token → 401
  - Test: Valid CUSTOMER token + ADMIN endpoint → 403
  - Test: Valid ADMIN token + ADMIN endpoint → 200
  - Test: Valid token + no @Roles() → 200
  - **Effort**: 1.5 hours
  - **Dependencies**: Task 1.2, existing AuthGuard

- [ ] Task 2.4: E2E tests cho gateway endpoints
  - Test với real HTTP requests
  - Test các use cases trong requirements:
    - Admin creates user
    - Customer tries to create user (403)
    - Admin lists all users
    - Customer lists all users (403)
    - Customer views own profile
  - **Effort**: 1 hour
  - **Dependencies**: Task 1.2, Task 2.3

### Phase 3: Documentation

**Estimated: 2 hours**

- [ ] Task 3.1: Tạo implementation guide
  - File: `docs/ai/implementation/feature-user-authorization.md`
  - Code structure explanation
  - Usage examples
  - Common patterns
  - **Effort**: 45 minutes
  - **Dependencies**: Task 1.2

- [ ] Task 3.2: Tạo usage guide cho developers
  - Section trong gateway README hoặc riêng doc
  - How to apply @Roles() decorator
  - Examples cho từng use case
  - Common mistakes to avoid
  - **Effort**: 45 minutes
  - **Dependencies**: Task 3.1

- [ ] Task 3.3: Tạo migration checklist
  - List endpoints cần update
  - Step-by-step guide để apply authorization
  - Testing checklist
  - **Effort**: 30 minutes
  - **Dependencies**: Task 3.2

### Phase 4: Optional Enhancements

**Estimated: 2 hours (optional)**

- [ ] Task 4.1: Thêm logging cho failed authorization
  - Log user info, endpoint, required roles
  - Use NestJS Logger
  - **Effort**: 30 minutes
  - **Dependencies**: Task 1.2

- [ ] Task 4.2: Tạo custom decorator kết hợp `@UseGuards()` + `@Roles()`
  - Example: `@RequireRole(UserRole.ADMIN)` → apply both guards
  - Giảm boilerplate code
  - **Effort**: 1 hour
  - **Dependencies**: Task 1.1, 1.2

- [ ] Task 4.3: Tạo script audit existing endpoints
  - Scan tất cả controllers
  - List endpoints có AuthGuard nhưng chưa có RolesGuard
  - Output recommendation
  - **Effort**: 1.5 hours
  - **Dependencies**: Task 1.2

## Dependencies

**What needs to happen in what order?**

### Critical Path

```
Task 1.1 (Decorator)
    ↓
Task 1.2 (RolesGuard)
    ↓
Task 2.2 (Unit tests) → Task 2.3 (Integration tests) → Task 2.4 (E2E tests)
    ↓
Task 3.1 (Implementation guide) → Task 3.2 (Usage guide) → Task 3.3 (Migration checklist)
```

### External Dependencies

- **NestJS Framework**: Existing, no action needed
- **@shared/dto/user.dto**: Existing `UserRole` enum
- **AuthGuard**: Existing implementation
- **JWT tokens**: Must include `role` field (already done)

### Blockers

- None. All dependencies exist in codebase.

## Timeline & Estimates

**When will things be done?**

### Day 1 (4 hours)

**Morning (2 hours)**:

- [x] Requirements & Design documentation (already done)
- [ ] Task 1.1, 1.2, 1.3: Implementation
- [ ] Task 2.1: Decorator unit tests

**Afternoon (2 hours)**:

- [ ] Task 2.2: RolesGuard unit tests
- [ ] Task 2.3: Integration tests (partial)

### Day 2 (4 hours)

**Morning (2 hours)**:

- [ ] Task 2.3: Integration tests (complete)
- [ ] Task 2.4: E2E tests

**Afternoon (2 hours)**:

- [ ] Task 3.1, 3.2, 3.3: Documentation
- [ ] Code review & polish

### Buffer

- **1 hour**: Unexpected issues, debugging, refactoring
- **1 hour**: Review & feedback incorporation

**Total Estimated Time**: 8-10 hours (1-2 days with other tasks)

## Risks & Mitigation

**What could go wrong?**

### Risk 1: Guard Order Issues

**Description**: Developer apply guards sai thứ tự (`RolesGuard, AuthGuard` instead of `AuthGuard, RolesGuard`)

**Impact**: Medium - RolesGuard lỗi vì `request.user` chưa tồn tại

**Likelihood**: Medium

**Mitigation**:

- ✅ Documentation rõ ràng về guard order
- ✅ Error message hint nếu `request.user` không tồn tại
- ✅ Integration tests cover trường hợp này
- 🔄 (Optional) Tạo custom decorator kết hợp 2 guards với đúng order

### Risk 2: Developer Forget to Apply RolesGuard

**Description**: Developer chỉ dùng `@UseGuards(AuthGuard)` mà quên `RolesGuard`

**Impact**: High - Security vulnerability (authentication only, no authorization)

**Likelihood**: High (especially khi update existing endpoints)

**Mitigation**:

- ✅ Migration checklist rõ ràng
- ✅ Code review process
- 🔄 (Optional) Script audit endpoints thiếu RolesGuard
- 🔄 (Optional) Global guard với opt-out mechanism (future enhancement)

### Risk 3: JWT Token Missing `role` Field

**Description**: Old tokens hoặc tokens từ external systems không có `role` field

**Impact**: Medium - AuthGuard đã validate, nhưng RolesGuard cần handle

**Likelihood**: Low (AuthGuard already validates)

**Mitigation**:

- ✅ AuthGuard validation đảm bảo `role` field tồn tại
- ✅ RolesGuard check `user.role` existence và throw clear error
- ✅ Tests cover missing role scenario

### Risk 4: Performance Impact

**Description**: Thêm guard tăng latency

**Impact**: Low - Guard rất nhẹ (~0.1ms)

**Likelihood**: Low

**Mitigation**:

- ✅ Design analysis shows minimal overhead
- 🔄 Performance tests nếu cần (optional)

### Risk 5: Testing Coverage Gaps

**Description**: Tests không cover hết edge cases

**Impact**: Medium - Bugs in production

**Likelihood**: Medium

**Mitigation**:

- ✅ Comprehensive test plan (unit, integration, E2E)
- ✅ Code coverage tools
- ✅ Manual testing checklist

## Resources Needed

**What do we need to succeed?**

### Team Members & Roles

- **Developer** (bạn): Implementation, testing, documentation
- **Reviewer**: Code review (có thể là team lead hoặc senior dev)
- **QA** (optional): Manual testing validation

### Tools & Services

- ✅ NestJS framework (existing)
- ✅ Jest testing framework (existing)
- ✅ TypeScript (existing)
- ✅ VSCode/IDE (existing)

### Infrastructure

- ✅ Local development environment (existing)
- ✅ Git repository (existing)
- ✅ CI/CD pipeline (existing, will run tests automatically)

### Documentation & Knowledge

- ✅ NestJS Guards documentation: https://docs.nestjs.com/guards
- ✅ NestJS Custom Decorators: https://docs.nestjs.com/custom-decorators
- ✅ NestJS Reflector: https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata
- ✅ Project architecture docs (already in `docs/ai/design/`)

## Success Metrics

**How do we measure success?**

### Code Quality

- [ ] All unit tests pass (100% coverage on new code)
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] ESLint passes (no new warnings)
- [ ] TypeScript compilation successful (no errors)

### Functional Requirements

- [ ] `RolesGuard` works as designed
- [ ] `@Roles()` decorator works correctly
- [ ] Integration with `AuthGuard` works
- [ ] All use cases in requirements satisfied

### Documentation Quality

- [ ] Implementation guide clear và complete
- [ ] Usage examples easy to follow
- [ ] Migration checklist actionable

### Timeline

- [ ] Completed within 1-2 days estimate
- [ ] No critical bugs in production

## Next Steps After Completion

### Immediate (trong scope này)

1. Merge code vào main branch
2. Update team trong standup/Slack
3. Share usage guide với team

### Future Enhancements (out of scope)

1. **Permission-based authorization**: Nếu cần fine-grained control
2. **Resource ownership checks**: `@CheckOwnership()` decorator
3. **Dynamic roles**: Load roles từ database thay vì hardcode
4. **Token revocation**: Blacklist để revoke tokens trước expiry
5. **Audit logging**: Track tất cả authorization decisions
6. **Admin dashboard**: UI để manage roles và permissions

## Notes

- Keep implementation simple (KISS principle)
- Prioritize developer experience (DX)
- Write tests first (TDD approach recommended)
- Document as you go (don't leave for later)
