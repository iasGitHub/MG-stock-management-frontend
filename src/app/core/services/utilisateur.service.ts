import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Utilisateur, UtilisateurRequest } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class UtilisateurService {
  private readonly apiUrl = '/api/utilisateurs';

  constructor(private http: HttpClient) {}

  findAll(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(this.apiUrl);
  }

  create(request: UtilisateurRequest): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(this.apiUrl, request);
  }

  update(id: number, request: UtilisateurRequest): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.apiUrl}/${id}`, request);
  }

  toggleActif(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/toggle-actif`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
