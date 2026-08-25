import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
    title: 'Connexion - Gestion de Stock',
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Tableau de bord - Gestion de Stock',
      },
      {
        path: 'produits',
        loadComponent: () => import('./features/produits/produits').then((m) => m.Produits),
        title: 'Produits - Gestion de Stock',
      },
      {
        path: 'mouvements',
        loadComponent: () => import('./features/mouvements/mouvements').then((m) => m.Mouvements),
        title: 'Mouvements - Gestion de Stock',
      },
      {
        path: 'fournisseurs',
        loadComponent: () =>
          import('./features/fournisseurs/fournisseurs').then((m) => m.Fournisseurs),
        title: 'Fournisseurs - Gestion de Stock',
      },
      {
        path: 'utilisateurs',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/utilisateurs/utilisateurs').then((m) => m.Utilisateurs),
        title: 'Utilisateurs - Gestion de Stock',
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
