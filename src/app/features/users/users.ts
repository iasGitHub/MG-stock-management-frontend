import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { Role, User, UserRequest } from '../../core/models/auth.models';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-users',
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  private readonly userService = inject(UserService);
  readonly auth = inject(AuthService);
  private readonly fb = new FormBuilder();

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);

  readonly modalOpen = signal(false);
  readonly userInEdit = signal<User | null>(null);
  readonly deleteInProgress = signal<User | null>(null);
  readonly errorMessage = signal<string | null>(null);

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
        error: () => this.errorMessage.set('Unable to load users.'),
      });
  }

  openCreate(): void {
    this.userInEdit.set(null);
    this.form.reset({ username: '', password: '', fullName: '', role: 'MANAGEMENT', active: true });
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
    this.form.controls.password.setValidators([]);
    this.form.controls.password.updateValueAndValidity();
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.form.controls.password.setValidators([Validators.minLength(6)]);
    this.form.controls.password.updateValueAndValidity();
    this.modalOpen.set(false);
    this.errorMessage.set(null);
  }

  save(): void {
    if (this.form.invalid) {
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

    call.subscribe({
      next: () => {
        this.closeModal();
        this.load();
      },
      error: (err) => {
        const message = err?.error?.message ?? err?.error?.errors;
        if (typeof message === 'string') {
          this.errorMessage.set(message);
        } else if (message) {
          this.errorMessage.set(Object.values(message).join(' - ') as string);
        } else {
          this.errorMessage.set('Error while saving.');
        }
      },
    });
  }

  confirmDelete(user: User): void {
    this.deleteInProgress.set(user);
  }

  delete(): void {
    const user = this.deleteInProgress();
    if (!user) return;

    this.userService.delete(user.id).subscribe({
      next: () => {
        this.deleteInProgress.set(null);
        this.load();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Error while deleting.');
        this.deleteInProgress.set(null);
      },
    });
  }

  toggleActive(user: User): void {
    this.userService.toggleActive(user.id).subscribe(() => this.load());
  }
}
