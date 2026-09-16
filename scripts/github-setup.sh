#!/usr/bin/env bash
# Agent Teacher — impianto di tracciamento su GitHub.
# Crea label, milestone, issue e un Project v2 con campi e viste.
# Si lancia UNA VOLTA sola, dal terminale del Mac, dentro ~/Agent-Teacher:
#
#   bash scripts/github-setup.sh
#
# Richiede: gh CLI autenticata con gli scope project.
#   gh auth login
#   gh auth refresh -s project,read:project

set -euo pipefail

OWNER="MartinaPanini"
REPO="MartinaPanini/Agent-Teacher"
PROJECT_TITLE="Agent Teacher"

command -v gh >/dev/null || { echo "gh non installato: brew install gh"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "gh non autenticata: gh auth login"; exit 1; }

echo "==> Label"
lab() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; echo "    $1"; }

lab "blocco:roadmap"      "5319e7" "Capitolo 5 delle specifiche — tappe, zone, registro"
lab "blocco:calibrazione" "1d76db" "Blocco A — RF1-RF6"
lab "blocco:sessione"     "0e8a16" "Blocco B — RF7-RF18"
lab "blocco:curriculum"   "fbca04" "Blocco C — RF19-RF23"
lab "blocco:mappa"        "d93f0b" "Blocco D — RF24-RF27"
lab "blocco:inbox"        "c2e0c6" "Blocco E — RF28-RF32"
lab "blocco:routine"      "bfd4f2" "Blocco F — RF33-RF39, routine Cowork"
lab "blocco:infra"        "666666" "Repo, test, CI, tracciamento"

lab "tipo:requisito"      "0052cc" "Implementa un RF o un RNF delle specifiche"
lab "tipo:bug"            "b60205" "Comportamento che viola una regola gia implementata"
lab "tipo:operativo"      "fef2c0" "Non si chiude con codice: si chiude facendo girare qualcosa"
lab "tipo:spec"           "e99695" "Cambia o chiarisce le specifiche, non il codice"
lab "fuori-perimetro-v1"  "ededed" "Dichiarato fuori dalla v1 dal capitolo 13"

echo "==> Milestone"
ms() {
  if gh api "repos/$REPO/milestones?state=all" --jq '.[].title' | grep -qx "$1"; then
    echo "    $1 (gia presente)"
  else
    gh api "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null
    echo "    $1"
  fi
}

ms "v1 completa" "Tutti gli RF e RNF della specifica v2.1 dentro il perimetro del capitolo 13 sono soddisfatti e coperti da un test."
ms "v2 — dopo 3 settimane" "Si riempie con i dati d'uso reale: quali moduli saltati, quali aree rimaste a zero, quali sezioni chieste. Vuota per scelta finche quei dati non esistono."

echo "==> Issue"
BODY_DIR="$(mktemp -d)"
declare -a CREATED=()

mkissue() { # titolo, label-csv, milestone, corpo
  local titolo="$1" labels="$2" milestone="$3" corpo="$4"
  if gh issue list --repo "$REPO" --state all --search "\"$titolo\" in:title" --json title --jq '.[].title' | grep -qx "$titolo"; then
    echo "    salto (gia presente): $titolo"
    return
  fi
  local f="$BODY_DIR/$(echo "$titolo" | tr -cd '[:alnum:]').md"
  printf '%s\n' "$corpo" > "$f"
  local url
  if [ -n "$milestone" ]; then
    url=$(gh issue create --repo "$REPO" --title "$titolo" --body-file "$f" --label "$labels" --milestone "$milestone")
  else
    url=$(gh issue create --repo "$REPO" --title "$titolo" --body-file "$f" --label "$labels")
  fi
  CREATED+=("$url")
  echo "    $url  $titolo"
}

M1="v1 completa"

mkissue "Roadmap — RF43-RF54, R13, R14" "tipo:requisito,blocco:roadmap" "$M1" \
"Epic. Il capitolo 5 delle specifiche v2.1 non esiste nel codice: nessun milestones.json, nessun roadmap.ts, nessuna quarta tab.

Si chiude quando tutte le sotto-issue sono chiuse e la roadmap e il primo elemento della pagina di apertura.

- [ ] dati e schemi
- [ ] derivazione delle tre zone
- [ ] avanzamento immediato
- [ ] pagina Roadmap
- [ ] il registro scritto dalla routine

Vincoli che valgono su tutte: R13 il futuro e proiezione non promessa, R14 ogni modifica va dichiarata, RF48 stime in sessioni mai in giorni, RF54 nessuna percentuale complessiva."

mkissue "RF44, RF45 — le tappe come entita dati" "tipo:requisito,blocco:roadmap" "$M1" \
"data/milestones.json e data/registry.json, piu i due schemi Zod in shared/schema.ts.

Accettazione
- fra 8 e 12 tappe, ciascuna con nome, obiettivo in una frase, corsi inclusi, prerequisiti, cosa sblocca, stato
- una tappa RIFERISCE i corsi, non li duplica
- moduli completati su totali non e un campo: si calcola
- lo schema rifiuta una tappa senza cosa_sblocca e un registro senza causa"

mkissue "RF46-RF49 — derivazione delle tre zone" "tipo:requisito,blocco:roadmap" "$M1" \
"server/roadmap.ts piu GET /api/roadmap.

Accettazione
- esattamente una tappa in 'adesso'
- 'prossimo' ordinato per punteggio medio dei moduli candidati, ricalcolato a ogni chiamata
- la risposta non contiene nessuna data ne nessun impegno modulo-sessione (R13)
- 'fatto' e derivato dallo storico e non cambia mai ordine"

mkissue "RF50 — la roadmap avanza al completamento del modulo" "tipo:requisito,blocco:roadmap" "$M1" \
"L'avanzamento e immediato, non aspetta la routine. Aggancio alla rotta di completamento in server/routes/modules.ts.

Accettazione
- un test completa un modulo e verifica che la tappa sia avanzata nella stessa richiesta
- se era l'ultimo modulo, la tappa passa a fatta e 'prossimo' si ricalcola"

mkissue "RF43, RF52, RF53, RF54 — pagina Roadmap" "tipo:requisito,blocco:roadmap" "$M1" \
"web/src/pages/Roadmap.tsx, sopra il modulo del giorno.

Accettazione
- tre zone distinte, tutte le tappe visibili dal primo giorno comprese quelle bloccate
- ultime 5 righe di registro sotto la roadmap, quelle cambiate dall'ultima apertura in evidenza
- nessuna percentuale complessiva da nessuna parte
- RNF9: leggibile senza scorrere su uno schermo da portatile"

mkissue "RF51, R14 — la routine scrive il registro" "tipo:requisito,blocco:routine,blocco:roadmap" "$M1" \
"Aggiornare il prompt della routine Cowork: ogni modifica alla roadmap produce una riga in linguaggio naturale con la causa.

Accettazione
- una passata di routine che allunga una tappa lascia una riga che dice cosa e cambiato e perche
- nessuna modifica silenziosa: un giro senza righe di registro e un giro che non ha cambiato niente"

mkissue "RF17 — mostrare la valutazione accanto alle risposte" "tipo:requisito,blocco:curriculum" "$M1" \
"La parola 'valutazione' non compare in tutto web/src. La routine valuta, il dato finisce in reviews.json, l'utente non lo legge mai: meta del ciclo di verifica e invisibile.

Ci sono 3 review in attesa dal 16/09 che oggi non avrebbero dove comparire.

Accettazione: aperto un modulo completato si vedono le risposte date e, se arrivata, la valutazione con punteggio e commento."

mkissue "RF5 — alternativa a testo libero al quiz di calibrazione" "tipo:requisito,blocco:calibrazione" "$M1" \
"Oggi o rispondi a tutte le domande a scelta multipla o non entri.

Accettazione: dall'onboarding si puo descrivere a testo libero la propria preparazione; il testo finisce in coda per la routine, che scrive i livelli con livello_fonte dichiarato."

mkissue "RF6 — calibrazione ripetibile su richiesta" "tipo:requisito,blocco:calibrazione" "$M1" \
"App.tsx entra nell'onboarding solo se calibrazione.fatta_il e null, e non c'e nessun modo di rifarla.

Accettazione: esiste un comando esplicito per rifare la calibrazione; i livelli gia derivati da moduli completati non vengono azzerati."

mkissue "RF26 — mostrare la provenienza del livello" "tipo:requisito,blocco:mappa" "$M1" \
"livello_fonte esiste nei dati ma non nella Knowledge Map.

Accettazione: ogni area mostra se il livello viene da calibrazione, moduli o dichiarazione."

mkissue "Rabbocca il buffer a 7 e valuta le 3 review in attesa" "tipo:operativo,blocco:routine" "$M1" \
"Stato al 16/09: 4 moduli pronto invece di 7, 3 review in_attesa, 3 richieste valuta_review in coda.

Con il buffer a 4 RNF3 non e soddisfatto: il sito regge circa una settimana senza routine, non due.

Si chiude con un giro di routine Cowork. Non serve toccare il codice."

mkissue "docs/SPEC.md — la specifica v2.1 entra nel repo" "tipo:spec,blocco:infra" "$M1" \
"In docs/ c'e ancora la v1, disallineata. La verita deve stare nel git: ogni cambio di requisito diventa un diff leggibile.

Accettazione: docs/SPEC.md e la v2.1, docs/agent-teacher-specifica-v1.md e spostata in docs/archivio/."

mkissue "spec/requirements.yaml e npm run spec:check" "tipo:spec,blocco:infra" "$M1" \
"Una riga per RF, RNF e R con stato, file e test che lo copre.

Accettazione: lo script stampa la percentuale e ESCE CON ERRORE se un requisito marcato fatto non ha un test che lo cita. E la differenza fra una checklist che si crede e un avanzamento che si misura."

mkissue "CI: npm test e spec:check a ogni push" "tipo:spec,blocco:infra" "$M1" \
".github/workflows/ci.yml.

Attenzione: node_modules in cartella e installato per macOS. La CI gira su Linux con npm ci pulito, e il primo giro serve anche a verificare che i test passino davvero fuori dal Mac."

mkissue "Capitolo 1.6 — la v1 prevede l'aggancio al multi-utente?" "tipo:spec" "" \
"Marcato [DA DECIDERE] nelle specifiche. Il codice ha gia deciso di fatto: profile.json e un oggetto singolo e nessuna rotta ha un concetto di utente.

Rifarlo dopo costa poco — un livello di indirizzamento sul path dei dati — quindi la decisione puo restare aperta senza pagarla adesso. Questa issue esiste per renderla esplicita, non per chiuderla in fretta. Nessuna milestone di proposito."

echo "==> Project"
PNUM=$(gh project list --owner "$OWNER" --format json --jq ".projects[] | select(.title==\"$PROJECT_TITLE\") | .number" | head -1)
if [ -z "$PNUM" ]; then
  PNUM=$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" --format json --jq .number)
  echo "    creato project #$PNUM"
else
  echo "    project #$PNUM gia presente"
fi

echo "==> Campi del project"
gh project field-create "$PNUM" --owner "$OWNER" --name "Esecutore" \
  --data-type SINGLE_SELECT --single-select-options "Claude Code,Cowork,A mano" >/dev/null 2>&1 \
  && echo "    Esecutore" || echo "    Esecutore (gia presente)"
gh project field-create "$PNUM" --owner "$OWNER" --name "Stima" \
  --data-type SINGLE_SELECT --single-select-options "S — meno di 1h,M — mezza giornata,L — piu di un giorno" >/dev/null 2>&1 \
  && echo "    Stima" || echo "    Stima (gia presente)"

echo "==> Aggiunta delle issue al project"
for url in "${CREATED[@]}"; do
  gh project item-add "$PNUM" --owner "$OWNER" --url "$url" >/dev/null
done
echo "    ${#CREATED[@]} issue aggiunte"

cat <<'FINE'

Fatto. Restano tre cose da fare a mano nell'interfaccia, perche gh non le espone:

1. Project -> ... -> Workflows: accendi "Item closed -> Done", "Pull request merged -> Done"
   e "Auto-add to project" con filtro  is:issue is:open  sul repo.
2. Crea le due viste oltre alla board:
   - tabella raggruppata per Esecutore  (cosa fare quando apri Claude Code, cosa quando apri Cowork)
   - tabella filtrata  label:tipo:requisito -status:Done  ordinata per titolo (i requisiti ancora scoperti)
3. Nella board, raggruppa per Status e attiva il campo Milestone fra le colonne visibili.

FINE
