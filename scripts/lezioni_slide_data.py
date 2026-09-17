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

Contarle rende visibili due cose: il costo, e il punto in cui il tuo codice deve muoversi.

È anche il motivo per cui un agente che usa molti strumenti sembra lento. Non sta pensando di più: sta facendo più giri.""",
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
  "corpo": """Tre messaggi, e il terzo è quello che si sbaglia sempre. Insieme ai messaggi rispedisci anche `tools`, identico a prima. Non è un residuo: dice al modello cosa può ancora chiamare.

I primi due messaggi non li scrivi tu in questo turno. Il primo è quello dell'utente, il secondo te l'ha appena mandato il modello.""",
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

Non è una formalità. È l'unico legame che esiste fra una richiesta e il suo risultato.

Se ne perdi uno, l'API non se ne accorge sempre. Il modello sì, ma se ne accorge rispondendo male.""",
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
  "corpo": """Sono sempre gli stessi tre, e nessuno dà un messaggio d'errore che lo nomini. Si manifestano come risposte strane, non come eccezioni.

Vale la pena impararli a memoria: costano ore la prima volta che capitano.""",
  "punti": [
    "`role: \"tool\"` in questa API non esiste. Il risultato di uno strumento viaggia dentro un messaggio con ruolo `user`.",
    "Le definizioni vanno rispedite. Se ometti `tools` nella seconda richiesta, il modello smette di usare gli strumenti a metà conversazione.",
    "Il messaggio assistant non si salta. Senza il blocco `tool_use` che lo precede, il `tool_result` risponde a una domanda mai fatta.",
  ],
  "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "Cosa rende visibile il conteggio",
  "corpo": """Contare le richieste mostra una cosa che di solito si scopre guardando il consumo. La seconda richiesta non è più leggera della prima. È la prima, più altre due cose.

Il grafico del costo di una conversazione con strumenti non è una retta. Ogni giro parte da dove è finito il precedente.""",
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


MODULO["mod-llm-02"] = {"prerequisiti_testo": """Un modello non ha memoria fra una richiesta e l'altra. Tutto quello che deve sapere glielo rispedisci ogni volta dentro la richiesta.

Serve anche sapere cos'è un token. È l'unità in cui il testo viene spezzato prima di arrivare al modello. In inglese una parola comune sta in un token, una parola lunga in due o tre."""}

SLIDES["mod-llm-02"] = [
 {"tipo": "apertura",
  "titolo": "Prima di partire",
  "corpo": """Alla fine sai elencare tutto quello che occupa la finestra di contesto in una richiesta vera. E sai spiegare perché il conto dei token di input cresce a ogni turno.

La finestra di contesto è tutto il testo che il modello può consultare mentre scrive la risposta, risposta compresa. È la memoria di lavoro di una richiesta sola.

Non c'entra niente con i dati su cui il modello è stato addestrato.""",
  "punti": [], "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "Cosa ci finisce dentro",
  "corpo": """Tutto quello che parte insieme alla richiesta, in quest'ordine.

L'elenco risponde alla domanda «perché la sessione è già piena e non ho fatto quasi niente».

La finestra ha un limite dichiarato dal modello. Superarlo non tronca in silenzio: la richiesta viene rifiutata con un errore.""",
  "punti": [
    "Le definizioni degli strumenti, non solo i loro risultati. Un agente con venti strumenti le porta dentro prima del tuo primo messaggio.",
    "Il system prompt, per intero.",
    "Ogni messaggio dentro `messages`: risultati degli strumenti, immagini e documenti compresi.",
    "L'output che il modello genera in questo turno, ragionamento esteso compreso.",
  ],
  "punti_stile": "numerato", "approfondimento": None,
  "immagine": img("finestra-cosa-contiene", "B", "spot",
    "Cosa occupa la finestra di contesto, dall'alto: definizioni degli strumenti, system prompt, turni precedenti interi, risultati degli strumenti e l'output di questo turno")},

 {"tipo": "esempio",
  "titolo": "La stessa cosa in JSON",
  "corpo": """Lo stesso elenco, visto nel corpo di una richiesta. Non c'è niente di nascosto: quello che leggi qui è quello che il modello riceve.

L'ordine dei campi non è casuale. Conta quando entra in gioco la cache, che legge il prompt dall'inizio.""",
  "punti": [
    "`tools` sta per primo. Venti definizioni scritte bene sono migliaia di token, e viaggiano prima di ogni altra cosa.",
    "`system` viene dopo, ed è di solito stabile per tutta la conversazione.",
    "`messages` contiene i turni, interi. Nessuno li riassume per te.",
  ],
  "punti_stile": "numerato", "approfondimento": None,
  "immagine": img("richiesta-anatomia", "A", "wide",
    "Il corpo di una richiesta in Visual Studio Code: il campo tools con venti definizioni, il system prompt e l'array messages con tutti i turni precedenti riportati per intero")},

 {"tipo": "concetto",
  "titolo": "Perché cresce a ogni turno",
  "corpo": """I turni precedenti restano interi. Messaggi e risposte si accumulano finché la conversazione si avvicina al limite.

La stessa domanda, fatta al primo turno e al decimo, costa in input due cifre molto diverse.

Non è che il modello si ricorda e quindi paga di più. È il contrario: non ricorda niente, quindi gli rispedisci tutto, e quel tutto nel frattempo è cresciuto.""",
  "punti": [
    "Il blocco fisso, definizioni e system prompt, non cresce. Ma lo rispedisci a ogni giro.",
    "Lo storico cresce a ogni scambio e non si riduce da solo.",
    "Anche i turni in cui non è successo niente restano lì, per intero.",
  ],
  "punti_stile": "elenco",
  "approfondimento": ap("Perché non lo riassume da solo",
    """Riassumere la conversazione sarebbe una scelta, e l'API non la prende al posto tuo. Un riassunto butta via qualcosa, e solo tu sai cosa puoi permetterti di perdere.

Il risultato è che la compattazione è un lavoro tuo o del client che stai usando. Claude Code la fa, una libreria scritta a mano di solito no."""),
  "immagine": img("finestra-cresce-per-turno", "B", "wide",
    "Tre barre, al primo, al quinto e al decimo turno: la parte fissa resta uguale mentre lo storico accumulato allunga la richiesta")},

 {"tipo": "concetto",
  "titolo": "Ragionamento e strumenti",
  "corpo": """I token di ragionamento occupano la finestra e si pagano come output. Sui modelli recenti i blocchi di ragionamento dei turni precedenti restano, e contano come input.

Quando ragionamento e strumenti lavorano insieme c'è un vincolo pratico. Insieme al `tool_result` devi rimandare il blocco di ragionamento intero e non modificato, firma compresa. L'API lo verifica.

Alcuni modelli sanno quanto spazio resta. Ricevono il budget di token e un aggiornamento dopo ogni chiamata a uno strumento. Serve a portare a termine un compito lungo senza tirare a indovinare.

Sui modelli più vecchi l'API toglieva da sola i blocchi di ragionamento passati. Non dare per scontato il comportamento: cambia da un modello all'altro.""",
  "punti": [], "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "trappola",
  "titolo": "La sessione già piena",
  "corpo": """Apri una sessione nuova, scrivi due righe, e il conto dei token di input è già alto. Sembra un errore. Non lo è.

Quello che hai spedito non sono le tue due righe. Sono le due righe più tutto il resto.

Il conto si rifà in trenta secondi, e quasi sempre il colpevole è uno solo.""",
  "punti": [
    "Guarda per prima cosa quante definizioni di strumenti sono registrate.",
    "Poi la lunghezza del system prompt, che spesso nessuno rilegge da settimane.",
    "Le tue due righe sono l'ultima voce della lista, non la prima.",
    "Se la sessione riparte da un riassunto, controlla quanto è lungo quel riassunto.",
  ],
  "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "Quanto costa uno strumento",
  "corpo": """Prima di aggiungere uno strumento a un agente, guarda quanto pesa la sua definizione. La paghi a ogni turno, anche in quelli in cui lo strumento non serve.

Venti strumenti descritti bene sono un secondo system prompt, spedito a ogni richiesta.

Non è un motivo per scrivere descrizioni povere. Una descrizione corta che non viene capita costa comunque, e in più non funziona.

È un motivo per tenerne pochi e buoni, e per togliere quelli che non chiami mai.""",
  "punti": [], "punti_stile": "elenco",
  "approfondimento": ap("Il conto che non torna",
    """Quando una sessione lunga inizia a rispondere peggio, controlla quanto è cresciuto l'input prima di dare la colpa al modello.

Il numero da guardare non è quello che hai scritto tu nell'ultimo turno. È il totale dei token di input della richiesta, che comprende gli strumenti, il system prompt e tutti i turni precedenti."""),
  "immagine": None},

 {"tipo": "chiusura",
  "titolo": "Tre frasi da ricordare",
  "corpo": """Il modulo dopo parte da qui. Quando l'input cresce, la qualità cala, e quel degrado ha un nome: context rot.

Prima di arrivarci, tieni la prima frase: la finestra appartiene alla richiesta, non al modello.""",
  "punti": [
    "La finestra è la memoria di lavoro di una richiesta, non del modello.",
    "Ci sta dentro tutto: strumenti, system prompt, turni interi, output di adesso.",
    "Cresce perché il modello non ricorda, non perché ricorda.",
  ],
  "punti_stile": "elenco", "approfondimento": None, "immagine": None},
]


MODULO["mod-llm-03"] = {"prerequisiti_testo": """Serve sapere cosa occupa la finestra di contesto. Ci stanno il system prompt, le definizioni degli strumenti, tutti i turni precedenti conservati per intero, i risultati degli strumenti e l'output del turno.

Serve sapere che i turni precedenti non vengono riassunti da soli: si accumulano.

Non serve conoscere l'architettura dei transformer. Basta sapere che il meccanismo di attenzione mette in relazione ogni token con ogni altro token della sequenza."""}

SLIDES["mod-llm-03"] = [
 {"tipo": "apertura",
  "titolo": "Prima di partire",
  "corpo": """Alla fine sai spiegare perché la qualità delle risposte cala al crescere del contesto. E sai indicare quale rimedio attacca la causa e quale no.

Il fenomeno si chiama context rot. Quando i token nella finestra crescono, la capacità del modello di richiamare le informazioni con precisione cala.

Succede su tutti i modelli. Alcuni degradano più dolcemente, nessuno è immune.

Non è un difetto da segnalare né un bug che qualcuno sistemerà. È una proprietà di come funziona l'attenzione, e si gestisce.""",
  "punti": [], "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "Grande non vuol dire meglio",
  "corpo": """«Ci sta tutto dentro» e «lo userà bene» sono due affermazioni diverse. La seconda non segue dalla prima.

È il punto che rende il context rot controintuitivo. Una finestra da 200.000 token sembra una promessa di qualità, e invece è solo una promessa di capienza.

Il contesto è una risorsa con rendimenti decrescenti, non un contenitore da riempire. Le prime pagine che gli dai valgono più delle ultime.""",
  "punti": [
    "La domanda prima di aggiungere qualcosa non è «ci sta?».",
    "È: «questo aumenta o diluisce la probabilità che il modello faccia la cosa giusta?».",
  ],
  "punti_stile": "elenco", "approfondimento": None,
  "immagine": img("finestra-cresce-per-turno", "B", "wide",
    "Tre barre, al primo, al quinto e al decimo turno: la parte fissa resta uguale mentre lo storico accumulato allunga la richiesta")},

 {"tipo": "concetto",
  "titolo": "Da dove viene il degrado",
  "corpo": """Due cause, entrambe strutturali. Nessuna delle due si risolve con un prompt scritto meglio.

L'attenzione cresce in modo quadratico. Un transformer mette in relazione ogni token con ogni altro token, e quel lavoro è una risorsa finita da spalmare su più materiale.

L'addestramento ha visto soprattutto sequenze corte. I modelli imparano i pattern di attenzione dai dati, e lì le sequenze brevi sono molto più comuni di quelle lunghe.""",
  "punti": [
    "Sulle dipendenze a lunga distanza i modelli hanno semplicemente meno esperienza.",
    "Non è un difetto di un modello singolo: è come sono fatti tutti.",
  ],
  "punti_stile": "elenco",
  "approfondimento": ap("Perché nessun modello è immune",
    """Il degrado si misura, e la differenza fra modelli è di pendenza, non di presenza. Un modello migliore regge più a lungo prima che la qualità scenda in modo visibile.

Questo cambia quando conviene compattare, non se conviene farlo. Trattare «la finestra è grande» come «posso riempirla» resta sbagliato su qualunque modello."""),
  "immagine": img("attenzione-quadratica", "B", "spot",
    "Quattro token formano sei coppie, otto token ne formano ventotto: il lavoro di attenzione cresce con il quadrato dei token, non in proporzione")},

 {"tipo": "concetto",
  "titolo": "I rimedi che funzionano",
  "corpo": """Quattro mosse attaccano la causa, e hanno tutte la stessa forma. Tolgono materiale dalla finestra invece di sperare che il modello lo gestisca.

Due rimedi molto citati non fanno niente di tutto questo. Li trovi nella slide dopo.

Nota che nessuno dei quattro chiede niente al modello. Agiscono tutti su cosa gli arriva.""",
  "punti": [
    "Compattare: riassumi la conversazione e riparti dalla versione compressa, tenendo decisioni prese e bug ancora aperti.",
    "Appunti esterni: l'agente scrive in un file e lo rilegge quando serve, invece di portarsi dietro tutta la storia.",
    "Recupero al momento giusto: niente precaricamento, l'agente apre i dati quando gli servono.",
    "Sottoagenti: un agente separato affronta un compito circoscritto nel proprio contesto e restituisce solo la conclusione.",
  ],
  "punti_stile": "elenco", "approfondimento": None,
  "immagine": img("rimedi-context-rot", "B", "wide",
    "A sinistra i rimedi che attaccano la causa del context rot: compattare, appunti esterni, recupero al momento giusto, sottoagenti. A destra i due che spostano il limite senza toglierlo")},

 {"tipo": "trappola",
  "titolo": "I rimedi che non risolvono",
  "corpo": """Una finestra più grande sposta il limite e non toglie il degrado. È esattamente quello che il fenomeno descrive.

Chiedere al modello di fare più attenzione o di ricordare meglio non agisce su niente di reale. È una frase che suona come un'istruzione e non lo è.""",
  "punti": [
    "Lasciare che un agente esplori da solo una cartella grande riempie la finestra di materiale inutile.",
    "Se conosci il percorso preciso, daglielo: è la differenza fra dieci file letti e uno.",
    "Anche «rileggi le istruzioni iniziali» non aiuta: quelle istruzioni sono già lì dentro, diluite.",
    "Cambiare modello sposta la pendenza del degrado, non lo elimina: il problema torna più avanti.",
  ],
  "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "Come lo riconosci",
  "corpo": """Il sintomo tipico è una sessione lunga che a un certo punto peggiora. Non c'è un errore, non c'è un messaggio: cambia solo la qualità.

Non hai cambiato modello né chiesto qualcosa di più difficile. Si è riempita la finestra.

Il modo più veloce di confermarlo è guardare il conto dei token di input. Se è cresciuto di molto rispetto ai primi turni, hai la risposta.""",
  "punti": [
    "Dimentica un vincolo che avevi dato all'inizio.",
    "Rifà una cosa già fatta, senza accorgersene.",
    "Perde il filo su qualcosa che venti minuti prima aveva chiaro.",
    "Risponde in modo più generico, come se non avesse davanti il materiale che gli hai dato.",
  ],
  "punti_stile": "elenco", "approfondimento": None,
  "immagine": img("sintomo-sessione-lunga", "B", "spot",
    "I tre sintomi di una sessione lunga che degrada: dimentica un vincolo dato all'inizio, rifà una cosa già fatta, perde il filo")},

 {"tipo": "concetto",
  "titolo": "Cosa fare quando succede",
  "corpo": """Quando lo vedi, la mossa giusta è compattare e ripartire. Non insistere con la stessa conversazione.

Riscrivere il contesto costa cinque minuti. Una sessione che degrada ne costa molti di più, e li costa in modo invisibile: non te ne accorgi finché non rileggi.

La compattazione non è una sconfitta. È la manutenzione ordinaria di una sessione lunga.""",
  "punti": [], "punti_stile": "elenco",
  "approfondimento": ap("Cosa tenere quando compatti",
    """Un buon riassunto di sessione tiene tre cose. Le decisioni prese e il perché. I problemi ancora aperti. E i dettagli che non puoi ricostruire: percorsi, nomi, valori.

Butta via il resto: i tentativi falliti, le letture di file che hai già usato, le conferme. Se un dettaglio ti servirà, sta in un file e lo rileggi."""),
  "immagine": None},

 {"tipo": "chiusura",
  "titolo": "Tre frasi da ricordare",
  "corpo": """Il modulo dopo guarda l'altra metà del problema. Se rispedisci tutto a ogni turno, almeno non farlo rielaborare da capo: si chiama prompt caching.""",
  "punti": [
    "Il degrado al crescere del contesto c'è su tutti i modelli.",
    "I rimedi che funzionano tolgono materiale dalla finestra.",
    "Una finestra più grande sposta il limite, non toglie il degrado.",
  ],
  "punti_stile": "elenco", "approfondimento": None, "immagine": None},
]


MODULO["mod-llm-04"] = {"prerequisiti_testo": """Il modello non conserva niente fra una richiesta e l'altra. Ogni turno rispedisci l'intera conversazione, e i token di input crescono a ogni giro.

Serve anche sapere in che ordine è fatta una richiesta. Prima le definizioni degli strumenti, poi il system prompt, poi i messaggi. Quest'ordine conta, perché è l'ordine in cui la cache legge."""}

SLIDES["mod-llm-04"] = [
 {"tipo": "apertura",
  "titolo": "Prima di partire",
  "corpo": """Alla fine sai dire dove va messo un punto di cache. E sai perché spostarlo di un blocco può annullare tutto il risparmio.

Se a ogni turno rispedisci tutta la conversazione, rispedisci anche le stesse migliaia di token di system prompt e di definizioni degli strumenti.

Il prompt caching serve a non farli rielaborare da capo ogni volta. Non riduce quello che spedisci: riduce quello che viene ricalcolato.""",
  "punti": [], "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "Come funziona in due righe",
  "corpo": """Il sistema controlla se il prefisso del prompt, fino al punto che hai marcato, combacia con una richiesta recente.

Se combacia, riusa la versione in cache. Altrimenti elabora tutto e scrive in cache mentre la risposta comincia.

Non c'è niente da gestire lato tuo oltre al punto. Non c'è una chiave, non c'è una scadenza da rinnovare a mano.

La prima richiesta di una conversazione paga sempre la scrittura. Il risparmio comincia dalla seconda, ed è per questo che la cache non serve a niente su una richiesta sola.""",
  "punti": [], "punti_stile": "elenco", "approfondimento": None, "immagine": None},

 {"tipo": "concetto",
  "titolo": "La cache è del prefisso",
  "corpo": """La parola che conta è prefisso. La cache legge il prompt in ordine, e si ferma al blocco marcato.

Non è una cache a pezzi. È una cache dell'inizio della richiesta, e questo spiega quasi tutto il resto del modulo.""",
  "punti": [
    "L'ordine di lettura è `tools`, poi `system`, poi `messages`, fino al blocco marcato incluso.",
    "Cambiare un blocco a quel punto o prima produce un hash diverso, e la corrispondenza non si trova più.",
    "Cambiare qualcosa dopo il punto marcato non tocca la cache: quella parte si rielabora comunque.",
  ],
  "punti_stile": "elenco", "approfondimento": None,
  "immagine": img("cache-prefisso", "B", "wide",
    "La cache legge il prompt in ordine, da tools a system ai messaggi, fino al blocco marcato con cache_control: quel tratto iniziale è il prefisso riusato")},

 {"tipo": "concetto",
  "titolo": "Tre regole che bastano",
  "corpo": """Da qui discende tutto il comportamento che vedrai nei conti. Vale la pena impararle in quest'ordine, perché la seconda ha senso solo dopo la prima.

Esiste anche una variante da un'ora, e ogni riuso rinfresca la cache senza costo. Finché la conversazione va avanti, il tempo di vita si rinnova da solo.""",
  "punti": [
    "La scrittura avviene solo nei punti marcati. Mettere `cache_control` su un blocco scrive una voce sola: l'hash del prefisso che finisce lì.",
    "La lettura guarda all'indietro. Se al tuo punto non c'è corrispondenza, il sistema torna indietro un blocco alla volta, fino a 20 blocchi.",
    "Il tempo di vita parte dall'inizio della richiesta. Il minimo è cinque minuti, e la generazione della risposta ci rientra.",
  ],
  "punti_stile": "elenco",
  "approfondimento": ap("Quando serve un secondo punto",
    """In una conversazione che cresce in fretta, venti blocchi si consumano prima di quanto sembri. Ogni turno aggiunge almeno un messaggio, e con gli strumenti ne aggiunge due o tre.

Un secondo punto di cache più indietro, sul system prompt, dà alla ricerca un posto sicuro dove atterrare. Costa una scrittura in più e salva tutte le letture successive."""),
  "immagine": None},

 {"tipo": "trappola",
  "titolo": "L'errore che annulla tutto",
  "corpo": """Hai un system prompt grande e stabile nei blocchi da uno a cinque. Nel blocco sei c'è un timestamp che cambia a ogni richiesta.

Se marchi il blocco sei, l'hash cambia ogni volta. La ricerca all'indietro non trova mai niente e paghi sempre una scrittura nuova, cioè più del prezzo pieno.

Marcando il blocco cinque, tutto il resto legge dalla cache. Il timestamp resta dov'è, si rielabora ogni volta, e sono pochi token.""",
  "punti": [
    "Il punto di cache va sull'ultimo blocco stabile, non sull'ultimo blocco.",
    "Timestamp, identificatori di sessione e contatori sono i sospetti abituali.",
    "Se qualcosa cambia a ogni richiesta, spostalo dopo il punto di cache invece che prima.",
  ],
  "punti_stile": "elenco", "approfondimento": None,
  "immagine": img("punto-di-cache-sbagliato", "B", "spot",
    "Lo stesso prompt con il punto di cache in due posizioni: sul blocco 6, che contiene un timestamp variabile, non c'è mai corrispondenza; sul blocco 5, l'ultimo stabile, la cache si rilegge")},

 {"tipo": "concetto",
  "titolo": "Quanto costa e cosa la rompe",
  "corpo": """Una lettura costa circa un decimo dell'input normale. Una scrittura costa più dell'input normale.

La cache conviene solo se viene riletta. Una scritta e mai riusata è una perdita secca.

La soglia è bassa: basta una seconda lettura perché il conto torni in pari. Ma vale la pena guardarla davvero, invece di darla per scontata.""",
  "punti": [
    "Scrivere costa 1,25 volte l'input normale per la cache da cinque minuti, il doppio per quella da un'ora.",
    "Sotto certe lunghezze minime la cache non viene scritta affatto, e nessun errore te lo dice.",
    "L'invalidazione segue la gerarchia `tools`, `system`, `messages`: un cambiamento butta via quel livello e tutti i successivi.",
  ],
  "punti_stile": "elenco",
  "approfondimento": ap("Perché aggiungere uno strumento costa",
    """`tools` è il primo livello della gerarchia. Aggiungere o togliere uno strumento a metà sessione cambia quel blocco, e con lui ogni prefisso che lo contiene.

Il risultato è che la conversazione riparte da una scrittura nuova. Se gli strumenti di un agente cambiano spesso, il caching rende molto meno di quanto promette."""),
  "immagine": None},

 {"tipo": "esempio",
  "titolo": "Come si leggono i conti",
  "corpo": """I token di input sono la somma di tre campi, non uno solo. Guardare solo `input_tokens` dà l'impressione di spedire pochissimo.

In questa risposta i token davvero elaborati da zero sono 214. Gli altri 18.432 sono arrivati dalla cache, a un decimo del prezzo.

Senza la cache quella richiesta sarebbe costata circa novanta volte di più in input. È il genere di differenza che si vede in bolletta, non nei tempi di risposta.""",
  "punti": [
    "`input_tokens` conta solo quello che viene dopo l'ultimo punto di cache.",
    "`cache_read_input_tokens` e `cache_creation_input_tokens` contengono tutto il resto, e vanno sommati.",
  ],
  "punti_stile": "numerato", "approfondimento": None,
  "immagine": img("usage-json", "A", "wide",
    "Il blocco usage di una risposta: input_tokens vale 214, ma cache_read_input_tokens ne conta 18.432, e i token di input veri sono la somma dei tre campi")},

 {"tipo": "chiusura",
  "titolo": "Tre frasi da ricordare",
  "corpo": """Il caching è l'unica leva che agisce sul costo senza toccare il contenuto. Tutto il resto passa dal decidere cosa non spedire.

Le due cose si sommano: prima togli quello che non serve, poi metti in cache quello che resta e non cambia.""",
  "punti": [
    "La cache è del prefisso: legge dall'inizio e si ferma al punto marcato.",
    "Il punto va sull'ultimo blocco stabile, non sull'ultimo blocco.",
    "I token di input sono la somma di tre campi, non il valore di `input_tokens`.",
  ],
  "punti_stile": "elenco", "approfondimento": None, "immagine": None},
]
