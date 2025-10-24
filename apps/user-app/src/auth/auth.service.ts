import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { LoginDto, VerifyDto, RefreshDto, RegisterDto } from '@shared/dto/auth.dto';
import { AuthTokens, JwtService, UserResponse } from '@shared/main';
import { PrismaService } from '@user-app/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';

export interface IAuthService {
  login(dto: LoginDto): Promise<AuthTokens>;
  register(dto: RegisterDto): Promise<AuthTokens & { user: object }>;
  verify(dto: VerifyDto): Promise<jose.JWTPayload>;
  refresh(dto: RefreshDto): Promise<{ accessToken: string; refreshToken: string }>;
}

@Injectable()
export class AuthService implements IAuthService {
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    try {
      // Find and validate user
      const user = await this.validateUserCredentials(dto.email, dto.password);

      // Generate tokens
      const tokens = await this.generateTokens({
        sub: user.id, // Use 'sub' claim (JOSE standard)
        email: user.email,
        role: user.role,
      });

      const results = {
        ...tokens,
        user: {
          sub: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      } as AuthTokens;

      return results;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('[AuthService] login error:', error);
      throw new BadRequestException('Login failed');
    }
  }

  async register(dto: RegisterDto): Promise<AuthTokens> {
    try {
      // Check email có ton tại chưa
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new BadRequestException('Email already exists');
      }

      // Hash password với bcrypt (salt rounds = 10)
      const passwordHash = await bcrypt.hash(dto.password, 10);

      // Tạo user mới
      // LƯU Ý: Register luôn tạo CUSTOMER, không cho phép tự đăng ký ADMIN
      const newUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          role: 'CUSTOMER', // Hardcoded - ADMIN phải tạo từ admin panel
        },
      });

      // Tự động login sau khi register thành công → trả về tokens luôn
      const tokens = await this.generateTokens({
        sub: newUser.id, // 'sub' là standard claim trong JWT (subject/user ID)
        email: newUser.email,
        role: newUser.role,
      });

      const results = {
        ...tokens,
        user: {
          sub: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
        },
      } as AuthTokens;

      return results;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('[AuthService] register error:', error);
      throw new BadRequestException('Failed to register user');
    }
  }

  async verify(dto: VerifyDto): Promise<jose.JWTPayload> {
    try {
      // Use JwtService for RSA-based verification
      const decoded = await this.jwtService.verifyToken(dto.token);

      if (!decoded.sub) {
        throw new UnauthorizedException('Token payload must contain sub claim');
      }

      // Get userId from sub claim (JOSE standard)
      const userId = decoded.sub;

      // Verify user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      return decoded;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('[AuthService] verify error:', error);
      throw new UnauthorizedException('Token verification failed');
    }
  }

  async refresh(dto: RefreshDto): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token with JwtService
      const decoded = await this.jwtService.verifyToken(dto.refreshToken);

      if (!decoded.sub) {
        throw new UnauthorizedException('Token payload must contain sub claim');
      }

      // Get userId from sub claim (JOSE standard)
      const userId = decoded.sub;

      // Verify user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens({
        sub: user.id, // Use 'sub' claim (JOSE standard)
        email: user.email,
        role: user.role,
      });

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('[AuthService] refresh error:', error);
      throw new BadRequestException('Token refresh failed');
    }
  }

  private async generateTokens(
    payload: jose.JWTPayload,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const expiresIn = this.parseExpiresIn(this.jwtExpiresIn);
    const refreshExpiresIn = this.parseExpiresIn(this.jwtRefreshExpiresIn);

    // Tạo 2 loại token song song để tối ưu performance:
    // - accessToken: thời gian sống ngắn (15m) - dùng cho API calls
    // - refreshToken: thời gian sống dài (7d) - dùng để lấy accessToken mới
    // QUAN TRỌNG: Cả 2 đều dùng RSA private key để sign
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signToken(payload, expiresIn),
      this.jwtService.signToken(payload, refreshExpiresIn),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = new RegExp(/^(\d+)([smhd])$/).exec(expiresIn);
    if (!match) return 900; // default 15 minutes

    const value = Number.parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] || 60);
  }

  /**
   * Validate user credentials (email & password)
   * @throws UnauthorizedException if credentials are invalid or user is inactive
   */
  private async validateUserCredentials(
    email: string,
    password: string,
  ): Promise<{
    id: string;
    email: string;
    fullName: string;
    role: string;
  }> {
    // Find user by email
    const user = await this.findUserByEmail(email);

    // Check if user is active
    this.checkUserActive(user);

    // Verify password
    await this.verifyPassword(password, user.passwordHash);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }

  /**
   * Find user by email
   * @throws UnauthorizedException if user not found
   */
  private async findUserByEmail(email: string): Promise<UserResponse & { passwordHash: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const results = user as UserResponse & { passwordHash: string };

    return results;
  }

  /**
   * Check if user account is active
   * @throws UnauthorizedException if user is deactivated
   */
  private checkUserActive(user: { isActive: boolean }): void {
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }
  }

  /**
   * Verify password against hash
   * @throws UnauthorizedException if password is invalid
   */
  private async verifyPassword(password: string, passwordHash: string): Promise<void> {
    const isPasswordValid = await bcrypt.compare(password, passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
  }
}
