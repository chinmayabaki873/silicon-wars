import React from 'react';
import { motion } from 'framer-motion';
import { CanonicalComponentId, GridCell, SimulationStep } from '../../types/simulation';

export type VisualProps = {
  step: SimulationStep;
  param: string;
  selected: CanonicalComponentId | null;
  onSelect: (id: CanonicalComponentId) => void;
};


export default function WarpVisual({ step }: VisualProps) {
  const half = step.specialVisual?.warpMask ?? Array(16).fill(true);
  const mask = [...half, ...half];
  return (
    <svg viewBox="0 0 420 216" className="w-full h-full">
      <text x={14} y={16} fontSize={7} fill="#6E6A63" fontFamily="JetBrains Mono, monospace" letterSpacing={1.6}>
        WARP LANES · ONE INSTRUCTION · 32 REGISTER CONTEXTS
      </text>
      {mask.map((on, i) => {
        const x = 22 + (i % 16) * 24;
        const y = i < 16 ? 30 : 88;
        return (
          <g key={i}>
            <rect x={x} y={y} width={20} height={44} fill={on ? '#641E25' : '#1B1713'} stroke={on ? '#B65335' : '#2C2420'} strokeWidth={on ? 1 : 0.7} />
            <text x={x + 10} y={y + 18} fontSize={6.4} textAnchor="middle" fill={on ? '#F8F6F0' : '#4A443C'} fontFamily="JetBrains Mono, monospace">
              {i % 16 === 0 ? 'A0' : String(i).padStart(2, '0')}
            </text>
            <text x={x + 10} y={y + 32} fontSize={5.4} textAnchor="middle" fill={on ? '#B69A63' : '#3A332C'} fontFamily="JetBrains Mono, monospace">
              {on ? 'ADD' : '—'}
            </text>
          </g>
        );
      })}
      <text x={22} y={148} fontSize={6.4} fill="#8B8983" fontFamily="JetBrains Mono, monospace">
        ACTIVE MASK 0x{mask.map((b) => (b ? 'F' : '0')).join('').slice(0, 8).toUpperCase()}
      </text>
      <text x={22} y={160} fontSize={6.4} fill={mask.every(Boolean) ? '#85865A' : '#B65335'} fontFamily="JetBrains Mono, monospace">
        SIMT EFFICIENCY {Math.round((mask.filter(Boolean).length / mask.length) * 100)}%
      </text>
      <text x={22} y={186} fontSize={6} fill="#5A554C" fontFamily="JetBrains Mono, monospace" letterSpacing={1}>
        {mask.every(Boolean) ? 'COHERENT PATH · NO REPLAY REQUIRED' : 'DIVERGENT PATH · INACTIVE LANES MASKED OFF'}
      </text>
      <text x={22} y={200} fontSize={6} fill="#5A554C" fontFamily="JetBrains Mono, monospace" letterSpacing={1}>
        {step.stageShort}
      </text>
    </svg>
  );
}

/* --------------------------- IMAGE GRID --------------------------- */
