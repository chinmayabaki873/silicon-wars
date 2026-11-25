import React from 'react';
import { ISO, IsoBox, IsoSlab, IsoCylinder } from '../primitives/Iso';

/* ------------------------------------------------------------------ */
/*  Shared flat/isometric drawing primitives (unit-world coordinates)  */
/* ------------------------------------------------------------------ */

function Chef({
  x,
  y,
  scale = 1,
  jacket = '#F1ECE2',
  apron = '#641E25',
  skin = '#D2A276',
  moving = false,
  delay = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  jacket?: string;
  apron?: string;
  skin?: string;
  moving?: boolean;
  delay?: number;
}) {
  const b = ISO.project(x, y, 0);
  return (
    <g transform={`translate(${b.px},${b.py}) scale(${scale})`}>
      <g style={moving ? { animation: `chefBob 3.4s ease-in-out ${delay}s infinite` } : undefined}>
        {/* contact shadow, offset by the studio light */}
        <ellipse cx={0.12} cy={0.6} rx={1.05} ry={0.32} fill="rgba(25,24,21,0.26)" />
        <ellipse cx={0.06} cy={0.52} rx={0.55} ry={0.16} fill="rgba(25,24,21,0.22)" />

        {/* trouser legs + shoes */}
        <path d="M-0.34,-1.66 L-0.30,-0.10" stroke="#332C25" strokeWidth={0.36} strokeLinecap="round" />
        <path d="M0.30,-1.66 L0.26,-0.10" stroke="#332C25" strokeWidth={0.36} strokeLinecap="round" />
        <path d="M-0.44,-0.10 L-0.16,-0.10" stroke="#191815" strokeWidth={0.18} strokeLinecap="round" />
        <path d="M0.20,-0.10 L0.46,-0.10" stroke="#191815" strokeWidth={0.18} strokeLinecap="round" />

        {/* jacket with a lit left edge and shaded right edge */}
        <path d="M-0.76,-2.68 L0.76,-2.68 L0.56,-1.50 L-0.56,-1.50 Z" fill={jacket} stroke="rgba(25,24,21,0.45)" strokeWidth={0.08} />
        <path d="M0.76,-2.68 L0.56,-1.50 L0.34,-1.50 L0.6,-2.68 Z" fill="rgba(25,24,21,0.14)" />
        <path d="M-0.76,-2.68 L-0.56,-1.50 L-0.36,-1.50 L-0.6,-2.68 Z" fill="rgba(255,255,255,0.45)" />
        {/* collar */}
        <path d="M-0.30,-2.72 L0,-2.44 L0.30,-2.72" fill="none" stroke="rgba(25,24,21,0.32)" strokeWidth={0.08} />
        {/* apron */}
        <path d="M-0.50,-2.06 L0.50,-2.06 L0.44,-1.44 L-0.44,-1.44 Z" fill={apron} />
        <path d="M-0.52,-2.06 L0.52,-2.06" stroke="rgba(25,24,21,0.35)" strokeWidth={0.07} />
        {/* arms */}
        <path d="M-0.70,-2.52 L-1.04,-1.74" stroke={jacket} strokeWidth={0.29} strokeLinecap="round" />
        <path d="M0.70,-2.52 L1.04,-1.80" stroke={jacket} strokeWidth={0.29} strokeLinecap="round" />
        <circle cx={-1.05} cy={-1.72} r={0.13} fill={skin} />
        <circle cx={1.05} cy={-1.78} r={0.13} fill={skin} />

        {/* head */}
        <circle cx={0} cy={-3.02} r={0.37} fill={skin} />
        <path d="M-0.3,-3.06 a0.37 0.37 0 0 0 0.6 0" fill="rgba(25,24,21,0.10)" />
        {/* toque */}
        <path d="M-0.44,-3.22 L0.44,-3.22 L0.40,-3.98 Q0.22,-4.22 0.02,-4.02 Q-0.18,-4.24 -0.40,-3.98 Z" fill="#F8F6F0" stroke="rgba(25,24,21,0.38)" strokeWidth={0.08} />
        <path d="M-0.42,-3.30 L0.42,-3.30" stroke="rgba(25,24,21,0.22)" strokeWidth={0.07} />
        <path d="M0.2,-3.96 Q0.3,-4.16 0.4,-3.96" fill="none" stroke="rgba(25,24,21,0.18)" strokeWidth={0.06} />
      </g>
    </g>
  );
}

function Steam({ x, y, z, delay = 0, scale = 1 }: { x: number; y: number; z: number; delay?: number; scale?: number }) {
  const p = ISO.project(x, y, z);
  return (
    <g style={{ animation: `steamRise 5s ease-out ${delay}s infinite`, transformOrigin: `${p.px}px ${p.py}px` }}>
      <path
        d={`M${p.px},${p.py} c-0.6,-1 0.6,-1.7 0,-2.8 c-0.5,-0.9 0.5,-1.6 0,-2.5`}
        fill="none"
        stroke="#F8F6F0"
        strokeWidth={0.28 * scale}
        strokeLinecap="round"
        opacity={0.42}
      />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  CPU — boutique atelier                                             */
/* ------------------------------------------------------------------ */

function CpuKitchen() {
  const W = 13.4;
  const D = 11.4;
  return (
    <g>
      {/* base slab + floor */}
      <IsoBox x={0} y={0} w={W} d={D} h={0.55} top="#EFE9DF" left="#ADA396" right="#C7BEAF" stroke="rgba(25,24,21,0.34)" />
      <IsoSlab x={0.5} y={0.5} z={0.56} w={W - 1} d={D - 1} fill="#E6DFD1" stroke="rgba(25,24,21,0.08)" strokeWidth={0.1} />
      {Array.from({ length: 9 }).map((_, i) => (
        <IsoSlab key={i} x={0.5 + i * 1.36} y={0.5} z={0.57} w={0.05} d={D - 1} fill="rgba(41,34,29,0.09)" />
      ))}

      {/* back walls */}
      <IsoBox x={0} y={0} w={W} d={0.4} h={3.5} top="#453A31" left="#2A231E" right="#332B25" stroke="rgba(25,24,21,0.5)" strokeWidth={0.12} />
      <IsoBox x={0} y={0} w={0.4} d={D} h={3.5} top="#4E4238" left="#332B25" right="#3E342C" stroke="rgba(25,24,21,0.5)" strokeWidth={0.12} />
      <IsoSlab x={1.1} y={0.42} z={2.55} w={11} d={0.1} fill="#B69A63" opacity={0.85} />
      {/* wall panelling */}
      {Array.from({ length: 7 }).map((_, i) => {
        const a = ISO.project(1.2 + i * 1.6, 0.02, 0.2);
        const b2 = ISO.project(1.2 + i * 1.6, 0.02, 3.4);
        return <line key={`p${i}`} x1={a.px} y1={a.py} x2={b2.px} y2={b2.py} stroke="rgba(248,246,240,0.06)" strokeWidth={0.07} />;
      })}


      {/* hanging copper pans on the back wall */}
      {Array.from({ length: 5 }).map((_, i) => {
        const p = ISO.project(2.1 + i * 2.1, 0.45, 1.85);
        return (
          <g key={i}>
            <line x1={p.px} y1={p.py - 0.8} x2={p.px} y2={p.py - 0.28} stroke="#B69A63" strokeWidth={0.1} />
            <circle cx={p.px} cy={p.py} r={0.32} fill="none" stroke="#8B8983" strokeWidth={0.13} />
            <circle cx={p.px} cy={p.py} r={0.32} fill="#B65335" opacity={0.13} />
          </g>
        );
      })}

      {/* prep counter along back wall */}
      <IsoBox x={1.0} y={1.85} w={9.4} d={1.85} h={2.0} top="#F1ECE2" left="#6E5B4A" right="#8A7560" stroke="rgba(25,24,21,0.34)" strokeWidth={0.1} />
      <IsoSlab x={1.05} y={1.9} z={2.01} w={9.3} d={1.75} fill="#EDE8DE" stroke="rgba(25,24,21,0.14)" strokeWidth={0.1} />
      <IsoBox x={1.6} y={2.15} w={1.5} d={1.2} h={0.13} top="#B65335" left="#7C3A24" right="#98452D" />
      <IsoBox x={3.5} y={2.2} w={1.3} d={1.1} h={0.12} top="#B69A63" left="#8C7448" right="#A08A58" />
      <IsoBox x={5.3} y={2.15} w={1.6} d={1.2} h={0.15} top="#85865A" left="#5C5D3E" right="#717247" />
      <IsoCylinder x={7.9} y={2.9} z={2.0} r={0.62} h={0.5} top="#29221D" side="#191815" />
      <Steam x={7.9} y={2.9} z={2.7} delay={0.4} scale={1.2} />

      {/* the pass: ticket rail */}
      <IsoBox x={10.8} y={4.1} w={1.5} d={5.1} h={2.2} top="#29221D" left="#191815" right="#221C18" />
      {Array.from({ length: 4 }).map((_, i) => (
        <IsoSlab key={i} x={11.0} y={4.45 + i * 1.1} z={2.55} w={0.85} d={0.7} fill={i % 2 === 0 ? '#F8F6F0' : '#EDE8DE'} stroke="rgba(25,24,21,0.32)" strokeWidth={0.08} />
      ))}

      {/* stove island, front right */}
      <IsoBox x={6.2} y={6.3} w={4.5} d={3.3} h={1.85} top="#5A4E43" left="#3A312A" right="#463B33" stroke="rgba(25,24,21,0.45)" strokeWidth={0.12} />
      <IsoSlab x={6.3} y={6.4} z={1.86} w={4.3} d={3.1} fill="#332A24" />
      {[
        [7.3, 7.3],
        [9.5, 7.3],
        [7.3, 8.7],
      ].map(([bx, by], i) => {
        const c = ISO.project(bx, by, 1.9);
        return (
          <g key={i}>
            <ellipse cx={c.px} cy={c.py} rx={0.78} ry={0.44} fill="none" stroke="#B65335" strokeWidth={0.12} opacity={0.8} />
            <ellipse cx={c.px} cy={c.py} rx={0.5} ry={0.28} fill="#B65335" style={{ animation: `burnerGlow 3.4s ease-in-out ${i * 0.8}s infinite` }} />
          </g>
        );
      })}
      <IsoCylinder x={7.3} y={7.3} z={1.95} r={0.62} h={0.48} top="#B69A63" side="#8C7448" />
      <IsoCylinder x={9.5} y={7.3} z={1.95} r={0.52} h={0.4} top="#D9D2C6" side="#A79E91" />
      <Steam x={7.3} y={7.3} z={2.7} delay={0.2} scale={1.4} />
      <Steam x={9.5} y={7.3} z={2.55} delay={1.6} scale={1.1} />

      {/* pantry shelf (L1) — small, tidy, right side */}
      <IsoBox x={10.9} y={0.7} w={2.0} d={3.2} h={3.3} top="#4A3F36" left="#29221D" right="#332A24" />
      {[0.85, 1.8, 2.75].map((z, i) => (
        <g key={i}>
          <IsoSlab x={10.95} y={0.75} z={z} w={1.9} d={3.0} fill="#6E5B4A" />
          {Array.from({ length: 3 }).map((_, j) => (
            <IsoCylinder key={j} x={11.35 + j * 0.52} y={1.35} z={z + 0.03} r={0.24} h={0.34} top={['#B65335', '#85865A', '#B69A63'][(i + j) % 3]} side="#9A9288" />
          ))}
        </g>
      ))}

      {/* three master chefs, generous space between stations */}
      <Chef x={4.2} y={5.6} scale={0.68} moving delay={0.2} apron="#641E25" />
      <Chef x={8.2} y={10.5} scale={0.7} moving delay={1.2} apron="#B65335" />
      <Chef x={2.9} y={9.6} scale={0.68} moving delay={0.7} apron="#85865A" skin="#B98457" />

      {/* one carried tray travelling between stations */}
      <g style={{ animation: 'carryItem 7s linear infinite' }}>
        <IsoSlab x={3.2} y={4.3} z={2.25} w={0.7} d={0.5} fill="#B65335" />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  GPU — industrial hall                                              */
/* ------------------------------------------------------------------ */

function GpuKitchen() {
  const W = 26.5;
  const D = 15.0;
  const islands = [0, 1, 2];
  const perRow = 7;
  return (
    <g>
      <IsoBox x={0} y={0} w={W} d={D} h={0.5} top="#EFE9DF" left="#A79E91" right="#C3BAAB" stroke="rgba(25,24,21,0.32)" />
      <IsoSlab x={0.45} y={0.45} z={0.51} w={W - 0.9} d={D - 0.9} fill="#E2DBCB" stroke="rgba(25,24,21,0.07)" strokeWidth={0.1} />
      {Array.from({ length: 13 }).map((_, i) => (
        <IsoSlab key={`v${i}`} x={0.45 + i * 2} y={0.45} z={0.52} w={0.04} d={D - 0.9} fill="rgba(41,34,29,0.06)" />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <IsoSlab key={`h${i}`} x={0.45} y={0.45 + i * 2.05} z={0.52} w={W - 0.9} d={0.04} fill="rgba(41,34,29,0.06)" />
      ))}

      {/* back wall + extraction hoods */}
      <IsoBox x={0} y={0} w={W} d={0.4} h={4.0} top="#453A31" left="#2A231E" right="#332B25" stroke="rgba(25,24,21,0.5)" strokeWidth={0.12} />
      {Array.from({ length: 13 }).map((_, i) => {
        const a = ISO.project(1.4 + i * 2.0, 0.02, 0.2);
        const b2 = ISO.project(1.4 + i * 2.0, 0.02, 3.85);
        return <line key={`gp${i}`} x1={a.px} y1={a.py} x2={b2.px} y2={b2.py} stroke="rgba(248,246,240,0.055)" strokeWidth={0.05} />;
      })}
      {Array.from({ length: 5 }).map((_, i) => (
        <g key={i}>
          <IsoBox x={1.8 + i * 4.9} y={0.45} w={2.7} d={1.0} h={1.35} top="#4A3F36" left="#29221D" right="#332A24" />
          <IsoSlab x={1.9 + i * 4.9} y={1.45} z={1.3} w={2.5} d={0.55} fill="#B69A63" opacity={0.5} />
        </g>
      ))}

      {/* parallel prep islands, each a brigade of line cooks */}
      {islands.map((r) => (
        <g key={r}>
          <IsoBox x={1.6} y={3.1 + r * 3.35} w={22.4} d={2.1} h={1.7} top="#F1ECE2" left="#6E5B4A" right="#8A7560" stroke="rgba(25,24,21,0.34)" strokeWidth={0.1} />
          <IsoSlab x={1.68} y={3.18 + r * 3.35} z={1.71} w={22.2} d={1.95} fill="#EDE8DE" stroke="rgba(25,24,21,0.12)" strokeWidth={0.08} />
          {Array.from({ length: perRow }).map((_, j) => (
            <g key={j}>
              <IsoSlab x={2.3 + j * 3.1} y={3.75 + r * 3.35} z={1.75} w={1.0} d={0.75} fill={['#B65335', '#85865A', '#B69A63'][(j + r) % 3]} opacity={0.92} />
              <IsoSlab x={2.3 + j * 3.1} y={3.75 + r * 3.35} z={1.76} w={1.0} d={0.1} fill="rgba(25,24,21,0.16)" />
            </g>
          ))}
          {Array.from({ length: perRow }).map((_, j) => (
            <Chef
              key={j}
              x={2.85 + j * 3.1}
              y={6.0 + r * 3.35}
              scale={0.56}
              moving
              delay={(j + r * 2) * 0.3}
              jacket={j % 3 === 0 ? '#E4DED1' : '#EDE8DE'}
              apron={j % 2 === 0 ? '#B65335' : '#8B8983'}
              skin={j % 4 === 0 ? '#A9744B' : '#D2A276'}
            />
          ))}
          {[0, 1, 2].map((k) => (
            <Steam key={k} x={4.8 + k * 7} y={4.4 + r * 3.35} z={2.2} delay={(r * 1.1 + k * 1.4) % 5} scale={1.1} />
          ))}
        </g>
      ))}

      {/* conveyor down the right edge, moving plates toward the pass */}
      <IsoBox x={24.3} y={2.6} w={1.4} d={12.2} h={1.0} top="#4A3F36" left="#29221D" right="#332A24" />
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i} style={{ animation: `beltSlide 5.6s linear ${i * 0.46}s infinite` }}>
          <IsoSlab x={24.5} y={3.0 + i * 1.45} z={1.05} w={1.0} d={0.85} fill={i % 2 ? '#D9D2C6' : '#B69A63'} />
        </g>
      ))}

      {/* VRAM warehouse, near-left: wide stacked cold storage */}
      <IsoBox x={0.2} y={11.3} w={5.2} d={3.4} h={2.4} top="#332A24" left="#191815" right="#221C18" />
      {Array.from({ length: 4 }).map((_, i) => (
        <IsoBox key={i} x={0.5 + i * 1.25} y={11.6} w={0.9} d={2.8} h={1.3 + (i % 2) * 0.5} top="#641E25" left="#4A161C" right="#571B22" stroke="rgba(25,24,21,0.45)" strokeWidth={0.1} />
      ))}
      <IsoSlab x={0.28} y={11.38} z={2.42} w={5.05} d={3.28} fill="#B69A63" opacity={0.32} />


      {/* front-edge wave: additional cooks streaming to the pass */}
      {Array.from({ length: 6 }).map((_, j) => (
        <Chef
          key={`front-${j}`}
          x={3.6 + j * 3.6}
          y={13.55}
          scale={0.6}
          moving
          delay={0.4 + j * 0.34}
          jacket="#EDE8DE"
          apron={j % 2 === 0 ? '#B69A63' : '#D9D2C6'}
          skin={j % 3 === 0 ? '#A9744B' : '#D2A276'}
        />
      ))}

      {/* floor coordinator */}
      <Chef x={17.6} y={13.65} scale={0.66} moving delay={0.3} jacket="#641E25" apron="#F8F6F0" />
    </g>
  );
}

export default function HeroScene({ className = '', stacked = false }: { className?: string; stacked?: boolean }) {
  // Both kitchens share one projection; each is placed by transforming the unit
  // isometric bbox into its slot in the composition.
  return (
    <svg
      viewBox={stacked ? '120 60 700 700' : '40 70 1340 510'}
      className={className}
      role="img"
      aria-label="Isometric cutaway comparing a small CPU kitchen with four master chefs against a large GPU kitchen staffed by parallel line cooks"
    >
      <defs>
        <radialGradient id="glowCpu" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#B65335" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#B65335" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glowGpu" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#B69A63" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#B69A63" stopOpacity="0" />
        </radialGradient>
      </defs>

      <style>{`
        @keyframes chefBob { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-0.9px) } }
        @keyframes steamRise {
          0% { opacity: 0; transform: translateY(1px) scale(0.85) }
          25% { opacity: 0.9 }
          100% { opacity: 0; transform: translateY(-4.6px) scale(1.2) }
        }
        @keyframes burnerGlow { 0%,100% { opacity: 0.3 } 50% { opacity: 0.9 } }
        @keyframes carryItem {
          0% { transform: translate(0,0); opacity: 0 }
          12% { opacity: 1 }
          60% { transform: translate(0.9px,-0.4px); opacity: 1 }
          72% { opacity: 0 }
          100% { transform: translate(0.9px,-0.4px); opacity: 0 }
        }
        @keyframes beltSlide { 0% { transform: translateY(0); opacity: 0 } 14% { opacity: 1 } 86% { opacity: 1 } 100% { transform: translateY(0.55px); opacity: 0 } }
      `}</style>

      {stacked ? (
        <>
          <ellipse cx={400} cy={200} rx={300} ry={180} fill="url(#glowCpu)" />
          <ellipse cx={400} cy={560} rx={310} ry={200} fill="url(#glowGpu)" />
        </>
      ) : (
        <>
          <ellipse cx={352} cy={318} rx={300} ry={210} fill="url(#glowCpu)" />
          <ellipse cx={1052} cy={296} rx={440} ry={270} fill="url(#glowGpu)" />
        </>
      )}

      {/* CPU: local bbox center ≈ (0.87, 3.9), scale 26 → translate(357,199) */}
      <g transform={stacked ? "translate(400,190) scale(25) translate(-0.87,-3.75)" : "translate(352,300) scale(23) translate(-0.87,-3.75)"}>
        <CpuKitchen />
      </g>

      {/* GPU: local bbox center ≈ (5.05, 8.5), scale 16 → translate(1009,184) */}
      <g transform={stacked ? "translate(400,540) scale(19) translate(-5.05,-8.2)" : "translate(1038,298) scale(17.4) translate(-5.05,-8.2)"}>
        <GpuKitchen />
      </g>

      {/* measured divider between the two worlds */}
      <g opacity={0.45} style={stacked ? { display: 'none' } : undefined}>
        <line x1={700} y1={60} x2={700} y2={520} stroke="#8B8983" strokeDasharray="2 7" strokeWidth={1} />
        <circle cx={700} cy={60} r={2.4} fill="#B69A63" />
        <circle cx={700} cy={520} r={2.4} fill="#B69A63" />
        <text x={712} y={300} className="font-mono-tech" fontSize={9} fill="#8B8983" letterSpacing="0.22em" transform="rotate(90 712 300)">
          SAME PROBLEM · DIFFERENT SILICON
        </text>
      </g>

      {/* annotations */}
      {!stacked && (
      <>
      <g>
        <line x1={238} y1={492} x2={238} y2={516} stroke="#B65335" strokeWidth={1.2} />
        <circle cx={238} cy={492} r={2.6} fill="#B65335" />
        <text x={238} y={536} className="font-mono-tech" fontSize={11} fill="#641E25" letterSpacing="0.16em">
          CPU — BOUTIQUE ATELIER
        </text>
        <text x={238} y={554} className="font-mono-tech" fontSize={9.5} fill="#8B8983" letterSpacing="0.11em">
          4 OF 16 CORES SHOWN · LATENCY OPTIMISED
        </text>
      </g>
      <g>
        <line x1={860} y1={492} x2={860} y2={516} stroke="#85865A" strokeWidth={1.2} />
        <circle cx={860} cy={492} r={2.6} fill="#85865A" />
        <text x={860} y={536} className="font-mono-tech" fontSize={11} fill="#5C5D3E" letterSpacing="0.16em">
          GPU — INDUSTRIAL HALL
        </text>
        <text x={860} y={554} className="font-mono-tech" fontSize={9.5} fill="#8B8983" letterSpacing="0.11em">
          3,328 LANES · THROUGHPUT OPTIMISED
        </text>
      </g>
      </>
      )}
      {stacked && (
        <line x1={150} y1={300} x2={660} y2={300} stroke="#8B8983" strokeDasharray="2 8" strokeWidth={1} opacity={0.4} />
      )}
    </svg>
  );
}
