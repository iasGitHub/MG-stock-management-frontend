import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse, Produit, ProduitRequest } from '../models/produit.models';

@Injectable({ providedIn: 'root' })
export class ProduitService {
  private readonly apiUrl = '/api/produits';

  constructor(private http: HttpClient) {}

  findAll(search = '', page = 0, size = 10, sortBy = 'nom', sortDir = 'asc'): Observable<PageResponse<Produit>> {
    const params = new HttpParams()
      .set('search', search)
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
    return this.http.get<PageResponse<Produit>>(this.apiUrl, { params });
  }

  findById(id: number): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/${id}`);
  }

  create(request: ProduitRequest): Observable<Produit> {
    return this.http.post<Produit>(this.apiUrl, request);
  }

  update(id: number, request: ProduitRequest): Observable<Produit> {
    return this.http.put<Produit>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
