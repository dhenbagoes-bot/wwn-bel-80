import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme } from '../types';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  isLight: boolean;
  isDark: boolean;
  isEmerald: boolean;
  themeClasses: {
    appBg: string;
    cardBg: string;
    cardSubtleBg: string;
    headerBg: string;
    sidebarBg: string;
    border: string;
    borderSubtle: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    inputBg: string;
    badgeBg: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Simpan di in-memory state tanpa menggunakan localStorage/sessionStorage
  const [theme, setThemeState] = useState<AppTheme>('dark');

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('emerald');
    else setTheme('dark');
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('theme-light', 'theme-dark', 'theme-emerald');
      root.classList.add(`theme-${theme}`);
      if (theme === 'light') {
        root.style.colorScheme = 'light';
      } else {
        root.style.colorScheme = 'dark';
      }
    }
  }, [theme]);

  const isLight = theme === 'light';
  const isDark = theme === 'dark';
  const isEmerald = theme === 'emerald';

  const themeClasses = {
    appBg: isLight
      ? 'bg-slate-100 text-slate-800'
      : isEmerald
      ? 'bg-[#061B14] text-emerald-50'
      : 'bg-slate-950 text-slate-100',
    cardBg: isLight
      ? 'bg-white border-slate-200/90 shadow-sm text-slate-800'
      : isEmerald
      ? 'bg-[#0B2C22] border-emerald-700/60 shadow-lg text-emerald-50'
      : 'bg-slate-900 border-slate-800 shadow-xl text-slate-100',
    cardSubtleBg: isLight
      ? 'bg-slate-50 border-slate-200'
      : isEmerald
      ? 'bg-[#08221B] border-emerald-800/80'
      : 'bg-slate-950/80 border-slate-800',
    headerBg: isLight
      ? 'bg-white/95 border-slate-200/90 text-slate-900'
      : isEmerald
      ? 'bg-[#08241C]/95 border-emerald-800/80 text-emerald-50'
      : 'bg-slate-900/95 border-slate-800/80 text-white',
    sidebarBg: isLight
      ? 'bg-white border-slate-200 text-slate-800'
      : isEmerald
      ? 'bg-[#072018] border-emerald-800/90 text-emerald-50'
      : 'bg-slate-900 border-slate-800 text-slate-100',
    border: isLight
      ? 'border-slate-200'
      : isEmerald
      ? 'border-emerald-700/60'
      : 'border-slate-800',
    borderSubtle: isLight
      ? 'border-slate-100'
      : isEmerald
      ? 'border-emerald-800/50'
      : 'border-slate-800/60',
    textPrimary: isLight
      ? 'text-slate-900 font-bold'
      : isEmerald
      ? 'text-emerald-100 font-bold'
      : 'text-white font-bold',
    textSecondary: isLight
      ? 'text-slate-600'
      : isEmerald
      ? 'text-emerald-200/90'
      : 'text-slate-300',
    textMuted: isLight
      ? 'text-slate-500'
      : isEmerald
      ? 'text-emerald-400/80'
      : 'text-slate-400',
    inputBg: isLight
      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
      : isEmerald
      ? 'bg-[#061913] border-emerald-700/80 text-white placeholder-emerald-400/50'
      : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500',
    badgeBg: isLight
      ? 'bg-slate-100 text-slate-700 border-slate-300'
      : isEmerald
      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
      : 'bg-slate-800 text-slate-300 border-slate-700'
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isLight,
        isDark,
        isEmerald,
        themeClasses
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
