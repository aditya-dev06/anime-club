/*
 * localStorage-backed event store shared by the main site and the admin
 * console (same origin). First load seeds the static EVENTS list; every save
 * dispatches EVENTS_CHANGED so live tabs can re-read.
 */

import { EVENTS } from '../data/events';
import type { EventItem } from '../types';

export type StoredEvent = EventItem & { createdAt: string };

export const EVENTS_KEY = 'ac-events';
export const EVENTS_CHANGED = 'ac-events-change';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function loadEvents(): StoredEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredEvent[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fall through to seed */
  }
  const seeded: StoredEvent[] = EVENTS.map((e) => ({ ...e, createdAt: new Date().toISOString() }));
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(seeded));
  } catch {
    /* storage unavailable — serve the seed in-memory */
  }
  return seeded;
}

export function saveEvents(list: StoredEvent[]): void {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(EVENTS_CHANGED));
}

export function makeEventId(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'event';
  return `${slug}-${Math.floor(100 + Math.random() * 900)}`;
}

/** "2026-10-03" → { day: "03", month: "OCT" } for the manga posters. */
export function deriveDayMonth(dateISO: string): { day: string; month: string } {
  const d = new Date(dateISO + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return { day: '01', month: 'JAN' };
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: MONTHS[d.getMonth()],
  };
}

/** Accent palette cycled for new events (matches the poster design system). */
export const ACCENT_PALETTE: Array<[string, string]> = [
  ['#e2a94a', '#b9832f'],
  ['#e5484d', '#8f1f1f'],
  ['#8b5cf6', '#5b3bb0'],
  ['#5fb08a', '#2f6b4f'],
  ['#e07a5f', '#a24a33'],
];
