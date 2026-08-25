import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ProduitService } from '../../core/services/produit.service';
import { AuthService } from '../../core/services/auth.service';
import { PageResponse, Produit, ProduitRequest } from '../../core/models/produit.models';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-produits',
  templateUrl: './produits.html',
  styleUrl: './produits.scss',
})
export class Produits implements OnInit {
  private readonly produitService = inject(ProduitService);
  readonly auth = inject(AuthService);
  private readonly fb = new FormBuilder();

  readonly produits = signal<Produit[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly size = signal(10);
  readonly totalPages = signal(0);
  readonly loading = signal(false);

  readonly search = signal('');
  readonly modalOuvert = signal(false);
  readonly produitEnEdition = signal<Produit | null>(null);
  readonly suppressionEnCours = signal<Produit | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly peutGerer = computed(() => true);
  readonly peutSupprimer = computed(() => this.auth.isAdmin());

  readonly form = this.fb.nonNullable.group({
    reference: ['', [Validators.required, Validators.maxLength(50)]],
    nom: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]],
    categorie: ['', [Validators.required, Validators.maxLength(50)]],
    seuilMin: [5, [Validators.required, Validators.min(0)]],
    prixUnitaire: [null as number | null, [Validators.required, Validators.min(0.01)]],
    quantiteInitiale: [0, [Validators.min(0)]],
  });

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading.set(true);
    this.produitService
      .findAll(this.search(), this.page(), this.size())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (reponse: PageResponse<Produit>) => {
          this.produits.set(reponse.content);
          this.totalElements.set(reponse.totalElements);
          this.totalPages.set(reponse.totalPages);
        },
        error: () => this.errorMessage.set('Impossible de charger les produits.'),
      });
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(0);
    this.charger();
  }

  allerAPage(nouvellePage: number): void {
    if (nouvellePage < 0 || nouvellePage >= this.totalPages()) return;
    this.page.set(nouvellePage);
    this.charger();
  }

  ouvrirCreation(): void {
    this.produitEnEdition.set(null);
    this.form.reset({
      reference: '',
      nom: '',
      description: '',
      categorie: '',
      seuilMin: 5,
      prixUnitaire: null,
      quantiteInitiale: 0,
    });
    this.modalOuvert.set(true);
  }

  ouvrirEdition(produit: Produit): void {
    this.produitEnEdition.set(produit);
    this.form.patchValue({
      reference: produit.reference,
      nom: produit.nom,
      description: produit.description ?? '',
      categorie: produit.categorie,
      seuilMin: produit.seuilMin,
      prixUnitaire: produit.prixUnitaire,
    });
    this.modalOuvert.set(true);
  }

  fermerModal(): void {
    this.modalOuvert.set(false);
    this.errorMessage.set(null);
  }

  enregistrer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valeur = this.form.getRawValue();
    const request: ProduitRequest = {
      reference: valeur.reference,
      nom: valeur.nom,
      description: valeur.description || undefined,
      categorie: valeur.categorie,
      seuilMin: valeur.seuilMin,
      prixUnitaire: valeur.prixUnitaire!,
      quantiteInitiale: this.produitEnEdition() ? undefined : valeur.quantiteInitiale,
    };

    const appel = this.produitEnEdition()
      ? this.produitService.update(this.produitEnEdition()!.id, request)
      : this.produitService.create(request);

    appel.subscribe({
      next: () => {
        this.fermerModal();
        this.charger();
      },
      error: (err) => {
        const message = err?.error?.message ?? err?.error?.errors;
        if (typeof message === 'string') {
          this.errorMessage.set(message);
        } else if (message) {
          this.errorMessage.set(Object.values(message).join(' - ') as string);
        } else {
          this.errorMessage.set("Erreur lors de l'enregistrement.");
        }
      },
    });
  }

  confirmerSuppression(produit: Produit): void {
    this.suppressionEnCours.set(produit);
  }

  supprimer(): void {
    const produit = this.suppressionEnCours();
    if (!produit) return;

    this.produitService.delete(produit.id).subscribe({
      next: () => {
        this.suppressionEnCours.set(null);
        this.charger();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Erreur lors de la suppression.');
        this.suppressionEnCours.set(null);
      },
    });
  }
}
