import { renderMarkdown } from "@shared/markdown";

interface Props {
  testo: string;
  className?: string;
  /** Livello del primo titolo: dentro una card i titoli partono da h3. */
  livelloTitoloBase?: number;
}

/**
 * Mostra un testo markdown formattato.
 * L'HTML viene generato da renderMarkdown, che escapa sempre il sorgente:
 * qui non passa mai HTML scritto altrove.
 */
export default function Markdown({ testo, className, livelloTitoloBase = 3 }: Props) {
  if (!testo) return null;
  return (
    <div
      className={className ? `prosa ${className}` : "prosa"}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(testo, { livelloTitoloBase }) }}
    />
  );
}
