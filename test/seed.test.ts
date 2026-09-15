import { describe, it, expect } from "vitest";
import {
  distribuisciPesi,
  SKILLS_DEF,
  COURSES_DEF,
  buildSkills,
  buildCoursesAndModules,
  buildProfile,
} from "../scripts/seed.js";
import { SkillsFileSchema, CoursesFileSchema, ModulesFileSchema, ProfileSchema } from "../shared/schema.js";

const skillsById = new Map(SKILLS_DEF.map((s) => [s.id, s]));

describe("distribuisciPesi", () => {
  it("la somma è sempre esattamente 1.0", () => {
    for (const n of [4, 5, 6, 7]) {
      const pesi = distribuisciPesi(n);
      const somma = pesi.reduce((a, b) => a + b, 0);
      expect(Math.abs(somma - 1)).toBeLessThan(1e-9);
    }
  });

  it("produce n quote", () => {
    expect(distribuisciPesi(5)).toHaveLength(5);
  });
});

describe("seed: skills", () => {
  const skills = buildSkills();

  it("valida contro lo schema Zod", () => {
    expect(() => SkillsFileSchema.parse(skills)).not.toThrow();
  });

  it("contiene tutte e 14 le skill di §7, nessuna duplicata", () => {
    expect(skills).toHaveLength(14);
    const ids = new Set(skills.map((s) => s.id));
    expect(ids.size).toBe(14);
  });

  it("nessuna skill con moduli_totali > 0 ne ha meno di 4 (anti-inflazione di livello)", () => {
    for (const s of skills) {
      if (s.moduli_totali > 0) {
        expect(s.moduli_totali).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("calibrazione.fatta_il è assente a livello di skill: livello parte da 0 con fonte calibrazione", () => {
    for (const s of skills) {
      expect(s.livello).toBe(0);
      expect(s.livello_fonte).toBe("calibrazione");
    }
  });
});

describe("seed: courses + modules", () => {
  const { courses, modules } = buildCoursesAndModules(skillsById);

  it("valida contro lo schema Zod", () => {
    expect(() => CoursesFileSchema.parse(courses)).not.toThrow();
    expect(() => ModulesFileSchema.parse(modules)).not.toThrow();
  });

  it("contiene gli 11 corsi, tutti track: principale", () => {
    expect(courses).toHaveLength(11);
    for (const c of courses) {
      expect(c.track).toBe("principale");
      expect(c.stato).toBe("attivo");
    }
  });

  it("tutti i moduli generati sono in stato bozza", () => {
    for (const m of modules) {
      expect(m.stato).toBe("bozza");
      expect(m.fonte_primaria).toBeNull();
    }
  });

  it("ogni course.skill_id referenzia skill esistenti; ogni module.course_id referenzia un corso esistente", () => {
    const skillIds = new Set(SKILLS_DEF.map((s) => s.id));
    const courseIds = new Set(courses.map((c) => c.id));
    for (const c of courses) {
      for (const sId of c.skill_id) expect(skillIds.has(sId)).toBe(true);
    }
    for (const m of modules) {
      expect(courseIds.has(m.course_id)).toBe(true);
    }
  });

  it("per ogni skill con moduli_totali > 0, la somma dei peso_skill dei suoi moduli è 1.0 esatto", () => {
    for (const skillDef of SKILLS_DEF) {
      if (skillDef.moduli_totali === 0) continue;
      const somma = modules
        .filter((m) => skillDef.id in m.peso_skill)
        .reduce((acc, m) => acc + (m.peso_skill[skillDef.id] ?? 0), 0);
      expect(Math.abs(somma - 1)).toBeLessThan(1e-9);
    }
  });

  it("il numero di moduli generati per ogni skill combacia con moduli_totali dichiarato", () => {
    for (const skillDef of SKILLS_DEF) {
      const count = modules.filter((m) => skillDef.id in m.peso_skill).length;
      expect(count).toBe(skillDef.moduli_totali);
    }
  });

  it("corso-mcp ha 9 moduli (4 tool-calling + 5 mcp-protocollo)", () => {
    const corsoMcp = courses.find((c) => c.id === "corso-mcp")!;
    expect(corsoMcp.moduli).toHaveLength(9);
  });
});

describe("seed: profile", () => {
  it("calibrazione.fatta_il è null (l'onboarding non è ancora stato fatto)", () => {
    const profile = buildProfile();
    expect(profile.calibrazione.fatta_il).toBeNull();
    expect(() => ProfileSchema.parse(profile)).not.toThrow();
  });
});

describe("§7 dipendenze fra corsi → prerequisiti skill", () => {
  it("le skill senza corso dedicato (rag, provenienza-sicurezza) esistono comunque a moduli_totali 0", () => {
    const rag = SKILLS_DEF.find((s) => s.id === "rag")!;
    const prov = SKILLS_DEF.find((s) => s.id === "provenienza-sicurezza")!;
    expect(rag.moduli_totali).toBe(0);
    expect(prov.moduli_totali).toBe(0);
  });

  it("nessun corso è assente dalla lista COURSES_DEF per le skill con moduli_totali > 0", () => {
    const skillIdsConModuli = SKILLS_DEF.filter((s) => s.moduli_totali > 0).map((s) => s.id);
    const skillIdsNeiCorsi = new Set(COURSES_DEF.flatMap((c) => c.moduliPerSkill.map(([id]) => id)));
    for (const id of skillIdsConModuli) {
      expect(skillIdsNeiCorsi.has(id)).toBe(true);
    }
  });
});
