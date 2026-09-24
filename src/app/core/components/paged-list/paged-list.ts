import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Gabarit commun des listes (paginées ou non) :
 * état de chargement, état vide, tableau projeté (ng-content)
 * et barre de pagination.
 */
@Component({
  selector: 'app-paged-list',
  templateUrl: './paged-list.html',
  styleUrl: './paged-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagedListComponent {
  /** Afficher l'état « Chargement... ». */
  readonly loading = input(false);

  /** Afficher l'état vide (aucun résultat). */
  readonly empty = input(false);

  /** Message de l'état vide. */
  readonly emptyMessage = input('Aucun résultat.');

  /** Page courante (0-based), affichée « Page n+1 / ... ». */
  readonly page = input(0);

  /** Nombre total de pages. */
  readonly totalPages = input(0);

  /** Afficher la barre de pagination (false pour les listes simples). */
  readonly paginated = input(true);

  /** Demande de changement de page (nouvelle page 0-based). */
  readonly pageChange = output<number>();
}
