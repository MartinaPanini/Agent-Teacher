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

/**
 * Il calcolo dai moduli completati è un pavimento che sale, mai una sostituzione: il
 * livello da calibrazione (o da una fonte precedente) non deve mai scendere per il solo
 * effetto di ricalcolare i moduli completati. La valutazione di una review resta l'unica
 * cosa che può ancora correggere il livello verso il basso, e si applica dopo il pavimento.
 */
export function aggiornaLivelloSkill(skill: Skill, modules: Module[], reviews: Review[]): Skill {
  const livelloDaModuli = livelloDaModuliCompletati(skill.id, modules);
  const livelloPavimento = Math.max(skill.livello, livelloDaModuli);
  const fonte = livelloDaModuli > skill.livello ? "moduli" : skill.livello_fonte;

  const livelloSuggerito = livelloSuggeritoPiuRecente(skill.id, reviews);
  const livello = applicaValutazione(livelloPavimento, livelloSuggerito);

  if (livello === skill.livello && fonte === skill.livello_fonte) {
    return skill;
  }

  return {
    ...skill,
    livello,
    livello_fonte: fonte,
    livello_aggiornato_il: new Date().toISOString().slice(0, 10),
  };
}
