import { describe, it, expect } from "vitest";
import { usaLezione } from "../web/src/lib/contenuto.js";

describe("usaLezione: sceglie fra Lezione a slide e sintesi_md (RF56-59)", () => {
  it("un modulo con slide popolate viene mostrato come lezione", () => {
    expect(usaLezione({ slide: [{ titolo: "Prima di partire" }] })).toBe(true);
  });

  it("un modulo senza il campo slide continua a usare sintesi_md", () => {
    expect(usaLezione({})).toBe(false);
  });

  it("un modulo con slide vuoto (array presente ma senza elementi) continua a usare sintesi_md", () => {
    expect(usaLezione({ slide: [] })).toBe(false);
  });
});
