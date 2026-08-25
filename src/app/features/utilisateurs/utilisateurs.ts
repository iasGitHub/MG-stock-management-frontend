import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import { Role, Utilisateur, UtilisateurRequest } from '../../core/models/auth.models';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-utilisateurs',
  templateUrl: './utilisateurs.html',
  styleUrl: './utilisateurs.scss',
})
export class Utilisateurs implements OnInit {
  private readonly utilisateurService = inject(UtilisateurService);
  readonly auth = inject(AuthService);
  private readonly fb = new FormBuilder();

  readonly utilisateurs = signal<Utilisateur[]>([]);
  readonly loading = signal(false);

  readonly modalOuvert = signal(false);
  readonly utilisateurEnEdition = signal<Utilisateur | null>(null);
  readonly suppressionEnCours = signal<Utilisateur | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    password: ['', [Validators.minLength(6)]],
    nomComplet: ['', [Validators.required]],
    role: ['GESTIONNAIRE' as Role, [Validators.required]],
    actif: [true],
  });

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading.set(true);
    this.utilisateurService
      .findAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (liste) => this.utilisateurs.set(liste),
        error: () => this.errorMessage.set("Impossible de charger les utilisateurs."),
      });
  }

  ouvrirCreation(): void {
    this.utilisateurEnEdition.set(null);
    this.form.reset({ username: '', password: '', nomComplet: '', role: 'GESTIONNAIRE', actif: true });
    this.modalOuvert.set(true);
  }

  ouvrirEdition(utilisateur: Utilisateur): void {
    this.utilisateurEnEdition.set(utilisateur);
    this.form.reset({
      username: utilisateur.username,
      password: '',
      nomComplet: utilisateur.nomComplet,
      role: utilisateur.role,
      actif: utilisateur.actif,
    });
    this.form.controls.password.setValidators([]);
    this.form.controls.password.updateValueAndValidity();
    this.modalOuvert.set(true);
  }

  fermerModal(): void {
    this.form.controls.password.setValidators([Validators.minLength(6)]);
    this.form.controls.password.updateValueAndValidity();
    this.modalOuvert.set(false);
    this.errorMessage.set(null);
  }

  enregistrer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valeur = this.form.getRawValue();
    const request: UtilisateurRequest = {
      username: valeur.username,
      nomComplet: valeur.nomComplet,
      role: valeur.role,
      actif: valeur.actif,
      password: valeur.password || undefined,
    };

    const appel = this.utilisateurEnEdition()
      ? this.utilisateurService.update(this.utilisateurEnEdition()!.id, request)
      : this.utilisateurService.create({ ...request, password: valeur.password! });

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

  confirmerSuppression(utilisateur: Utilisateur): void {
    this.suppressionEnCours.set(utilisateur);
  }

  supprimer(): void {
    const utilisateur = this.suppressionEnCours();
    if (!utilisateur) return;

    this.utilisateurService.delete(utilisateur.id).subscribe({
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

  toggleActif(utilisateur: Utilisateur): void {
    this.utilisateurService.toggleActif(utilisateur.id).subscribe(() => this.charger());
  }
}
