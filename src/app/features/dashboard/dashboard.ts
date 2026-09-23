import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats } from '../../core/models/dashboard.models';
import { Product } from '../../core/models/product.models';
import { apiErrorMessage } from '../../core/http/api-error';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly productsInAlert = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // forkJoin : les deux requetes sont couplées, loading se termine dans tous les cas
    // (succès, erreur ou requête en échec) et une erreur est affichée.
    forkJoin({
      stats: this.dashboardService.getStats(),
      alerts: this.dashboardService.getProductsInAlert(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ stats, alerts }) => {
          this.stats.set(stats);
          this.productsInAlert.set(alerts);
        },
        error: (err) =>
          this.errorMessage.set(apiErrorMessage(err, 'Impossible de charger le tableau de bord.')),
      });
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
  }
}
