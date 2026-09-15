import { Router } from "express";
import { readProfile } from "../store.js";

export const profileRouter = Router();

profileRouter.get("/profile", (_req, res) => {
  res.json(readProfile());
});
