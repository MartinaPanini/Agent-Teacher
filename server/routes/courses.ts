import { Router } from "express";
import { readCourses, readModules } from "../store.js";

export const coursesRouter = Router();

coursesRouter.get("/courses", (_req, res) => {
  const courses = readCourses();
  const modules = readModules();
  const modulesById = new Map(modules.map((m) => [m.id, m]));

  const espansi = courses.map((c) => ({
    ...c,
    moduli_espansi: c.moduli.map((id) => modulesById.get(id)).filter((m): m is NonNullable<typeof m> => m !== undefined),
  }));

  res.json(espansi);
});
