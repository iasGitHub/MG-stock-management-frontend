import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { MouvementService } from '../../core/services/mouvement.service';
import { ProduitService } from '../../core/services/produit.service';
import { FournisseurService } from '../../core/services/fournisseur.service';
import { MouvementRequest, MouvementStock, TypeMouvement } from '../../core/models/mouvement.models';
import { Produit } from '../../core/models/produit.models';
import { Fournisseur } from '../../core/models/fournisseur.models';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-mouvements',
  templateUrl: './mouvements.html',
  styleUrl: './mouvements.scss',
})
export class Mouvements implements OnInit {
  private readonly mouvementService = inject(MouvementService);
  private readonly produitService = inject(ProduitService);
  private readonly fournisseurService = inject(FournisseurService);
  private readonly fb = new FormBuilder();

  readonly mouvements = signal<MouvementStock[]>([]);
  readonly produits = signal<Produit[]>([]);
  readonly fournisseurs = signal<Fournisseur[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(false);

  readonly filtreProduitId = signal<number | null>(null);
  readonly filtreType = signal<TypeMouvement | null>(null);

  readonly modalOuvert = signal(false);
  readonly typeSelectionne = signal<TypeMouvement>('ENTREE');
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    produitId: [null as number | null, Validators.required],
    quantite: [1, [Validators.required, Validators.min(1)]],
    motif: [''],
    referenceExterne: [''],
    fournisseurId: [null as number | null],
    destinataire: ['', Validators.maxLength(150)],
    prixUnitaire: [null as number | null],
  });

  ngOnInit(): void {
    this.charger();
    this.produitService.findAll('', 0, 500).subscribe((reponse) => this.produits.set(reponse.content));
    this.fournisseurService.findAll('', 0, 500).subscribe((reponse) => this.fournisseurs.set(reponse.content));
  }

  charger(): void {
    this.loading.set(true);
    this.mouvementService
      .findAll(this.filtreProduitId() ?? undefined, this.filtreType() ?? undefined, this.page(), 10)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (reponse) => {
          this.mouvements.set(reponse.content);
          this.totalElements.set(reponse.totalElements);
          this.totalPages.set(reponse.totalPages);
        },
        error: () => this.errorMessage.set('Impossible de charger les mouvements.'),
      });
  }

  filtrerParProduit(event: Event): void {
    const valeur = (event.target as HTMLSelectElement).value;
    this.filtreProduitId.set(valeur ? Number(valeur) : null);
    this.page.set(0);
    this.charger();
  }

  filtrerParType(type: TypeMouvement | null): void {
    this.filtreType.set(type);
    this.page.set(0);
    this.charger();
  }

  allerAPage(nouvellePage: number): void {
    if (nouvellePage < 0 || nouvellePage >= this.totalPages()) return;
    this.page.set(nouvellePage);
    this.charger();
  }

  ouvrirModal(type: TypeMouvement): void {
    this.typeSelectionne.set(type);
    this.form.reset({
      produitId: null,
      quantite: 1,
      motif: '',
      referenceExterne: '',
      fournisseurId: null,
      destinataire: '',
      prixUnitaire: null,
    });

    const fournisseurControl = this.form.controls.fournisseurId;
    const destinataireControl = this.form.controls.destinataire;
    if (type === 'ENTREE') {
      fournisseurControl.addValidators(Validators.required);
      destinataireControl.clearValidators();
    } else {
      fournisseurControl.clearValidators();
      destinataireControl.setValidators([Validators.required, Validators.maxLength(150)]);
    }
    fournisseurControl.updateValueAndValidity();
    destinataireControl.updateValueAndValidity();

    this.modalOuvert.set(true);
  }

  fermerModal(): void {
    this.modalOuvert.set(false);
    this.errorMessage.set(null);
  }

  produitSelectionne(): Produit | undefined {
    const id = this.form.controls.produitId.value;
    return this.produits().find((p) => p.id === Number(id));
  }

  enregistrer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valeur = this.form.getRawValue();
    if (!valeur.produitId) return;

    const estEntree = this.typeSelectionne() === 'ENTREE';
    const request: MouvementRequest = {
      produitId: Number(valeur.produitId),
      type: this.typeSelectionne(),
      quantite: valeur.quantite,
      motif: valeur.motif || undefined,
      referenceExterne: valeur.referenceExterne || undefined,
      prixUnitaire: valeur.prixUnitaire ?? undefined,
      ...(estEntree
        ? { fournisseurId: valeur.fournisseurId ?? undefined }
        : { destinataire: valeur.destinataire || undefined }),
    };

    this.mouvementService.enregistrer(request).subscribe({
      next: () => {
        this.fermerModal();
        this.charger();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? "Erreur lors de l'enregistrement du mouvement.");
      },
    });
  }
}
