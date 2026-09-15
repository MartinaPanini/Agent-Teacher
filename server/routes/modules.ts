import { Router } from "express";
import { z } from "zod";
import { aggiornaLivelloSkill } from "../levels.js";
import { readModules, writeModules, readSkills, writeSkills, readReviews, writeReviews, creaRichiesta } from "../store.js";

export const modulesRouter = Router();

modulesRouter.get("/modules/:id", (req, res) => {
  const modules = readModules();
  const modulo = modules.find((m) => m.id === req.params.id);
  if (!modulo) {
    res.status(404).json({ error: `modulo "${req.params.id}" non trovato` });
    return;
  }
  res.json(modulo);
});

const CompletaBodySchema = z.object({
  session_id: z.string().optional(),
  risposte: z.array(z.object({ q: z.string(), risposta: z.string() })).default([]),
  nota_libera: z.string().optional().default(""),
});

modulesRouter.patch("/modules/:id/completa", (req, res) => {
  const modules = readModules();
  const idx = modules.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: `modulo "${req.params.id}" non trovato` });
    return;
  }
  const modulo = modules[idx]!;

  // Vincolo assoluto: un modulo completato è immutabile.
  if (modulo.stato === "completato") {
    res.status(409).json({ error: `il modulo "${modulo.id}" è già completato ed è immutabile` });
    return;
  }

  const parsed = CompletaBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const oggi = new Date().toISOString().slice(0, 10);
  const moduloAggiornato = { ...modulo, stato: "completato" as const, completato_il: oggi };
  const moduliAggiornati = modules.map((m) => (m.id === moduloAggiornato.id ? moduloAggiornato : m));
  writeModules(moduliAggiornati);

  const reviews = readReviews();
  const reviewId = `rev-${String(reviews.length + 1).padStart(4, "0")}`;
  const nuovaReview = {
    id: reviewId,
    module_id: moduloAggiornato.id,
    session_id: parsed.data.session_id ?? "",
    data: oggi,
    risposte: parsed.data.risposte,
    nota_libera: parsed.data.nota_libera,
    stato: "in_attesa" as const,
    valutazione: null,
  };
  const reviewsAggiornate = [...reviews, nuovaReview];
  writeReviews(reviewsAggiornate);

  const skillId = Object.keys(moduloAggiornato.peso_skill)[0];
  const skills = readSkills();
  let skillAggiornata = null;
  if (skillId) {
    const skill = skills.find((s) => s.id === skillId);
    if (skill) {
      const aggiornata = aggiornaLivelloSkill(skill, moduliAggiornati, reviewsAggiornate);
      const moduliCompletatiSkill = moduliAggiornati.filter(
        (m) => m.stato === "completato" && skillId in m.peso_skill,
      ).length;
      skillAggiornata = { ...aggiornata, moduli_completati: moduliCompletatiSkill };
      writeSkills(skills.map((s) => (s.id === skillId ? skillAggiornata! : s)));
    }
  }

  creaRichiesta("valuta_review", { review_id: reviewId });

  res.json({ modulo: moduloAggiornato, review: nuovaReview, skill: skillAggiornata });
});

const ScopertaFeedbackSchema = z.object({
  feedback: z.enum(["interessante", "non_fa_per_me"]),
});

modulesRouter.patch("/modules/:id/scoperta-feedback", (req, res) => {
  const modules = readModules();
  const modulo = modules.find((m) => m.id === req.params.id);
  if (!modulo) {
    res.status(404).json({ error: `modulo "${req.params.id}" non trovato` });
    return;
  }
  const parsed = ScopertaFeedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const skillId = Object.keys(modulo.peso_skill)[0];
  if (!skillId) {
    res.status(200).json({ ok: true });
    return;
  }
  const skills = readSkills();
  const target = skills.find((s) => s.id === skillId);
  if (!target) {
    res.status(200).json({ ok: true });
    return;
  }

  if (parsed.data.feedback === "non_fa_per_me") {
    // §4.4.5: abbassa il peso dell'intera area, non esclude mai — pavimento a 0.1.
    const skillsAggiornate = skills.map((s) =>
      s.area === target.area ? { ...s, peso_scoperta: Math.max(0.1, Math.round(s.peso_scoperta * 0.5 * 100) / 100) } : s,
    );
    writeSkills(skillsAggiornate);
    res.json({ ok: true, skills: skillsAggiornate });
    return;
  }

  res.json({ ok: true });
});
