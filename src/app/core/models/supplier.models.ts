export interface Supplier {
  id: number;
  nif: string;
  name: string;
  phone?: string;
  address?: string;
  createdDate?: string;
}

export interface SupplierRequest {
  nif: string;
  name: string;
  phone?: string;
  address?: string;
}
