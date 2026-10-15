import React from 'react';
import { Sun, Moon, Sparkles, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../types';

interface ThemeSwitcherProps {
  variant?: 'buttons' | 'dropdown' | 'compact';
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ variant = 'buttons' }) => {
  const { theme, setTheme, isLight, isDark, isEmerald } = useTheme();

  const themes: { id: AppTheme; label: string; icon: React.ReactNode; desc: string; badgeColor: string }[] = [
    {
      id: 'light',
      label: 'Light Mode',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      desc: 'Tampilan terang, bersih & kontras jelas',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    {
      id: 'dark',
      label: 'Dark Mode',
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
      desc: 'Tampilan gelap nyaman & hemat daya',
      badgeColor: 'bg-slate-800 text-indigo-300 border-indigo-700/50'
    },
    {
      id: 'emerald',
      label: 'Madrasah / Emerald',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      desc: 'Tema hijau-putih khas madrasah & sekolah',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-600'
    }
  ];

  if (variant === 'compact') {
    return (
      <div className="flex items-center p-1 rounded-xl bg-slate-950/60 dark:bg-slate-950/80 border border-slate-700/60 gap-1 text-xs">
        <button
          onClick={() => setTheme('light')}
          title="Light Mode (Terang)"
          className={`p-1.5 rounded-lg transition-all ${
            isLight
              ? 'bg-amber-500 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setTheme('dark')}
          title="Dark Mode (Gelap)"
          className={`p-1.5 rounded-lg transition-all ${
            isDark
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setTheme('emerald')}
          title="Tema Madrasah / Emerald"
          className={`p-1.5 rounded-lg transition-all ${
            isEmerald
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {themes.map((t) => {
        const isSelected = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
              isSelected
                ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10 shadow-md'
                : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {t.icon}
                <span className="text-xs font-bold text-slate-100">{t.label}</span>
              </div>
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">{t.desc}</p>
          </button>
        );
      })}
    </div>
  );
};
