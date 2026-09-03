import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, ChangePasswordRequest, LoginRequest, Role } from '../models/auth.models';
import { appEnv } from '../config/env';

const TOKEN_KEY = 'stock_token';
const USER_KEY = 'stock_user';

interface StoredUser {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  mustChangePassword: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${appEnv.apiUrl}/auth`;

  private readonly userSignal = signal<StoredUser | null>(this.readUser());
  readonly currentUser = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.userSignal() && !!this.token());
  readonly isAdmin = computed(() => this.userSignal()?.role === 'ADMIN');
  readonly mustChangePassword = computed(() => this.userSignal()?.mustChangePassword ?? false);

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.token);
        const user: StoredUser = {
          id: response.id,
          username: response.username,
          fullName: response.fullName,
          role: response.role,
          mustChangePassword: response.mustChangePassword,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.userSignal.set(user);
      })
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, request).pipe(
      tap(() => this.setMustChangePassword(false))
    );
  }

  setMustChangePassword(value: boolean): void {
    const current = this.userSignal();
    if (!current) return;
    const updated: StoredUser = { ...current, mustChangePassword: value };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    this.userSignal.set(updated);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }

  token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private readUser(): StoredUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as StoredUser) : null;
    } catch {
      return null;
    }
  }
}
