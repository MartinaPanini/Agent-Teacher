import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  ProfileSchema,
  SkillsFileSchema,
  CoursesFileSchema,
  ModulesFileSchema,
  SessionsFileSchema,
  ReviewsFileSchema,
  InboxFileSchema,
  RequestSchema,
  type Profile,
  type Skill,
  type Course,
  type Module,
  type Session,
  type Review,
  type InboxEntry,
  type RequestItem,
} from "../shared/schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Sovrascrivibile via env var solo per i test d'integrazione (isolamento dalla
// data/ reale del progetto): vedi test/api.test.ts.
export const DATA_DIR = process.env.AGENT_TEACHER_DATA_DIR
  ? path.resolve(process.env.AGENT_TEACHER_DATA_DIR)
  : path.resolve(__dirname, "../data");
export const REQUESTS_DIR = path.join(DATA_DIR, "requests");
export const REQUESTS_DONE_DIR = path.join(REQUESTS_DIR, "done");

// la routine Cowork scrive direttamente nei file data/*.json da un processo
// esterno mentre il server è in esecuzione: senza lock, una lettura può capitare
// nel mezzo di una scrittura e trovare JSON troncato. È una finestra di pochi
// millisecondi, quindi un paio di retry immediati bastano a scavallarla.
const LETTURA_MAX_TENTATIVI = 5;

export function readJson<T>(fileName: string, schema: { parse: (d: unknown) => T }): T {
  const filePath = path.join(DATA_DIR, fileName);
  let ultimoErrore: Error | undefined;
  for (let tentativo = 1; tentativo <= LETTURA_MAX_TENTATIVI; tentativo++) {
    let raw: string;
    try {
      raw = fs.readFileSync(filePath, "utf-8");
    } catch (err) {
      throw new Error(`data/${fileName}: impossibile leggere il file (${(err as Error).message})`);
    }
    try {
      const json: unknown = JSON.parse(raw);
      return schema.parse(json);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const dettagli = err.issues.map((i) => `campo "${i.path.join(".") || "(radice)"}": ${i.message}`).join("; ");
        throw new Error(`data/${fileName}: ${dettagli}`);
      }
      ultimoErrore = new Error(`data/${fileName}: JSON non valido (${(err as Error).message})`);
    }
  }
  throw ultimoErrore;
}

export function writeJson<T>(fileName: string, data: T, schema: { parse: (d: unknown) => T }): void {
  const parsed = schema.parse(data);
  const filePath = path.join(DATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2) + "\n", "utf-8");
}

export const readProfile = () => readJson<Profile>("profile.json", ProfileSchema);
export const writeProfile = (p: Profile) => writeJson("profile.json", p, ProfileSchema);

export const readSkills = () => readJson<Skill[]>("skills.json", SkillsFileSchema);
export const writeSkills = (s: Skill[]) => writeJson("skills.json", s, SkillsFileSchema);

export const readCourses = () => readJson<Course[]>("courses.json", CoursesFileSchema);
export const writeCourses = (c: Course[]) => writeJson("courses.json", c, CoursesFileSchema);

export const readModules = () => readJson<Module[]>("modules.json", ModulesFileSchema);
export const writeModules = (m: Module[]) => writeJson("modules.json", m, ModulesFileSchema);

export const readSessions = () => readJson<Session[]>("sessions.json", SessionsFileSchema);
export const writeSessions = (s: Session[]) => writeJson("sessions.json", s, SessionsFileSchema);

export const readReviews = () => readJson<Review[]>("reviews.json", ReviewsFileSchema);
export const writeReviews = (r: Review[]) => writeJson("reviews.json", r, ReviewsFileSchema);

export const readInbox = () => readJson<InboxEntry[]>("inbox.json", InboxFileSchema);
export const writeInbox = (i: InboxEntry[]) => writeJson("inbox.json", i, InboxFileSchema);

// ---------------------------------------------------------------------------
// data/requests/: coda verso la routine Cowork. Le richieste evase si spostano
// in requests/done/, non si cancellano mai.
// ---------------------------------------------------------------------------

function formatRequestId(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const data = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const ora = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `req-${data}-${ora}`;
}

export function creaRichiesta(tipo: RequestItem["tipo"], payload: Record<string, unknown>): RequestItem {
  const now = new Date();
  const request = RequestSchema.parse({
    id: formatRequestId(now),
    tipo,
    payload,
    creato_il: now.toISOString(),
    stato: "in_attesa",
  } satisfies RequestItem);
  fs.mkdirSync(REQUESTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(REQUESTS_DIR, `${request.id}.json`), JSON.stringify(request, null, 2) + "\n", "utf-8");
  return request;
}

function listaRichieste(dir: string): RequestItem[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => RequestSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"))));
}

export function richiestaInAttesaEsiste(tipo: RequestItem["tipo"]): boolean {
  return listaRichieste(REQUESTS_DIR).some((r) => r.tipo === tipo && r.stato === "in_attesa");
}
