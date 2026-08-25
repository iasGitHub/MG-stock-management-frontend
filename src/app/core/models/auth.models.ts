export type Role = 'ADMIN' | 'GESTIONNAIRE';

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  nomComplet: string;
  role: Role;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface Utilisateur {
  id: number;
  username: string;
  nomComplet: string;
  role: Role;
  actif: boolean;
}

export interface UtilisateurRequest {
  username: string;
  password?: string;
  nomComplet: string;
  role: Role;
  actif: boolean;
}
