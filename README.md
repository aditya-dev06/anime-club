# Anime Club — VIT Bhopal

A cinematic, scroll-driven event booking site for the Anime Club of VIT Bhopal.

The hero features a **software-rendered 3D straw hat** (Canvas 2D, surface-of-revolution
renderer). As you scroll, the hat physically rotates ~180°, tucks the **ANIME CLUB** title
under its brim, swallows and minimizes it Mac-style into a golden glint, and the first
event card grows out of that exact spot. The whole sequence is scrubbed by GSAP
ScrollTrigger, so it is fully reversible.

## Booking, UPI payments & e-tickets

The booking modal runs a three-step flow: **details → UPI checkout → e-ticket**.

1. **Details** — name, email, seats. A booking reference (`AC-XX-1234`) is generated.
2. **UPI checkout** — the modal shows a UPI intent QR (`upi://pay?pa=animeclubvitb@upi&am=…&tn=<ref>`),
   a deep-link button for phones with a UPI app installed, and the club UPI ID with a copy button.
   In production the club verifies the payment in their own UPI app and *then* the ticket unlocks.
   **Demo mode:** press "Simulate host verification (demo)" to verify instantly. Free events skip
   the payment step entirely.
3. **E-ticket** — a manga-panel styled pass with a signed QR (`AC1.<payload>.<signature>`).
   The QR encodes the booking reference, attendee, event and seat count, and scans offline.

### Host gate (check-in scanner)

Open **`/verify`** (e.g. `https://your-site.vercel.app/verify`) on the host's phone:

- "Start scanner" opens the rear camera and scans the ticket QR continuously (jsQR).
- Valid tickets show attendee, reference and seats with a big **CHECK IN** button; duplicates are
  flagged as **ALREADY CHECKED IN**.
- Codes can also be pasted manually, and `/verify?code=AC1.…` deep-links straight to a verdict.
- Every check-in is logged (localStorage `ac-checkins`) with a running seat total.

### Easter eggs (fan tributes)

The site hides a few anime-inspired secrets — original copy, no copyrighted assets:

| Trigger | What happens |
| --- | --- |
| Type **`return`** anywhere | *Return by Death* — witch's-purple mist floods the screen, the page glitches and rewinds to the top (Re:Zero tribute) |
| Type **`atomic`** anywhere | *I AM ATOMIC* — the shadow falls, then a blinding golden bloom with shockwave rings (The Eminence in Shadow tribute) |
| **Konami code** (↑↑↓↓←→←→BA) | *OTAKU MODE UNLOCKED* — a 12-second sakura-petal drizzle + a gate discount code |
| Click the navbar hat **5 times** | The mascot hat spins and acknowledges your dedication |

Each egg fires a manga stamp-in toast (`src/components/EggToast.tsx` over the `eggBus`
pub/sub in `src/lib/eggBus.ts`). Egg effects live in `src/components/eggs/` and all
respect `prefers-reduced-motion`.

### Admin console

Open **`/admin`** (dev: `/admin.html`). Demo passcode: **`vitb-admin-2026`** (client-side gate only).

- **Events** — upload, edit and delete events: title, tagline, date/time, venue, description,
  price, seats, icon and a live manga-poster preview. Saves dispatch a change event, so the main
  site's hero and event grid update instantly (and cross-tab via storage events).
- **Bookings & Gate** — every issued booking with status (pending / active / checked-in).
  "Verify payment" is the step that unlocks a pending e-ticket — exactly the production flow,
  just happening in this console instead of a UPI app. Also links to the gate scanner and shows
  the check-in log.
- **Gate scanner** — the full-screen host tool at **`/verify`** (camera QR scanning, check-in,
  duplicate detection).

Data keys: `ac-events` (event catalog), `ac-bookings` (tickets), `ac-checkins` (gate log) — all
localStorage on that browser. A production deployment replaces these with a real backend + API.

### Where data lives

- `ac-bookings` — issued tickets (localStorage, this device)
- `ac-checkins` — the host's check-in log (localStorage, host device)

> **Demo caveat:** ticket signatures use a bundled demo secret (`src/lib/ticketCode.ts`) so the
> gate works fully offline. A production deployment must issue and validate signatures server-side.

## Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- GSAP 3 + ScrollTrigger
- `qrcode.react` (ticket + UPI QRs), `jsqr` (host camera scanning)
- Zero backend — bookings, tickets and check-ins live in `localStorage`

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:5173 — the host gate is at http://localhost:5173/verify.html in dev
(Vercel's `cleanUrls` serves it at `/verify` in production).

## Build

```bash
npm run build     # type-checks then bundles to dist/
npm run preview   # serve the production build locally
```

## Deploy to Vercel

The repo is Vercel-ready (`vercel.json` included):

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

Or import the repository in the Vercel dashboard — the framework preset, build command
(`npm run build`) and output directory (`dist`) are auto-detected. No environment
variables are required.

## Notes

- `prefers-reduced-motion` is respected: the pinned scroll animation, particles and tilt
  effects are replaced by a static hero and always-visible content.
- The hat renderer lives in `src/components/hat/HatRenderer.ts` — the profile, shading and
  depth-split are all tuneable constants at the top of the file.
