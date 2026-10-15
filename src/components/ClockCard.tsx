import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Globe, Sparkles, Sun, Moon, AlertTriangle, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { TIMEZONE_OPTIONS } from '../constants/defaultData';
import { DaySchoolStatus } from '../utils/scheduleCalculator';
import { DatabaseStatus } from '../types';
import { getSafeTimeZone } from '../utils/timezoneHelper';
import { useTheme } from '../context/ThemeContext';

interface ClockCardProps {
  zonaWaktu: 'Asia/Jakarta' | 'Asia/Makassar' | 'Asia/Jayapura' | string;
  tahunPelajaran: string;
  daySchoolStatus?: DaySchoolStatus;
  statusBadgeText?: string;
  holidayReason?: string;
  dbStatus?: DatabaseStatus;
  isSyncing?: boolean;
  onRefresh?: () => void;
}

export const ClockCard: React.FC<ClockCardProps> = ({
  zonaWaktu,
  tahunPelajaran,
  daySchoolStatus = 'HARI_SEKOLAH',
  statusBadgeText,
  holidayReason,
  dbStatus,
  isSyncing = false,
  onRefresh
}) => {
  const { themeClasses, isLight } = useTheme();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const safeTz = getSafeTimeZone(zonaWaktu);
  const tzOption = TIMEZONE_OPTIONS.find(t => t.value === safeTz) || TIMEZONE_OPTIONS[0];

  let hourFormatted = '00';
  let minuteFormatted = '00';
  let secondFormatted = '00';
  let dayName = 'Senin';
  let fullDate = '';

  try {
    hourFormatted = new Intl.DateTimeFormat('id-ID', {
      timeZone: safeTz,
      hour: '2-digit',
      hour12: false
    }).format(time);

    minuteFormatted = new Intl.DateTimeFormat('id-ID', {
      timeZone: safeTz,
      minute: '2-digit',
      hour12: false
    }).format(time);

    secondFormatted = new Intl.DateTimeFormat('id-ID', {
      timeZone: safeTz,
      second: '2-digit',
      hour12: false
    }).format(time);

    dayName = new Intl.DateTimeFormat('id-ID', {
      timeZone: safeTz,
      weekday: 'long'
    }).format(time);

    fullDate = new Intl.DateTimeFormat('id-ID', {
      timeZone: safeTz,
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(time);
  } catch (e) {
    hourFormatted = String(time.getHours()).padStart(2, '0');
    minuteFormatted = String(time.getMinutes()).padStart(2, '0');
    secondFormatted = String(time.getSeconds()).padStart(2, '0');
    fullDate = time.toLocaleDateString('id-ID');
  }

  const currentHourNum = parseInt(hourFormatted, 10);
  const isDaytime = currentHourNum >= 6 && currentHourNum < 18;

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 shadow-xl transition-all ${themeClasses.cardBg}`}>
      
      {/* Glow */}
      <div className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
        daySchoolStatus === 'HARI_LIBUR' ? 'bg-rose-500/15' : 'bg-emerald-500/10'
      }`} />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Date, Timezone & Day Status */}
        <div className="w-full md:w-auto text-center md:text-left space-y-2.5">
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            
            {/* Status Hari Badge */}
            {daySchoolStatus === 'HARI_LIBUR' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                🔴 HARI LIBUR
              </span>
            ) : daySchoolStatus === 'HARI_NONAKTIF' ? (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${themeClasses.badgeBg}`}>
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                ⚪ HARI NONAKTIF
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                🟢 HARI SEKOLAH
              </span>
            )}

            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${themeClasses.cardSubtleBg} ${themeClasses.border}`}>
              {isDaytime ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
              <span>{isDaytime ? 'Siang' : 'Malam'}</span>
              <span className="text-slate-400">•</span>
              <span>TA {tahunPelajaran || '2026/2027'}</span>
            </div>

            {/* Cloud Auto-Sync Live Status Indicator */}
            {isSyncing ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 text-xs font-bold animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>🔄 MENYINKRONKAN...</span>
              </span>
            ) : dbStatus?.connected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>🟢 CLOUD TERSINKRON</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>🔴 CLOUD TERPUTUS</span>
              </span>
            )}

          </div>

          {/* Day & Date */}
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <Calendar className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${themeClasses.textPrimary}`}>
              {dayName}, <span>{fullDate}</span>
            </h2>
          </div>

          {holidayReason && (
            <p className="text-xs text-rose-300 font-semibold bg-rose-950/60 px-3 py-1 rounded-lg border border-rose-800/50 inline-block">
              Ket: {holidayReason}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>Zona Waktu: <strong className={themeClasses.textPrimary}>{tzOption.label}</strong></span>
            </div>

            {dbStatus?.lastChecked && (
              <div className="flex items-center gap-2">
                <span>•</span>
                <span>Sinkronisasi terakhir: <strong className="text-emerald-400 font-mono">{dbStatus.lastChecked}</strong></span>
              </div>
            )}

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isSyncing}
                title="Sinkronkan data terbaru dari Google Spreadsheet"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-[11px] transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
                <span>Sinkronkan Sekarang</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Digital Realtime Clock Display */}
        <div className="flex items-center justify-center">
          <div className={`flex items-baseline gap-2 border rounded-2xl px-6 py-4 shadow-inner ${
            isLight ? 'bg-slate-900 border-slate-800' : `${themeClasses.cardSubtleBg} ${themeClasses.border}`
          }`}>
            <div className="font-mono-clock text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-wider bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              {hourFormatted}:{minuteFormatted}
            </div>
            <div className="flex flex-col items-start pl-1">
              <span className="font-mono-clock text-xl sm:text-2xl font-bold text-emerald-400">
                :{secondFormatted}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 tracking-wider">
                {tzOption.short}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
