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
    const body1 = (await res1.json()) as { modulo: { stato: string }; review: { stato: string } };
    expect(body1.modulo.stato).toBe("completato");
    expect(body1.review.stato).toBe("in_attesa");

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
});
