import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  X,
} from 'lucide-react';
import { useTour } from './TourContext';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function TourOverlay({ onExploreAnother }: { onExploreAnother: () => void }) {
  const tour = useTour();
  const [rect, setRect] = useState<Rect | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);

  const step = tour?.step;
  const active = tour?.active ?? false;
  const paused = tour?.paused ?? false;

  // Reset "Why am I seeing this?" when step changes
  useEffect(() => {
    setWhyOpen(false);
  }, [step?.id]);

  // Measure target element and keep it updated on resize/scroll/DOM changes
  useEffect(() => {
    if (!active || paused || !step?.target) {
      setRect(null);
      return;
    }

    const measure = () => {
      const el = document.querySelector(step.target!) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top - 6,
        left: r.left - 6,
        width: r.width + 12,
        height: r.height + 12,
      });
    };

    const el = document.querySelector(step.target) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }

    measure();
    const t1 = window.setTimeout(measure, 350);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const obs = new MutationObserver(measure);
    obs.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(t1);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      obs.disconnect();
    };
  }, [active, paused, step?.target, step?.id]);

  if (!tour) return null;

  // 1. First-visit prompt
  if (tour.promptOpen && !tour.active) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          role="dialog"
          aria-label="Guided tour invitation"
          className="fixed bottom-5 right-5 z-[90] w-[calc(100vw-2.5rem)] max-w-[380px] border border-[#2C2420] bg-[#191815] p-5 text-[#F8F6F0] shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass size={13} className="text-[#B69A63]" />
              <span className="font-mono-tech text-[9px] tracking-[0.22em] text-[#B69A63]">GUIDED LEARNING</span>
            </div>
            <button
              onClick={tour.dismissPrompt}
              aria-label="Dismiss"
              className="p-1 text-[#8B8983] hover:text-[#F8F6F0]"
            >
              <X size={13} />
            </button>
          </div>
          <h3 className="mt-2.5 font-display text-[22px] leading-[1.2] text-[#F8F6F0]">
            New to Silicon Wars? Let&apos;s explore.
          </h3>
          <p className="mt-1.5 font-sans-ui text-[12px] leading-[1.6] text-[#D9D2C6]/75">
            Take a step-by-step interactive walkthrough of the kitchen analogy, architecture diagram, and live
            simulation.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => tour.startTour(false)}
              className="flex-1 bg-[#641E25] px-4 py-2 font-mono-tech text-[9px] tracking-[0.16em] text-[#F8F6F0] transition-colors hover:bg-[#8C2A33]"
            >
              START GUIDED TOUR
            </button>
            <button
              onClick={tour.dismissPrompt}
              className="border border-[#3A312B] px-3 py-2 font-mono-tech text-[9px] tracking-[0.14em] text-[#D9D2C6] transition-colors hover:border-[#B69A63] hover:text-[#B69A63]"
            >
              EXPLORE INDEPENDENTLY
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!tour.active) return null;

  // 2. Paused pill
  if (tour.paused) {
    return (
      <div className="fixed bottom-5 right-5 z-[90] flex items-center gap-3 border border-[#2C2420] bg-[#191815] px-4 py-2.5 text-[#F8F6F0] shadow-xl">
        <span className="font-mono-tech text-[9px] tracking-[0.18em] text-[#B69A63]">
          TOUR PAUSED · {tour.stepIndex + 1} OF {tour.totalSteps}
        </span>
        <button
          onClick={tour.resumeTour}
          className="flex items-center gap-1 bg-[#641E25] px-2.5 py-1 font-mono-tech text-[8.5px] tracking-[0.14em] text-[#F8F6F0] hover:bg-[#8C2A33]"
        >
          <Play size={10} /> RESUME
        </button>
        <button onClick={tour.exitTour} aria-label="Exit tour" className="text-[#8B8983] hover:text-[#F8F6F0]">
          <X size={13} />
        </button>
      </div>
    );
  }

  // Compute tooltip position
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const cardW = Math.min(390, vw - 24);

  let cardStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 24,
    right: 24,
    width: cardW,
  };

  if (rect) {
    const spaceBelow = vh - (rect.top + rect.height);
    const placeBelow = spaceBelow > 260 || rect.top < 220;
    const top = placeBelow
      ? Math.min(vh - 280, rect.top + rect.height + 14)
      : Math.max(16, rect.top - 260);
    const left = Math.max(12, Math.min(vw - cardW - 12, rect.left));
    cardStyle = {
      position: 'fixed',
      top,
      left,
      width: cardW,
    };
  } else {
    // Centered modal-like card for welcome / completion
    cardStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: cardW,
    };
  }

  const progressPct = Math.round(((tour.stepIndex + 1) / tour.totalSteps) * 100);
  const isActionStep = Boolean(tour.step.actionEvent);
  const isLast = tour.stepIndex === tour.totalSteps - 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" role="dialog" aria-label="Guided walkthrough">
      {/* Spotlight cutout */}
      {rect ? (
        <>
          <div
            className="pointer-events-none fixed inset-0 transition-all duration-300"
            style={{
              boxShadow: `0 0 0 9999px rgba(25, 24, 21, 0.72)`,
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              border: '1.5px solid #B69A63',
            }}
          />
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="pointer-events-none fixed"
            style={{
              top: rect.top - 3,
              left: rect.left - 3,
              width: rect.width + 6,
              height: rect.height + 6,
              border: '1px solid #B65335',
            }}
          />
        </>
      ) : (
        <div className="pointer-events-none fixed inset-0 bg-[#191815]/65" />
      )}

      {/* Tooltip card */}
      <motion.div
        key={tour.step.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={cardStyle as any}
        className="pointer-events-auto border border-[#2C2420] bg-[#F8F6F0] text-[#191815] shadow-2xl"
      >
        {/* progress bar */}
        <div className="h-1 w-full bg-[#EDE8DE]">
          <div className="h-full bg-[#641E25] transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="p-4">
          {/* header */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono-tech text-[8.5px] tracking-[0.2em] text-[#641E25]">
              GUIDED TOUR · {tour.stepIndex + 1} OF {tour.totalSteps}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={tour.pauseTour}
                title="Pause tour"
                aria-label="Pause tour"
                className="p-1 text-[#8B8983] hover:text-[#191815]"
              >
                <Pause size={12} />
              </button>
              <button
                onClick={tour.restartTour}
                title="Restart tour"
                aria-label="Restart tour"
                className="p-1 text-[#8B8983] hover:text-[#191815]"
              >
                <RotateCcw size={12} />
              </button>
              <button
                onClick={tour.exitTour}
                title="Exit tour (Esc)"
                aria-label="Exit tour"
                className="p-1 text-[#8B8983] hover:text-[#641E25]"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          <h4 className="mt-2 font-display text-[20px] leading-[1.2] text-[#191815]">{tour.step.title}</h4>
          <p className="mt-1.5 font-sans-ui text-[12px] leading-[1.6] text-[#3A352E]">{tour.step.instruction}</p>

          {/* feedback banner */}
          {tour.feedback ? (
            <div className="mt-2.5 flex items-center gap-2 border-l-2 border-[#85865A] bg-[#EDE8DE]/60 px-2.5 py-1.5 font-mono-tech text-[9px] text-[#4E4F31]">
              <Check size={12} /> {tour.feedback}
            </div>
          ) : (
            <div className="mt-2.5 border-l-2 border-[#B69A63] bg-[#EDE8DE]/50 px-2.5 py-1.5 font-mono-tech text-[8.5px] tracking-[0.06em] text-[#5A554C]">
              {tour.step.expectedAction}
            </div>
          )}

          {/* "Why am I seeing this?" */}
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => setWhyOpen((v) => !v)}
              className="inline-flex items-center gap-1 font-mono-tech text-[8px] tracking-[0.14em] text-[#641E25] hover:underline"
            >
              <HelpCircle size={11} /> WHY AM I SEEING THIS?
            </button>
            {whyOpen && (
              <div className="mt-2 space-y-1.5 border border-[#D9D2C6] bg-[#FFFFFF] p-2.5">
                <div>
                  <span className="font-mono-tech text-[7.5px] tracking-[0.14em] text-[#7A6438]">SIMPLE: </span>
                  <span className="font-sans-ui text-[11px] text-[#3A352E]">{tour.step.whySimple}</span>
                </div>
                <div>
                  <span className="font-mono-tech text-[7.5px] tracking-[0.14em] text-[#641E25]">TECHNICAL: </span>
                  <span className="font-sans-ui text-[11px] text-[#3A352E]">{tour.step.whyTechnical}</span>
                </div>
              </div>
            )}
          </div>

          {/* controls */}
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#D9D2C6] pt-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={tour.prevStep}
                disabled={tour.stepIndex === 0}
                className="inline-flex items-center gap-1 border border-[#D9D2C6] px-2.5 py-1.5 font-mono-tech text-[8.5px] tracking-[0.12em] text-[#5A554C] hover:border-[#191815] hover:text-[#191815] disabled:opacity-35"
              >
                <ArrowLeft size={10} /> PREV
              </button>
              {!isLast && (
                <button
                  onClick={tour.nextStep}
                  className="inline-flex items-center gap-1 border border-[#D9D2C6] px-2.5 py-1.5 font-mono-tech text-[8.5px] tracking-[0.12em] text-[#5A554C] hover:border-[#191815] hover:text-[#191815]"
                >
                  SKIP <SkipForward size={10} />
                </button>
              )}
            </div>

            {isLast ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    tour.exitTour();
                    onExploreAnother();
                  }}
                  className="bg-[#641E25] px-3 py-1.5 font-mono-tech text-[8.5px] tracking-[0.12em] text-[#F8F6F0] hover:bg-[#8C2A33]"
                >
                  EXPLORE ANOTHER
                </button>
                <button
                  onClick={tour.exitTour}
                  className="border border-[#191815] px-2.5 py-1.5 font-mono-tech text-[8.5px] tracking-[0.12em] text-[#191815]"
                >
                  DONE
                </button>
              </div>
            ) : !isActionStep ? (
              <button
                onClick={tour.nextStep}
                className="inline-flex items-center gap-1 bg-[#191815] px-3.5 py-1.5 font-mono-tech text-[8.5px] tracking-[0.14em] text-[#F8F6F0] hover:bg-[#641E25]"
              >
                CONTINUE <ArrowRight size={10} />
              </button>
            ) : (
              <span className="font-mono-tech text-[8px] tracking-[0.12em] text-[#8B8983]">
                WAITING FOR ACTION…
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
