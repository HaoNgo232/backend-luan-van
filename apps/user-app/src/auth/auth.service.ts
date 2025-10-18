import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { LoginDto, VerifyDto, RefreshDto } from '@shared/dto/auth.dto';
import { prisma } from '@user-app/prisma/prisma.client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET_KEY || 'default_secret';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  async login(dto: LoginDto): Promise<AuthTokens & { user: object }> {
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
      const isPasswordValid = await bcrypt.compare(
        dto.password,
        user.passwordHash,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Generate tokens
      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('[AuthService] login error:', error);
      throw new BadRequestException('Login failed');
    }
  }

  async verify(dto: VerifyDto): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(dto.token, this.jwtSecret) as JwtPayload;

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }

  async refresh(dto: RefreshDto): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        dto.refreshToken,
        this.jwtSecret,
      ) as JwtPayload;

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
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
      return this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      if (
        error instanceof jwt.JsonWebTokenError ||
        error instanceof jwt.TokenExpiredError
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      console.error('[AuthService] refresh error:', error);
      throw new BadRequestException('Token refresh failed');
    }
  }

  private generateTokens(payload: JwtPayload): AuthTokens {
    const expiresIn = this.parseExpiresIn(this.jwtExpiresIn);
    const refreshExpiresIn = this.parseExpiresIn(this.jwtRefreshExpiresIn);

    const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn });

    const refreshToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: refreshExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 minutes

    const value = parseInt(match[1], 10);
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
