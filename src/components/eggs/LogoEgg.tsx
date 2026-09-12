import { useEffect, useRef, useState } from 'react';
import { fireEgg } from '../../lib/eggBus';

/**
 * Click the navbar straw hat 5 times (within 10s) and it spins like a
 * Gum-Gum tribute before saluting you. Original copy — just fan fun.
 */
export default function LogoEgg() {
  const [spinning, setSpinning] = useState(false);
  const clicks = useRef<number[]>([]);
  const cooldownUntil = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const onLogoClick = () => {
      if (Date.now() < cooldownUntil.current) return;
      const now = Date.now();
      clicks.current = [...clicks.current.filter((t) => now - t < 10_000), now];
      if (clicks.current.length >= 5) {
        clicks.current = [];
        cooldownUntil.current = now + 20_000;
        const hat = document.querySelector('header a img');
        if (hat instanceof HTMLImageElement) {
          setSpinning(true);
          hat.style.transformOrigin = '50% 60%';
          timers.current.push(window.setTimeout(() => setSpinning(false), 1500));
        }
        fireEgg({
          id: 'hat-tribute',
          title: 'THE HAT APPROVES',
          subtitle: 'Five taps for the crew — now wear the site like the hat wears the title.',
          accent: 'straw',
        });
      }
    };
    document.addEventListener('ac:logo-click', onLogoClick);
    return () => {
      document.removeEventListener('ac:logo-click', onLogoClick);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  if (!spinning) return null;

  return (
    <style>{`
      header a img { animation: hat-spin 1.4s cubic-bezier(0.34, 1.2, 0.4, 1); }
      @keyframes hat-spin {
        0%   { transform: rotate(0deg) scale(1); }
        40%  { transform: rotate(360deg) scale(1.35); }
        70%  { transform: rotate(560deg) scale(0.95); }
        100% { transform: rotate(720deg) scale(1); }
      }
    `}</style>
  );
}
