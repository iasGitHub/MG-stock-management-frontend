import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockMovementRequest, StockMovement, MovementType } from '../models/movement.models';
import { PageResponse } from '../models/product.models';
import { appEnv } from '../config/env';

@Injectable({ providedIn: 'root' })
export class MovementService {
  private readonly apiUrl = `${appEnv.apiUrl}/movements`;

  constructor(private http: HttpClient) {}

  findAll(productId?: number, type?: MovementType, page = 0, size = 10): Observable<PageResponse<StockMovement>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (productId != null) params = params.set('productId', productId);
    if (type) params = params.set('type', type);
    return this.http.get<PageResponse<StockMovement>>(this.apiUrl, { params });
  }

  record(request: StockMovementRequest): Observable<StockMovement> {
    return this.http.post<StockMovement>(this.apiUrl, request);
  }
}
