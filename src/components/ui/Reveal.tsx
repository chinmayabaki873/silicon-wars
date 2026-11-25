import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  once = true,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '-12% 0px -12% 0px' });
  const reduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce ? undefined : { opacity: 0, y }}
      animate={inView && !reduce ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.85, delay, ease: [0.16, 0.84, 0.24, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Rule({ label, className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="font-mono-tech text-[10px] tracking-[0.22em] text-[#8B8983] whitespace-nowrap">{label}</span>
      <span className="h-px flex-1 bg-[#D9D2C6]" />
    </div>
  );
}

export function Kicker({ children, tone = 'dark' }: { children: React.ReactNode; tone?: 'dark' | 'light' }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`h-1.5 w-1.5 ${tone === 'dark' ? 'bg-[#B65335]' : 'bg-[#B69A63]'}`} />
      <span
        className={`font-mono-tech text-[10.5px] tracking-[0.24em] ${
          tone === 'dark' ? 'text-[#641E25]' : 'text-[#B69A63]'
        }`}
      >
        {children}
      </span>
    </div>
  );
}
