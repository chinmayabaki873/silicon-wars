import React from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, RotateCcw, SkipBack, SkipForward, Gauge } from 'lucide-react';
import { PlayState } from './useSimulation';

const SPEEDS = [0.5, 1, 2, 4];

function IconButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center border border-[#3A312B] text-[#D9D2C6] transition-colors hover:border-[#B69A63] hover:text-[#B69A63] disabled:opacity-30 disabled:hover:border-[#3A312B] disabled:hover:text-[#D9D2C6]"
    >
      {children}
    </button>
  );
}

export default function Transport({
  index,
  total,
  playState,
  speed,
  onSpeedChange,
  onPlay,
  onPause,
  onPrev,
  onNext,
  onReset,
  canNext,
  canPrev,
}: {
  index: number;
  total: number;
  playState: PlayState;
  speed: number;
  onSpeedChange: (s: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  canNext: boolean;
  canPrev: boolean;
}) {
  const playing = playState === 'playing';
  const pct = total > 1 ? (index / (total - 1)) * 100 : 0;

  return (
    <div className="border border-[#332B25] bg-[#211C18]">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <button
          data-tour="play-button"
          title="Play or pause the cycle-by-cycle simulation (Space)"
          onClick={playing ? onPause : onPlay}
          className="group flex h-9 items-center gap-2 bg-[#641E25] px-4 text-[11.5px] tracking-wide text-[#F8F6F0] transition-colors hover:bg-[#B65335]"
        >
          {playing ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
          {playing ? 'Pause' : playState === 'finished' ? 'Replay' : 'Play'}
        </button>

        <div className="flex items-center gap-1">
          <IconButton onClick={onPrev} disabled={!canPrev} label="Previous step">
            <SkipBack size={14} />
          </IconButton>
          <IconButton onClick={onNext} disabled={!canNext} label="Next step">
            <SkipForward size={14} />
          </IconButton>
          <IconButton onClick={onReset} label="Reset">
            <RotateCcw size={13} />
          </IconButton>
        </div>

        <div className="ml-1 flex items-center gap-1 border border-[#3A312B] p-0.5">
          <Gauge size={11} className="ml-1 mr-0.5 text-[#6E6A63]" />
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-1.5 py-0.5 font-mono-tech text-[8.5px] tracking-[0.1em] transition-colors ${
                speed === s ? 'bg-[#B69A63] text-[#191815]' : 'text-[#8B8983] hover:text-[#EDE8DE]'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono-tech text-[9px] tracking-[0.16em] text-[#8B8983]">
            STEP {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <div className="w-24 h-[3px] bg-[#332B25] relative overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-[#B65335]"
              animate={{ width: `${Number.isFinite(pct) ? pct : 0}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* scrubbable timeline */}
      <div className="flex gap-[2px] border-t border-[#2C2420] px-3 py-2">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            aria-label={`Jump to step ${i + 1}`}
            onClick={() => {
              const ev = new CustomEvent('sim-jump', { detail: i });
              window.dispatchEvent(ev);
            }}
            className={`h-[5px] flex-1 transition-colors ${
              i < index ? 'bg-[#5A4E43]' : i === index ? 'bg-[#B65335]' : 'bg-[#2C2420] hover:bg-[#3F372F]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
