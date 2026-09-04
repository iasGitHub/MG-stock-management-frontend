import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { InvoiceImportService } from '../../core/services/invoice-import.service';
import {
  InvoiceConfirmItem,
  InvoiceConfirmRequest,
  InvoiceImportResult,
  InvoiceParseResult,
} from '../../core/models/invoice-import.models';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-invoice-import',
  templateUrl: './invoice-import.html',
  styleUrl: './invoice-import.scss',
})
export class InvoiceImport {
  private readonly invoiceImportService = inject(InvoiceImportService);

  readonly selectedFiles = signal<File[]>([]);
  readonly parsing = signal(false);
  readonly importing = signal(false);
  readonly parsed = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly parsingMessage = signal<string | null>(null);
  readonly importResult = signal<InvoiceImportResult | null>(null);

  // Editable, mutable copies of the parsed draft data.
  private rawInvoices = signal<InvoiceDraftEditable[]>([]);
  readonly invoices = this.rawInvoices;

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.setFiles(Array.from(input.files));
    }
  }

  onFilesDropped(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.setFiles(Array.from(event.dataTransfer.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private setFiles(files: File[]): void {
    const pdfs = files.filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    this.selectedFiles.set(pdfs);
  }

  removeFile(index: number): void {
    this.selectedFiles.update((files) => files.filter((_, i) => i !== index));
  }

  parse(): void {
    if (this.selectedFiles().length === 0) return;

    this.parsing.set(true);
    this.parsingMessage.set(null);
    this.errorMessage.set(null);
    this.parsed.set(false);
    this.importResult.set(null);

    this.invoiceImportService
      .parse(this.selectedFiles())
      .pipe(finalize(() => this.parsing.set(false)))
      .subscribe({
        next: (result: InvoiceParseResult) => {
          this.rawInvoices.set(
            result.invoices.map((d) => ({ ...this.toEditable(d) }))
          );
          this.parsed.set(true);
          const errors = result.errors;
          this.parsingMessage.set(
            `${result.parsed} facture(s) lue(s), ${result.failed} en erreur.`
          );
          if (errors.length > 0) {
            this.errorMessage.set(errors.join('\n'));
          }
        },
        error: (err) => {
          this.parsed.set(false);
          this.errorMessage.set(
            this.extractMessage(err) ?? "Erreur lors de l'extraction."
          );
        },
      });
  }

  removeInvoice(index: number): void {
    this.rawInvoices.update((list) => list.filter((_, i) => i !== index));
  }

  removeItem(invIndex: number, itemIndex: number): void {
    this.rawInvoices.update((list) =>
      list.map((inv, i) =>
        i === invIndex
          ? { ...inv, items: inv.items.filter((_, j) => j !== itemIndex) }
          : inv
      )
    );
  }

  addItem(invIndex: number): void {
    this.rawInvoices.update((list) =>
      list.map((inv, i) =>
        i === invIndex
          ? {
              ...inv,
              items: [
                ...inv.items,
                { productName: '', quantity: 1, unitPrice: 0, category: '' },
              ],
            }
          : inv
      )
    );
  }

  confirmImport(): void {
    const requests: InvoiceConfirmRequest[] = [];
    for (const inv of this.rawInvoices()) {
      const items: InvoiceConfirmItem[] = inv.items
        .filter((item) => item.productName && item.productName.trim())
        .map((item) => ({
          productName: item.productName.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          category: item.category || undefined,
        }));
      if (items.length === 0) continue;
      requests.push({
        supplierNif: inv.supplierNif || undefined,
        supplierName: inv.supplierName || 'Fournisseur',
        supplierPhone: inv.supplierPhone || undefined,
        supplierAddress: inv.supplierAddress || undefined,
        invoiceNumber: inv.invoiceNumber || undefined,
        invoiceDate: inv.invoiceDate || undefined,
        items,
      });
    }

    if (requests.length === 0) {
      this.errorMessage.set('Aucune facture valide à importer.');
      return;
    }

    this.importing.set(true);
    this.errorMessage.set(null);

    this.invoiceImportService
      .confirm(requests)
      .pipe(finalize(() => this.importing.set(false)))
      .subscribe({
        next: (result: InvoiceImportResult) => {
          this.importResult.set(result);
        },
        error: (err) => {
          this.errorMessage.set(
            this.extractMessage(err) ?? "Erreur lors de l'import."
          );
        },
      });
  }

  resetAll(): void {
    this.rawInvoices.set([]);
    this.selectedFiles.set([]);
    this.parsed.set(false);
    this.importResult.set(null);
    this.errorMessage.set(null);
    this.parsingMessage.set(null);
  }

  private toEditable(d: any): InvoiceDraftEditable {
    return {
      fileName: d.fileName ?? '',
      supplierNif: d.supplierNif ?? '',
      supplierName: d.supplierName ?? '',
      supplierPhone: d.supplierPhone ?? '',
      supplierAddress: d.supplierAddress ?? '',
      invoiceNumber: d.invoiceNumber ?? '',
      invoiceDate: d.invoiceDate ?? '',
      items: (d.items ?? []).map((i: any) => ({
        productName: i?.productName ?? '',
        quantity: i?.quantity ?? 1,
        unitPrice: i?.unitPrice ?? 0,
        category: i?.category ?? '',
      })),
    };
  }

  private extractMessage(err: any): string | null {
    const message = err?.error?.message ?? err?.error?.errors;
    if (typeof message === 'string') return message;
    if (message) return Object.values(message).join(' - ') as string;
    return null;
  }
}

export interface InvoiceDraftEditable {
  fileName: string;
  supplierNif: string;
  supplierName: string;
  supplierPhone: string;
  supplierAddress: string;
  invoiceNumber: string;
  invoiceDate: string;
  items: InvoiceItemEditable[];
}

export interface InvoiceItemEditable {
  productName: string;
  quantity: number;
  unitPrice: number;
  category: string;
}
