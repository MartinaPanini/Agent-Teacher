import { useState } from "react";
import { DOMANDE_CALIBRAZIONE } from "@shared/onboarding-questions";
import { postOnboarding } from "../api/client";

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [risposte, setRisposte] = useState<Record<string, string>>({});
  const [inviando, setInviando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const tutteRisposte = DOMANDE_CALIBRAZIONE.every((d) => risposte[d.id]);

  async function handleSubmit() {
    setInviando(true);
    setErrore(null);
    try {
      await postOnboarding(DOMANDE_CALIBRAZIONE.map((d) => ({ domanda_id: d.id, opzione_id: risposte[d.id]! })));
      onComplete();
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "errore sconosciuto");
      setInviando(false);
    }
  }

  return (
    <main className="onboarding">
      <h1>Da dove parti</h1>
      <p className="onboarding-intro">
        {DOMANDE_CALIBRAZIONE.length} domande sullo stack agentico, nessuna sulla programmazione. "Non lo so" non
        costa nulla: è un punto di partenza onesto, non un voto.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (tutteRisposte && !inviando) void handleSubmit();
        }}
      >
        {DOMANDE_CALIBRAZIONE.map((d, i) => (
          <fieldset key={d.id} className="onboarding-domanda">
            <legend>
              {i + 1}. {d.testo}
            </legend>
            {d.opzioni.map((o) => (
              <label key={o.id} className="onboarding-opzione">
                <input
                  type="radio"
                  name={d.id}
                  value={o.id}
                  checked={risposte[d.id] === o.id}
                  onChange={() => setRisposte((r) => ({ ...r, [d.id]: o.id }))}
                />
                {o.testo}
              </label>
            ))}
          </fieldset>
        ))}

        {errore && <p className="errore">{errore}</p>}

        <button type="submit" disabled={!tutteRisposte || inviando}>
          {inviando ? "Invio..." : "Inizia"}
        </button>
      </form>
    </main>
  );
}
