import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Bell,
  Radio,
  Clock,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Download
} from 'lucide-react';
import { RiwayatBelItem } from '../types';

interface RiwayatBelViewProps {
  riwayatList: RiwayatBelItem[];
  onClearAll: () => Promise<boolean>;
  onRefresh: () => void;
  isSaving: boolean;
}

export const RiwayatBelView: React.FC<RiwayatBelViewProps> = ({
  riwayatList,
  onClearAll,
  onRefresh,
  isSaving
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'Semua' | 'Otomatis' | 'Manual'>('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Berhasil' | 'Gagal'>('Semua');
  const [dateFilter, setDateFilter] = useState('');

  // Clear confirmation modal state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const filteredLogs = riwayatList.filter(item => {
    const matchSearch = item.namaJadwal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.keterangan && item.keterangan.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchMode = modeFilter === 'Semua' || item.mode === modeFilter;
    const matchStatus = statusFilter === 'Semua' || item.status === statusFilter;
    const matchDate = !dateFilter || item.tanggal.includes(dateFilter);
    return matchSearch && matchMode && matchStatus && matchDate;
  });

  const handleConfirmClear = async () => {
    const success = await onClearAll();
    if (success) {
      setIsClearModalOpen(false);
    }
  };

  const countOtomatis = riwayatList.filter(x => x.mode === 'Otomatis').length;
  const countManual = riwayatList.filter(x => x.mode === 'Manual').length;
  const countSukses = riwayatList.filter(x => x.status === 'Berhasil').length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-800/50">
              Tahap 4
            </span>
            <span className="text-xs text-slate-400">Sheet: <strong>RiwayatBel</strong></span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Riwayat Pemutaran Bel (Audit Log)
          </h2>
          <p className="text-xs text-slate-400">
            Catatan log audit pemutaran bel otomatis dan manual. Tersimpan secara permanen di Google Spreadsheet.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            disabled={isSaving}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {riwayatList.length > 0 && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Bersihkan Riwayat</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Stat Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <p className="text-[11px] text-slate-400">Total Pemutaran</p>
          <p className="text-lg font-bold text-white font-mono">{riwayatList.length}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <p className="text-[11px] text-emerald-400">Bel Otomatis</p>
          <p className="text-lg font-bold text-emerald-300 font-mono">{countOtomatis}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <p className="text-[11px] text-amber-400">Bel Manual</p>
          <p className="text-lg font-bold text-amber-300 font-mono">{countManual}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <p className="text-[11px] text-cyan-400">Tingkat Sukses</p>
          <p className="text-lg font-bold text-cyan-300 font-mono">
            {riwayatList.length > 0 ? `${Math.round((countSukses / riwayatList.length) * 100)}%` : '100%'}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama bel..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Filter Mode */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="Semua">Semua Mode</option>
            <option value="Otomatis">Mode: Otomatis</option>
            <option value="Manual">Mode: Manual</option>
          </select>

          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="Semua">Semua Status</option>
            <option value="Berhasil">Status: Berhasil</option>
            <option value="Gagal">Status: Gagal</option>
          </select>

          {/* Filter Date */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
          />

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-[11px] text-slate-400 hover:text-white underline"
            >
              Reset Tanggal
            </button>
          )}
        </div>

        <span className="text-xs text-slate-400 self-end lg:self-auto">
          Menampilkan <strong>{filteredLogs.length}</strong> entri
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-14 text-center">No</th>
                <th className="py-3.5 px-4 w-32">Tanggal</th>
                <th className="py-3.5 px-4 w-28">Jam</th>
                <th className="py-3.5 px-4">Nama Bel / Kegiatan</th>
                <th className="py-3.5 px-4 w-28 text-center">Mode</th>
                <th className="py-3.5 px-4 w-28 text-center">Status</th>
                <th className="py-3.5 px-4">Keterangan</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, idx) => (
                  <tr key={`${log.id || 'log'}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {log.tanggal}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {log.jam}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{log.namaJadwal}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.mode === 'Otomatis'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                          : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                      }`}>
                        {log.mode}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.status === 'Berhasil'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                          : 'bg-rose-950/60 text-rose-300 border-rose-800/50'
                      }`}>
                        {log.status === 'Berhasil' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-400" />
                        )}
                        <span>{log.status || 'Berhasil'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {log.keterangan || (log.mode === 'Otomatis' ? 'Sesuai Jadwal KBM' : 'Manual')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs">Tidak ada riwayat yang cocok dengan kriteria filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION CLEAR MODAL */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Bersihkan Riwayat Bel?</h3>
                <p className="text-xs text-slate-400">Seluruh catatan log akan dihapus dari Spreadsheet</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Apakah Anda yakin ingin mengosongkan seluruh riwayat pemutaran bel? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmClear}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg disabled:opacity-50"
              >
                {isSaving ? 'Menghapus...' : 'Ya, Bersihkan Riwayat'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
