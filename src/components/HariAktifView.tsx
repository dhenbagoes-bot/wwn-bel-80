import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Save,
  RefreshCw,
  Info,
  ShieldCheck,
  AlertTriangle,
  Sun,
  Moon
} from 'lucide-react';
import { HariAktifItem } from '../types';
import { DEFAULT_HARI_AKTIF } from '../constants/defaultData';

interface HariAktifViewProps {
  hariAktifList: HariAktifItem[];
  onSaveAll: (items: HariAktifItem[]) => Promise<boolean>;
  isSaving: boolean;
  onRefresh: () => void;
}

export const HariAktifView: React.FC<HariAktifViewProps> = ({
  hariAktifList,
  onSaveAll,
  isSaving,
  onRefresh
}) => {
  const [items, setItems] = useState<HariAktifItem[]>(hariAktifList);

  React.useEffect(() => {
    setItems(hariAktifList);
  }, [hariAktifList]);

  const handleToggleStatus = async (hariName: string) => {
    const updated = items.map(item => {
      if (item.hari === hariName) {
        return {
          ...item,
          status: (item.status === 'Aktif' ? 'Nonaktif' : 'Aktif') as 'Aktif' | 'Nonaktif'
        };
      }
      return item;
    });
    setItems(updated);
    await onSaveAll(updated);
  };

  const handleFieldChange = (hariName: string, field: keyof HariAktifItem, val: string) => {
    const updated = items.map(item => {
      if (item.hari === hariName) {
        return { ...item, [field]: val };
      }
      return item;
    });
    setItems(updated);
  };

  const handleSaveDetails = async () => {
    await onSaveAll(items);
  };

  const handleResetDefaults = async () => {
    if (confirm('Kembalikan konfigurasi hari aktif ke standar (Senin-Sabtu Aktif, Minggu Libur)?')) {
      setItems(DEFAULT_HARI_AKTIF);
      await onSaveAll(DEFAULT_HARI_AKTIF);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/50">
              Tahap 4
            </span>
            <span className="text-xs text-slate-400">Sheet: <strong>HariAktif</strong></span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Konfigurasi Hari Aktif Sekolah
          </h2>
          <p className="text-xs text-slate-400">
            Tentukan hari KBM yang aktif. Bel otomatis hanya akan berbunyi pada hari yang berstatus <strong>AKTIF</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Reset Standar
          </button>

          <button
            onClick={onRefresh}
            disabled={isSaving}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleSaveDetails}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>

      {/* Rules Banner */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-xs">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-white text-xs">Aturan Sistem Hari Aktif:</h4>
          <p className="text-slate-300 mt-0.5 leading-relaxed">
            • Hari yang berstatus <strong>AKTIF</strong> akan menjalankan jadwal bel otomatis sesuai jam.<br />
            • Hari yang berstatus <strong>NONAKTIF</strong> otomatis mematikan bel otomatis sepanjang hari.<br />
            • <strong>Bel Manual</strong> tetap dapat dibunyikan kapan saja oleh operator pada hari nonaktif.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-14 text-center">No</th>
                <th className="py-3.5 px-4 w-36">Hari</th>
                <th className="py-3.5 px-4 w-36 text-center">Status Operasional</th>
                <th className="py-3.5 px-4 w-32">Jam Masuk</th>
                <th className="py-3.5 px-4 w-32">Jam Pulang</th>
                <th className="py-3.5 px-4">Keterangan Kegiatan</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
              {items.map((item, idx) => {
                const isActive = item.status === 'Aktif';
                return (
                  <tr
                    key={`${item.hari}-${idx}`}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      !isActive ? 'opacity-60 bg-slate-950/40' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <Sun className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        ) : (
                          <Moon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        )}
                        <span className="font-bold text-white text-sm">{item.hari}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.hari)}
                        disabled={isSaving}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          isActive
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-950'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>AKTIF</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>NONAKTIF</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.jamMasuk || ''}
                        onChange={(e) => handleFieldChange(item.hari, 'jamMasuk', e.target.value)}
                        placeholder="07:00"
                        className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.jamPulang || ''}
                        onChange={(e) => handleFieldChange(item.hari, 'jamPulang', e.target.value)}
                        placeholder="15:00"
                        className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.keterangan || ''}
                        onChange={(e) => handleFieldChange(item.hari, 'keterangan', e.target.value)}
                        placeholder="Contoh: KBM Reguler / Ekstrakurikuler"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            Hari Aktif: <strong>{items.filter(x => x.status === 'Aktif').length}</strong> dari 7 Hari
          </span>
          <span>Data tersimpan langsung ke Google Spreadsheet</span>
        </div>
      </div>

    </div>
  );
};
