import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard, passwordChangeGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
    title: 'Connexion - Gestion de Stock',
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/change-password/change-password').then((m) => m.ChangePassword),
    title: 'Changer le mot de passe - Gestion de Stock',
  },
  {
    path: '',
    canActivate: [authGuard, passwordChangeGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Tableau de bord - Gestion de Stock',
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/products').then((m) => m.Products),
        title: 'Produits - Gestion de Stock',
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/product-detail/product-detail').then((m) => m.ProductDetail),
        title: 'Détail produit - Gestion de Stock',
      },
      {
        path: 'movements',
        loadComponent: () => import('./features/movements/movements').then((m) => m.Movements),
        title: 'Mouvements - Gestion de Stock',
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('./features/suppliers/suppliers').then((m) => m.Suppliers),
        title: 'Fournisseurs - Gestion de Stock',
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories').then((m) => m.Categories),
        title: 'Catégories - Gestion de Stock',
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/users').then((m) => m.Users),
        title: 'Utilisateurs - Gestion de Stock',
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
