import React, { useEffect } from 'react';
import { Bell, Volume2, Square, X, Sparkles } from 'lucide-react';
import { ActiveRingingBell } from '../types';

interface BellRingingPopupProps {
  activeBell: ActiveRingingBell | null;
  onStop: () => void;
}

export const BellRingingPopup: React.FC<BellRingingPopupProps> = ({ activeBell, onStop }) => {
  if (!activeBell) return null;

  return (
    <div className="fixed top-24 right-5 z-50 max-w-md w-full animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900/95 via-teal-950/95 to-slate-900/95 border-2 border-emerald-400 p-5 shadow-2xl shadow-emerald-950/80 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          
          <div className="flex items-center gap-3.5">
            <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-emerald-400 opacity-40"></span>
              <Bell className="w-6 h-6 text-emerald-300 animate-bounce" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/60">
                  🔔 BEL BERBUNYI
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  {activeBell.mode}
                </span>
              </div>
              
              <h3 className="text-base font-extrabold text-white tracking-tight mt-1 truncate">
                {activeBell.namaJadwal}
              </h3>
              
              <p className="text-xs text-emerald-200 font-mono mt-0.5">
                Waktu: <strong>{activeBell.jam}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={onStop}
              title="Hentikan Bel"
              className="p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-600/80 text-rose-200 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-rose-300" />
              <span className="hidden sm:inline">Stop</span>
            </button>

            <button
              onClick={onStop}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Audio Wave Indicator */}
        <div className="mt-3 pt-3 border-t border-emerald-800/40 flex items-center justify-between text-[11px] text-emerald-200/90">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="inline-block w-1.5 h-4 bg-teal-300 rounded-full animate-pulse delay-75"></span>
            <span className="inline-block w-1.5 h-2.5 bg-emerald-400 rounded-full animate-pulse delay-150"></span>
            <span className="inline-block w-1.5 h-5 bg-teal-300 rounded-full animate-pulse delay-100"></span>
            <span className="ml-1 font-medium">Audio sedang diputar...</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-300">Tercatat di RiwayatBel</span>
        </div>
      </div>
    </div>
  );
};
