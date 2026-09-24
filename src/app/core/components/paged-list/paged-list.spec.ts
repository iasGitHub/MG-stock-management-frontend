import { TestBed } from '@angular/core/testing';
import { PagedListComponent } from './paged-list';

describe('PagedListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagedListComponent],
    }).compileComponents();
  });

  it("affiche l'état de chargement", () => {
    const fixture = TestBed.createComponent(PagedListComponent);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Chargement...');
  });

  it("affiche le message d'état vide", () => {
    const fixture = TestBed.createComponent(PagedListComponent);
    fixture.componentRef.setInput('empty', true);
    fixture.componentRef.setInput('emptyMessage', 'Aucun résultat.');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aucun résultat.');
  });

  it('émet pageChange sur la pagination', () => {
    const fixture = TestBed.createComponent(PagedListComponent);
    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('totalPages', 3);
    fixture.detectChanges();

    let emitted: number | undefined;
    fixture.componentInstance.pageChange.subscribe((p) => (emitted = p));
    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click(); // Précédent
    expect(emitted).toBe(0);
    buttons[1].click(); // Suivant
    expect(emitted).toBe(2);
  });

  it("n'affiche pas la pagination quand elle est désactivée", () => {
    const fixture = TestBed.createComponent(PagedListComponent);
    fixture.componentRef.setInput('paginated', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pagination')).toBeNull();
  });
});
