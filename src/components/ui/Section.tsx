import React from 'react';

export function SectionHeading({
  index,
  kicker,
  title,
  lead,
  tone = 'dark',
  align = 'left',
  className = '',
}: {
  index: string;
  kicker: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  tone?: 'dark' | 'light';
  align?: 'left' | 'split';
  className?: string;
}) {
  const ink = tone === 'dark' ? 'text-[#191815]' : 'text-[#F8F6F0]';
  const muted = tone === 'dark' ? 'text-[#3A352E]' : 'text-[#D9D2C6]/75';
  const line = tone === 'dark' ? 'border-[#D9D2C6]' : 'border-[#3A312B]';
  const accent = tone === 'dark' ? 'text-[#641E25]' : 'text-[#B69A63]';

  return (
    <div className={`border-t ${line} pt-5 ${className}`}>
      <div className="flex items-baseline gap-4">
        <span className={`font-mono-tech text-[10px] tracking-[0.24em] ${tone === 'dark' ? 'text-[#8B8983]' : 'text-[#8B8983]'}`}>
          {index}
        </span>
        <span className={`font-mono-tech text-[10px] tracking-[0.24em] ${accent}`}>{kicker}</span>
      </div>
      <div
        className={
          align === 'split'
            ? 'mt-6 grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-5 items-end'
            : 'mt-6'
        }
      >
        <h2
          className={`${align === 'split' ? 'lg:col-span-7' : ''} font-display ${ink} leading-[1.02] tracking-[-0.02em] text-[clamp(32px,4.6vw,58px)]`}
        >
          {title}
        </h2>
        {lead && (
          <p className={`${align === 'split' ? 'lg:col-span-5' : 'mt-5 max-w-[62ch]'} font-sans-ui text-[14px] leading-[1.75] ${muted}`}>
            {lead}
          </p>
        )}
      </div>
    </div>
  );
}

export function Pill({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'burgundy' | 'olive' | 'brass' | 'outline';
  className?: string;
}) {
  const styles: Record<string, string> = {
    neutral: 'bg-[#EDE8DE] text-[#3A352E] border-[#D9D2C6]',
    burgundy: 'bg-[#641E25]/8 text-[#641E25] border-[#641E25]/25',
    olive: 'bg-[#85865A]/12 text-[#5C5D3E] border-[#85865A]/30',
    brass: 'bg-[#B69A63]/15 text-[#7A6438] border-[#B69A63]/35',
    outline: 'bg-transparent text-[#8B8983] border-[#D9D2C6]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-[3px] font-mono-tech text-[9.5px] tracking-[0.14em] ${styles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono-tech text-[9px] tracking-[0.2em] text-[#8B8983]">{label}</span>
      <span className="font-display text-[22px] leading-none text-[#191815]">
        {value}
        {unit && <span className="ml-1 font-mono-tech text-[10px] text-[#8B8983]">{unit}</span>}
      </span>
    </div>
  );
}
