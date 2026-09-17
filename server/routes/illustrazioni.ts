import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { DATA_DIR } from "../store.js";

export const illustrazioniRouter = Router();

const ID_VALIDO = /^[a-z0-9][a-z0-9-]*$/;

illustrazioniRouter.get("/illustrazioni/:id.svg", (req, res) => {
  const { id } = req.params;
  if (!ID_VALIDO.test(id)) {
    res.status(400).json({ error: `id illustrazione non valido: "${id}"` });
    return;
  }

  const filePath = path.join(DATA_DIR, "illustrations", `${id}.svg`);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: `illustrazione "${id}" non trovata` });
    return;
  }

  res.set("Content-Type", "image/svg+xml");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(fs.readFileSync(filePath, "utf-8"));
});
