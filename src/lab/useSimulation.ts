import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExperimentId, SimulationStep } from '../types/simulation';
import { buildSteps } from '../sim';

export type PlayState = 'idle' | 'playing' | 'paused' | 'finished';

export function useSimulation(experimentId: ExperimentId, param: string) {
  const steps = useMemo<SimulationStep[]>(() => buildSteps(experimentId, param), [experimentId, param]);
  const [index, setIndex] = useState(0);
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [speed, setSpeed] = useState(1);
  const timer = useRef<number | null>(null);

  const total = steps.length;
  const step = steps[Math.min(index, total - 1)] ?? null;

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  // reset when the workload configuration changes
  useEffect(() => {
    clear();
    setIndex(0);
    setPlayState('idle');
  }, [experimentId, param, clear]);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= total - 1) {
        setPlayState('finished');
        return i;
      }
      return i + 1;
    });
  }, [total]);

  const prev = useCallback(() => {
    setPlayState((s) => (s === 'playing' ? 'paused' : s));
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const reset = useCallback(() => {
    clear();
    setIndex(0);
    setPlayState('idle');
  }, [clear]);

  const play = useCallback(() => {
    setPlayState((s) => (s === 'finished' || s === 'idle' ? 'playing' : 'playing'));
    setIndex((i) => (i >= total - 1 ? 0 : i));
  }, [total]);

  const pause = useCallback(() => {
    clear();
    setPlayState('paused');
  }, [clear]);

  const jumpTo = useCallback(
    (i: number) => {
      clear();
      setPlayState('paused');
      setIndex(Math.max(0, Math.min(total - 1, i)));
    },
    [clear, total],
  );

  const toggle = useCallback(() => {
    if (playState === 'playing') pause();
    else play();
  }, [playState, pause, play]);

  // the clock
  useEffect(() => {
    if (playState !== 'playing') return;
    const delay = 1250 / speed;
    timer.current = window.setTimeout(() => {
      setIndex((i) => {
        if (i >= total - 1) {
          setPlayState('finished');
          return i;
        }
        return i + 1;
      });
    }, delay);
    return clear;
  }, [playState, index, speed, total, clear]);

  return {
    steps,
    step,
    index,
    total,
    playState,
    speed,
    setSpeed,
    play,
    pause,
    toggle,
    next,
    prev,
    reset,
    jumpTo,
    canPrev: index > 0,
    canNext: index < total - 1,
  };
}
