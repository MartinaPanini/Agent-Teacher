import type { ReactNode } from "react";
import type { Module } from "@shared/schema";
import Markdown from "./Markdown";

const ETICHETTA_RUOLO: Record<string, string> = {
  principale: "Modulo principale",
  scoperta: "Scoperta",
  ripasso: "Ripasso",
};

interface Props {
  modulo: Module;
  ruolo: "principale" | "scoperta" | "ripasso";
  motivazione?: string | null;
  compatta?: boolean;
  children?: ReactNode;
}

export default function ModuleCard({ modulo, ruolo, motivazione, compatta, children }: Props) {
  return (
    <section className={`module-card module-card--${ruolo}${compatta ? " module-card--compatta" : ""}`}>
      <p className="module-card-ruolo">{ETICHETTA_RUOLO[ruolo]}</p>
      <h2>{modulo.titolo}</h2>
      {motivazione && <p className="module-card-motivazione">{motivazione}</p>}
      <p className="module-card-obiettivo">{modulo.obiettivo}</p>
      <p className="module-card-durata">{modulo.durata_min} min</p>

      {modulo.prerequisiti_testo && (
        <details className="module-card-prereq">
          <summary>Prerequisiti</summary>
          <Markdown testo={modulo.prerequisiti_testo} />
        </details>
      )}

      <Markdown testo={modulo.sintesi_md} className="module-card-sintesi" />

      {modulo.fonte_primaria && (
        <p className="module-card-fonte">
          Fonte:{" "}
          <a href={modulo.fonte_primaria.url} target="_blank" rel="noreferrer">
            {modulo.fonte_primaria.titolo}
          </a>{" "}
          (verificata il {modulo.fonte_primaria.verificata_il})
        </p>
      )}

      {children && <div className="module-card-azioni">{children}</div>}
    </section>
  );
}
