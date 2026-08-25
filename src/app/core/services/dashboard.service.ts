import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats } from '../models/dashboard.models';
import { Produit } from '../models/produit.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = '/api/dashboard';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  getProduitsEnAlerte(): Observable<Produit[]> {
    return this.http.get<Produit[]>(`/api/produits/alertes`);
  }
}
