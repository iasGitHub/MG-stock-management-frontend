import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appEnv } from '../config/env';
import {
  InvoiceConfirmRequest,
  InvoiceImportResult,
  InvoiceParseResult,
} from '../models/invoice-import.models';

@Injectable({ providedIn: 'root' })
export class InvoiceImportService {
  private readonly apiUrl = `${appEnv.apiUrl}/invoices`;

  constructor(private http: HttpClient) {}

  parse(files: FileList | File[]): Observable<InvoiceParseResult> {
    const formData = new FormData();
    const list = Array.from(files);
    list.forEach((file) => formData.append('files', file));
    return this.http.post<InvoiceParseResult>(`${this.apiUrl}/parse`, formData);
  }

  confirm(invoices: InvoiceConfirmRequest[]): Observable<InvoiceImportResult> {
    return this.http.post<InvoiceImportResult>(`${this.apiUrl}/import`, invoices);
  }
}
