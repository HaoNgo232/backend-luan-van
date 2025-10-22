/**
 * Address Response Types
 * Based on Address model trong user-app Prisma schema
 */
export type AddressResponse = {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
  createdAt: Date;
};
