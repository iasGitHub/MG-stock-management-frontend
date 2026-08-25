import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats } from '../../core/models/dashboard.models';
import { Produit } from '../../core/models/produit.models';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly produitsEnAlerte = signal<Produit[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe((stats) => this.stats.set(stats));
    this.dashboardService
      .getProduitsEnAlerte()
      .subscribe((produits) => {
        this.produitsEnAlerte.set(produits);
        this.loading.set(false);
      });
  }

  formatMontant(valeur: number): string {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(valeur);
  }
}
