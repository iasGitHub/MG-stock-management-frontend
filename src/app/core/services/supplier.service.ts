import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../models/product.models';
import { Supplier, SupplierRequest } from '../models/supplier.models';
import { appEnv } from '../config/env';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly apiUrl = `${appEnv.apiUrl}/suppliers`;

  constructor(private http: HttpClient) {}

  findAll(search = '', page = 0, size = 10, sortBy = 'name', sortDir = 'asc'): Observable<PageResponse<Supplier>> {
    const params = new HttpParams()
      .set('search', search)
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
    return this.http.get<PageResponse<Supplier>>(this.apiUrl, { params });
  }

  create(request: SupplierRequest): Observable<Supplier> {
    return this.http.post<Supplier>(this.apiUrl, request);
  }

  update(id: number, request: SupplierRequest): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
