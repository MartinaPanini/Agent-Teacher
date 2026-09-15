import { useState, type FormEvent } from "react";
import { postInbox } from "../api/client";

type Stato = "chiuso" | "aperto" | "invio" | "fatto" | "errore";

export default function CatturaLink() {
  const [stato, setStato] = useState<Stato>("chiuso");
  const [url, setUrl] = useState("");
  const [didascalia, setDidascalia] = useState("");
  const [errore, setErrore] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      // eslint-disable-next-line no-new
      new URL(url);
    } catch {
      setErrore("URL non valido");
      setStato("errore");
      return;
    }
    setStato("invio");
    try {
      await postInbox(url, didascalia.trim() || undefined);
      setStato("fatto");
      setUrl("");
      setDidascalia("");
      setTimeout(() => setStato("chiuso"), 1200);
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "errore sconosciuto");
      setStato("errore");
    }
  }

  if (stato === "chiuso" || stato === "fatto") {
    return (
      <div className="cattura-link">
        <button className="cattura-link-toggle" onClick={() => setStato("aperto")}>
          {stato === "fatto" ? "Salvato ✓" : "+ Salva link"}
        </button>
      </div>
    );
  }

  return (
    <div className="cattura-link cattura-link--aperto">
      <form className="cattura-link-form" onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          autoFocus
        />
        <input
          type="text"
          placeholder="didascalia (opzionale)"
          value={didascalia}
          onChange={(e) => setDidascalia(e.target.value)}
        />
        <div className="cattura-link-azioni">
          <button type="submit" disabled={stato === "invio"}>
            {stato === "invio" ? "Salvo..." : "Salva"}
          </button>
          <button type="button" className="secondario" onClick={() => setStato("chiuso")}>
            Annulla
          </button>
        </div>
        {stato === "errore" && errore && <p className="errore">{errore}</p>}
      </form>
    </div>
  );
}
