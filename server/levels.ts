import type { Module, Review, Skill } from "../shared/schema.js";

/**
 * livello = min(4, round(4 * Σ peso_skill dei moduli completato della skill)) — §4.5.
 */
export function livelloDaModuliCompletati(skillId: string, modules: Module[]): number {
  const somma = modules
    .filter((m) => m.stato === "completato" && skillId in m.peso_skill)
    .reduce((acc, m) => acc + (m.peso_skill[skillId] ?? 0), 0);
  return Math.min(4, Math.round(4 * somma));
}

/**
 * La valutazione della routine può correggere il livello verso il basso, mai gonfiarlo:
 * se livello_suggerito è più alto del calcolato, prevale comunque il calcolato (§4.5).
 */
export function applicaValutazione(livelloCalcolato: number, livelloSuggerito: number | null): number {
  if (livelloSuggerito === null) return livelloCalcolato;
  return Math.min(livelloCalcolato, livelloSuggerito);
}

function livelloSuggeritoPiuRecente(skillId: string, reviews: Review[]): number | null {
  const rilevanti = reviews.filter(
    (r) => r.stato === "valutata" && r.valutazione !== null && skillId in r.valutazione.livello_suggerito,
  );
  if (rilevanti.length === 0) return null;
  const ultima = rilevanti.reduce((a, b) =>
    a.valutazione!.valutata_il >= b.valutazione!.valutata_il ? a : b,
  );
  return ultima.valutazione!.livello_suggerito[skillId] ?? null;
}

export function aggiornaLivelloSkill(skill: Skill, modules: Module[], reviews: Review[]): Skill {
  const livelloCalcolato = livelloDaModuliCompletati(skill.id, modules);
  const livelloSuggerito = livelloSuggeritoPiuRecente(skill.id, reviews);
  const livello = applicaValutazione(livelloCalcolato, livelloSuggerito);
  return {
    ...skill,
    livello,
    livello_fonte: "moduli",
    livello_aggiornato_il: new Date().toISOString().slice(0, 10),
  };
}
