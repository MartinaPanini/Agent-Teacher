import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { InboxFileSchema, SkillsFileSchema, type InboxEntry, type Skill } from "../shared/schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const SEED_PATH = path.resolve(__dirname, "../docs/agent-teacher-inbox-seed.json");

export interface VoceGrezza {
  id: string;
  url: string;
  formato: string;
  data: string;
  autore: string;
  sintesi: string;
  tema: string;
  tool_nominati: string[];
  verdetto: string;
  fonte: string;
  affidabilita: string;
  stato: string;
}

export function leggiVociGrezze(percorso: string = SEED_PATH): VoceGrezza[] {
  const grezzo = JSON.parse(fs.readFileSync(percorso, "utf-8")) as { voci: VoceGrezza[] };
  return grezzo.voci;
}

// ---------------------------------------------------------------------------
// Mapping keyword -> skill, costruito leggendo tool_nominati/tema di tutte le
// 54 voci reali del seed. Non esaustivo per design: solo dove il legame con
// una delle 14 skill è chiaro. NB deliberata: NotebookLM, Open Notebook e
// Codex NON compaiono qui — mapparli su "rag"/"framework-agentici"
// contraddirebbe la narrativa di §0 della specifica ("zero occorrenze" per
// entrambe le aree nei 54 link salvati).
// ---------------------------------------------------------------------------

export const KEYWORD_SKILL_MAP: Record<string, string[]> = {
  "claude code": ["claude-code"],
  "claude skills": ["claude-skills"],
  ponytail: ["context-economy"],
  "tree-sitter": ["context-economy"],
  "agents.md": ["context-economy"],
  "claude.md": ["context-economy"],
  "llm-wiki": ["second-brain"],
  obsidian: ["second-brain"],
  graphify: ["second-brain"],
  odysseus: ["agenti-locali"],
  ollama: ["agenti-locali"],
  openjarvis: ["agenti-locali"],
  "nvidia nim": ["agenti-locali"],
  cowork: ["orchestrazione"],
  wayfinder: ["orchestrazione"],
  n8n: ["orchestrazione"],
  composio: ["integrazioni-personali"],
  "apple health": ["integrazioni-personali"],
  garmin: ["integrazioni-personali"],
  strava: ["integrazioni-personali"],
  whoop: ["integrazioni-personali"],
  "claude fable": ["claude-skills"],
  "book-to-skill": ["claude-skills"],
  c2pa: ["provenienza-sicurezza"],
  karpathy: ["fondamenta-llm"],
};

export const TEMA_SKILL_MAP: Record<string, string[]> = {
  "claude-code-basi": ["claude-code"],
  "claude-code-setup": ["claude-code"],
  "claude-code-costi": ["claude-code"],
  "context-economy": ["context-economy"],
  "context-engineering": ["context-economy"],
  "second-brain": ["second-brain"],
  obsidian: ["second-brain"],
  "claude-skills": ["claude-skills"],
  orchestrazione: ["orchestrazione"],
  "orchestrazione-multiagent": ["orchestrazione"],
  "agenti-locali": ["agenti-locali"],
  "fondamenta-llm": ["fondamenta-llm"],
  "integrazioni-personali": ["integrazioni-personali"],
  "provenienza-sicurezza": ["provenienza-sicurezza"],
};

/** Prova prima le keyword su tool_nominati; solo se non matcha nulla, ripiega sul tema. */
export function riconosciSkillToccate(voce: VoceGrezza): string[] {
  const daKeyword = new Set<string>();
  for (const tool of voce.tool_nominati) {
    const skills = KEYWORD_SKILL_MAP[tool.toLowerCase()];
    if (skills) skills.forEach((s) => daKeyword.add(s));
  }
  if (daKeyword.size > 0) return [...daKeyword];

  const daTema = TEMA_SKILL_MAP[voce.tema];
  return daTema ? [...daTema] : [];
}

const FONTI_VALIDE = new Set(["instagram", "tiktok", "youtube", "github", "arxiv", "articolo"]);
const VERDETTI_VALIDI = new Set(["studia", "prova", "monitora", "verifica", "ignora"]);

export function mappaVoce(voce: VoceGrezza): InboxEntry {
  const fonte = (FONTI_VALIDE.has(voce.fonte) ? voce.fonte : "articolo") as InboxEntry["fonte"];
  const verdetto = (VERDETTI_VALIDI.has(voce.verdetto) ? voce.verdetto : null) as InboxEntry["verdetto"];

  return {
    id: voce.id,
    url: voce.url,
    aggiunto_il: voce.data,
    fonte,
    // Il grezzo usa stato "qualificato": nello schema del sito diventa "risolto",
    // dato che queste voci sono già passate per la classificazione dell'analisi originale.
    stato: "risolto",
    didascalia_incollata: null,
    estratto: {
      autore: voce.autore,
      titolo: null,
      didascalia: voce.sintesi,
      data_pubblicazione: voce.data,
    },
    tool_nominati: voce.tool_nominati,
    // La risoluzione della fonte primaria è un giudizio della routine Cowork (§1.9),
    // non di questo script: resta null anche quando sarebbe deducibile.
    fonte_primaria: null,
    verdetto,
    motivo: voce.sintesi,
    skill_toccate: riconosciSkillToccate(voce),
    modulo_generato: null,
    nota_utente: "",
  };
}

/** interesse_osservato = conteggio voci che toccano la skill, normalizzato 0-1 sul massimo. */
export function ricalcolaInteresseOsservato(skills: Skill[], inbox: InboxEntry[]): Skill[] {
  const conteggi = new Map<string, number>();
  for (const voce of inbox) {
    for (const skillId of voce.skill_toccate) {
      conteggi.set(skillId, (conteggi.get(skillId) ?? 0) + 1);
    }
  }
  const max = Math.max(0, ...conteggi.values());
  return skills.map((s) => ({
    ...s,
    interesse_osservato: max === 0 ? 0 : Math.round(((conteggi.get(s.id) ?? 0) / max) * 100) / 100,
  }));
}

function main(): void {
  const vociGrezze = leggiVociGrezze();
  const inbox = vociGrezze.map(mappaVoce);
  const inboxValidato = InboxFileSchema.parse(inbox);
  fs.writeFileSync(path.join(DATA_DIR, "inbox.json"), JSON.stringify(inboxValidato, null, 2) + "\n", "utf-8");

  const skillsPath = path.join(DATA_DIR, "skills.json");
  const skills = SkillsFileSchema.parse(JSON.parse(fs.readFileSync(skillsPath, "utf-8")));
  const skillsAggiornate = SkillsFileSchema.parse(ricalcolaInteresseOsservato(skills, inboxValidato));
  fs.writeFileSync(skillsPath, JSON.stringify(skillsAggiornate, null, 2) + "\n", "utf-8");

  console.log(
    `import-inbox: ${inboxValidato.length} voci importate, interesse_osservato ricalcolato su ${skills.length} skill.`,
  );
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
