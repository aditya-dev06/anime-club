export default function LogoHat({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden="true">
      <ellipse cx="32" cy="30" rx="30" ry="7.5" fill="#a87c2f" />
      <ellipse cx="32" cy="28" rx="30" ry="7.5" fill="#e2a94a" />
      <path d="M15 28C15 13.5 22 6.5 32 6.5s17 7 17 21.5Z" fill="#f0c66a" />
      <path d="M15.4 20.5c10-2.6 23.2-2.6 33.2 0l.4 7.2c-10-2.9-24-2.9-34 0Z" fill="#c8413c" />
      <ellipse cx="25.5" cy="13.5" rx="3.4" ry="4.2" fill="#f9dc9a" opacity="0.6" />
    </svg>
  );
}
