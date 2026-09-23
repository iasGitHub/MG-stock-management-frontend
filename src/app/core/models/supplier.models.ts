export interface Supplier {
  id: number;
  nif: string;
  name: string;
  phone?: string;
  address?: string;
  createdDate?: string;
}

/** Vue allégée pour les listes déroulantes (GET /suppliers/lite). */
export interface SupplierLite {
  id: number;
  nif: string;
  name: string;
}

export interface SupplierRequest {
  nif: string;
  name: string;
  phone?: string;
  address?: string;
}
