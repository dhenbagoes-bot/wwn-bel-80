import React, { useState } from 'react';
import { Bell, Play, Square, Volume2, AlertCircle, CheckCircle2, Music, Sparkles } from 'lucide-react';
import { SuaraBelItem } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ManualBellCardProps {
  suaraList: SuaraBelItem[];
  isAudioActive: boolean;
  isPlaying: boolean;
  onPlayManualBell: (suaraId: string, namaSuara: string) => Promise<boolean>;
  onStopBell: () => void;
  onActivateAudio: () => void;
}

export const ManualBellCard: React.FC<ManualBellCardProps> = ({
  suaraList,
  isAudioActive,
  isPlaying,
  onPlayManualBell,
  onStopBell,
  onActivateAudio
}) => {
  const { themeClasses, isLight } = useTheme();
  const activeSounds = suaraList.filter(s => s.statusAktif);
  const [selectedSoundId, setSelectedSoundId] = useState<string>(activeSounds[0]?.id || 'SB-001');

  const selectedSound = suaraList.find(s => s.id === selectedSoundId) || activeSounds[0] || suaraList[0];

  const handleRingNow = async () => {
    if (!isAudioActive) {
      onActivateAudio();
      return;
    }
    if (selectedSound) {
      await onPlayManualBell(selectedSound.urlFile || selectedSound.id, selectedSound.namaSuara);
    }
  };

  return (
    <div className={`rounded-2xl border p-6 shadow-xl flex flex-col justify-between relative overflow-hidden transition-all ${themeClasses.cardBg}`}>
      
      {/* Glow Accent */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3.5 border-b ${themeClasses.border}`}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Bel Manual Sekolah
            </span>
          </div>

          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${themeClasses.cardSubtleBg} ${themeClasses.border} ${themeClasses.textSecondary}`}>
            Mode Manual
          </span>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          
          {/* Sound Picker Dropdown */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pilih Suara / Nada Bel:</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {activeSounds.length} Nada Aktif
              </span>
            </label>
            <select
              value={selectedSoundId}
              onChange={(e) => setSelectedSoundId(e.target.value)}
              disabled={isPlaying}
              className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium ${themeClasses.inputBg}`}
            >
              {activeSounds.map((sound, idx) => (
                <option key={`${sound.id || 'sound'}-${idx}`} value={sound.id}>
                  {sound.namaSuara} ({sound.tipe})
                </option>
              ))}
            </select>
            {selectedSound?.keterangan && (
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {selectedSound.keterangan}
              </p>
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRingNow}
              disabled={isPlaying}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                isPlaying
                  ? 'bg-amber-600 text-white animate-pulse'
                  : !isAudioActive
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-950/50'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50'
              }`}
            >
              <Bell className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
              <span>
                {isPlaying
                  ? 'SEDANG MEMBUNYIKAN BEL...'
                  : !isAudioActive
                  ? 'AKTIFKAN & BUNYIKAN BEL'
                  : 'BUNYIKAN BEL SEKARANG'}
              </span>
            </button>

            {isPlaying && (
              <button
                onClick={onStopBell}
                className="px-4 py-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow"
              >
                <Square className="w-3.5 h-3.5 fill-rose-400" />
                <span>Hentikan</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Footer Notice */}
      <div className={`pt-3 border-t flex items-center justify-between text-xs text-slate-400 ${themeClasses.border}`}>
        <span>Tercatat otomatis di sheet <strong>RiwayatBel</strong></span>
        <span className="text-[11px] text-emerald-400 font-medium">1x Klik = 1x Berbunyi</span>
      </div>

    </div>
  );
};
