import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { FournisseurService } from '../../core/services/fournisseur.service';
import { AuthService } from '../../core/services/auth.service';
import { Fournisseur, FournisseurRequest } from '../../core/models/fournisseur.models';
import { PageResponse } from '../../core/models/produit.models';

@Component({
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  selector: 'app-fournisseurs',
  templateUrl: './fournisseurs.html',
  styleUrl: './fournisseurs.scss',
})
export class Fournisseurs implements OnInit {
  private readonly fournisseurService = inject(FournisseurService);
  readonly auth = inject(AuthService);
  private readonly fb = new FormBuilder();

  readonly fournisseurs = signal<Fournisseur[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly size = signal(10);
  readonly totalPages = signal(0);
  readonly loading = signal(false);

  readonly search = signal('');
  readonly modalOuvert = signal(false);
  readonly fournisseurEnEdition = signal<Fournisseur | null>(null);
  readonly suppressionEnCours = signal<Fournisseur | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly peutSupprimer = computed(() => this.auth.isAdmin());

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    nom: ['', [Validators.required, Validators.maxLength(100)]],
    telephone: ['', [Validators.maxLength(20)]],
    adresse: ['', [Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading.set(true);
    this.fournisseurService
      .findAll(this.search(), this.page(), this.size())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (reponse: PageResponse<Fournisseur>) => {
          this.fournisseurs.set(reponse.content);
          this.totalElements.set(reponse.totalElements);
          this.totalPages.set(reponse.totalPages);
        },
        error: () => this.errorMessage.set('Impossible de charger les fournisseurs.'),
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
    this.fournisseurEnEdition.set(null);
    this.form.reset({ code: '', nom: '', telephone: '', adresse: '' });
    this.modalOuvert.set(true);
  }

  ouvrirEdition(fournisseur: Fournisseur): void {
    this.fournisseurEnEdition.set(fournisseur);
    this.form.patchValue({
      code: fournisseur.code,
      nom: fournisseur.nom,
      telephone: fournisseur.telephone ?? '',
      adresse: fournisseur.adresse ?? '',
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
    const request: FournisseurRequest = {
      code: valeur.code,
      nom: valeur.nom,
      telephone: valeur.telephone || undefined,
      adresse: valeur.adresse || undefined,
    };

    const appel = this.fournisseurEnEdition()
      ? this.fournisseurService.update(this.fournisseurEnEdition()!.id, request)
      : this.fournisseurService.create(request);

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

  confirmerSuppression(fournisseur: Fournisseur): void {
    this.suppressionEnCours.set(fournisseur);
  }

  supprimer(): void {
    const fournisseur = this.suppressionEnCours();
    if (!fournisseur) return;

    this.fournisseurService.delete(fournisseur.id).subscribe({
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
