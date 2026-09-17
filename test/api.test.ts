import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Server } from "node:http";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

// L'env var va settata PRIMA di importare server/store.ts (via app.ts), perché
// DATA_DIR è calcolato una sola volta al primo import del modulo.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-teacher-test-"));
process.env.AGENT_TEACHER_DATA_DIR = tmpDir;

const { createApp } = await import("../server/app.js");
const seedMod = await import("../scripts/seed.js");
const schema = await import("../shared/schema.js");

let server: Server;
let baseUrl: string;
let modulesConUnoPronto: unknown;
let modulesTuttiBozza: unknown;

beforeAll(async () => {
  fs.mkdirSync(path.join(tmpDir, "requests", "done"), { recursive: true });

  const skillsById = new Map(seedMod.SKILLS_DEF.map((s) => [s.id, s]));
  const skills = seedMod.buildSkills();
  const { courses, modules } = seedMod.buildCoursesAndModules(skillsById);
  const profile = seedMod.buildProfile();

  modulesConUnoPronto = modules.map((m) =>
    m.id === "mod-llm-01"
      ? {
          ...m,
          stato: "pronto" as const,
          fonte_primaria: {
            url: "https://example.com/llm",
            titolo: "Introduzione agli LLM",
            tipo: "documentazione",
            verificata_il: "2026-01-01",
          },
        }
      : m,
  );
  modulesTuttiBozza = modules;

  fs.writeFileSync(path.join(tmpDir, "skills.json"), JSON.stringify(schema.SkillsFileSchema.parse(skills), null, 2));
  fs.writeFileSync(path.join(tmpDir, "courses.json"), JSON.stringify(schema.CoursesFileSchema.parse(courses), null, 2));
  fs.writeFileSync(
    path.join(tmpDir, "modules.json"),
    JSON.stringify(schema.ModulesFileSchema.parse(modulesConUnoPronto), null, 2),
  );
  fs.writeFileSync(path.join(tmpDir, "profile.json"), JSON.stringify(schema.ProfileSchema.parse(profile), null, 2));
  fs.writeFileSync(path.join(tmpDir, "sessions.json"), JSON.stringify([]));
  fs.writeFileSync(path.join(tmpDir, "reviews.json"), JSON.stringify([]));
  fs.writeFileSync(path.join(tmpDir, "inbox.json"), JSON.stringify([]));

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  baseUrl = `http://localhost:${port}/api`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("API Express (in-process)", () => {
  it("GET /api/health risponde ok", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
  });

  it("GET /api/session/next con zero moduli pronto risponde { vuoto: true }, mai un errore", async () => {
    fs.writeFileSync(
      path.join(tmpDir, "modules.json"),
      JSON.stringify(schema.ModulesFileSchema.parse(modulesTuttiBozza), null, 2),
    );

    const res = await fetch(`${baseUrl}/session/next`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { vuoto: boolean; messaggio: string };
    expect(body.vuoto).toBe(true);
    expect(typeof body.messaggio).toBe("string");
    expect(body.messaggio.length).toBeGreaterThan(0);
  });

  it("un modulo completato è immutabile: la seconda PATCH .../completa restituisce 409", async () => {
    fs.writeFileSync(
      path.join(tmpDir, "modules.json"),
      JSON.stringify(schema.ModulesFileSchema.parse(modulesConUnoPronto), null, 2),
    );

    const res1 = await fetch(`${baseUrl}/modules/mod-llm-01/completa`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ risposte: [{ q: "domanda", risposta: "risposta" }] }),
    });
    expect(res1.status).toBe(200);
    const body1 = (await res1.json()) as {
      modulo: { stato: string };
      review: { stato: string };
      skill: { id: string; livello: number; livello_fonte: string; moduli_completati: number } | null;
    };
    expect(body1.modulo.stato).toBe("completato");
    expect(body1.review.stato).toBe("in_attesa");
    // criterio di accettazione: il livello della skill sale dopo il completamento
    expect(body1.skill?.id).toBe("fondamenta-llm");
    expect(body1.skill?.livello).toBeGreaterThan(0);
    expect(body1.skill?.livello_fonte).toBe("moduli");
    expect(body1.skill?.moduli_completati).toBe(1);

    const res2 = await fetch(`${baseUrl}/modules/mod-llm-01/completa`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ risposte: [] }),
    });
    expect(res2.status).toBe(409);
  });

  it("POST /api/onboarding scrive i livelli e la calibrazione, una seconda chiamata dà 409", async () => {
    const risposte = [
      { domanda_id: "q-fondamenta-llm", opzione_id: "so-farlo" },
      { domanda_id: "q-tool-calling", opzione_id: "non-lo-so" },
    ];

    const res1 = await fetch(`${baseUrl}/onboarding`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ risposte }),
    });
    expect(res1.status).toBe(200);

    const profiloRes = await fetch(`${baseUrl}/profile`);
    const profilo = (await profiloRes.json()) as { calibrazione: { fatta_il: string | null } };
    expect(profilo.calibrazione.fatta_il).not.toBeNull();

    const skillsRes = await fetch(`${baseUrl}/skills`);
    const skills = (await skillsRes.json()) as Array<{ id: string; livello: number; livello_fonte: string }>;
    const fondamenta = skills.find((s) => s.id === "fondamenta-llm")!;
    expect(fondamenta.livello).toBe(3); // "so-farlo"
    expect(fondamenta.livello_fonte).toBe("calibrazione");

    const res2 = await fetch(`${baseUrl}/onboarding`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ risposte }),
    });
    expect(res2.status).toBe(409);
  });

  it("flusso completo di una sessione: next -> apri -> completa -> chiudi (quello che fa Daily.tsx)", async () => {
    fs.writeFileSync(
      path.join(tmpDir, "modules.json"),
      JSON.stringify(schema.ModulesFileSchema.parse(modulesConUnoPronto), null, 2),
    );
    fs.writeFileSync(path.join(tmpDir, "sessions.json"), JSON.stringify([]));

    const nextRes = await fetch(`${baseUrl}/session/next`);
    expect(nextRes.status).toBe(200);
    const next = (await nextRes.json()) as {
      vuoto: false;
      numero: number;
      items: Array<{ module_id: string; ruolo: string; motivazione: string | null }>;
    };
    expect(next.vuoto).toBe(false);
    const principale = next.items.find((i) => i.ruolo === "principale")!;
    expect(principale.module_id).toBe("mod-llm-01");
    expect(typeof principale.motivazione).toBe("string"); // la Daily mostra "perché proprio questo"

    const apriRes = await fetch(`${baseUrl}/session/apri`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: next.items, qualifica_inbox: [] }),
    });
    expect(apriRes.status).toBe(200);
    const sessione = (await apriRes.json()) as { id: string };

    const completaRes = await fetch(`${baseUrl}/modules/${principale.module_id}/completa`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ session_id: sessione.id, risposte: [] }),
    });
    expect(completaRes.status).toBe(200);

    const chiudiRes = await fetch(`${baseUrl}/session/${sessione.id}/chiudi`, { method: "POST" });
    expect(chiudiRes.status).toBe(200);
    const chiusa = (await chiudiRes.json()) as { stato: string; chiusa_il: string | null };
    expect(chiusa.stato).toBe("chiusa");
    expect(chiusa.chiusa_il).not.toBeNull();

    // il modulo appena completato non compare più come candidato in una nuova sessione
    const nextRes2 = await fetch(`${baseUrl}/session/next`);
    const next2 = (await nextRes2.json()) as { vuoto: boolean };
    expect(next2.vuoto).toBe(true);
  });

  it("GET /session/next con una sessione aperta la riprende invece di calcolarne una nuova", async () => {
    fs.writeFileSync(
      path.join(tmpDir, "modules.json"),
      JSON.stringify(schema.ModulesFileSchema.parse(modulesConUnoPronto), null, 2),
    );
    fs.writeFileSync(path.join(tmpDir, "sessions.json"), JSON.stringify([]));

    const next1Res = await fetch(`${baseUrl}/session/next`);
    const next1 = (await next1Res.json()) as { numero: number; items: Array<{ module_id: string; ruolo: string }> };

    const apriRes = await fetch(`${baseUrl}/session/apri`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: next1.items, qualifica_inbox: [] }),
    });
    expect(apriRes.status).toBe(200);
    const sessione = (await apriRes.json()) as { id: string };

    const profiloPrima = (await (await fetch(`${baseUrl}/profile`)).json()) as { sessioni_totali: number };

    const next2Res = await fetch(`${baseUrl}/session/next`);
    const next2 = (await next2Res.json()) as { numero: number };
    const next3Res = await fetch(`${baseUrl}/session/next`);
    const next3 = (await next3Res.json()) as { numero: number };

    expect(next2.numero).toBe(next1.numero);
    expect(next3.numero).toBe(next1.numero);

    const profiloDopo = (await (await fetch(`${baseUrl}/profile`)).json()) as { sessioni_totali: number };
    expect(profiloDopo.sessioni_totali).toBe(profiloPrima.sessioni_totali); // nessuna nuova sessione creata

    // POST /session/apri con una sessione già aperta rifiuta con 409
    const apriDiNuovoRes = await fetch(`${baseUrl}/session/apri`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: next1.items, qualifica_inbox: [] }),
    });
    expect(apriDiNuovoRes.status).toBe(409);

    // chiudere senza completare libera il modulo principale: torna "pronto" ed è di nuovo candidato
    const chiudiRes = await fetch(`${baseUrl}/session/${sessione.id}/chiudi`, { method: "POST" });
    expect(chiudiRes.status).toBe(200);

    const principale = next1.items.find((i) => i.ruolo === "principale")!;
    const moduloRes = await fetch(`${baseUrl}/modules/${principale.module_id}`);
    const moduloPrincipale = (await moduloRes.json()) as { stato: string; servito_il: string | null };
    expect(moduloPrincipale.stato).toBe("pronto");
    expect(moduloPrincipale.servito_il).toBeNull();

    const next4Res = await fetch(`${baseUrl}/session/next`);
    const next4 = (await next4Res.json()) as { vuoto: boolean; items?: Array<{ module_id: string; ruolo: string }> };
    expect(next4.vuoto).toBe(false);
    expect(next4.items?.some((i) => i.module_id === principale.module_id)).toBe(true);
  });

  it("POST /api/inbox scrive in coda senza errori e senza fare rete", async () => {
    const res = await fetch(`${baseUrl}/inbox`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://github.com/example/repo" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { fonte: string; stato: string };
    expect(body.fonte).toBe("github");
    expect(body.stato).toBe("da_leggere");
  });

  it("oltre 5 link in coda crea una richiesta digerisci_inbox, senza duplicarla", async () => {
    fs.writeFileSync(path.join(tmpDir, "inbox.json"), JSON.stringify([]));
    for (const f of fs.readdirSync(path.join(tmpDir, "requests"))) {
      if (f.endsWith(".json")) fs.rmSync(path.join(tmpDir, "requests", f));
    }

    for (let i = 0; i < 6; i++) {
      const res = await fetch(`${baseUrl}/inbox`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: `https://example.com/articolo-${i}` }),
      });
      expect(res.status).toBe(201);
    }

    const richieste = fs
      .readdirSync(path.join(tmpDir, "requests"))
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(fs.readFileSync(path.join(tmpDir, "requests", f), "utf-8")) as { tipo: string });
    const digerisci = richieste.filter((r) => r.tipo === "digerisci_inbox");
    expect(digerisci).toHaveLength(1); // non duplicata anche con più inserimenti oltre soglia
  });

  it("GET /api/illustrazioni/:id.svg serve un SVG esistente, dà 404 su uno inesistente e 400 su un id sospetto", async () => {
    fs.mkdirSync(path.join(tmpDir, "illustrations"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "illustrations", "prova.svg"), "<svg></svg>");

    const okRes = await fetch(`${baseUrl}/illustrazioni/prova.svg`);
    expect(okRes.status).toBe(200);
    expect(okRes.headers.get("content-type")).toContain("image/svg+xml");
    expect(await okRes.text()).toBe("<svg></svg>");

    const mancanteRes = await fetch(`${baseUrl}/illustrazioni/non-esiste.svg`);
    expect(mancanteRes.status).toBe(404);

    const traversalRes = await fetch(`${baseUrl}/illustrazioni/${encodeURIComponent("../secret")}.svg`);
    expect(traversalRes.status).toBe(400);

    const maiuscoloRes = await fetch(`${baseUrl}/illustrazioni/Prova.svg`);
    expect(maiuscoloRes.status).toBe(400);
  });

  it("PATCH /api/sessions/:id/progresso scrive slide_corrente sull'item giusto e non tocca il resto", async () => {
    fs.writeFileSync(
      path.join(tmpDir, "modules.json"),
      JSON.stringify(schema.ModulesFileSchema.parse(modulesConUnoPronto), null, 2),
    );
    fs.writeFileSync(path.join(tmpDir, "sessions.json"), JSON.stringify([]));

    const nextRes = await fetch(`${baseUrl}/session/next`);
    const next = (await nextRes.json()) as { items: Array<{ module_id: string; ruolo: string }> };
    const apriRes = await fetch(`${baseUrl}/session/apri`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: next.items, qualifica_inbox: [] }),
    });
    const sessione = (await apriRes.json()) as { id: string; items: Array<{ module_id: string; ruolo: string }> };
    const principale = sessione.items.find((i) => i.ruolo === "principale")!;

    const progressoRes = await fetch(`${baseUrl}/sessions/${sessione.id}/progresso`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ module_id: principale.module_id, slide_corrente: 3 }),
    });
    expect(progressoRes.status).toBe(200);
    const sessioneAggiornata = (await progressoRes.json()) as {
      items: Array<{ module_id: string; ruolo: string; slide_corrente?: number }>;
    };
    const itemAggiornato = sessioneAggiornata.items.find((i) => i.module_id === principale.module_id)!;
    expect(itemAggiornato.slide_corrente).toBe(3);
    // gli altri item della sessione restano invariati
    const altriItems = sessioneAggiornata.items.filter((i) => i.module_id !== principale.module_id);
    expect(altriItems.every((i) => i.slide_corrente === undefined)).toBe(true);

    const modulo404Res = await fetch(`${baseUrl}/sessions/${sessione.id}/progresso`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ module_id: "mod-non-esiste", slide_corrente: 0 }),
    });
    expect(modulo404Res.status).toBe(404);

    await fetch(`${baseUrl}/session/${sessione.id}/chiudi`, { method: "POST" });
  });
});
