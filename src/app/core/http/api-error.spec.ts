import { describe, expect, it } from 'vitest';
import { apiErrorMessage } from './api-error';

describe('apiErrorMessage', () => {
  it('retourne le message simple du backend', () => {
    expect(apiErrorMessage({ error: { message: 'Product not found' } }, 'fallback')).toBe(
      'Product not found',
    );
  });

  it('concatene les erreurs de champs de la map errors', () => {
    const error = { error: { errors: { username: 'Username required', password: 'Too short' } } };
    expect(apiErrorMessage(error, 'fallback')).toBe('Username required - Too short');
  });

  it("retourne le repli quand l'erreur n'a pas de forme reconnue", () => {
    expect(apiErrorMessage({ error: null }, 'fallback')).toBe('fallback');
    expect(apiErrorMessage(new Error('network'), 'fallback')).toBe('fallback');
    expect(apiErrorMessage(undefined, 'fallback')).toBe('fallback');
  });

  it("retourne le repli quand le message est vide", () => {
    expect(apiErrorMessage({ error: { message: '   ' } }, 'fallback')).toBe('fallback');
  });
});
