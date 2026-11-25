import React from 'react';
import { motion } from 'framer-motion';
import { CanonicalComponentId, GridCell, SimulationStep } from '../../types/simulation';

export type VisualProps = {
  step: SimulationStep;
  param: string;
  selected: CanonicalComponentId | null;
  onSelect: (id: CanonicalComponentId) => void;
};


export default function VectorVisual({ step }: VisualProps) {
  const items = step.specialVisual?.vectorItems ?? [];
  if (items.length > 0) {
    return (
      <svg viewBox="0 0 420 216" className="w-full h-full">
        <text x={14} y={18} fontSize={7} fill="#6E6A63" fontFamily="JetBrains Mono, monospace" letterSpacing={1.6}>
          ELEMENT-WISE ADDITION · C[i] = A[i] + B[i]
        </text>
        {items.map((it, i) => {
          const x = 18 + i * 48;
          return (
            <g key={i}>
              <rect x={x} y={40} width={38} height={30} fill="#241E1A" stroke="#3A312B" />
              <text x={x + 19} y={52} fontSize={6} textAnchor="middle" fill="#6E6A63" fontFamily="JetBrains Mono, monospace">
                A[{i}]
              </text>
              <text x={x + 19} y={64} fontSize={10} textAnchor="middle" fill="#D9D2C6" fontFamily="JetBrains Mono, monospace">
                {it.a}
              </text>

              <rect x={x} y={110} width={38} height={30} fill="#241E1A" stroke="#3A312B" />
              <text x={x + 19} y={122} fontSize={6} textAnchor="middle" fill="#6E6A63" fontFamily="JetBrains Mono, monospace">
                B[{i}]
              </text>
              <text x={x + 19} y={134} fontSize={10} textAnchor="middle" fill="#D9D2C6" fontFamily="JetBrains Mono, monospace">
                {it.b}
              </text>

              <line x1={x + 19} y1={72} x2={x + 19} y2={86} stroke="#3A312B" strokeWidth={1} />
              <line x1={x + 19} y1={142} x2={x + 19} y2={156} stroke="#3A312B" strokeWidth={1} />

              <rect
                x={x}
                y={158}
                width={38}
                height={32}
                fill={it.status === 'done' ? '#3E402A' : it.status === 'active' ? '#641E25' : '#1B1713'}
                stroke={it.status === 'active' ? '#B65335' : '#3A312B'}
                strokeWidth={it.status === 'active' ? 1.4 : 0.7}
              />
              <text x={x + 19} y={171} fontSize={6} textAnchor="middle" fill="#6E6A63" fontFamily="JetBrains Mono, monospace">
                C[{i}]
              </text>
              <text x={x + 19} y={183} fontSize={11} textAnchor="middle" fill={it.out !== null ? '#EDE8DE' : '#5A554C'} fontFamily="JetBrains Mono, monospace">
                {it.out !== null ? it.out : '—'}
              </text>
              {it.status === 'active' && (
                <motion.rect
                  x={x}
                  y={158}
                  width={38}
                  height={32}
                  fill="none"
                  stroke="#B69A63"
                  strokeWidth={1}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
            </g>
          );
        })}
        <text x={14} y={208} fontSize={6.4} fill="#5A554C" fontFamily="JetBrains Mono, monospace" letterSpacing={1.2}>
          {items.filter((i) => i.out !== null).length} / 8 ELEMENTS COMMITTED
        </text>
      </svg>
    );
  }

  const cells = step.specialVisual?.gridCells ?? [];
  return (
    <svg viewBox="0 0 420 216" className="w-full h-full">
      <text x={14} y={18} fontSize={7} fill="#6E6A63" fontFamily="JetBrains Mono, monospace" letterSpacing={1.6}>
        SEQUENTIAL ARRAY WALK · LDG R1, [A + i*4]
      </text>
      {cells.map((c, i) => {
        const x = 18 + i * 48;
        const tone = c.status === 'done' ? '#3E402A' : c.status === 'active' ? '#641E25' : '#1B1713';
        return (
          <g key={i}>
            <rect x={x} y={62} width={38} height={52} fill={tone} stroke={c.status === 'active' ? '#B65335' : '#3A312B'} strokeWidth={c.status === 'active' ? 1.4 : 0.7} />
            <text x={x + 19} y={82} fontSize={8} textAnchor="middle" fill="#6E6A63" fontFamily="JetBrains Mono, monospace">
              a{i}
            </text>
            <text x={x + 19} y={100} fontSize={10} textAnchor="middle" fill="#D9D2C6" fontFamily="JetBrains Mono, monospace">
              {(i * 7 + 13) % 97}
            </text>
            <text x={x + 19} y={130} fontSize={6} textAnchor="middle" fill="#5A554C" fontFamily="JetBrains Mono, monospace">
              0x{(0x1000 + i * 4).toString(16).toUpperCase()}
            </text>
          </g>
        );
      })}
      <line x1={12} y1={52} x2={408} y2={52} stroke="#3A312B" strokeWidth={0.8} />
      <text x={14} y={160} fontSize={6.6} fill="#B69A63" fontFamily="JetBrains Mono, monospace" letterSpacing={1.2}>
        64-BYTE CACHE LINE COVERS FOUR ADJACENT ELEMENTS
      </text>
      <rect x={12} y={168} width={200} height={16} fill="none" stroke="#B65335" strokeDasharray="3 3" strokeWidth={0.9} />
      <text x={220} y={180} fontSize={6.4} fill="#8B8983" fontFamily="JetBrains Mono, monospace">
        LINE 0x1000–0x103C
      </text>
    </svg>
  );
}

/* ----------------------------- MATRIX ----------------------------- */
