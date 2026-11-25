import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'silicon-wars:theme:v1';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = window.localStorage.getItem(THEME_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch {
      /* ignore */
    }
    return 'light';
  });

  const [system, setSystem] = useState<'light' | 'dark'>(getSystemTheme);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystem(mq.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const resolved: 'light' | 'dark' = mode === 'system' ? system : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    if (resolved === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [resolved]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    try {
      window.localStorage.setItem(THEME_KEY, m);
    } catch {
      /* ignore */
    }
  };

  return <ThemeContext.Provider value={{ mode, resolved, setMode }}>{children}</ThemeContext.Provider>;
}
