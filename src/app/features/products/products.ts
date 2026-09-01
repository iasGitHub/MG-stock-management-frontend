import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { AuthService } from '../../core/services/auth.service';
import { PageResponse, Product, ProductRequest } from '../../core/models/product.models';
import { Category } from '../../core/models/category.models';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-products',
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  readonly auth = inject(AuthService);
  private readonly fb = new FormBuilder();

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly size = signal(10);
  readonly totalPages = signal(0);
  readonly loading = signal(false);

  readonly search = signal('');
  readonly modalOpen = signal(false);
  readonly productInEdit = signal<Product | null>(null);
  readonly deleteInProgress = signal<Product | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly canManage = computed(() => true);
  readonly canDelete = computed(() => this.auth.isAdmin());

  readonly form = this.fb.nonNullable.group({
    reference: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]],
    category: ['', [Validators.required]],
    minThreshold: [5, [Validators.required, Validators.min(0)]],
    unitPrice: [null as number | null, [Validators.required, Validators.min(0.01)]],
    initialQuantity: [0, [Validators.min(0)]],
  });

  ngOnInit(): void {
    this.load();
    this.categoryService.findAllList().subscribe((categories) => this.categories.set(categories));
  }

  load(): void {
    this.loading.set(true);
    this.productService
      .findAll(this.search(), this.page(), this.size())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: PageResponse<Product>) => {
          this.products.set(response.content);
          this.totalElements.set(response.totalElements);
          this.totalPages.set(response.totalPages);
        },
        error: () => this.errorMessage.set('Unable to load products.'),
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
    this.productInEdit.set(null);
    this.form.reset({
      reference: '',
      name: '',
      description: '',
      category: '',
      minThreshold: 5,
      unitPrice: null,
      initialQuantity: 0,
    });
    this.form.controls.reference.disable();

    this.productService.nextReference().subscribe({
      next: ({ reference }) => this.form.controls.reference.setValue(reference),
      error: () => this.form.controls.reference.setValue(''),
    });

    this.modalOpen.set(true);
  }

  openEdit(product: Product): void {
    this.productInEdit.set(product);
    this.form.patchValue({
      reference: product.reference,
      name: product.name,
      description: product.description ?? '',
      category: product.category,
      minThreshold: product.minThreshold,
      unitPrice: product.unitPrice,
    });
    this.form.controls.reference.disable();
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.form.controls.reference.enable();
    this.modalOpen.set(false);
    this.errorMessage.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: ProductRequest = {
      reference: value.reference,
      name: value.name,
      description: value.description || undefined,
      category: value.category,
      minThreshold: value.minThreshold,
      unitPrice: value.unitPrice!,
      initialQuantity: this.productInEdit() ? undefined : value.initialQuantity,
    };

    const call = this.productInEdit()
      ? this.productService.update(this.productInEdit()!.id, request)
      : this.productService.create(request);

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

  confirmDelete(product: Product): void {
    this.deleteInProgress.set(product);
  }

  delete(): void {
    const product = this.deleteInProgress();
    if (!product) return;

    this.productService.delete(product.id).subscribe({
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
}
