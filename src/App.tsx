import React, { Suspense, lazy, useEffect, useState } from 'react';
import Landing from './sections/Landing';
import { TourProvider } from './tour/TourContext';
import { ThemeProvider } from './theme/ThemeContext';
import TourOverlay from './tour/TourOverlay';
import { ExperimentId } from './types/simulation';

/** The simulator is a heavy chunk — keep it out of the landing page's first paint. */
const Workspace = lazy(() => import('./lab/Workspace'));

const idle = (fn: () => void) => {
  const ric = (window as any).requestIdleCallback;
  if (typeof ric === 'function') ric(fn, { timeout: 2500 });
  else window.setTimeout(fn, 1200);
};

function BootScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#191815]">
      <div className="flex items-center gap-2.5">
        <span className="h-1.5 w-1.5 animate-pulse bg-[#B65335]" />
        <span className="font-mono-tech text-[10px] tracking-[0.24em] text-[#EDE8DE]">PREPARING EXECUTION TRACE</span>
      </div>
      <div className="h-px w-40 overflow-hidden bg-[#332B25]">
        <div className="h-full w-1/3 animate-[slide_1.1s_ease-in-out_infinite] bg-[#B69A63]" />
      </div>
    </div>
  );
}

type View = 'site' | 'lab';

/** Keep the deep-link in the URL hash so the lab is shareable and reload-safe. */
function readHash(): { view: View; id: ExperimentId | null } {
  const h = window.location.hash.replace(/^#\/?/, '');
  if (h.startsWith('lab')) {
    const id = h.split('/')[1];
    return { view: 'lab', id: (id as ExperimentId) || null };
  }
  return { view: 'site', id: null };
}

/** The landing page uses plain #section anchors; the lab uses #/lab/<id>. Don't stomp on those. */
const isSectionHash = (h: string) => h.startsWith('#') && !h.startsWith('#/');

export default function App() {
  const boot = readHash();
  const [view, setView] = useState<View>(boot.view);
  const [experiment, setExperiment] = useState<ExperimentId>(boot.id ?? 'vector-addition');

  const launch = (id?: ExperimentId) => {
    if (id) setExperiment(id);
    setView('lab');
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const next = view === 'lab' ? `#/lab/${experiment}` : '#/';
    if (window.location.hash !== next) window.history.replaceState(null, '', next);
  }, [view, experiment]);

  // Back / forward should move between the site and the lab, not exit the site.
  useEffect(() => {
    const onPop = () => {
      if (isSectionHash(window.location.hash)) return;
      const h = readHash();
      setView(h.view);
      if (h.id) setExperiment(h.id);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onPop);
    return () => window.removeEventListener('hashchange', onPop);
  }, []);

  return (
    <ThemeProvider>
    <TourProvider>
      <div className="min-h-screen bg-[#F8F6F0] text-[#191815]">
        {view === 'site' ? (
          <Landing onLaunch={launch} />
        ) : (
          <Suspense fallback={<BootScreen />}>
            <Workspace experimentId={experiment} onExit={() => setView('site')} onSwitch={setExperiment} />
          </Suspense>
        )}
        <TourOverlay onExploreAnother={() => { setView('site'); window.location.hash = '#experiments'; }} />
      </div>
    </TourProvider>
    </ThemeProvider>
  );
}
