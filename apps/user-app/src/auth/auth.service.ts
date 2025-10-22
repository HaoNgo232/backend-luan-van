import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { LoginDto, VerifyDto, RefreshDto } from '@shared/dto/auth.dto';
import { AuthTokens, JwtService } from '@shared/main';
import { prisma } from '@user-app/prisma/prisma.client';
import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';

export interface IAuthService {
  login(dto: LoginDto): Promise<AuthTokens>;
  verify(dto: VerifyDto): Promise<jose.JWTPayload>;
  refresh(dto: RefreshDto): Promise<AuthTokens>;
}

@Injectable()
export class AuthService implements IAuthService {
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor(private readonly jwtService: JwtService) {
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Generate tokens
      const tokens = await this.generateTokens({
        sub: user.id, // Use 'sub' claim (JOSE standard)
        email: user.email,
        role: user.role,
      });

      return {
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('[AuthService] login error:', error);
      throw new BadRequestException('Login failed');
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
      const user = await prisma.user.findUnique({
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

  async refresh(dto: RefreshDto): Promise<AuthTokens> {
    try {
      // Verify refresh token with JwtService
      const decoded = await this.jwtService.verifyToken(dto.refreshToken);

      if (!decoded.sub) {
        throw new UnauthorizedException('Token payload must contain sub claim');
      }

      // Get userId from sub claim (JOSE standard)
      const userId = decoded.sub;

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
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

      // Generate new tokens
      return await this.generateTokens({
        sub: user.id, // Use 'sub' claim (JOSE standard)
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('[AuthService] refresh error:', error);
      throw new BadRequestException('Token refresh failed');
    }
  }

  private async generateTokens(payload: jose.JWTPayload): Promise<AuthTokens> {
    const expiresIn = this.parseExpiresIn(this.jwtExpiresIn);
    const refreshExpiresIn = this.parseExpiresIn(this.jwtRefreshExpiresIn);

    // Use JwtService to sign tokens with RSA private key
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
}
