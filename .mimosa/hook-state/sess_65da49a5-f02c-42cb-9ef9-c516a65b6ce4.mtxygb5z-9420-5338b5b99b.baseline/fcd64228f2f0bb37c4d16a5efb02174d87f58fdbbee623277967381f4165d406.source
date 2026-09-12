/*
 * Straw-hat software renderer (Canvas 2D).
 *
 * The hat is modelled as a surface of revolution — a hand-tuned profile from
 * the crown apex, down the red ribbon, out along the brim, back under the
 * brim and up the inside of the crown. The profile is subdivided into ~60
 * horizontal bands. Every frame the bands are rotated around the screen X
 * axis, projected orthographically and drawn back-to-front (painter's
 * algorithm), which keeps the hat fully volumetric at every rotation angle —
 * including edge-on and upside-down.
 *
 * Two canvases sandwich the DOM title text:
 *   - the "far" canvas draws every half-band deeper than `frame.split`
 *   - the "near" canvas draws every half-band nearer than `frame.split`
 * Driving `split` down during the scroll animation makes the brim physically
 * pass in front of the text while the interior wall stays behind it, so the
 * title is genuinely tucked INSIDE the hat instead of just fading out.
 *
 * Sakuga extras:
 *   - squashX/squashY: screen-space volume-preserving squash & stretch
 *   - ghosts: previous-pose angles painted faintly (angular smear frames)
 *   - warm: 0..1 golden-hour tint lerp
 */

export type HatSurface = 'dome' | 'ribbon' | 'brim' | 'edge' | 'under' | 'inner';

interface Band {
  r0: number;
  y0: number;
  r1: number;
  y1: number;
  rm: number;
  ym: number;
  nr: number;
  ny: number;
  type: HatSurface;
  weave: number;
}

export interface HatFrame {
  /** 0 = side view. Negative tips the hat's opening toward the camera. */
  angle: number;
  /** Pixels per hat unit; 1 unit = brim radius. */
  scale: number;
  cx: number;
  cy: number;
  /** Idle float offset in px (applied along screen Y). */
  bob: number;
  /** Small Z-rotation in radians for organic drift. */
  wobble: number;
  /** 0..1 golden rim glint for the "sealed" beat. */
  glow: number;
  /** Depth threshold separating far-canvas bands from near-canvas bands. */
  split: number;
  /** Screen-space squash/stretch factors (1 = neutral). */
  squashX: number;
  squashY: number;
  /** 0..1 magic-hour tint strength. */
  warm: number;
  /** Previous-pose angles for angular smear ghosts (painted faintly). */
  ghosts: number[];
  /** 0..1 — manga page printed on the inner crown (visible only through the opening). */
  print: number;
  /** Azimuth pan of the printed page (mouse parallax + scroll drift). */
  printOffset: number;
  /** Ticker time (s) of the last tap on the hat — impact burst on the page. */
  printPulse: number;
  /** Ticker time (s) — drives the burst ring animation. */
  time: number;
}

/* Profile control points: [radius, height, surface of the segment that starts here] */
const PROFILE: Array<[number, number, HatSurface]> = [
  [0.02, 0.782, 'dome'],
  [0.1, 0.779, 'dome'],
  [0.19, 0.768, 'dome'],
  [0.275, 0.748, 'dome'],
  [0.34, 0.716, 'dome'],
  [0.388, 0.672, 'dome'],
  [0.418, 0.618, 'dome'],
  [0.431, 0.56, 'dome'],
  [0.4355, 0.508, 'ribbon'],
  [0.4395, 0.468, 'ribbon'],
  [0.4435, 0.428, 'ribbon'],
  [0.4465, 0.396, 'ribbon'],
  [0.468, 0.384, 'brim'],
  [0.556, 0.37, 'brim'],
  [0.652, 0.357, 'brim'],
  [0.756, 0.345, 'brim'],
  [0.864, 0.331, 'brim'],
  [0.952, 0.315, 'brim'],
  [1.0, 0.297, 'brim'],
  [1.006, 0.284, 'edge'],
  [1.0, 0.268, 'edge'],
  [0.948, 0.272, 'under'],
  [0.845, 0.285, 'under'],
  [0.726, 0.3, 'under'],
  [0.606, 0.315, 'under'],
  [0.512, 0.327, 'under'],
  [0.458, 0.332, 'under'],
  [0.441, 0.336, 'inner'],
  [0.421, 0.383, 'inner'],
  [0.403, 0.441, 'inner'],
  [0.381, 0.507, 'inner'],
  [0.345, 0.568, 'inner'],
  [0.292, 0.622, 'inner'],
  [0.216, 0.664, 'inner'],
  [0.122, 0.69, 'inner'],
  [0.02, 0.697, 'inner'],
];

const BASE: Record<HatSurface, [number, number, number]> = {
  dome: [203, 150, 64],
  ribbon: [192, 56, 46],
  brim: [226, 183, 99],
  edge: [118, 84, 34],
  under: [186, 146, 70],
  inner: [152, 116, 62],
};

const SUN: [number, number, number] = [243, 212, 134]; // sun-bleached straw tips
const SUN_WARM: [number, number, number] = [255, 198, 118]; // magic-hour tips

/* --- manga page printed on the base (crisp 2D texture, polar-mapped) --- */
const PAGE_INK: [number, number, number] = [14, 11, 8];
const PAGE_PAPER: [number, number, number] = [243, 236, 216];
const TEX_W = 1024;
const TEX_H = 512;

let pageTex: HTMLCanvasElement | null = null;
let pageTexHadPulse = false;

/**
 * Draws the crisp manga page into an offscreen texture. x = azimuth around
 * the crown axis, y = radius over the opening (0 = apex/center, 1 = rim).
 * Rebuilt each frame only while an impact burst is animating; otherwise
 * cached. Ink is true ink, paper true paper — no straw shading involved.
 */
function ensurePageTexture(pulse: number, time: number): HTMLCanvasElement {
  if (pageTex && pulse <= 0 && pageTexHadPulse === false) return pageTex;
  if (!pageTex) pageTex = document.createElement('canvas');
  pageTex.width = TEX_W;
  pageTex.height = TEX_H;
  const c = pageTex.getContext('2d')!;
  const ink = `rgb(${PAGE_INK[0]},${PAGE_INK[1]},${PAGE_INK[2]})`;
  const paper = `rgb(${PAGE_PAPER[0]},${PAGE_PAPER[1]},${PAGE_PAPER[2]})`;

  c.fillStyle = paper;
  c.fillRect(0, 0, TEX_W, TEX_H);

  /* ---- crown strip: AC monogram panel ---- */
  c.fillStyle = ink;
  c.fillRect(0, 0, TEX_W, 226);
  c.fillStyle = paper;
  c.font = "400 190px 'Bebas Neue', Impact, sans-serif";
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('AC', 512, 118);
  c.font = "400 44px 'Bebas Neue', Impact, sans-serif";
  c.fillText('ANIME CLUB', 512, 205);
  /* straw corner ticks */
  c.fillStyle = 'rgb(226,169,74)';
  c.fillRect(30, 30, 60, 5);
  c.fillRect(TEX_W - 90, 30, 60, 5);

  /* ---- gutter ---- */
  c.fillStyle = ink;
  c.fillRect(0, 226, TEX_W, 16);

  /* ---- under-brim strip: four panels ---- */
  const halftone = (x0: number, y0: number, w: number, h: number) => {
    c.save();
    c.beginPath();
    c.rect(x0, y0, w, h);
    c.clip();
    c.fillStyle = ink;
    for (let y = y0 + 6; y < y0 + h; y += 14) {
      for (let x = x0 + 6 + ((y / 14) % 2) * 7; x < x0 + w; x += 14) {
        c.beginPath();
        c.arc(x, y, 2.6, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
  };
  /* panel A: halftone */
  c.fillStyle = paper;
  c.fillRect(0, 242, TEX_W / 2, 122);
  halftone(0, 242, TEX_W / 2, 122);
  /* panel B: speed lines */
  c.fillStyle = ink;
  c.fillRect(TEX_W / 2, 242, TEX_W / 2, 122);
  c.save();
  c.beginPath();
  c.rect(TEX_W / 2, 242, TEX_W / 2, 122);
  c.clip();
  c.strokeStyle = paper;
  c.lineWidth = 5;
  for (let i = 0; i < 10; i++) {
    c.beginPath();
    c.moveTo(TEX_W / 2 + i * 54, 236);
    c.lineTo(TEX_W / 2 + i * 54 - 60, 372);
    c.stroke();
  }
  c.restore();
  /* gutter between halves */
  c.fillRect(0, 356, TEX_W, 14);
  /* panel C: wordmark */
  c.fillStyle = paper;
  c.fillRect(0, 370, TEX_W / 2, 126);
  c.fillStyle = ink;
  c.font = "400 62px 'Bebas Neue', Impact, sans-serif";
  c.fillText('ANIME CLUB', 250, 428);
  c.font = "700 20px 'Manrope', Arial, sans-serif";
  c.fillText('VIT BHOPAL · EST. 2021', 250, 462);
  /* panel D: barcode */
  c.fillStyle = ink;
  c.fillRect(TEX_W / 2, 370, TEX_W / 2, 126);
  c.fillStyle = paper;
  for (let i = 0; i < 34; i++) {
    const bw = (i * 7919) % 3 === 0 ? 6 : 3;
    c.fillRect(TEX_W / 2 + 30 + i * 14, 386, bw, 66);
  }
  c.font = "700 18px 'Manrope', Arial, sans-serif";
  c.fillText('ADMIT · VIT BHOPAL', TEX_W / 2 + 30, 478);
  /* rim */
  c.fillStyle = ink;
  c.fillRect(0, 496, TEX_W, 16);

  /* ---- impact burst: expanding ink rings from the monogram ---- */
  if (pulse > 0) {
    const cx = 512;
    const cy = 118;
    c.save();
    c.strokeStyle = `rgba(14,11,8,${0.85 * pulse})`;
    for (let ring = 0; ring < 3; ring++) {
      c.lineWidth = 9 - ring * 2.5;
      c.beginPath();
      c.arc(cx, cy, (pulse * 340 + ring * 34) % 480, 0, Math.PI * 2);
      c.stroke();
    }
    /* radial spokes */
    c.lineWidth = 5;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + time * 0.6;
      const r0 = 40 + pulse * 30;
      const r1 = 60 + pulse * 200;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      c.stroke();
    }
    c.restore();
    pageTexHadPulse = true;
  } else {
    pageTexHadPulse = false;
  }

  return pageTex;
}

function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v;
}

function hash(i: number): number {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

function buildBands(): Band[] {
  const bands: Band[] = [];
  let i = 0;
  for (let p = 0; p < PROFILE.length - 1; p++) {
    const [r0, y0, type] = PROFILE[p];
    const [r1, y1] = PROFILE[p + 1];
    const dr = r1 - r0;
    const dy = y1 - y0;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dr) * 2.4, Math.abs(dy)) / 0.05));
    const len = Math.hypot(dr, dy) || 1;
    const nr = -dy / len;
    const ny = dr / len;
    for (let s = 0; s < steps; s++) {
      const f0 = s / steps;
      const f1 = (s + 1) / steps;
      const a0r = r0 + dr * f0;
      const a0y = y0 + dy * f0;
      const a1r = r0 + dr * f1;
      const a1y = y0 + dy * f1;
      bands.push({
        r0: a0r,
        y0: a0y,
        r1: a1r,
        y1: a1y,
        rm: (a0r + a1r) / 2,
        ym: (a0y + a1y) / 2,
        nr,
        ny,
        type,
        weave: ((i % 2) * 2 - 1) * 0.03 + (hash(i) - 0.5) * 0.035,
      });
      i++;
    }
  }
  return bands;
}

interface PrintJob {
  rIn: number;
  rOut: number;
  yIn: number;
  yOut: number;
  phi0: number;
  phi1: number;
  alpha: number;
}

interface Job {
  depth: number;
  pts: number[];
  midPts: number[];
  minX: number;
  maxX: number;
  rgb: [number, number, number];
  ringLine: boolean;
}

export function createHatRenderer(far: HTMLCanvasElement, near: HTMLCanvasElement) {
  const cf = far.getContext('2d')!;
  const cn = near.getContext('2d')!;
  const bands = buildBands();
  let W = 0;
  let H = 0;
  let DPR = 1;

  function resize(w: number, h: number) {
    W = w;
    H = h;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [far, near]) {
      c.width = Math.max(1, Math.round(W * DPR));
      c.height = Math.max(1, Math.round(H * DPR));
    }
  }

  function render(f: HatFrame) {
    if (W === 0 || H === 0) return;
    const S = f.scale;
    const CX = f.cx;
    const CY = f.cy + f.bob;

    const warmMix = f.warm;
    const sun: [number, number, number] = [
      SUN[0] + (SUN_WARM[0] - SUN[0]) * warmMix,
      SUN[1] + (SUN_WARM[1] - SUN[1]) * warmMix,
      SUN[2] + (SUN_WARM[2] - SUN[2]) * warmMix,
    ];

    const makeProject = (angle: number, yOff: number) => {
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      return (r: number, y: number, phi: number): [number, number, number] => {
        const x = r * Math.cos(phi) * f.squashX;
        const yRot = (y * ca - r * Math.sin(phi) * sa) * f.squashY;
        const depth = y * sa + r * Math.sin(phi) * ca;
        return [CX + S * x, CY - S * yRot + yOff, depth];
      };
    };

    const buildJobs = (angle: number, pulseAmt: number): { far: Job[]; near: Job[]; printFar: PrintJob[]; printNear: PrintJob[] } => {
      const farJobs: Job[] = [];
      const nearJobs: Job[] = [];
      const printFar: PrintJob[] = [];
      const printNear: PrintJob[] = [];
      const K = 16;
      const project = makeProject(angle, 0);

      for (const b of bands) {
        for (const hsign of [-1, 1]) {
          const phi0 = hsign > 0 ? 0 : Math.PI;
          const phi1 = hsign > 0 ? Math.PI : Math.PI * 2;

          const depth = b.ym * Math.sin(angle) + b.rm * Math.cos(angle) * hsign;

          /* ---- shading ---- */
          const diffuse = 0.62 * b.ny + 0.65 * b.nr * hsign;
          let k = 0.38 + 0.82 * Math.max(0, diffuse);
          if (b.type === 'dome' || b.type === 'brim') {
            k += Math.pow(Math.max(0, diffuse), 9) * 0.5;
          }
          if (b.type === 'ribbon') {
            k = 0.34 + 0.95 * Math.max(0, diffuse);
            k *= 1.08 - (0.508 - b.ym) * 0.5;
          }
          if ((b.type === 'brim' || b.type === 'under') && b.rm > 0.44 && b.rm < 0.63) {
            k *= 0.8 + 0.2 * Math.min(1, (b.rm - 0.44) / 0.18);
          }
          if (b.type === 'inner') {
            k *= 0.45 + 0.55 * clamp((0.7 - b.ym) / 0.36, 0, 1);
          }
          if (b.type === 'under') {
            k *= 0.72 + 0.28 * clamp((b.rm - 0.46) / 0.54, 0, 1);
          }
          k *= 1 + b.weave;

          let base = BASE[b.type];
          let rgb: [number, number, number];
          if (b.type === 'dome' || b.type === 'brim' || b.type === 'under') {
            const m = clamp(b.rm * 0.34, 0, 0.4);
            rgb = [
              base[0] + (sun[0] - base[0]) * m,
              base[1] + (sun[1] - base[1]) * m,
              base[2] + (sun[2] - base[2]) * m,
            ];
          } else {
            rgb = [base[0], base[1], base[2]];
          }
          const col: [number, number, number] = [
            clamp(rgb[0] * k, 0, 255),
            clamp(rgb[1] * k, 0, 255),
            clamp(rgb[2] * k, 0, 255),
          ];

          /* ---- geometry ---- */
          const pts: number[] = [];
          let minX = Infinity;
          let maxX = -Infinity;
          for (let i = 0; i <= K; i++) {
            const phi = phi0 + (phi1 - phi0) * (i / K);
            const [sx, sy] = project(b.r0, b.y0, phi);
            pts.push(sx, sy);
            if (sx < minX) minX = sx;
            if (sx > maxX) maxX = sx;
          }
          for (let i = K; i >= 0; i--) {
            const phi = phi0 + (phi1 - phi0) * (i / K);
            const [sx, sy] = project(b.r1, b.y1, phi);
            pts.push(sx, sy);
            if (sx < minX) minX = sx;
            if (sx > maxX) maxX = sx;
          }
          const midPts: number[] = [];
          for (let i = 0; i <= K; i++) {
            const phi = phi0 + (phi1 - phi0) * (i / K);
            const [sx, sy] = project(b.rm, b.ym, phi);
            midPts.push(sx, sy);
          }

          const job: Job = {
            depth,
            pts,
            midPts,
            minX,
            maxX,
            rgb: col,
            ringLine:
              (b.type === 'dome' || b.type === 'brim' || b.type === 'under') && b.rm > 0.08,
          };
          /* Printed-base slice job: the band texture-maps the manga page. */
          if ((b.type === 'inner' || b.type === 'under') && f.print > 0.02) {
            const gate =
              b.type === 'inner'
                ? clamp(-Math.sin(angle) * 1.6, 0, 1)
                : clamp(-Math.sin(angle) * 2.2 - 0.35, 0, 1);
            const printAlpha = f.print * gate;
            if (printAlpha > 0.02) {
              const rIn = Math.min(b.r0, b.r1);
              const rOut = Math.max(b.r0, b.r1);
              const printJob: PrintJob = {
                rIn,
                rOut,
                yIn: rIn === b.r0 ? b.y0 : b.y1,
                yOut: rOut === b.r0 ? b.y0 : b.y1,
                phi0,
                phi1,
                alpha: printAlpha,
              };
              if (depth < f.split) printFar.push(printJob);
              else printNear.push(printJob);
            }
          }
          if (depth < f.split) farJobs.push(job);
          else nearJobs.push(job);
        }
      }
      farJobs.sort((p, q) => p.depth - q.depth);
      nearJobs.sort((p, q) => p.depth - q.depth);
      printFar.sort((p, q) => p.rIn - q.rIn);
      printNear.sort((p, q) => p.rIn - q.rIn);
      return { far: farJobs, near: nearJobs, printFar, printNear };
    };

    const paint = (ctx: CanvasRenderingContext2D, jobs: Job[]) => {
      for (const j of jobs) {
        const [r, g, bl] = j.rgb;
        const grad = ctx.createLinearGradient(j.minX, 0, j.maxX, 0);
        grad.addColorStop(0, `rgb(${clamp(r * 0.8, 0, 255) | 0},${clamp(g * 0.8, 0, 255) | 0},${clamp(bl * 0.8, 0, 255) | 0})`);
        grad.addColorStop(0.3, `rgb(${clamp(r * 1.05, 0, 255) | 0},${clamp(g * 1.05, 0, 255) | 0},${clamp(bl * 1.05, 0, 255) | 0})`);
        grad.addColorStop(0.55, `rgb(${clamp(r * 0.95, 0, 255) | 0},${clamp(g * 0.95, 0, 255) | 0},${clamp(bl * 0.95, 0, 255) | 0})`);
        grad.addColorStop(0.8, `rgb(${clamp(r * 1.0, 0, 255) | 0},${clamp(g * 1.0, 0, 255) | 0},${clamp(bl * 1.0, 0, 255) | 0})`);
        grad.addColorStop(1, `rgb(${clamp(r * 0.74, 0, 255) | 0},${clamp(g * 0.74, 0, 255) | 0},${clamp(bl * 0.74, 0, 255) | 0})`);

        ctx.beginPath();
        ctx.moveTo(j.pts[0], j.pts[1]);
        for (let i = 2; i < j.pts.length; i += 2) ctx.lineTo(j.pts[i], j.pts[i + 1]);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        if (j.ringLine) {
          ctx.beginPath();
          ctx.moveTo(j.midPts[0], j.midPts[1]);
          for (let i = 2; i < j.midPts.length; i += 2) ctx.lineTo(j.midPts[i], j.midPts[i + 1]);
          ctx.strokeStyle = 'rgba(66,42,15,0.1)';
          ctx.lineWidth = Math.max(1, S * 0.011);
          ctx.stroke();
        }
      }
    };

    const clear = () => {
      cf.setTransform(DPR, 0, 0, DPR, 0, 0);
      cn.setTransform(DPR, 0, 0, DPR, 0, 0);
      cf.clearRect(0, 0, W, H);
      cn.clearRect(0, 0, W, H);
      if (f.wobble) {
        for (const ctx of [cf, cn]) {
          ctx.translate(CX, CY);
          ctx.rotate(f.wobble);
          ctx.translate(-CX, -CY);
        }
      }
    };

    clear();

    /* Impact-burst envelope from the last hat tap (0.7s decay). */
    const pulseAmt = f.printPulse > 0 ? clamp(1 - (f.time - f.printPulse) / 0.7, 0, 1) : 0;

    /* Angular smear ghosts — the hat's previous poses, painted faintly.
       The main pass paints over them on the same canvases (shared wobble
       transform), so no clear between the passes. */
    for (let gi = 0; gi < f.ghosts.length; gi++) {
      const g = buildJobs(f.ghosts[gi], pulseAmt);
      const alpha = gi === 0 ? 0.16 : 0.08;
      cf.globalAlpha = alpha;
      cn.globalAlpha = alpha;
      paint(cf, g.far);
      paint(cn, g.near);
    }
    cf.globalAlpha = 1;
    cn.globalAlpha = 1;

    const jobs = buildJobs(f.angle, pulseAmt);
    paint(cf, jobs.far);
    paint(cn, jobs.near);

    /* Printed manga page — the crisp 2D page texture, polar-mapped onto the
       base bands with per-slice affine transforms. */
    if (jobs.printFar.length > 0 || jobs.printNear.length > 0) {
      const tex = ensurePageTexture(pulseAmt, f.time);
      const drawPrinted = (ctx: CanvasRenderingContext2D, list: PrintJob[]) => {
        const proj = makeProject(f.angle, 0);
        const SLICES = 16;
        const baseT = ctx.getTransform();
        for (const pj of list) {
          ctx.save();
          ctx.globalAlpha = pj.alpha;
          const sy = pj.rIn * TEX_H;
          const sh = (pj.rOut - pj.rIn) * TEX_H;
          for (let s = 0; s < SLICES; s++) {
            const f0 = s / SLICES;
            const f1 = (s + 1) / SLICES + 0.025 / SLICES;
            const phiA = pj.phi0 + (pj.phi1 - pj.phi0) * f0;
            const phiB = pj.phi0 + (pj.phi1 - pj.phi0) * Math.min(1, f1);
            const p00 = proj(pj.rIn, pj.yIn, phiA);
            const p10 = proj(pj.rIn, pj.yIn, phiB);
            const p01 = proj(pj.rOut, pj.yOut, phiA);
            ctx.setTransform(baseT);
            ctx.transform(
              p10[0] - p00[0],
              p10[1] - p00[1],
              p01[0] - p00[0],
              p01[1] - p00[1],
              p00[0],
              p00[1],
            );
            const uMid = (phiA + (phiB - phiA) / 2) / (Math.PI * 2) + f.printOffset + f.time * 0.006;
            const sw = TEX_W / SLICES;
            const sx = ((((uMid % 1) + 1) % 1) * TEX_W) % TEX_W;
            if (sx + sw <= TEX_W) {
              ctx.drawImage(tex, sx, sy, sw, sh, 0, 0, 1, 1);
            } else {
              const first = TEX_W - sx;
              ctx.drawImage(tex, sx, sy, first, sh, 0, 0, first / sw, 1);
              ctx.drawImage(tex, 0, sy, sw - first, sh, first / sw, 0, 1 - first / sw, 1);
            }
          }
          ctx.restore();
        }
      };
      drawPrinted(cf, jobs.printFar);
      drawPrinted(cn, jobs.printNear);
    }

    /* Golden rim glint — the "sealed" beat highlight. */
    if (f.glow > 0.02) {
      const drawRing = (
        ctx: CanvasRenderingContext2D,
        rr: number,
        yy: number,
        alpha: number,
        width: number,
      ) => {
        ctx.beginPath();
        const K = 56;
        for (let i = 0; i <= K; i++) {
          const phi = (i / K) * Math.PI * 2;
          const [sx, sy] = makeProject(f.angle, 0)(rr, yy, phi);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(255,216,140,${alpha})`;
        ctx.lineWidth = width;
        ctx.shadowColor = `rgba(255,186,80,${alpha})`;
        ctx.shadowBlur = 24 * f.glow;
        ctx.stroke();
        ctx.shadowBlur = 0;
      };
      cn.save();
      drawRing(cn, 1.004, 0.281, 0.9 * f.glow, 2 + 5 * f.glow);
      drawRing(cn, 0.462, 0.378, 0.35 * f.glow, 1.5 + 2 * f.glow);
      cn.restore();
    }
  }

  return { resize, render };
}
