import { useEffect, useState } from "react";
import { getSkills, type SkillArricchita } from "../api/client";

const LIVELLO_LABEL: Record<number, string> = {
  0: "Non iniziato",
  1: "So di cosa si tratta",
  2: "So seguire qualcuno che lo fa",
  3: "So farlo da sola",
  4: "So adattarlo e spiegarlo",
};

export default function KnowledgeMap() {
  const [skills, setSkills] = useState<SkillArricchita[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    getSkills()
      .then(setSkills)
      .catch((err) => setErrore(err instanceof Error ? err.message : "errore sconosciuto"));
  }, []);

  if (errore) {
    return (
      <main className="knowledge-map">
        <p className="errore">{errore}</p>
      </main>
    );
  }
  if (!skills) {
    return <main className="knowledge-map">Caricamento...</main>;
  }

  const skillsById = new Map(skills.map((s) => [s.id, s]));
  const aree = Array.from(new Set(skills.map((s) => s.area))).sort();

  return (
    <main className="knowledge-map">
      <h1>Knowledge Map</h1>
      <p className="knowledge-map-intro">
        Tutte le aree esistono dal primo giorno, comprese quelle a zero: vedere dove non sei ancora arrivata è il
        punto di questa pagina, non un dettaglio.
      </p>

      {aree.map((area) => (
        <section key={area} className="area-gruppo">
          <h2>{area.replace(/-/g, " ")}</h2>
          <div className="area-griglia">
            {skills
              .filter((s) => s.area === area)
              .map((s) => (
                <article key={s.id} className={`skill-card skill-card--livello-${s.livello}`}>
                  <h3>{s.nome}</h3>
                  <p className="skill-card-livello">
                    Livello {s.livello} — {LIVELLO_LABEL[s.livello]}
                  </p>
                  <p className="skill-card-moduli">
                    {s.moduli_totali > 0 ? `${s.moduli_completati}/${s.moduli_totali} moduli` : "nessun corso ancora"}
                  </p>
                  {s.prerequisiti_mancanti.length > 0 ? (
                    <p className="skill-card-bloccata">
                      Bloccata da: {s.prerequisiti_mancanti.map((id) => skillsById.get(id)?.nome ?? id).join(", ")}
                    </p>
                  ) : s.prossimo_modulo ? (
                    <p className="skill-card-prossimo">Prossimo: {s.prossimo_modulo.titolo}</p>
                  ) : s.moduli_totali > 0 && s.moduli_completati >= s.moduli_totali ? (
                    <p className="skill-card-completa">Corso completo</p>
                  ) : (
                    <p className="skill-card-in-preparazione">In preparazione</p>
                  )}
                </article>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
