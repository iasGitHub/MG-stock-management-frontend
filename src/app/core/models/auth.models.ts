export type Role = 'ADMIN' | 'MANAGEMENT';

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  fullName: string;
  role: Role;
  mustChangePassword: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  active: boolean;
}

export interface UserRequest {
  username: string;
  password?: string;
  fullName: string;
  role: Role;
  active: boolean;
}
