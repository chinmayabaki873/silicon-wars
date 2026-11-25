import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeading, Pill } from '../components/ui/Section';
import { Reveal } from '../components/ui/Reveal';

const MODES = [
  {
    id: 'beginner',
    label: 'Beginner',
    tag: 'KITCHEN LANGUAGE',
    head: 'Read the kitchen.',
    body:
      'Every panel is written twice. In beginner mode you read only the restaurant: orders, stations, shelves, delivery vans, and the head chef shouting tickets. No acronyms, no cycle counts — just cause and effect.',
    bullets: [
      'Plain-language narration attached to each execution step',
      'Metaphor labels on every component, in both directions',
      'No numbers you have to interpret to follow the story',
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering',
    tag: 'SILICON LANGUAGE',
    head: 'Read the datapath.',
    body:
      'Switch the same step into engineering mode and you get the hardware truth: opcode, register rename, cache tier, latency in cycles, occupancy, and the exact reason throughput collapsed.',
    bullets: [
      'ISA-level opcodes, addresses and register transfers',
      'Cache tier, hit/miss status and latency for every access',
      'Quantified bottlenecks: IPC, SIMT efficiency, AMAT, bytes',
    ],
  },
] as const;

export default function Learn({ onLaunch }: { onLaunch: () => void }) {
  const [mode, setMode] = useState<'beginner' | 'engineering'>('beginner');
  const active = MODES.find((m) => m.id === mode)!;

  return (
    <section id="learn" className="relative bg-[#F8F6F0] border-b border-[#D9D2C6]">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28">
        <SectionHeading
          index="05"
          kicker="LEARNING EXPERIENCE"
          align="split"
          title={
            <>
              One step. Two honest explanations<span className="text-[#B65335]">.</span>
            </>
          }
          lead={
            <>
              Abstraction is not dumbing down — it is choosing which layer to hide. The simulator keeps both
              layers and lets you switch mid-flight, without losing your place in the trace.
            </>
          }
        />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10">
          <div className="lg:col-span-5">
            <div className="inline-flex border border-[#D9D2C6] p-1">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`relative px-5 py-2 font-mono-tech text-[10px] tracking-[0.18em] transition-colors ${
                    mode === m.id ? 'text-[#F8F6F0]' : 'text-[#3A352E] hover:text-[#641E25]'
                  }`}
                >
                  {mode === m.id && (
                    <motion.span layoutId="learnMode" className="absolute inset-0 bg-[#191815]" transition={{ duration: 0.3 }} />
                  )}
                  <span className="relative">{m.label.toUpperCase()}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="mt-7"
              >
                <Pill tone={mode === 'beginner' ? 'brass' : 'burgundy'}>{active.tag}</Pill>
                <h3 className="mt-4 font-display text-[34px] leading-[1.1] text-[#191815]">{active.head}</h3>
                <p className="mt-4 font-sans-ui text-[13.5px] leading-[1.75] text-[#3A352E] max-w-[46ch]">{active.body}</p>
                <ul className="mt-6 space-y-2.5">
                  {active.bullets.map((b) => (
                    <li key={b} className="flex gap-3 items-start">
                      <span className="mt-[7px] h-1 w-3 shrink-0 bg-[#B65335]" />
                      <span className="font-sans-ui text-[12.5px] leading-[1.65] text-[#5A554C]">{b}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

            <Reveal className="mt-8">
              <button
                onClick={onLaunch}
                className="group inline-flex items-center gap-2 border border-[#191815]/25 px-5 py-3 text-[12.5px] hover:border-[#641E25] hover:text-[#641E25] transition-colors"
              >
                See both modes in the simulator
                <span className="h-px w-7 bg-current transition-all duration-300 group-hover:w-11" />
              </button>
            </Reveal>
          </div>

          {/* the same step, rendered both ways */}
          <div className="lg:col-span-7">
            <div className="border border-[#D9D2C6] bg-[#FFFFFF] shadow-[0_1px_0_0_#D9D2C6]">
              <div className="flex items-center justify-between border-b border-[#D9D2C6] px-5 py-3">
                <span className="font-mono-tech text-[9.5px] tracking-[0.2em] text-[#8B8983]">
                  EXECUTION INSPECTOR · CACHE VS RAM · STEP 04 / 09
                </span>
                <span className="font-mono-tech text-[9.5px] tracking-[0.2em] text-[#641E25]">L1 MISS</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#EDE8DE]">
                <div className="p-5">
                  <div className="font-mono-tech text-[8.5px] tracking-[0.2em] text-[#8B8983]">COMPONENT</div>
                  <p className={`mt-2 font-display text-[16px] leading-[1.3] ${mode === 'beginner' ? 'text-[#641E25]' : 'text-[#8B8983]'}`}>
                    Chef&rsquo;s station spice rack
                  </p>
                  <p className={`mt-1 font-mono-tech text-[11px] leading-[1.5] ${mode === 'engineering' ? 'text-[#191815]' : 'text-[#A9A49B]'}`}>
                    L1 Data Cache · 32 KB · 8-way
                  </p>
                  <div className="mt-5 font-mono-tech text-[8.5px] tracking-[0.2em] text-[#8B8983]">OPERATION</div>
                  <p className={`mt-2 font-sans-ui text-[12px] leading-[1.65] ${mode === 'beginner' ? 'text-[#3A352E]' : 'text-[#B4AFA6]'}`}>
                    Reaching up for cardamom. The shelf is empty — someone must walk down to the pantry while the
                    station waits.
                  </p>
                  <p className={`mt-1.5 font-mono-tech text-[10.5px] leading-[1.6] ${mode === 'engineering' ? 'text-[#3A352E]' : 'text-[#C9C4BB]'}`}>
                    LDG.64 R1, [0x2000] → L1 tag compare returns MISS → 64-byte line fill from DDR5
                  </p>
                  <div className="mt-5 flex items-center gap-2">
                    <span className="font-mono-tech text-[8.5px] tracking-[0.2em] text-[#8B8983]">LATENCY</span>
                    <span className={`font-mono-tech text-[11px] ${mode === 'beginner' ? 'text-[#641E25]' : 'text-[#191815]'}`}>
                      {mode === 'beginner' ? '≈ 4 minutes' : '200 cycles'}
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-[#F8F6F0]/60">
                  <div className="font-mono-tech text-[8.5px] tracking-[0.2em] text-[#8B8983]">WHY IT MATTERS</div>
                  <p className="mt-2 font-sans-ui text-[12px] leading-[1.7] text-[#3A352E]">
                    {mode === 'beginner'
                      ? 'One missing ingredient can idle a whole station for a long time. That is why good kitchens keep a small shelf of exactly the things they are about to need.'
                      : 'A miss at L1 propagates to the load/store unit and marks the destination register busy. Dependent instructions stall in the reservation station, and IPC drops toward 1/latency until the line returns.'}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                      ['HIT RATE', mode === 'beginner' ? 'low' : '0 %'],
                      ['STALLS', mode === 'beginner' ? 'several' : '3 cyc'],
                      ['TIER', mode === 'beginner' ? 'basement' : 'DRAM'],
                    ].map(([l, v]) => (
                      <div key={l} className="border border-[#D9D2C6] bg-[#F8F6F0] p-2.5">
                        <div className="font-mono-tech text-[8px] tracking-[0.16em] text-[#8B8983]">{l}</div>
                        <div className="mt-1 font-mono-tech text-[12px] text-[#191815]">{v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 border-t border-[#D9D2C6] pt-3">
                    <div className="font-mono-tech text-[8.5px] tracking-[0.2em] text-[#8B8983]">NEXT STEP</div>
                    <p className="mt-1.5 font-sans-ui text-[11.5px] leading-[1.6] text-[#5A554C]">
                      The runner returns with a crate of four — the next three loads become hits.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#D9D2C6] px-5 py-3 flex items-center justify-between">
                <span className="font-mono-tech text-[9px] tracking-[0.18em] text-[#8B8983]">
                  BEGINNER ↔ ENGINEERING · SWITCH ANY TIME
                </span>
                <span className="flex items-center gap-1.5 font-mono-tech text-[9px] tracking-[0.18em] text-[#641E25]">
                  <span className="h-1.5 w-1.5 bg-[#641E25]" /> SYNCHRONISED
                </span>
              </div>
            </div>

            <p className="mt-3 font-mono-tech text-[9.5px] tracking-[0.14em] text-[#8B8983]">
              EXCERPT FROM EXPERIMENT 05 · RENDERED FROM THE SAME TRACE DATA AS THE LIVE SIMULATOR
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
