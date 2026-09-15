import type { Course, InboxEntry, Module, Profile, Session, Skill } from "../shared/schema.js";

export interface PriorityInput {
  skills: Skill[];
  modules: Module[];
  courses: Course[];
  profile: Profile;
  sessions: Session[];
  inbox: InboxEntry[];
}

export type SessionRuolo = "principale" | "scoperta" | "ripasso";

export interface SessionDraftItem {
  module_id: string;
  ruolo: SessionRuolo;
}

export interface SessionDraft {
  numero: number;
  items: SessionDraftItem[];
  qualifica_inbox: string[];
  /** true se non esiste nessun modulo principale disponibile (buffer scarico) */
  vuoto: boolean;
}

// ---------------------------------------------------------------------------
// Helper interni
// ---------------------------------------------------------------------------

function skillsMap(skills: Skill[]): Map<string, Skill> {
  return new Map(skills.map((s) => [s.id, s]));
}

/** La skill "target" di un modulo: la prima (e di norma unica) chiave di peso_skill. */
function moduleSkillId(module: Module): string | undefined {
  return Object.keys(module.peso_skill)[0];
}

function moduleSkill(module: Module, byId: Map<string, Skill>): Skill | undefined {
  const id = moduleSkillId(module);
  return id ? byId.get(id) : undefined;
}

function prerequisitiSoddisfatti(module: Module, byId: Map<string, Skill>): boolean {
  return module.prerequisiti_skill.every((pid) => {
    const p = byId.get(pid);
    return p !== undefined && p.livello >= 2;
  });
}

/** Ancestori (diretti + transitivi) di una skill nel grafo dei prerequisiti. */
function ancestorsOf(skillId: string, byId: Map<string, Skill>, seen: Set<string> = new Set()): Set<string> {
  if (seen.has(skillId)) return new Set();
  seen.add(skillId);
  const result = new Set<string>();
  const skill = byId.get(skillId);
  if (!skill) return result;
  for (const p of skill.prerequisiti) {
    result.add(p);
    for (const anc of ancestorsOf(p, byId, seen)) result.add(anc);
  }
  return result;
}

function dependentsCount(skillId: string, skills: Skill[], byId: Map<string, Skill>): number {
  let count = 0;
  for (const s of skills) {
    if (s.id === skillId) continue;
    if (ancestorsOf(s.id, byId).has(skillId)) count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Componenti del punteggio (§4.2 della specifica)
// ---------------------------------------------------------------------------

export function centralita(skillId: string, skills: Skill[]): number {
  const byId = skillsMap(skills);
  const counts = skills.map((s) => dependentsCount(s.id, skills, byId));
  const max = Math.max(0, ...counts);
  if (max === 0) return 0;
  return dependentsCount(skillId, skills, byId) / max;
}

export function lacuna(skill: Skill): number {
  return (4 - skill.livello) / 4;
}

export function utilita(skill: Skill): number {
  return skill.utilita_dichiarata;
}

export function interesse(skill: Skill): number {
  return skill.interesse_osservato;
}

export function costo(module: Module, durataSessioneMin: number): number {
  return Math.min(1, module.durata_min / durataSessioneMin);
}

/**
 * P = 0.30·centralità + 0.25·lacuna + 0.20·utilità + 0.15·interesse + 0.10·(1-costo).
 * Deliberatamente nessuna componente qui dentro guarda a quando un contenuto è stato
 * creato o aggiornato: è la regola esplicita che tiene la priorità indipendente
 * dalla novità (§4.3) — vietato introdurne una in futuro.
 */
export function punteggio(module: Module, input: PriorityInput): number {
  const byId = skillsMap(input.skills);
  const skill = moduleSkill(module, byId);
  if (!skill) return 0;
  return (
    0.3 * centralita(skill.id, input.skills) +
    0.25 * lacuna(skill) +
    0.2 * utilita(skill) +
    0.15 * interesse(skill) +
    0.1 * (1 - costo(module, input.profile.durata_sessione_min))
  );
}

// ---------------------------------------------------------------------------
// Gate + selezione del modulo principale (§4.1, §4.2)
// ---------------------------------------------------------------------------

/** Il gate: esclude, non penalizza. Solo moduli "pronto", skill non a livello 4, prerequisiti >= 2. */
export function candidatiPrincipale(input: PriorityInput): Module[] {
  const byId = skillsMap(input.skills);
  return input.modules.filter((m) => {
    if (m.stato !== "pronto") return false;
    const skill = moduleSkill(m, byId);
    if (!skill || skill.livello >= 4) return false;
    return prerequisitiSoddisfatti(m, byId);
  });
}

export function scegliPrincipale(input: PriorityInput): Module | null {
  const candidati = candidatiPrincipale(input);
  if (candidati.length === 0) return null;
  const ordinati = [...candidati].sort((a, b) => {
    const diff = punteggio(b, input) - punteggio(a, input);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
  return ordinati[0] ?? null;
}

// ---------------------------------------------------------------------------
// Modulo di scoperta (§4.4)
// ---------------------------------------------------------------------------

/** Aree "fuori dal percorso principale" la cui skill ha un prerequisito diretto in un'area del percorso. */
function calcolaAreeAdiacenti(input: PriorityInput, areePercorsoPrincipale: string[]): Set<string> {
  const byId = skillsMap(input.skills);
  const aree = new Set<string>();
  for (const skill of input.skills) {
    if (areePercorsoPrincipale.includes(skill.area)) continue;
    const adiacente = skill.prerequisiti.some((pid) => {
      const p = byId.get(pid);
      return p !== undefined && areePercorsoPrincipale.includes(p.area);
    });
    if (adiacente) aree.add(skill.area);
  }
  return aree;
}

/** Candidati: skill a livello 0, fuori dal percorso principale, con prerequisiti soddisfatti. */
export function candidatiScoperta(input: PriorityInput, areePercorsoPrincipale: string[]): Module[] {
  const byId = skillsMap(input.skills);
  return input.modules.filter((m) => {
    if (m.stato !== "pronto") return false;
    const skill = moduleSkill(m, byId);
    if (!skill || skill.livello !== 0) return false;
    if (areePercorsoPrincipale.includes(skill.area)) return false;
    return prerequisitiSoddisfatti(m, byId);
  });
}

export function scegliScoperta(
  input: PriorityInput,
  areePercorsoPrincipale: string[],
  ultimaAreaScoperta: string | null,
  forzaSerendipita: boolean,
  random: () => number = Math.random,
): Module | null {
  const byId = skillsMap(input.skills);
  let candidati = candidatiScoperta(input, areePercorsoPrincipale);
  if (candidati.length === 0) return null;

  // regola 4: mai la stessa area della sessione di scoperta precedente
  if (ultimaAreaScoperta !== null) {
    const senzaAreaPrecedente = candidati.filter((m) => moduleSkill(m, byId)?.area !== ultimaAreaScoperta);
    if (senzaAreaPrecedente.length > 0) candidati = senzaAreaPrecedente;
  }

  // regola 2+3: preferisci aree adiacenti, salvo quando la serendipità è forzata (1 sessione su 5)
  if (!forzaSerendipita) {
    const areeAdiacenti = calcolaAreeAdiacenti(input, areePercorsoPrincipale);
    const adiacenti = candidati.filter((m) => {
      const skill = moduleSkill(m, byId);
      return skill !== undefined && areeAdiacenti.has(skill.area);
    });
    if (adiacenti.length > 0) candidati = adiacenti;
  }

  // regola 5: "non fa per me" abbassa peso_scoperta ma non esclude — sceglie fra i pesi più alti rimasti
  const pesoMax = Math.max(...candidati.map((m) => moduleSkill(m, byId)?.peso_scoperta ?? 1));
  const migliori = candidati.filter((m) => (moduleSkill(m, byId)?.peso_scoperta ?? 1) === pesoMax);
  const indice = Math.floor(random() * migliori.length);
  return migliori[Math.min(indice, migliori.length - 1)] ?? null;
}

// ---------------------------------------------------------------------------
// Ripasso (§1.2, §3.2)
// ---------------------------------------------------------------------------

export function serveRipasso(profile: Profile, ora: Date): boolean {
  if (!profile.ultima_sessione_il) return false;
  const ultima = new Date(profile.ultima_sessione_il).getTime();
  const giorni = (ora.getTime() - ultima) / (1000 * 60 * 60 * 24);
  return giorni > profile.soglia_ripasso_giorni;
}

export function moduliRipasso(modules: Module[]): Module[] {
  return modules
    .filter((m) => m.stato === "completato" && m.completato_il !== null)
    .sort((a, b) => (b.completato_il! < a.completato_il! ? -1 : b.completato_il! > a.completato_il! ? 1 : 0))
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Composizione della sessione (§1.3, §3.2)
// ---------------------------------------------------------------------------

function ultimaAreaScopertaDaSessioni(input: PriorityInput): string | null {
  const byId = skillsMap(input.skills);
  for (let i = input.sessions.length - 1; i >= 0; i--) {
    const sessione = input.sessions[i]!;
    const itemScoperta = sessione.items.find((it) => it.ruolo === "scoperta");
    if (!itemScoperta) continue;
    const modulo = input.modules.find((m) => m.id === itemScoperta.module_id);
    if (!modulo) continue;
    const skill = moduleSkill(modulo, byId);
    if (skill) return skill.area;
  }
  return null;
}

export function calcolaSessione(input: PriorityInput, opts: { ora: Date; random: () => number }): SessionDraft {
  const numero = input.profile.sessioni_totali + 1;
  const items: SessionDraftItem[] = [];

  if (serveRipasso(input.profile, opts.ora)) {
    for (const m of moduliRipasso(input.modules)) {
      items.push({ module_id: m.id, ruolo: "ripasso" });
    }
  }

  const daQualificare = input.inbox.filter((e) => e.stato === "da_qualificare");
  const qualifica_inbox = daQualificare.length >= 3 ? daQualificare.slice(0, 3).map((e) => e.id) : [];

  const principale = scegliPrincipale(input);
  if (!principale) {
    return { numero, items, qualifica_inbox, vuoto: true };
  }
  items.push({ module_id: principale.id, ruolo: "principale" });

  const byId = skillsMap(input.skills);
  const areaPrincipale = moduleSkill(principale, byId)?.area;
  const areePercorsoPrincipale = areaPrincipale ? [areaPrincipale] : [];
  const ultimaAreaScoperta = ultimaAreaScopertaDaSessioni(input);
  const forzaSerendipita = numero % 5 === 0;

  const scoperta = scegliScoperta(input, areePercorsoPrincipale, ultimaAreaScoperta, forzaSerendipita, opts.random);
  if (scoperta) {
    items.push({ module_id: scoperta.id, ruolo: "scoperta" });
  }

  return { numero, items, qualifica_inbox, vuoto: false };
}
