import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface ShardDef {
  id: number;
  polygon: string;
  svgPoints: string;
  centroid: [number, number]; // [x, y] in 0..100%
  blast: {
    x: number;
    y: number;
    z: number;
    rotX: number;
    rotY: number;
    rotZ: number;
  };
}

// 18 Contiguous shards that tessellate the 100% x 100% viewport radiating from the epicenter (50%, 50%)
const SHARDS: ShardDef[] = [
  // Top-Left Sector
  {
    id: 0,
    polygon: 'polygon(0% 0%, 25% 0%, 35% 30%, 0% 33%)',
    svgPoints: '0,0 25,0 35,30 0,33',
    centroid: [15, 15],
    blast: { x: -640, y: -460, z: 320, rotX: 50, rotY: -60, rotZ: -35 },
  },
  {
    id: 1,
    polygon: 'polygon(25% 0%, 50% 0%, 50% 25%, 35% 30%)',
    svgPoints: '25,0 50,0 50,25 35,30',
    centroid: [38, 12],
    blast: { x: -240, y: -580, z: 420, rotX: 65, rotY: -30, rotZ: -20 },
  },
  {
    id: 2,
    polygon: 'polygon(35% 30%, 50% 25%, 50% 50%, 30% 50%)',
    svgPoints: '35,30 50,25 50,50 30,50',
    centroid: [41, 39],
    blast: { x: -260, y: -340, z: 620, rotX: 55, rotY: -45, rotZ: -30 },
  },
  {
    id: 3,
    polygon: 'polygon(0% 33%, 35% 30%, 30% 50%, 0% 50%)',
    svgPoints: '0,33 35,30 30,50 0,50',
    centroid: [18, 40],
    blast: { x: -660, y: -140, z: 360, rotX: 25, rotY: -70, rotZ: -25 },
  },

  // Top-Right Sector
  {
    id: 4,
    polygon: 'polygon(50% 0%, 75% 0%, 65% 30%, 50% 25%)',
    svgPoints: '50,0 75,0 65,30 50,25',
    centroid: [62, 12],
    blast: { x: 240, y: -580, z: 410, rotX: 65, rotY: 30, rotZ: 20 },
  },
  {
    id: 5,
    polygon: 'polygon(75% 0%, 100% 0%, 100% 33%, 65% 30%)',
    svgPoints: '75,0 100,0 100,33 65,30',
    centroid: [85, 15],
    blast: { x: 650, y: -460, z: 340, rotX: 50, rotY: 60, rotZ: 35 },
  },
  {
    id: 6,
    polygon: 'polygon(50% 25%, 65% 30%, 70% 50%, 50% 50%)',
    svgPoints: '50,25 65,30 70,50 50,50',
    centroid: [59, 39],
    blast: { x: 260, y: -340, z: 640, rotX: 55, rotY: 45, rotZ: 30 },
  },
  {
    id: 7,
    polygon: 'polygon(65% 30%, 100% 33%, 100% 50%, 70% 50%)',
    svgPoints: '65,30 100,33 100,50 70,50',
    centroid: [82, 40],
    blast: { x: 670, y: -140, z: 380, rotX: 25, rotY: 70, rotZ: 25 },
  },

  // Bottom-Left Sector
  {
    id: 8,
    polygon: 'polygon(0% 50%, 30% 50%, 35% 70%, 0% 66%)',
    svgPoints: '0,50 30,50 35,70 0,66',
    centroid: [18, 60],
    blast: { x: -650, y: 240, z: 360, rotX: -25, rotY: -65, rotZ: 25 },
  },
  {
    id: 9,
    polygon: 'polygon(30% 50%, 50% 50%, 35% 70%)',
    svgPoints: '30,50 50,50 35,70',
    centroid: [38, 55],
    blast: { x: -260, y: 320, z: 620, rotX: -55, rotY: -45, rotZ: 30 },
  },
  {
    id: 10,
    polygon: 'polygon(0% 66%, 35% 70%, 25% 100%, 0% 100%)',
    svgPoints: '0,66 35,70 25,100 0,100',
    centroid: [15, 85],
    blast: { x: -620, y: 530, z: 340, rotX: -50, rotY: -55, rotZ: 40 },
  },
  {
    id: 11,
    polygon: 'polygon(35% 70%, 50% 50%, 50% 75%)',
    svgPoints: '35,70 50,50 50,75',
    centroid: [45, 65],
    blast: { x: -140, y: 420, z: 650, rotX: -60, rotY: -25, rotZ: 20 },
  },
  {
    id: 12,
    polygon: 'polygon(35% 70%, 50% 75%, 50% 100%, 25% 100%)',
    svgPoints: '35,70 50,75 50,100 25,100',
    centroid: [40, 88],
    blast: { x: -250, y: 610, z: 420, rotX: -70, rotY: -30, rotZ: 25 },
  },

  // Bottom-Right Sector
  {
    id: 13,
    polygon: 'polygon(70% 50%, 100% 50%, 100% 66%, 65% 70%)',
    svgPoints: '70,50 100,50 100,66 65,70',
    centroid: [82, 60],
    blast: { x: 670, y: 240, z: 370, rotX: -25, rotY: 65, rotZ: -25 },
  },
  {
    id: 14,
    polygon: 'polygon(50% 50%, 70% 50%, 65% 70%)',
    svgPoints: '50,50 70,50 65,70',
    centroid: [62, 55],
    blast: { x: 260, y: 320, z: 640, rotX: -55, rotY: 45, rotZ: -30 },
  },
  {
    id: 15,
    polygon: 'polygon(50% 50%, 65% 70%, 50% 75%)',
    svgPoints: '50,50 65,70 50,75',
    centroid: [55, 65],
    blast: { x: 140, y: 420, z: 660, rotX: -60, rotY: 25, rotZ: -20 },
  },
  {
    id: 16,
    polygon: 'polygon(65% 70%, 100% 66%, 100% 100%, 75% 100%)',
    svgPoints: '65,70 100,66 100,100 75,100',
    centroid: [85, 85],
    blast: { x: 630, y: 530, z: 350, rotX: -50, rotY: 55, rotZ: -40 },
  },
  {
    id: 17,
    polygon: 'polygon(50% 75%, 65% 70%, 75% 100%, 50% 100%)',
    svgPoints: '50,75 65,70 75,100 50,100',
    centroid: [60, 88],
    blast: { x: 250, y: 610, z: 420, rotX: -70, rotY: 30, rotZ: -25 },
  },
];

interface WebsiteShatterProps {
  active: boolean;
  phase: 'idle' | 'detonate' | 'ruins' | 'restore';
  onRestored: () => void;
}

export default function WebsiteShatter({ active, phase, onRestored }: WebsiteShatterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shardNodesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [snapshotHtml, setSnapshotHtml] = useState<string | null>(null);
  const [capturedScrollY, setCapturedScrollY] = useState(0);
  const [capturedWidth, setCapturedWidth] = useState(0);

  // Safety unmount guarantee: website root must NEVER stay hidden if component unmounts
  useEffect(() => {
    return () => {
      const root = document.getElementById('site-root');
      if (root) root.style.opacity = '1';
    };
  }, []);

  // When detonation is triggered, snapshot the live website including canvas elements
  useEffect(() => {
    if (!active) {
      setSnapshotHtml(null);
      const root = document.getElementById('site-root');
      if (root) root.style.opacity = '1';
      return;
    }

    const root = document.getElementById('site-root');
    if (!root) return;

    const scrollY = window.scrollY;
    setCapturedScrollY(scrollY);
    setCapturedWidth(root.offsetWidth || window.innerWidth);

    // Deep clone root DOM
    const clone = root.cloneNode(true) as HTMLElement;

    // Convert all canvases in the clone to <img> elements with exact raster data (e.g. Straw Hat)
    const srcCanvases = root.querySelectorAll('canvas');
    const destCanvases = clone.querySelectorAll('canvas');
    srcCanvases.forEach((src, idx) => {
      const dest = destCanvases[idx];
      if (dest) {
        try {
          const img = document.createElement('img');
          img.src = src.toDataURL('image/png');
          img.className = dest.className;
          img.style.cssText = dest.style.cssText;
          img.width = src.width;
          img.height = src.height;
          dest.parentNode?.replaceChild(img, dest);
        } catch {
          // fallback if tainted
        }
      }
    });

    setSnapshotHtml(clone.innerHTML);

    // Hide original root while shattered website pieces are flying in 3D
    root.style.opacity = '0';
  }, [active]);

  // Manage GSAP 3D explosion, space drift, and magical rewind snapping back into place
  useEffect(() => {
    if (!active || !snapshotHtml) return;

    const shards = shardNodesRef.current.filter((n): n is HTMLDivElement => n !== null);
    if (shards.length === 0) return;

    let animTimeline: gsap.core.Timeline | null = null;

    if (phase === 'detonate') {
      // BLAST APART IN 3D! Shards of the actual website fly away across the screen!
      shards.forEach((shard, idx) => {
        const def = SHARDS[idx];
        gsap.fromTo(
          shard,
          {
            x: 0,
            y: 0,
            z: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            scale: 1,
          },
          {
            x: def.blast.x,
            y: def.blast.y,
            z: def.blast.z,
            rotateX: def.blast.rotX,
            rotateY: def.blast.rotY,
            rotateZ: def.blast.rotZ,
            scale: 0.92,
            duration: 0.85,
            ease: 'power3.out',
            force3D: true,
          },
        );
      });
    } else if (phase === 'ruins') {
      // Floating in 3D void with zero-g cosmic drift
      shards.forEach((shard, idx) => {
        const def = SHARDS[idx];
        gsap.to(shard, {
          x: def.blast.x + (Math.random() - 0.5) * 20,
          y: def.blast.y + (Math.random() - 0.5) * 20,
          rotateZ: def.blast.rotZ + (Math.random() - 0.5) * 4,
          duration: 1.2,
          ease: 'sine.inOut',
          force3D: true,
        });
      });
    } else if (phase === 'restore') {
      // ─────────────────────────────────────────────────────────────
      // EPIC REVERSE VORTEX REWIND & KINTSUGI SEAM FUSION
      // ─────────────────────────────────────────────────────────────
      animTimeline = gsap.timeline({
        onComplete: () => {
          const root = document.getElementById('site-root');
          if (root) root.style.opacity = '1';
          onRestored();
        },
      });

      const maxDist = Math.hypot(50, 50);

      shards.forEach((shard, idx) => {
        const def = SHARDS[idx];
        const distFromCenter = Math.hypot(def.centroid[0] - 50, def.centroid[1] - 50);
        // Non-linear golden-ratio stagger
        const staggerDelay = Math.pow(distFromCenter / maxDist, 1.35) * 0.35;

        // Calculate Tangential Vortex Waypoint
        const Rb = Math.hypot(def.blast.x, def.blast.y) || 1;
        const tx = -def.blast.y / Rb; // Clockwise tangent
        const ty = def.blast.x / Rb;
        const swirlAmp = Rb * 0.38;

        const midX = def.blast.x * 0.52 + tx * swirlAmp;
        const midY = def.blast.y * 0.52 + ty * swirlAmp;
        const midZ = def.blast.z * 0.40;
        const midRotZ = def.blast.rotZ + 28 * (def.blast.rotZ >= 0 ? 1 : -1);

        // Target SVG border for Kintsugi fusion
        const svgPolys = shard.querySelectorAll('polygon');

        const shardTl = gsap.timeline();

        // Stage 1: Vortex Inception & Helical Swirl (0% -> 48%)
        shardTl.to(shard, {
          x: midX,
          y: midY,
          z: midZ,
          rotateX: def.blast.rotX * 0.35,
          rotateY: def.blast.rotY * 0.35,
          rotateZ: midRotZ,
          scale: 0.96,
          duration: 0.95,
          ease: 'power2.in',
          force3D: true,
        });

        // Stage 2: Planar Flattening & Magnetic Deceleration (48% -> 88%)
        shardTl.to(shard, {
          x: 0,
          y: 0,
          z: 0,
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          scale: 1.0025, // Micro-dilation to eliminate 1px polygon gaps
          duration: 1.15,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)', // Expo-out magnetic landing
          force3D: true,
        });

        // Stage 3: Kintsugi Seam Weld & Elastic Snap (88% -> 100%)
        shardTl.to(
          shard,
          {
            scale: 1.0,
            duration: 0.22,
            ease: 'power2.out',
          },
          '-=0.15',
        );

        // Synchronized SVG Seam Weld Flare
        if (svgPolys.length > 0) {
          shardTl.to(
            svgPolys,
            {
              stroke: 'rgba(255, 255, 255, 1)',
              strokeWidth: 2.2,
              duration: 0.18,
              ease: 'power2.in',
            },
            '-=0.35',
          );
          shardTl.to(svgPolys, {
            stroke: 'rgba(251, 191, 36, 0.95)', // Molten gold fusion
            strokeWidth: 1.0,
            duration: 0.22,
            ease: 'power2.out',
          });
        }

        // Hand-off Crossfade: unhide site-root as the weld flashes
        shardTl.add(() => {
          const root = document.getElementById('site-root');
          if (root) root.style.opacity = '1';
        }, '-=0.10');

        animTimeline!.add(shardTl, staggerDelay);
      });
    }

    return () => {
      animTimeline?.kill();
      gsap.killTweensOf(shards);
    };
  }, [phase, active, snapshotHtml, onRestored]);

  if (!active || !snapshotHtml) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[58] overflow-hidden"
      style={{
        perspective: 1100,
        transformStyle: 'preserve-3d',
        contain: 'strict',
        isolation: 'isolate',
      }}
    >
      {/* Strip expensive backdrop-filters and shadows from cloned DOM for buttery 60fps */}
      <style>{`
        .shatter-clone, .shatter-clone * {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: none !important;
          text-shadow: none !important;
          animation: none !important;
          transition: none !important;
        }
      `}</style>

      {SHARDS.map((shard, idx) => (
        <div
          key={shard.id}
          ref={(el) => {
            shardNodesRef.current[idx] = el;
          }}
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: shard.polygon,
            transformStyle: 'preserve-3d',
            transformOrigin: `${shard.centroid[0]}% ${shard.centroid[1]}% 0px`,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Cloned view of the website positioned to match the exact scroll & width */}
          <div
            className="shatter-clone relative min-h-screen bg-ink-950 text-cream"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${capturedWidth || window.innerWidth}px`,
              transform: `translateY(-${capturedScrollY}px)`,
              pointerEvents: 'none',
            }}
            dangerouslySetInnerHTML={{ __html: snapshotHtml }}
          />

          {/* Realistic tinted glass refraction sheen */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(192, 132, 252, 0.12) 50%, rgba(147, 51, 234, 0.18) 100%)',
            }}
          />

          {/* SVG Glass Bevel Edge that glows violet and catches specular light */}
          <svg
            className="absolute inset-0 pointer-events-none w-full h-full z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Neon violet glass seam glow */}
            <polygon
              points={shard.svgPoints}
              fill="none"
              stroke="rgba(216, 180, 254, 0.85)"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
            {/* Crisp specular white light edge reflection */}
            <polygon
              points={shard.svgPoints}
              fill="none"
              stroke="rgba(255, 255, 255, 0.95)"
              strokeWidth="0.75"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
