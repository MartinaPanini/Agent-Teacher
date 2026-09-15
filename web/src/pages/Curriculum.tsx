import { useEffect, useState } from "react";
import { getCourses, type CourseEspanso } from "../api/client";

const STATO_MODULO_LABEL: Record<string, string> = {
  bozza: "in preparazione",
  pronto: "disponibile",
  servito: "in corso",
  completato: "completato",
};

export default function Curriculum() {
  const [corsi, setCorsi] = useState<CourseEspanso[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    getCourses()
      .then(setCorsi)
      .catch((err) => setErrore(err instanceof Error ? err.message : "errore sconosciuto"));
  }, []);

  if (errore) {
    return (
      <main className="curriculum">
        <p className="errore">{errore}</p>
      </main>
    );
  }
  if (!corsi) {
    return <main className="curriculum">Caricamento...</main>;
  }

  return (
    <main className="curriculum">
      <h1>Curriculum</h1>
      {corsi.map((c) => {
        const tuttiBozza = c.moduli_espansi.length > 0 && c.moduli_espansi.every((m) => m.stato === "bozza");
        return (
          <section key={c.id} className="corso">
            <div className="corso-intestazione">
              <h2>{c.titolo}</h2>
              <span className={`corso-stato corso-stato--${c.stato.replace(" ", "-")}`}>{c.stato}</span>
            </div>
            <p className="corso-obiettivo">{c.obiettivo}</p>
            {tuttiBozza && (
              <p className="corso-in-preparazione">In preparazione — nessun contenuto generato ancora.</p>
            )}
            <ol className="corso-moduli">
              {c.moduli_espansi.map((m) => (
                <li key={m.id} className={`modulo-riga modulo-riga--${m.stato}`}>
                  <span className="modulo-titolo">{m.titolo}</span>
                  {m.nuovo && <span className="etichetta-nuovo">nuovo</span>}
                  <span className="modulo-badge">{STATO_MODULO_LABEL[m.stato]}</span>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </main>
  );
}
