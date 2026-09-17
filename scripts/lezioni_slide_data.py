# -*- coding: utf-8 -*-
"""Contenuto delle lezioni nel formato a slide (AT-specifiche §15).

Regole di scrittura: docs/STILE.md, piu' la skill humanizer per i tell da IA
che STILE.md non nomina. Il controllo e' scripts/controlla-stile.py e va
passato prima di scrivere in data/.
"""

def img(i, stile, larghezza, alt):
    return {"id": i, "stile": stile, "larghezza": larghezza, "alt": alt}


def ap(t, x):
    return {"titolo": t, "testo": x}


SLIDES = {}
MODULO = {}   # campi del modulo riscritti insieme alle slide

MODULO["mod-mcp-01"] = {"prerequisiti_testo": """Un modello linguistico non esegue niente: produce testo. Quando leggi «Claude ha letto un file», è successo altro. Il modello ha prodotto un testo strutturato che chiede quella lettura. Un programma esterno l'ha eseguita e gli ha rimandato il risultato.

Ti serve anche sapere cos'è la finestra di contesto. È tutto quello che viaggia dentro una richiesta e che il modello può consultare mentre risponde.

Serve infine un'idea minima di JSON Schema. È un oggetto che descrive la forma di un dato: quali campi, di che tipo, quali obbligatori."""}

SLIDES["mod-mcp-01"] = [
 {"tipo": "apertura",
  "titolo": "Prima di partire",
  "corpo": """Alla fine sai elencare le tre parti di una definizione di strumento. E sai dire quale delle tre decide se il modello lo userà o lo ignorerà.

Una cosa va tenuta ferma per tutta la lezione: il modello non esegue niente, produce testo. Quando leggi «Claude ha letto un file», il modello ha prodotto un testo strutturato che chiede quella lettura. Un programma esterno l'ha eseguita e gli ha rimandato il risultato.

Tutto il resto discende da qui.""",
  "punti": [], "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "Chi chiede e chi esegue",
  "corpo": """La parola «strumento» suggerisce qualcosa che il modello impugna. Non impugna niente: dichiara un'intenzione in un formato che il tuo codice sa leggere.

Il giro completo ha tre passaggi e due protagonisti. Il modello è uno solo dei due.""",
  "punti": [
    "Il modello produce un blocco `tool_use`: quale strumento vuole, con quali parametri. Poi il suo turno finisce.",
    "Il tuo programma legge quel blocco ed esegue l'operazione: la lettura del file, la chiamata HTTP, la query.",
    "Il risultato torna al modello come messaggio nuovo. Solo adesso il modello sa cosa c'era nel file.",
  ],
  "punti_stile": "numerato", "approfondimento": None,
  "immagine": img("tool-use-chi-esegue", "B", "spot",
    "Il modello produce un blocco tool_use, il tuo programma esegue l'operazione e il risultato torna al modello come messaggio user")},

 {"tipo": "concetto",
  "titolo": "Tre campi, uno decide",
  "corpo": """Una definizione di strumento ha tre parti obbligatorie. Due sono descrittive, una è tecnica.

Nessuna delle tre contiene il codice che fa il lavoro. Quello vive nel tuo programma e al modello non arriva mai.""",
  "punti": [
    "`name` è l'identificatore, e deve rispettare `^[a-zA-Z0-9_-]{1,128}$`. Serve alla macchina, non spiega niente.",
    "`description` è prosa in chiaro. Dice cosa fa lo strumento, quando va usato, quando no, cosa significa ogni parametro.",
    "`input_schema` è un oggetto JSON Schema. Dichiara quali proprietà accetta l'input, di che tipo, quali sono obbligatorie.",
  ],
  "punti_stile": "numerato",
  "approfondimento": ap("Lo schema è già mezza descrizione",
    """Un campo chiamato `q` di tipo stringa non dice niente. Lo stesso campo chiamato `query_testuale`, con una sua descrizione dentro lo schema, dice due cose: cosa metterci, e quando lo strumento è pertinente.

JSON Schema permette una descrizione per ogni proprietà. È lo spazio sprecato più spesso: si compila `type` e si lascia il resto vuoto."""),
  "immagine": img("tool-definizione-tre-campi", "B", "spot",
    "I tre campi di una definizione di strumento: name, description e input_schema; il codice che esegue lo strumento resta fuori e il modello non lo vede mai")},

 {"tipo": "esempio",
  "titolo": "Una definizione vera",
  "corpo": """Questo è `get_weather`, scritto come andrebbe scritto. Non è lungo per pignoleria. Ogni frase in più chiude un caso in cui il modello avrebbe dovuto indovinare.""",
  "punti": [
    "`name` è breve e stabile. Cambiarlo dopo invalida tutto quello che è già stato chiamato col nome vecchio.",
    "`description` occupa quattro frasi: cosa restituisce, quando usarlo, quando **non** usarlo, come si scrive il parametro. Il «quando no» si omette quasi sempre.",
    "`input_schema` dichiara una proprietà sola e la rende obbligatoria. Uno schema stretto elimina intere classi di chiamate sbagliate.",
  ],
  "punti_stile": "numerato",
  "approfondimento": ap("Quanto deve essere lunga",
    """La documentazione ufficiale non è tiepida: «Provide extremely detailed descriptions. This is by far the most important factor in tool performance.»

E dà una misura: almeno tre o quattro frasi per strumento. Di più se lo strumento è complicato o se il nome è ambiguo. Va letta come un limite minimo, non come un consiglio."""),
  "immagine": img("tool-json-vscode", "A", "wide",
    "La definizione JSON dello strumento get_weather aperta in Visual Studio Code: name, una description di quattro frasi e input_schema")},

 {"tipo": "concetto",
  "titolo": "L'unica superficie che conta",
  "corpo": """Il motivo è meccanico, non stilistico. Il modello non vede il codice che esegue lo strumento. Non vede cosa succede dentro e non ha modo di provare.

Quando decide se quello strumento serve, ha davanti solo `description` e `input_schema`.

Da qui seguono due cose che sembrano diverse e sono la stessa. Se la descrizione dice «cerca cose», lo strumento è invisibile: il modello non sa che la tua richiesta rientra in «cose». Se lo schema non prevede il campo che servirebbe, lo strumento è inutilizzabile lì e viene saltato.

La documentazione lo dice quasi alla lettera: il modello chiama uno strumento quando la richiesta ricade nella capacità *descritta*. Descritta, non reale.""",
  "punti": [], "punti_stile": "elenco",
  "approfondimento": ap("Forzare la mano con tool_choice",
    """`tool_choice` accetta anche `{"type": "any"}`, che obbliga il modello a chiamare uno strumento qualsiasi. E `{"type": "tool", "name": "..."}`, che ne impone uno preciso. Servono quando la chiamata deve avvenire per forza: una validazione, un formato di uscita obbligato.

Una riga nel system prompt non è la stessa cosa. Sposta la probabilità e non garantisce niente. La decisione continua a prendersi sulla capacità descritta nello strumento."""),
  "immagine": None},

 {"tipo": "trappola",
  "titolo": "Lo strumento mai chiamato",
  "corpo": """È il sintomo più comune, e quasi sempre lo si diagnostica nel posto sbagliato. Lo strumento c'è. Il codice funziona se lo chiami a mano. Il modello non lo usa mai.

La reazione istintiva è cambiare modello o irrobustire il system prompt. L'ordine giusto è l'inverso.""",
  "punti": [
    "Prima la descrizione. Dice in quali casi lo strumento va usato? Nomina le parole che useresti tu?",
    "Poi lo schema. Esiste un campo per l'informazione che hai dato? Se manca, il modello ha ragione a saltarlo.",
    "Poi gli altri strumenti. Ce n'è uno che copre lo stesso terreno meglio? Il modello sta scegliendo, non ignorando.",
    "Il modello e il prompt per ultimi. Sono la causa molto più di rado di quanto sembri.",
  ],
  "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "Client tool e server tool",
  "corpo": """Ultima distinzione, e conta perché cambia chi fa il lavoro. Nella definizione hanno la stessa forma. Nell'esecuzione stanno in due posti diversi, e uno solo dei due è tuo.""",
  "punti": [
    "I client tool sono i tuoi, più `bash` e `text_editor` di Anthropic. Il modello si ferma con `stop_reason: \"tool_use\"`, esegui tu, rimandi tu.",
    "I server tool sono `web_search`, `web_fetch`, `code_execution`. Girano sull'infrastruttura di Anthropic e il risultato arriva già prodotto.",
    "In un turno solo il modello può chiamarli insieme. Sta a te sapere quale dei due tocca a te eseguire.",
  ],
  "punti_stile": "elenco", "approfondimento": None,
  "immagine": img("client-vs-server-tool", "B", "spot",
    "I client tool girano nel tuo codice e li esegui tu; i server tool girano sull'infrastruttura di Anthropic e il risultato arriva già prodotto")},

 {"tipo": "chiusura",
  "titolo": "Tre frasi da ricordare",
  "corpo": """Se ne ricordi una sola, ricorda la prima.

Questo modulo sblocca il prossimo: contare quante richieste servono perché una chiamata a uno strumento arrivi in fondo.""",
  "punti": [
    "Il modello non esegue: produce un blocco `tool_use` e si ferma.",
    "Di uno strumento vede `description` e `input_schema`, e nient'altro. Mai il codice.",
    "Quando uno strumento non viene chiamato, guarda per prima cosa descrizione e schema.",
  ],
  "punti_stile": "elenco", "approfondimento": None, "immagine": None},
]


MODULO["mod-mcp-02"] = {"prerequisiti_testo": """Una definizione di strumento ha tre parti: `name`, `description`, `input_schema`. Il modello non esegue niente: produce un testo strutturato che chiede un'operazione.

Serve anche sapere che una conversazione con l'API non ha memoria propria. Ogni richiesta rispedisce tutta la conversazione dall'inizio. Il server non conserva niente fra una chiamata e l'altra."""}

SLIDES["mod-mcp-02"] = [
 {"tipo": "apertura",
  "titolo": "Prima di partire",
  "corpo": """Alla fine sai contare quante richieste all'API servono perché il modello risponda usando uno strumento. E sai dire cosa c'è dentro ciascuna, e chi la scrive.

Due cose vanno tenute ferme. Il modello non esegue: chiede. E l'API non ricorda: quello che sembra un dialogo continuo è una sequenza di richieste indipendenti.

Ognuna si porta dietro tutto il passato.""",
  "punti": [], "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "Due richieste, non una",
  "corpo": """La domanda «quante richieste servono» ha una risposta secca, ed è due. Non una. Non «dipende».

Due per una singola chiamata a uno strumento. Tre per due chiamate in sequenza: una richiesta in più per ogni giro.

Contarle rende visibili due cose: il costo, e il punto in cui il tuo codice deve muoversi.""",
  "punti": [
    "Nella prima richiesta metti `tools` con le definizioni complete e `messages` con il messaggio dell'utente. Torna `stop_reason: \"tool_use\"`.",
    "In mezzo si esce dall'API. Il tuo programma legge il blocco `tool_use` ed esegue l'operazione.",
    "Nella seconda richiesta rispedisci tutto, più il risultato. Torna il testo che leggi, con `stop_reason: \"end_turn\"`.",
  ],
  "punti_stile": "numerato", "approfondimento": None,
  "immagine": img("due-richieste-timeline", "B", "wide",
    "Due richieste all'API per una sola chiamata a uno strumento: la prima torna con stop_reason tool_use, in mezzo il tuo codice esegue, la seconda torna con il testo finale")},

 {"tipo": "concetto",
  "titolo": "Cosa torna dalla prima",
  "corpo": """La risposta alla prima richiesta non è testo finale. Vale la pena guardarla: è la forma che il tuo codice deve saper leggere.

`stop_reason` vale `"tool_use"`. Il `content` non è una stringa: è un array di blocchi. Di solito c'è un blocco `text` con quello che il modello dice a voce alta. E poi un blocco `tool_use` con tre campi: `id`, `name` e `input`.

A questo punto il turno del modello è finito. La richiesta HTTP è chiusa e nessuno sta aspettando. Se non fai nient'altro, non succede nient'altro.""",
  "punti": [], "punti_stile": "elenco",
  "approfondimento": ap("Più strumenti in un turno solo",
    """Il `content` può contenere più blocchi `tool_use` insieme. Il modello chiede tre operazioni in parallelo e il tuo codice le esegue tutte prima di rispondere.

I risultati tornano dentro un unico messaggio. L'ordine in cui li metti non conta: conta l'identificatore che li accoppia."""),
  "immagine": None},

 {"tipo": "esempio",
  "titolo": "La seconda richiesta aperta",
  "corpo": """Tre messaggi, e il terzo è quello che si sbaglia sempre. Insieme ai messaggi rispedisci anche `tools`, identico a prima. Non è un residuo: dice al modello cosa può ancora chiamare.""",
  "punti": [
    "Il messaggio `assistant` è quello che il modello ti ha appena mandato, riportato tale e quale. Contiene il blocco `tool_use` con il suo `id`.",
    "Il messaggio nuovo ha `role: \"user\"`. Non `tool`, non `assistant`. È un messaggio utente, anche se il contenuto l'hai prodotto tu.",
    "Dentro c'è un blocco `tool_result` con tre campi: `tool_use_id`, `content` e `is_error`.",
  ],
  "punti_stile": "numerato",
  "approfondimento": ap("Quando l'esecuzione fallisce",
    """`is_error: true`, col messaggio d'errore dentro `content`, è meglio che non rimandare niente. Il modello legge l'errore e può correggere i parametri e riprovare.

Se gli rimandi un risultato finto, prosegue convinto che l'operazione sia riuscita. L'errore ricompare tre turni dopo, come risposta sbagliata di cui non si capisce l'origine."""),
  "immagine": img("seconda-richiesta-json", "A", "wide",
    "L'array messages della seconda richiesta: il messaggio utente, il messaggio assistant con il blocco tool_use, e un secondo messaggio con ruolo user che contiene il tool_result")},

 {"tipo": "concetto",
  "titolo": "L'identificatore è il legame",
  "corpo": """Il blocco `tool_use` porta un `id`. Il blocco `tool_result` riporta esattamente quel valore in `tool_use_id`.

Non è una formalità. È l'unico legame che esiste fra una richiesta e il suo risultato.""",
  "punti": [
    "Se il modello ha chiesto tre strumenti in parallelo, i tre risultati tornano dentro un unico messaggio `user`.",
    "L'unico modo di sapere quale risultato appartiene a quale richiesta è l'identificatore, non l'ordine.",
    "Un `tool_use_id` sbagliato non dà un errore di sintassi. Dà una risposta costruita sul risultato dello strumento sbagliato.",
  ],
  "punti_stile": "elenco", "approfondimento": None,
  "immagine": img("tool-use-e-tool-result", "B", "spot",
    "Il blocco tool_use porta un id e il blocco tool_result riporta lo stesso valore in tool_use_id: è questo che accoppia la richiesta al suo risultato")},

 {"tipo": "trappola",
  "titolo": "Tre errori ricorrenti",
  "corpo": """Sono sempre gli stessi tre, e nessuno dà un messaggio d'errore che lo nomini. Si manifestano come risposte strane, non come eccezioni.""",
  "punti": [
    "`role: \"tool\"` in questa API non esiste. Il risultato di uno strumento viaggia dentro un messaggio con ruolo `user`.",
    "Le definizioni vanno rispedite. Se ometti `tools` nella seconda richiesta, il modello smette di usare gli strumenti a metà conversazione.",
    "Il messaggio assistant non si salta. Senza il blocco `tool_use` che lo precede, il `tool_result` risponde a una domanda mai fatta.",
  ],
  "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "Cosa rende visibile il conteggio",
  "corpo": """Contare le richieste mostra una cosa che di solito si scopre guardando il consumo. La seconda richiesta non è più leggera della prima. È la prima, più altre due cose.""",
  "punti": [
    "Le definizioni degli strumenti le rispedisci a ogni richiesta, non una volta sola. Una `description` lunga la paghi tutte le volte.",
    "Il contenuto restituito dallo strumento entra nella finestra e ci resta. Un file letto una volta te lo porti fino alla fine.",
    "Tre chiamate in una conversazione sono quattro richieste, e ognuna pesa più della precedente.",
  ],
  "punti_stile": "elenco",
  "approfondimento": ap("Dove si recupera",
    """Due leve, su metà diverse del problema. Il prompt caching abbatte il costo della parte che non cambia. Le definizioni degli strumenti sono il caso da manuale: identiche a ogni richiesta e all'inizio del prompt.

Restituire meno roba dallo strumento agisce sull'altra metà. Un `tool_result` con duecento righe di JSON quando ne servivano tre te lo porti dietro per tutta la conversazione."""),
  "immagine": img("costo-che-cresce", "B", "spot",
    "Il carico della seconda richiesta è più grande della prima: le definizioni degli strumenti vengono rispedite ogni volta, insieme al blocco tool_use e al risultato dello strumento")},

 {"tipo": "chiusura",
  "titolo": "Tre frasi da ricordare",
  "corpo": """La seconda è quella che fa risparmiare più tempo in fase di debug.

Questo modulo apre la parte di MCP in cui lo stesso giro diventa un protocollo. Sono `tools/list` e `tools/call`, verso un server che non hai scritto tu.""",
  "punti": [
    "Due richieste per una chiamata a uno strumento. Una in più per ogni giro.",
    "Fra le due la richiesta HTTP è chiusa. Se il tuo codice non esegue, non succede niente.",
    "`tool_use_id` accoppia richiesta e risultato. L'ordine non conta.",
  ],
  "punti_stile": "elenco", "approfondimento": None, "immagine": None},
]
