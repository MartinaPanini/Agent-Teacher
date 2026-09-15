# Agent Teacher — Specifica funzionale v1

Versione 1.0 — 15 settembre 2026
Autrice del progetto: Martina · Progettazione: sessione Cowork del 15/09/2026

---

## 0. Cos'è e cosa non è

Agent Teacher è una web app personale, locale, che decide cosa Martina deve studiare oggi sullo stack AI agentico, e mantiene quella decisione aggiornata mentre lei impara e mentre il campo cambia.

**Non è** un catalogo di corsi, un feed di novità, né una to-do list. La differenza pratica: un catalogo ti mostra tutto e ti lascia scegliere; Agent Teacher sceglie e ti dice perché.

### I tre vincoli che hanno determinato ogni decisione

1. **15-30 minuti, 4-5 giorni a settimana.** Non un impegno teorico: è il budget reale. Qualsiasi cosa che richieda più attenzione di così è progettata male.
2. **Punto di partenza reale: zero sullo stack agentico**, con una base solida di informatica. Le "basi" non sono la programmazione — sono cos'è un tool call, cos'è MCP, come funziona un loop agentico.
3. **Nessuna API key a pagamento.** Il sito non chiama mai un modello. Tutto il ragionamento avviene in modo asincrono tramite routine Claude Cowork.

### Il dato che giustifica il curriculum

Analisi dei 54 link che Martina ha salvato negli ultimi tre anni (documento `inbox-seed-analisi.md`):

- Claude Code nominato 16 volte, Claude Skills 5, NotebookLM 3.
- **MCP come protocollo, RAG, evals, sicurezza, LangGraph, LlamaIndex, CrewAI, smolagents: zero occorrenze.**

Metà della Knowledge Map che Martina vuole coprire non le viene proposta da nessuna delle sue fonti. Questo è il vuoto che Agent Teacher esiste per colmare, ed è il motivo per cui il curriculum iniziale è scritto a priori invece che derivato dai link salvati.

---

## 1. Specifica funzionale

### 1.1 Perimetro della v1

**Dentro:**

| Sezione | Cosa fa |
|---|---|
| Daily Dashboard | Calcola e mostra la prossima sessione di studio |
| Live Curriculum | Corsi e moduli, con lo storico che non sparisce |
| Knowledge Map | Griglia a livelli su tutte le aree, comprese quelle a zero |
| Cattura link | Un campo che accoda URL, senza analizzarli |
| Onboarding | Quiz di calibrazione, una tantum |

**Fuori, rimandato:** Inbox Analyzer completo, Practical Lab, My Projects, Ask My Curriculum, AI Radar, Profile/History come pagina a sé (in v1 lo storico vive dentro Curriculum e Knowledge Map).

### 1.2 Il modello a sessioni

Questa è la scelta strutturale più importante e va rispettata ovunque.

**Agent Teacher non ragiona per giorni di calendario, ragiona per sessioni.**

- Non esiste un "daily del 15 settembre". Esiste *la prossima sessione*, calcolata quando apri il sito.
- Se apri martedì, giovedì e domenica, ricevi la sessione 1, 2 e 3. Se salti due settimane, la sessione successiva è comunque la 4.
- **Non esiste arretrato.** Niente coda da smaltire, niente badge rossi, niente streak.
- Non esiste un file `daily/AAAA-MM-GG.json`. Le sessioni sono numerate, non datate: la data è un attributo, non la chiave.

Conseguenza sul ripasso: si attiva sul **tempo trascorso dall'ultima sessione**, non sui giorni saltati. Oltre 10 giorni, la sessione si apre con 10 minuti di richiamo sugli ultimi due moduli completati.

### 1.3 Composizione di una sessione

Durata obiettivo: 20 minuti. Struttura:

```
[ripasso 10 min]        solo se sono passati >10 giorni dall'ultima sessione
[qualifica 1 min]       solo se ci sono ≥3 link in stato da_qualificare (max 3 link)
 modulo principale      12-18 min    ← il percorso che avanza
 modulo scoperta        5 min        ← ~20% del tempo, qualcosa fuori dai tuoi obiettivi
```

**Il modulo principale è uno solo.** Mai una lista. Con 20 minuti a disposizione, proporre tre cose significa non farne nessuna.

### 1.4 Anatomia di un modulo

Un modulo è l'unità di studio. Durata 12-18 minuti, mai 30.

| Campo | Contenuto |
|---|---|
| Obiettivo | Una frase: "Alla fine sai distinguere un tool call da una chiamata di funzione normale" |
| Prerequisiti | Elencati **per esteso nel testo**, non solo come riferimenti |
| Sintesi | 300-600 parole scritte da Claude |
| Fonte primaria | Link alla documentazione ufficiale, con data di verifica |
| 3 domande | Con rubrica di valutazione generata insieme al modulo |

**Ridondanza voluta.** Martina ha chiesto esplicitamente di preferire il ridondante al rischio di perdersi qualcosa. Quindi: i prerequisiti si ripetono in ogni modulo che li richiede, invece di rimandare a un modulo precedente.

**Regola inderogabile sulle fonti.** Ogni modulo ha una fonte primaria verificata. Un modulo non viene mai creato a partire dalla sola didascalia di un contenuto social: il social è un puntatore, la fonte primaria è il contenuto.

### 1.5 Completamento e verifica

1. Martina legge il modulo e clicca "fatto".
2. Il sito mostra le 3 domande. Lei risponde a testo libero, oppure salta.
3. Le risposte vanno in coda in `data/reviews/`, stato `in_attesa`.
4. La routine Cowork successiva le valuta e aggiorna il livello delle skill collegate.
5. Il modulo passa a `completato` e **resta visibile nel corso**. Non sparisce mai.

Il sito non valuta nulla da solo: mostra le risposte date e, quando la valutazione arriva, la affianca.

### 1.6 Corsi vivi

Un corso non è un contenitore chiuso. Può ricevere nuovi moduli quando esce qualcosa di rilevante, anche se lo hai già "finito". I moduli completati restano al loro posto, i nuovi si aggiungono in coda con un'etichetta `nuovo`.

Un corso ha stato `attivo`, `in pausa` o `completato`, ma `completato` significa solo "tutti i moduli attuali sono fatti", non "chiuso per sempre".

### 1.7 Knowledge Map

Griglia, non grafo. Le aree sono raggruppate in card; ogni area mostra livello, lacuna, prossimo step e prerequisiti.

**Nasce completa.** Tutte le aree esistono dal primo giorno, comprese quelle che Martina toccherà fra sei mesi, in stato `non_iniziato`. Vedere la mappa intera — e vedere nero su bianco che su evals e sicurezza è a zero — è metà del valore della pagina.

Scala dei livelli, 0-4:

| Livello | Significato |
|---|---|
| 0 | Non iniziato |
| 1 | So di cosa si tratta |
| 2 | So seguire qualcuno che lo fa |
| 3 | So farlo da sola |
| 4 | So adattarlo e spiegarlo |

Il livello ha sempre una provenienza tracciata: `calibrazione`, `moduli` o `dichiarato`.

### 1.8 Cattura link

Un campo in ogni pagina. Accetta qualsiasi URL, più un campo testo opzionale per incollare la didascalia se ce l'hai sottomano.

Il sito **non analizza niente**. Scrive in coda e basta. L'analisi è lavoro della routine.

### 1.9 Adapter per tipo di fonte

Verificato provando ogni percorso il 15/09/2026.

| Tipo di link | Metodo | Costo | Contenuto | In v1? |
|---|---|---|---|---|
| Paper, arXiv | fetch diretto | zero | pieno | sì |
| Repo GitHub | fetch diretto | zero | pieno | sì |
| Articolo, documentazione | fetch diretto | zero | pieno | sì |
| YouTube | Gemini API con URL diretto | zero (8h/giorno free tier) | pieno, audio + immagini | interfaccia sì, uso v2 |
| Instagram, TikTok | browser, meta tag Open Graph | zero | solo didascalia | sì |
| Instagram, TikTok (video) | download + upload a Gemini | zero in denaro, ToS grigio | pieno | no, solo punto di innesto |

**Limiti accertati**, da non dimenticare in fase di costruzione:

- Il fetch anonimo è bloccato su Instagram (robots.txt) e YouTube (429): per questi serve il browser.
- **Le trascrizioni YouTube non sono estraibili da codice.** Il fetch di `captionTracks[].baseUrl` torna 200 con corpo vuoto, il pannello trascrizione resta nascosto. Tre approcci provati, tutti falliti.
- Su Instagram si legge la didascalia, non il video: circa il 9% dei post sono lead magnet senza contenuto testuale utile.

**Regola di escalation**, dal più economico al più costoso:

1. Prova il metodo più economico per quel tipo di link.
2. Se è un social, leggi la didascalia e **risolvi il tool nominato alla sua fonte primaria** (repo, documentazione, paper). Sui dati reali questo copre 36 casi su 39.
3. Solo se entrambi falliscono e la voce sembra valere qualcosa, segnalalo e **chiedi a Martina** se scaricare e analizzare il video.
4. Il download non parte mai in automatico. È una scelta esplicita, elemento per elemento.
5. Il video scaricato è temporaneo: analizzato, trascritto nella nota, cancellato.

### 1.10 Consolidamento: da N link a un modulo

Il caso normale non è un link su un tema nuovo. È **sette contenuti sullo stesso tema**, perché i creator inseguono le stesse novità nella stessa settimana. Senza una regola, sette reel su Claude Skills diventano sette moduli quasi identici e il curriculum si gonfia di duplicati.

**Un cluster produce al massimo un modulo. Mai uno per voce.**

Il consolidamento avviene nella routine, tra la digestione dell'inbox e la generazione dei moduli:

1. **Raggruppa** le voci con verdetto `studia` per `skill_toccate` e `tool_nominati` sovrapposti. Le voci `prova`, `monitora`, `verifica` e `ignora` non generano mai moduli.
2. **Deduplica** per URL identico e per fonte primaria identica: cinque post che puntano alla stessa repo sono un solo contenuto.
3. **Scegli la destinazione**, in quest'ordine rigido:

| Situazione | Cosa fare |
|---|---|
| Esiste un modulo `bozza` o `pronto` sulla stessa skill | **Arricchisci quello.** Aggiungi le fonti a `fonti_extra`, integra la sintesi. Nessun modulo nuovo |
| La skill ha solo moduli `completato` | Crea **un modulo nuovo** in coda al corso, `tipo: "aggiornamento"`, `nuovo: true` |
| Nessun modulo pertinente esiste | Crea un modulo nuovo nel corso giusto, o proponi un corso se l'area manca |

4. **Un modulo `completato` non si tocca mai.** È immutabile. Martina non torna a rileggere qualcosa che ha già segnato come fatto, quindi integrarci dentro materiale nuovo equivale a buttarlo via.
5. Se un cluster copre più di una skill, si divide per skill — un modulo per skill, non uno per voce. Tetto massimo: **2 moduli per cluster**. Oltre, è segno che il cluster andava spezzato prima.

Ogni modulo traccia la provenienza in `voci_inbox`: serve a capire, mesi dopo, da dove è arrivato un contenuto e a non riprocessare le stesse voci.

**Perché l'ordine è questo.** La destinazione più economica è quella che non crea niente di nuovo: arricchire un modulo che devo ancora studiare mi dà il materiale aggiornato senza allungare il percorso. Creare un modulo `aggiornamento` è il ripiego quando quel treno è già passato — ed è anche il meccanismo che tiene vivi i corsi "completati", perché il nuovo modulo rientra nella rotazione delle sessioni come qualunque altro.

---

## 2. Modello dati

Tutto in `data/`, file JSON, versionati con git. Niente database.

```
data/
  profile.json
  skills.json
  courses.json
  modules.json
  sessions.json
  reviews.json
  inbox.json
  requests/              richieste in attesa per la routine Cowork
    done/                richieste evase, per audit
```

### profile.json

```json
{
  "nome": "Martina",
  "ritmo_atteso_settimana": 4.5,
  "durata_sessione_min": 20,
  "quota_scoperta": 0.20,
  "buffer_minimo": 3,
  "buffer_target": 7,
  "soglia_ripasso_giorni": 10,
  "obiettivi": [
    "Scrivere un MCP server mio",
    "Collegare Claude ai miei dati personali (Apple Health, Garmin)",
    "Costruire un second brain con Obsidian e un agente"
  ],
  "calibrazione": { "fatta_il": "2026-09-16", "risposte": [] },
  "ultima_sessione_il": null,
  "sessioni_totali": 0
}
```

### skills.json — array di nodi della Knowledge Map

```json
{
  "id": "mcp-protocollo",
  "nome": "MCP — il protocollo",
  "area": "protocolli",
  "descrizione": "Cos'è MCP, come è fatto un server, come si collega a un client",
  "livello": 0,
  "livello_fonte": "calibrazione",
  "livello_aggiornato_il": "2026-09-16",
  "prerequisiti": ["llm-fondamenta", "tool-calling"],
  "moduli_completati": 0,
  "moduli_totali": 7,
  "interesse_osservato": 0.0,
  "utilita_dichiarata": 0.9,
  "note": ""
}
```

`interesse_osservato` è calcolato dalla routine contando le voci di inbox che toccano la skill, normalizzato 0-1.
`utilita_dichiarata` deriva dagli obiettivi nel profilo: 0.9 se la skill serve direttamente a un obiettivo, 0.5 se è di supporto, 0.2 altrimenti.

### courses.json

```json
{
  "id": "corso-mcp",
  "titolo": "MCP — dal protocollo al tuo primo server",
  "obiettivo": "Scrivere e collegare un MCP server funzionante",
  "skill_id": ["mcp-protocollo", "tool-calling"],
  "track": "principale",
  "stato": "attivo",
  "moduli": ["mod-mcp-01", "mod-mcp-02"],
  "origine": "seed",
  "creato_il": "2026-09-16",
  "aggiornato_il": "2026-09-16"
}
```

`moduli` è ordinato. I completati restano nell'array.

### modules.json

```json
{
  "id": "mod-mcp-01",
  "course_id": "corso-mcp",
  "titolo": "Cos'è MCP e quale problema risolve",
  "tipo": "teoria",
  "durata_min": 15,
  "voci_inbox": [],
  "obiettivo": "Alla fine sai spiegare perché MCP esiste e cosa sostituisce",
  "prerequisiti_skill": ["llm-fondamenta"],
  "prerequisiti_testo": "Serve sapere cos'è un tool call: un modo per far chiamare al modello una funzione che tu hai definito, ricevendone il risultato. Se non ti è chiaro, il modulo llm-04 lo spiega in 12 minuti.",
  "sintesi_md": "...300-600 parole...",
  "fonte_primaria": {
    "url": "https://modelcontextprotocol.io/introduction",
    "titolo": "Model Context Protocol — Introduction",
    "tipo": "documentazione",
    "verificata_il": "2026-09-16"
  },
  "fonti_extra": [],
  "domande": [
    { "q": "Perché MCP esiste?", "rubrica": "Risposta piena: cita la frammentazione delle integrazioni..." }
  ],
  "peso_skill": { "mcp-protocollo": 0.15 },
  "stato": "pronto",
  "origine": "seed",
  "nuovo": false,
  "creato_il": "2026-09-16",
  "servito_il": null,
  "completato_il": null
}
```

`tipo` ammette `teoria`, `pratica`, `ripasso`, `aggiornamento`.
`voci_inbox` elenca gli `inbox.id` che hanno contribuito al modulo: traccia la provenienza ed evita di riprocessare le stesse voci.

`peso_skill`: quanto il completamento del modulo fa salire il livello della skill. La somma dei pesi di tutti i moduli di una skill deve dare circa 1.0, così completare tutti i moduli porta da 0 a 4.

Stati: `bozza` (scheletro dal seed, senza contenuto) → `pronto` (generato dalla routine) → `servito` (proposto in una sessione) → `completato`.

Solo i moduli `pronto` entrano nei candidati del motore di priorità. I `bozza` sono visibili nel Curriculum come "in preparazione", ma non vengono mai proposti.

### sessions.json

```json
{
  "id": "ses-0007",
  "numero": 7,
  "data": "2026-09-22",
  "durata_stimata_min": 20,
  "items": [
    { "module_id": "mod-mcp-01", "ruolo": "principale" },
    { "module_id": "mod-loc-02", "ruolo": "scoperta" }
  ],
  "qualifica_inbox": ["inb-012", "inb-013"],
  "stato": "chiusa",
  "aperta_il": "2026-09-22T08:12:00+02:00",
  "chiusa_il": "2026-09-22T08:35:00+02:00"
}
```

`ruolo` ammette `principale`, `scoperta`, `ripasso`.

### reviews.json

```json
{
  "id": "rev-0031",
  "module_id": "mod-mcp-01",
  "session_id": "ses-0007",
  "data": "2026-09-22",
  "risposte": [ { "q": "Perché MCP esiste?", "risposta": "..." } ],
  "nota_libera": "La parte sui transport non mi è chiara",
  "stato": "in_attesa",
  "valutazione": null
}
```

Quando la routine la valuta:

```json
"valutazione": {
  "punteggio": 5,
  "max": 6,
  "per_domanda": [2, 2, 1],
  "commento": "Hai colto il problema che risolve. Sui transport la risposta è vaga: vedi modulo mod-mcp-03.",
  "livello_suggerito": { "mcp-protocollo": 1 },
  "valutata_il": "2026-09-27"
}
```

### inbox.json

```json
{
  "id": "inb-012",
  "url": "https://www.instagram.com/reel/DZsho9oo2wI/",
  "aggiunto_il": "2026-09-20",
  "fonte": "instagram",
  "stato": "risolto",
  "didascalia_incollata": null,
  "estratto": {
    "autore": "Dario Fontanel",
    "titolo": null,
    "didascalia": "Commenta \"pony\" per la guida...",
    "data_pubblicazione": "2026-06-17"
  },
  "tool_nominati": ["Ponytail", "Claude Code"],
  "fonte_primaria": { "url": "https://github.com/...", "tipo": "repo" },
  "verdetto": "prova",
  "motivo": "Tool reale con repo pubblica, ma si testa in 10 minuti: non merita un modulo",
  "skill_toccate": ["context-economy"],
  "modulo_generato": null,
  "nota_utente": ""
}
```

Stati: `da_leggere` → `letto` → `risolto` | `da_qualificare` | `archiviato`.
Verdetti: `studia`, `prova`, `monitora`, `verifica`, `ignora`.

### data/requests/ — la coda verso Cowork

Il sito non chiama Claude. Scrive richieste; la routine le legge.

```json
{
  "id": "req-20260922-081500",
  "tipo": "valuta_review",
  "payload": { "review_id": "rev-0031" },
  "creato_il": "2026-09-22T08:15:00+02:00",
  "stato": "in_attesa"
}
```

Tipi: `valuta_review`, `digerisci_inbox`, `genera_moduli`, `ripianifica`, `qualifica_manuale`.

Una richiesta evasa si sposta in `data/requests/done/` con `stato: "evasa"` e `evasa_il`. Non si cancella: serve a capire cosa la routine ha fatto e quando.

---

## 3. Flussi utente

### 3.1 Onboarding (una volta sola, ~10 minuti)

1. Il sito è vuoto: mostra il quiz di calibrazione.
2. **6-8 domande**, non 15. Non testano la programmazione — Martina ha una magistrale in informatica. Testano solo lo stack agentico: tool calling, MCP, agenti, contesto, orchestrazione, evals.
3. Ogni domanda è a scelta multipla con un'opzione "non lo so" che non costa nulla sceglierla.
4. Le risposte popolano i livelli iniziali di `skills.json` con `livello_fonte: "calibrazione"`.
5. Il seed curriculum viene caricato. La prima sessione è pronta.

### 3.1-bis Bootstrap (una volta sola, subito dopo la calibrazione)

Il seed genera lo scheletro dei corsi con moduli in stato `bozza`: titolo e obiettivo sì, contenuto no. Quindi **al primo avvio non esiste nessun modulo proponibile.**

La sequenza corretta è:

1. `npm run dev` → calibrazione → i livelli iniziali sono scritti
2. Il seed crea automaticamente una richiesta `genera_moduli` con priorità alta
3. **Si lancia la routine Cowork una prima volta**, che riempie il buffer con 7 moduli `pronto`, scegliendoli con lo stesso motore di priorità
4. Da qui in poi il sistema si autoalimenta

Finché il buffer è vuoto, la Daily non mostra un errore né una pagina bianca: mostra cosa manca e cosa fare ("nessun modulo pronto — lancia la routine Cowork per generarne 7"). È uno stato normale del sistema, non un guasto, e capita di nuovo se la routine resta ferma per più di due settimane.

### 3.2 Sessione di studio (il flusso principale, 20 minuti)

1. Martina apre il sito. **Nessuna attesa, nessuna chiamata di rete**: la sessione è calcolata in locale dai JSON.
2. La Daily Dashboard mostra: il modulo principale, il perché è stato scelto, il modulo di scoperta, e — se ce ne sono — fino a 3 link da qualificare in 20 secondi.
3. Legge il modulo principale. Sotto, la fonte primaria.
4. Clicca "fatto" → compaiono le 3 domande → risponde o salta.
5. Le risposte vanno in coda, il modulo diventa `completato`, il livello della skill sale del peso previsto.
6. Legge il modulo di scoperta (5 min). Un solo bottone: "interessante" / "non fa per me". Nessuna domanda.
7. La sessione si chiude. Non c'è nient'altro da fare.

**Cosa la dashboard mostra sempre**, oltre a cosa studiare: **cosa ignorare oggi**. Una riga, tipo "3 novità su Claude Code questa settimana, nessuna ti riguarda ancora: sei al livello 1, ti servono dal 3". È metà del valore del prodotto.

### 3.3 Cattura di un link (10 secondi)

1. Incolla l'URL nel campo, sempre presente.
2. Facoltativo: incolla anche la didascalia.
3. Il link finisce in `inbox.json` con stato `da_leggere`. Fine.
4. Se la coda supera 5 elementi, il sito scrive una richiesta `digerisci_inbox`.

### 3.4 Consultazione della Knowledge Map

Nessuna azione richiesta. Serve a rispondere a tre domande: dove sono, cosa mi manca, cosa viene dopo. Ogni area mostra livello, prerequisiti mancanti e il prossimo modulo disponibile.

### 3.5 La routine settimanale (nessun intervento di Martina)

Gira la domenica, più fuori orario se il buffer scende sotto 3 moduli pronti o se la coda link supera 5 elementi.

1. Legge `data/requests/`.
2. Valuta le review in attesa, aggiorna i livelli.
3. Digerisce l'inbox seguendo la regola di escalation.
4. Rigenera il buffer fino a 7 moduli `pronto`.
5. Ricalcola `interesse_osservato` e propone eventuali nuovi corsi.
6. Sposta le richieste evase in `done/`.

---

## 4. Logica di priorità

Deterministica, calcolata dal sito, senza AI. Questo è il cuore del prodotto.

### 4.1 Il gate dei prerequisiti

**Prima di qualsiasi punteggio**: un modulo i cui prerequisiti sono sotto livello 2 è **escluso dai candidati**, non penalizzato.

È questo, e non un peso nella formula, a rendere automatico "prima le basi". E si scioglie da solo: man mano che i livelli salgono, i moduli a valle entrano nel pool.

### 4.2 Il punteggio

Per ogni modulo candidato (stato `pronto`, prerequisiti soddisfatti, skill non già a livello 4):

```
P = 0.30 · centralità
  + 0.25 · lacuna
  + 0.20 · utilità
  + 0.15 · interesse
  + 0.10 · (1 − costo)
```

| Componente | Definizione | Fonte |
|---|---|---|
| centralità | quante altre skill dipendono da questa, normalizzato 0-1 | grafo dei prerequisiti in `skills.json` |
| lacuna | (4 − livello_attuale) / 4 | `skills.json` |
| utilità | `utilita_dichiarata` della skill | derivata dagli obiettivi nel profilo |
| interesse | `interesse_osservato` della skill | conteggio delle voci inbox che la toccano |
| costo | `durata_min` / `durata_sessione_min`, tagliato a 1 | `modules.json` |

Il modulo con P più alto è il principale della sessione.

### 4.3 Perché questa formula rispetta le regole richieste

| Regola | Come è soddisfatta |
|---|---|
| La priorità non si basa sulla novità | La data di pubblicazione non compare in nessuna componente |
| All'inizio le basi hanno priorità alta | La centralità è massima sui nodi fondazionali, e il gate esclude tutto il resto |
| La priorità si adatta con il progresso | La lacuna si riduce col livello; una skill a 4 esce dal pool; i nodi a valle si sbloccano |
| Utilità personale | `utilità` dagli obiettivi, `interesse` dai link realmente salvati |
| Scoperta di cose nuove | Gestita fuori dal punteggio, dal track di scoperta |

**Antipattern da evitare esplicitamente**: non introdurre una componente "recente". È esattamente il comportamento che Agent Teacher esiste per non avere.

### 4.4 Selezione del modulo di scoperta

Regole, in ordine:

1. Candidati: skill a livello 0 **fuori** dal percorso principale, con prerequisiti soddisfatti.
2. Preferisci aree adiacenti a quelle su cui stai lavorando.
3. **Una volta su cinque, ignora la regola 2** e pesca qualcosa senza alcun legame con le aree attuali. È la serendipità vera, e va forzata perché altrimenti non capita mai.
4. Mai la stessa area in due sessioni consecutive.
5. Se Martina marca "non fa per me", l'area scende di peso ma non viene esclusa: potrebbe servirle fra sei mesi.

### 4.5 Livelli e progressione

Il livello di una skill sale sommando i `peso_skill` dei moduli completati, moltiplicato per 4:

```
livello = min(4, round(4 × Σ peso_skill dei moduli completati))
```

La valutazione della routine può correggerlo verso il basso: se le risposte alle 3 domande sono deboli, `livello_suggerito` prevale sul calcolo automatico. È il meccanismo che impedisce alla mappa di gonfiarsi.

---

## 5. Ruoli: Claude Code, Claude Cowork, il sito

La divisione è netta e vale come criterio: **il deterministico è codice, il giudizio è Cowork.**

### 5.1 Claude Code — costruisce, una tantum

- Scaffold del progetto, server Express, UI React
- Il motore di priorità (§4), come codice puro e testato
- Gli schemi JSON e la loro validazione
- Il quiz di calibrazione
- Le pagine: Daily, Curriculum, Knowledge Map
- Test unitari sul motore di priorità e sul calcolo dei livelli
- Lo script di import del seed (`inbox-seed.json` e il curriculum iniziale)

**Claude Code non scrive contenuti didattici.** Non genera moduli, non scrive sintesi, non inventa domande.

### 5.2 Claude Cowork — fa girare, in continuo

Una routine settimanale più due trigger (buffer < 3, coda link ≥ 5):

- Genera moduli: sintesi, fonte primaria verificata, 3 domande con rubrica
- Valuta le review in attesa e aggiorna i livelli
- Digerisce l'inbox seguendo la regola di escalation
- Verifica i claim: un post che promette "94% di codice in meno" esce come `verifica`, non come verità
- Propone nuovi corsi quando emerge un'area scoperta

**Cowork non tocca il codice del sito.** Scrive solo dentro `data/`.

### 5.3 Il sito — da solo, senza AI

- Calcola la sessione e le priorità
- Mostra mappa, corsi, moduli
- Registra completamenti e risposte
- Accoda richieste in `data/requests/`

**Il sito non chiama mai un modello.** Nessuna API key nel progetto.

### 5.4 Perché questa divisione

Un sito che chiama un modello a ogni apertura è lento, costoso e fragile. Un sito che legge JSON è istantaneo e funziona anche se la routine non gira da due settimane — semplicemente studi il buffer già pronto. Il costo è la latenza sul contenuto nuovo: fino a 7 giorni. Per le fondamenta è irrilevante.

---

## 6. Roadmap

### v1 — MVP (questa specifica)

Daily a sessioni, Live Curriculum, Knowledge Map, cattura link, calibrazione, motore di priorità, routine Cowork con buffer.

**Criterio di riuscita, da misurare dopo 3 settimane:** Martina ha fatto almeno 12 sessioni senza dover decidere lei cosa studiare.

### v2 — dopo 3 settimane di uso reale

L'ordine si decide con i dati, non adesso. La v1 registra cosa apre, cosa salta e cosa cerca. Candidati:

| Sezione | Perché |
|---|---|
| Inbox Analyzer completo | Estrazione e classificazione visibili nell'interfaccia, non solo in routine |
| Practical Lab | Esercizi con consegna, obiettivo, prerequisiti, tool; svolti fuori dal sito |
| My Projects | Alimenta `utilita_dichiarata` con progetti reali invece che obiettivi dichiarati |
| Ask My Curriculum | Chat che cerca prima nel curriculum, poi nell'inbox, poi online |
| Adapter YouTube via Gemini | Free tier, 8h/giorno, ufficiale: risolve i video senza zone grigie |

### Futuro

AI Radar (richiede una routine più frequente della settimanale), grafo dei prerequisiti come seconda vista della mappa, analisi video di Instagram e TikTok su richiesta esplicita, accesso da telefono.

---

## 7. Seed curriculum

Dieci corsi, scritti a priori. L'ordine effettivo lo decide il motore di priorità; qui contano i **prerequisiti**, che determinano cosa si sblocca quando.

| # | Corso | Moduli | Prerequisiti | Perché per Martina |
|---|---|---|---|---|
| 0 | Come funzionano davvero gli LLM | 6 | — | L'unico contenuto fondazionale che aveva già salvato (video Karpathy) |
| 1 | Claude Code dalle fondamenta | 7 | corso 0 | Il tema che consuma di più, ma senza basi sotto |
| 2 | MCP — dal protocollo al tuo server | 7 | corso 0, corso 1 | Zero occorrenze nei suoi 54 link. Il buco più grande |
| 3 | Context engineering e memoria | 5 | corso 1 | 4 post salvati sul risparmio token: interesse reale già dimostrato |
| 4 | Claude Skills | 5 | corso 1 | 5 occorrenze nei link, sempre come "installa quelle degli altri" |
| 5 | Second brain con Obsidian e agenti | 5 | corso 2, corso 3 | 5 post salvati, ed è un obiettivo dichiarato |
| 6 | Orchestrazione multi-agent | 6 | corso 2, corso 4 | Il tema del picco di giugno |
| 7 | Agenti locali e self-hosted | 4 | corso 2 | 2 post salvati (OpenJarvis, Odysseus) |
| 8 | Evals, valutazione e sicurezza | 5 | corso 2, corso 6 | Zero occorrenze. Nessuna sua fonte gliene parla |
| 9 | Framework agentici a confronto | 5 | corso 6, corso 8 | Zero occorrenze. LangGraph, LlamaIndex, CrewAI, smolagents |

Aree della Knowledge Map, tutte presenti dal giorno uno:

`fondamenta-llm` · `tool-calling` · `claude-code` · `mcp-protocollo` · `claude-skills` · `context-economy` · `second-brain` · `orchestrazione` · `agenti-locali` · `evals-sicurezza` · `framework-agentici` · `integrazioni-personali` · `rag` · `provenienza-sicurezza`

Nota sull'ordine: i corsi 8 e 9 finiscono in fondo per prerequisiti, non per importanza. La Knowledge Map deve mostrarli comunque fin dal primo giorno, a livello 0 e ben visibili: è l'unico modo in cui Martina sa che esistono.

---

## 8. Rischi noti

| Rischio | Mitigazione |
|---|---|
| La routine non gira per settimane | Il buffer di 7 moduli copre ~2 settimane. Il sito funziona lo stesso |
| I livelli si gonfiano per autovalutazione generosa | La valutazione delle 3 domande può correggere il livello verso il basso |
| Il seed curriculum si rivela sbagliato | I corsi sono vivi: la routine può aggiungere, riordinare e mettere in pausa |
| La scoperta diventa rumore | Regola della quinta sessione più il feedback "non fa per me" che pesa ma non esclude |
| Troppi link in coda mai qualificati | Max 3 per sessione, 20 secondi, dentro una sessione già iniziata |
| Contenuto obsoleto | Ogni fonte primaria ha `verificata_il`; la routine ricontrolla quelle oltre i 90 giorni |
