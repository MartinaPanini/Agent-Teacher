import { useEffect, useRef, useState } from "react";
import {
  getSessionNext,
  apriSessione,
  chiudiSessione,
  chiudiSessioneBeacon,
  completaModulo,
  scopertaFeedback,
  qualificaInbox,
  type SessionNextRisposta,
} from "../api/client";
import EmptyState from "../components/EmptyState";
import ModuleCard from "../components/ModuleCard";

type FaseModulo = "da_leggere" | "domande" | "fatto";

export default function Daily() {
  const [dati, setDati] = useState<SessionNextRisposta | null>(null);
  const [sessioneId, setSessioneId] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [faseModulo, setFaseModulo] = useState<FaseModulo>("da_leggere");
  const [risposteDomande, setRisposteDomande] = useState<string[]>([]);
  const [sessioneChiusa, setSessioneChiusa] = useState(false);
  const [noteQualifica, setNoteQualifica] = useState<Record<string, string>>({});
  const [qualificaFatte, setQualificaFatte] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancellato = false;
    getSessionNext()
      .then(async (risposta) => {
        if (cancellato) return;
        setDati(risposta);
        if (!risposta.vuoto) {
          const sessione = await apriSessione(
            risposta.items.map((it) => ({ module_id: it.module_id, ruolo: it.ruolo })),
            risposta.qualifica_inbox.map((e) => e.id),
          );
          if (!cancellato) setSessioneId(sessione.id);
        }
      })
      .catch((err) => setErrore(err instanceof Error ? err.message : "errore sconosciuto"));
    return () => {
      cancellato = true;
    };
  }, []);

  // se la scheda viene chiusa a metà sessione, il server non riceve mai la
  // POST di chiusura e la sessione resta "aperta" per sempre: la chiudiamo
  // qui via sendBeacon, l'unico modo affidabile in questa fase della pagina.
  const sessioneIdRef = useRef<string | null>(null);
  const sessioneChiusaRef = useRef(false);
  useEffect(() => {
    sessioneIdRef.current = sessioneId;
  }, [sessioneId]);
  useEffect(() => {
    sessioneChiusaRef.current = sessioneChiusa;
  }, [sessioneChiusa]);
  useEffect(() => {
    function handlePageHide() {
      if (sessioneIdRef.current && !sessioneChiusaRef.current) {
        chiudiSessioneBeacon(sessioneIdRef.current);
      }
    }
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  if (errore) {
    return (
      <main className="daily">
        <p className="errore">{errore}</p>
      </main>
    );
  }
  if (!dati) {
    return <main className="daily">Caricamento...</main>;
  }
  if (dati.vuoto) {
    return <EmptyState messaggio={dati.messaggio} cosaIgnorare={dati.cosa_ignorare_oggi} />;
  }

  const principale = dati.items.find((i) => i.ruolo === "principale");
  const scoperta = dati.items.find((i) => i.ruolo === "scoperta");
  const ripasso = dati.items.filter((i) => i.ruolo === "ripasso");

  function handleFatto() {
    setFaseModulo("domande");
    setRisposteDomande(new Array(principale?.modulo?.domande.length ?? 0).fill(""));
  }

  async function handleSubmitDomande(salta: boolean) {
    if (!principale?.modulo) return;
    const risposte = salta
      ? []
      : principale.modulo.domande.map((d, i) => ({ q: d.q, risposta: risposteDomande[i] ?? "" }));
    await completaModulo(principale.modulo.id, { session_id: sessioneId ?? undefined, risposte });
    setFaseModulo("fatto");
    if (!scoperta?.modulo && sessioneId) {
      await chiudiSessione(sessioneId);
      setSessioneChiusa(true);
    }
  }

  async function handleScopertaFeedback(f: "interessante" | "non_fa_per_me") {
    if (scoperta?.modulo) await scopertaFeedback(scoperta.modulo.id, f);
    if (sessioneId) await chiudiSessione(sessioneId);
    setSessioneChiusa(true);
  }

  async function handleQualifica(id: string) {
    await qualificaInbox(id, noteQualifica[id] ?? "");
    setQualificaFatte((s) => new Set(s).add(id));
  }

  return (
    <main className="daily">
      {ripasso.length > 0 && (
        <section className="daily-ripasso">
          <h2>Ripasso (10 min)</h2>
          <p>Sono passati più di 10 giorni dall'ultima sessione. Rivedi in fretta:</p>
          <ul>
            {ripasso.map((r) => (
              <li key={r.module_id}>{r.modulo?.titolo}</li>
            ))}
          </ul>
        </section>
      )}

      {dati.qualifica_inbox.length > 0 && (
        <section className="daily-qualifica">
          <h2>Da qualificare</h2>
          {dati.qualifica_inbox.map((voce) => (
            <div key={voce.id} className="qualifica-voce">
              <a href={voce.url} target="_blank" rel="noreferrer">
                {voce.url}
              </a>
              {qualificaFatte.has(voce.id) ? (
                <span className="qualifica-ok">fatto</span>
              ) : (
                <div className="qualifica-form">
                  <input
                    type="text"
                    placeholder="una riga: cosa ne pensi?"
                    value={noteQualifica[voce.id] ?? ""}
                    onChange={(e) => setNoteQualifica((n) => ({ ...n, [voce.id]: e.target.value }))}
                  />
                  <button onClick={() => handleQualifica(voce.id)}>Fatto</button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {principale?.modulo && (
        <ModuleCard modulo={principale.modulo} ruolo="principale" motivazione={principale.motivazione}>
          {faseModulo === "da_leggere" && <button onClick={handleFatto}>Fatto</button>}

          {faseModulo === "domande" && (
            <div className="domande">
              {principale.modulo.domande.map((d, i) => (
                <label key={i} className="domanda">
                  {d.q}
                  <textarea
                    value={risposteDomande[i] ?? ""}
                    onChange={(e) =>
                      setRisposteDomande((r) => {
                        const copia = [...r];
                        copia[i] = e.target.value;
                        return copia;
                      })
                    }
                  />
                </label>
              ))}
              <div className="domande-azioni">
                <button onClick={() => void handleSubmitDomande(false)}>Invia</button>
                <button className="secondario" onClick={() => void handleSubmitDomande(true)}>
                  Salta
                </button>
              </div>
            </div>
          )}

          {faseModulo === "fatto" && <p className="fatto-conferma">Fatto. Il livello sale.</p>}
        </ModuleCard>
      )}

      {faseModulo === "fatto" && scoperta?.modulo && !sessioneChiusa && (
        <ModuleCard modulo={scoperta.modulo} ruolo="scoperta" compatta>
          <div className="scoperta-azioni">
            <button onClick={() => void handleScopertaFeedback("interessante")}>Interessante</button>
            <button className="secondario" onClick={() => void handleScopertaFeedback("non_fa_per_me")}>
              Non fa per me
            </button>
          </div>
        </ModuleCard>
      )}

      {sessioneChiusa && <p className="sessione-chiusa">Sessione chiusa. A presto.</p>}

      {dati.cosa_ignorare_oggi.length > 0 && (
        <section className="daily-ignora">
          <h2>Cosa ignorare oggi</h2>
          <ul>
            {dati.cosa_ignorare_oggi.map((riga, i) => (
              <li key={i}>{riga}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
