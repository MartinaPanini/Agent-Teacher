import { useEffect, useRef, useState } from "react";
import type { Module, Slide } from "@shared/schema";
import { renderMarkdownInline } from "@shared/markdown";
import Markdown from "./Markdown";

const ETICHETTA_TIPO: Record<Slide["tipo"], string> = {
  apertura: "Apertura",
  concetto: "Concetto",
  procedura: "Procedura",
  esempio: "Esempio",
  trappola: "Trappola",
  chiusura: "Chiusura",
};

interface Props {
  modulo: Module;
  /** slide da cui riprendere (RF59); fuori range viene ricondotta ai limiti validi */
  slideIniziale?: number;
  /** persistenza lato server ad ogni cambio slide — fallisce in silenzio */
  onCambiaSlide?: (indice: number) => void;
  /** presente solo quando la fase corrente ammette di passare alle domande */
  onFatto?: () => void;
}

const TAG_INTERATTIVI = new Set(["INPUT", "TEXTAREA", "BUTTON", "A", "SUMMARY"]);

function fuocoSuElementoInterattivo(): boolean {
  const attivo = document.activeElement;
  return attivo !== null && TAG_INTERATTIVI.has(attivo.tagName);
}

export default function Lezione({ modulo, slideIniziale = 0, onCambiaSlide, onFatto }: Props) {
  const slide = modulo.slide ?? [];
  const totale = slide.length;
  const indiceIniziale = totale === 0 ? 0 : Math.min(Math.max(slideIniziale, 0), totale - 1);

  const [indice, setIndice] = useState(indiceIniziale);
  const [approfondimentiAperti, setApprofondimentiAperti] = useState<Record<number, boolean>>({});
  const cardRef = useRef<HTMLElement>(null);
  const primaVoltaRef = useRef(true);
  const indiceRef = useRef(indice);
  const onCambiaSlideRef = useRef(onCambiaSlide);

  useEffect(() => {
    indiceRef.current = indice;
  }, [indice]);
  useEffect(() => {
    onCambiaSlideRef.current = onCambiaSlide;
  }, [onCambiaSlide]);

  useEffect(() => {
    if (primaVoltaRef.current) {
      primaVoltaRef.current = false;
      return;
    }
    const riduciMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cardRef.current?.scrollIntoView({ behavior: riduciMovimento ? "auto" : "smooth", block: "start" });
  }, [indice]);

  function vai(nuovoIndice: number) {
    if (nuovoIndice < 0 || nuovoIndice >= totale || nuovoIndice === indiceRef.current) return;
    setIndice(nuovoIndice);
    onCambiaSlideRef.current?.(nuovoIndice);
  }

  // registrata una sola volta: legge indice/onCambiaSlide sempre aggiornati tramite ref,
  // così non deve essere ricreata ad ogni cambio di slide.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (fuocoSuElementoInterattivo()) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        vai(indiceRef.current + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        vai(indiceRef.current - 1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const corrente = slide[indice];
  if (!corrente) return null;

  const classeLarghezza = corrente.immagine ? corrente.immagine.larghezza : "nessuna";
  const approfondimentoAperto = approfondimentiAperti[indice] ?? false;

  return (
    <section className="lezione" ref={cardRef}>
      <div className="lezione-contesto">
        <span className="lezione-tipo">{ETICHETTA_TIPO[corrente.tipo]}</span>
        <div className="lezione-barra" role="group" aria-label="Avanzamento della lezione">
          {slide.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`lezione-segmento${i === indice ? " lezione-segmento--attivo" : ""}`}
              aria-label={`Vai alla slide ${i + 1} di ${totale}`}
              aria-current={i === indice ? "step" : undefined}
              onClick={() => vai(i)}
            />
          ))}
        </div>
      </div>

      <div className="lezione-contenuto" aria-live="polite" aria-atomic="true">
        <h3 className="lezione-titolo">{corrente.titolo}</h3>
        <div className={`lezione-slide-corpo lezione-slide-corpo--${classeLarghezza}`}>
          <div className="lezione-testo">
            <Markdown testo={corrente.corpo} livelloTitoloBase={4} className="lezione-corpo" />
            {corrente.punti.length > 0 &&
              (corrente.punti_stile === "numerato" ? (
                <ol className="lezione-punti lezione-punti--numerato">
                  {corrente.punti.map((p, i) => (
                    // renderMarkdownInline escapa il sorgente prima di formattarlo (vedi shared/markdown.ts)
                    <li key={i} dangerouslySetInnerHTML={{ __html: renderMarkdownInline(p) }} />
                  ))}
                </ol>
              ) : (
                <ul className="lezione-punti">
                  {corrente.punti.map((p, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: renderMarkdownInline(p) }} />
                  ))}
                </ul>
              ))}
          </div>
          {corrente.immagine && (
            <div className="lezione-immagine">
              <img src={`/api/illustrazioni/${corrente.immagine.id}.svg`} alt={corrente.immagine.alt} loading="lazy" />
            </div>
          )}
        </div>

        {corrente.approfondimento && (
          <details
            className="lezione-approfondimento"
            open={approfondimentoAperto}
            onToggle={(e) => {
              const aperto = (e.target as HTMLDetailsElement).open;
              setApprofondimentiAperti((stato) => ({ ...stato, [indice]: aperto }));
            }}
          >
            <summary>{corrente.approfondimento.titolo}</summary>
            <Markdown testo={corrente.approfondimento.testo} livelloTitoloBase={4} />
          </details>
        )}
      </div>

      {modulo.fonte_primaria && (
        <p className="lezione-fonte">
          Fonte:{" "}
          <a href={modulo.fonte_primaria.url} target="_blank" rel="noreferrer">
            {modulo.fonte_primaria.titolo}
          </a>{" "}
          (verificata il {modulo.fonte_primaria.verificata_il})
        </p>
      )}

      <div className="lezione-navigazione">
        <button type="button" className="secondario" onClick={() => vai(indice - 1)} disabled={indice === 0}>
          Indietro
        </button>
        <button type="button" onClick={() => vai(indice + 1)} disabled={indice === totale - 1}>
          Avanti
        </button>
        {indice === totale - 1 && onFatto && (
          <button type="button" className="lezione-fatto" onClick={onFatto}>
            Fatto
          </button>
        )}
      </div>
    </section>
  );
}
