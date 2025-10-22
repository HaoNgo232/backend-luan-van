import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto } from '@shared/dto/auth.dto';
import { CreateUserDto } from '@shared/dto/user.dto';
import { AuthGuard } from '@gateway/auth/auth.guard';

/**
 * Authentication Controller
 * Handles user authentication: login, register, token refresh, and current user info
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Register a new user account
   */
  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login
   * Authenticate user and return JWT tokens
   */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  /**
   * GET /auth/me
   * Get current authenticated user information
   * Requires: Bearer token in Authorization header
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(
    @Req() req: Request & { user: { userId: string; email: string; role: string } },
  ) {
    return this.authService.getCurrentUser(req.user.userId);
  }

  /**
   * POST /auth/verify
   * Verify JWT token validity
   */
  @Post('verify')
  async verify(@Body() dto: { token: string }) {
    return this.authService.verify(dto);
  }
}
