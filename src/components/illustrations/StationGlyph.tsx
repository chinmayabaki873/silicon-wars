import React from 'react';

type Props = { index: number; tone: string };

/**
 * Twelve hand-drawn micro-glyphs — one per metaphor station.
 * Deliberately abstract: these read as engineering pictograms, not emoji.
 */
export default function StationGlyph({ index, tone }: Props) {
  const c = tone;
  const faint = 'rgba(58,53,46,0.42)';

  switch (index) {
    case 0: // CPU — die with four cores
      return (
        <svg viewBox="0 0 64 44" className="w-full h-full" aria-hidden="true">
          <rect x={14} y={8} width={36} height={28} fill="none" stroke={c} strokeWidth="1.1" />
          {[0, 1].map((r) =>
            [0, 1].map((k) => (
              <rect key={`${r}${k}`} x={18 + k * 15} y={12 + r * 12} width={12} height={9} fill={c} opacity={0.35 + (r + k) * 0.16} />
            )),
          )}
          {Array.from({ length: 5 }).map((_, i) => (
            <g key={i} stroke={faint} strokeWidth="0.9">
              <line x1={16 + i * 8} y1={4} x2={16 + i * 8} y2={8} />
              <line x1={16 + i * 8} y1={36} x2={16 + i * 8} y2={40} />
            </g>
          ))}
        </svg>
      );
    case 1: // cores — four independent stations
      return (
        <svg viewBox="0 0 64 44" className="w-full h-full" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={10 + i * 12} y={10} width={9} height={9} fill={c} opacity={0.8} />
              <rect x={10 + i * 12} y={10} width={9} height={9} fill="none" stroke={c} strokeWidth="0.8" />
              <line x1={14.5 + i * 12} y1={19} x2={14.5 + i * 12} y2={34} stroke={c} strokeWidth="1" opacity="0.5" />
              <line x1={9 + i * 12} y1={34} x2={20 + i * 12} y2={34} stroke={c} strokeWidth="1.1" opacity="0.7" />
            </g>
          ))}
        </svg>
      );
    case 2: // GPU — dense lane grid
      return (
        <svg viewBox="0 0 64 44" className="w-full h-full" aria-hidden="true">
          {Array.from({ length: 32 }).map((_, i) => (
            <rect
              key={i}
              x={9 + (i % 8) * 6}
              y={10 + Math.floor(i / 8) * 7}
              width={4}
              height={4}
              fill={c}
              opacity={0.28 + ((i * 7) % 9) * 0.07}
            />
          ))}
          <rect x={7} y={8} width={50} height={26} fill="none" stroke={c} strokeWidth="0.8" opacity="0.6" />
        </svg>
      );
    case 3: // workers — brigade bars
      return (
        <svg viewBox="0 0 64 44" className="w-full h-full" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => (
            <g key={i}>
              <circle cx={10 + i * 5.4} cy={13} r={1.7} fill={c} opacity={0.75} />
              <rect x={8.6 + i * 5.4} y={17} width={2.8} height={16} fill={c} opacity={0.4} />
            </g>
          ))}
          <line x1={6} y1={36} x2={58} y2={36} stroke={faint} strokeWidth="0.9" />
        </svg>
      );
    case 4: // instructions — order tickets
      return (
        <svg viewBox="0 0 64 44" className="w-full h-full" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={16 + i * 2} y={7 + i * 9} width={32} height={9} fill="#191815" stroke={c} strokeWidth="0.9" opacity={0.9} />
              <line x1={20 + i * 2} y1={11.5 + i * 9} x2={36 + i * 2} y2={11.5 + i * 9} stroke={c} strokeWidth="1" opacity="0.85" />
              <line x1={20 + i * 2} y1={13.6 + i * 9} x2={30 + i * 2} y2={13.6 + i * 9} stroke={faint} strokeWidth="0.8" />
            </g>
          ))}
        </svg>
      );
    case 5: // registers — cutting board with four slots
      return (
        <svg viewBox="0 0 64 44" className="w-full h-full" aria-hidden="true">
          <path d="M10 16 L54 16 L50 32 L14 32 Z" fill="none" stroke={c} strokeWidth="1.1" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={15 + i * 9.5} y={19} width={7} height={10} fill={c} opacity={0.35 + i * 0.15} />
          ))}
          <path d="M14 14 L50 14" stroke={faint} strokeWidth="0.9" />
        </svg>
      );
    case 6: // cache — shelving
      return (
        <svg viewBox="0 0 64 44" className="w-full h-full" aria-hidden="true">
          <rect x={12} y={8} width={40} height={28} fill="none" stroke={c} strokeWidth="1" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <line x1={12} y1={16 + i * 9} x2={52} y2={16 + i * 9} stroke={c} strokeWidth="1.1" opacity="0.8" />
              {[0, 1, 2, 3].map((j) => (
                <rect key={j} x={16 + j * 9} y={12 + i * 9} width={5} height={3.6} fill={c} opacity={0.35} />
              ))}
            </g>
          ))}
        </svg>
      );
    case 7: // RAM — tall pantry with drawers
      return (
        <svg viewBox="0 0 64 44" className="w-full h-full" aria-hidden="true">
          <rect x={20} y={5} width={24} height={34} fill="none" stroke={c} strokeWidth="1.1" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={23} y={8 + i * 8} width={18} height={6} fill={c} opacity={0.22 + i * 0.08} />
              <line x1={29} y1={11 + i * 8} x2={35} y2={11 + i * 8} stroke={faint} strokeWidth="0.9" />
            </g>
          ))}
        </svg>
      );
    case 8: // VRAM — wide bus
      return (
        <svg viewBox="0 0 64 44" className="w-full h-full" aria-hidden="true">
          <rect x={8} y={16} width={48} height={12} fill="none" stroke={c} strokeWidth="1" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={11 + i * 4} y1={16} x2={11 + i * 4} y2={28} stroke={c} strokeWidth="0.9" opacity={0.35 + (i % 3) * 0.2} />
          ))}
          <line x1={8} y1={34} x2={56} y2={34} stroke={c} strokeWidth="1.1" opacity="0.6" />
          <line x1={8} y1={31} x2={56} y2={31} stroke={faint} strokeWidth="0.8" strokeDasharray="2 2" />
        </svg>
      );
    case 9: // ALU — burners
      return (
        <svg viewBox="0 0 64 44" className="w-full h-full" aria-hidden="true">
          <rect x={12} y={18} width={40} height={16} fill="none" stroke={c} strokeWidth="1.1" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <circle cx={22 + i * 10} cy={26} r={4.4} fill="none" stroke={c} strokeWidth="1" opacity="0.85" />
              <circle cx={22 + i * 10} cy={26} r={1.7} fill={c} opacity={0.65} />
            </g>
          ))}
          <line x1={12} y1={14} x2={52} y2={14} stroke={faint} strokeWidth="0.9" />
        </svg>
      );
    case 10: // scheduler — dispatch fan-out
      return (
        <svg viewBox="0 0 64 44" className="w-full h-full" aria-hidden="true">
          <rect x={8} y={17} width={12} height={10} fill={c} opacity={0.7} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <path d={`M20 22 L34 22 L34 ${10 + i * 12} L46 ${10 + i * 12}`} fill="none" stroke={c} strokeWidth="1" opacity={i === 1 ? 1 : 0.55} />
              <rect x={46} y={6 + i * 12} width={11} height={8} fill={c} opacity={i === 1 ? 0.75 : 0.3} />
            </g>
          ))}
        </svg>
      );
    default: // pipeline — stages
      return (
        <svg viewBox="0 0 64 44" className="w-full h-full" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <path
                d={`M${8 + i * 10} 12 L${16 + i * 10} 12 L${16 + i * 10} 32 L${8 + i * 10} 32 L${4 + i * 10} 22 Z`}
                fill={c}
                opacity={0.2 + i * 0.16}
                stroke={c}
                strokeWidth="0.7"
              />
            </g>
          ))}
          <line x1={6} y1={38} x2={56} y2={38} stroke={faint} strokeWidth="0.8" />
        </svg>
      );
  }
}
