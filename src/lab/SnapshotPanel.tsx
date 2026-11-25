import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, HardDriveDownload, RotateCcw, ShieldCheck, Upload, TriangleAlert } from 'lucide-react';
import {
  RigSnapshot,
  buildSnapshot,
  clearSnapshot,
  diffSnapshot,
  downloadSnapshot,
  loadSnapshot,
  readSnapshotFile,
  saveSnapshot,
  snapshotFilename,
} from '../data/snapshots';
import { MODEL_ID } from '../data/snapshots';
import { MeasuredHardware, runLiveBenchmark } from '../data/benchmark';

/**
 * Snapshot panel: shows the frozen, rig-calibrated data set that drives every
 * experiment, and lets the user export / import / re-freeze it.
 *
 * On first visit the workspace freezes a snapshot automatically — so the numbers
 * a hosted site shows are the same bytes a visitor can download.
 */
export default function SnapshotPanel() {
  const [stored, setStored] = useState<RigSnapshot | null>(null);
  const [fresh, setFresh] = useState<RigSnapshot | null>(null);
  const [status, setStatus] = useState<{ tone: 'ok' | 'warn' | 'bad'; text: string } | null>(null);
  const [measured, setMeasured] = useState<MeasuredHardware | null>(() => {
    try {
      const raw = window.localStorage.getItem('silicon-wars:measured:v1');
      return raw ? (JSON.parse(raw) as MeasuredHardware) : null;
    } catch {
      return null;
    }
  });
  const [measuring, setMeasuring] = useState(false);

  const measurePc = useCallback(async () => {
    setMeasuring(true);
    try {
      const res = await runLiveBenchmark();
      setMeasured(res);
      window.localStorage.setItem('silicon-wars:measured:v1', JSON.stringify(res));
      setStatus({ tone: 'ok', text: `Measured your PC: ${res.logicalCores} threads, ${res.cpuScalarMops} MOPS, ${res.memoryBandwidthGbs} GB/s.` });
    } finally {
      setMeasuring(false);
    }
  }, []);
  const fileInput = useRef<HTMLInputElement | null>(null);

  // Freeze on mount if nothing is stored yet, then verify against the live model.
  useEffect(() => {
    const now = buildSnapshot();
    const existing = loadSnapshot();
    setFresh(now);
    if (existing) {
      setStored(existing);
      const drift = diffSnapshot(existing, now);
      setStatus(
        drift.length === 0
          ? { tone: 'ok', text: 'Snapshot verified — recomputed traces match the stored checksums.' }
          : { tone: 'warn', text: `${drift.length} trace(s) differ from the stored snapshot. Re-freeze to update.` },
      );
    } else {
      const saved = saveSnapshot(now);
      setStored(saved);
      setStatus({ tone: 'ok', text: 'First visit — snapshot frozen in this browser.' });
    }
  }, []);

  const refreeze = useCallback(() => {
    const now = buildSnapshot();
    setFresh(now);
    setStored(saveSnapshot(now));
    setStatus({ tone: 'ok', text: 'Re-frozen from the current model. Checksums updated.' });
  }, []);

  const wipe = useCallback(() => {
    clearSnapshot();
    setStored(null);
    setStatus({ tone: 'warn', text: 'Stored snapshot cleared. It will be regenerated on the next visit.' });
  }, []);

  const onFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    const result = await readSnapshotFile(file);
    if (!result.ok || !result.snapshot) {
      setStatus({ tone: 'bad', text: `Rejected: ${result.reason ?? 'unknown error'}.` });
      return;
    }
    const snap = result.snapshot;
    saveSnapshot(snap);
    setStored(snap);
    const drift = diffSnapshot(snap);
    setStatus({
      tone: drift.length === 0 ? 'ok' : 'warn',
      text:
        drift.length === 0
          ? `Imported ${snap.traces.length} traces — all checksums match this model.`
          : `Imported ${snap.traces.length} traces, but ${drift.length} diverge from this model build.`,
    });
  }, []);

  const active = stored ?? fresh;
  const usageKb = useMemo(() => {
    if (!active) return 0;
    try {
      return Math.round(new Blob([JSON.stringify(active)]).size / 102.4) / 10;
    } catch {
      return 0;
    }
  }, [active]);

  const tone = {
    ok: { bar: '#85865A', text: '#4E4F31' },
    warn: { bar: '#B69A63', text: '#7A6438' },
    bad: { bar: '#641E25', text: '#641E25' },
  };

  return (
    <div className="border border-[#D9D2C6] bg-[#FFFFFF]">
      <div className="flex items-center justify-between border-b border-[#D9D2C6] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 bg-[#641E25]" />
          <span className="font-mono-tech text-[9.5px] tracking-[0.2em] text-[#191815]">SIMULATED DATA · SNAPSHOT</span>
        </div>
        <span className="font-mono-tech text-[8.5px] tracking-[0.14em] text-[#8B8983]">STORED LOCALLY · NOT UPLOADED</span>
      </div>

      <div className="space-y-3.5 p-4">
        <p className="font-sans-ui text-[11.5px] leading-[1.65] text-[#5A554C]">
          Every trace on this site is frozen from the reference rig and stored in this browser. The
          file below is the whole data set — export it, host it alongside the build, and any visitor
          sees exactly the same numbers you do.
        </p>

        {/* headline counts */}
        <div className="grid grid-cols-2 gap-px bg-[#D9D2C6] sm:grid-cols-4">
          {[
            ['EXPERIMENTS', active ? String(active.totals.experiments) : '—'],
            ['VARIANTS', active ? String(active.totals.variants) : '—'],
            ['STEPS', active ? String(active.totals.steps) : '—'],
            ['SIZE', active ? `${usageKb} KB` : '—'],
          ].map(([l, v]) => (
            <div key={l} className="bg-[#FFFFFF] px-3 py-2.5">
              <div className="font-mono-tech text-[7.5px] tracking-[0.16em] text-[#8B8983]">{l}</div>
              <div className="mt-1 font-mono-tech text-[13px] tabular-nums text-[#191815]">{v}</div>
            </div>
          ))}
        </div>

        {/* identity */}
        <div className="border border-[#EDE8DE] bg-[#F8F6F0] p-3">
          <div className="flex items-start gap-2">
            <ShieldCheck size={12} className="mt-[2px] shrink-0 text-[#641E25]" />
            <div className="min-w-0">
              <div className="font-mono-tech text-[8.5px] tracking-[0.14em] text-[#191815]">{MODEL_ID}</div>
              <div className="mt-1 font-mono-tech text-[8px] leading-[1.7] tracking-[0.06em] text-[#8B8983]">
                {active?.rig.cpu} · {active?.rig.gpu}
                <br />
                FROZEN {active ? active.generatedAt.replace('T', ' ').slice(0, 19) : '—'} UTC · {active?.traces.length ?? 0} CHECKSUMS
              </div>
            </div>
          </div>
        </div>

        {/* status */}
        {status && (
          <div className="flex items-start gap-2" style={{ borderLeft: `2px solid ${tone[status.tone].bar}`, paddingLeft: 10 }}>
            {status.tone === 'ok' ? (
              <Check size={12} className="mt-[3px] shrink-0" style={{ color: tone[status.tone].bar }} />
            ) : (
              <TriangleAlert size={12} className="mt-[3px] shrink-0" style={{ color: tone[status.tone].bar }} />
            )}
            <p className="font-mono-tech text-[9px] leading-[1.7] tracking-[0.04em]" style={{ color: tone[status.tone].text }}>
              {status.text}
            </p>
          </div>
        )}

        {/* actions */}
        <div className="flex flex-wrap gap-2 pt-0.5">
          <button
            onClick={() => active && downloadSnapshot(active)}
            disabled={!active}
            className="flex items-center gap-1.5 bg-[#191815] px-3 py-2 font-mono-tech text-[8.5px] tracking-[0.14em] text-[#F8F6F0] transition-colors hover:bg-[#641E25] disabled:opacity-40"
          >
            <Download size={11} /> EXPORT JSON
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className="flex items-center gap-1.5 border border-[#D9D2C6] px-3 py-2 font-mono-tech text-[8.5px] tracking-[0.14em] text-[#191815] transition-colors hover:border-[#641E25] hover:text-[#641E25]"
          >
            <Upload size={11} /> IMPORT
          </button>
          <button
            onClick={refreeze}
            className="flex items-center gap-1.5 border border-[#D9D2C6] px-3 py-2 font-mono-tech text-[8.5px] tracking-[0.14em] text-[#191815] transition-colors hover:border-[#641E25] hover:text-[#641E25]"
          >
            <RotateCcw size={11} /> RE-FREEZE
          </button>
          <button
            onClick={() => void measurePc()}
            disabled={measuring}
            className="flex items-center gap-1.5 bg-[#641E25] px-3 py-2 font-mono-tech text-[8.5px] tracking-[0.14em] text-[#F8F6F0] transition-colors hover:bg-[#8C2A33] disabled:opacity-50"
          >
            {measuring ? 'MEASURING…' : 'MEASURE MY PC'}
          </button>
          <button
            onClick={wipe}
            className="flex items-center gap-1.5 border border-[#D9D2C6] px-3 py-2 font-mono-tech text-[8.5px] tracking-[0.14em] text-[#8B8983] transition-colors hover:border-[#641E25] hover:text-[#641E25]"
          >
            <HardDriveDownload size={11} /> CLEAR
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.currentTarget.value = '';
            }}
          />
        </div>

        {measured && (
          <div className="border border-[#D9D2C6] bg-[#F8F6F0] p-3 space-y-1.5">
            <div className="font-mono-tech text-[8px] tracking-[0.16em] text-[#641E25]">
              LIVE BROWSER MEASUREMENT · YOUR PC
            </div>
            <div className="font-mono-tech text-[8.5px] text-[#191815]">
              THREADS: {measured.logicalCores} · CPU: {measured.cpuScalarMops} MOPS · MEM COPY: {measured.memoryBandwidthGbs} GB/s · GPU DRAW: {measured.gpuDrawMs} ms
            </div>
            <div className="font-mono-tech text-[7.5px] text-[#8B8983] truncate">
              GPU: {measured.gpuRenderer}
            </div>
          </div>
        )}

        <p className="font-mono-tech text-[7.5px] leading-[1.8] tracking-[0.08em] text-[#B0AAA0]">
          FILE: {active ? snapshotFilename(active) : '—'} · KEYS: localStorage["silicon-wars:snapshot:v1"] · NO NETWORK CALLS
        </p>
      </div>
    </div>
  );
}
