export interface Produit {
  id: number;
  reference: string;
  nom: string;
  description?: string;
  categorie: string;
  quantiteStock: number;
  seuilMin: number;
  prixUnitaire: number;
  enAlerte: boolean;
  dateCreation?: string;
  dateModification?: string;
}

export interface ProduitRequest {
  reference: string;
  nom: string;
  description?: string;
  categorie: string;
  seuilMin: number;
  prixUnitaire: number;
  quantiteInitiale?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
