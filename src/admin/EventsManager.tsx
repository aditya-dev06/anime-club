import { useMemo, useState } from 'react';
import MangaPanelArt from '../components/MangaPanelArt';
import {
  ACCENT_PALETTE,
  deriveDayMonth,
  loadEvents,
  makeEventId,
  saveEvents,
  type StoredEvent,
} from '../lib/eventsStore';
import type { EventItem, IconKey } from '../types';

const ICONS: Array<{ key: IconKey; label: string }> = [
  { key: 'moon', label: 'Screening night' },
  { key: 'mask', label: 'Cosplay' },
  { key: 'quiz', label: 'Quiz' },
  { key: 'book', label: 'Reading' },
  { key: 'fan', label: 'Culture' },
  { key: 'play', label: 'Watch party' },
  { key: 'game', label: 'Gaming' },
];

interface Draft {
  id: string;
  title: string;
  tagline: string;
  date: string;
  time: string;
  venue: string;
  desc: string;
  price: string;
  seatsTotal: string;
  seatsLeft: string;
  icon: IconKey;
  featured: boolean;
  editId: string | null;
}

const emptyDraft: Draft = {
  id: '',
  title: '',
  tagline: '',
  date: '',
  time: '',
  venue: '',
  desc: '',
  price: '0',
  seatsTotal: '100',
  seatsLeft: '100',
  icon: 'moon',
  featured: false,
  editId: null,
};

function draftToEvent(d: Draft): EventItem {
  const { day, month } = deriveDayMonth(d.date);
  return {
    id: d.editId ?? d.id,
    title: d.title.trim() || 'Untitled Event',
    tagline: d.tagline.trim() || 'Anime Club · VIT Bhopal',
    date: d.date || 'TBA',
    time: d.time || 'TBA',
    venue: d.venue || 'VIT Bhopal',
    desc: d.desc,
    price: Math.max(0, Number(d.price) || 0),
    seatsTotal: Math.max(1, Number(d.seatsTotal) || 1),
    seatsLeft: Math.max(0, Number(d.seatsLeft) || 1),
    accent: ACCENT_PALETTE[0],
    icon: d.icon,
    featured: d.featured,
    day,
    month,
  };
}

function eventToDraft(e: StoredEvent): Draft {
  return {
    id: e.id,
    title: e.title,
    tagline: e.tagline,
    date: /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : '',
    time: e.time,
    venue: e.venue,
    desc: e.desc,
    price: String(e.price),
    seatsTotal: String(e.seatsTotal),
    seatsLeft: String(e.seatsLeft),
    icon: e.icon,
    featured: !!e.featured,
    editId: e.id,
  };
}

export default function EventsManager() {
  const [events, setEvents] = useState<StoredEvent[]>(() => loadEvents());
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');

  const preview = useMemo(() => draftToEvent({ ...draft, accent: ACCENT_PALETTE[0] } as Draft), [draft]);
  const accentForNew = ACCENT_PALETTE[events.length % ACCENT_PALETTE.length];

  const openCreate = () => {
    setDraft({ ...emptyDraft });
    setError('');
    setFormOpen(true);
  };

  const openEdit = (e: StoredEvent) => {
    setDraft(eventToDraft(e));
    setError('');
    setFormOpen(true);
  };

  const save = () => {
    if (!draft.title.trim() || !draft.venue.trim() || !draft.date || !draft.time) {
      setError('Title, venue, date and time are required.');
      return;
    }
    if (Number(draft.price) < 0 || Number(draft.seatsTotal) < 1) {
      setError('Price must be ≥ 0 and seats ≥ 1.');
      return;
    }
    const stored = {
      ...draftToEvent(draft),
      id: draft.editId ?? makeEventId(draft.title),
      accent: draft.editId ? (events.find((e) => e.id === draft.editId)?.accent ?? accentForNew) : accentForNew,
    };
    const next: StoredEvent[] = draft.editId
      ? events.map((e) => (e.id === draft.editId ? { ...stored, createdAt: e.createdAt } : e))
      : [...events, { ...stored, createdAt: new Date().toISOString() }];
    // Only one featured event — checking it clears the others.
    const withFeatured = stored.featured
      ? next.map((e) => (e.id === stored.id ? e : { ...e, featured: false }))
      : next;
    saveEvents(withFeatured);
    setEvents(withFeatured);
    setFormOpen(false);
    setFlash(draft.editId ? 'Event updated.' : 'Event uploaded — it is live on the site.');
    window.setTimeout(() => setFlash(''), 3000);
  };

  const remove = (id: string) => {
    const next = events.filter((e) => e.id !== id);
    saveEvents(next);
    setEvents(next);
    setConfirmDelete(null);
  };

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const inputCls =
    'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:border-straw-500/60 focus:outline-none';
  const labelCls = 'mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-cream/55';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-3xl tracking-wide text-cream">EVENTS</h2>
        <button className="btn-gold" onClick={openCreate}>
          ＋ Upload new event
        </button>
      </div>

      {flash && (
        <p role="status" className="rounded-xl border border-straw-500/40 bg-straw-500/10 px-4 py-2.5 text-sm text-straw-300">
          {flash}
        </p>
      )}

      {/* Form */}
      {formOpen && (
        <div className="grid gap-6 rounded-2xl glass p-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3.5">
            <h3 className="font-display text-2xl tracking-wide text-cream">
              {draft.editId ? 'EDIT EVENT' : 'UPLOAD NEW EVENT'}
            </h3>
            <div>
              <label className={labelCls}>Title *</label>
              <input className={inputCls} value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="Anime Night" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tagline</label>
                <input className={inputCls} value={draft.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="Season finale marathon" />
              </div>
              <div>
                <label className={labelCls}>Date *</label>
                <input type="date" className={inputCls} value={draft.date} onChange={(e) => set({ date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Time *</label>
                <input className={inputCls} value={draft.time} onChange={(e) => set({ time: e.target.value })} placeholder="6:00 PM onwards" />
              </div>
              <div>
                <label className={labelCls}>Venue *</label>
                <input className={inputCls} value={draft.venue} onChange={(e) => set({ venue: e.target.value })} placeholder="Main Auditorium" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea rows={3} className={`${inputCls} resize-none`} value={draft.desc} onChange={(e) => set({ desc: e.target.value })} placeholder="What happens at the event…" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Price ₹</label>
                <input type="number" min={0} className={inputCls} value={draft.price} onChange={(e) => set({ price: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Total seats</label>
                <input type="number" min={1} className={inputCls} value={draft.seatsTotal} onChange={(e) => set({ seatsTotal: e.target.value, seatsLeft: draft.editId ? draft.seatsLeft : e.target.value })} />
              </div>
              {draft.editId && (
                <div>
                  <label className={labelCls}>Seats left</label>
                  <input type="number" min={0} className={inputCls} value={draft.seatsLeft} onChange={(e) => set({ seatsLeft: e.target.value })} />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-40 flex-1">
                <label className={labelCls}>Poster icon</label>
                <select className={inputCls} value={draft.icon} onChange={(e) => set({ icon: e.target.value as IconKey })}>
                  {ICONS.map((i) => (
                    <option key={i.key} value={i.key} className="bg-ink-900">
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-2 pb-2.5 text-xs text-cream/70">
                <input type="checkbox" checked={draft.featured} onChange={(e) => set({ featured: e.target.checked })} className="h-4 w-4 accent-[#e2a94a]" />
                Featured <span className="text-cream/40">(shows in the hero)</span>
              </label>
            </div>
            {error && (
              <p role="alert" className="text-xs font-semibold text-ember-400">
                {error}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button className="btn-gold flex-1" onClick={save}>
                {draft.editId ? 'Save changes' : 'Upload event'}
              </button>
              <button
                className="flex-1 rounded-xl border border-white/12 px-4 py-2.5 text-sm font-bold text-cream/70 transition hover:bg-white/5"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Live poster preview */}
          <div>
            <p className={labelCls}>Live poster preview</p>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <MangaPanelArt event={preview} />
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {events.map((e) => {
          const bookedPct = Math.round(((e.seatsTotal - e.seatsLeft) / e.seatsTotal) * 100);
          return (
            <div key={e.id} className="flex items-center gap-4 rounded-2xl glass p-3.5">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10">
                <MangaPanelArt event={e} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-display text-xl tracking-wide text-cream">{e.title}</p>
                  {e.featured && (
                    <span className="shrink-0 rounded-full bg-straw-500/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-straw-300">
                      Featured
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-cream/55">
                  {e.date} · {e.time} · {e.venue}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 w-28 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-straw-500" style={{ width: `${bookedPct}%` }} />
                  </div>
                  <span className="text-[11px] text-cream/50">
                    {e.seatsLeft}/{e.seatsTotal} left · {e.price === 0 ? 'FREE' : `₹${e.price}`}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                <button
                  className="rounded-lg border border-white/12 px-3 py-1.5 text-xs font-bold text-cream/75 transition hover:bg-white/5"
                  onClick={() => openEdit(e)}
                >
                  Edit
                </button>
                <button
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    confirmDelete === e.id
                      ? 'bg-ember-600 text-cream'
                      : 'border border-white/12 text-cream/60 hover:bg-white/5'
                  }`}
                  onClick={() => (confirmDelete === e.id ? remove(e.id) : setConfirmDelete(e.id))}
                  onBlur={() => setConfirmDelete(null)}
                >
                  {confirmDelete === e.id ? 'Sure?' : 'Delete'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
