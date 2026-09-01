export interface Product {
  id: number;
  reference: string;
  name: string;
  description?: string;
  category: string;
  stockQuantity: number;
  minThreshold: number;
  unitPrice: number;
  inAlert: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface ProductRequest {
  reference: string;
  name: string;
  description?: string;
  category: string;
  minThreshold: number;
  unitPrice: number;
  initialQuantity?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
