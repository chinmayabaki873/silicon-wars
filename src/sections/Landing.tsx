import React, { useEffect, useState } from 'react';
import Hero from './Hero';
import Metaphor from './Metaphor';
import Library from './Library';
import Architecture from './Architecture';
import Rig from './Rig';
import Learn from './Learn';
import About from './About';
import { Header, Footer } from '../components/ui/Chrome';
import { ExperimentId } from '../types/simulation';

const SECTION_IDS = ['explore', 'experiments', 'rig', 'architecture', 'learn', 'about'];

export default function Landing({ onLaunch }: { onLaunch: (id?: ExperimentId) => void }) {
  const [active, setActive] = useState('');

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.01, 0.2, 0.5] },
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="bg-[#F8F6F0]">
      <Header onLaunch={() => onLaunch()} active={active} />
      <main>
        <Hero onLaunch={() => onLaunch()} onExplore={() => document.getElementById('experiments')?.scrollIntoView({ behavior: 'smooth' })} />
        <Metaphor onLaunchExperiment={() => document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })} />
        <Library onOpen={(id) => onLaunch(id)} />
        <Rig onLaunch={() => onLaunch()} />
        <Architecture />
        <Learn onLaunch={() => onLaunch()} />
        <About onLaunch={() => onLaunch()} />
      </main>
      <Footer onLaunch={() => onLaunch()} />
    </div>
  );
}
