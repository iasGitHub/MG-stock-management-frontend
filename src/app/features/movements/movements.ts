import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { MovementService } from '../../core/services/movement.service';
import { ProductService } from '../../core/services/product.service';
import { SupplierService } from '../../core/services/supplier.service';
import { StockMovementRequest, StockMovement, MovementType } from '../../core/models/movement.models';
import { Product } from '../../core/models/product.models';
import { Supplier } from '../../core/models/supplier.models';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-movements',
  templateUrl: './movements.html',
  styleUrl: './movements.scss',
})
export class Movements implements OnInit {
  private readonly movementService = inject(MovementService);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);
  private readonly fb = new FormBuilder();

  readonly movements = signal<StockMovement[]>([]);
  readonly products = signal<Product[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
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

  readonly form = this.fb.nonNullable.group({
    productId: [null as number | null, Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    reason: [''],
    externalReference: [''],
    supplierId: [null as number | null],
    recipient: ['', Validators.maxLength(150)],
    unitPrice: [null as number | null],
  });

  ngOnInit(): void {
    this.load();
    this.productService.findAll('', 0, 500).subscribe((response) => this.products.set(response.content));
    this.supplierService.findAll('', 0, 500).subscribe((response) => this.suppliers.set(response.content));
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
        error: () => this.errorMessage.set('Unable to load movements.'),
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
    if (type === 'IN') {
      supplierControl.addValidators(Validators.required);
      recipientControl.clearValidators();
    } else {
      supplierControl.clearValidators();
      recipientControl.setValidators([Validators.required, Validators.maxLength(150)]);
    }
    supplierControl.updateValueAndValidity();
    recipientControl.updateValueAndValidity();

    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.errorMessage.set(null);
  }

  selectedProduct(): Product | undefined {
    const id = this.form.controls.productId.value;
    return this.products().find((p) => p.id === Number(id));
  }

  save(): void {
    if (this.form.invalid) {
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

    this.movementService.record(request).subscribe({
      next: () => {
        this.closeModal();
        this.load();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Error while saving the movement.');
      },
    });
  }

  exportExcel(): void {
    this.exporting.set(true);
    this.movementService.exportExcel(this.filterProductId() ?? undefined, this.filterType() ?? undefined).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mouvements_stock_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.exporting.set(false);
        this.errorMessage.set('Erreur lors de l\'export Excel.');
      },
    });
  }
}
