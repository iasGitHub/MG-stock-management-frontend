import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats } from '../../core/models/dashboard.models';
import { Product } from '../../core/models/product.models';

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

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe((stats) => this.stats.set(stats));
    this.dashboardService
      .getProductsInAlert()
      .subscribe((products) => {
        this.productsInAlert.set(products);
        this.loading.set(false);
      });
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
  }
}
