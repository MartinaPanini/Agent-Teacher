#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Controlla le lezioni contro docs/STILE.md e la skill humanizer.

docs/STILE.md ha la precedenza: e' la guida scritta da Martina. La skill
humanizer copre i tell da IA che STILE.md non nomina (lineette, elenchi con
etichetta in grassetto, parole che l'IA usa piu' di una persona).

Non riscrive niente: elenca cosa guardare. Esce con 1 se trova qualcosa.
Uso:  python3 scripts/controlla-stile.py [id-modulo ...]
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VIETATE = ["sostanzialmente", "di fatto", "sinergia", "paradigma",
           "in questa sezione vedremo", "al fine di", "allo scopo di",
           "effettuare", "in merito a", "relativamente a", "risulta essere",
           "e possibile che", "si puo notare che"]
DA_IA = ["fondamentale", "cruciale", "pivotale", "approfondire", "sottolinea",
         "evidenzia", "panorama", "testimonianza", "vibrante", "affascinante",
         "rivoluzionario", "funge da", "si configura come", "nel cuore di"]
ACCENTI = [r"perche'", r"piu'", r"cosi'", r"gia'", r"\be'\s", r"poiche'", r"percio'"]
EN = {"the", "of", "to", "is", "that", "this", "and", "for", "with", "by",
      "its", "not", "be", "when", "which", "request", "tool", "answer"}


def frasi(t):
    t = re.sub(r"`[^`]*`", "X", t)
    return [f.strip() for f in re.split(r"(?<=[.!?])\s+", t) if f.strip()]


def controlla_testo(t, dove, out, max_grassetto=1):
    for par in [p for p in t.split("\n\n") if p.strip()]:
        fs = frasi(par)
        if len(fs) > 4:
            out.append((dove, f"STILE §1: paragrafo di {len(fs)} frasi (max 4)"))
        for f in fs:
            n = len(f.split())
            if n > 25:
                out.append((dove, f"STILE §1: frase di {n} parole — {f[:52]}..."))
        g = len(re.findall(r"\*\*", par)) // 2
        if g > max_grassetto:
            out.append((dove, f"STILE §4: {g} grassetti in un paragrafo (max {max_grassetto})"))
    low = t.lower()
    for p in VIETATE:
        if p in low:
            out.append((dove, "STILE §2: parola vietata — " + p))
    for p in DA_IA:
        if re.search(r"\b" + p, low):
            out.append((dove, "humanizer §7: parola da IA — " + p))
    for a in ACCENTI:
        if re.search(a, low):
            out.append((dove, "STILE §6: accento scritto con apostrofo — " + a))
    if "“" in t or "”" in t:
        out.append((dove, "humanizer §19: virgolette ricurve"))
    if re.search(r"[\U0001F300-\U0001FAFF]", t):
        out.append((dove, "humanizer §18: emoji"))


def cita_inglese(t):
    n = 0
    for m in re.finditer(r"«([^»]{12,})»", t):
        w = [x.strip(".,;:").lower() for x in m.group(1).split()]
        if len(w) >= 4 and sum(1 for x in w if x in EN) >= 2:
            n += 1
    return n


def main(ids):
    mods = [m for m in json.load(open(os.path.join(ROOT, "data/modules.json"),
                                      encoding="utf-8")) if m.get("slide")]
    if ids:
        mods = [m for m in mods if m["id"] in ids]
    tot = 0
    for m in mods:
        out, lineette, parole, en = [], 0, 0, 0
        if not m["obiettivo"].startswith("Alla fine sai"):
            out.append(("obiettivo", "STILE §8: non inizia con «Alla fine sai»"))
        controlla_testo(m["prerequisiti_testo"], "prerequisiti", out)
        for i, s in enumerate(m["slide"], 1):
            dove = f"slide {i}"
            nt = len(s["titolo"].split())
            if not 3 <= nt <= 6:
                out.append((dove, f"STILE §3: titolo di {nt} parole (3-6) — {s['titolo']}"))
            if s["titolo"].endswith("."):
                out.append((dove, "STILE §3: titolo con punto finale"))
            controlla_testo(s["corpo"], dove, out)
            lineette += s["corpo"].count("—")
            parole += len(s["corpo"].split())
            en += cita_inglese(s["corpo"])
            prima = (s["corpo"].strip().split(".")[0]).lower()
            if s["titolo"].lower() in prima:
                out.append((dove, "humanizer §29: la prima frase ripete il titolo"))
            if s["punti"] and not 2 <= len(s["punti"]) <= 5:
                out.append((dove, f"STILE §6: elenco di {len(s['punti'])} voci (2-5)"))
            for p in s["punti"]:
                controlla_testo(p, dove + " punto", out)
                lineette += p.count("—")
                parole += len(p.split())
                en += cita_inglese(p)
                if re.match(r"\*\*[^*]{1,40}\*\*\s*[—:.]", p):
                    out.append((dove, "humanizer §16: punto con etichetta in grassetto — "
                                + p[:44]))
            if s["approfondimento"]:
                a = s["approfondimento"]
                controlla_testo(a["testo"], dove + " approf.", out)
                lineette += a["testo"].count("—")
                parole += len(a["testo"].split())
                en += cita_inglese(a["testo"])
        if en > 1:
            out.append(("modulo", f"STILE §5: {en} citazioni in inglese (max 1)"))
        ogni = round(parole / lineette) if lineette else None
        tot += len(out)
        print(f"\n{m['id']}  {len(out)} segnalazioni · {lineette} lineette"
              + (f" (una ogni {ogni} parole)" if ogni else "") + f" · {en} citazioni EN")
        for dove, msg in out:
            print(f"   {dove:20} {msg}")
    print(f"\ntotale: {tot} segnalazioni")
    return 1 if tot else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
