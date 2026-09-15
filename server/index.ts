import { createApp } from "./app.js";
import { readProfile, readSkills, readCourses, readModules, readSessions, readReviews, readInbox } from "./store.js";

function validaDatiAllAvvio(): void {
  const letture: Array<[string, () => unknown]> = [
    ["profile.json", readProfile],
    ["skills.json", readSkills],
    ["courses.json", readCourses],
    ["modules.json", readModules],
    ["sessions.json", readSessions],
    ["reviews.json", readReviews],
    ["inbox.json", readInbox],
  ];
  for (const [nome, leggi] of letture) {
    try {
      leggi();
    } catch (err) {
      console.error(`Errore in data/${nome}: ${(err as Error).message}`);
      console.error(`Lancia "npm run seed" se data/ non è mai stata generata.`);
      process.exit(1);
    }
  }
}

validaDatiAllAvvio();

const app = createApp();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(PORT, () => {
  console.log(`Agent Teacher server on http://localhost:${PORT}`);
});
