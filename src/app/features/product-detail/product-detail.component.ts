import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { MovementService } from '../../core/services/movement.service';
import { Product } from '../../core/models/product.models';
import { StockMovement } from '../../core/models/movement.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly movementService = inject(MovementService);

  readonly product = signal<Product | null>(null);
  readonly movements = signal<StockMovement[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage.set('Identifiant de produit invalide.');
      this.loading.set(false);
      return;
    }

    this.productService.findById(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loadMovements(id);
      },
      error: () => {
        this.errorMessage.set('Produit introuvable.');
        this.loading.set(false);
      },
    });
  }

  private loadMovements(productId: number): void {
    this.movementService.findAll(productId, undefined, 0, 100).subscribe({
      next: (response) => {
        this.movements.set(response.content);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les mouvements.');
        this.loading.set(false);
      },
    });
  }
}
