export type UserResponse = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ListUsersResponse = {
  users: UserResponse[];
  total: number;
  page: number;
  pageSize: number;
};

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
} | null;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};
