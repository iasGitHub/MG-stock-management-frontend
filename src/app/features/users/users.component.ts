import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { Role, User, UserRequest } from '../../core/models/auth.models';
import { PagedListComponent } from '../../core/components/paged-list/paged-list';
import { apiErrorMessage } from '../../core/http/api-error';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PagedListComponent, ReactiveFormsModule],
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  readonly auth = inject(AuthService);
  private readonly fb = new FormBuilder();

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);

  readonly modalOpen = signal(false);
  readonly userInEdit = signal<User | null>(null);
  readonly deleteInProgress = signal<User | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly saving = signal(false);
  readonly deleting = signal(false);

  readonly resetTarget = signal<User | null>(null);
  readonly resetting = signal(false);
  readonly temporaryPassword = signal<string | null>(null);
  readonly copiedPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    password: ['', [Validators.minLength(6)]],
    fullName: ['', [Validators.required]],
    role: ['MANAGEMENT' as Role, [Validators.required]],
    active: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.userService
      .findAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (list) => this.users.set(list),
        error: () => this.errorMessage.set('Impossible de charger les utilisateurs.'),
      });
  }

  openCreate(): void {
    this.userInEdit.set(null);
    this.form.reset({ username: '', password: '', fullName: '', role: 'MANAGEMENT', active: true });
    this.applyPasswordValidators();
    this.modalOpen.set(true);
  }

  openEdit(user: User): void {
    this.userInEdit.set(user);
    this.form.reset({
      username: user.username,
      password: '',
      fullName: user.fullName,
      role: user.role,
      active: user.active,
    });
    this.applyPasswordValidators();
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.errorMessage.set(null);
  }

  /** Le mot de passe est obligatoire a la creation, optionnel a la mise a jour. */
  private applyPasswordValidators(): void {
    const control = this.form.controls.password;
    control.setValidators(this.userInEdit() ? [] : [Validators.required, Validators.minLength(6)]);
    control.updateValueAndValidity();
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: UserRequest = {
      username: value.username,
      fullName: value.fullName,
      role: value.role,
      active: value.active,
      password: value.password || undefined,
    };

    const call = this.userInEdit()
      ? this.userService.update(this.userInEdit()!.id, request)
      : this.userService.create({ ...request, password: value.password! });

    this.saving.set(true);
    call.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.closeModal();
        this.load();
      },
      error: (err) => {
        this.errorMessage.set(apiErrorMessage(err, "Erreur lors de l'enregistrement."));
      },
    });
  }

  confirmDelete(user: User): void {
    this.deleteInProgress.set(user);
  }

  delete(): void {
    const user = this.deleteInProgress();
    if (!user || this.deleting()) return;

    this.deleting.set(true);
    this.userService
      .delete(user.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.deleteInProgress.set(null);
          this.load();
        },
        error: (err) => {
          this.errorMessage.set(apiErrorMessage(err, 'Erreur lors de la suppression.'));
          this.deleteInProgress.set(null);
        },
      });
  }

  toggleActive(user: User): void {
    this.userService.toggleActive(user.id).subscribe({
      next: () => this.load(),
      error: (err) =>
        this.errorMessage.set(apiErrorMessage(err, 'Impossible de mettre à jour le compte.')),
    });
  }

  confirmReset(user: User): void {
    this.errorMessage.set(null);
    this.resetTarget.set(user);
  }

  reset(): void {
    const user = this.resetTarget();
    if (!user || this.resetting()) return;

    this.resetting.set(true);
    this.userService
      .resetPassword(user.id)
      .pipe(finalize(() => this.resetting.set(false)))
      .subscribe({
        next: (response) => {
          this.resetTarget.set(null);
          this.temporaryPassword.set(response.temporaryPassword);
          this.copiedPassword.set(false);
        },
        error: (err) => {
          this.errorMessage.set(apiErrorMessage(err, 'Erreur lors de la réinitialisation.'));
          this.resetTarget.set(null);
        },
      });
  }

  closeResetResult(): void {
    this.temporaryPassword.set(null);
  }

  async copyTemporaryPassword(): Promise<void> {
    const password = this.temporaryPassword();
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      this.copiedPassword.set(true);
    } catch {
      this.copiedPassword.set(false);
    }
  }
}
