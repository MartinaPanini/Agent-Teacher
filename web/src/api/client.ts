import type { Course, InboxEntry, Module, Profile, Skill } from "@shared/schema";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const corpo = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(corpo.error ?? `richiesta fallita: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getProfile(): Promise<Profile> {
  return request<Profile>("/profile");
}

export function postOnboarding(risposte: Array<{ domanda_id: string; opzione_id: string }>): Promise<{ ok: true; skills: Skill[] }> {
  return request("/onboarding", { method: "POST", body: JSON.stringify({ risposte }) });
}

export interface SkillArricchita extends Skill {
  prossimo_modulo: { id: string; titolo: string } | null;
  prerequisiti_mancanti: string[];
}

export function getSkills(): Promise<SkillArricchita[]> {
  return request("/skills");
}

export interface CourseEspanso extends Course {
  moduli_espansi: Module[];
}

export function getCourses(): Promise<CourseEspanso[]> {
  return request("/courses");
}

export function getModule(id: string): Promise<Module> {
  return request(`/modules/${id}`);
}

export interface CompletaModuloRisposta {
  modulo: Module;
  review: { id: string; stato: string };
  skill: (Skill & { moduli_completati: number }) | null;
}

export function completaModulo(
  id: string,
  body: { session_id?: string; risposte: Array<{ q: string; risposta: string }>; nota_libera?: string },
): Promise<CompletaModuloRisposta> {
  return request(`/modules/${id}/completa`, { method: "PATCH", body: JSON.stringify(body) });
}

export function scopertaFeedback(id: string, feedback: "interessante" | "non_fa_per_me"): Promise<{ ok: true }> {
  return request(`/modules/${id}/scoperta-feedback`, { method: "PATCH", body: JSON.stringify({ feedback }) });
}

export interface SessionItemEspanso {
  module_id: string;
  ruolo: "principale" | "scoperta" | "ripasso";
  modulo: Module | null;
  motivazione: string | null;
}

export type SessionNextRisposta =
  | { vuoto: true; messaggio: string; cosa_ignorare_oggi: string[] }
  | {
      vuoto: false;
      numero: number;
      items: SessionItemEspanso[];
      qualifica_inbox: InboxEntry[];
      cosa_ignorare_oggi: string[];
    };

export function getSessionNext(): Promise<SessionNextRisposta> {
  return request("/session/next");
}

export interface SessioneAperta {
  id: string;
  numero: number;
  items: Array<{ module_id: string; ruolo: string }>;
}

export function apriSessione(
  items: Array<{ module_id: string; ruolo: string }>,
  qualifica_inbox: string[],
): Promise<SessioneAperta> {
  return request("/session/apri", { method: "POST", body: JSON.stringify({ items, qualifica_inbox }) });
}

export function chiudiSessione(id: string): Promise<{ id: string }> {
  return request(`/session/${id}/chiudi`, { method: "POST" });
}

export function postInbox(url: string, didascalia?: string): Promise<InboxEntry> {
  return request("/inbox", { method: "POST", body: JSON.stringify({ url, didascalia }) });
}

export function qualificaInbox(id: string, nota_utente: string): Promise<InboxEntry> {
  return request(`/inbox/${id}/qualifica`, { method: "PATCH", body: JSON.stringify({ nota_utente }) });
}
