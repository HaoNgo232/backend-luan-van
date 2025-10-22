import { Module, Global } from '@nestjs/common';
import { JwtService } from './jwt.service';

/**
 * JWT Module - Global JWT Service Provider
 *
 * Marked as @Global() to make JwtService available across all modules
 * without explicit imports. This ensures consistent JWT handling
 * throughout the microservices architecture.
 *
 * Usage:
 * 1. Import JwtModule in your app's root module
 * 2. Inject JwtService anywhere in your application
 *
 * @example
 * // In app.module.ts
 * @Module({
 *   imports: [JwtModule],
 *   // ...
 * })
 * export class AppModule {}
 *
 * @example
 * // In any service/controller
 * constructor(private readonly jwtService: JwtService) {}
 */
@Global()
@Module({
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtModule {}
