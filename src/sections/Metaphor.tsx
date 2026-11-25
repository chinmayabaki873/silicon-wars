import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { METAPHOR_ITEMS } from '../data/metaphors';
import { SectionHeading, Pill } from '../components/ui/Section';
import { Reveal } from '../components/ui/Reveal';
import StationGlyph from '../components/illustrations/StationGlyph';

export default function Metaphor({ onLaunchExperiment }: { onLaunchExperiment: () => void }) {
  const [active, setActive] = useState(0);
  const item = METAPHOR_ITEMS[active];

  return (
    <section id="explore" className="relative bg-[#F8F6F0] border-b border-[#D9D2C6]">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28">
        <SectionHeading
          index="01"
          kicker="THE KITCHEN METAPHOR"
          align="split"
          title={
            <>
              A restaurant is an honest
              <br className="hidden sm:block" /> model of a processor<span className="text-[#B65335]">.</span>
            </>
          }
          lead={
            <>
              Ingredient handling has all the same constraints as data handling: storage is tiered, work is
              scheduled, and moving things costs more than touching them. Choose a station — the anatomy changes
              in both directions at once.
            </>
          }
        />

        {/* station rail */}
        <div className="mt-11 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 border-l border-t border-[#D9D2C6]">
          {METAPHOR_ITEMS.map((m, i) => {
            const on = i === active;
            return (
              <button
                key={m.id}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className={`group relative border-r border-b border-[#D9D2C6] px-3.5 py-3.5 text-left transition-colors ${
                  on ? 'bg-[#191815]' : 'bg-transparent hover:bg-[#EDE8DE]/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono-tech text-[8px] tracking-[0.18em] ${
                      on ? 'text-[#B69A63]' : 'text-[#B0AAA0]'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={`h-1 w-1 ${on ? 'bg-[#B65335]' : 'bg-[#D9D2C6]'}`} />
                </div>
                <div className={`mt-2 h-6 sm:h-9 ${on ? 'opacity-100' : 'opacity-100'} transition-opacity`}>
                  <StationGlyph index={i} tone={on ? '#B69A63' : '#3A352E'} />
                </div>
                <div
                  className={`mt-2 font-sans-ui text-[11.5px] leading-[1.3] h-[30px] sm:h-[32px] flex items-start ${
                    on ? 'text-[#F8F6F0]' : 'text-[#3A352E]'
                  }`}
                >
                  {m.hardwareTitle.split('(')[0].trim()}
                </div>
              </button>
            );
          })}
        </div>

        {/* dual-language panel */}
        <div className="relative mt-6 bg-[#191815] text-[#F8F6F0] overflow-hidden">
          <div className="absolute inset-0 bg-drafting-charcoal opacity-50 [mask-image:radial-gradient(120%_100%_at_85%_0%,black,transparent_72%)]" />
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.34, ease: [0.16, 0.84, 0.24, 1] }}
              className="relative grid grid-cols-1 lg:grid-cols-12"
            >
              <div className="lg:col-span-8 p-7 lg:p-10">
                <div className="flex items-center gap-3">
                  <span className="font-mono-tech text-[9.5px] tracking-[0.22em] text-[#B69A63]">{item.shortTag}</span>
                  <span className="h-px flex-1 max-w-[60px] bg-[#3A312B]" />
                  <span className="font-mono-tech text-[9px] tracking-[0.16em] text-[#6E6A63]">
                    {String(active + 1).padStart(2, '0')} / {String(METAPHOR_ITEMS.length).padStart(2, '0')}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-9 gap-y-6">
                  <div>
                    <div className="font-mono-tech text-[9px] tracking-[0.22em] text-[#6E6A63]">IN THE KITCHEN</div>
                    <h3 className="mt-2 font-display text-[26px] leading-[1.16] text-[#F8F6F0]">{item.kitchenTitle}</h3>
                    <p className="mt-3 font-sans-ui text-[13px] leading-[1.72] text-[#D9D2C6]/80">
                      {item.beginnerSummary}
                    </p>
                  </div>
                  <div className="md:border-l md:border-[#3A312B] md:pl-9">
                    <div className="font-mono-tech text-[9px] tracking-[0.22em] text-[#6E6A63]">IN SILICON</div>
                    <h3 className="mt-2 font-display text-[20px] leading-[1.24] text-[#B69A63]">{item.hardwareTitle}</h3>
                    <p className="mt-3 font-sans-ui text-[13px] leading-[1.72] text-[#D9D2C6]/70">
                      {item.engineeringSummary}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[#3A312B] p-7 lg:p-8 flex flex-col justify-between gap-6">
                <div className="space-y-5">
                  {[
                    ['LATENCY / CLOCK', item.latencyCycles],
                    ['KITCHEN EQUIVALENT', item.kitchenTimeEquivalent],
                    ['CAPACITY', item.capacitySpec],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="font-mono-tech text-[8px] tracking-[0.2em] text-[#6E6A63]">{label}</div>
                      <div className="mt-1 font-mono-tech text-[10.5px] leading-[1.5] text-[#EDE8DE]">{value}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={onLaunchExperiment}
                  className="group inline-flex items-center gap-2 font-mono-tech text-[9.5px] tracking-[0.18em] text-[#B69A63]"
                >
                  SEE IT IN THE SIMULATOR
                  <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <Reveal className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="brass">DUAL EXPLANATION</Pill>
            <Pill tone="outline">SAME COMPONENT, TWO LANGUAGES</Pill>
            <span className="font-sans-ui text-[12px] text-[#8B8983]">
              Every station in the simulator carries both labels, and clicking one highlights the other.
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
