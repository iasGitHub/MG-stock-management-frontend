/**
 * Extrait le message d'une erreur HTTP selon l'enveloppe du backend :
 * { message } ou { errors: { champ: message } }.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const body = (error as { error?: { message?: unknown; errors?: unknown } } | null | undefined)
    ?.error;
  const payload = body?.message ?? body?.errors;

  if (typeof payload === 'string' && payload.trim() !== '') {
    return payload;
  }
  if (payload && typeof payload === 'object') {
    const joined = Object.values(payload as Record<string, unknown>)
      .filter((value): value is string => typeof value === 'string')
      .join(' - ');
    if (joined) {
      return joined;
    }
  }
  return fallback;
}
