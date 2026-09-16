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
- Lunghezza: 300-600 parole, come dice la routine. Semplificare la forma non
  vuol dire allungare il testo: di solito lo accorcia.

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
