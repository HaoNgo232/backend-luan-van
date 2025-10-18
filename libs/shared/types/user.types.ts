export type UserResponse = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
