import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import type { InboxEntry } from "../../shared/schema.js";
import { readInbox, writeInbox, creaRichiesta, richiestaInAttesaEsiste } from "../store.js";

export const inboxRouter = Router();

function riconosciFonte(url: string): InboxEntry["fonte"] {
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (host.includes("instagram.com")) return "instagram";
  if (host.includes("tiktok.com")) return "tiktok";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host.includes("github.com")) return "github";
  if (host.includes("arxiv.org")) return "arxiv";
  return "articolo";
}

const AggiungiBodySchema = z.object({
  url: z.string(),
  didascalia: z.string().optional(),
});

inboxRouter.post("/inbox", (req, res) => {
  const parsed = AggiungiBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let fonte: InboxEntry["fonte"];
  try {
    fonte = riconosciFonte(parsed.data.url);
  } catch {
    res.status(400).json({ error: "URL non valido" });
    return;
  }

  const voce: InboxEntry = {
    id: crypto.randomUUID(),
    url: parsed.data.url,
    aggiunto_il: new Date().toISOString().slice(0, 10),
    fonte,
    stato: "da_leggere",
    didascalia_incollata: parsed.data.didascalia ?? null,
    estratto: null,
    tool_nominati: [],
    fonte_primaria: null,
    verdetto: null,
    motivo: null,
    skill_toccate: [],
    modulo_generato: null,
    nota_utente: "",
  };

  const inbox = readInbox();
  const inboxAggiornato = [...inbox, voce];
  writeInbox(inboxAggiornato);

  // §3.3: nessuna analisi qui — solo la coda. Se supera 5 elementi da leggere, si
  // segnala alla routine, senza duplicare la richiesta se una è già in attesa.
  const daLeggere = inboxAggiornato.filter((e) => e.stato === "da_leggere").length;
  if (daLeggere > 5 && !richiestaInAttesaEsiste("digerisci_inbox")) {
    creaRichiesta("digerisci_inbox", { motivo: `coda a ${daLeggere} voci da_leggere` });
  }

  res.status(201).json(voce);
});

const QualificaBodySchema = z.object({
  nota_utente: z.string(),
});

inboxRouter.patch("/inbox/:id/qualifica", (req, res) => {
  const inbox = readInbox();
  const idx = inbox.findIndex((e) => e.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: `voce inbox "${req.params.id}" non trovata` });
    return;
  }
  const parsed = QualificaBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const aggiornata: InboxEntry = { ...inbox[idx]!, nota_utente: parsed.data.nota_utente, stato: "risolto" };
  writeInbox(inbox.map((e) => (e.id === aggiornata.id ? aggiornata : e)));
  res.json(aggiornata);
});
