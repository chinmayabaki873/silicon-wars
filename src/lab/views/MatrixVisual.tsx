import React from 'react';
import { motion } from 'framer-motion';
import { CanonicalComponentId, GridCell, SimulationStep } from '../../types/simulation';

export type VisualProps = {
  step: SimulationStep;
  param: string;
  selected: CanonicalComponentId | null;
  onSelect: (id: CanonicalComponentId) => void;
};


export default function MatrixVisual({ step }: VisualProps) {
  const cells: GridCell[] = step.specialVisual?.gridCells ?? [];
  return (
    <svg viewBox="0 0 420 216" className="w-full h-full">
      <text x={14} y={18} fontSize={7} fill="#6E6A63" fontFamily="JetBrains Mono, monospace" letterSpacing={1.6}>
        GEMM OUTPUT TILE · C = A × B
      </text>
      {cells.map((c, i) => {
        const x = 40 + c.col * 56;
        const y = 40 + c.row * 48;
        const tone = c.status === 'done' ? '#641E25' : c.status === 'active' ? '#B65335' : '#1B1713';
        return (
          <g key={i}>
            <rect x={x} y={y} width={50} height={42} fill={tone} stroke="#3A312B" strokeWidth={0.7} opacity={c.status === 'pending' ? 0.7 : 1} />
            <text x={x + 25} y={y + 26} fontSize={13} textAnchor="middle" fill={c.status === 'done' || c.status === 'active' ? '#F8F6F0' : '#4A443C'} fontFamily="JetBrains Mono, monospace">
              {c.value}
            </text>
          </g>
        );
      })}
      <text x={40} y={196} fontSize={6.4} fill="#8B8983" fontFamily="JetBrains Mono, monospace" letterSpacing={1.2}>
        ROW × COLUMN DOT PRODUCTS · FUSED MULTIPLY-ADD
      </text>
      <text x={250} y={40} fontSize={6.4} fill="#B65335" fontFamily="JetBrains Mono, monospace">
        ACTIVE TILE
      </text>
      <text x={250} y={52} fontSize={6.4} fill="#6E6A63" fontFamily="JetBrains Mono, monospace">
        {step.specialVisual ? 'VRAM TRAFFIC STAGED VIA SHARED MEM' : ''}
      </text>
      <text x={250} y={76} fontSize={6.4} fill="#8B8983" fontFamily="JetBrains Mono, monospace">
        AI ≈ {step.metrics.bytesTransferred > 0 ? (step.metrics.instructionsExecuted / Math.max(1, step.metrics.bytesTransferred)).toFixed(2) : '0.00'} FLOP/B
      </text>
      <text x={250} y={88} fontSize={6.4} fill="#8B8983" fontFamily="JetBrains Mono, monospace">
        {step.metrics.bytesTransferred} B MOVED
      </text>
    </svg>
  );
}

/* ---------------------------- PIPELINE ---------------------------- */
