import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { TOUR_STEPS, TourStep } from './steps';

const SEEN_KEY = 'silicon-wars:tour-seen:v1';

interface TourContextValue {
  active: boolean;
  paused: boolean;
  promptOpen: boolean;
  stepIndex: number;
  step: TourStep;
  totalSteps: number;
  feedback: string | null;
  startTour: (fromLab?: boolean) => void;
  dismissPrompt: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  exitTour: () => void;
  restartTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  notifyAction: (event: string) => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  return useContext(TourContext);
}

export function TourProvider({
  children,
  onExploreAnother,
}: {
  children: React.ReactNode;
  onExploreAnother?: () => void;
}) {
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Show first-visit prompt once
  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(SEEN_KEY);
      if (!seen) {
        const t = window.setTimeout(() => setPromptOpen(true), 900);
        return () => window.clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const markSeen = useCallback(() => {
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  const startTour = useCallback(
    (fromLab = false) => {
      markSeen();
      setPromptOpen(false);
      setPaused(false);
      setFeedback(null);
      const inLab = fromLab || window.location.hash.startsWith('#/lab');
      setStepIndex(inLab ? 3 : 0);
      setActive(true);
    },
    [markSeen],
  );

  const dismissPrompt = useCallback(() => {
    markSeen();
    setPromptOpen(false);
  }, [markSeen]);

  const exitTour = useCallback(() => {
    markSeen();
    setActive(false);
    setPaused(false);
    setFeedback(null);
  }, [markSeen]);

  const restartTour = useCallback(() => {
    setPaused(false);
    setFeedback(null);
    const inLab = window.location.hash.startsWith('#/lab');
    setStepIndex(inLab ? 3 : 0);
    setActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setFeedback(null);
    setStepIndex((i) => {
      if (i + 1 >= TOUR_STEPS.length) {
        setActive(false);
        return 0;
      }
      return i + 1;
    });
  }, []);

  const prevStep = useCallback(() => {
    setFeedback(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const notifyAction = useCallback(
    (event: string) => {
      if (!active || paused) return;
      const current = TOUR_STEPS[stepIndex];
      if (!current || current.actionEvent !== event) return;
      if (current.successMessage) {
        setFeedback(current.successMessage);
      }
      window.setTimeout(() => {
        setFeedback(null);
        setStepIndex((i) => (i + 1 < TOUR_STEPS.length ? i + 1 : i));
      }, 650);
    },
    [active, paused, stepIndex],
  );

  // Keyboard navigation: Esc exits, ArrowRight skips, ArrowLeft goes back
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitTour();
      else if (e.key === 'ArrowRight') nextStep();
      else if (e.key === 'ArrowLeft') prevStep();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, exitTour, nextStep, prevStep]);

  const value: TourContextValue = {
    active,
    paused,
    promptOpen,
    stepIndex,
    step: TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0],
    totalSteps: TOUR_STEPS.length,
    feedback,
    startTour,
    dismissPrompt,
    pauseTour: () => setPaused(true),
    resumeTour: () => setPaused(false),
    exitTour,
    restartTour,
    nextStep,
    prevStep,
    notifyAction,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      {/* Expose explore another callback via window event if needed */}
      {onExploreAnother && null}
    </TourContext.Provider>
  );
}
