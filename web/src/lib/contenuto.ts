/** RF56-59: un modulo con slide popolate si mostra come Lezione, altrimenti resta su sintesi_md. */
export function usaLezione(modulo: { slide?: unknown[] }): boolean {
  return (modulo.slide?.length ?? 0) > 0;
}
