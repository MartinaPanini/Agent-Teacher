# Prompt per Claude Code — Agent Teacher MVP

Come usarlo: crea una cartella vuota `agent-teacher/`, copiaci dentro `agent-teacher-specifica-v1.md` e `agent-teacher-inbox-seed.json`, apri Claude Code in quella cartella e incolla tutto ciò che sta sotto la riga.

---

Costruisci **Agent Teacher**, una web app personale locale che decide cosa devo studiare oggi sullo stack AI agentico e mantiene quella decisione aggiornata mentre imparo.

Nella cartella trovi `agent-teacher-specifica-v1.md`: **leggila per intera prima di scrivere una riga di codice.** È la fonte di verità. Quello che segue è il piano operativo, non un riassunto sostitutivo.

## Chi sono e perché conta

Ho una magistrale in informatica, scrivo codice, non serve spiegarmi la programmazione. Sullo stack agentico invece parto da zero: MCP, Claude Skills, Obsidian con agenti, orchestrazione, evals. Studio 15-30 minuti per 4-5 giorni a settimana. Preferisco contenuti ridondanti al rischio di perdermi qualcosa.

## Vincoli inderogabili

1. **Il sito non chiama mai un modello AI.** Nessuna API key nel progetto, nessuna chiamata di rete a un LLM. Tutto il ragionamento arriva in modo asincrono da routine Claude Cowork che scrivono dentro `data/`. Se ti viene la tentazione di aggiungere una chiamata all'API Anthropic o OpenAI, è il segnale che hai frainteso l'architettura.
2. **Modello a sessioni, non a giorni.** Non esiste "il daily di oggi". Esiste *la prossima sessione*, numerata, calcolata all'apertura. Nessun arretrato, nessuna coda da smaltire, nessuno streak, nessun file `daily/AAAA-MM-GG.json`. Se apro dopo due settimane di pausa devo trovare la sessione successiva, non dodici lezioni arretrate.
3. **Dati in file JSON dentro `data/`, versionati con git.** Niente database, niente cloud, niente ORM.
4. **Nessuna componente "recente" nella logica di priorità.** Il prodotto esiste proprio per non fare questo.
5. **Una sessione propone un solo modulo principale.** Mai una lista di cose da fare.

## Stack

```
agent-teacher/
  data/                    unica fonte di verità, JSON, versionata
    profile.json
    skills.json
    courses.json
    modules.json
    sessions.json
    reviews.json
    inbox.json
    requests/              coda per le routine Cowork
      done/
  server/                  Express minimale
    index.js               legge e scrive data/, serve le API
    priority.js            motore di priorità, codice puro
    levels.js              calcolo dei livelli
    schema.js              validazione dei JSON
  web/                     React + Vite
    src/pages/Daily.jsx
    src/pages/Curriculum.jsx
    src/pages/KnowledgeMap.jsx
    src/pages/Onboarding.jsx
    src/components/CatturaLink.jsx
  scripts/
    seed.js                genera i dati iniziali
    import-inbox.js        importa agent-teacher-inbox-seed.json
  test/
  package.json             un solo `npm run dev` avvia server + web
```

Node ed Express sul server, React con Vite sul front. Nessuna libreria UI pesante: CSS scritto a mano o Tailwind, decidi tu. Niente TypeScript se rallenta: preferisco JS semplice e test veri.

## Modello dati

Gli schemi completi sono nella specifica, §2. Rispettali alla lettera, compresi i nomi dei campi in italiano. Scrivi `server/schema.js` che valida ogni file all'avvio e fallisce con un messaggio chiaro se un campo manca.

Due punti che si sbagliano facilmente:

- `modules.peso_skill` è un oggetto `{skill_id: peso}`. La somma dei pesi di tutti i moduli che toccano una skill deve dare circa 1.0. Scrivi un test che lo verifica sul seed.
- Le richieste in `data/requests/` non si cancellano mai: si spostano in `data/requests/done/`. Servono a capire cosa ha fatto la routine e quando.
- `modules.tipo` ammette `teoria`, `pratica`, `ripasso`, `aggiornamento`. `modules.voci_inbox` è un array di `inbox.id`: traccia da quali link è nato il modulo. Falli validare entrambi.

Un modulo con `stato: "completato"` è **immutabile**: nessuna API del server deve permettere di modificarlo, a parte i campi di sistema. Se la routine ci scrivesse dentro materiale nuovo, quel materiale sarebbe perso, perché non torno a rileggere quello che ho già fatto. Scrivi un test che verifica che una PATCH su un modulo completato viene rifiutata.

## Motore di priorità — la parte che conta

Implementalo in `server/priority.js` come funzioni pure, senza I/O, e testalo davvero. È il cuore del prodotto.

**Passo 1, il gate.** Prima di qualunque punteggio, scarta i moduli i cui prerequisiti sono sotto livello 2, e quelli le cui skill sono già a livello 4. È il gate, non un peso nella formula, a rendere automatico "prima le basi".

**Passo 2, il punteggio** sui moduli sopravvissuti con stato `pronto`:

```
P = 0.30 · centralità
  + 0.25 · lacuna
  + 0.20 · utilità
  + 0.15 · interesse
  + 0.10 · (1 − costo)
```

- `centralità` = quante altre skill hanno questa fra i prerequisiti, diretti e transitivi, normalizzato 0-1 sul massimo del grafo
- `lacuna` = (4 − livello_attuale) / 4
- `utilità` = `skills[].utilita_dichiarata`
- `interesse` = `skills[].interesse_osservato`
- `costo` = min(1, durata_min / profile.durata_sessione_min)

Il modulo con P più alto diventa il principale.

**Passo 3, composizione della sessione:**

```
se (oggi − profile.ultima_sessione_il) > profile.soglia_ripasso_giorni:
    aggiungi in testa un item ripasso da 10 min sugli ultimi 2 moduli completati
se inbox ha ≥3 elementi in stato da_qualificare:
    aggiungi un item qualifica con massimo 3 link
aggiungi il modulo principale        (12-18 min)
aggiungi un modulo scoperta          (5 min)
```

**Passo 4, scelta del modulo di scoperta**, nell'ordine:

1. Candidati: skill a livello 0 fuori dal percorso principale, con prerequisiti soddisfatti
2. Preferisci aree adiacenti a quelle su cui sto lavorando
3. **Una sessione su cinque ignora la regola 2** e pesca qualcosa di completamente scollegato. Va forzato, altrimenti non capita mai. Usa `sessions.numero % 5 === 0`, così è deterministico e testabile
4. Mai la stessa area in due sessioni consecutive

**Test obbligatori su `priority.js`:**

- un modulo con prerequisiti a livello 1 non compare mai fra i candidati
- a mappa tutta a zero, il modulo scelto appartiene a una skill senza prerequisiti
- alzando il livello di una skill, la sua lacuna scende e un'altra skill la supera
- alla sessione 5, 10, 15 il modulo di scoperta è scollegato dalle aree attive
- la stessa area non esce come scoperta in due sessioni consecutive
- nessuna funzione legge una data di pubblicazione: verificalo cercando nel file

## Le quattro pagine

### Daily (la home)

Deve rispondere a tre domande in tre secondi: **cosa faccio ora, perché proprio questo, cosa posso ignorare oggi.**

- Il modulo principale in evidenza, con titolo, obiettivo, durata e una riga di motivazione generata dal motore ("è il prerequisito di 4 altre aree e sei a livello 0")
- Sotto, il modulo di scoperta, più piccolo
- Se ci sono link da qualificare, un blocco compatto con massimo 3, ognuno con un campo da una riga
- **Un blocco "cosa ignorare oggi"**: se ci sono voci inbox con verdetto `monitora` o skill troppo avanzate per il mio livello, dillo esplicitamente. Non è riempitivo: è metà del valore del prodotto
- Nessuna lista di cose in sospeso, nessun contatore di arretrati, nessuno streak

### Lettura di un modulo

- Obiettivo in cima
- **I prerequisiti scritti per esteso**, non come link a un altro modulo. La ridondanza è voluta
- La sintesi
- La fonte primaria, con la data in cui è stata verificata
- Bottone "fatto" → compaiono le 3 domande, campi di testo libero, si possono saltare
- Alla conferma: la review va in `data/reviews/` con stato `in_attesa`, il modulo passa a `completato`, il livello della skill sale del `peso_skill`, e viene creata una richiesta `valuta_review` in `data/requests/`
- Se una review è già stata valutata, mostra accanto alle mie risposte il punteggio e il commento

### Curriculum

- I corsi con il loro stato, i moduli in ordine
- **I moduli completati restano visibili**, marcati, mai nascosti né rimossi
- I moduli aggiunti dopo che un corso era "completato" hanno un'etichetta `nuovo`
- Un corso `completato` non è chiuso: può ricevere altri moduli

### Knowledge Map

Griglia di card raggruppate per area. **Non un grafo**: ho scelto la griglia, il grafo è una cosa da v2.

- Ogni card: nome dell'area, livello 0-4 a colore, moduli fatti su totali, prossimo step disponibile, prerequisiti mancanti
- **Tutte le aree esistono dal primo giorno**, comprese quelle a livello 0 che non toccherò per mesi. Vedere che su evals e sicurezza sono a zero è il punto della pagina, non un dettaglio
- Le aree bloccate da prerequisiti si vedono, con scritto cosa le sblocca

### Onboarding

Compare solo se `profile.calibrazione.fatta_il` è nullo.

- **6-8 domande**, non di più. Non testare la programmazione
- Solo lo stack agentico: tool calling, MCP, agenti, contesto, orchestrazione, evals
- Scelta multipla, con un'opzione "non lo so" che non deve costare nulla scegliere
- Le risposte popolano i livelli con `livello_fonte: "calibrazione"`

## Cattura link

Un componente presente in ogni pagina: un campo URL più un campo testo opzionale per la didascalia.

Al salvataggio scrive in `inbox.json` con stato `da_leggere`, riconoscendo la fonte dall'URL (`instagram`, `tiktok`, `youtube`, `github`, `arxiv`, `articolo`). **Non analizza niente, non fa nessuna richiesta di rete.** Se la coda supera 5 elementi, crea una richiesta `digerisci_inbox`.

## Seed

`scripts/seed.js` genera:

1. `profile.json` con i valori della specifica §2
2. `skills.json` con tutte le 14 aree elencate in §7, livello 0, prerequisiti corretti
3. `courses.json` con i 10 corsi di §7, ognuno con obiettivo e prerequisiti
4. **Moduli segnaposto**: per ogni corso, il numero di moduli previsto, con titolo e obiettivo sensati ma `sintesi_md` vuota e `stato: "bozza"`
5. Una richiesta `genera_moduli` già pronta in `data/requests/`, così la prima routine Cowork sa cosa fare

Attenzione: **tu non scrivi i contenuti didattici.** Le sintesi, le fonti primarie e le domande le genera la routine Cowork. Il tuo compito è che lo scheletro esista e che il sito funzioni con moduli in bozza.

**Conseguenza da gestire esplicitamente: al primo avvio non esiste nessun modulo proponibile.** Solo i moduli in stato `pronto` entrano nei candidati del motore; i `bozza` no. Quindi la Daily deve avere uno stato vuoto curato, che spiega cosa manca e cosa fare — "nessun modulo pronto: lancia la routine Cowork per generarne 7" — invece di una pagina bianca o di un errore. Non è un caso limite raro: succede al primo avvio e ogni volta che la routine resta ferma oltre due settimane.

`scripts/import-inbox.js` importa `agent-teacher-inbox-seed.json` (54 voci già classificate) in `inbox.json`, e calcola `interesse_osservato` per ogni skill contando le voci che la toccano.

## Cosa NON costruire

Serve dirlo, perché sono tutte cose che sembrano utili e non lo sono ora:

- Nessuna chiamata a un modello AI, da nessuna parte
- Nessun grafo dei prerequisiti (v2)
- Nessun Practical Lab, My Projects, Ask My Curriculum, AI Radar
- Nessuna analisi automatica dei link
- Nessun download di video
- Nessuna autenticazione, nessun multiutente, nessun deploy
- Nessuno streak, nessuna notifica, nessun badge di arretrato

## Criteri di accettazione

Prima di dirmi che hai finito, verifica che tutto questo sia vero:

1. `npm run dev` avvia tutto con un comando solo e il sito si apre
2. Alla prima apertura compare il quiz di calibrazione; completandolo, i livelli in `skills.json` cambiano
3. La Daily mostra un modulo principale, uno di scoperta, e la motivazione della scelta
4. Completando un modulo: la review finisce in `data/reviews/` con stato `in_attesa`, la richiesta compare in `data/requests/`, il livello della skill sale
5. La Knowledge Map mostra tutte e 14 le aree, comprese quelle a zero
6. Il modulo completato è ancora visibile nel Curriculum
7. Incollando un link, `inbox.json` cresce e non parte nessuna richiesta di rete
8. `npm test` passa, compresi i test sul gate dei prerequisiti e sulla scoperta forzata alla quinta sessione
9. Cancellando `data/` e rilanciando `seed.js`, il sito riparte pulito
10. Cercando nel codice non esiste alcun riferimento a una data di pubblicazione dentro la logica di priorità
11. Con `data/` appena generato e zero moduli `pronto`, la Daily mostra lo stato vuoto con le istruzioni, non un errore né una pagina bianca

## Ordine di lavoro

Procedi così, fermandoti a mostrarmi il risultato a ogni passo:

1. Scaffold, `package.json`, `npm run dev` che avvia server e web insieme
2. Schemi JSON e validazione, più `seed.js` che genera dati coerenti
3. `priority.js` e `levels.js` con i loro test — **prima del front-end**, perché è la parte dove gli errori costano di più
4. API del server sopra i JSON
5. Le quattro pagine, nell'ordine: Onboarding, Daily, Knowledge Map, Curriculum
6. Cattura link e coda richieste
7. `import-inbox.js` e ricalcolo di `interesse_osservato`
8. Passata finale sui criteri di accettazione, uno per uno

Se una mia richiesta ti sembra in contrasto con la specifica, fermati e dimmelo invece di scegliere da solo.
