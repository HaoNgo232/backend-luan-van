export class CreateUserDto {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  role?: 'ADMIN' | 'CUSTOMER';
}

export class UpdateUserDto {
  fullName?: string;
  phone?: string;
  role?: 'ADMIN' | 'CUSTOMER';
  isActive?: boolean;
}

export class ListUsersDto {
  page?: number;
  pageSize?: number;
  q?: string;
}
