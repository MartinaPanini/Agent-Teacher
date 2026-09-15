import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  candidatiPrincipale,
  candidatiScoperta,
  centralita,
  lacuna,
  punteggio,
  scegliPrincipale,
  scegliScoperta,
  calcolaSessione,
  type PriorityInput,
} from "../server/priority.js";
import type { Module, Profile, Skill } from "../shared/schema.js";

// ---------------------------------------------------------------------------
// Fixture helper — solo i campi che contano per il test, il resto a default.
// ---------------------------------------------------------------------------

function skill(id: string, area: string, prerequisiti: string[] = [], extra: Partial<Skill> = {}): Skill {
  return {
    id,
    nome: id,
    area,
    descrizione: "",
    livello: 0,
    livello_fonte: "calibrazione",
    livello_aggiornato_il: null,
    prerequisiti,
    moduli_completati: 0,
    moduli_totali: 1,
    interesse_osservato: 0,
    utilita_dichiarata: 0.5,
    peso_scoperta: 1,
    note: "",
    ...extra,
  };
}

function modulo(id: string, skillId: string, extra: Partial<Module> = {}): Module {
  return {
    id,
    course_id: `corso-${skillId}`,
    titolo: id,
    tipo: "teoria",
    durata_min: 15,
    voci_inbox: [],
    obiettivo: "",
    prerequisiti_skill: [],
    prerequisiti_testo: "",
    sintesi_md: "",
    fonte_primaria: null,
    fonti_extra: [],
    domande: [],
    peso_skill: { [skillId]: 1 },
    stato: "pronto",
    origine: "seed",
    nuovo: false,
    creato_il: "2026-01-01",
    servito_il: null,
    completato_il: null,
    ...extra,
  };
}

function profile(extra: Partial<Profile> = {}): Profile {
  return {
    nome: "Test",
    ritmo_atteso_settimana: 4.5,
    durata_sessione_min: 20,
    quota_scoperta: 0.2,
    buffer_minimo: 3,
    buffer_target: 7,
    soglia_ripasso_giorni: 10,
    obiettivi: [],
    calibrazione: { fatta_il: "2026-01-01", risposte: [] },
    ultima_sessione_il: null,
    sessioni_totali: 0,
    ...extra,
  };
}

function baseInput(skills: Skill[], modules: Module[], extra: Partial<PriorityInput> = {}): PriorityInput {
  return { skills, modules, courses: [], profile: profile(), sessions: [], inbox: [], ...extra };
}

// ---------------------------------------------------------------------------
// Il gate dei prerequisiti (§4.1)
// ---------------------------------------------------------------------------

describe("gate dei prerequisiti", () => {
  it("un modulo con prerequisiti a livello 1 non compare mai fra i candidati", () => {
    const skills = [
      skill("fondamenta-llm", "fondamenta", [], { livello: 1 }),
      skill("claude-code", "strumenti", ["fondamenta-llm"], { livello: 0 }),
    ];
    const modules = [modulo("mod-cc-01", "claude-code", { prerequisiti_skill: ["fondamenta-llm"] })];
    expect(candidatiPrincipale(baseInput(skills, modules))).toHaveLength(0);
  });

  it("sbloccando un prerequisito a livello >=2, il modulo a valle entra nel pool", () => {
    const skills = [
      skill("fondamenta-llm", "fondamenta", [], { livello: 1 }),
      skill("claude-code", "strumenti", ["fondamenta-llm"], { livello: 0 }),
    ];
    const modules = [modulo("mod-cc-01", "claude-code", { prerequisiti_skill: ["fondamenta-llm"] })];
    expect(candidatiPrincipale(baseInput(skills, modules))).toHaveLength(0);

    const skillsAggiornate = skills.map((s) => (s.id === "fondamenta-llm" ? { ...s, livello: 2 } : s));
    expect(candidatiPrincipale(baseInput(skillsAggiornate, modules)).map((m) => m.id)).toContain("mod-cc-01");
  });

  it("skill già a livello 4 è esclusa dai candidati anche se il modulo è pronto", () => {
    const skills = [skill("mcp-protocollo", "protocolli", [], { livello: 4 })];
    const modules = [modulo("mod-mcp-09", "mcp-protocollo")];
    expect(candidatiPrincipale(baseInput(skills, modules))).toHaveLength(0);
  });

  it("solo i moduli stato 'pronto' entrano nei candidati; i 'bozza' mai, anche a prerequisiti soddisfatti", () => {
    const skills = [skill("mcp-protocollo", "protocolli", [], { livello: 1 })];
    const modules = [modulo("mod-mcp-01", "mcp-protocollo", { stato: "bozza" })];
    expect(candidatiPrincipale(baseInput(skills, modules))).toHaveLength(0);
  });

  it("a mappa tutta a zero, il modulo scelto appartiene a una skill senza prerequisiti", () => {
    const skills = [
      skill("fondamenta-llm", "fondamenta", []),
      skill("claude-code", "strumenti", ["fondamenta-llm"]),
    ];
    const modules = [
      modulo("mod-llm-01", "fondamenta-llm", { prerequisiti_skill: [] }),
      modulo("mod-cc-01", "claude-code", { prerequisiti_skill: ["fondamenta-llm"] }),
    ];
    const scelto = scegliPrincipale(baseInput(skills, modules));
    expect(scelto?.id).toBe("mod-llm-01");
  });
});

// ---------------------------------------------------------------------------
// Il punteggio (§4.2)
// ---------------------------------------------------------------------------

describe("punteggio", () => {
  it("lacuna diminuisce monotonicamente all'aumentare del livello", () => {
    const a = skill("skill-a", "area-a", [], { livello: 0 });
    const b = skill("skill-a", "area-a", [], { livello: 4 });
    expect(lacuna(a)).toBe(1);
    expect(lacuna(b)).toBe(0);
    expect(lacuna(b)).toBeLessThan(lacuna(a));
  });

  it("alzando il livello di una skill, la sua lacuna scende e un'altra skill la supera nel punteggio", () => {
    const skills = [
      skill("skill-a", "area-a", [], { livello: 0, utilita_dichiarata: 0.5 }),
      skill("skill-b", "area-b", [], { livello: 0, utilita_dichiarata: 0.5 }),
    ];
    const modA = modulo("mod-a", "skill-a");
    const modB = modulo("mod-b", "skill-b");
    const input1 = baseInput(skills, [modA, modB]);
    expect(punteggio(modA, input1)).toBeCloseTo(punteggio(modB, input1), 9);

    const skillsAlzata = [{ ...skills[0]!, livello: 4 }, skills[1]!];
    const input2 = baseInput(skillsAlzata, [modA, modB]);
    expect(punteggio(modA, input2)).toBeLessThan(punteggio(modB, input2));
  });

  it("centralità è massima per una skill fondazionale rispetto a una foglia", () => {
    const skills = [
      skill("fondamenta-llm", "fondamenta", []),
      skill("claude-code", "strumenti", ["fondamenta-llm"]),
      skill("mcp-protocollo", "protocolli", ["fondamenta-llm", "claude-code"]),
      skill("framework-agentici", "framework", ["mcp-protocollo"]),
    ];
    expect(centralita("fondamenta-llm", skills)).toBeGreaterThan(centralita("framework-agentici", skills));
    expect(centralita("framework-agentici", skills)).toBe(0);
  });

  it("nessuna componente del punteggio cambia se si altera la data di verifica della fonte", () => {
    const skills = [skill("mcp-protocollo", "protocolli", [], { livello: 1 })];
    const modBase = modulo("mod-mcp-01", "mcp-protocollo");
    const modConFonteRecente = modulo("mod-mcp-01", "mcp-protocollo", {
      fonte_primaria: { url: "https://example.com", titolo: "x", tipo: "documentazione", verificata_il: "2026-09-15" },
    });
    const modConFonteVecchia = modulo("mod-mcp-01", "mcp-protocollo", {
      fonte_primaria: { url: "https://example.com", titolo: "x", tipo: "documentazione", verificata_il: "2020-01-01" },
    });
    const input = baseInput(skills, [modBase]);
    expect(punteggio(modConFonteRecente, input)).toBe(punteggio(modConFonteVecchia, input));
  });
});

// ---------------------------------------------------------------------------
// Modulo di scoperta (§4.4)
// ---------------------------------------------------------------------------

describe("modulo di scoperta", () => {
  function fixtureScoperta(sessioniTotali: number) {
    const skills = [
      skill("fondamenta-llm", "fondamenta", [], { livello: 4 }),
      skill("mcp-protocollo", "protocolli", ["fondamenta-llm"], { livello: 2, utilita_dichiarata: 0.9, interesse_osservato: 0.5 }),
      skill("second-brain", "applicazioni-personali", ["mcp-protocollo"], { livello: 0, utilita_dichiarata: 0.2 }),
      skill("framework-agentici", "framework", [], { livello: 0, utilita_dichiarata: 0.2 }),
    ];
    const modules = [
      modulo("mod-mcp-01", "mcp-protocollo", { prerequisiti_skill: ["fondamenta-llm"] }),
      modulo("mod-sb-01", "second-brain", { prerequisiti_skill: ["mcp-protocollo"] }),
      modulo("mod-fw-01", "framework-agentici", { prerequisiti_skill: [] }),
    ];
    return baseInput(skills, modules, { profile: profile({ sessioni_totali: sessioniTotali }) });
  }

  it("candidati: solo skill a livello 0 fuori dal percorso principale, con prerequisiti soddisfatti", () => {
    const input = fixtureScoperta(0);
    const candidati = candidatiScoperta(input, ["protocolli"]).map((m) => m.id).sort();
    expect(candidati).toEqual(["mod-fw-01", "mod-sb-01"]);
  });

  it.each([4, 9, 14])(
    "a sessione numero %i+1 (multiplo di 5), il modulo di scoperta può essere scollegato dalle aree attive",
    (sessioniTotali) => {
      const input = fixtureScoperta(sessioniTotali);
      const draft = calcolaSessione(input, { ora: new Date("2026-01-01"), random: () => 0.99 });
      const itemScoperta = draft.items.find((i) => i.ruolo === "scoperta");
      expect(itemScoperta?.module_id).toBe("mod-fw-01");
    },
  );

  it.each([0, 1, 2, 3])(
    "a sessione numero %i+1 (non multiplo di 5), il modulo di scoperta preferisce un'area adiacente",
    (sessioniTotali) => {
      const input = fixtureScoperta(sessioniTotali);
      const draft = calcolaSessione(input, { ora: new Date("2026-01-01"), random: () => 0.99 });
      const itemScoperta = draft.items.find((i) => i.ruolo === "scoperta");
      expect(itemScoperta?.module_id).toBe("mod-sb-01");
    },
  );

  it("la stessa area non esce come scoperta in due sessioni consecutive", () => {
    const skills = [
      skill("fondamenta-llm", "fondamenta", [], { livello: 4 }),
      skill("mcp-protocollo", "protocolli", ["fondamenta-llm"], { livello: 2 }),
      skill("second-brain", "applicazioni-personali", [], { livello: 0 }),
      skill("framework-agentici", "framework", [], { livello: 0 }),
    ];
    const modules = [modulo("mod-sb-01", "second-brain"), modulo("mod-fw-01", "framework-agentici")];
    const input = baseInput(skills, modules);
    const scelto = scegliScoperta(input, ["protocolli"], "applicazioni-personali", true, () => 0);
    expect(scelto?.id).toBe("mod-fw-01");
  });

  it("'non fa per me' abbassa peso_scoperta ma non esclude mai il candidato dal pool", () => {
    const skills = [
      skill("fondamenta-llm", "fondamenta", [], { livello: 4 }),
      skill("mcp-protocollo", "protocolli", ["fondamenta-llm"], { livello: 2 }),
      skill("second-brain", "applicazioni-personali", [], { livello: 0, peso_scoperta: 0.3 }),
      skill("framework-agentici", "framework", [], { livello: 0, peso_scoperta: 1 }),
    ];
    const modules = [modulo("mod-sb-01", "second-brain"), modulo("mod-fw-01", "framework-agentici")];
    const input = baseInput(skills, modules);

    const candidati = candidatiScoperta(input, ["protocolli"]).map((m) => m.id).sort();
    expect(candidati).toEqual(["mod-fw-01", "mod-sb-01"]); // presente, non escluso

    const scelto = scegliScoperta(input, ["protocolli"], null, true, () => 0);
    expect(scelto?.id).toBe("mod-fw-01"); // ma sfavorito nella scelta finale
  });
});

// ---------------------------------------------------------------------------
// Antipattern vietato: nessuna data di pubblicazione nella logica di priorità
// ---------------------------------------------------------------------------

describe("nessuna dipendenza dalla novità", () => {
  it("il file priority.ts non legge mai una data di pubblicazione o quanto è recente un contenuto", () => {
    const src = fs.readFileSync(path.resolve(process.cwd(), "server/priority.ts"), "utf-8").toLowerCase();
    for (const termine of ["data_pubblicazione", "pubblicazione", "recente", "recency", "publishedat"]) {
      expect(src).not.toContain(termine);
    }
  });
});
