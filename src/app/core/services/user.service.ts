import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserRequest } from '../models/auth.models';
import { appEnv } from '../config/env';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${appEnv.apiUrl}/users`;

  findAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  create(request: UserRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, request);
  }

  update(id: number, request: UserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, request);
  }

  toggleActive(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
