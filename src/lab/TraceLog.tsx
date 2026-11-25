import React from 'react';
import { SimulationStep } from '../types/simulation';

export default function TraceLog({
  steps,
  index,
  onJump,
}: {
  steps: SimulationStep[];
  index: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="border border-[#D9D2C6] bg-[#FFFFFF]">
      <div className="flex items-center justify-between border-b border-[#D9D2C6] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 bg-[#B69A63]" />
          <span className="font-mono-tech text-[9.5px] tracking-[0.2em] text-[#191815]">TRACE LOG</span>
        </div>
        <span className="font-mono-tech text-[8.5px] tracking-[0.14em] text-[#8B8983]">
          {steps.length} STEPS · CLICK TO JUMP
        </span>
      </div>
      <div className="max-h-[228px] overflow-y-auto dark-scroll">
        {steps.map((s, i) => {
          const on = i === index;
          const past = i < index;
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              className={`flex w-full items-center gap-3 border-b border-[#EDE8DE] px-4 py-2 text-left transition-colors last:border-b-0 ${
                on ? 'bg-[#191815]' : 'hover:bg-[#EDE8DE]/60'
              }`}
            >
              <span
                className={`font-mono-tech text-[8.5px] tracking-[0.14em] w-8 shrink-0 ${
                  on ? 'text-[#B69A63]' : past ? 'text-[#B0AAA0]' : 'text-[#8B8983]'
                }`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={`font-mono-tech text-[8px] tracking-[0.12em] w-16 shrink-0 truncate ${
                  on ? 'text-[#B65335]' : 'text-[#8B8983]'
                }`}
              >
                {s.stageShort}
              </span>
              <span
                className={`flex-1 truncate font-sans-ui text-[11.5px] ${
                  on ? 'text-[#F8F6F0]' : past ? 'text-[#8B8983]' : 'text-[#3A352E]'
                }`}
              >
                {s.inspector.stepTitle}
              </span>
              <span
                className={`shrink-0 font-mono-tech text-[8px] tracking-[0.12em] ${
                  on ? 'text-[#B69A63]' : 'text-[#B0AAA0]'
                }`}
              >
                {s.cycle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
