#!/usr/bin/env bash
# I tre cancelli di una lezione, in ordine. Si ferma al primo che si lamenta.
#
#   bash scripts/lezioni.sh            tutti i moduli
#   bash scripts/lezioni.sh mod-mcp-01 solo il controllo di stile su uno
#
# Se qualcosa non passa, si corregge il testo in scripts/lezioni_slide_data.py.
# Mai lo script.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "1/3  illustrazioni"
python3 scripts/genera-illustrazioni.py

echo
echo "2/3  scrittura in data/modules.json"
python3 scripts/applica-slide.py

echo
echo "3/3  stile (docs/STILE.md + humanizer)"
python3 scripts/controlla-stile.py "$@"

echo
echo "Tutto a posto. Ricorda il commit."
