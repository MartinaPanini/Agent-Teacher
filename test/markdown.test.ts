import { describe, it, expect } from "vitest";
import { renderMarkdown, renderMarkdownInline } from "../shared/markdown.js";

describe("renderMarkdown", () => {
  it("non lascia a schermo i simboli del markup", () => {
    const html = renderMarkdown("## Titolo\n\nUn **grassetto** e un *corsivo*.\n\n- primo\n- secondo\n");
    expect(html).toContain("<h2>Titolo</h2>");
    expect(html).toContain("<strong>grassetto</strong>");
    expect(html).toContain("<em>corsivo</em>");
    expect(html).toContain("<li>primo</li>");
    expect(html).not.toMatch(/(^|>)[^<]*##/);
    expect(html).not.toMatch(/\*\*/);
  });

  it("separa i paragrafi divisi da una riga vuota", () => {
    const html = renderMarkdown("Primo capoverso.\n\nSecondo capoverso.");
    expect(html.match(/<p>/g)).toHaveLength(2);
  });

  it("apre i link in una scheda nuova", () => {
    const html = renderMarkdown("Vedi [la documentazione](https://docs.claude.com).");
    expect(html).toContain('<a href="https://docs.claude.com" target="_blank" rel="noreferrer">la documentazione</a>');
  });

  it("scarta i link con schema non sicuro", () => {
    const html = renderMarkdown("[clicca](javascript:alert(1))");
    expect(html).not.toContain("<a ");
  });

  it("non interpreta il markup dentro il codice", () => {
    const html = renderMarkdown("Scrivi `a ** b` per moltiplicare.");
    expect(html).toContain("<code>a ** b</code>");
    expect(html).not.toContain("<strong>");
  });

  it("rende i blocchi recintati come pre", () => {
    const html = renderMarkdown("```yaml\nname: x\n```");
    expect(html).toContain("<pre><code>name: x</code></pre>");
  });

  it("neutralizza l'HTML presente nel sorgente", () => {
    const html = renderMarkdown("Attenzione <script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("rende le citazioni e gli elenchi numerati", () => {
    const html = renderMarkdown("> una citazione\n\n1. primo\n2. secondo");
    expect(html).toContain("<blockquote><p>una citazione</p></blockquote>");
    expect(html).toContain("<ol><li>primo</li><li>secondo</li></ol>");
  });
});

describe("renderMarkdown, casi presenti nei moduli", () => {
  it("gestisce i frammenti delimitati da piu' backtick", () => {
    const html = renderMarkdown("La sintassi `` !`comando` `` esegue il comando.");
    expect(html).toContain("<code>!`comando`</code>");
    expect(html).not.toMatch(/`[^<]*<\/p>/);
  });
});

describe("renderMarkdown, tabelle", () => {
  it("rende una tabella con intestazione e righe", () => {
    const html = renderMarkdown("| Tipo | Chiede? |\n|---|---|\n| Lettura | No |\n| Scrittura | **Sì** |");
    expect(html).toContain("<table><thead><tr><th>Tipo</th><th>Chiede?</th></tr></thead>");
    expect(html).toContain("<td>Lettura</td><td>No</td>");
    expect(html).toContain("<td><strong>Sì</strong></td>");
    expect(html).not.toContain("|");
  });

  it("chiude la tabella quando il testo riprende", () => {
    const html = renderMarkdown("| A |\n|---|\n| 1 |\n\nUn paragrafo dopo.");
    expect(html).toContain("</table>");
    expect(html).toContain("<p>Un paragrafo dopo.</p>");
  });
});

describe("renderMarkdownInline: per i \"punti\" di una slide (RF56-59)", () => {
  it("formatta l'inline senza avvolgerlo in un paragrafo", () => {
    const html = renderMarkdownInline("Il `matcher` seleziona lo **strumento**, non il comando.");
    expect(html).not.toContain("<p>");
    expect(html).toContain("<code>matcher</code>");
    expect(html).toContain("<strong>strumento</strong>");
  });

  it("neutralizza l'HTML presente nel sorgente", () => {
    const html = renderMarkdownInline("Attenzione <script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
