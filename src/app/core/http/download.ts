/** Declenche le telechargement d'un blob et libere l'URL objet sans casser le telechargement. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Revocation differee : le navigateur doit avoir demarre le telechargement.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
