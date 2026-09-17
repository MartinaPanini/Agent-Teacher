#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Scrive le slide dentro data/modules.json e rigenera sintesi_md dalle slide.

sintesi_md resta la vista a pagina unica: finche' il sito non sa mostrare le
slide, la lezione approfondita si legge comunque (retro-compatibilita', RF70).
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
from lezioni_slide_data import SLIDES, MODULO  # noqa: E402

ILLU = os.path.join(ROOT, "data", "illustrations")
MODULES = os.path.join(ROOT, "data", "modules.json")


def sintesi_da_slide(slide):
    out = []
    for s in slide:
        out.append("## " + s["titolo"] + "\n")
        out.append(s["corpo"].strip() + "\n")
        if s["punti"]:
            num = s["punti_stile"] == "numerato"
            for i, p in enumerate(s["punti"], 1):
                out.append((f"{i}. " if num else "- ") + p)
            out.append("")
        if s["approfondimento"]:
            a = s["approfondimento"]
            testo = " ".join(a["testo"].split())
            out.append(f"> **Approfondimento — {a['titolo']}.** {testo}\n")
    return "\n".join(out).strip() + "\n"


def main():
    mods = json.load(open(MODULES, encoding="utf-8"))
    by_id = {m["id"]: m for m in mods}
    errori = []

    for mid, slide in SLIDES.items():
        if mid not in by_id:
            errori.append(f"{mid}: modulo inesistente"); continue
        m = by_id[mid]
        if m["stato"] == "completato":
            errori.append(f"{mid}: completato, non si converte (R3/RF70)"); continue
        if len(slide) != 8:
            errori.append(f"{mid}: {len(slide)} slide invece di 8 (RF55)")
        corpo = sum(len(s["corpo"].split()) + sum(len(p.split()) for p in s["punti"])
                    for s in slide)
        if not 700 <= corpo <= 1100:
            errori.append(f"{mid}: {corpo} parole di corpo, fuori da 700-1100 (RF61)")
        napp = sum(1 for s in slide if s["approfondimento"])
        if napp < 2:
            errori.append(f"{mid}: {napp} approfondimenti, ne servono almeno 2 (RF62)")
        for i, s in enumerate(slide, 1):
            im = s["immagine"]
            if im:
                f = os.path.join(ILLU, im["id"] + ".svg")
                if not os.path.exists(f):
                    errori.append(f"{mid} slide {i}: manca {im['id']}.svg (RF63)")
                if not im["alt"]:
                    errori.append(f"{mid} slide {i}: alt vuoto (RF64)")
            if s["punti_stile"] == "numerato" and not im:
                errori.append(f"{mid} slide {i}: punti numerati senza immagine (RF66)")
            if len(s["corpo"].split()) + sum(len(p.split()) for p in s["punti"]) > 150:
                errori.append(f"{mid} slide {i}: oltre 150 parole (RF60)")
            if len(s["titolo"].split()) > 8:
                errori.append(f"{mid} slide {i}: titolo oltre 8 parole (RF60)")

    if errori:
        print("BLOCCATO, niente scritto:")
        for e in errori:
            print("  -", e)
        return 1

    for mid, slide in SLIDES.items():
        m = by_id[mid]
        for k, v in MODULO.get(mid, {}).items():
            m[k] = v
        m["slide"] = slide
        m["sintesi_md"] = sintesi_da_slide(slide)
        m["durata_min"] = 10
        corpo = sum(len(s["corpo"].split()) + sum(len(p.split()) for p in s["punti"])
                    for s in slide)
        appr = sum(len(s["approfondimento"]["testo"].split())
                   for s in slide if s["approfondimento"])
        print(f"{mid}: 8 slide, {corpo} parole (+{appr} approfondimenti), "
              f"{sum(1 for s in slide if s['immagine'])} immagini, 10 min")

    json.dump(mods, open(MODULES, "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    open(MODULES, "a", encoding="utf-8").write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
