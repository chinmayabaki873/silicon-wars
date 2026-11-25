import React from 'react';
import { motion } from 'framer-motion';
import { CanonicalComponentId, GridCell, SimulationStep } from '../../types/simulation';

export type VisualProps = {
  step: SimulationStep;
  param: string;
  selected: CanonicalComponentId | null;
  onSelect: (id: CanonicalComponentId) => void;
};


export default function TransferVisual({ step }: VisualProps) {
  const t = step.specialVisual?.transferProgress ?? { hostPct: 0, busPct: 0, vramPct: 0, payloadKb: 0 };
  return (
    <svg viewBox="0 0 420 216" className="w-full h-full">
      <text x={14} y={18} fontSize={7} fill="#6E6A63" fontFamily="JetBrains Mono, monospace" letterSpacing={1.6}>
        HOST → DEVICE TRANSFER · PCIe GEN5 ×16
      </text>

      {/* host */}
      <rect x={20} y={54} width={70} height={54} fill="#241E1A" stroke="#5A4E43" />
      <text x={55} y={76} fontSize={6.4} textAnchor="middle" fill="#B69A63" fontFamily="JetBrains Mono, monospace">
        HOST RAM
      </text>
      <text x={55} y={90} fontSize={8} textAnchor="middle" fill="#D9D2C6" fontFamily="JetBrains Mono, monospace">
        {t.hostPct}%
      </text>

      {/* bus */}
      <rect x={100} y={66} width={210} height={30} fill="#1B1713" stroke="#2C2420" />
      {Array.from({ length: 10 }).map((_, i) => (
        <rect
          key={i}
          x={104 + i * 20}
          y={74}
          width={14}
          height={14}
          fill={104 + i * 20 < 100 + (210 * (t.busPct || 0)) / 100 ? '#B65335' : '#332B25'}
        />
      ))}
      <text x={205} y={60} fontSize={5.8} textAnchor="middle" fill="#8B8983" fontFamily="JetBrains Mono, monospace">
        PCIe BUS · {t.busPct}%
      </text>

      {/* vram */}
      <rect x={320} y={54} width={76} height={54} fill="#2A1116" stroke="#641E25" />
      <text x={358} y={76} fontSize={6.4} textAnchor="middle" fill="#B65335" fontFamily="JetBrains Mono, monospace">
        VRAM
      </text>
      <text x={358} y={90} fontSize={8} textAnchor="middle" fill="#D9D2C6" fontFamily="JetBrains Mono, monospace">
        {t.vramPct}%
      </text>

      {/* payload bar */}
      <text x={20} y={134} fontSize={6} fill="#8B8983" fontFamily="JetBrains Mono, monospace">
        PAYLOAD {(t.payloadKb / 1024).toFixed(0)} MB
      </text>
      <rect x={20} y={140} width={376} height={10} fill="#1B1713" stroke="#2C2420" />
      <rect x={20} y={140} height={10} fill="#B69A63" width={Number.isFinite(t.busPct) ? Math.max(0, (376 * t.busPct) / 100) : 0} />

      <text x={20} y={172} fontSize={6.2} fill="#B65335" fontFamily="JetBrains Mono, monospace" letterSpacing={1.1}>
        TRANSFER COST DOMINATES WHEN WORK PER BYTE IS SMALL
      </text>
      <text x={20} y={186} fontSize={6.2} fill="#6E6A63" fontFamily="JetBrains Mono, monospace">
        {step.metrics.bytesTransferred.toLocaleString()} B MOVED · {step.stageShort}
      </text>
    </svg>
  );
}

