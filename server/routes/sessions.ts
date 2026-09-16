import { Router } from "express";
import { z } from "zod";
import type { Module } from "../../shared/schema.js";
import {
  calcolaSessione,
  cosaIgnorareOggi,
  motivazionePrincipale,
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

function espandiItems(
  items: Array<{ module_id: string; ruolo: SessionRuolo }>,
  input: PriorityInput,
  modulesById: Map<string, Module>,
) {
  return items.map((it) => {
    const modulo = modulesById.get(it.module_id) ?? null;
    const motivazione = it.ruolo === "principale" && modulo ? motivazionePrincipale(modulo, input) : null;
    return { ...it, modulo, motivazione };
  });
}

sessionsRouter.get("/session/next", (_req, res) => {
  const input = buildPriorityInput();
  const modulesById = new Map(input.modules.map((m) => [m.id, m]));
  const inboxById = new Map(input.inbox.map((e) => [e.id, e]));

  // §1.2: esiste "la prossima sessione", non una sessione nuova per apertura del sito —
  // se una sessione è già aperta, la si riprende invece di calcolarne un'altra.
  const sessioneAperta = input.sessions.find((s) => s.stato === "aperta");
  if (sessioneAperta) {
    res.json({
      vuoto: false,
      numero: sessioneAperta.numero,
      session_id: sessioneAperta.id,
      items: espandiItems(sessioneAperta.items, input, modulesById),
      qualifica_inbox: sessioneAperta.qualifica_inbox.map((id) => inboxById.get(id)).filter((e) => e !== undefined),
      cosa_ignorare_oggi: cosaIgnorareOggi(input),
    });
    return;
  }

  const draft = calcolaSessione(input, { ora: new Date(), random: Math.random });

  if (draft.vuoto) {
    res.json({
      vuoto: true,
      messaggio: "nessun modulo pronto — lancia la routine Cowork per generarne 7",
      cosa_ignorare_oggi: cosaIgnorareOggi(input),
    });
    return;
  }

  res.json({
    vuoto: false,
    numero: draft.numero,
    items: espandiItems(draft.items, input, modulesById),
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

  const sessions = readSessions();
  const sessioneAperta = sessions.find((s) => s.stato === "aperta");
  if (sessioneAperta) {
    res.status(409).json({ error: "una sessione è già aperta", session_id: sessioneAperta.id });
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
  const sessioneOriginale = sessions[idx]!;
  const ora = new Date();
  const sessioneChiusa = { ...sessioneOriginale, stato: "chiusa" as const, chiusa_il: ora.toISOString() };
  writeSessions(sessions.map((s) => (s.id === sessioneChiusa.id ? sessioneChiusa : s)));

  // chiudere senza finire non deve costare un modulo: chi è rimasto "servito" senza
  // essere stato completato torna "pronto" e riappare fra i candidati.
  const moduleIdsSessione = new Set(sessioneOriginale.items.map((it) => it.module_id));
  const modules = readModules();
  const moduliAggiornati = modules.map((m) =>
    moduleIdsSessione.has(m.id) && m.stato === "servito" && m.completato_il === null
      ? { ...m, stato: "pronto" as const, servito_il: null }
      : m,
  );
  writeModules(moduliAggiornati);

  const profile = readProfile();
  writeProfile({ ...profile, ultima_sessione_il: ora.toISOString().slice(0, 10) });

  res.json(sessioneChiusa);
});
