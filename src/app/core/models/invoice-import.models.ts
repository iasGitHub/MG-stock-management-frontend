export interface InvoiceItemDraft {
  productName: string;
  quantity: number;
  unitPrice: number | null;
  category: string | null;
}

export interface InvoiceDraft {
  fileName: string;
  supplierNif: string | null;
  supplierName: string | null;
  supplierPhone: string | null;
  supplierAddress: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  items: InvoiceItemDraft[];
}

export interface InvoiceParseResult {
  invoices: InvoiceDraft[];
  errors: string[];
  parsed: number;
  failed: number;
}

export interface InvoiceConfirmItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  category?: string;
}

export interface InvoiceConfirmRequest {
  supplierNif?: string;
  supplierName: string;
  supplierPhone?: string;
  supplierAddress?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  items: InvoiceConfirmItem[];
}

export interface InvoiceImportResult {
  suppliersCreated: number;
  productsCreated: number;
  movementsCreated: number;
  warnings: string[];
  errors: string[];
}
