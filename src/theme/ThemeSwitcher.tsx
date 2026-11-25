import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeContext';

export default function ThemeSwitcher({ darkHeader = false }: { darkHeader?: boolean }) {
  const theme = useTheme();
  if (!theme) return null;

  const isDark = theme.resolved === 'dark';

  return (
    <button
      type="button"
      onClick={() => theme.setMode(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex h-8 w-8 items-center justify-center border transition-colors duration-200 ${
        darkHeader
          ? 'border-[#3A312B] text-[#D9D2C6] hover:border-[#BDA477] hover:text-[#BDA477]'
          : 'border-[#D9D2C6] text-[#3A352E] hover:border-[#641E25] hover:text-[#641E25] dark:border-[#494238] dark:text-[#F2EDE3] dark:hover:border-[#BDA477] dark:hover:text-[#BDA477]'
      }`}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
