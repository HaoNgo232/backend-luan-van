export class LoginDto {
  email: string;
  password: string;
}

export class VerifyDto {
  token: string;
}

export class RefreshDto {
  refreshToken: string;
}
