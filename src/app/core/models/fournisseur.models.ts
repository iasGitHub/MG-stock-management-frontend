export interface Fournisseur {
  id: number;
  code: string;
  nom: string;
  telephone?: string;
  adresse?: string;
  dateCreation?: string;
}

export interface FournisseurRequest {
  code: string;
  nom: string;
  telephone?: string;
  adresse?: string;
}
