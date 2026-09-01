export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  productReference: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  externalReference?: string;
  supplierId?: number;
  supplierNif?: string;
  supplierName?: string;
  recipient?: string;
  unitPrice: number;
  userName: string;
  movementDate: string;
}

export interface StockMovementRequest {
  productId: number;
  type: MovementType;
  quantity: number;
  reason?: string;
  externalReference?: string;
  supplierId?: number;
  recipient?: string;
  unitPrice?: number;
}
