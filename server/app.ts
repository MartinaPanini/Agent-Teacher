import express from "express";
import { profileRouter } from "./routes/profile.js";
import { onboardingRouter } from "./routes/onboarding.js";
import { skillsRouter } from "./routes/skills.js";
import { coursesRouter } from "./routes/courses.js";
import { modulesRouter } from "./routes/modules.js";
import { sessionsRouter } from "./routes/sessions.js";
import { inboxRouter } from "./routes/inbox.js";
import { illustrazioniRouter } from "./routes/illustrazioni.js";

export function createApp(): express.Express {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api", profileRouter);
  app.use("/api", onboardingRouter);
  app.use("/api", skillsRouter);
  app.use("/api", coursesRouter);
  app.use("/api", modulesRouter);
  app.use("/api", sessionsRouter);
  app.use("/api", inboxRouter);
  app.use("/api", illustrazioniRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "errore interno" });
  });

  return app;
}
