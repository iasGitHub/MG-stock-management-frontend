import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard, passwordChangeGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
    title: 'Connexion - Gestion de Stock',
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/change-password/change-password.component').then((m) => m.ChangePasswordComponent),
    title: 'Changer le mot de passe - Gestion de Stock',
  },
  {
    path: '',
    canActivate: [authGuard, passwordChangeGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Tableau de bord - Gestion de Stock',
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/products.component').then((m) => m.ProductsComponent),
        title: 'Produits - Gestion de Stock',
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/product-detail/product-detail.component').then((m) => m.ProductDetailComponent),
        title: 'Détail produit - Gestion de Stock',
      },
      {
        path: 'movements',
        loadComponent: () => import('./features/movements/movements.component').then((m) => m.MovementsComponent),
        title: 'Mouvements - Gestion de Stock',
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('./features/suppliers/suppliers.component').then((m) => m.SuppliersComponent),
        title: 'Fournisseurs - Gestion de Stock',
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories.component').then((m) => m.CategoriesComponent),
        title: 'Catégories - Gestion de Stock',
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
        title: 'Utilisateurs - Gestion de Stock',
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
