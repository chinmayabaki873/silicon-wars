import React from 'react';
import { motion } from 'framer-motion';
import { CanonicalComponentId, GridCell, SimulationStep } from '../../types/simulation';

export type VisualProps = {
  step: SimulationStep;
  param: string;
  selected: CanonicalComponentId | null;
  onSelect: (id: CanonicalComponentId) => void;
};


export default function ImageVisual({ step }: VisualProps) {
  const input = step.specialVisual?.inputGridCells ?? [];
  const out = step.specialVisual?.gridCells ?? [];
  const cell = (c: GridCell, ox: number, oy: number, id: string) => {
    const v = c.intensity ?? 0;
    const fill = `rgb(${Math.round(v * 0.62 + 30)},${Math.round(v * 0.46 + 24)},${Math.round(v * 0.34 + 18)})`;
    return (
      <g key={id}>
        <rect x={ox + c.col * 22} y={oy + c.row * 22} width={21} height={21} fill={fill} stroke={c.status === 'active' ? '#B69A63' : 'rgba(25,24,21,0.4)'} strokeWidth={c.status === 'active' ? 1.2 : 0.5} />
        <text x={ox + c.col * 22 + 10.5} y={oy + c.row * 22 + 14} fontSize={6.4} textAnchor="middle" fill={v > 130 ? '#191815' : '#D9D2C6'} fontFamily="JetBrains Mono, monospace">
          {c.value}
        </text>
      </g>
    );
  };
  return (
    <svg viewBox="0 0 420 216" className="w-full h-full">
      <text x={14} y={16} fontSize={7} fill="#6E6A63" fontFamily="JetBrains Mono, monospace" letterSpacing={1.6}>
        2D CONVOLUTION · 6×6 PIXEL TILE · 3×3 STENCIL
      </text>
      <text x={30} y={34} fontSize={6} fill="#8B8983" fontFamily="JetBrains Mono, monospace">
        INPUT
      </text>
      {input.map((c, i) => cell(c, 30, 40, `in${i}`))}
      <text x={200} y={34} fontSize={6} fill="#8B8983" fontFamily="JetBrains Mono, monospace">
        OUTPUT
      </text>
      {out.map((c, i) => cell(c, 200, 40, `out${i}`))}
      <path d="M170 100 L186 100" stroke="#B69A63" strokeWidth={1} />
      <path d="M182 96 L187 100 L182 104" fill="none" stroke="#B69A63" strokeWidth={1} />
      <text x={178} y={92} fontSize={5.6} textAnchor="middle" fill="#B69A63" fontFamily="JetBrains Mono, monospace">
        KERNEL
      </text>
      <text x={30} y={196} fontSize={6.4} fill="#8B8983" fontFamily="JetBrains Mono, monospace" letterSpacing={1.1}>
        EACH THREAD OWNS ONE PIXEL · NEIGHBOURHOOD READ AMPLIFICATION ≈ 9×
      </text>
    </svg>
  );
}

/* --------------------------- RACE BARS --------------------------- */
