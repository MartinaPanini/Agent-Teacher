import { useEffect, useState } from "react";
import { getProfile } from "./api/client";
import Onboarding from "./pages/Onboarding";
import Daily from "./pages/Daily";
import Curriculum from "./pages/Curriculum";
import KnowledgeMap from "./pages/KnowledgeMap";

type Pagina = "daily" | "curriculum" | "mappa";
type Stato = { fase: "caricamento" } | { fase: "errore"; messaggio: string } | { fase: "onboarding" } | { fase: "pronto" };

export default function App() {
  const [stato, setStato] = useState<Stato>({ fase: "caricamento" });
  const [pagina, setPagina] = useState<Pagina>("daily");

  useEffect(() => {
    getProfile()
      .then((profile) => {
        setStato(profile.calibrazione.fatta_il === null ? { fase: "onboarding" } : { fase: "pronto" });
      })
      .catch((err) => setStato({ fase: "errore", messaggio: err instanceof Error ? err.message : "errore" }));
  }, []);

  if (stato.fase === "caricamento") {
    return <main className="scaffold-placeholder">Caricamento...</main>;
  }

  if (stato.fase === "errore") {
    return <main className="scaffold-placeholder">Errore: {stato.messaggio}</main>;
  }

  if (stato.fase === "onboarding") {
    return <Onboarding onComplete={() => setStato({ fase: "pronto" })} />;
  }

  return (
    <>
      <nav className="tab-bar">
        <button className={pagina === "daily" ? "tab-attiva" : ""} onClick={() => setPagina("daily")}>
          Daily
        </button>
        <button className={pagina === "curriculum" ? "tab-attiva" : ""} onClick={() => setPagina("curriculum")}>
          Curriculum
        </button>
        <button className={pagina === "mappa" ? "tab-attiva" : ""} onClick={() => setPagina("mappa")}>
          Knowledge Map
        </button>
      </nav>
      {pagina === "daily" && <Daily />}
      {pagina === "curriculum" && <Curriculum />}
      {pagina === "mappa" && <KnowledgeMap />}
    </>
  );
}
