export type TypeMouvement = 'ENTREE' | 'SORTIE';

export interface MouvementStock {
  id: number;
  produitId: number;
  produitNom: string;
  produitReference: string;
  type: TypeMouvement;
  quantite: number;
  motif?: string;
  referenceExterne?: string;
  fournisseurId?: number;
  fournisseurCode?: string;
  fournisseurNom?: string;
  destinataire?: string;
  prixUnitaire: number;
  utilisateurNom: string;
  dateMouvement: string;
}

export interface MouvementRequest {
  produitId: number;
  type: TypeMouvement;
  quantite: number;
  motif?: string;
  referenceExterne?: string;
  fournisseurId?: number;
  destinataire?: string;
  prixUnitaire?: number;
}
