#!/usr/bin/env python3
"""Genera le illustrazioni SVG delle lezioni in data/illustrations/.

Stile definito in claude/AT-lezioni-slide.md §5.
  A = finestre piatte realistiche (VS Code / Claude Desktop)
  B = linea tecnica (blocchi etichettati, tratto 2px, un accento)

Le immagini sono generate da codice, mai esportate a mano: se lo stile cambia,
si cambia qui e si rigenera tutto.
"""
import os

INK, ACC, SYS, SYSBG, PAPER, MUTE, RULE = (
    "#141413", "#B4563C", "#3F6C6A", "#E7EEED", "#FFFDF8", "#6E6A5E", "#D3CEC0")
MONO = "'IBM Plex Mono', ui-monospace, monospace"
SANS = "'IBM Plex Sans', system-ui, sans-serif"

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "data", "illustrations")


def esc(t):
    """Il testo mostrato puo' contenere <, > e &: in SVG vanno sempre escapati."""
    return (str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def svg(w, h, alt, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'role="img" aria-label="{esc(alt)}">\n'
            f'<title>{esc(alt)}</title>\n'
            f'<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" '
            f'markerWidth="6" markerHeight="6" orient="auto">'
            f'<path d="M0 0 L10 5 L0 10 Z" fill="{ACC}"/></marker></defs>\n'
            f'{body}\n</svg>\n')


def box(x, y, w, h, label, sub=None, kind="ink", dashed=False):
    fill, stroke, tc, sc = PAPER, INK, INK, MUTE
    if kind == "sys":
        fill, stroke, tc, sc = SYSBG, SYS, "#1F3B39", SYS
    if kind == "acc":
        fill, stroke, tc, sc = "#F7EDE9", ACC, ACC, ACC
    if kind == "mute":
        fill, stroke, tc, sc = "#EFECE7", "#A9A497", MUTE, MUTE
    d = ' stroke-dasharray="6 5"' if dashed else ""
    o = (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{fill}" '
         f'stroke="{stroke}" stroke-width="2"{d}/>')
    ty = y + (28 if sub else h / 2 + 5)
    o += (f'<text x="{x+17}" y="{ty}" font-family="{MONO}" font-size="13" '
          f'fill="{tc}">{esc(label)}</text>')
    if sub:
        o += (f'<text x="{x+17}" y="{ty+17}" font-family="{SANS}" font-size="11.5" '
              f'fill="{sc}">{esc(sub)}</text>')
    return o


def badge(cx, cy, n, halo=None):
    o = ""
    if halo:
        o += f'<circle cx="{cx}" cy="{cy}" r="13" fill="{halo}"/>'
    return (o + f'<circle cx="{cx}" cy="{cy}" r="11" fill="{ACC}"/>'
            f'<text x="{cx}" y="{cy+4}" text-anchor="middle" font-family="{SANS}" '
            f'font-size="12" font-weight="600" fill="#FFFFFF">{n}</text>')


def varrow(x, y1, y2, dashed=False):
    d = ' stroke-dasharray="7 6"' if dashed else ""
    return (f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2}" stroke="{ACC}" '
            f'stroke-width="2.5"{d} marker-end="url(#ar)"/>')


def cap(x, y, t, anchor="start", size=11.5, fill=MUTE, font=SANS):
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{font}" '
            f'font-size="{size}" fill="{fill}">{esc(t)}</text>')


def stack(items, w=266, x=46, h=62, gap=49, top=8):
    """Colonna di box collegati da frecce numerate. Ritorna (body, altezza, ys)."""
    o, ys, y = "", [], top
    for i, it in enumerate(items):
        ys.append(y)
        o += box(x, y, w, h, it[0], it[1], it[2] if len(it) > 2 else "ink",
                 it[3] if len(it) > 3 else False)
        if i:
            a0, a1 = ys[i-1] + h + 4, y - 6
            o += varrow(x + w / 2 - 87, a0, a1)
            o += badge(x + w / 2 - 87 + 24, (a0 + a1) / 2, i)
        y += h + gap
    return o, y - gap + top, ys


# --- A: finestra VS Code ----------------------------------------------------
VSC = {"bg": "#1E1E1E", "bar": "#323233", "side": "#333333", "tab": "#252526",
       "key": "#9CDCFE", "str": "#CE9178", "pun": "#D4D4D4", "com": "#6A9955"}
ADV = 5.4  # larghezza carattere a font-size 9


def vscode(filename, lines, badges=(), w=584, h=None, x=8, y=30):
    h = h or max(180, 88 + len(lines) * 16)
    """lines: liste di (testo, colore). badges: (numero, indice_riga)."""
    o = (f'<clipPath id="w"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10"/>'
         f'</clipPath><g clip-path="url(#w)">'
         f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{VSC["bg"]}"/>'
         f'<rect x="{x}" y="{y}" width="{w}" height="26" fill="{VSC["bar"]}"/>')
    for i, c in enumerate(("#FF5F57", "#FEBC2E", "#28C840")):
        o += f'<circle cx="{x+14+i*14}" cy="{y+13}" r="4" fill="{c}"/>'
    o += (f'<rect x="{x}" y="{y+26}" width="24" height="{h-26}" fill="{VSC["side"]}"/>'
          f'<rect x="{x+24}" y="{y+26}" width="{w-24}" height="24" fill="{VSC["tab"]}"/>'
          f'<rect x="{x+24}" y="{y+26}" width="{len(filename)*6+24}" height="24" '
          f'fill="{VSC["bg"]}"/>'
          f'<text x="{x+36}" y="{y+42}" font-family="{MONO}" font-size="10" '
          f'fill="#D8D8D8">{filename}</text>'
          f'<rect x="{x+24}" y="{y+48}" width="{len(filename)*6+24}" height="2" '
          f'fill="#D97757"/>')
    cx, cy0, step = x + 32, y + 72, 16
    for i, segs in enumerate(lines):
        ty, col = cy0 + i * step, cx
        o += f'<text y="{ty}" xml:space="preserve" font-family="{MONO}" font-size="9">'
        for txt, colr in segs:
            o += f'<tspan x="{col}" fill="{colr}">{txt}</tspan>' if col == cx else \
                 f'<tspan fill="{colr}">{txt}</tspan>'
            col += len(txt) * ADV
        o += '</text>'
    o += (f'</g><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="none" '
          f'stroke="#111111" stroke-width="1.5"/>')
    for n, row in badges:
        o += badge(x + w - 26, cy0 + row * step - 4, n)
    return o


def K(s):
    return (s, VSC["key"])


def S(s):
    return (s, VSC["str"])


def P(s):
    return (s, VSC["pun"])


def ind(n):
    return P(" " * n)


IMG = {}

# =============================== mod-mcp-01 =================================
b, h, _ = stack([
    ("Il modello", "produce un blocco tool_use", "ink"),
    ("Il tuo programma", "esegue davvero l'operazione", "sys"),
    ("tool_result", "torna come messaggio user", "ink", True),
])
b += ('<path d="M46 261 L22 261 L22 39 L40 39" fill="none" stroke="' + ACC +
      '" stroke-width="2.5" stroke-dasharray="7 6" marker-end="url(#ar)"/>' +
      badge(22, 150, 3, halo="#FAF9F5"))
IMG["tool-use-chi-esegue"] = svg(320, 300,
    "Il modello produce un blocco tool_use, il tuo programma esegue l'operazione "
    "e il risultato torna al modello come messaggio user", b)

b = (box(14, 18, 292, 150, "", None, "ink") +
     cap(30, 44, "name", font=MONO, size=13, fill=INK) +
     cap(30, 60, "identificatore, ^[a-zA-Z0-9_-]{1,128}$") +
     f'<line x1="14" y1="72" x2="306" y2="72" stroke="{RULE}" stroke-width="1.5"/>' +
     f'<rect x="15" y="73" width="290" height="46" fill="#F7EDE9"/>' +
     cap(30, 94, "description", font=MONO, size=13, fill=ACC) +
     cap(30, 110, "cosa fa, quando si usa, quando no") +
     f'<line x1="14" y1="120" x2="306" y2="120" stroke="{RULE}" stroke-width="1.5"/>' +
     f'<rect x="15" y="121" width="290" height="46" fill="{SYSBG}"/>' +
     cap(30, 142, "input_schema", font=MONO, size=13, fill=SYS) +
     cap(30, 158, "la forma dell'input, in JSON Schema") +
     f'<path d="M296 78 q8 0 8 10 v25 q0 10 10 10 q-10 0 -10 10 v25 q0 10 -10 10" '
     f'fill="none" stroke="{ACC}" stroke-width="1.5"/>' +
     box(14, 206, 292, 62, "il codice che esegue", "il modello non lo vede mai",
         "ink", True) +
     cap(160, 194, "l'unica superficie su cui il modello decide", "middle",
         11.5, ACC))
IMG["tool-definizione-tre-campi"] = svg(320, 290,
    "Una definizione di strumento ha tre campi: name, description e input_schema. "
    "Solo description e input_schema sono ciò che il modello vede; il codice che "
    "esegue lo strumento non gli arriva mai", b)

b = vscode("get_weather.json", [
    [P("{")],
    [ind(2), K('"name"'), P(": "), S('"get_weather"'), P(",")],
    [ind(2), K('"description"'), P(": "), S('"Restituisce il meteo attuale di una '
                                           'citt\u00e0. Usalo quando"')],
    [ind(4), S('"l\'utente chiede che tempo fa adesso. Non usarlo per le"')],
    [ind(4), S('"previsioni a più giorni, che questo strumento non copre."')],
    [ind(4), S('"Il parametro città accetta il nome in chiaro, non le"')],
    [ind(4), S('"coordinate."'), P(",")],
    [ind(2), K('"input_schema"'), P(": {")],
    [ind(4), K('"type"'), P(": "), S('"object"'), P(",")],
    [ind(4), K('"properties"'), P(": {")],
    [ind(6), K('"città"'), P(": { "), K('"type"'), P(": "), S('"string"'), P(" }")],
    [ind(4), P("},")],
    [ind(4), K('"required"'), P(": ["), S('"città"'), P("]")],
    [ind(2), P("}")],
    [P("}")],
], badges=((1, 1), (2, 4), (3, 7)))
IMG["tool-json-vscode"] = svg(600, 30 + max(180, 88 + 15 * 16) + 12,
    "La definizione JSON dello strumento get_weather aperta in Visual Studio Code: "
    "il campo name, una description lunga quattro frasi e input_schema", b)

b = (cap(18, 24, "client tool", font=MONO, size=12, fill=INK) +
     box(14, 34, 292, 96, "", None, "ink") +
     cap(30, 58, "i tuoi, pi\u00f9 bash e text_editor") +
     cap(30, 82, "il modello si ferma con stop_reason: tool_use,", size=11) +
     cap(30, 98, "esegui tu nel tuo codice, rimandi tu il risultato", size=11) +
     cap(30, 118, "il lavoro accade sulla tua macchina", size=11, fill=ACC) +
     cap(18, 168, "server tool", font=MONO, size=12, fill=INK) +
     box(14, 178, 292, 96, "", None, "sys") +
     cap(30, 202, "web_search, web_fetch, code_execution", fill=SYS) +
     cap(30, 226, "esegue l'infrastruttura di Anthropic,", size=11, fill=SYS) +
     cap(30, 242, "il risultato torna gi\u00e0 prodotto", size=11, fill=SYS) +
     cap(30, 262, "tu non gestisci nessuna esecuzione", size=11, fill=ACC))
IMG["client-vs-server-tool"] = svg(320, 290,
    "I client tool girano nel tuo codice e li esegui tu; i server tool girano "
    "sull'infrastruttura di Anthropic e il risultato arriva gia prodotto", b)

# =============================== mod-mcp-02 =================================
b = ""
for i, (x, t, s, k, d) in enumerate([
        (10, "Richiesta 1", "tools[] + messages[]", "ink", False),
        (215, "fuori dall'API", "il tuo codice esegue", "sys", True),
        (420, "Richiesta 2", "tutto + tool_result", "ink", False)]):
    b += box(x, 70, 170, 76, t, s, k, d)
b += (f'<line x1="186" y1="108" x2="209" y2="108" stroke="{ACC}" stroke-width="2.5" '
      f'marker-end="url(#ar)"/>'
      f'<line x1="391" y1="108" x2="414" y2="108" stroke="{ACC}" stroke-width="2.5" '
      f'marker-end="url(#ar)"/>' +
      badge(197, 46, 2) + badge(402, 46, 3) + badge(95, 46, 1) +
      cap(95, 176, "torna stop_reason: tool_use", "middle", 11.5, ACC, MONO) +
      cap(95, 194, "con il blocco tool_use", "middle") +
      cap(505, 176, "torna stop_reason: end_turn", "middle", 11.5, ACC, MONO) +
      cap(505, 194, "ed è il testo che leggi", "middle") +
      cap(300, 232, "La richiesta HTTP si chiude qui: il modello non sta aspettando.",
          "middle", 12, INK) +
      cap(300, 250, "Se non fai nient'altro, non succede nient'altro.", "middle", 12) +
      cap(300, 30, "due richieste all'API per una sola chiamata a uno strumento",
          "middle", 12.5, INK))
IMG["due-richieste-timeline"] = svg(600, 280,
    "Due richieste all'API per una sola chiamata a uno strumento: la prima torna "
    "con stop_reason tool_use, in mezzo il tuo codice esegue, la seconda torna con "
    "il testo finale", b)

b = (box(14, 20, 292, 104, "tool_use", "dal modello, nella prima risposta", "ink") +
     cap(30, 82, "id", font=MONO, size=12, fill=ACC) +
     cap(64, 82, "toolu_01A09q90qw90lq91", font=MONO, size=11) +
     cap(30, 100, "name   input", font=MONO, size=12, fill=INK) +
     cap(30, 116, "quale strumento, con quali parametri", size=10.5) +
     box(14, 170, 292, 104, "tool_result", "da te, dentro un messaggio user",
         "sys") +
     cap(30, 232, "tool_use_id", font=MONO, size=12, fill=ACC) +
     cap(122, 232, "toolu_01A09q90qw90lq91", font=MONO, size=11) +
     cap(30, 250, "content  is_error", font=MONO, size=12, fill="#1F3B39") +
     cap(30, 266, "il risultato, e se l'esecuzione \u00e8 fallita", size=10.5, fill=SYS) +
     f'<path d="M14 88 L6 88 L6 238 L14 238" fill="none" stroke="{ACC}" '
     f'stroke-width="2"/>' +
     cap(160, 150, "stesso identificatore: \u00e8 l'unica cosa", "middle", 11, ACC) +
     cap(160, 164, "che accoppia richiesta e risultato", "middle", 11, ACC))
IMG["tool-use-e-tool-result"] = svg(320, 290,
    "Il blocco tool_use porta un id; il blocco tool_result riporta lo stesso valore "
    "in tool_use_id, ed e questo che accoppia la richiesta al suo risultato", b)

b = vscode("richiesta-2.json", [
    [K('"messages"'), P(": [")],
    [ind(2), P("{ "), K('"role"'), P(": "), S('"user"'), P(", "), K('"content"'),
     P(": "), S('"Che tempo fa a Trento?"'), P(" },")],
    [ind(2), P("{ "), K('"role"'), P(": "), S('"assistant"'), P(", "),
     K('"content"'), P(": [{")],
    [ind(6), K('"type"'), P(": "), S('"tool_use"'), P(", "), K('"id"'), P(": "),
     S('"toolu_01A09q90qw90lq91"'), P(",")],
    [ind(6), K('"name"'), P(": "), S('"get_weather"'), P(", "), K('"input"'),
     P(": { "), K('"città"'), P(": "), S('"Trento"'), P(" }")],
    [ind(4), P("}] },")],
    [ind(2), P("{ "), K('"role"'), P(": "), S('"user"'), P(", "), K('"content"'),
     P(": [{")],
    [ind(6), K('"type"'), P(": "), S('"tool_result"'), P(",")],
    [ind(6), K('"tool_use_id"'), P(": "), S('"toolu_01A09q90qw90lq91"'), P(",")],
    [ind(6), K('"content"'), P(": "), S('"18 gradi, sereno"'), P(", "),
     K('"is_error"'), P(": false")],
    [ind(4), P("}] }")],
    [P("]")],
], badges=((1, 2), (2, 6), (3, 8)))
IMG["seconda-richiesta-json"] = svg(600, 30 + max(180, 88 + 12 * 16) + 12,
    "L'array messages della seconda richiesta: il messaggio utente, il messaggio "
    "assistant con il blocco tool_use, e un secondo messaggio con ruolo user che "
    "contiene il tool_result", b)

b = ""
rows = [("Richiesta 1", [("tools[]", 92, ACC), ("messages[]", 56, INK)]),
        ("Richiesta 2", [("tools[]", 92, ACC), ("messages[]", 56, INK),
                         ("tool_use", 40, MUTE), ("tool_result", 74, SYS)])]
for i, (lbl, segs) in enumerate(rows):
    y = 44 + i * 86
    b += cap(16, y - 8, lbl, size=12, fill=INK)
    x = 16
    for t, w, c in segs:
        b += (f'<rect x="{x}" y="{y}" width="{w}" height="30" rx="5" fill="{c}" '
              f'opacity="0.9"/>')
        x += w + 4
    b += cap(16, y + 50, " ".join(s[0] for s in segs), size=10.5)
b += (cap(16, 222, "Le definizioni degli strumenti le rispedisci", size=11.5, fill=INK) +
      cap(16, 238, "a ogni richiesta, non una volta sola.", size=11.5, fill=INK) +
      cap(16, 260, "Una descrizione lunga la paghi tutte le volte.", size=11.5,
          fill=ACC))
IMG["costo-che-cresce"] = svg(320, 280,
    "Il carico della seconda richiesta e piu grande della prima: le definizioni "
    "degli strumenti vengono rispedite ogni volta, insieme al blocco tool_use e al "
    "risultato dello strumento", b)


# =============================== corso LLM ==================================

def strip_h(x, y, w, h, segs, gap=3):
    """Striscia orizzontale di segmenti proporzionali. segs: (label, peso, kind)."""
    tot = sum(s[1] for s in segs)
    o, cx = "", x
    for lbl, peso, kind in segs:
        sw = (w - gap * (len(segs) - 1)) * peso / tot
        fill, stroke, tc = PAPER, INK, INK
        if kind == "sys": fill, stroke, tc = SYSBG, SYS, "#1F3B39"
        if kind == "acc": fill, stroke, tc = "#F7EDE9", ACC, ACC
        if kind == "mute": fill, stroke, tc = "#EFECE7", "#A9A497", MUTE
        o += (f'<rect x="{cx:.1f}" y="{y}" width="{sw:.1f}" height="{h}" rx="6" '
              f'fill="{fill}" stroke="{stroke}" stroke-width="1.8"/>')
        if lbl:
            o += (f'<text x="{cx+sw/2:.1f}" y="{y+h/2+4}" text-anchor="middle" '
                  f'font-family="{MONO}" font-size="10.5" fill="{tc}">{lbl}</text>')
        cx += sw + gap
    return o


# --- mod-llm-02 -------------------------------------------------------------
segs = [("definizioni strumenti", 46, "sys"), ("system prompt", 34, "ink"),
        ("turni precedenti, interi", 104, "acc"), ("risultati strumenti", 36, "acc"),
        ("output di questo turno", 32, "mute")]
b, y = "", 40
for k, (lbl, hh, kind) in enumerate(segs):
    fill, stroke, tc = PAPER, INK, INK
    if kind == "sys": fill, stroke, tc = SYSBG, SYS, "#1F3B39"
    if kind == "acc": fill, stroke, tc = "#F7EDE9", ACC, ACC
    if kind == "mute": fill, stroke, tc = "#EFECE7", "#A9A497", MUTE
    dash = ' stroke-dasharray="6 5"' if kind == "mute" else ""
    b += (f'<rect x="44" y="{y}" width="246" height="{hh}" rx="7" fill="{fill}" '
          f'stroke="{stroke}" stroke-width="1.8"{dash}/>'
          f'<text x="58" y="{y+hh/2+4}" font-family="{MONO}" font-size="11" '
          f'fill="{tc}">{lbl}</text>')
    if k < 4:
        b += badge(28, y + hh / 2, k + 1)
    y += hh + 5
b = (cap(160, 26, "una richiesta, dall'inizio alla fine", "middle", 12, INK) + b +
     cap(160, y + 14, "tutto questo viaggia a ogni singola richiesta", "middle", 11, ACC))
IMG["finestra-cosa-contiene"] = svg(320, y + 26,
    "Cosa occupa la finestra di contesto, dall'alto: definizioni degli strumenti, "
    "system prompt, turni precedenti interi, risultati degli strumenti e l'output "
    "di questo turno", b)

b = cap(300, 24, "la domanda è la stessa; l'input no", "middle", 12.5, INK)
for k, (t, storico) in enumerate([("turno 1", 0), ("turno 5", 120), ("turno 10", 270)]):
    yy = 52 + k * 62
    b += cap(16, yy + 22, t, size=12, fill=INK)
    b += strip_h(84, yy, 110 + storico, 32,
                 ([("fisso", 110, "sys")] if not storico else
                  [("fisso", 110, "sys"), ("storico accumulato", storico, "acc")]))
    b += cap(84 + 110 + storico + 14, yy + 21, "=" + str(110 + storico) + " unita", size=11)
b += (cap(16, 240, "Il blocco «fisso» sono definizioni degli strumenti e system prompt:",
          size=11.5, fill=INK) +
      cap(16, 256, "non cresce, ma lo rispedisci ogni volta. Il resto si accumula.",
          size=11.5, fill=INK))
IMG["finestra-cresce-per-turno"] = svg(600, 276,
    "Tre barre, turno 1, 5 e 10: la parte fissa resta uguale mentre lo storico "
    "accumulato allunga la richiesta a ogni turno", b)

b = vscode("richiesta.json", [
    [P("{")],
    [ind(2), K('"model"'), P(": "), S('"claude-..."'), P(",")],
    [ind(2), K('"tools"'), P(": [ "), ("/* 20 definizioni, ~4.000 token */", VSC["com"]), P(" ],")],
    [ind(2), K('"system"'), P(": "), S('"Sei un assistente che..."'), P(",")],
    [ind(2), K('"messages"'), P(": [")],
    [ind(4), P("{ "), K('"role"'), P(": "), S('"user"'), P(", ... },")],
    [ind(4), P("{ "), K('"role"'), P(": "), S('"assistant"'), P(", ... },")],
    [ind(4), P("{ "), K('"role"'), P(": "), S('"user"'), P(", ... },        "),
     ("/* turno 1 */", VSC["com"])],
    [ind(4), ("/* ...e tutti i turni successivi, interi... */", VSC["com"])],
    [ind(2), P("]")],
    [P("}")],
], badges=((1, 2), (2, 3), (3, 4)))
IMG["richiesta-anatomia"] = svg(600, 30 + max(180, 88 + 11 * 16) + 12,
    "Il corpo di una richiesta in Visual Studio Code: il campo tools con venti "
    "definizioni, il system prompt e l'array messages con tutti i turni precedenti "
    "riportati per intero", b)

# --- mod-llm-03: context rot ------------------------------------------------
import math

def rete(cx, cy, r, n, col):
    o, pts = "", []
    for k in range(n):
        a = -math.pi / 2 + 2 * math.pi * k / n
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    for i in range(n):
        for j in range(i + 1, n):
            o += (f'<line x1="{pts[i][0]:.1f}" y1="{pts[i][1]:.1f}" '
                  f'x2="{pts[j][0]:.1f}" y2="{pts[j][1]:.1f}" stroke="{col}" '
                  f'stroke-width="1" opacity="0.5"/>')
    for x, y in pts:
        o += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4" fill="{INK}"/>'
    return o


b = (cap(80, 22, "4 token", "middle", 12.5, INK) + rete(80, 96, 52, 4, INK) +
     cap(80, 172, "6 coppie", "middle", 11.5) +
     cap(232, 22, "8 token", "middle", 12.5, INK) + rete(232, 96, 52, 8, ACC) +
     cap(232, 172, "28 coppie", "middle", 11.5) +
     cap(160, 210, "Raddoppiare i token non raddoppia le coppie", "middle", 12, INK) +
     cap(160, 228, "da mettere in relazione: da 6 si passa a 28.", "middle", 12, INK) +
     cap(160, 254, "E quell'attenzione resta la stessa, spalmata", "middle", 11.5, ACC) +
     cap(160, 270, "su molto più materiale.", "middle", 11.5, ACC))
IMG["attenzione-quadratica"] = svg(320, 288,
    "Quattro token formano sei coppie, otto token ne formano ventotto: il "
    "lavoro di attenzione cresce con il quadrato dei token, non in proporzione", b)

b = cap(300, 24, "due liste che non si somigliano", "middle", 12.5, INK)
for k, t in enumerate(["compattare e ripartire", "appunti in un file esterno",
                       "aprire i dati quando servono", "sottoagenti con contesto proprio"]):
    b += box(14, 48 + k * 52, 268, 42, "", None, "sys") + cap(30, 74 + k * 52, t, fill=SYS)
for k, t in enumerate(["una finestra più grande", "chiedere di fare più attenzione"]):
    b += (box(318, 48 + k * 52, 268, 42, "", None, "ink", True) +
          cap(346, 74 + k * 52, t, fill=MUTE) +
          f'<line x1="330" y1="60" x2="342" y2="78" stroke="{MUTE}" stroke-width="2"/>'
          f'<line x1="342" y1="60" x2="330" y2="78" stroke="{MUTE}" stroke-width="2"/>'
          .replace("60", str(58 + k * 52)).replace("78", str(76 + k * 52)))
b += (cap(148, 42, "attaccano la causa", "middle", 11.5, SYS) +
      cap(452, 42, "spostano il limite e basta", "middle", 11.5, MUTE) +
      cap(300, 268, "La finestra più grande non toglie il degrado: è esattamente",
          "middle", 11.5, INK) +
      cap(300, 284, "quello che il fenomeno descrive.", "middle", 11.5, INK))
IMG["rimedi-context-rot"] = svg(600, 300,
    "A sinistra i rimedi che attaccano la causa del context rot: compattare, "
    "appunti esterni, recupero al momento giusto, sottoagenti. A destra i due "
    "che spostano il limite senza toglierlo", b)

b = (cap(160, 24, "una sessione lunga, dall'alto in basso", "middle", 12, INK) +
     f'<line x1="40" y1="44" x2="40" y2="238" stroke="{RULE}" stroke-width="3"/>')
for k, (t, sub) in enumerate([
        ("dimentica un vincolo", "che avevi dato all'inizio"),
        ("rifà una cosa già fatta", "senza accorgersene"),
        ("perde il filo", "e tu non hai cambiato niente")]):
    y = 70 + k * 62
    b += (f'<circle cx="40" cy="{y}" r="7" fill="{ACC}"/>' +
          cap(60, y - 2, t, size=12.5, fill=INK) + cap(60, y + 14, sub, size=11))
b += (cap(16, 262, "Non hai cambiato modello né chiesto qualcosa di più",
          size=11.5, fill=INK) +
      cap(16, 278, "difficile. Si è riempita la finestra.", size=11.5, fill=ACC))
IMG["sintomo-sessione-lunga"] = svg(320, 292,
    "I tre sintomi di una sessione lunga che degrada: dimentica un vincolo dato "
    "all'inizio, rifà una cosa già fatta, perde il filo", b)

# --- mod-llm-04: prompt caching ---------------------------------------------
b = (cap(300, 24, "la cache legge il prompt in ordine, dall'inizio", "middle", 12.5, INK) +
     strip_h(14, 48, 572, 44, [("tools", 30, "sys"), ("system", 26, "ink"),
                               ("messages, turno 1", 22, "acc"),
                               ("turno 2", 12, "acc"), ("turno 3", 10, "mute")]))
b += (f'<line x1="326" y1="40" x2="326" y2="104" stroke="{ACC}" stroke-width="2.5" '
      f'stroke-dasharray="5 4"/>' +
      cap(334, 44, "cache_control", "start", 11, ACC, MONO) +
      f'<path d="M14 112 L14 120 L326 120 L326 112" fill="none" stroke="{INK}" '
      f'stroke-width="1.5"/>' +
      cap(170, 138, "questo è il prefisso: quello che viene riusato", "middle", 12, INK) +
      cap(456, 138, "questo si rielabora sempre", "middle", 12, MUTE) +
      cap(300, 180, "Non è una cache a pezzi. È una cache dell'inizio della richiesta:",
          "middle", 12, INK) +
      cap(300, 198, "cambiare un blocco prima del punto marcato cambia l'hash, e la",
          "middle", 12, INK) +
      cap(300, 216, "corrispondenza non si trova più.", "middle", 12, INK))
IMG["cache-prefisso"] = svg(600, 236,
    "La cache legge il prompt in ordine, da tools a system ai messaggi, fino al "
    "blocco marcato con cache_control: quel tratto iniziale è il prefisso riusato", b)

b = cap(160, 22, "lo stesso prompt, due punti diversi", "middle", 12, INK)
for k, (marc, esito, col) in enumerate([(6, "scrittura nuova ogni volta", ACC),
                                        (5, "lettura dalla cache", SYS)]):
    y = 44 + k * 116
    segs = [(str(i), 1, ("acc" if i == 6 else "ink")) for i in range(1, 7)]
    b += strip_h(14, y, 292, 34, segs)
    xm = 14 + (292 - 3 * 5) * marc / 6 + 5 * (marc - 1) - 3
    b += (f'<line x1="{xm:.1f}" y1="{y-8}" x2="{xm:.1f}" y2="{y+42}" stroke="{col}" '
          f'stroke-width="2.5" stroke-dasharray="5 4"/>' +
          cap(160, y + 62, esito, "middle", 12, col))
    if k == 0:
        b += cap(160, y + 78, "il blocco 6 è un timestamp: cambia sempre", "middle", 11)
    else:
        b += cap(160, y + 78, "il blocco 5 è l'ultimo stabile", "middle", 11)
b += cap(160, 282, "Il punto di cache va sull'ultimo blocco stabile.", "middle", 12, INK)
IMG["punto-di-cache-sbagliato"] = svg(320, 296,
    "Lo stesso prompt con il punto di cache in due posizioni: sul blocco 6, che "
    "contiene un timestamp variabile, non c'è mai corrispondenza; sul blocco 5, "
    "l'ultimo stabile, la cache si rilegge", b)

b = vscode("usage.json", [
    [K('"usage"'), P(": {")],
    [ind(2), K('"input_tokens"'), P(": "), ("214", VSC["pun"]), P(",")],
    [ind(2), K('"cache_creation_input_tokens"'), P(": "), ("0", VSC["pun"]), P(",")],
    [ind(2), K('"cache_read_input_tokens"'), P(": "), ("18432", VSC["pun"]), P(",")],
    [ind(2), K('"output_tokens"'), P(": "), ("341", VSC["pun"])],
    [P("}")],
], badges=((1, 1), (2, 3)))
IMG["usage-json"] = svg(600, 30 + max(180, 88 + 6 * 16) + 12,
    "Il blocco usage di una risposta: input_tokens vale 214, ma "
    "cache_read_input_tokens ne conta 18.432, e i token di input veri sono la "
    "somma dei tre campi", b)

# --- mod-claude-code-06: hook -----------------------------------------------
b = (box(14, 24, 292, 92, "CLAUDE.md", "contesto", "ink") +
     cap(30, 86, "il modello lo legge e prova a seguirlo", size=11.5) +
     cap(30, 102, "otto volte su dieci funziona", size=11.5, fill=MUTE) +
     box(14, 168, 292, 92, "hook", "configurazione", "sys") +
     cap(30, 230, "il programma lo esegue da sé, sempre", size=11.5, fill=SYS) +
     cap(30, 246, "il modello non viene consultato", size=11.5, fill=SYS) +
     cap(160, 142, "le istruzioni guidano, gli hook impongono", "middle", 12, ACC) +
     cap(160, 286, "«e se il modello decidesse di no?»", "middle", 12, INK) +
     cap(160, 302, "Se «non è accettabile», è un hook.", "middle", 12, INK))
IMG["contesto-vs-hook"] = svg(320, 318,
    "CLAUDE.md è contesto: il modello lo legge e prova a seguirlo. Un hook è "
    "configurazione: il programma lo esegue da sé, senza consultare il modello", b)

b = (cap(300, 22, "gli eventi lungo il ciclo di vita di una sessione", "middle", 12.5, INK) +
     f'<line x1="30" y1="86" x2="570" y2="86" stroke="{RULE}" stroke-width="3"/>')
ev = [("SessionStart", 40, False), ("UserPromptSubmit", 160, True),
      ("PreToolUse", 300, True), ("PostToolUse", 410, False),
      ("Stop", 500, True), ("SessionEnd", 562, False)]
for nome, x, blocca in ev:
    col = ACC if blocca else MUTE
    b += (f'<circle cx="{x}" cy="86" r="{7 if blocca else 5}" fill="{col}"/>' +
          cap(x, 68, nome, "middle", 10.5, col, MONO))
    if blocca:
        b += cap(x, 112, "può bloccare", "middle", 10, ACC)
b += (cap(300, 160, "Un hook di tipo command riceve un JSON su stdin e risponde con il codice",
          "middle", 12, INK) +
      cap(300, 178, "di uscita. Zero: nessuna decisione. Due: errore bloccante.", "middle",
          12, INK) +
      box(150, 200, 300, 44, "", None, "sys") +
      cap(300, 227, "L'uscita 2 blocca l'azione, JSON o non JSON.", "middle", 12, "#1F3B39"))
IMG["hook-eventi-ciclo"] = svg(600, 260,
    "Gli eventi degli hook lungo una sessione: SessionStart, UserPromptSubmit, "
    "PreToolUse, PostToolUse, Stop e SessionEnd. Tre di questi possono bloccare "
    "l'azione con il codice di uscita 2", b)

b = vscode("settings.json", [
    [P("{")],
    [ind(2), K('"hooks"'), P(": {")],
    [ind(4), K('"PreToolUse"'), P(": [")],
    [ind(6), P("{")],
    [ind(8), K('"matcher"'), P(": "), S('"Bash"'), P(",")],
    [ind(8), K('"hooks"'), P(": [")],
    [ind(10), P("{ "), K('"type"'), P(": "), S('"command"'), P(",")],
    [ind(12), K('"command"'), P(": "), S('"./scripts/blocca-force-push.sh"'), P(" }")],
    [ind(8), P("]")],
    [ind(6), P("}")],
    [ind(4), P("]")],
    [ind(2), P("}")],
    [P("}")],
], badges=((1, 2), (2, 4), (3, 7)))
IMG["hook-settings-json"] = svg(600, 30 + max(180, 88 + 13 * 16) + 12,
    "La configurazione di un hook in settings.json: l'evento PreToolUse, un "
    "matcher che seleziona lo strumento Bash, e il comando da eseguire", b)

b = cap(160, 22, "dove va scritta una regola", "middle", 12.5, INK)
for k, (dom, dove, kind) in enumerate([
        ("una convenzione o una preferenza", "CLAUDE.md", "ink"),
        ("una procedura lunga, ogni tanto", "una skill", "ink"),
        ("deve accadere sempre, in un punto preciso", "un hook", "sys")]):
    y = 40 + k * 78
    b += (box(14, y, 292, 62, "", None, kind) +
          cap(30, y + 26, dom, size=11.5) +
          cap(30, y + 46, dove, size=13,
              fill=(SYS if kind == "sys" else INK), font=MONO))
b += cap(160, 292, "Se deve valere anche quando il modello si distrae, è un hook.", "middle", 10.5, ACC)
IMG["smistamento-hook"] = svg(320, 306,
    "Dove va scritta una regola: una convenzione in CLAUDE.md, una procedura "
    "lunga in una skill, una cosa che deve accadere sempre in un hook", b)

# --- mod-context-economy-01: memoria ----------------------------------------
b = cap(300, 22, "cosa entra in finestra, e quando", "middle", 12.5, INK)
for k, t in enumerate(["CLAUDE.md della cartella e di quelle sopra",
                       "regole senza paths",
                       "indice dell'auto memory, primo pezzo"]):
    b += box(14, 62 + k * 56, 272, 46, "", None, "acc") + cap(30, 90 + k * 56, t, size=11.5, fill=ACC)
for k, t in enumerate(["regole con paths", "skill",
                       "file per argomento dell'auto memory",
                       "CLAUDE.md nelle sottocartelle"]):
    b += box(314, 62 + k * 56, 272, 46, "", None, "sys", True) + cap(330, 90 + k * 56, t, size=11.5, fill=SYS)
b += (cap(150, 52, "costo ricorrente, a ogni avvio", "middle", 11.5, ACC) +
      cap(450, 52, "costo su richiesta, quando serve", "middle", 11.5, SYS) +
      cap(300, 292, "Cinque file markdown caricati sempre non sono memoria:", "middle", 12, INK) +
      cap(300, 310, "sono cinque file di contesto che paghi tutte le volte.", "middle", 12, INK))
IMG["cosa-entra-all-avvio"] = svg(600, 326,
    "A sinistra quello che entra in finestra a ogni avvio: CLAUDE.md, regole "
    "senza paths, indice dell'auto memory. A destra quello che si carica solo "
    "quando serve: regole con paths, skill, file per argomento, CLAUDE.md delle "
    "sottocartelle", b)

b = cap(160, 22, "quali CLAUDE.md si caricano", "middle", 12.5, INK)
liv = [("/", 20, True), ("/Users/tu", 44, True), ("~/progetto", 68, True),
       ("~/progetto/src", 92, False), ("~/progetto/src/api", 116, False)]
for k, (nome, x, carica) in enumerate(liv):
    y = 52 + k * 42
    col = ACC if carica else MUTE
    b += (cap(x, y + 14, nome, size=12, fill=INK, font=MONO) +
          f'<circle cx="{x-12}" cy="{y+10}" r="5" fill="{col}"/>')
    if carica:
        b += cap(306, y + 14, "caricato all'avvio", "end", 11, ACC)
    else:
        b += cap(306, y + 14, "solo su richiesta", "end", 11, MUTE)
b += (cap(160, 284, "Si concatenano dalla radice verso il basso: le istruzioni", "middle", 11.5, INK) +
      cap(160, 300, "più vicine a te sono le ultime lette.", "middle", 11.5, INK))
IMG["claude-md-concatenazione"] = svg(320, 316,
    "I file CLAUDE.md della cartella di lavoro e di tutte quelle sopra si "
    "caricano all'avvio, concatenati dalla radice verso il basso; quelli nelle "
    "sottocartelle entrano solo quando Claude apre un file lì", b)

b = (cap(160, 22, "~/.claude/projects/<progetto>/memory/", "middle", 11.5, MUTE, MONO) +
     box(14, 44, 292, 74, "MEMORY.md", "l'indice", "acc") +
     cap(30, 100, "caricato all'avvio, ma solo le prime", size=11, fill=ACC))
b = b.replace('caricato all\'avvio, ma solo le prime', 'caricato, ma solo le prime 200 righe o 25 KB')
for k, t in enumerate(["decisioni-architettura.md", "convenzioni-test.md", "note-deploy.md"]):
    b += (box(14, 138 + k * 52, 292, 42, "", None, "ink", True) +
          cap(30, 164 + k * 52, t, size=11.5, font=MONO, fill=MUTE))
b += (cap(160, 310, "I file per argomento non si caricano da soli.", "middle", 12, INK) +
      cap(160, 326, "Claude li apre quando gli servono.", "middle", 12, INK) +
      cap(160, 350, "Quello che sta oltre la soglia dell'indice", "middle", 11.5, ACC) +
      cap(160, 366, "non viene caricato, e non te lo dice nessuno.", "middle", 11.5, ACC))
IMG["auto-memory-cosa-si-carica"] = svg(320, 382,
    "Nella cartella dell'auto memory solo MEMORY.md, l'indice, viene caricato "
    "all'avvio, e solo per le prime 200 righe o 25 KB; i file per argomento "
    "vengono aperti solo quando servono", b)
os.makedirs(OUT, exist_ok=True)
for name, content in IMG.items():
    with open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8") as f:
        f.write(content)
print(f"{len(IMG)} illustrazioni scritte in {OUT}")
for n in IMG:
    print(" -", n + ".svg")
