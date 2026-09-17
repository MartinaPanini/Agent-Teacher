# Routine Cowork — dove vive adesso

Questo file conteneva la v1 del prompt della routine. È superato dal
17 settembre 2026, quando le lezioni sono passate al formato a slide.

La versione viva sta in due posti, e vanno tenuti allineati:

1. **`claude/routine-cowork.md`**, nel progetto Claude "Agent Teacher".
   È la procedura completa e la fonte di verità operativa: la routine la
   legge a ogni giro.
2. Il prompt dell'attività pianificata **"Agent Teacher — routine
   settimanale"**, che gira nei feriali alle 10:00. È la versione corta,
   che rimanda al documento sopra.

Il formato delle lezioni è in `claude/AT-lezioni-slide.md`. Le regole di
scrittura sono in `docs/STILE.md`, che sta qui nel repo ed è vincolante.

Cosa è cambiato rispetto alla v1:

- un modulo non è più una `sintesi_md` di 300-600 parole, sono 8 slide con
  da 3 a 4 illustrazioni, 700-1100 parole di corpo e almeno 2 approfondimenti;
- `sintesi_md` non si scrive più a mano: lo rigenera `scripts/applica-slide.py`
  dalle slide, e resta la vista a pagina unica;
- la routine può scrivere anche in `scripts/lezioni_slide_data.py` e in file
  nuovi sotto `scripts/illustrazioni/`, mai in `server/`, `web/`, `shared/`
  né in `scripts/genera-illustrazioni.py`;
- prima di chiudere deve passare `scripts/applica-slide.py` e
  `scripts/controlla-stile.py`, entrambi puliti.
