import { z } from "zod";

// ---------------------------------------------------------------------------
// profile.json
// ---------------------------------------------------------------------------

export const CalibrazioneRispostaSchema = z.object({
  domanda_id: z.string(),
  risposta_id: z.string(),
});

export const ProfileSchema = z.object({
  nome: z.string(),
  ritmo_atteso_settimana: z.number().positive(),
  durata_sessione_min: z.number().positive(),
  quota_scoperta: z.number().min(0).max(1),
  buffer_minimo: z.number().int().nonnegative(),
  buffer_target: z.number().int().nonnegative(),
  soglia_ripasso_giorni: z.number().int().positive(),
  obiettivi: z.array(z.string()),
  calibrazione: z.object({
    fatta_il: z.string().nullable(),
    risposte: z.array(CalibrazioneRispostaSchema),
  }),
  ultima_sessione_il: z.string().nullable(),
  sessioni_totali: z.number().int().nonnegative(),
});
export type Profile = z.infer<typeof ProfileSchema>;

// ---------------------------------------------------------------------------
// skills.json
// ---------------------------------------------------------------------------

export const LivelloFonteSchema = z.enum(["calibrazione", "moduli", "dichiarato"]);

export const SkillSchema = z.object({
  id: z.string(),
  nome: z.string(),
  area: z.string(),
  descrizione: z.string(),
  livello: z.number().int().min(0).max(4),
  livello_fonte: LivelloFonteSchema,
  livello_aggiornato_il: z.string().nullable(),
  prerequisiti: z.array(z.string()),
  moduli_completati: z.number().int().nonnegative(),
  moduli_totali: z.number().int().nonnegative(),
  interesse_osservato: z.number().min(0).max(1),
  utilita_dichiarata: z.number().min(0).max(1),
  // Non nello schema letterale della specifica §2: serve a persistere la regola §4.4.5
  // ("non fa per me" abbassa il peso dell'area ma non la esclude mai). Denormalizzato su
  // ogni skill dell'area così non serve un file dati dedicato alle aree.
  peso_scoperta: z.number().min(0).max(1).default(1),
  note: z.string(),
});
export type Skill = z.infer<typeof SkillSchema>;

export const SkillsFileSchema = z.array(SkillSchema);

// ---------------------------------------------------------------------------
// courses.json
// ---------------------------------------------------------------------------

export const CourseStatoSchema = z.enum(["attivo", "in pausa", "completato"]);
export const TrackSchema = z.enum(["principale", "scoperta"]);

export const CourseSchema = z.object({
  id: z.string(),
  titolo: z.string(),
  obiettivo: z.string(),
  skill_id: z.array(z.string()),
  track: TrackSchema,
  stato: CourseStatoSchema,
  moduli: z.array(z.string()),
  origine: z.string(),
  creato_il: z.string(),
  aggiornato_il: z.string(),
});
export type Course = z.infer<typeof CourseSchema>;

export const CoursesFileSchema = z.array(CourseSchema);

// ---------------------------------------------------------------------------
// modules.json
// ---------------------------------------------------------------------------

export const ModuleTipoSchema = z.enum(["teoria", "pratica", "ripasso", "aggiornamento"]);
export const ModuleStatoSchema = z.enum(["bozza", "pronto", "servito", "completato"]);

export const FontePrimariaSchema = z.object({
  url: z.string().url(),
  titolo: z.string(),
  tipo: z.string(),
  verificata_il: z.string(),
});

export const DomandaSchema = z.object({
  q: z.string(),
  rubrica: z.string(),
});

const ModuleBaseSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  titolo: z.string(),
  tipo: ModuleTipoSchema,
  durata_min: z.number().int().positive(),
  voci_inbox: z.array(z.string()),
  obiettivo: z.string(),
  prerequisiti_skill: z.array(z.string()),
  prerequisiti_testo: z.string(),
  sintesi_md: z.string(),
  fonte_primaria: FontePrimariaSchema.nullable(),
  fonti_extra: z.array(FontePrimariaSchema),
  domande: z.array(DomandaSchema),
  peso_skill: z.record(z.string(), z.number()),
  stato: ModuleStatoSchema,
  origine: z.string(),
  nuovo: z.boolean(),
  creato_il: z.string(),
  servito_il: z.string().nullable(),
  completato_il: z.string().nullable(),
});
export type Module = z.infer<typeof ModuleBaseSchema>;

export const ModuleSchema = ModuleBaseSchema.superRefine((mod, ctx) => {
  if (mod.stato !== "bozza" && mod.fonte_primaria === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fonte_primaria"],
      message: `modulo "${mod.id}": fonte_primaria obbligatoria per stato "${mod.stato}" (solo "bozza" può averla null)`,
    });
  }
});

export const ModulesFileSchema = z.array(ModuleSchema);

// ---------------------------------------------------------------------------
// sessions.json
// ---------------------------------------------------------------------------

export const SessionRuoloSchema = z.enum(["principale", "scoperta", "ripasso"]);
export const SessionStatoSchema = z.enum(["aperta", "chiusa"]);

export const SessionItemSchema = z.object({
  module_id: z.string(),
  ruolo: SessionRuoloSchema,
});

export const SessionSchema = z.object({
  id: z.string(),
  numero: z.number().int().positive(),
  data: z.string(),
  durata_stimata_min: z.number().int().positive(),
  items: z.array(SessionItemSchema),
  qualifica_inbox: z.array(z.string()),
  stato: SessionStatoSchema,
  aperta_il: z.string(),
  chiusa_il: z.string().nullable(),
});
export type Session = z.infer<typeof SessionSchema>;

export const SessionsFileSchema = z.array(SessionSchema);

// ---------------------------------------------------------------------------
// reviews.json
// ---------------------------------------------------------------------------

export const RispostaSchema = z.object({
  q: z.string(),
  risposta: z.string(),
});

export const ValutazioneSchema = z.object({
  punteggio: z.number(),
  max: z.number(),
  per_domanda: z.array(z.number()),
  commento: z.string(),
  livello_suggerito: z.record(z.string(), z.number()),
  valutata_il: z.string(),
});

export const ReviewStatoSchema = z.enum(["in_attesa", "valutata"]);

export const ReviewSchema = z.object({
  id: z.string(),
  module_id: z.string(),
  session_id: z.string(),
  data: z.string(),
  risposte: z.array(RispostaSchema),
  nota_libera: z.string(),
  stato: ReviewStatoSchema,
  valutazione: ValutazioneSchema.nullable(),
});
export type Review = z.infer<typeof ReviewSchema>;

export const ReviewsFileSchema = z.array(ReviewSchema);

// ---------------------------------------------------------------------------
// inbox.json
// ---------------------------------------------------------------------------

export const InboxStatoSchema = z.enum(["da_leggere", "letto", "risolto", "da_qualificare", "archiviato"]);
export const VerdettoSchema = z.enum(["studia", "prova", "monitora", "verifica", "ignora"]);
export const FonteInboxSchema = z.enum(["instagram", "tiktok", "youtube", "github", "arxiv", "articolo"]);

export const EstrattoSchema = z.object({
  autore: z.string().nullable(),
  titolo: z.string().nullable(),
  didascalia: z.string().nullable(),
  data_pubblicazione: z.string().nullable(),
});

export const FontePrimariaInboxSchema = z.object({
  url: z.string(),
  tipo: z.string(),
});

export const InboxEntrySchema = z.object({
  id: z.string(),
  url: z.string(),
  aggiunto_il: z.string(),
  fonte: FonteInboxSchema,
  stato: InboxStatoSchema,
  didascalia_incollata: z.string().nullable(),
  estratto: EstrattoSchema.nullable(),
  tool_nominati: z.array(z.string()),
  fonte_primaria: FontePrimariaInboxSchema.nullable(),
  verdetto: VerdettoSchema.nullable(),
  motivo: z.string().nullable(),
  skill_toccate: z.array(z.string()),
  modulo_generato: z.string().nullable(),
  nota_utente: z.string(),
});
export type InboxEntry = z.infer<typeof InboxEntrySchema>;

export const InboxFileSchema = z.array(InboxEntrySchema);

// ---------------------------------------------------------------------------
// data/requests/*.json
// ---------------------------------------------------------------------------

export const RequestTipoSchema = z.enum([
  "valuta_review",
  "digerisci_inbox",
  "genera_moduli",
  "ripianifica",
  "qualifica_manuale",
]);
export const RequestStatoSchema = z.enum(["in_attesa", "evasa"]);

export const RequestSchema = z.object({
  id: z.string(),
  tipo: RequestTipoSchema,
  payload: z.record(z.string(), z.unknown()),
  creato_il: z.string(),
  stato: RequestStatoSchema,
  evasa_il: z.string().nullable().optional(),
});
export type RequestItem = z.infer<typeof RequestSchema>;
