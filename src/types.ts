export type IconKey = 'moon' | 'mask' | 'quiz' | 'book' | 'fan' | 'play' | 'game';

export interface EventItem {
  id: string;
  title: string;
  tagline: string;
  /** Long display date, e.g. "Fri · 3 Oct 2026" */
  date: string;
  time: string;
  venue: string;
  desc: string;
  /** Rupees; 0 means free */
  price: number;
  seatsTotal: number;
  seatsLeft: number;
  accent: [string, string];
  icon: IconKey;
  featured?: boolean;
  /** Poster bits */
  day: string;
  month: string;
}

/** Lifecycle of an e-ticket. `active` = payment verified by the host. */
export type TicketStatus = 'pending' | 'active' | 'checked_in';

/** A booking as stored in localStorage and printed on the e-ticket. */
export interface TicketRecord {
  ref: string;
  eventId: string;
  eventTitle: string;
  name: string;
  email: string;
  seats: number;
  /** Rupees actually payable (price * seats; 0 for free events) */
  amount: number;
  status: TicketStatus;
  createdAt: string;
}
