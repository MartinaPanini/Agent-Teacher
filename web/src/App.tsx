import { useEffect, useState } from "react";
import { getProfile } from "./api/client";
import Onboarding from "./pages/Onboarding";
import Daily from "./pages/Daily";

type Stato = { fase: "caricamento" } | { fase: "errore"; messaggio: string } | { fase: "onboarding" } | { fase: "pronto" };

export default function App() {
  const [stato, setStato] = useState<Stato>({ fase: "caricamento" });

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

  return <Daily />;
}
