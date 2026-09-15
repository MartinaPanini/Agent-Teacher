import { Router } from "express";
import { z } from "zod";
import { DOMANDE_CALIBRAZIONE } from "../../shared/onboarding-questions.js";
import { readProfile, writeProfile, readSkills, writeSkills } from "../store.js";

export const onboardingRouter = Router();

const BodySchema = z.object({
  risposte: z.array(
    z.object({
      domanda_id: z.string(),
      opzione_id: z.string(),
    }),
  ),
});

onboardingRouter.post("/onboarding", (req, res) => {
  const profile = readProfile();
  if (profile.calibrazione.fatta_il !== null) {
    res.status(409).json({ error: "la calibrazione è già stata fatta il " + profile.calibrazione.fatta_il });
    return;
  }

  const parsed = BodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const domandeById = new Map(DOMANDE_CALIBRAZIONE.map((d) => [d.id, d]));
  const livelliPerSkill = new Map<string, number>();

  for (const r of parsed.data.risposte) {
    const domanda = domandeById.get(r.domanda_id);
    if (!domanda) {
      res.status(400).json({ error: `domanda sconosciuta: ${r.domanda_id}` });
      return;
    }
    const opzione = domanda.opzioni.find((o) => o.id === r.opzione_id);
    if (!opzione) {
      res.status(400).json({ error: `opzione sconosciuta "${r.opzione_id}" per la domanda ${r.domanda_id}` });
      return;
    }
    livelliPerSkill.set(domanda.skill_id, opzione.livello);
  }

  const oggi = new Date().toISOString().slice(0, 10);
  const skills = readSkills();
  const skillsAggiornate = skills.map((s) => {
    const livello = livelliPerSkill.get(s.id);
    if (livello === undefined) return s;
    return { ...s, livello, livello_fonte: "calibrazione" as const, livello_aggiornato_il: oggi };
  });

  writeSkills(skillsAggiornate);
  writeProfile({
    ...profile,
    calibrazione: {
      fatta_il: oggi,
      risposte: parsed.data.risposte.map((r) => ({ domanda_id: r.domanda_id, risposta_id: r.opzione_id })),
    },
  });

  res.json({ ok: true, skills: skillsAggiornate });
});
