import { useTour } from '../../tour/TourContext';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';

export function Logo({ tone = 'dark', size = 1 }: { tone?: 'dark' | 'light'; size?: number }) {
  const ink = tone === 'dark' ? '#191815' : '#F8F6F0';
  const accent = tone === 'dark' ? '#641E25' : '#B65335';
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width={26 * size} height={26 * size} viewBox="0 0 32 32" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="2.5" fill="none" stroke={ink} strokeOpacity="0.28" />
        <rect x="5" y="5" width="10" height="10" fill={accent} />
        <rect x="5" y="5" width="10" height="10" fill="none" stroke={ink} strokeOpacity="0.4" />
        {[17, 22.5].map((x) =>
          [5, 10.5, 16].map((y) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="4.5" height="4.5" fill={ink} fillOpacity="0.25" />
          )),
        )}
        <rect x="5" y="17" width="22" height="10" fill="none" stroke={ink} strokeOpacity="0.35" />
      </svg>
      <div className="leading-none">
        <div
          className="font-mono-tech text-[13px] tracking-[0.26em]"
          style={{ color: ink }}
        >
          SILICON WARS
        </div>
        <div className="font-mono-tech text-[8.5px] tracking-[0.3em] mt-1" style={{ color: tone === 'dark' ? '#8B8983' : '#B69A63' }}>
          INSIDE THE MACHINE
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { id: 'explore', label: 'Explore' },
  { id: 'experiments', label: 'Experiments' },
  { id: 'rig', label: 'Rig' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'learn', label: 'Learn' },
  { id: 'about', label: 'About' },
];

export function Header({
  onLaunch,
  tone = 'light',
  active,
}: {
  onLaunch: () => void;
  tone?: 'light' | 'dark';
  active?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const tour = useTour();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dark = tone === 'light'; // on ivory page, text is charcoal

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled ? 'backdrop-blur-[10px] bg-[#F8F6F0]/86 border-b border-[#D9D2C6]' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 h-[70px] flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="shrink-0">
            <Logo />
          </button>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                data-tour={n.id === 'experiments' ? 'nav-experiments' : undefined}
                onClick={() => { if (n.id === 'experiments') tour?.notifyAction('experiments-clicked'); }}
                className="group relative font-sans-ui text-[13px] text-[#3A352E] hover:text-[#641E25] transition-colors"
              >
                {n.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-px bg-[#641E25] transition-all duration-300 ${
                    active === n.id ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </a>
            ))}
            <button
              type="button"
              onClick={() => tour?.startTour()}
              data-tour="nav-guided-learning"
              className="group relative font-sans-ui text-[13px] text-[#641E25] font-medium hover:text-[#191815] transition-colors"
            >
              Guided Learning
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onLaunch}
              className="group relative hidden sm:inline-flex items-center gap-2 bg-[#191815] text-[#F8F6F0] px-5 py-2.5 text-[12.5px] font-sans-ui tracking-wide hover:bg-[#641E25] transition-colors duration-300"
            >
              Launch Simulator
              <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 -mr-2" aria-label="Open menu">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#191815] text-[#F8F6F0] px-7 py-6 flex flex-col"
          >
            <div className="flex items-center justify-between">
              <Logo tone="light" />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 -mr-2">
                <X size={22} />
              </button>
            </div>
            <div className="mt-16 flex flex-col gap-1">
              {NAV.map((n, i) => (
                <motion.a
                  key={n.id}
                  href={`#${n.id}`}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i + 0.1 }}
                  className="font-display text-[34px] leading-[1.25] text-[#F8F6F0]/90 hover:text-[#B69A63] transition-colors"
                >
                  {n.label}
                </motion.a>
              ))}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                onLaunch();
              }}
              className="mt-auto w-full bg-[#F8F6F0] text-[#191815] py-4 font-sans-ui text-[13px] tracking-wide"
            >
              Launch Simulator
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function Footer({ onLaunch }: { onLaunch: () => void }) {
  return (
    <footer className="bg-[#191815] text-[#F8F6F0]">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <Logo tone="light" />
            <p className="mt-6 max-w-[36ch] font-sans-ui text-[13.5px] leading-[1.7] text-[#D9D2C6]/75">
              An interactive investigation of how CPUs and GPUs actually execute instructions — built from
              deterministic architectural models, not decorative animation.
            </p>
            <button
              onClick={onLaunch}
              className="mt-7 inline-flex items-center gap-2 border border-[#B69A63]/55 text-[#B69A63] px-5 py-2.5 text-[12.5px] hover:bg-[#B69A63] hover:text-[#191815] transition-colors duration-300"
            >
              Enter the Simulation <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="md:col-span-3">
            <div className="font-mono-tech text-[9.5px] tracking-[0.24em] text-[#8B8983]">PRODUCT</div>
            <ul className="mt-5 space-y-3 font-sans-ui text-[13px] text-[#D9D2C6]/80">
              <li><a href="#experiments" className="hover:text-[#B69A63] transition-colors">Experiment library</a></li>
              <li><a href="#architecture" className="hover:text-[#B69A63] transition-colors">Architecture atlas</a></li>
              <li><a href="#learn" className="hover:text-[#B69A63] transition-colors">Learning modes</a></li>
              <li><a href="#about" className="hover:text-[#B69A63] transition-colors">Method &amp; limits</a></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="font-mono-tech text-[9.5px] tracking-[0.24em] text-[#8B8983]">METHOD</div>
            <p className="mt-5 font-sans-ui text-[12.5px] leading-[1.75] text-[#D9D2C6]/65">
              Every step you see is produced by a deterministic instruction-level model written in TypeScript:
              cycle counts, cache latencies, PCIe bandwidth and warp masks are parameterised constants. No browser
              API can read your physical CPU counters — nothing here claims to.
            </p>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-[#29221D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="font-mono-tech text-[10px] tracking-[0.18em] text-[#8B8983]">
            SILICON WARS · INSIDE THE MACHINE · DONE BY CHINMAYA BAKI, TEJASWINI EKKULURI
          </span>
          <span className="font-mono-tech text-[10px] tracking-[0.18em] text-[#8B8983]">
            MODELED BEHAVIOUR — NOT MEASURED HARDWARE
          </span>
        </div>
      </div>
    </footer>
  );
}
