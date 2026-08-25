import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/produit.models';
import { Fournisseur, FournisseurRequest } from '../models/fournisseur.models';

@Injectable({ providedIn: 'root' })
export class FournisseurService {
  private readonly apiUrl = '/api/fournisseurs';

  constructor(private http: HttpClient) {}

  findAll(search = '', page = 0, size = 10, sortBy = 'nom', sortDir = 'asc'): Observable<PageResponse<Fournisseur>> {
    const params = new HttpParams()
      .set('search', search)
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
    return this.http.get<PageResponse<Fournisseur>>(this.apiUrl, { params });
  }

  create(request: FournisseurRequest): Observable<Fournisseur> {
    return this.http.post<Fournisseur>(this.apiUrl, request);
  }

  update(id: number, request: FournisseurRequest): Observable<Fournisseur> {
    return this.http.put<Fournisseur>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
