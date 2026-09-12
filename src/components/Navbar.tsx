import { useEffect, useRef, useState } from 'react';


const SECTION_IDS = ['hero', 'events', 'about'] as const;

const NAV_LINKS = [
  { id: 'events', label: 'Events' },
  { id: 'about', label: 'About' },
] as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>('');
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 40);
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
    };
    // rAF-throttled: at most one progress write per frame.
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;
    const visible = new Set<string>();
    // Active while the section overlaps the middle ~20% band of the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        // Deepest section currently in the band wins (#about sits inside #events).
        for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
          if (visible.has(SECTION_IDS[i])) {
            setActive(SECTION_IDS[i]);
            return;
          }
        }
      },
      { rootMargin: '-40% 0px -40% 0px' },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled ? 'border-b border-white/5 bg-ink-950/75 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      {/* Scroll progress — pinned above everything, GPU-friendly scaleX */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-50 h-[2px]">
        <div
          ref={barRef}
          className="h-full w-full origin-left bg-gradient-to-r from-straw-600 via-straw-400 to-straw-200"
          style={{ transform: 'scaleX(0)', boxShadow: '0 0 12px rgba(226, 169, 74, 0.55)' }}
        />
      </div>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="#hero"
          className="flex items-center gap-3"
          aria-label="Otaku Club home"
          onClick={() => document.dispatchEvent(new CustomEvent('ac:logo-click'))}
        >
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Otaku Club Logo" className="h-8 w-10 object-contain" />
          <span className="leading-none">
            <span className="block font-display text-xl tracking-[0.12em] text-cream">OTAKU CLUB</span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.42em] text-straw-300/80">
              VIT Bhopal
            </span>
          </span>
        </a>
        <div className="flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              aria-current={active === link.id ? 'true' : undefined}
              className={`relative hidden text-sm font-semibold transition md:block ${
                active === link.id ? 'text-straw-300' : 'text-cream/70 hover:text-straw-300'
              }`}
            >
              {link.label}
              <span
                aria-hidden
                className={`absolute -bottom-1.5 left-0 h-0.5 rounded-full bg-gradient-to-r from-straw-500 to-straw-300 transition-all duration-300 ${
                  active === link.id ? 'w-full opacity-100' : 'w-0 opacity-0'
                }`}
              />
            </a>
          ))}
          <a href="#events" className="btn-gold !px-4 !py-2 !text-[11px]">
            Book Now
          </a>
        </div>
      </nav>
    </header>
  );
}
