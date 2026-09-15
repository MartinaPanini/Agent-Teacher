import { describe, it, expect } from "vitest";
import { livelloDaModuliCompletati, applicaValutazione, aggiornaLivelloSkill } from "../server/levels.js";
import type { Module, Review, Skill } from "../shared/schema.js";

function modulo(id: string, skillId: string, peso: number, stato: Module["stato"] = "completato"): Module {
  return {
    id,
    course_id: "corso-x",
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
    peso_skill: { [skillId]: peso },
    stato,
    origine: "seed",
    nuovo: false,
    creato_il: "2026-01-01",
    servito_il: null,
    completato_il: stato === "completato" ? "2026-01-02" : null,
  };
}

function skill(id: string, extra: Partial<Skill> = {}): Skill {
  return {
    id,
    nome: id,
    area: "area-x",
    descrizione: "",
    livello: 0,
    livello_fonte: "calibrazione",
    livello_aggiornato_il: null,
    prerequisiti: [],
    moduli_completati: 0,
    moduli_totali: 1,
    interesse_osservato: 0,
    utilita_dichiarata: 0.5,
    peso_scoperta: 1,
    note: "",
    ...extra,
  };
}

function review(id: string, skillId: string, livelloSuggerito: number, valutataIl = "2026-01-03"): Review {
  return {
    id,
    module_id: "mod-x",
    session_id: "ses-x",
    data: "2026-01-02",
    risposte: [],
    nota_libera: "",
    stato: "valutata",
    valutazione: {
      punteggio: 4,
      max: 6,
      per_domanda: [2, 2, 0],
      commento: "",
      livello_suggerito: { [skillId]: livelloSuggerito },
      valutata_il: valutataIl,
    },
  };
}

describe("livelloDaModuliCompletati", () => {
  it("0 moduli completati -> livello 0", () => {
    expect(livelloDaModuliCompletati("skill-x", [])).toBe(0);
  });

  it("somma pesi 1.0 (tutti i moduli completati) -> livello esatto 4", () => {
    const modules = [modulo("m1", "skill-x", 0.25), modulo("m2", "skill-x", 0.25), modulo("m3", "skill-x", 0.25), modulo("m4", "skill-x", 0.25)];
    expect(livelloDaModuliCompletati("skill-x", modules)).toBe(4);
  });

  it("somma pesi 0.5 -> livello 2 (round(4*0.5))", () => {
    const modules = [modulo("m1", "skill-x", 0.5)];
    expect(livelloDaModuliCompletati("skill-x", modules)).toBe(2);
  });

  it("ignora i moduli non completati", () => {
    const modules = [modulo("m1", "skill-x", 1, "pronto")];
    expect(livelloDaModuliCompletati("skill-x", modules)).toBe(0);
  });

  it("non supera mai il livello 4 anche se la somma dei pesi eccede 1.0", () => {
    const modules = [modulo("m1", "skill-x", 0.8), modulo("m2", "skill-x", 0.8)];
    expect(livelloDaModuliCompletati("skill-x", modules)).toBe(4);
  });
});

describe("applicaValutazione", () => {
  it("livello_suggerito più basso del calcolato prevale (corregge verso il basso)", () => {
    expect(applicaValutazione(3, 1)).toBe(1);
  });

  it("livello_suggerito più alto del calcolato non gonfia: resta il calcolato", () => {
    expect(applicaValutazione(2, 4)).toBe(2);
  });

  it("livello_suggerito null lascia invariato il livello calcolato", () => {
    expect(applicaValutazione(3, null)).toBe(3);
  });
});

describe("aggiornaLivelloSkill", () => {
  it("usa la valutazione più recente fra più review della stessa skill", () => {
    const s = skill("skill-x");
    const modules = [modulo("m1", "skill-x", 1)];
    const reviews = [review("r1", "skill-x", 3, "2026-01-03"), review("r2", "skill-x", 1, "2026-01-05")];
    const aggiornata = aggiornaLivelloSkill(s, modules, reviews);
    expect(aggiornata.livello).toBe(1); // r2 è più recente e corregge verso il basso
    expect(aggiornata.livello_fonte).toBe("moduli");
  });

  it("senza review valutate, usa solo il calcolo dai moduli completati", () => {
    const s = skill("skill-x");
    const modules = [modulo("m1", "skill-x", 0.5)];
    const aggiornata = aggiornaLivelloSkill(s, modules, []);
    expect(aggiornata.livello).toBe(2);
  });
});
