import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Clock, Layers, Target } from 'lucide-react';
import { EXPERIMENTS } from '../data/experiments';
import { useTour } from '../tour/TourContext';
import { ExperimentId, ExperimentMeta } from '../types/simulation';
import { SectionHeading, Pill } from '../components/ui/Section';
import { Thumbnail } from '../components/illustrations/Thumbnails';
import { Reveal } from '../components/ui/Reveal';

const CATEGORIES = ['All', 'Parallel Compute', 'CPU Microarchitecture', 'Memory Hierarchy', 'System Architecture'] as const;

const diffTone = (d: ExperimentMeta['difficulty']) =>
  d === 'Foundational' ? 'olive' : d === 'Intermediate' ? 'brass' : 'burgundy';

export default function Library({ onOpen }: { onOpen: (id: ExperimentId) => void }) {
  const tour = useTour();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('All');
  const [hovered, setHovered] = useState<ExperimentId | null>(null);

  const list = useMemo(
    () => (cat === 'All' ? EXPERIMENTS : EXPERIMENTS.filter((e) => e.category === cat)),
    [cat],
  );

  return (
    <section id="experiments" className="relative bg-[#EDE8DE]/55 border-b border-[#D9D2C6]">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28">
        <SectionHeading
          index="02"
          kicker="EXPERIMENT LIBRARY"
          align="split"
          title={
            <>
              Twenty missions into the machine<span className="text-[#B65335]">.</span>
            </>
          }
          lead={
            <>
              Each mission is a deterministic trace, not a video — every number is modelled on one specific
              laptop: a Ryzen 9 8940HX and an RTX 5060 with 8 GB. Step the clock, break the pipeline, thrash
              the cache, and watch the same workload behave differently on two kinds of silicon.
            </>
          }
        />

        {/* filter rail */}
        <div className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-3 border-b border-[#D9D2C6] pb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`relative px-3 py-1.5 font-mono-tech text-[9.5px] tracking-[0.16em] transition-colors ${
                cat === c ? 'text-[#F8F6F0]' : 'text-[#3A352E] hover:text-[#641E25]'
              }`}
            >
              {cat === c && (
                <motion.span
                  layoutId="libFilter"
                  className="absolute inset-0 bg-[#191815]"
                  transition={{ duration: 0.35, ease: [0.16, 0.84, 0.24, 1] }}
                />
              )}
              <span className="relative">{c.toUpperCase()}</span>
            </button>
          ))}
          <span className="ml-auto font-mono-tech text-[9.5px] tracking-[0.16em] text-[#8B8983]">
            {String(list.length).padStart(2, '0')} OF {String(EXPERIMENTS.length).padStart(2, '0')} VISIBLE
          </span>
        </div>

        {/* mission list — editorial rows, not identical cards */}
        <div className="mt-2">
          <AnimatePresence initial={false}>
            {list.map((e, i) => (
              <motion.article
                key={e.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45, delay: Math.min(i * 0.03, 0.18), ease: [0.16, 0.84, 0.24, 1] }}
                onMouseEnter={() => setHovered(e.id)}
                onMouseLeave={() => setHovered(null)}
                className="group relative border-b border-[#D9D2C6]"
              >
                <button data-tour={`exp-${e.id}`} onClick={() => { onOpen(e.id); tour?.notifyAction('experiment-selected'); }} className="w-full text-left">
                  <div className="relative grid grid-cols-12 items-center gap-x-3 sm:gap-x-5 py-5 lg:py-6">
                    {/* hover wash */}
                    <span className="pointer-events-none absolute inset-x-[-16px] inset-y-0 bg-[#F8F6F0] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative col-span-12 sm:col-span-2 lg:col-span-1 mb-1.5 sm:mb-0 font-mono-tech text-[10px] tracking-[0.18em] text-[#8B8983]">
                      {e.number}
                    </div>

                    <div className="relative hidden lg:block lg:col-span-2">
                      <div className="relative overflow-hidden border border-[#D9D2C6] transition-transform duration-500 group-hover:scale-[1.02]">
                        <Thumbnail id={e.id} />
                      </div>
                    </div>

                    <div className="relative col-span-12 sm:col-span-8 lg:col-span-4">
                      <h3 className="font-display text-[26px] sm:text-[24px] lg:text-[27px] leading-[1.1] text-[#191815] group-hover:text-[#641E25] transition-colors">
                        {e.title}
                      </h3>
                      <p className="mt-1.5 font-sans-ui text-[12.5px] leading-[1.6] text-[#5A554C] max-w-[42ch]">
                        {e.subtitle}
                      </p>
                    </div>

                    <div className="relative hidden lg:flex lg:col-span-3 flex-wrap items-center gap-1.5">
                      <Pill tone={diffTone(e.difficulty) as 'olive' | 'brass' | 'burgundy'}>{e.difficulty.toUpperCase()}</Pill>
                      <Pill tone="outline">
                        <Clock size={9} /> {e.duration.toUpperCase()}
                      </Pill>
                      <Pill tone="neutral">
                        <Layers size={9} /> {e.topology === 'heterogeneous' ? 'HETERO' : e.topology === 'gpu-only' ? 'GPU' : 'CPU'}
                      </Pill>
                    </div>

                    <div className="relative col-span-12 sm:col-span-2 lg:col-span-2 flex items-center justify-end gap-3 mt-3 sm:mt-0">
                      <span className="hidden md:inline font-mono-tech text-[9.5px] tracking-[0.18em] text-[#8B8983] group-hover:text-[#641E25] transition-colors">
                        LAUNCH
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center border border-[#D9D2C6] group-hover:border-[#641E25] group-hover:bg-[#641E25] transition-colors duration-300">
                        <ArrowUpRight
                          size={14}
                          className="text-[#3A352E] group-hover:text-[#F8F6F0] transition-colors duration-300"
                        />
                      </span>
                    </div>
                  </div>

                  {/* objective strip revealed on hover */}
                  <AnimatePresence>
                    {hovered === e.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.34, ease: [0.16, 0.84, 0.24, 1] }}
                        className="relative overflow-hidden"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-3 pb-6 pl-0 lg:pl-[calc(8.333%+0.25rem)]">
                          <div className="lg:col-span-5 font-sans-ui text-[12.5px] leading-[1.7] text-[#3A352E] max-w-[52ch]">
                            {e.shortExplanation}
                          </div>
                          <div className="lg:col-span-7">
                            <div className="font-mono-tech text-[8.5px] tracking-[0.2em] text-[#8B8983] mb-2">
                              LEARNING OBJECTIVES
                            </div>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                              {e.learningObjectives.map((o) => (
                                <li key={o} className="flex gap-2 font-sans-ui text-[11.5px] leading-[1.55] text-[#5A554C]">
                                  <Target size={10} className="mt-[3px] shrink-0 text-[#B65335]" />
                                  {o}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        <Reveal className="mt-9">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="font-sans-ui text-[12.5px] text-[#8B8983] max-w-[62ch]">
              Hover a mission to read its objectives. Every experiment can be paused mid-cycle, rewound one step,
              or replayed at 0.25× to 4× speed.
            </p>
            <button
              onClick={() => onOpen('vector-addition')}
              className="group inline-flex items-center gap-2 bg-[#191815] text-[#F8F6F0] px-5 py-3 text-[12.5px] hover:bg-[#641E25] transition-colors duration-300"
            >
              Start with Vector Addition
              <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
