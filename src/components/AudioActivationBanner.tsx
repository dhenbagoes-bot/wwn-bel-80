import React from 'react';
import { Volume2, VolumeX, CheckCircle2, AlertTriangle, Sparkles, Music, Play, RotateCcw } from 'lucide-react';

interface AudioActivationBannerProps {
  isAudioActive: boolean;
  isActivating: boolean;
  onActivateAudio: () => void;
}

export const AudioActivationBanner: React.FC<AudioActivationBannerProps> = ({
  isAudioActive,
  isActivating,
  onActivateAudio
}) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all shadow-xl ${
      isAudioActive
        ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-emerald-500/50 shadow-emerald-950/30'
        : 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 border-rose-500/60 shadow-rose-950/30'
    }`}>
      
      {/* Decorative Glow */}
      <div className={`absolute -right-10 -bottom-10 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
        isAudioActive ? 'bg-emerald-500/15' : 'bg-rose-500/15'
      }`} />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        
        {/* Left: Status & Instructions */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5">
            {isAudioActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                🟢 AUDIO AKTIF
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold uppercase tracking-wider animate-pulse">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                🔴 AUDIO BELUM AKTIF
              </span>
            )}

            <span className="text-xs text-slate-400 hidden sm:inline-block">
              Web Audio &amp; HTML5 Engine
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {isAudioActive
              ? 'Sistem Audio Siap Memutar Bel Otomatis & Manual'
              : 'Klik Aktifkan Audio Sebelum Menggunakan Bel Otomatis'}
          </h3>

          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {isAudioActive
              ? 'Izin pemutaran audio diizinkan oleh browser. Bel akan otomatis berbunyi tepat waktu saat halaman ini terbuka.'
              : 'Kebijakan browser (Chrome/Edge) memerlukan klik pengguna untuk mengizinkan suara. Klik tombol di samping untuk mengaktifkan.'}
          </p>
        </div>

        {/* Right: Big Activation Button */}
        <div className="flex-shrink-0 w-full md:w-auto">
          <button
            onClick={onActivateAudio}
            disabled={isActivating}
            className={`w-full md:w-auto px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${
              isAudioActive
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/80 shadow-slate-950/60'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white border border-emerald-400/50 shadow-emerald-950/80 animate-bounce'
            }`}
          >
            {isAudioActive ? (
              <>
                <Volume2 className="w-5 h-5 text-emerald-400" />
                <span>UJI ULANG SUARA TES</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 text-white" />
                <span>🔊 AKTIFKAN AUDIO SEKARANG</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
