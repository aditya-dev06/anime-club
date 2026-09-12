/*
 * Signed e-ticket codes.
 *
 * A ticket QR encodes `AC1.<payload>.<sig>` where payload is base64url JSON
 * and sig is a keyed 64-bit FNV-1a hash of the payload + demo secret. The
 * host page (/verify) decodes and checks the signature offline — no backend
 * needed for the demo. NOTE: this is a demo-grade signature, not
 * cryptographic; a real deployment must sign server-side.
 */

export interface TicketPayload {
  ref: string;
  eventId: string;
  name: string;
  seats: number;
  /** Issued-at, epoch ms */
  ts: number;
}

const VERSION = 'AC1';
const SECRET = 'ac-vitb-demo-secret-v1';

function b64urlEncode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Keyed 64-bit FNV-1a over (secret + data). Deterministic, dependency-free. */
function keyedHash(data: string): string {
  let h1 = 0xcbf29ce4 ^ SECRET.length;
  let h2 = 0x84222325;
  const input = SECRET + '|' + data;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = (h1 ^ c) >>> 0;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (h2 ^ Math.imul(c + i, 0x01000193)) >>> 0;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

export function makeTicketCode(p: TicketPayload): string {
  const payload = b64urlEncode(JSON.stringify(p));
  return `${VERSION}.${payload}.${keyedHash(payload)}`;
}

export function parseTicketCode(
  code: string,
): { ok: true; payload: TicketPayload } | { ok: false; reason: string } {
  const raw = code.trim();
  const parts = raw.split('.');
  if (parts.length !== 3 || parts[0] !== VERSION) {
    return { ok: false, reason: 'Not an Otaku Club ticket code.' };
  }
  const [, payload, sig] = parts;
  if (keyedHash(payload) !== sig.toLowerCase()) {
    return { ok: false, reason: 'Signature mismatch — this code was tampered with or is fake.' };
  }
  try {
    const p = JSON.parse(b64urlDecode(payload)) as Partial<TicketPayload>;
    if (typeof p.ref !== 'string' || !/^AC-[A-Z0-9]{2}-\d{4}$/.test(p.ref)) {
      return { ok: false, reason: 'Malformed booking reference.' };
    }
    if (typeof p.eventId !== 'string' || typeof p.name !== 'string' || p.name.length < 2) {
      return { ok: false, reason: 'Malformed attendee data.' };
    }
    if (typeof p.seats !== 'number' || p.seats < 1 || p.seats > 6) {
      return { ok: false, reason: 'Invalid seat count.' };
    }
    return {
      ok: true,
      payload: { ref: p.ref, eventId: p.eventId, name: p.name, seats: p.seats, ts: p.ts ?? 0 },
    };
  } catch {
    return { ok: false, reason: 'Unreadable code.' };
  }
}

/** localStorage key for the host's check-in log: Array<{ref, name, seats, at}> */
export const CHECKINS_KEY = 'ac-checkins';

export interface CheckinRecord {
  ref: string;
  name: string;
  seats: number;
  at: string;
}

export function loadCheckins(): CheckinRecord[] {
  try {
    return JSON.parse(localStorage.getItem(CHECKINS_KEY) ?? '[]') as CheckinRecord[];
  } catch {
    return [];
  }
}

export function saveCheckin(rec: CheckinRecord): CheckinRecord[] {
  const next = [rec, ...loadCheckins()];
  try {
    localStorage.setItem(CHECKINS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — check-in still shown this session */
  }
  return next;
}
