import React from 'react';
import { motion } from 'framer-motion';
import { CanonicalComponentId, GridCell, SimulationStep } from '../../types/simulation';

export type VisualProps = {
  step: SimulationStep;
  param: string;
  selected: CanonicalComponentId | null;
  onSelect: (id: CanonicalComponentId) => void;
};


export default function PipelineVisual({ step }: VisualProps) {
  const slots = step.specialVisual?.pipelineSlots ?? [];
  const stages = ['IF', 'ID', 'EX', 'MEM', 'WB'];
  const kitchen = ['Order', 'Prep', 'Sear', 'Pantry', 'Plate'];
  return (
    <svg viewBox="0 0 420 216" className="w-full h-full">
      <text x={14} y={16} fontSize={7} fill="#6E6A63" fontFamily="JetBrains Mono, monospace" letterSpacing={1.6}>
        5-STAGE PIPELINE · ORDER → PREP → SEAR → PANTRY → PLATE
      </text>
      {stages.map((s, i) => (
        <g key={s}>
          <rect x={26 + i * 78} y={28} width={70} height={22} fill={slots.some((sl) => sl.stage === s && sl.status !== 'empty') ? '#4A161C' : '#211C18'} stroke="#3A312B" />
          <text x={61 + i * 78} y={39} fontSize={7} textAnchor="middle" fill="#B69A63" fontFamily="JetBrains Mono, monospace">
            {s}
          </text>
          <text x={61 + i * 78} y={47} fontSize={5.4} textAnchor="middle" fill="#6E6A63" fontFamily="JetBrains Mono, monospace">
            {kitchen[i].toUpperCase()}
          </text>
        </g>
      ))}

      {slots.map((sl, i) => {
        if (sl.status === 'empty') return null;
        const rowY = 60 + i * 30;
        const stageIdx = stages.indexOf(sl.stage);
        const statusColor =
          sl.status === 'stall' ? '#641E25' : sl.status === 'forwarded' ? '#85865A' : sl.status === 'active' ? '#B65335' : '#2C2420';
        return (
          <g key={i}>
            <text x={8} y={rowY + 14} fontSize={6.2} fill="#6E6A63" fontFamily="JetBrains Mono, monospace">
              I{i + 1}
            </text>
            <rect
              x={26 + Math.max(0, stageIdx) * 78}
              y={rowY}
              width={70}
              height={24}
              fill={sl.status === 'stall' ? 'none' : statusColor}
              stroke={sl.status === 'stall' ? '#641E25' : '#3A312B'}
              strokeDasharray={sl.status === 'stall' ? '3 3' : undefined}
              strokeWidth={sl.status === 'stall' ? 1.2 : 0.7}
            />
            <text
              x={61 + Math.max(0, stageIdx) * 78}
              y={rowY + 10}
              fontSize={5.6}
              textAnchor="middle"
              fill={sl.status === 'stall' ? '#B65335' : '#F8F6F0'}
              fontFamily="JetBrains Mono, monospace"
            >
              {sl.status === 'stall' ? 'BUBBLE' : sl.instruction.split(' ')[0]}
            </text>
            <text x={61 + Math.max(0, stageIdx) * 78} y={rowY + 19} fontSize={5.2} textAnchor="middle" fill="#D9D2C6" fontFamily="JetBrains Mono, monospace">
              {sl.kitchenStage.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------------------- WARP MASK ---------------------------- */
