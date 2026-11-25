import React from 'react';
import { motion } from 'framer-motion';
import { CanonicalComponentId, GridCell, SimulationStep } from '../../types/simulation';

export type VisualProps = {
  step: SimulationStep;
  param: string;
  selected: CanonicalComponentId | null;
  onSelect: (id: CanonicalComponentId) => void;
};


export default function RaceVisual({ step }: VisualProps) {
  const race = step.specialVisual?.raceProgress ?? { cpuPct: 0, gpuPct: 0, cpuCycles: 0, gpuCycles: 0 };
  return (
    <svg viewBox="0 0 420 216" className="w-full h-full">
      <text x={14} y={18} fontSize={7} fill="#6E6A63" fontFamily="JetBrains Mono, monospace" letterSpacing={1.6}>
        ELAPSED WORK · SAME WORKLOAD, TWO ARCHITECTURES
      </text>

      {[
        { label: 'CPU · 4 OF 16 CORES', pct: race.cpuPct, tone: '#B65335', y: 50 },
        { label: 'GPU · 8 OF 26 SMs', pct: race.gpuPct, tone: '#B69A63', y: 118 },
      ].map((bar) => (
        <g key={bar.label}>
          <text x={16} y={bar.y} fontSize={6.4} fill="#8B8983" fontFamily="JetBrains Mono, monospace" letterSpacing={1.2}>
            {bar.label}
          </text>
          <rect x={16} y={bar.y + 8} width={380} height={26} fill="#1B1713" stroke="#2C2420" />
          <rect
            x={16}
            y={bar.y + 8}
            height={26}
            fill={bar.tone}
            width={Number.isFinite(bar.pct) ? Math.max(0, (380 * bar.pct) / 100) : 0}
          />
          <text x={16 + (380 * bar.pct) / 100 - 6} y={bar.y + 25} fontSize={8} textAnchor="end" fill="#191815" fontFamily="JetBrains Mono, monospace">
            {bar.pct}%
          </text>
        </g>
      ))}

      <text x={16} y={176} fontSize={6.4} fill="#6E6A63" fontFamily="JetBrains Mono, monospace">
        CPU CYCLES {race.cpuCycles} · GPU CYCLES {race.gpuCycles}
      </text>
      <text x={16} y={192} fontSize={6.4} fill="#B69A63" fontFamily="JetBrains Mono, monospace" letterSpacing={1.1}>
        {step.stageShort} · {step.inspector.phaseBadge}
      </text>
    </svg>
  );
}

/* ------------------------- TRANSFER BUS ------------------------- */
