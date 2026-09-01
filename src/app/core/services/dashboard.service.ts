import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats } from '../models/dashboard.models';
import { Product } from '../models/product.models';
import { appEnv } from '../config/env';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = `${appEnv.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  getProductsInAlert(): Observable<Product[]> {
    return this.http.get<Product[]>(`${appEnv.apiUrl}/products/alerts`);
  }
}
