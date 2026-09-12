import { useCallback, useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Events from './components/Events';
import Footer from './components/Footer';
import Particles from './components/Particles';
import BookingModal from './components/BookingModal';
import EggToast from './components/EggToast';
import KonamiEgg from './components/eggs/KonamiEgg';
import CursorGlow from './components/eggs/CursorGlow';
import ReturnByDeath from './components/eggs/ReturnByDeath';
import AtomicEgg from './components/eggs/AtomicEgg';
import LogoEgg from './components/eggs/LogoEgg';
import SfxCutIns from './components/eggs/SfxCutIns';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { loadEvents, EVENTS_CHANGED, EVENTS_KEY } from './lib/eventsStore';
import type { EventItem } from './types';

export default function App() {
  const reduced = usePrefersReducedMotion();
  const [events, setEvents] = useState<EventItem[]>(() => loadEvents());
  const [bookingEvent, setBookingEvent] = useState<EventItem | null>(null);

  /* Admin console edits land here live (same tab + cross-tab storage events). */
  useEffect(() => {
    const reload = () => setEvents(loadEvents());
    const onStorage = (e: StorageEvent) => {
      if (e.key === EVENTS_KEY) reload();
    };
    window.addEventListener(EVENTS_CHANGED, reload);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENTS_CHANGED, reload);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  /** Called once a booking is issued; keeps the seat meters honest. */
  const handleBooked = useCallback((eventId: string, seats: number) => {
    setEvents((list) =>
      list.map((e) =>
        e.id === eventId ? { ...e, seatsLeft: Math.max(0, e.seatsLeft - seats) } : e,
      ),
    );
  }, []);

  return (
    <div className="relative min-h-screen bg-ink-950 text-cream">
      <Particles reduced={reduced} />
      <Navbar />
      <main>
        <Hero reduced={reduced} events={events} onBook={setBookingEvent} />
        <Events reduced={reduced} events={events} onBook={setBookingEvent} />
      </main>
      <Footer />
      {bookingEvent && (
        <BookingModal
          event={bookingEvent}
          onClose={() => setBookingEvent(null)}
          onBooked={handleBooked}
        />
      )}
      <div className="grain" aria-hidden="true" />
      <KonamiEgg />
      <CursorGlow />
      <ReturnByDeath />
      <AtomicEgg />
      <LogoEgg />
      <SfxCutIns />
      <EggToast />
    </div>
  );
}
