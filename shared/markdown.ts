// Renderer markdown minimo, senza dipendenze.
//
// Copre il sottoinsieme che i moduli usano davvero: titoli, paragrafi,
// grassetto, corsivo, codice inline, blocchi recintati, elenchi puntati e
// numerati, citazioni, link e linea orizzontale.
//
// Sicurezza: l'input viene escapato prima di ogni sostituzione, quindi
// nell'output non puo' finire HTML che non sia stato generato qui.

export interface OpzioniMarkdown {
  /** Livello del primo titolo: "##" diventa h2 con 2 (default), h3 con 3. */
  livelloTitoloBase?: number;
}

function escapeHtml(testo: string): string {
  return testo
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Un link passa solo se punta a http, https, mailto, un'ancora o una rotta interna. */
function urlSicuro(url: string): string | null {
  const pulito = url.trim();
  if (/^(https?:\/\/|mailto:|#|\/)/i.test(pulito)) return pulito;
  return null;
}

/**
 * Formattazione dentro una riga. L'input e' gia' escapato.
 * Il codice inline viene estratto per primo e reinserito alla fine, cosi' gli
 * asterischi dentro un frammento di codice non diventano grassetto.
 */
const SEGNAPOSTO = (i: number) => "@@md-code-" + i + "@@";

function inline(testo: string): string {
  const codici: string[] = [];
  // Un frammento di codice puo' essere delimitato da uno o piu' backtick di
  // fila: "``!`comando```" serve proprio a mostrare un backtick dentro il codice.
  let html = testo.replace(/(`+)(.+?)\1/g, (_m, _recinto: string, codice: string) => {
    const pulito = codice.replace(/^ (.*) $/, "$1");
    codici.push("<code>" + pulito + "</code>");
    return SEGNAPOSTO(codici.length - 1);
  });

  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (intero, etichetta: string, url: string) => {
    const href = urlSicuro(url);
    if (!href) return intero;
    return '<a href="' + escapeHtml(href) + '" target="_blank" rel="noreferrer">' + etichetta + "</a>";
  });

  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

  return html.replace(/@@md-code-(\d+)@@/g, (_m, i: string) => codici[Number(i)] ?? "");
}

export function renderMarkdown(sorgente: string, opzioni: OpzioniMarkdown = {}): string {
  if (!sorgente) return "";
  const base = opzioni.livelloTitoloBase ?? 2;

  const righe = escapeHtml(sorgente.replace(/\r\n/g, "\n")).split("\n");
  const out: string[] = [];

  let paragrafo: string[] = [];
  let lista: { tipo: "ul" | "ol"; voci: string[] } | null = null;
  let citazione: string[] = [];
  let codice: string[] | null = null;
  let tabella: { intestazione: string[]; righe: string[][] } | null = null;

  function chiudiParagrafo() {
    if (paragrafo.length === 0) return;
    out.push("<p>" + inline(paragrafo.join(" ")) + "</p>");
    paragrafo = [];
  }
  function chiudiLista() {
    if (!lista) return;
    const voci = lista.voci.map((v) => "<li>" + inline(v) + "</li>").join("");
    out.push("<" + lista.tipo + ">" + voci + "</" + lista.tipo + ">");
    lista = null;
  }
  function chiudiCitazione() {
    if (citazione.length === 0) return;
    out.push("<blockquote><p>" + inline(citazione.join(" ")) + "</p></blockquote>");
    citazione = [];
  }
  function chiudiTabella() {
    if (!tabella) return;
    const intestazione = tabella.intestazione.map((c) => "<th>" + inline(c) + "</th>").join("");
    const corpo = tabella.righe
      .map((r) => "<tr>" + r.map((c) => "<td>" + inline(c) + "</td>").join("") + "</tr>")
      .join("");
    out.push("<table><thead><tr>" + intestazione + "</tr></thead><tbody>" + corpo + "</tbody></table>");
    tabella = null;
  }
  function chiudiTutto() {
    chiudiParagrafo();
    chiudiLista();
    chiudiCitazione();
    chiudiTabella();
  }

  for (const riga of righe) {
    const recinto = riga.match(/^\s*```/);
    if (recinto) {
      if (codice === null) {
        chiudiTutto();
        codice = [];
      } else {
        out.push("<pre><code>" + codice.join("\n") + "</code></pre>");
        codice = null;
      }
      continue;
    }
    if (codice !== null) {
      codice.push(riga);
      continue;
    }

    if (riga.trim() === "") {
      chiudiTutto();
      continue;
    }

    // tabella: righe che cominciano e finiscono con una barra verticale
    if (/^\s*\|.*\|\s*$/.test(riga)) {
      const celle = riga.trim().slice(1, -1).split("|").map((c) => c.trim());
      const separatore = celle.every((c) => /^:?-{2,}:?$/.test(c));
      if (!tabella) {
        chiudiParagrafo();
        chiudiLista();
        chiudiCitazione();
        tabella = { intestazione: celle, righe: [] };
      } else if (!separatore) {
        tabella.righe.push(celle);
      }
      continue;
    }
    chiudiTabella();

    const titolo = riga.match(/^(#{1,6})\s+(.*)$/);
    if (titolo) {
      chiudiTutto();
      const livello = Math.min(6, base + (titolo[1] ?? "").length - 2);
      out.push("<h" + livello + ">" + inline((titolo[2] ?? "").trim()) + "</h" + livello + ">");
      continue;
    }

    if (/^\s*(---|\*\*\*|___)\s*$/.test(riga)) {
      chiudiTutto();
      out.push("<hr />");
      continue;
    }

    const puntata = riga.match(/^\s*[-*+]\s+(.*)$/);
    const numerata = riga.match(/^\s*\d+[.)]\s+(.*)$/);
    if (puntata || numerata) {
      chiudiParagrafo();
      chiudiCitazione();
      const tipo = puntata ? "ul" : "ol";
      if (lista && lista.tipo !== tipo) chiudiLista();
      if (!lista) lista = { tipo, voci: [] };
      lista.voci.push(((puntata ? puntata[1] : numerata![1]) ?? "").trim());
      continue;
    }

    const citata = riga.match(/^\s*&gt;\s?(.*)$/);
    if (citata) {
      chiudiParagrafo();
      chiudiLista();
      citazione.push((citata[1] ?? "").trim());
      continue;
    }

    if (lista && /^\s{2,}\S/.test(riga)) {
      lista.voci[lista.voci.length - 1] = (lista.voci[lista.voci.length - 1] ?? "") + " " + riga.trim();
      continue;
    }

    chiudiLista();
    chiudiCitazione();
    paragrafo.push(riga.trim());
  }

  if (codice !== null) out.push("<pre><code>" + codice.join("\n") + "</code></pre>");
  chiudiTutto();

  return out.join("\n");
}
