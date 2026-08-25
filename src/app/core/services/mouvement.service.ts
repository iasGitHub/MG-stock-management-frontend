import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MouvementRequest, MouvementStock, TypeMouvement } from '../models/mouvement.models';
import { PageResponse } from '../models/produit.models';

@Injectable({ providedIn: 'root' })
export class MouvementService {
  private readonly apiUrl = '/api/mouvements';

  constructor(private http: HttpClient) {}

  findAll(produitId?: number, type?: TypeMouvement, page = 0, size = 10): Observable<PageResponse<MouvementStock>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (produitId != null) params = params.set('produitId', produitId);
    if (type) params = params.set('type', type);
    return this.http.get<PageResponse<MouvementStock>>(this.apiUrl, { params });
  }

  enregistrer(request: MouvementRequest): Observable<MouvementStock> {
    return this.http.post<MouvementStock>(this.apiUrl, request);
  }
}
