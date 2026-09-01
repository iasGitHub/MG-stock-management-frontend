import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, Role } from '../models/auth.models';

const TOKEN_KEY = 'stock_token';
const USER_KEY = 'stock_user';

interface StoredUser {
  id: number;
  username: string;
  fullName: string;
  role: Role;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = '/api/auth';

  private readonly userSignal = signal<StoredUser | null>(this.readUser());
  readonly currentUser = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.userSignal() && !!this.token());
  readonly isAdmin = computed(() => this.userSignal()?.role === 'ADMIN');

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
        };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.userSignal.set(user);
      })
    );
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
