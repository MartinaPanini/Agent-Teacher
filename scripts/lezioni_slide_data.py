# -*- coding: utf-8 -*-
"""Contenuto delle lezioni nel formato a slide (AT-specifiche §15).

Una voce per modulo. 8 slide, 900-1300 parole, immagini in data/illustrations/.
"""

def img(i, stile, larghezza, alt):
    return {"id": i, "stile": stile, "larghezza": larghezza, "alt": alt}


def ap(t, x):
    return {"titolo": t, "testo": x}


SLIDES = {}

SLIDES["mod-mcp-01"] = [
 {"tipo": "apertura",
  "titolo": "Quello che il modello sa di uno strumento",
  "corpo": """Alla fine di questa lezione sai dire quali sono le tre parti di una definizione di strumento, e quale delle tre decide se il modello quello strumento lo userà o lo ignorerà.

Prima di partire serve una cosa sola, e va tenuta ferma per tutta la lezione: un modello linguistico non esegue niente. Produce testo. Quando si dice «Claude ha letto un file», quello che è successo è che il modello ha prodotto un pezzo di testo strutturato che dice «voglio leggere questo file», e un programma esterno — Claude Code, il tuo script, la piattaforma — ha letto quel testo, ha eseguito l'operazione e gli ha rimandato il risultato. Tutto il resto della lezione discende da qui.""",
  "punti": [], "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "Chi chiede e chi esegue",
  "corpo": """La parola «strumento» suggerisce qualcosa che il modello impugna. Il modello non impugna niente: dichiara un'intenzione in un formato che il tuo codice sa leggere. Il giro completo ha tre passaggi e due protagonisti, e il modello è uno solo dei due.""",
  "punti": [
    "Il modello produce un blocco `tool_use`: quale strumento vuole e con quali parametri. Poi il suo turno finisce.",
    "Il tuo programma legge quel blocco ed esegue davvero l'operazione — la lettura del file, la chiamata HTTP, la query.",
    "Il risultato torna al modello come un messaggio nuovo. Solo adesso il modello «sa» cosa c'era nel file.",
  ],
  "punti_stile": "numerato", "approfondimento": None,
  "immagine": img("tool-use-chi-esegue", "B", "spot",
    "Il modello produce un blocco tool_use, il tuo programma esegue l'operazione e il risultato torna al modello come messaggio user")},

 {"tipo": "concetto",
  "titolo": "Tre campi, e uno solo decide",
  "corpo": """Una definizione di strumento ha esattamente tre parti obbligatorie. Due sono descrittive, una è tecnica, e nessuna delle tre contiene il codice che fa il lavoro: quello vive nel tuo programma e al modello non arriva mai.""",
  "punti": [
    "`name` — l'identificatore. Deve rispettare `^[a-zA-Z0-9_-]{1,128}$`. Serve a te e alla macchina, non spiega niente.",
    "`description` — prosa in chiaro: cosa fa lo strumento, quando va usato, quando no, cosa significa ogni parametro, quali sono i limiti.",
    "`input_schema` — un oggetto JSON Schema: quali proprietà accetta l'input, di che tipo, quali sono obbligatorie.",
  ],
  "punti_stile": "numerato",
  "approfondimento": ap("Perché lo schema è già mezza descrizione",
    """Un campo chiamato `q` di tipo stringa non dice niente. Lo stesso campo chiamato `query_testuale`, con una descrizione propria dentro lo schema, dice al modello sia cosa metterci sia quando lo strumento è pertinente. JSON Schema permette una descrizione per ogni proprietà, ed è lo spazio che viene sprecato più spesso: si compila `type` e si lascia il resto vuoto."""),
  "immagine": img("tool-definizione-tre-campi", "B", "spot",
    "I tre campi di una definizione di strumento: name, description e input_schema; il codice che esegue lo strumento resta fuori e il modello non lo vede mai")},

 {"tipo": "esempio",
  "titolo": "Una definizione vera, campo per campo",
  "corpo": """Questo è `get_weather`, scritto come andrebbe scritto. Non è lungo per pignoleria: ogni frase in più chiude un caso in cui il modello avrebbe dovuto tirare a indovinare.""",
  "punti": [
    "`name` è breve e stabile. Cambiarlo dopo significa invalidare tutto quello che nella conversazione è già stato chiamato con il nome vecchio.",
    "`description` occupa quattro frasi: cosa restituisce, quando usarlo, quando **non** usarlo, come va scritto il parametro. Il «quando no» è la parte che viene omessa quasi sempre.",
    "`input_schema` dichiara una sola proprietà e la rende obbligatoria. Uno schema stretto elimina intere classi di chiamate sbagliate prima che avvengano.",
  ],
  "punti_stile": "numerato",
  "approfondimento": ap("Quanto deve essere lunga una descrizione",
    """La documentazione ufficiale non è tiepida su questo: «Provide extremely detailed descriptions. This is by far the most important factor in tool performance.» E dà una misura concreta: almeno tre o quattro frasi per strumento, di più se lo strumento è complicato o se il nome è ambiguo. Va letta come un limite inferiore, non come un consiglio."""),
  "immagine": img("tool-json-vscode", "A", "wide",
    "La definizione JSON dello strumento get_weather aperta in Visual Studio Code: name, una description di quattro frasi e input_schema")},

 {"tipo": "concetto",
  "titolo": "L'unica superficie su cui si decide",
  "corpo": """Il motivo per cui la descrizione conta così tanto è meccanico, non stilistico. Il modello non vede il codice che esegue lo strumento, non vede cosa succede dentro e non ha modo di provare. Al momento di decidere se quello strumento serve, ha davanti soltanto `description` e `input_schema`.

Da qui seguono due cose che sembrano diverse e sono la stessa. Se la descrizione dice «cerca cose», lo strumento è di fatto invisibile: il modello non ha modo di sapere che la tua richiesta rientra in «cose». Se lo schema non prevede il campo che servirebbe al tuo caso, lo strumento è inutilizzabile lì, e viene saltato.

La documentazione lo dice quasi alla lettera: il modello chiama uno strumento «when the request maps to that tool's *described* capability». *Described*: la capacità descritta, non quella reale.""",
  "punti": [], "punti_stile": "elenco",
  "approfondimento": ap("Forzare la mano con tool_choice",
    """`tool_choice` accetta anche `{"type": "any"}`, che obbliga il modello a chiamare uno strumento qualsiasi, e `{"type": "tool", "name": "..."}`, che ne impone uno preciso. Servono quando la chiamata deve avvenire per forza: un passaggio di validazione, un formato di uscita obbligato. Una riga nel system prompt tipo «usa gli strumenti prima di rispondere» non è la stessa cosa — sposta la probabilità e non garantisce niente, perché la decisione continua a prendersi sulla capacità descritta nello strumento."""),
  "immagine": None},

 {"tipo": "trappola",
  "titolo": "Lo strumento che non viene mai chiamato",
  "corpo": """È il sintomo più comune, e quasi sempre viene diagnosticato nel posto sbagliato. Lo strumento c'è, il codice funziona se lo chiami a mano, ma il modello non lo usa mai — e la reazione istintiva è cambiare modello o irrobustire il system prompt. L'ordine giusto in cui guardare è esattamente l'inverso di quello istintivo.""",
  "punti": [
    "**Prima la descrizione.** Dice esplicitamente in quali casi lo strumento va usato? Nomina le parole che l'utente userebbe davvero?",
    "**Poi lo schema.** Esiste un campo per l'informazione che l'utente ha dato? Se manca, lo strumento non è applicabile e il modello ha ragione a saltarlo.",
    "**Poi gli altri strumenti.** Ce n'è uno che copre lo stesso terreno in modo più preciso? Il modello sta scegliendo, non ignorando.",
    "**Il modello e il prompt per ultimi.** Sono la causa molto più di rado di quanto sembri.",
  ],
  "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "Client tool e server tool",
  "corpo": """Ultima distinzione, e conta perché cambia chi fa il lavoro. Nella definizione hanno la stessa forma; nell'esecuzione stanno in due posti diversi, e solo uno dei due è tuo.""",
  "punti": [
    "**Client tool** — i tuoi, più quelli di Anthropic come `bash` e `text_editor`. Il modello si ferma con `stop_reason: \"tool_use\"`, esegui tu, rimandi tu il risultato. Se non fai niente, non succede niente.",
    "**Server tool** — `web_search`, `web_fetch`, `code_execution`. Girano sull'infrastruttura di Anthropic: il risultato arriva già prodotto e tu non gestisci nessuna esecuzione.",
    "In un solo turno il modello può chiamarli insieme. Sta a te sapere quale dei due tocca a te eseguire.",
  ],
  "punti_stile": "elenco", "approfondimento": None,
  "immagine": img("client-vs-server-tool", "B", "spot",
    "I client tool girano nel tuo codice e li esegui tu; i server tool girano sull'infrastruttura di Anthropic e il risultato arriva già prodotto")},

 {"tipo": "chiusura",
  "titolo": "Da ricordare",
  "corpo": """Tre frasi. Se ne ricordi una sola, ricorda la prima.

Questo modulo sblocca il prossimo: contare quante richieste servono perché una chiamata a uno strumento arrivi fino in fondo, e capire cosa c'è dentro ciascuna.""",
  "punti": [
    "Il modello non esegue: produce un blocco `tool_use` e si ferma.",
    "Di uno strumento vede `description` e `input_schema`, e nient'altro. Mai il codice.",
    "Quando uno strumento non viene chiamato, la prima cosa da guardare è la coppia descrizione più schema, non il modello.",
  ],
  "punti_stile": "elenco", "approfondimento": None, "immagine": None},
]


SLIDES["mod-mcp-02"] = [
 {"tipo": "apertura",
  "titolo": "Il giro completo di una chiamata",
  "corpo": """Alla fine di questa lezione sai contare quante richieste all'API servono perché il modello risponda usando uno strumento, e sai dire cosa c'è dentro ciascuna e chi la scrive.

Servono due cose. La prima viene dal modulo precedente: una definizione di strumento ha tre parti — `name`, `description`, `input_schema` — e il modello non esegue niente, produce un pezzo di testo strutturato che chiede un'operazione.

La seconda è meno ovvia e conta altrettanto: una conversazione con l'API non ha memoria propria. Ogni richiesta rispedisce tutta la conversazione dall'inizio. Il server non conserva niente fra una chiamata e l'altra, e quello che sembra un dialogo continuo è una sequenza di richieste indipendenti, ognuna delle quali si porta dietro tutto il passato.""",
  "punti": [], "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "Due richieste, non una",
  "corpo": """La domanda «quante richieste servono» ha una risposta secca, ed è due. Non una. Non «dipende». Due, per una singola chiamata a uno strumento; tre per due chiamate in sequenza, e così via: una richiesta in più per ogni giro.

Contarle non è pedanteria. È quello che rende visibili due cose che altrimenti restano invisibili: il costo, e il punto esatto in cui il tuo codice deve fare qualcosa perché la conversazione vada avanti.""",
  "punti": [
    "**Richiesta 1** — ci metti `tools` con le definizioni complete di tutti gli strumenti disponibili e `messages` con il messaggio dell'utente. Torna una risposta con `stop_reason: \"tool_use\"`.",
    "**In mezzo** — fuori dall'API. Il tuo programma legge il blocco `tool_use` ed esegue davvero l'operazione.",
    "**Richiesta 2** — rispedisci tutto quanto, più il risultato. Torna il testo che leggi, con `stop_reason: \"end_turn\"`.",
  ],
  "punti_stile": "numerato", "approfondimento": None,
  "immagine": img("due-richieste-timeline", "B", "wide",
    "Due richieste all'API per una sola chiamata a uno strumento: la prima torna con stop_reason tool_use, in mezzo il tuo codice esegue, la seconda torna con il testo finale")},

 {"tipo": "concetto",
  "titolo": "Cosa torna dalla prima richiesta",
  "corpo": """La risposta alla prima richiesta non è testo finale, ed è utile guardare com'è fatta perché è la forma che il tuo codice deve saper leggere.

`stop_reason` vale `"tool_use"`. Il `content` non è una stringa ma un array di blocchi: tipicamente un blocco `text` con quello che il modello sta dicendo a voce alta («controllo il meteo»), e poi un blocco `tool_use` fatto di tre campi — `id`, un identificatore come `toolu_01A09q90qw90lq917835lq9`; `name`, quale strumento; `input`, i parametri nella forma dichiarata dallo schema.

A questo punto il modello ha finito il suo turno. Non sta aspettando niente e non è in pausa: la richiesta HTTP è chiusa. Se non fai nient'altro, non succede nient'altro. È la differenza fra una chiamata a uno strumento e una chiamata di funzione normale, ed è tutta qui.""",
  "punti": [], "punti_stile": "elenco",
  "approfondimento": ap("Più strumenti in un solo turno",
    """Il `content` può contenere più blocchi `tool_use` insieme: il modello chiede tre operazioni in parallelo e il tuo codice le esegue tutte prima di rispondere. In quel caso i risultati tornano indietro tutti dentro un unico messaggio, e l'ordine in cui li metti non conta — conta solo l'identificatore che li accoppia, ed è il motivo per cui quell'identificatore esiste."""),
  "immagine": None},

 {"tipo": "esempio",
  "titolo": "La seconda richiesta, aperta",
  "corpo": """Tre messaggi, e il terzo è quello che si sbaglia sempre. Insieme ai messaggi rispedisci anche `tools`, identico a prima: non è un residuo, è quello che dice al modello cosa può ancora chiamare.""",
  "punti": [
    "Il messaggio `assistant` è quello che il modello ti ha appena mandato, riportato tale e quale: contiene il blocco `tool_use` con il suo `id`.",
    "Il messaggio nuovo ha `role: \"user\"`. Non `tool`, non `assistant`. È un messaggio utente, anche se il contenuto l'hai prodotto tu.",
    "Dentro c'è un blocco `tool_result` con tre campi: `tool_use_id`, `content` (il risultato) e `is_error`, un booleano che dice se l'esecuzione è fallita.",
  ],
  "punti_stile": "numerato",
  "approfondimento": ap("Quando l'esecuzione fallisce",
    """`is_error: true`, con il messaggio d'errore dentro `content`, è meglio che non rimandare niente o rimandare un risultato vuoto. Il modello legge l'errore, capisce cosa non ha funzionato e può correggere i parametri e riprovare nel turno successivo. Se invece gli rimandi un risultato finto o silenzioso, prosegue convinto che l'operazione sia riuscita, e l'errore ricompare tre turni dopo sotto forma di una risposta sbagliata di cui non si capisce l'origine."""),
  "immagine": img("seconda-richiesta-json", "A", "wide",
    "L'array messages della seconda richiesta: il messaggio utente, il messaggio assistant con il blocco tool_use, e un secondo messaggio con ruolo user che contiene il tool_result")},

 {"tipo": "concetto",
  "titolo": "L'identificatore è tutto il legame",
  "corpo": """`tool_use_id` è quello che tiene insieme la coppia. Il blocco `tool_use` porta un `id`; il blocco `tool_result` riporta esattamente quel valore. Non è una formalità burocratica: è l'unico legame che esiste fra una richiesta e il suo risultato.""",
  "punti": [
    "Se il modello ha chiesto tre strumenti in parallelo in un solo turno, i tre risultati tornano indietro tutti insieme dentro un unico messaggio `user`.",
    "L'unico modo di sapere quale risultato appartiene a quale richiesta è l'identificatore. **Non l'ordine.**",
    "Un `tool_use_id` sbagliato non dà un errore di sintassi: dà una risposta costruita sul risultato dello strumento sbagliato, che è molto più difficile da notare.",
  ],
  "punti_stile": "elenco", "approfondimento": None,
  "immagine": img("tool-use-e-tool-result", "B", "spot",
    "Il blocco tool_use porta un id e il blocco tool_result riporta lo stesso valore in tool_use_id: è questo che accoppia la richiesta al suo risultato")},

 {"tipo": "trappola",
  "titolo": "I tre errori che si fanno qui",
  "corpo": """Sono sempre gli stessi tre, e nessuno dei tre dà un messaggio d'errore che li nomina. Si manifestano come risposte strane, non come eccezioni.""",
  "punti": [
    "**`role: \"tool\"`.** In questa API non esiste. Il risultato di uno strumento viaggia dentro un messaggio con ruolo `user`, e chi arriva da altre librerie lo sbaglia quasi sempre la prima volta.",
    "**Non rispedire le definizioni.** `tools` va nella seconda richiesta come nella prima. Se lo ometti, il modello non sa più cosa può chiamare e smette di usare gli strumenti a metà conversazione.",
    "**Saltare il messaggio assistant.** Se mandi il `tool_result` senza il messaggio che conteneva il `tool_use`, stai riportando la risposta a una domanda che nella conversazione non è mai stata fatta.",
  ],
  "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "Quello che il conteggio rende visibile",
  "corpo": """Contare le richieste rende visibile una cosa che altrimenti si scopre solo guardando il consumo. La seconda richiesta non è più leggera della prima: è la prima, più altre due cose.""",
  "punti": [
    "Le definizioni degli strumenti le rispedisci a ogni richiesta della conversazione, non una volta sola. Una `description` lunga la paghi tutte le volte.",
    "Il contenuto che lo strumento ha restituito entra nella finestra di contesto e ci resta per tutti i turni successivi. Un file letto una volta lo porti avanti fino alla fine della conversazione.",
    "Tre chiamate a strumenti in una conversazione sono quattro richieste, e ognuna è più pesante della precedente.",
  ],
  "punti_stile": "elenco",
  "approfondimento": ap("Dove si recupera",
    """Due leve, e agiscono su metà diverse del problema. Il prompt caching abbatte il costo della parte che non cambia, e le definizioni degli strumenti sono il caso da manuale: identiche a ogni richiesta e all'inizio del prompt. Restituire meno roba dallo strumento agisce sull'altra metà: un `tool_result` che riporta duecento righe di JSON quando ne servivano tre te le porti dietro per tutta la conversazione, e nessuna cache te le toglie."""),
  "immagine": img("costo-che-cresce", "B", "spot",
    "Il carico della seconda richiesta è più grande della prima: le definizioni degli strumenti vengono rispedite ogni volta, insieme al blocco tool_use e al risultato dello strumento")},

 {"tipo": "chiusura",
  "titolo": "Da ricordare",
  "corpo": """Tre frasi, e la seconda è quella che salva più tempo in fase di debug.

Questo modulo sblocca la parte di MCP in cui questo stesso giro smette di essere codice tuo e diventa un protocollo: `tools/list` e `tools/call` verso un server che non hai scritto tu.""",
  "punti": [
    "Due richieste per una chiamata a uno strumento. Una in più per ogni giro successivo.",
    "Fra le due la richiesta HTTP è chiusa: se il tuo codice non esegue, non succede niente e nessuno sta aspettando.",
    "`tool_use_id` accoppia richiesta e risultato. L'ordine non conta.",
  ],
  "punti_stile": "elenco", "approfondimento": None, "immagine": None},
]
