import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { MovementService } from '../../core/services/movement.service';
import { ProductService } from '../../core/services/product.service';
import { SupplierService } from '../../core/services/supplier.service';
import { StockMovementRequest, StockMovement, MovementType } from '../../core/models/movement.models';
import { ProductLite } from '../../core/models/product.models';
import { SupplierLite } from '../../core/models/supplier.models';
import { PagedListComponent } from '../../core/components/paged-list/paged-list';
import { apiErrorMessage } from '../../core/http/api-error';
import { downloadBlob } from '../../core/http/download';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PagedListComponent, ReactiveFormsModule],
  selector: 'app-movements',
  templateUrl: './movements.component.html',
  styleUrl: './movements.component.scss',
})
export class MovementsComponent implements OnInit {
  private readonly movementService = inject(MovementService);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);
  private readonly fb = new FormBuilder();

  readonly movements = signal<StockMovement[]>([]);
  readonly products = signal<ProductLite[]>([]);
  readonly suppliers = signal<SupplierLite[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(false);

  readonly filterProductId = signal<number | null>(null);
  readonly filterType = signal<MovementType | null>(null);

  readonly modalOpen = signal(false);
  readonly selectedType = signal<MovementType>('IN');
  readonly errorMessage = signal<string | null>(null);
  readonly exporting = signal(false);
  readonly saving = signal(false);

  readonly cancelTarget = signal<StockMovement | null>(null);
  readonly cancelReason = this.fb.control<string>('', { nonNullable: true });
  readonly canceling = signal(false);
  readonly cancelError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    productId: [null as number | null, Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    reason: ['', Validators.maxLength(255)],
    externalReference: ['', Validators.maxLength(100)],
    supplierId: [null as number | null],
    recipient: ['', Validators.maxLength(150)],
    unitPrice: [null as number | null, Validators.min(0.01)],
  });

  ngOnInit(): void {
    this.load();
    // Listes déroulantes via les endpoints lite (pas de pagination, payload réduit).
    this.productService.findLite().subscribe({
      next: (list) => this.products.set(list),
      error: () => this.errorMessage.set('Impossible de charger les produits.'),
    });
    this.supplierService.findLite().subscribe({
      next: (list) => this.suppliers.set(list),
      error: () => this.errorMessage.set('Impossible de charger les fournisseurs.'),
    });
  }

  load(): void {
    this.loading.set(true);
    this.movementService
      .findAll(this.filterProductId() ?? undefined, this.filterType() ?? undefined, this.page(), 10)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.movements.set(response.content);
          this.totalElements.set(response.totalElements);
          this.totalPages.set(response.totalPages);
        },
        error: () => this.errorMessage.set('Impossible de charger les mouvements.'),
      });
  }

  filterByProduct(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterProductId.set(value ? Number(value) : null);
    this.page.set(0);
    this.load();
  }

  filterByType(type: MovementType | null): void {
    this.filterType.set(type);
    this.page.set(0);
    this.load();
  }

  goToPage(newPage: number): void {
    if (newPage < 0 || newPage >= this.totalPages()) return;
    this.page.set(newPage);
    this.load();
  }

  openModal(type: MovementType): void {
    this.selectedType.set(type);
    this.form.reset({
      productId: null,
      quantity: 1,
      reason: '',
      externalReference: '',
      supplierId: null,
      recipient: '',
      unitPrice: null,
    });

    const supplierControl = this.form.controls.supplierId;
    const recipientControl = this.form.controls.recipient;
    // setValidators (et non addValidators) : les validateurs ne s'accumulent pas
    // d'une ouverture de modale a l'autre.
    supplierControl.setValidators(type === 'IN' ? [Validators.required] : null);
    recipientControl.setValidators(
      type === 'OUT' ? [Validators.required, Validators.maxLength(150)] : null,
    );
    supplierControl.updateValueAndValidity();
    recipientControl.updateValueAndValidity();

    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.errorMessage.set(null);
  }

  selectedProduct(): ProductLite | undefined {
    const id = this.form.controls.productId.value;
    return this.products().find((p) => p.id === Number(id));
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (!value.productId) return;

    const isEntry = this.selectedType() === 'IN';
    const request: StockMovementRequest = {
      productId: Number(value.productId),
      type: this.selectedType(),
      quantity: value.quantity,
      reason: value.reason || undefined,
      externalReference: value.externalReference || undefined,
      unitPrice: value.unitPrice ?? undefined,
      ...(isEntry
        ? { supplierId: value.supplierId ?? undefined }
        : { recipient: value.recipient || undefined }),
    };

    this.saving.set(true);
    this.movementService
      .record(request)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.closeModal();
          this.load();
        },
        error: (err) =>
          this.errorMessage.set(apiErrorMessage(err, "Erreur lors de l'enregistrement du mouvement.")),
      });
  }

  exportExcel(): void {
    this.exporting.set(true);
    this.movementService
      .exportExcel(this.filterProductId() ?? undefined, this.filterType() ?? undefined)
      .pipe(finalize(() => this.exporting.set(false)))
      .subscribe({
        next: (blob) =>
          downloadBlob(blob, `mouvements_stock_${new Date().toISOString().slice(0, 10)}.xlsx`),
        error: () => this.errorMessage.set("Erreur lors de l'export Excel."),
      });
  }

  canCancel(movement: StockMovement): boolean {
    return !movement.reversesId;
  }

  openCancelModal(movement: StockMovement): void {
    this.cancelTarget.set(movement);
    this.cancelReason.reset('');
    this.cancelError.set(null);
  }

  closeCancelModal(): void {
    this.cancelTarget.set(null);
    this.cancelError.set(null);
  }

  confirmCancel(): void {
    const target = this.cancelTarget();
    if (!target) return;

    this.canceling.set(true);
    this.cancelError.set(null);
    const reason = this.cancelReason.value.trim() || undefined;
    this.movementService.cancel(target.id, reason).subscribe({
      next: () => {
        this.canceling.set(false);
        this.closeCancelModal();
        this.load();
      },
      error: (err) => {
        this.canceling.set(false);
        this.cancelError.set(err?.error?.message ?? 'Impossible d\'annuler ce mouvement.');
      },
    });
  }
}
