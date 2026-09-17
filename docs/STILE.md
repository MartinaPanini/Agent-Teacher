# Agent Teacher — come si scrivono i testi

Vincolo, non consiglio. Vale per tutto ciò che finisce a schermo: `sintesi_md`,
`obiettivo`, `prerequisiti_testo`, `titolo`, le domande, i messaggi
dell'interfaccia. Chi genera un modulo — routine Cowork o Claude Code — rispetta
queste regole e passa la checklist finale prima di scrivere in `data/`.

Il criterio sopra tutti: **si legge una volta sola e si capisce**. Un testo che
va riletto è un testo da riscrivere, anche quando è corretto.

---

## 1. Frase e paragrafo

- Una frase dice una cosa sola. Massimo 25 parole. Se ne servono di più, è
  perché sono due frasi.
- Al massimo una subordinata per frase. Niente incisi dentro incisi.
- Paragrafi da 2 a 4 frasi, separati da riga vuota. Un paragrafo di otto righe
  va spezzato, sempre.
- Verbo attivo e presente indicativo: "il modello rilegge tutta la
  conversazione", non "la conversazione viene riletta dal modello".
- Seconda persona singolare quando si parla di chi legge: "quando apri una
  sessione". Mai "l'utente", mai il "noi" didattico.

## 2. Parole da non usare

Il burocratese allunga e non aggiunge. A sinistra quello che non si scrive, a
destra la sostituzione:

| No | Sì |
|---|---|
| al fine di, allo scopo di | per |
| effettuare, eseguire una modifica | fare, modificare |
| in merito a, relativamente a | su |
| è possibile che, si può notare che | (togli, e dillo) |
| risulta essere | è |

Vietati anche: "sostanzialmente", "di fatto", "sinergia", "paradigma",
"in questa sezione vedremo". Se una frase regge senza l'avverbio, l'avverbio
non serviva.

## 3. Titoli di sezione

- Da 3 a 6 parole, senza punto finale, maiuscola solo alla prima parola e ai
  nomi propri.
- Dicono che cosa si impara lì dentro: "Grande non vuol dire meglio" va bene,
  "Approfondimento" no.
- Il primo titolo di una sintesi è `##`. Sotto, `###`. Mai `#`.
- Una sintesi ha da 2 a 4 sezioni. Se ne servono sei, il modulo contiene due
  moduli.

## 4. Grassetto, corsivo, codice

- **Grassetto**: solo sul termine tecnico la prima volta che compare, o sulla
  frase che regge il modulo. Al massimo uno per paragrafo. Il grassetto usato
  per enfasi generica non si vede più, e allora non serve a niente.
- *Corsivo*: solo per una citazione breve o per una parola usata come parola.
- `Codice`: nomi di file, comandi, campi, valori. Mai per enfasi.
- I blocchi recintati portano sempre il linguaggio (```yaml, ```bash) e non
  superano le 12 righe.

## 5. Inglese e termini tecnici

- I termini tecnici restano in inglese e invariati al plurale: i token, i tool,
  i prompt, due subagent. Mai "i tokens", mai "tokenizzare" se esiste un modo
  più semplice di dirlo.
- Un termine tecnico si spiega la prima volta che compare, in mezza riga, e poi
  si usa e basta.
- **Al massimo una citazione in inglese per modulo**, e solo quando la formula
  originale conta. Le altre si traducono in italiano e si attribuiscono alla
  fonte: la documentazione dice che la finestra di contesto è la memoria di
  lavoro del modello — non un paragrafo in inglese lasciato intero.

## 6. Ortografia e numeri

- Lettere accentate vere: perché, più, così, è, già, poiché. Mai `perche'`,
  mai `piu'`. Vale anche nei titoli dei moduli e nei campi JSON.
- Apostrofo tipografico non richiesto: va bene `'`, purché sia un apostrofo e
  non un accento.
- Numeri in cifre da 10 in su, in lettere sotto: "tre sezioni", "15 minuti".
- Date in cifre: 16/09/2026. Unità con lo spazio: 30 min, 200 K token.
- Elenchi da 2 a 5 voci. Sei voci diventano una tabella o due paragrafi.

## 7. Come si apre e come si chiude una sintesi

- **Prima frase**: l'affermazione che il modulo dimostra, non un'introduzione.
  "La finestra di contesto è la scrivania del modello, non la sua memoria"
  apre bene. "In questo modulo parleremo della finestra di contesto" no.
- **Ultimo paragrafo**: che cosa cambia nella pratica, in due o tre frasi.
  Una cosa che si fa o si smette di fare, non un riepilogo di quanto letto.
- Lunghezza: 900-1300 parole per modulo nel formato a slide, esclusi gli
  approfondimenti. Semplificare la forma non vuol dire allungare il testo: di
  solito lo accorcia.

## 8. Obiettivo, prerequisiti, domande

- `obiettivo`: una frase, verificabile, che inizia con "Alla fine sai".
- `prerequisiti_testo`: si spiega il concetto, non si rimanda a un altro
  modulo. Stesse regole di frase e paragrafo.
- `domande`: la domanda descrive una situazione concreta e chiede una
  decisione. Niente definizioni a memoria.

## 9. Checklist prima di scrivere in data/

1. Nessuna frase supera le 25 parole.
2. Nessun paragrafo supera le 4 frasi.
3. Ogni titolo di sezione dice che cosa si impara.
4. Al massimo una citazione in inglese, e nessun paragrafo inglese intero.
5. Accenti corretti ovunque, titolo del modulo compreso.
6. Un solo grassetto per paragrafo.
7. L'ultimo paragrafo dice che cosa cambia nella pratica.
8. Letto una volta sola: si capisce.

---

## 10. Il formato a slide

Vale da AT-specifiche §15 in poi. Le regole 1-8 restano tutte; queste si
aggiungono.

- Otto slide per modulo, una idea per slide. Massimo 150 parole di corpo per
  slide, titolo da 3 a 6 parole.
- Il titolo della slide segue la regola 3: dice che cosa si impara lì dentro.
- I punti numerati si usano solo quando l'immagine porta gli stessi numeri.
  Altrimenti elenco puntato.
- Niente etichetta in grassetto a inizio voce di elenco. La regola 4 vale anche
  qui: un solo grassetto per paragrafo, e sul termine tecnico, non sull'etichetta.
- L'approfondimento è testo facoltativo che sta fuori dai dieci minuti. Ci va la
  risposta alla domanda «sì, ma perché».

## 11. Controllo automatico

`python3 scripts/controlla-stile.py` verifica meccanicamente le regole 1-8 e
10, più i tell da IA che questa guida non nomina: lineette, elenchi con
etichetta in grassetto, parole che un modello usa più di una persona,
virgolette ricurve, emoji.

Esce con 1 se trova qualcosa. Va passato prima di scrivere in `data/`, e la
checklist della regola 9 resta per quello che una macchina non può controllare:
se il testo, letto una volta sola, si capisce.

## 12. I tell da IA, in chiaro

La skill `humanizer` copre questi punti. Sono scritti qui perché una routine
che gira da sola potrebbe non avere quella skill caricata, e le regole devono
valere lo stesso. `scripts/controlla-stile.py` ne verifica meccanicamente la
maggior parte.

1. **Lineette come pausa.** `—` e `–` non si usano al posto di un punto, di
   una virgola o dei due punti. Riscrivi la frase.
2. **Elenchi con etichetta in grassetto.** Niente `**Cosa:** spiegazione` a
   inizio voce. Scrivi la voce come una frase.
3. **Grassetto sparso.** Uno per paragrafo, sul termine tecnico la prima volta
   che compare. Il grassetto usato per enfasi generica non si vede più.
4. **Parole che un modello usa più di una persona**: fondamentale, cruciale,
   approfondire, sottolineare, evidenziare, panorama, testimonianza,
   affascinante, funge da, si configura come, nel cuore di.
5. **Zeppe e finte rivelazioni**: al fine di, in termini di, è importante
   notare che, in sostanza, la vera domanda è, vediamo insieme, analizziamo.
6. **Gruppi di tre forzati.** Tre voci vanno bene se sono tre. Non aggiungere
   la terza per chiudere il ritmo.
7. **Il titolo ripetuto nella prima frase.** Dopo un titolo, la prima riga
   dice qualcosa di nuovo.
8. **Chiusure vaghe.** Niente "il futuro è promettente" o "un passo nella
   direzione giusta". Si chiude sull'ultimo fatto concreto.
9. **Obiezioni che nessuno ha sollevato**: "non sto dicendo che", "per essere
   chiari", "si potrebbe obiettare". Se c'è una tesi, dilla.
10. **Alternative finte**: "si potrebbe pensare di X, ma". Se nessuno lo
    farebbe, non nominarlo.
11. **Virgolette ricurve ed emoji.** Virgolette dritte o caporali `«»`, e
    nessuna emoji.
12. **Frasi drammatiche in fila.** Una frase corta dà enfasi. Quattro di
    seguito sembrano costruite.

Quello che invece va tenuto: le frasi di lunghezza diversa, un'obiezione con
la sua fonte, un limite dichiarato, una citazione attribuita. Non sono tell,
sono scrittura.
