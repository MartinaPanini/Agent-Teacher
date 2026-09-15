import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SkillsFileSchema,
  CoursesFileSchema,
  ModulesFileSchema,
  ProfileSchema,
  RequestSchema,
  SessionsFileSchema,
  ReviewsFileSchema,
  InboxFileSchema,
  type Skill,
  type Course,
  type Module,
  type Profile,
  type RequestItem,
} from "../shared/schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const REQUESTS_DIR = path.join(DATA_DIR, "requests");

const oggi = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// distribuisciPesi: n quote uguali (arrotondate a 2 decimali) la cui somma è
// esattamente 1.0 — l'ultima quota assorbe il resto dell'arrotondamento.
// ---------------------------------------------------------------------------

export function distribuisciPesi(n: number): number[] {
  if (n <= 0) return [];
  const base = Math.round((1 / n) * 100) / 100;
  const pesi = new Array<number>(n).fill(base);
  const sommaPrimiNMeno1 = Math.round(base * (n - 1) * 100) / 100;
  pesi[n - 1] = Math.round((1 - sommaPrimiNMeno1) * 100) / 100;
  return pesi;
}

// ---------------------------------------------------------------------------
// Le 14 skill (§7 della specifica + corso-integrazioni-personali aggiunto
// esplicitamente da Martina). moduli_totali deve combaciare con la somma dei
// moduli generati per quella skill in COURSES_DEF più sotto.
// ---------------------------------------------------------------------------

interface SkillDef {
  id: string;
  nome: string;
  area: string;
  descrizione: string;
  prerequisiti: string[];
  moduli_totali: number;
  utilita_dichiarata: number;
}

export const SKILLS_DEF: SkillDef[] = [
  {
    id: "fondamenta-llm",
    nome: "Come funzionano davvero gli LLM",
    area: "fondamenta",
    descrizione: "Cosa succede dentro un LLM: tokenizzazione, context window, next-token prediction, limiti reali.",
    prerequisiti: [],
    moduli_totali: 6,
    utilita_dichiarata: 0.5,
  },
  {
    id: "claude-code",
    nome: "Claude Code",
    area: "strumenti",
    descrizione: "Uso quotidiano di Claude Code come strumento di sviluppo: comandi, file, workflow.",
    prerequisiti: ["fondamenta-llm"],
    moduli_totali: 7,
    utilita_dichiarata: 0.5,
  },
  {
    id: "tool-calling",
    nome: "Tool calling",
    area: "fondamenta",
    descrizione: "Come un modello chiama funzioni esterne e ne usa il risultato: la base di ogni agente.",
    prerequisiti: ["fondamenta-llm", "claude-code"],
    moduli_totali: 4,
    utilita_dichiarata: 0.7,
  },
  {
    id: "mcp-protocollo",
    nome: "MCP — il protocollo",
    area: "protocolli",
    descrizione: "Cos'è il Model Context Protocol, come è fatto un server, come si collega a un client.",
    prerequisiti: ["fondamenta-llm", "claude-code", "tool-calling"],
    moduli_totali: 5,
    utilita_dichiarata: 0.9,
  },
  {
    id: "context-economy",
    nome: "Context engineering e memoria",
    area: "ingegneria-contesto",
    descrizione: "Come gestire il contesto di un agente: cosa tenere, cosa scartare, come risparmiare token.",
    prerequisiti: ["claude-code"],
    moduli_totali: 5,
    utilita_dichiarata: 0.5,
  },
  {
    id: "claude-skills",
    nome: "Claude Skills",
    area: "strumenti",
    descrizione: "Come creare e installare skill per Claude: pacchetti di istruzioni riutilizzabili.",
    prerequisiti: ["claude-code"],
    moduli_totali: 5,
    utilita_dichiarata: 0.5,
  },
  {
    id: "second-brain",
    nome: "Second brain con Obsidian e agenti",
    area: "applicazioni-personali",
    descrizione: "Collegare un agente a una base di note personale: ricerca, sintesi, organizzazione automatica.",
    prerequisiti: ["mcp-protocollo", "context-economy"],
    moduli_totali: 5,
    utilita_dichiarata: 0.9,
  },
  {
    id: "orchestrazione",
    nome: "Orchestrazione multi-agent",
    area: "orchestrazione",
    descrizione: "Come far collaborare più agenti fra loro: ruoli, handoff, coordinamento.",
    prerequisiti: ["mcp-protocollo", "claude-skills"],
    moduli_totali: 6,
    utilita_dichiarata: 0.5,
  },
  {
    id: "agenti-locali",
    nome: "Agenti locali e self-hosted",
    area: "runtime",
    descrizione: "Far girare agenti in locale senza servizi cloud: runtime, modelli, limiti pratici.",
    prerequisiti: ["mcp-protocollo"],
    moduli_totali: 4,
    utilita_dichiarata: 0.2,
  },
  {
    id: "evals-sicurezza",
    nome: "Evals, valutazione e sicurezza",
    area: "qualita-sicurezza",
    descrizione: "Come si misura se un agente funziona bene, e cosa può andare storto.",
    prerequisiti: ["mcp-protocollo", "orchestrazione"],
    moduli_totali: 5,
    utilita_dichiarata: 0.2,
  },
  {
    id: "framework-agentici",
    nome: "Framework agentici a confronto",
    area: "framework",
    descrizione: "LangGraph, LlamaIndex, CrewAI, smolagents: cosa offrono e quando servono davvero.",
    prerequisiti: ["orchestrazione", "evals-sicurezza"],
    moduli_totali: 5,
    utilita_dichiarata: 0.2,
  },
  {
    id: "integrazioni-personali",
    nome: "Integrazioni con i dati personali",
    area: "applicazioni-personali",
    descrizione: "Collegare un agente ai propri dati: Apple Health, Garmin, e altre fonti personali.",
    prerequisiti: ["mcp-protocollo"],
    moduli_totali: 4,
    utilita_dichiarata: 0.9,
  },
  {
    id: "rag",
    nome: "RAG — recupero aumentato",
    area: "tecniche",
    descrizione: "Come un agente recupera informazioni da una base di documenti prima di rispondere.",
    prerequisiti: ["fondamenta-llm"],
    moduli_totali: 0,
    utilita_dichiarata: 0.2,
  },
  {
    id: "provenienza-sicurezza",
    nome: "Provenienza e sicurezza dei contenuti",
    area: "qualita-sicurezza",
    descrizione: "Come si verifica l'origine e l'affidabilità di un contenuto generato o processato da un agente.",
    prerequisiti: ["fondamenta-llm"],
    moduli_totali: 0,
    utilita_dichiarata: 0.2,
  },
];

// ---------------------------------------------------------------------------
// Gli 11 corsi. moduliPerSkill è ordinato: determina sia l'ordine dei moduli
// nel corso sia quanti moduli (e quindi quale quota di distribuisciPesi)
// tocca a ciascuna skill. Tutti "principale": il track di scoperta si
// calcola a runtime dal motore di priorità, non si congela nel seed.
// ---------------------------------------------------------------------------

interface CourseDef {
  id: string;
  slug: string;
  titolo: string;
  obiettivo: string;
  moduliPerSkill: Array<[string, number]>;
}

export const COURSES_DEF: CourseDef[] = [
  {
    id: "corso-llm-fondamenta",
    slug: "llm",
    titolo: "Come funzionano davvero gli LLM",
    obiettivo: "Capire cosa succede dentro un LLM abbastanza da ragionarci sopra, non da costruirne uno.",
    moduliPerSkill: [["fondamenta-llm", 6]],
  },
  {
    id: "corso-claude-code",
    slug: "claude-code",
    titolo: "Claude Code dalle fondamenta",
    obiettivo: "Usare Claude Code con sicurezza nel lavoro quotidiano.",
    moduliPerSkill: [["claude-code", 7]],
  },
  {
    id: "corso-mcp",
    slug: "mcp",
    titolo: "MCP — dal protocollo al tuo server",
    obiettivo: "Scrivere e collegare un MCP server funzionante.",
    moduliPerSkill: [
      ["tool-calling", 4],
      ["mcp-protocollo", 5],
    ],
  },
  {
    id: "corso-context-economy",
    slug: "context-economy",
    titolo: "Context engineering e memoria",
    obiettivo: "Gestire il contesto di un agente senza sprecare token.",
    moduliPerSkill: [["context-economy", 5]],
  },
  {
    id: "corso-claude-skills",
    slug: "claude-skills",
    titolo: "Claude Skills",
    obiettivo: "Creare e installare skill per Claude.",
    moduliPerSkill: [["claude-skills", 5]],
  },
  {
    id: "corso-second-brain",
    slug: "second-brain",
    titolo: "Second brain con Obsidian e agenti",
    obiettivo: "Costruire un second brain personale collegato a un agente.",
    moduliPerSkill: [["second-brain", 5]],
  },
  {
    id: "corso-orchestrazione",
    slug: "orchestrazione",
    titolo: "Orchestrazione multi-agent",
    obiettivo: "Far collaborare più agenti sullo stesso compito.",
    moduliPerSkill: [["orchestrazione", 6]],
  },
  {
    id: "corso-agenti-locali",
    slug: "agenti-locali",
    titolo: "Agenti locali e self-hosted",
    obiettivo: "Far girare un agente in locale senza servizi cloud.",
    moduliPerSkill: [["agenti-locali", 4]],
  },
  {
    id: "corso-evals-sicurezza",
    slug: "evals-sicurezza",
    titolo: "Evals, valutazione e sicurezza",
    obiettivo: "Misurare se un agente funziona bene e cosa può andare storto.",
    moduliPerSkill: [["evals-sicurezza", 5]],
  },
  {
    id: "corso-framework-agentici",
    slug: "framework-agentici",
    titolo: "Framework agentici a confronto",
    obiettivo: "Orientarsi fra i framework più usati per costruire agenti.",
    moduliPerSkill: [["framework-agentici", 5]],
  },
  {
    id: "corso-integrazioni-personali",
    slug: "integrazioni-personali",
    titolo: "Integrazioni con i dati personali",
    obiettivo: "Collegare Claude ai propri dati: Apple Health, Garmin, e altre fonti personali.",
    moduliPerSkill: [["integrazioni-personali", 4]],
  },
];

// ---------------------------------------------------------------------------
// Costruzione dati
// ---------------------------------------------------------------------------

export function buildSkills(): Skill[] {
  return SKILLS_DEF.map((s) => ({
    id: s.id,
    nome: s.nome,
    area: s.area,
    descrizione: s.descrizione,
    livello: 0,
    livello_fonte: "calibrazione" as const,
    livello_aggiornato_il: null,
    prerequisiti: s.prerequisiti,
    moduli_completati: 0,
    moduli_totali: s.moduli_totali,
    interesse_osservato: 0.0,
    utilita_dichiarata: s.utilita_dichiarata,
    peso_scoperta: 1,
    note: "",
  }));
}

export function buildCoursesAndModules(skillsById: Map<string, SkillDef>): { courses: Course[]; modules: Module[] } {
  const courses: Course[] = [];
  const modules: Module[] = [];

  for (const courseDef of COURSES_DEF) {
    const moduliIds: string[] = [];
    let numeroModulo = 1;

    for (const [skillId, count] of courseDef.moduliPerSkill) {
      const skill = skillsById.get(skillId);
      if (!skill) throw new Error(`seed: skill "${skillId}" referenziata da ${courseDef.id} non esiste`);
      const pesi = distribuisciPesi(count);

      for (let i = 0; i < count; i++) {
        const numero = String(numeroModulo).padStart(2, "0");
        const moduleId = `mod-${courseDef.slug}-${numero}`;
        modules.push({
          id: moduleId,
          course_id: courseDef.id,
          titolo: `Modulo ${numeroModulo} — ${skill.nome} (in preparazione)`,
          tipo: "teoria",
          durata_min: 15,
          voci_inbox: [],
          obiettivo: "Da definire dalla routine Cowork insieme al contenuto.",
          prerequisiti_skill: skill.prerequisiti,
          prerequisiti_testo: "Da generare dalla routine Cowork insieme al contenuto.",
          sintesi_md: "",
          fonte_primaria: null,
          fonti_extra: [],
          domande: [],
          peso_skill: { [skillId]: pesi[i]! },
          stato: "bozza",
          origine: "seed",
          nuovo: false,
          creato_il: oggi,
          servito_il: null,
          completato_il: null,
        });
        moduliIds.push(moduleId);
        numeroModulo++;
      }
    }

    courses.push({
      id: courseDef.id,
      titolo: courseDef.titolo,
      obiettivo: courseDef.obiettivo,
      skill_id: courseDef.moduliPerSkill.map(([skillId]) => skillId),
      track: "principale",
      stato: "attivo",
      moduli: moduliIds,
      origine: "seed",
      creato_il: oggi,
      aggiornato_il: oggi,
    });
  }

  return { courses, modules };
}

export function buildProfile(): Profile {
  return {
    nome: "Martina",
    ritmo_atteso_settimana: 4.5,
    durata_sessione_min: 20,
    quota_scoperta: 0.2,
    buffer_minimo: 3,
    buffer_target: 7,
    soglia_ripasso_giorni: 10,
    obiettivi: [
      "Scrivere un MCP server mio",
      "Collegare Claude ai miei dati personali (Apple Health, Garmin)",
      "Costruire un second brain con Obsidian e un agente",
    ],
    calibrazione: { fatta_il: null, risposte: [] },
    ultima_sessione_il: null,
    sessioni_totali: 0,
  };
}

function formatRequestId(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const data = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const ora = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `req-${data}-${ora}`;
}

function buildGeneraModuliRequest(): RequestItem {
  const now = new Date();
  return {
    id: formatRequestId(now),
    tipo: "genera_moduli",
    payload: {
      priorita: "alta",
      motivo: "seed iniziale: nessun modulo pronto, riempire il buffer con 7 moduli",
      quantita_suggerita: 7,
    },
    creato_il: now.toISOString(),
    stato: "in_attesa",
  };
}

// ---------------------------------------------------------------------------
// Scrittura su disco
// ---------------------------------------------------------------------------

function writeJsonValidated<T>(filePath: string, data: T, schema: { parse: (d: unknown) => T }): void {
  const parsed = schema.parse(data);
  fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2) + "\n", "utf-8");
}

function main(): void {
  const force = process.argv.includes("--force");
  const skillsPath = path.join(DATA_DIR, "skills.json");

  if (fs.existsSync(skillsPath) && !force) {
    console.error(
      `seed: ${skillsPath} esiste già. Rilancia con --force per sovrascrivere ` +
        `(attenzione: perderesti progressi reali già salvati in data/).`,
    );
    process.exit(1);
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(REQUESTS_DIR, { recursive: true });
  fs.mkdirSync(path.join(REQUESTS_DIR, "done"), { recursive: true });

  const skillsById = new Map(SKILLS_DEF.map((s) => [s.id, s]));
  const skills = buildSkills();
  const { courses, modules } = buildCoursesAndModules(skillsById);
  const profile = buildProfile();
  const generaModuliRequest = buildGeneraModuliRequest();

  writeJsonValidated(skillsPath, skills, SkillsFileSchema);
  writeJsonValidated(path.join(DATA_DIR, "courses.json"), courses, CoursesFileSchema);
  writeJsonValidated(path.join(DATA_DIR, "modules.json"), modules, ModulesFileSchema);
  writeJsonValidated(path.join(DATA_DIR, "profile.json"), profile, ProfileSchema);
  writeJsonValidated(path.join(DATA_DIR, "sessions.json"), [], SessionsFileSchema);
  writeJsonValidated(path.join(DATA_DIR, "reviews.json"), [], ReviewsFileSchema);
  // Scheletro vuoto: il contenuto reale arriva da scripts/import-inbox.ts, non da qui.
  if (!fs.existsSync(path.join(DATA_DIR, "inbox.json"))) {
    writeJsonValidated(path.join(DATA_DIR, "inbox.json"), [], InboxFileSchema);
  }
  writeJsonValidated(path.join(REQUESTS_DIR, `${generaModuliRequest.id}.json`), generaModuliRequest, RequestSchema);

  console.log(
    `seed: scritte ${skills.length} skill, ${courses.length} corsi, ${modules.length} moduli (tutti "bozza"), ` +
      `1 richiesta genera_moduli.`,
  );
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
