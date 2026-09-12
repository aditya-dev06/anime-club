import { useEffect, useRef } from 'react';

export type ReturnPhase = 'idle' | 'death' | 'miasma' | 'rewind' | 'reawaken';

interface WitchMiasmaCanvasProps {
  phase: ReturnPhase;
  reduced: boolean;
  heartbeatActive?: boolean;
}

interface Point2D {
  x: number;
  y: number;
}

interface MiasmaParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  wobble: number;
  wobbleSpeed: number;
}

interface VascularWave {
  originX: number;
  originY: number;
  radius: number;
  maxRadius: number;
  speed: number;
  amplitude: number;
  decay: number;
  colorRgba: [number, number, number];
}

export default function WitchMiasmaCanvas({
  phase,
  reduced,
  heartbeatActive = false,
}: WitchMiasmaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const phaseStartTimeRef = useRef<number>(performance.now());
  const particlesRef = useRef<MiasmaParticle[]>([]);
  const vascularWavesRef = useRef<VascularWave[]>([]);
  const lastHeartbeatRef = useRef(false);

  useEffect(() => {
    phaseStartTimeRef.current = performance.now();
  }, [phase]);

  // Floating miasma particles initialization
  useEffect(() => {
    if (reduced || phase === 'idle') {
      particlesRef.current = [];
      vascularWavesRef.current = [];
      return;
    }

    const count = 55;
    const colors = [
      'rgba(192, 38, 211, 0.65)',
      'rgba(168, 85, 247, 0.55)',
      'rgba(216, 180, 254, 0.70)',
      'rgba(244, 114, 182, 0.50)',
    ];

    const particles: MiasmaParticle[] = [];
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 35,
        vy: -28 - Math.random() * 50, // Convection upward
        size: 3 + Math.random() * 8,
        alpha: 0.20 + Math.random() * 0.50,
        color: colors[Math.floor(Math.random() * colors.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 1.6 + Math.random() * 2.8,
      });
    }

    particlesRef.current = particles;
  }, [phase, reduced]);

  // Spawn vascular shockwave when heartbeat pulses
  useEffect(() => {
    if (heartbeatActive && !lastHeartbeatRef.current && phase === 'miasma') {
      const w = window.innerWidth;
      const h = window.innerHeight;
      vascularWavesRef.current.push({
        originX: w * 0.5,
        originY: h * 0.5,
        radius: 12,
        maxRadius: Math.hypot(w, h) * 0.65,
        speed: 820,
        amplitude: 1.0,
        decay: 3.2,
        colorRgba: [217, 70, 239],
      });
    }
    lastHeartbeatRef.current = heartbeatActive;
  }, [heartbeatActive, phase]);

  useEffect(() => {
    if (phase === 'idle' || reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    let active = true;

    const syncSize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
    };

    syncSize();
    window.addEventListener('resize', syncSize);

    // 6 Massive Demonic Unseen Hands crawling deep onto the screen over website cards
    const handsConfig = [
      // Top-Left hand reaching down toward hero/cards
      {
        getStart: (_w: number, h: number) => ({ x: -50, y: h * 0.12 }),
        getTarget: (w: number, h: number) => ({ x: w * 0.40, y: h * 0.40 }),
        wristWidth: 32,
        speed: 1.25,
        seed: 0.1,
      },
      // Mid-Left hand crawling across center
      {
        getStart: (_w: number, h: number) => ({ x: -50, y: h * 0.62 }),
        getTarget: (w: number, h: number) => ({ x: w * 0.44, y: h * 0.54 }),
        wristWidth: 34,
        speed: 1.35,
        seed: 1.7,
      },
      // Bottom-Left hand reaching up
      {
        getStart: (w: number, h: number) => ({ x: w * 0.14, y: h + 50 }),
        getTarget: (w: number, h: number) => ({ x: w * 0.36, y: h * 0.66 }),
        wristWidth: 30,
        speed: 1.2,
        seed: 2.8,
      },
      // Top-Right hand reaching down-left
      {
        getStart: (w: number, h: number) => ({ x: w + 50, y: h * 0.15 }),
        getTarget: (w: number, h: number) => ({ x: w * 0.60, y: h * 0.40 }),
        wristWidth: 32,
        speed: 1.15,
        seed: 3.9,
      },
      // Mid-Right hand crawling across center
      {
        getStart: (w: number, h: number) => ({ x: w + 50, y: h * 0.58 }),
        getTarget: (w: number, h: number) => ({ x: w * 0.56, y: h * 0.54 }),
        wristWidth: 34,
        speed: 1.4,
        seed: 4.6,
      },
      // Bottom-Right hand reaching up-center
      {
        getStart: (w: number, h: number) => ({ x: w * 0.86, y: h + 50 }),
        getTarget: (w: number, h: number) => ({ x: w * 0.62, y: h * 0.64 }),
        wristWidth: 30,
        speed: 1.3,
        seed: 5.5,
      },
    ];

    let lastTime = performance.now();

    // EKG Sample state for death phase
    let ekgPhase = 0;

    const render = (now: number) => {
      if (!active) return;
      const dt = Math.min(0.04, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;
      const timeInSec = now / 1000;
      const elapsedInPhase = (now - phaseStartTimeRef.current) / 1000;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // =====================================================================
      // 1. DEATH PHASE: ANATOMICAL EKG & CARDIAC FLATLINE
      // =====================================================================
      if (phase === 'death') {
        ekgPhase += dt * 4.2;
        const ekgProgress = Math.min(1, elapsedInPhase / 1.1);

        ctx.save();
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.9 - ekgProgress * 0.35})`;
        ctx.lineWidth = 2.4;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14;

        ctx.beginPath();
        const startX = w * 0.1;
        const endX = w * 0.9;
        const totalW = endX - startX;
        const currentScanX = startX + totalW * Math.min(1, ekgProgress * 1.3);

        ctx.moveTo(startX, cy);
        for (let px = startX; px <= currentScanX; px += 3) {
          const u = (px - startX) / totalW;
          const localPhase = u * 18 - ekgPhase;

          let yDisp = 0;
          if (u < 0.25) {
            // Hyperacute ST elevation
            yDisp = Math.sin(localPhase) * 22 * (1 - ekgProgress * 0.5);
          } else if (u < 0.65) {
            // Ventricular fibrillation chaotic spikes
            yDisp =
              (Math.sin(localPhase * 3.2) * 38 +
                Math.cos(localPhase * 5.4) * 20 +
                (Math.random() - 0.5) * 14) *
              (1 - ekgProgress * 0.6);
          } else {
            // Asystole flatline with subtle micro-drift
            yDisp = Math.sin(u * 25 + ekgPhase) * 1.8 + (Math.random() - 0.5) * 1.2;
          }

          ctx.lineTo(px, cy + yDisp);
        }
        ctx.stroke();

        // Pulsing Cardiac Core Flash
        const coreAlpha = Math.max(0, 0.45 * Math.sin(elapsedInPhase * 12) * (1 - ekgProgress));
        if (coreAlpha > 0.01) {
          const coreGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
          coreGrad.addColorStop(0, `rgba(239, 68, 68, ${coreAlpha})`);
          coreGrad.addColorStop(0.6, `rgba(147, 51, 234, ${coreAlpha * 0.5})`);
          coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, 120, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // =====================================================================
      // 2. VASCULAR CARDIAC SHOCKWAVES
      // =====================================================================
      if (vascularWavesRef.current.length > 0) {
        ctx.save();
        for (let i = vascularWavesRef.current.length - 1; i >= 0; i--) {
          const wave = vascularWavesRef.current[i];
          wave.radius += wave.speed * dt;
          wave.speed = Math.max(220, wave.speed * (1 - dt * 0.9));
          const prog = wave.radius / wave.maxRadius;

          if (prog >= 1.0) {
            vascularWavesRef.current.splice(i, 1);
            continue;
          }

          const alpha = (1 - prog) * Math.exp(-wave.decay * prog) * wave.amplitude;
          if (alpha <= 0.01) continue;

          // Shock ring
          ctx.beginPath();
          ctx.arc(wave.originX, wave.originY, wave.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${wave.colorRgba[0]}, ${wave.colorRgba[1]}, ${wave.colorRgba[2]}, ${alpha * 0.85})`;
          ctx.lineWidth = Math.max(1.5, 8.0 * (1 - prog));
          ctx.shadowColor = '#d946ef';
          ctx.shadowBlur = 16 * (1 - prog);
          ctx.stroke();

          // Capillary micro-branching
          ctx.shadowBlur = 0;
          const branches = 12;
          for (let b = 0; b < branches; b++) {
            const bAngle = (b / branches) * Math.PI * 2 + wave.radius * 0.006;
            const rx = wave.originX + Math.cos(bAngle) * wave.radius;
            const ry = wave.originY + Math.sin(bAngle) * wave.radius;
            const len = 18 * (1 - prog);
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + Math.cos(bAngle + 0.3) * len, ry + Math.sin(bAngle + 0.3) * len);
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + Math.cos(bAngle - 0.3) * len, ry + Math.sin(bAngle - 0.3) * len);
            ctx.strokeStyle = `rgba(240, 171, 252, ${alpha * 0.6})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // =====================================================================
      // 3. SATELLA'S UNSEEN HANDS (MASSIVE, PROMINENT & ARTICULATED)
      // =====================================================================
      if (phase === 'miasma' || phase === 'rewind') {
        const handGrowth =
          phase === 'miasma'
            ? Math.min(1, elapsedInPhase * 1.4)
            : Math.max(0, 1 - elapsedInPhase * 1.2);

        // Clench pulse in sync with heartbeatActive prop
        const graspPulse = heartbeatActive ? 0.75 : 0.25;

        handsConfig.forEach((def) => {
          const start = def.getStart(w, h);
          const target = def.getTarget(w, h);
          const reach = Math.min(1, handGrowth * 1.05);

          if (reach <= 0.01) return;

          const currentTipX = start.x + (target.x - start.x) * reach;
          const currentTipY = start.y + (target.y - start.y) * reach;
          const baseAngle = Math.atan2(currentTipY - start.y, currentTipX - start.x);

          // Undulating serpentine whip spine
          const wavePhase = timeInSec * def.speed * 2.8 + def.seed;
          const waveAmp = 32 * Math.sin(reach * Math.PI * 0.5);
          const normX = -Math.sin(baseAngle);
          const normY = Math.cos(baseAngle);

          const p0: Point2D = { x: start.x, y: start.y };
          const p1: Point2D = {
            x: start.x + (currentTipX - start.x) * 0.35 + normX * Math.sin(wavePhase) * waveAmp,
            y: start.y + (currentTipY - start.y) * 0.35 + normY * Math.sin(wavePhase) * waveAmp,
          };
          const p2: Point2D = {
            x:
              start.x +
              (currentTipX - start.x) * 0.72 +
              normX * Math.sin(wavePhase + Math.PI * 0.75) * (waveAmp * 0.85),
            y:
              start.y +
              (currentTipY - start.y) * 0.72 +
              normY * Math.sin(wavePhase + Math.PI * 0.75) * (waveAmp * 0.85),
          };
          const p3: Point2D = { x: currentTipX, y: currentTipY }; // Wrist

          // Sample spine points and normals
          const SAMPLES = 24;
          const spine: { pt: Point2D; normal: Point2D; width: number }[] = [];

          for (let i = 0; i <= SAMPLES; i++) {
            const s = i / SAMPLES;
            const mt = 1 - s;
            const mt2 = mt * mt;
            const mt3 = mt2 * mt;
            const s2 = s * s;
            const s3 = s2 * s;
            const pt: Point2D = {
              x: mt3 * p0.x + 3 * mt2 * s * p1.x + 3 * mt * s2 * p2.x + s3 * p3.x,
              y: mt3 * p0.y + 3 * mt2 * s * p1.y + 3 * mt * s2 * p2.y + s3 * p3.y,
            };

            // Tangent & Normal
            const ds = 0.02;
            const sPrev = Math.max(0, s - ds);
            const sNext = Math.min(1, s + ds);
            const mtP = 1 - sPrev;
            const mtN = 1 - sNext;
            const ptP: Point2D = {
              x: mtP * mtP * mtP * p0.x + 3 * mtP * mtP * sPrev * p1.x + 3 * mtP * sPrev * sPrev * p2.x + sPrev * sPrev * sPrev * p3.x,
              y: mtP * mtP * mtP * p0.y + 3 * mtP * mtP * sPrev * p1.y + 3 * mtP * sPrev * sPrev * p2.y + sPrev * sPrev * sPrev * p3.y,
            };
            const ptN: Point2D = {
              x: mtN * mtN * mtN * p0.x + 3 * mtN * mtN * sNext * p1.x + 3 * mtN * sNext * sNext * p2.x + sNext * sNext * sNext * p3.x,
              y: mtN * mtN * mtN * p0.y + 3 * mtN * mtN * sNext * p1.y + 3 * mtN * sNext * sNext * p2.x + sNext * sNext * sNext * p3.y,
            };
            const tanX = ptN.x - ptP.x;
            const tanY = ptN.y - ptP.y;
            const len = Math.hypot(tanX, tanY) || 1;
            const nx = -tanY / len;
            const ny = tanX / len;

            // Wide portal base tapering to slender wrist
            const taper =
              def.wristWidth * (1.0 + 1.7 * Math.pow(1 - s, 1.2) + 0.12 * Math.sin(Math.PI * s));
            spine.push({ pt, normal: { x: nx, y: ny }, width: taper * reach });
          }

          // ── Pass A: Radiant Violet Miasma Corona ──
          ctx.save();
          ctx.beginPath();
          for (let i = 0; i <= SAMPLES; i++) {
            const { pt, normal, width } = spine[i];
            const lx = pt.x + normal.x * (width * 0.65);
            const ly = pt.y + normal.y * (width * 0.65);
            if (i === 0) ctx.moveTo(lx, ly);
            else ctx.lineTo(lx, ly);
          }
          for (let i = SAMPLES; i >= 0; i--) {
            const { pt, normal, width } = spine[i];
            const rx = pt.x - normal.x * (width * 0.65);
            const ry = pt.y - normal.y * (width * 0.65);
            ctx.lineTo(rx, ry);
          }
          ctx.closePath();
          ctx.fillStyle = 'rgba(74, 4, 78, 0.45)';
          ctx.shadowColor = '#d946ef';
          ctx.shadowBlur = 36 * reach;
          ctx.fill();

          // ── Pass B: Obsidian Void Arm Body ──
          const armGrad = ctx.createLinearGradient(start.x, start.y, currentTipX, currentTipY);
          armGrad.addColorStop(0, '#020005');
          armGrad.addColorStop(0.7, '#0d0118');
          armGrad.addColorStop(1, '#18042b');
          ctx.fillStyle = armGrad;
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 14 * reach;
          ctx.fill();
          ctx.restore();

          // ── Pass C: Luminescent Spinal Tendon ──
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          for (let i = 1; i <= SAMPLES; i++) {
            ctx.lineTo(spine[i].pt.x, spine[i].pt.y);
          }
          ctx.strokeStyle = 'rgba(232, 121, 249, 0.85)';
          ctx.lineWidth = 3.5 * reach;
          ctx.lineCap = 'round';
          ctx.shadowColor = '#f0abfc';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.restore();

          // ── Pass D: Palm & 5 Articulated Skeletal Digits ──
          const wristAngle = Math.atan2(p3.y - spine[SAMPLES - 1].pt.y, p3.x - spine[SAMPLES - 1].pt.x);
          const palmRadius = def.wristWidth * 0.95 * reach;
          const palmCenter: Point2D = {
            x: p3.x + Math.cos(wristAngle) * (palmRadius * 0.65),
            y: p3.y + Math.sin(wristAngle) * (palmRadius * 0.65),
          };

          // Palm core
          ctx.save();
          ctx.translate(palmCenter.x, palmCenter.y);
          ctx.rotate(wristAngle);
          ctx.beginPath();
          ctx.ellipse(0, 0, palmRadius * 1.05, palmRadius * 0.75, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#06000c';
          ctx.shadowColor = '#d946ef';
          ctx.shadowBlur = 20 * reach;
          ctx.fill();
          ctx.restore();

          // 5 Digits configuration: [Thumb, Index, Middle, Ring, Pinky]
          const digits = [
            { id: 0, spread: -0.75, l1: 0.85, l2: 0.65, l3: 0.45, thick: 0.32, isThumb: true },
            { id: 1, spread: -0.32, l1: 1.15, l2: 0.85, l3: 0.60, thick: 0.28, isThumb: false },
            { id: 2, spread: 0.00, l1: 1.35, l2: 1.05, l3: 0.70, thick: 0.30, isThumb: false }, // Middle (longest)
            { id: 3, spread: 0.30, l1: 1.18, l2: 0.88, l3: 0.58, thick: 0.27, isThumb: false },
            { id: 4, spread: 0.62, l1: 0.90, l2: 0.68, l3: 0.48, thick: 0.24, isThumb: false }, // Pinky
          ];

          // 18.5Hz neurotic jitter
          const jitter = Math.sin(timeInSec * 18.5 + def.seed) * 0.045;

          digits.forEach((d) => {
            const archAngle = wristAngle + d.spread * 0.85;
            const mcpX = palmCenter.x + Math.cos(archAngle) * (palmRadius * 0.85);
            const mcpY = palmCenter.y + Math.sin(archAngle) * (palmRadius * 0.85);

            let theta1: number;
            let theta2: number;
            let theta3: number;

            if (d.isThumb) {
              const thumbSpread = -0.85 + graspPulse * 0.75;
              theta1 = wristAngle + thumbSpread + jitter;
              theta2 = theta1 + 0.35 + graspPulse * 0.95;
              theta3 = theta2 + 0.45 + graspPulse * 1.10;
            } else {
              const curSpread = d.spread * (1.35 - graspPulse * 0.85);
              theta1 = wristAngle + curSpread + jitter;
              theta2 = theta1 + (0.2 + graspPulse * 1.05) + jitter * 0.8;
              theta3 = theta2 + (0.35 + graspPulse * 1.35);
            }

            // Joint 1: PIP
            const len1 = def.wristWidth * d.l1 * reach;
            const pipX = mcpX + Math.cos(theta1) * len1;
            const pipY = mcpY + Math.sin(theta1) * len1;

            // Joint 2: DIP
            const len2 = def.wristWidth * d.l2 * reach;
            const dipX = pipX + Math.cos(theta2) * len2;
            const dipY = pipY + Math.sin(theta2) * len2;

            // Joint 3: Claw Tip
            const len3 = def.wristWidth * d.l3 * reach;
            const tipX = dipX + Math.cos(theta3) * len3;
            const tipY = dipY + Math.sin(theta3) * len3;

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Outer Violet Sheath
            ctx.beginPath();
            ctx.moveTo(mcpX, mcpY);
            ctx.lineTo(pipX, pipY);
            ctx.lineTo(dipX, dipY);
            ctx.lineTo(tipX, tipY);
            ctx.strokeStyle = 'rgba(216, 180, 254, 0.90)';
            ctx.lineWidth = (def.wristWidth * d.thick + 5.5) * reach;
            ctx.shadowColor = '#d946ef';
            ctx.shadowBlur = 16 * reach;
            ctx.stroke();

            // Obsidian Bone Core
            ctx.beginPath();
            ctx.moveTo(mcpX, mcpY);
            ctx.lineTo(pipX, pipY);
            ctx.lineTo(dipX, dipY);
            ctx.lineTo(tipX, tipY);
            ctx.strokeStyle = '#05000a';
            ctx.lineWidth = def.wristWidth * d.thick * reach;
            ctx.shadowBlur = 0;
            ctx.stroke();

            // Razor Sharp Starlight Talon Glint
            ctx.fillStyle = '#fdf4ff';
            ctx.shadowColor = '#f0abfc';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(tipX, tipY, 3.2 * reach, 0, Math.PI * 2);
            ctx.fill();

            // Claw barb hook
            const barbAngle = theta3 + Math.PI;
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(
              tipX + Math.cos(barbAngle + 0.38) * (9 * reach),
              tipY + Math.sin(barbAngle + 0.38) * (9 * reach)
            );
            ctx.lineTo(
              tipX + Math.cos(barbAngle - 0.38) * (9 * reach),
              tipY + Math.sin(barbAngle - 0.38) * (9 * reach)
            );
            ctx.closePath();
            ctx.fillStyle = '#f5d0fe';
            ctx.fill();

            ctx.restore();
          });
        });
      }

      // =====================================================================
      // 5. TEMPORAL SINGULARITY & REVERSE CLOCKWORK (REWIND PHASE)
      // =====================================================================
      if (phase === 'rewind') {
        const rewindProgress = Math.min(1, elapsedInPhase / 1.65);
        const clockRadius = Math.min(w, h) * 0.34;
        const clockSpinAngle = -timeInSec * 3.8; // Counter-clockwise retrograde spin

        ctx.save();
        ctx.translate(cx, cy);

        // 5A. Logarithmic Gravitational Singularity Vortex
        const numArms = 4;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let a = 0; a < numArms; a++) {
          const armAngle = (a / numArms) * Math.PI * 2 + clockSpinAngle * 0.45;
          ctx.beginPath();
          for (let step = 0; step < 36; step++) {
            const frac = step / 36;
            const r = clockRadius * (0.15 + frac * 1.1);
            const theta = armAngle - Math.log(Math.max(0.1, frac * 4.0)) * 0.85;
            const px = Math.cos(theta) * r;
            const py = Math.sin(theta) * r;
            if (step === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = a % 2 === 0 ? 'rgba(232, 121, 249, 0.45)' : 'rgba(168, 85, 247, 0.35)';
          ctx.lineWidth = 3.5 * (1 - rewindProgress * 0.3);
          ctx.stroke();
        }
        ctx.restore();

        // 5B. Intermeshing Planetary Gear Wheel
        const teeth = 32;
        const m = (2 * clockRadius * 0.68) / teeth;
        const rAddendum = clockRadius * 0.68 + m * 0.9;
        const rDedendum = clockRadius * 0.68 - m * 1.15;
        const toothAngle = (Math.PI * 2) / teeth;

        ctx.save();
        ctx.rotate(clockSpinAngle);
        ctx.beginPath();
        for (let t = 0; t < teeth; t++) {
          const a0 = t * toothAngle;
          const a1 = a0 + toothAngle * 0.28;
          const a2 = a0 + toothAngle * 0.50;
          const a3 = a0 + toothAngle * 0.78;
          const a4 = a0 + toothAngle;
          if (t === 0) ctx.moveTo(Math.cos(a0) * rDedendum, Math.sin(a0) * rDedendum);
          ctx.lineTo(Math.cos(a1) * rAddendum, Math.sin(a1) * rAddendum);
          ctx.lineTo(Math.cos(a2) * rAddendum, Math.sin(a2) * rAddendum);
          ctx.lineTo(Math.cos(a3) * rDedendum, Math.sin(a3) * rDedendum);
          ctx.lineTo(Math.cos(a4) * rDedendum, Math.sin(a4) * rDedendum);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(216, 180, 254, 0.55)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Gear Spokes
        const spokes = 6;
        for (let s = 0; s < spokes; s++) {
          const sa = (s / spokes) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(sa) * (clockRadius * 0.18), Math.sin(sa) * (clockRadius * 0.18));
          ctx.lineTo(Math.cos(sa) * (clockRadius * 0.62), Math.sin(sa) * (clockRadius * 0.62));
          ctx.stroke();
        }
        ctx.restore();

        // 5C. Horological Roman Numeral Chapter Ring (XII, I, II, ..., XI)
        const numerals = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
        ctx.save();
        ctx.font = `600 ${Math.max(14, clockRadius * 0.10)}px 'Cinzel', serif, 'Times New Roman'`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fdf4ff';
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 14;

        numerals.forEach((num, idx) => {
          const numAngle = -Math.PI / 2 + (idx / 12) * Math.PI * 2 + clockSpinAngle;
          const nx = Math.cos(numAngle) * (clockRadius * 0.88);
          const ny = Math.sin(numAngle) * (clockRadius * 0.88);

          ctx.save();
          ctx.translate(nx, ny);
          ctx.rotate(numAngle + Math.PI / 2);
          ctx.fillText(num, 0, 0);
          ctx.restore();
        });
        ctx.restore();

        // 5D. Reverse Clock Hands (Spinning Counter-Clockwise)
        // Hour hand
        const hourAngle = clockSpinAngle * 2.5 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(hourAngle) * (clockRadius * 0.52), Math.sin(hourAngle) * (clockRadius * 0.52));
        ctx.strokeStyle = '#fdf4ff';
        ctx.lineWidth = 4.0;
        ctx.stroke();

        // Minute hand (Fast retrograde sweep)
        const minuteAngle = clockSpinAngle * 14.0 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(minuteAngle) * (clockRadius * 0.78), Math.sin(minuteAngle) * (clockRadius * 0.78));
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Central Ruby Pivot
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.restore();
      }

      // =====================================================================
      // 6. 2D CURL NOISE MIASMA PARTICLES (SCREEN BLEND: WEBSITE STAYS CRISP!)
      // =====================================================================
      if (particlesRef.current.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        for (const p of particlesRef.current) {
          if (phase === 'rewind') {
            // Sucked inward into temporal singularity
            const dx = cx - p.x;
            const dy = cy - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            p.vx += (dx / dist) * 1600 * dt;
            p.vy += (dy / dist) * 1600 * dt;
            p.vx *= 0.90;
            p.vy *= 0.90;
          } else {
            // Rising thermal buoyancy + curl noise turbulence
            p.wobble += p.wobbleSpeed * dt;
            const curlVx = Math.sin(p.wobble) * 26;
            p.x += (p.vx + curlVx) * dt;
            p.y += p.vy * dt;
          }

          if (p.y < -30) p.y = h + 20;
          if (p.x < -30) p.x = w + 20;
          if (p.x > w + 30) p.x = -20;

          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      window.removeEventListener('resize', syncSize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase, reduced, heartbeatActive]);

  if (phase === 'idle' || reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[56]"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
