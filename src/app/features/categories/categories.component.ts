import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { CategoryService } from '../../core/services/category.service';
import { AuthService } from '../../core/services/auth.service';
import { Category, CategoryRequest } from '../../core/models/category.models';
import { PageResponse } from '../../core/models/product.models';
import { PagedListComponent } from '../../core/components/paged-list/paged-list';
import { apiErrorMessage } from '../../core/http/api-error';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PagedListComponent, ReactiveFormsModule],
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  readonly auth = inject(AuthService);
  private readonly fb = new FormBuilder();

  readonly categories = signal<Category[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly size = signal(10);
  readonly totalPages = signal(0);
  readonly loading = signal(false);

  readonly search = signal('');
  readonly modalOpen = signal(false);
  readonly categoryInEdit = signal<Category | null>(null);
  readonly deleteInProgress = signal<Category | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly saving = signal(false);
  readonly deleting = signal(false);

  readonly canDelete = computed(() => this.auth.isAdmin());

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.categoryService
      .findAll(this.search(), this.page(), this.size())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: PageResponse<Category>) => {
          this.categories.set(response.content);
          this.totalElements.set(response.totalElements);
          this.totalPages.set(response.totalPages);
        },
        error: (err) =>
          this.errorMessage.set(apiErrorMessage(err, 'Impossible de charger les catégories.')),
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
    this.categoryInEdit.set(null);
    this.form.reset({ name: '' });
    this.modalOpen.set(true);
  }

  openEdit(category: Category): void {
    this.categoryInEdit.set(category);
    this.form.reset({ name: category.name });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.errorMessage.set(null);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const name = this.form.controls.name.value.trim();
    const request: CategoryRequest = { name };

    const call = this.categoryInEdit()
      ? this.categoryService.update(this.categoryInEdit()!.id, request)
      : this.categoryService.create(request);

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

  confirmDelete(category: Category): void {
    this.deleteInProgress.set(category);
  }

  delete(): void {
    const category = this.deleteInProgress();
    if (!category || this.deleting()) return;

    this.deleting.set(true);
    this.categoryService
      .delete(category.id)
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
}
