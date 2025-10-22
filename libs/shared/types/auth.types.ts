/**
 * Authentication Response Types
 * Định nghĩa các response types cho authentication endpoints
 */

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
};

export type VerifyResponse = {
  valid: boolean;
  userId?: string;
  email?: string;
  role?: string;
};

export type TokenPayload = {
  userId: string;
  email: string;
  role: string;
};
