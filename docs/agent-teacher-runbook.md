# Agent Teacher — runbook di esecuzione

Progetto in `~/Agent-Teacher`. Aggiornato al 15/09/2026.

**Stato: sito costruito e calibrato. Restano tre fasi, circa un'ora.**

| Fase | Stato |
|---|---|
| A — Preparare la cartella | fatta |
| B — Costruire il sito | fatta, 8 step, tutto commitato |
| C — Primo avvio e calibrazione | fatta |
| D — Bootstrap routine Cowork | **prossima**, 30-45 min |
| E — Prima sessione | da fare, 25 min |
| F — Messa a regime | da fare, 10 min |

---

## Fase D — Bootstrap della routine Cowork · 30-45 minuti

**La routine Cowork non è uno script del repo.** Nel repo non esiste niente che evada la richiesta `genera_moduli`, e non è un buco: è la separazione dei ruoli. Claude Code costruisce i contenitori, Cowork li riempie. Se i moduli li genera Claude Code a mano, funziona una volta sola e fra due settimane il buffer è vuoto.

- [ ] **D1.** Nel Claude desktop app premi **"Add folder"** e aggiungi `~/Agent-Teacher`

- [ ] **D2.** Torna nella conversazione Cowork e scrivi "cartella collegata". Da lì parte il bootstrap: legge la richiesta `genera_moduli` già in coda, genera 7 moduli con sintesi, fonte primaria verificata e 3 domande con rubrica, sposta la richiesta in `data/requests/done/`

- [ ] **D3.** Creazione dell'attività pianificata settimanale, lunedì mattina, con il contenuto di `agent-teacher-routine-cowork.md` sotto la riga orizzontale

- [ ] **D4.** Verifica a campione **un** modulo generato: la fonte primaria esiste, è ufficiale, e la sintesi non la contraddice

- [ ] **D5.** Commit:
  ```bash
  cd ~/Agent-Teacher && git add -A && git commit -m "Primi 7 moduli"
  ```

**Fatto quando:** `data/modules.json` ha 7 moduli in stato `pronto` e l'attività pianificata esiste.

---

## Fase E — Prima sessione · 25 minuti

- [ ] **E1.** `cd ~/Agent-Teacher && npm run dev`, apri la Daily: modulo principale, modulo di scoperta, motivazione della scelta
- [ ] **E2.** Fai la sessione per davvero, non in diagonale per collaudare: il sistema impara da come rispondi
- [ ] **E3.** Alle 3 domande **rispondi male se non sai**, non copiare dalla sintesi: serve a tarare il livello
- [ ] **E4.** Controlla che la review sia in `data/reviews/` con stato `in_attesa` e la richiesta in `data/requests/`
- [ ] **E5.** Curriculum: il modulo completato deve essere ancora lì, marcato, non sparito

**Fatto quando:** il livello di una skill è salito.

---

## Fase F — Messa a regime · 10 minuti

- [ ] **F1.** Seconda attività pianificata: parte quando i moduli `pronto` scendono sotto 3 o quando `inbox.json` ha 5+ voci `da_leggere`
- [ ] **F2.** Importa il seed: `cd ~/Agent-Teacher && npm run import-inbox`. Aggiunge 54 voci già classificate e ricalcola `interesse_osservato`
- [ ] **F3.** Salva il sito nei preferiti del browser. La frizione di aprirlo è il nemico vero, non il contenuto
- [ ] **F4.** Prova la cattura link: incolla un URL e verifica che `inbox.json` cresca
- [ ] **F5.** `cd ~/Agent-Teacher && git add -A && git commit -m "Agent Teacher operativo" && git push`

**Fatto quando:** apri il sito, c'è qualcosa da studiare, e non l'hai deciso tu.

---

## Dopo 3 settimane

Torna in Cowork con i dati d'uso e si definisce la v2 su quelli: quante sessioni fatte, quali moduli saltati, quali aree rimaste a zero. L'ordine delle sezioni v2 si decide lì, non prima.

---

## Se qualcosa si rompe

| Sintomo | Causa probabile | Fix |
|---|---|---|
| Daily vuota dopo la routine | Nessun modulo è passato a `pronto` | Leggi il riassunto della routine: probabile che il gate dei prerequisiti abbia escluso tutto. Controlla i livelli in `data/skills.json` |
| La routine genera moduli quasi uguali | Non ha consolidato | §1.10 della specifica: il passo 3-bis viene **prima** della generazione |
| Il livello di una skill sale troppo in fretta | `peso_skill` sbagliato | La somma dei pesi va calcolata **per skill**, non per corso: `corso-mcp` ha 9 moduli ma due skill, 4 + 5 |
| Un modulo completato è cambiato | Il server accetta modifiche a moduli completati | Bug: deve rifiutarle con 409, c'è un test apposta |
| La priorità propone cose troppo avanzate | Il gate non funziona | `server/priority.ts`: i moduli con prerequisiti sotto livello 2 vanno esclusi, non penalizzati |
| Zod fallisce all'avvio nominando un campo | La routine Cowork ha scritto un JSON fuori schema | È il comportamento voluto. Correggi il campo che l'errore nomina in `data/` |
| Il server dev non risponde | Processo `tsx watch` rimasto appeso | `pkill -f "tsx watch server/index.ts"`, poi `npm run dev`. Log in `/tmp/agent-teacher-dev.log` |

---

## Archivio — fasi completate

**Fase A.** Repo clonata in `~/Agent-Teacher`, fuori da iCloud. `.gitignore` che esclude `node_modules` ma versiona `data/`. Licenza MIT.

**Fase B.** Prompt incollato in Claude Code. Piano proposto, quattro correzioni richieste (track sempre `principale`, corso `integrazioni-personali`, `tool-calling` a 4 moduli, `POST /api/session/apri`) più due precisazioni (pesi per skill non per corso, 10 aree non 7). Piano corretto approvato ed eseguito in auto mode, 8 step, tutto commitato. Stack: TypeScript, Zod, Express su 3001, React/Vite su 5173.

**Fase C.** Onboarding con 8 domande compilato. Knowledge Map popolata con livelli calcolati dalle risposte (livello 2 su LLM e tool calling, aree non toccate a "non iniziato"). Curriculum mostra 11 corsi con moduli "in preparazione". Daily mostra correttamente lo stato vuoto con la spiegazione e la riga "cosa ignorare oggi". Nessun bug visivo.

**Decisione presa in fase C.** Claude Code si è offerto di generare lui il contenuto dei 7 moduli. Rifiutato: la generazione appartiene alla routine Cowork perché deve ripetersi ogni settimana senza aprire un terminale. La richiesta `genera_moduli` resta in coda in `data/requests/`.
