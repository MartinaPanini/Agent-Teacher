import { Router } from "express";
import { z } from "zod";
import {
  calcolaSessione,
  cosaIgnorareOggi,
  type PriorityInput,
  type SessionRuolo,
} from "../priority.js";
import {
  readProfile,
  writeProfile,
  readSkills,
  readCourses,
  readModules,
  writeModules,
  readSessions,
  writeSessions,
  readInbox,
} from "../store.js";

export const sessionsRouter = Router();

function buildPriorityInput(): PriorityInput {
  return {
    skills: readSkills(),
    modules: readModules(),
    courses: readCourses(),
    profile: readProfile(),
    sessions: readSessions(),
    inbox: readInbox(),
  };
}

sessionsRouter.get("/session/next", (_req, res) => {
  const input = buildPriorityInput();
  const draft = calcolaSessione(input, { ora: new Date(), random: Math.random });

  if (draft.vuoto) {
    res.json({
      vuoto: true,
      messaggio: "nessun modulo pronto — lancia la routine Cowork per generarne 7",
      cosa_ignorare_oggi: cosaIgnorareOggi(input),
    });
    return;
  }

  const modulesById = new Map(input.modules.map((m) => [m.id, m]));
  const itemsEspansi = draft.items.map((it) => ({ ...it, modulo: modulesById.get(it.module_id) ?? null }));
  const inboxById = new Map(input.inbox.map((e) => [e.id, e]));

  res.json({
    vuoto: false,
    numero: draft.numero,
    items: itemsEspansi,
    qualifica_inbox: draft.qualifica_inbox.map((id) => inboxById.get(id)).filter((e) => e !== undefined),
    cosa_ignorare_oggi: cosaIgnorareOggi(input),
  });
});

const ApriBodySchema = z.object({
  items: z.array(z.object({ module_id: z.string(), ruolo: z.enum(["principale", "scoperta", "ripasso"]) })),
  qualifica_inbox: z.array(z.string()).default([]),
});

const DURATA_RIPASSO_MIN = 10;
const DURATA_SCOPERTA_MIN = 5;
const DURATA_QUALIFICA_MIN = 1;

sessionsRouter.post("/session/apri", (req, res) => {
  const parsed = ApriBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const profile = readProfile();
  const modules = readModules();
  const modulesById = new Map(modules.map((m) => [m.id, m]));

  for (const it of parsed.data.items) {
    if (!modulesById.has(it.module_id)) {
      res.status(400).json({ error: `modulo "${it.module_id}" non esiste` });
      return;
    }
  }

  const numero = profile.sessioni_totali + 1;
  const id = `ses-${String(numero).padStart(4, "0")}`;
  const oraApertura = new Date();

  const principale = parsed.data.items.find((it) => it.ruolo === "principale");
  const haRipasso = parsed.data.items.some((it) => it.ruolo === "ripasso");
  const haScoperta = parsed.data.items.some((it) => it.ruolo === "scoperta");
  const durata_stimata_min =
    (haRipasso ? DURATA_RIPASSO_MIN : 0) +
    (parsed.data.qualifica_inbox.length > 0 ? DURATA_QUALIFICA_MIN : 0) +
    (principale ? (modulesById.get(principale.module_id)?.durata_min ?? 0) : 0) +
    (haScoperta ? DURATA_SCOPERTA_MIN : 0);

  const sessione = {
    id,
    numero,
    data: oraApertura.toISOString().slice(0, 10),
    durata_stimata_min,
    items: parsed.data.items as Array<{ module_id: string; ruolo: SessionRuolo }>,
    qualifica_inbox: parsed.data.qualifica_inbox,
    stato: "aperta" as const,
    aperta_il: oraApertura.toISOString(),
    chiusa_il: null,
  };

  const sessions = readSessions();
  writeSessions([...sessions, sessione]);

  const oggi = oraApertura.toISOString().slice(0, 10);
  const daServire = new Set(
    parsed.data.items.filter((it) => it.ruolo === "principale" || it.ruolo === "scoperta").map((it) => it.module_id),
  );
  const moduliAggiornati = modules.map((m) =>
    daServire.has(m.id) && m.stato === "pronto" ? { ...m, stato: "servito" as const, servito_il: oggi } : m,
  );
  writeModules(moduliAggiornati);
  writeProfile({ ...profile, sessioni_totali: numero });

  res.json(sessione);
});

sessionsRouter.post("/session/:id/chiudi", (req, res) => {
  const sessions = readSessions();
  const idx = sessions.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: `sessione "${req.params.id}" non trovata` });
    return;
  }
  const ora = new Date();
  const sessioneChiusa = { ...sessions[idx]!, stato: "chiusa" as const, chiusa_il: ora.toISOString() };
  writeSessions(sessions.map((s) => (s.id === sessioneChiusa.id ? sessioneChiusa : s)));

  const profile = readProfile();
  writeProfile({ ...profile, ultima_sessione_il: ora.toISOString().slice(0, 10) });

  res.json(sessioneChiusa);
});
