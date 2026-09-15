import { describe, it, expect } from "vitest";
import { leggiVociGrezze, mappaVoce, ricalcolaInteresseOsservato } from "../scripts/import-inbox.js";
import { SKILLS_DEF, buildSkills } from "../scripts/seed.js";
import { InboxFileSchema } from "../shared/schema.js";

const vociGrezze = leggiVociGrezze();
const inbox = vociGrezze.map(mappaVoce);

describe("import-inbox: mappatura delle 54 voci", () => {
  it("54 voci in output, nessuna persa o duplicata", () => {
    expect(inbox).toHaveLength(54);
    expect(new Set(inbox.map((e) => e.id)).size).toBe(54);
  });

  it("valida contro InboxFileSchema", () => {
    expect(() => InboxFileSchema.parse(inbox)).not.toThrow();
  });

  it("ogni skill_toccate referenzia id di skill validi presenti in skills.json", () => {
    const idValidi = new Set(SKILLS_DEF.map((s) => s.id));
    for (const voce of inbox) {
      for (const skillId of voce.skill_toccate) {
        expect(idValidi.has(skillId)).toBe(true);
      }
    }
  });

  it("nessuna analisi di rete: fonte_primaria resta sempre null (è lavoro della routine, non dello script)", () => {
    for (const voce of inbox) {
      expect(voce.fonte_primaria).toBeNull();
    }
  });
});

describe("import-inbox: interesse_osservato", () => {
  const skillsAggiornate = ricalcolaInteresseOsservato(buildSkills(), inbox);

  it("mcp-protocollo, tool-calling, evals-sicurezza, framework-agentici, rag restano a 0 (coerenza con §0 della specifica)", () => {
    for (const id of ["mcp-protocollo", "tool-calling", "evals-sicurezza", "framework-agentici", "rag"]) {
      const s = skillsAggiornate.find((sk) => sk.id === id)!;
      expect(s.interesse_osservato).toBe(0);
    }
  });

  it("claude-code ha il valore di interesse_osservato più alto fra tutte le skill", () => {
    const max = Math.max(...skillsAggiornate.map((s) => s.interesse_osservato));
    const claudeCode = skillsAggiornate.find((s) => s.id === "claude-code")!;
    expect(claudeCode.interesse_osservato).toBe(max);
    expect(max).toBeGreaterThan(0);
  });

  it("nessun valore fuori dal range 0-1", () => {
    for (const s of skillsAggiornate) {
      expect(s.interesse_osservato).toBeGreaterThanOrEqual(0);
      expect(s.interesse_osservato).toBeLessThanOrEqual(1);
    }
  });
});

describe("import-inbox: NotebookLM e Codex non finiscono mai su rag/framework-agentici", () => {
  it("nessuna voce con NotebookLM/Open Notebook tocca 'rag'", () => {
    for (const voce of inbox) {
      const haNotebook = voce.tool_nominati.some((t) => t.toLowerCase().includes("notebook"));
      if (haNotebook) expect(voce.skill_toccate).not.toContain("rag");
    }
  });

  it("nessuna voce con Codex tocca 'framework-agentici'", () => {
    for (const voce of inbox) {
      const haCodex = voce.tool_nominati.some((t) => t.toLowerCase() === "codex");
      if (haCodex) expect(voce.skill_toccate).not.toContain("framework-agentici");
    }
  });
});
