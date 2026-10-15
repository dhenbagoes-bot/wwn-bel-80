import React from 'react';
import { Bell, Clock, ArrowRight, Sparkles, CheckCircle2, AlertCircle, Hourglass, Calendar, Activity, PlayCircle } from 'lucide-react';
import { JadwalBelItem } from '../types';
import { ScheduleCalculationResult } from '../utils/scheduleCalculator';
import { TIPE_BEL_OPTIONS } from '../constants/defaultData';

interface CurrentNextScheduleCardProps {
  calcResult: ScheduleCalculationResult;
  onNavigateToSchedule: () => void;
}

export const CurrentNextScheduleCard: React.FC<CurrentNextScheduleCardProps> = ({
  calcResult,
  onNavigateToSchedule
}) => {
  const { currentActivity, nextActivity, currentDayName, activeTodaySchedules } = calcResult;

  const getTipeBadge = (tipe?: string) => {
    const found = TIPE_BEL_OPTIONS.find(t => t.value === tipe);
    return found ? found.badgeColor : 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* 1. KARTU JADWAL SAAT INI (5 Cols) */}
      <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-800/60 to-slate-900/90 border border-slate-700/70 p-6 shadow-xl shadow-slate-950/30 flex flex-col justify-between relative overflow-hidden">
        
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Jadwal Saat Ini
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              Hari {currentDayName}
            </span>
          </div>

          {/* Content */}
          <div className="py-5">
            {currentActivity.item ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTipeBadge(currentActivity.item.tipe)}`}>
                    {currentActivity.item.tipe}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Sedang Berlangsung
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                  {currentActivity.item.keterangan}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-300 pt-1 font-mono">
                  <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Mulai: <strong className="text-white text-sm">{currentActivity.startTime}</strong></span>
                  </div>
                  {currentActivity.endTime && currentActivity.endTime !== 'Selesai' && (
                    <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                      <span>Sampai: <strong className="text-slate-200 text-sm">{currentActivity.endTime}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center sm:text-left space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Status KBM</span>
                </div>
                <h3 className="text-lg font-bold text-slate-200">
                  Tidak ada kegiatan saat ini.
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeTodaySchedules.length > 0
                    ? `Menunggu jadwal bel pertama (${activeTodaySchedules[0].jam} - ${activeTodaySchedules[0].keterangan}).`
                    : 'Belum ada jadwal bel aktif untuk hari ini.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
          <span>{activeTodaySchedules.length} Jadwal Aktif Hari Ini</span>
          <button
            onClick={onNavigateToSchedule}
            className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 2. KARTU JADWAL BERIKUTNYA & COUNTDOWN (7 Cols) */}
      <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 p-6 sm:p-7 shadow-xl shadow-emerald-950/20 flex flex-col justify-between relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Jadwal Berikutnya
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/40 text-emerald-300 text-xs font-medium">
              <Hourglass className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>Hitung Mundur Bel</span>
            </div>
          </div>

          {/* Body */}
          <div className="py-4 space-y-4">
            {nextActivity.item ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                {/* Info Jadwal */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTipeBadge(nextActivity.item.tipe)}`}>
                      {nextActivity.item.tipe}
                    </span>
                    {nextActivity.isTomorrow && (
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                        Besok
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                    {nextActivity.item.keterangan}
                  </h4>

                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Waktu Bel: <strong className="text-white text-base font-mono">{nextActivity.targetTime}</strong></span>
                  </div>
                </div>

                {/* Big Countdown Timer Display */}
                <div className="w-full sm:w-auto flex flex-col items-center sm:items-end justify-center bg-slate-950/90 border border-emerald-500/50 rounded-2xl px-6 py-3.5 shadow-inner">
                  <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest mb-0.5">
                    Sisa Waktu
                  </span>
                  <div className="font-mono-clock text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wider bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                    {nextActivity.countdownFormatted}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    JAM : MENIT : DETIK
                  </span>
                </div>

              </div>
            ) : (
              <div className="py-4 text-center sm:text-left space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>KBM Selesai</span>
                </div>
                <h3 className="text-lg font-bold text-slate-200">
                  Tidak ada jadwal berikutnya hari ini.
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Semua jadwal kegiatan bel untuk hari ini telah selesai atau belum ada jadwal aktif yang diatur.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>{nextActivity.statusText}</span>
          <button
            onClick={onNavigateToSchedule}
            className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Kelola Jadwal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
