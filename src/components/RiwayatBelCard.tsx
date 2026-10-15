import React from 'react';
import { History, CheckCircle2, XCircle, Bell, Radio, Clock, ShieldCheck } from 'lucide-react';
import { RiwayatBelItem } from '../types';

interface RiwayatBelCardProps {
  riwayatList: RiwayatBelItem[];
  onRefresh: () => void;
  isSyncing: boolean;
}

export const RiwayatBelCard: React.FC<RiwayatBelCardProps> = ({
  riwayatList,
  onRefresh,
  isSyncing
}) => {
  return (
    <div className="rounded-2xl bg-slate-800/80 border border-slate-700/60 p-6 shadow-xl shadow-slate-950/20 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/50">
                  Audit Log
                </span>
                <span className="text-xs text-slate-400 font-mono">Sheet: RiwayatBel</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                Riwayat Pemutaran Bel Terakhir
              </h3>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 transition-colors text-xs font-medium flex items-center gap-1"
          >
            <Clock className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Update</span>
          </button>
        </div>

        {/* List of recent rings */}
        <div className="py-3 space-y-2 max-h-64 overflow-y-auto pr-1">
          {riwayatList.length > 0 ? (
            riwayatList.slice(0, 10).map((log, index) => (
              <div
                key={`${log.id || 'log'}-${index}`}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg border ${
                    log.mode === 'Otomatis'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    {log.mode === 'Otomatis' ? <Bell className="w-3.5 h-3.5" /> : <Radio className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{log.namaJadwal}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {log.tanggal} • {log.jam}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    log.mode === 'Otomatis'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                      : 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                  }`}>
                    {log.mode}
                  </span>

                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {log.status || 'Berhasil'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Belum ada catatan riwayat pemutaran bel.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Hanya bel yang berhasil berbunyi yang dicatat</span>
        </div>
        <span>Total: {riwayatList.length} entri</span>
      </div>
    </div>
  );
};
