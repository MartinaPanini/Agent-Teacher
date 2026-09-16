import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { renderMarkdown } from "../shared/markdown.js";
import type { Module } from "../shared/schema.js";

// Controlla che i moduli rispettino docs/STILE.md.
// Le regole qui sono quelle verificabili a macchina: le altre stanno nella
// checklist del capitolo 9 e le passa chi scrive.

const moduli = JSON.parse(readFileSync("data/modules.json", "utf8")) as Module[];
const pieni = moduli.filter((m) => m.sintesi_md);

/** Il testo che l'occhio vede: via i tag, via il contenuto di pre e code. */
function visibile(html: string): string {
  return html
    .replace(/<pre>[\s\S]*?<\/pre>/g, "")
    .replace(/<code>[\s\S]*?<\/code>/g, "")
    .replace(/<[^>]+>/g, "");
}

/** Le frasi di prosa: fuori dai blocchi di codice, dalle tabelle, dai titoli e dagli elenchi. */
function frasi(md: string): string[] {
  const prosa = md
    .replace(/```[\s\S]*?```/g, "")
    .split("\n")
    .filter((r) => !/^\s*([#|\-*+]|\d+[.)])/.test(r) && r.trim() !== "")
    .join(" ");
  return prosa
    .split(/(?<=[.!?:;])\s+/)
    .map((f) => f.trim())
    .filter(Boolean);
}

describe("moduli: il markdown arriva a schermo formattato", () => {
  for (const m of pieni) {
    it(`${m.id}: nessun simbolo di markup visibile`, () => {
      const v = visibile(renderMarkdown(m.sintesi_md));
      expect(v).not.toMatch(/^#{1,6}\s/m);
      expect(v).not.toContain("**");
      expect(v).not.toContain("`");
      expect(v).not.toMatch(/\[[^\]]+\]\(/);
      expect(v).not.toMatch(/^\s*\|/m);
    });
  }
});

describe("moduli: regole di docs/STILE.md", () => {
  for (const m of moduli) {
    it(`${m.id}: lettere accentate al posto dell'apostrofo`, () => {
      const t = `${m.titolo} ${m.obiettivo}`;
      expect(t).not.toMatch(/\b(perche|piu|puo|gia|cosi|cioe|poiche|finche|sara|citta|qualita)'/i);
    });
  }

  for (const m of pieni) {
    it(`${m.id}: da 2 a 5 sezioni`, () => {
      const senzaCodice = m.sintesi_md.replace(/```[\s\S]*?```/g, "");
      const sezioni = (senzaCodice.match(/^##\s/gm) || []).length;
      expect(sezioni).toBeGreaterThanOrEqual(2);
      expect(sezioni).toBeLessThanOrEqual(5);
    });

    it(`${m.id}: fra 300 e 600 parole`, () => {
      const parole = m.sintesi_md.split(/\s+/).filter(Boolean).length;
      expect(parole).toBeGreaterThanOrEqual(300);
      expect(parole).toBeLessThanOrEqual(600);
    });

    it(`${m.id}: nessuna frase oltre le 30 parole`, () => {
      expect(frasi(m.sintesi_md).filter((f) => f.split(/\s+/).length > 30)).toEqual([]);
    });

    it(`${m.id}: niente burocratese`, () => {
      expect(m.sintesi_md).not.toMatch(/al fine di|risulta essere|in merito a|sostanzialmente|in questa sezione/i);
    });
  }
});
