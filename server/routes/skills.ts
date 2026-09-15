import { Router } from "express";
import { readSkills, readModules } from "../store.js";

export const skillsRouter = Router();

skillsRouter.get("/skills", (_req, res) => {
  const skills = readSkills();
  const modules = readModules();
  const skillsById = new Map(skills.map((s) => [s.id, s]));

  const arricchite = skills.map((s) => {
    const prossimo = modules
      .filter((m) => m.stato === "pronto" && s.id in m.peso_skill)
      .sort((a, b) => a.id.localeCompare(b.id))[0];
    const prerequisiti_mancanti = s.prerequisiti.filter((pid) => (skillsById.get(pid)?.livello ?? 0) < 2);
    return {
      ...s,
      prossimo_modulo: prossimo ? { id: prossimo.id, titolo: prossimo.titolo } : null,
      prerequisiti_mancanti,
    };
  });

  res.json(arricchite);
});
