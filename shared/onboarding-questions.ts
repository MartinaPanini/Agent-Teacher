// Le domande del quiz di calibrazione (§3.1 della specifica): 6-8 domande a scelta
// multipla, solo sullo stack agentico, con "non lo so" a costo zero. Condivise fra
// web (che le mostra) e server (che interpreta le risposte per calcolare i livelli
// iniziali), così non esiste una seconda copia da tenere sincronizzata.

export interface OpzioneCalibrazione {
  id: string;
  testo: string;
  /** Livello 0-3 implicato da questa risposta (il 4 non si autodichiara in un quiz). */
  livello: number;
}

export interface DomandaCalibrazione {
  id: string;
  testo: string;
  skill_id: string;
  opzioni: OpzioneCalibrazione[];
}

const OPZIONI_STANDARD: OpzioneCalibrazione[] = [
  { id: "non-lo-so", testo: "Non lo so", livello: 0 },
  { id: "ne-ho-sentito-parlare", testo: "Ne ho sentito parlare, ma non l'ho mai usato", livello: 1 },
  { id: "so-seguire", testo: "So seguire una guida per farlo funzionare", livello: 2 },
  { id: "so-farlo", testo: "Saprei spiegarlo o farlo funzionare da sola", livello: 3 },
];

export const DOMANDE_CALIBRAZIONE: DomandaCalibrazione[] = [
  {
    id: "q-fondamenta-llm",
    testo: "Sai spiegare, almeno a grandi linee, come un modello linguistico (LLM) genera la risposta successiva?",
    skill_id: "fondamenta-llm",
    opzioni: OPZIONI_STANDARD,
  },
  {
    id: "q-tool-calling",
    testo: "Sai cos'è un tool call — un modo per far eseguire al modello una funzione esterna e usarne il risultato?",
    skill_id: "tool-calling",
    opzioni: OPZIONI_STANDARD,
  },
  {
    id: "q-mcp",
    testo: "Sai cos'è MCP (Model Context Protocol) e a cosa serve?",
    skill_id: "mcp-protocollo",
    opzioni: OPZIONI_STANDARD,
  },
  {
    id: "q-claude-code",
    testo: "Hai già usato Claude Code (o uno strumento agentico simile) per scrivere codice in autonomia?",
    skill_id: "claude-code",
    opzioni: OPZIONI_STANDARD,
  },
  {
    id: "q-context-economy",
    testo: "Sai cosa si intende per \"context window\" e perché gestirla con cura fa risparmiare token?",
    skill_id: "context-economy",
    opzioni: OPZIONI_STANDARD,
  },
  {
    id: "q-claude-skills",
    testo: "Sai cosa sono le Claude Skills e a cosa servono?",
    skill_id: "claude-skills",
    opzioni: OPZIONI_STANDARD,
  },
  {
    id: "q-orchestrazione",
    testo: "Sai cosa significa far collaborare più agenti fra loro sullo stesso compito (orchestrazione multi-agent)?",
    skill_id: "orchestrazione",
    opzioni: OPZIONI_STANDARD,
  },
  {
    id: "q-evals",
    testo: "Sai cosa sono le \"evals\" — come si misura se un agente funziona bene?",
    skill_id: "evals-sicurezza",
    opzioni: OPZIONI_STANDARD,
  },
];
