import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { SupplierService } from '../../core/services/supplier.service';
import { AuthService } from '../../core/services/auth.service';
import { Supplier, SupplierRequest } from '../../core/models/supplier.models';
import { PageResponse } from '../../core/models/product.models';

@Component({
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  selector: 'app-suppliers',
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.scss',
})
export class Suppliers implements OnInit {
  private readonly supplierService = inject(SupplierService);
  readonly auth = inject(AuthService);
  private readonly fb = new FormBuilder();

  readonly suppliers = signal<Supplier[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly size = signal(10);
  readonly totalPages = signal(0);
  readonly loading = signal(false);

  readonly search = signal('');
  readonly modalOpen = signal(false);
  readonly supplierInEdit = signal<Supplier | null>(null);
  readonly deleteInProgress = signal<Supplier | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly importMessage = signal<string | null>(null);
  readonly importing = signal(false);

  readonly canDelete = computed(() => this.auth.isAdmin());

  readonly form = this.fb.nonNullable.group({
    nif: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.maxLength(20)]],
    address: ['', [Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.supplierService
      .findAll(this.search(), this.page(), this.size())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: PageResponse<Supplier>) => {
          this.suppliers.set(response.content);
          this.totalElements.set(response.totalElements);
          this.totalPages.set(response.totalPages);
        },
        error: (err) => {
          const message = err?.error?.message ?? err?.error?.errors;
          if (typeof message === 'string') {
            this.errorMessage.set(message);
          } else if (message) {
            this.errorMessage.set(Object.values(message).join(' - ') as string);
          } else {
            this.errorMessage.set('Unable to load suppliers.');
          }
        },
      });
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(0);
    this.load();
  }

  goToPage(newPage: number): void {
    if (newPage < 0 || newPage >= this.totalPages()) return;
    this.page.set(newPage);
    this.load();
  }

  openCreate(): void {
    this.supplierInEdit.set(null);
    this.form.reset({ nif: '', name: '', phone: '', address: '' });
    this.modalOpen.set(true);
  }

  openEdit(supplier: Supplier): void {
    this.supplierInEdit.set(supplier);
    this.form.patchValue({
      nif: supplier.nif,
      name: supplier.name,
      phone: supplier.phone ?? '',
      address: supplier.address ?? '',
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.errorMessage.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: SupplierRequest = {
      nif: value.nif,
      name: value.name,
      phone: value.phone || undefined,
      address: value.address || undefined,
    };

    const call = this.supplierInEdit()
      ? this.supplierService.update(this.supplierInEdit()!.id, request)
      : this.supplierService.create(request);

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

  confirmDelete(supplier: Supplier): void {
    this.deleteInProgress.set(supplier);
  }

  delete(): void {
    const supplier = this.deleteInProgress();
    if (!supplier) return;

    this.supplierService.delete(supplier.id).subscribe({
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

  onImportFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.importing.set(true);
    this.importMessage.set(null);
    this.errorMessage.set(null);

    this.supplierService.importExcel(file).subscribe({
      next: (res) => {
        this.importing.set(false);
        (event.target as HTMLInputElement).value = '';
        this.importMessage.set(
          `${res.created} fournisseur(s) créé(s), ${res.skipped} ignoré(s) (total ${res.total}).`
        );
        this.load();
      },
      error: (err) => {
        this.importing.set(false);
        (event.target as HTMLInputElement).value = '';
        this.errorMessage.set(err?.error?.message ?? 'Erreur lors de l\'import.');
      },
    });
  }

  downloadTemplate(): void {
    this.supplierService.exportTemplate().subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modele_fournisseurs.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
