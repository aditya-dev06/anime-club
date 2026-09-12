/*
 * Tiny pub/sub bus for easter-egg events. Any module can fire an egg and any
 * mounted UI (EggToast) renders it — keeps egg effects fully decoupled.
 */

export type EggAccent = 'straw' | 'purple' | 'red' | 'green' | 'shadow';

export interface EggEvent {
  /** Stable id, e.g. 'return-by-death' */
  id: string;
  title: string;
  subtitle?: string;
  accent?: EggAccent;
}

type Handler = (e: EggEvent) => void;
const handlers = new Set<Handler>();

export function fireEgg(e: EggEvent): void {
  handlers.forEach((h) => {
    try {
      h(e);
    } catch {
      /* a broken listener must not kill the rest */
    }
  });
}

export function onEgg(handler: Handler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}
