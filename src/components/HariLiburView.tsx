import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Save,
  X,
  ShieldAlert,
  Sparkles,
  Tag
} from 'lucide-react';
import { HariLiburItem } from '../types';

interface HariLiburViewProps {
  hariLiburList: HariLiburItem[];
  onSaveAll: (items: HariLiburItem[]) => Promise<boolean>;
  isSaving: boolean;
  onRefresh: () => void;
}

export const HariLiburView: React.FC<HariLiburViewProps> = ({
  hariLiburList,
  onSaveAll,
  isSaving,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HariLiburItem | null>(null);

  // Form Fields
  const [formTanggal, setFormTanggal] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formTipe, setFormTipe] = useState('Nasional');
  const [formStatus, setFormStatus] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<HariLiburItem | null>(null);

  const filteredHolidays = hariLiburList
    .filter(hl =>
      hl.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hl.tanggal.includes(searchQuery)
    )
    .sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTanggal(new Date().toISOString().slice(0, 10));
    setFormKeterangan('');
    setFormTipe('Nasional');
    setFormStatus(true);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: HariLiburItem) => {
    setEditingItem(item);
    setFormTanggal(item.tanggal);
    setFormKeterangan(item.keterangan);
    setFormTipe(item.tipeLibur || 'Nasional');
    setFormStatus(item.statusAktif);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTanggal) {
      setFormError('Tanggal libur wajib diisi.');
      return;
    }

    if (!formKeterangan.trim()) {
      setFormError('Nama atau keterangan libur wajib diisi.');
      return;
    }

    const newItem: HariLiburItem = {
      id: editingItem ? editingItem.id : `HL-${Date.now().toString().slice(-4)}`,
      tanggal: formTanggal.trim(),
      keterangan: formKeterangan.trim(),
      tipeLibur: formTipe,
      statusAktif: formStatus
    };

    let updatedList: HariLiburItem[];
    if (editingItem) {
      updatedList = hariLiburList.map(h => (h.id === editingItem.id ? newItem : h));
    } else {
      updatedList = [...hariLiburList, newItem];
    }

    const success = await onSaveAll(updatedList);
    if (success) {
      setIsFormOpen(false);
    } else {
      setFormError('Gagal menyimpan hari libur ke Google Spreadsheet.');
    }
  };

  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    const updated = hariLiburList.map(h => (h.id === id ? { ...h, statusAktif: newStatus } : h));
    await onSaveAll(updated);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const updated = hariLiburList.filter(h => h.id !== itemToDelete.id);
    const success = await onSaveAll(updated);
    if (success) {
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded border border-rose-800/50">
              Tahap 4
            </span>
            <span className="text-xs text-slate-400">Sheet: <strong>HariLibur</strong></span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Manajemen Kalender Hari Libur
          </h2>
          <p className="text-xs text-slate-400">
            Daftar tanggal libur nasional, libur semester, dan libur khusus. Pada hari libur aktif, <strong>bel otomatis otomatis nonaktif</strong>.
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

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950/50 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tanggal Libur</span>
          </button>
        </div>
      </div>

      {/* Warning Priority Rule */}
      <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3 text-xs">
        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex-shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-rose-300 text-xs">Prioritas Sistem: Hari Libur Mengalahkan Jadwal Bel</h4>
          <p className="text-slate-300 mt-0.5 leading-relaxed">
            Jika tanggal hari ini tercatat pada daftar Hari Libur dengan status <strong>AKTIF</strong>, maka <strong>BEL OTOMATIS TIDAK AKAN BERBUNYI</strong> dan Dashboard menampilkan status <strong>🔴 HARI LIBUR</strong>. Bel Manual tetap dapat digunakan sewaktu-waktu.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tanggal / nama libur..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline-block">
          Total: <strong>{hariLiburList.length}</strong> Hari Libur Terdaftar
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-14 text-center">No</th>
                <th className="py-3.5 px-4 w-28">ID</th>
                <th className="py-3.5 px-4 w-36">Tanggal</th>
                <th className="py-3.5 px-4">Nama / Keterangan Libur</th>
                <th className="py-3.5 px-4 w-32">Kategori</th>
                <th className="py-3.5 px-4 w-32 text-center">Status</th>
                <th className="py-3.5 px-4 w-24 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
              {filteredHolidays.length > 0 ? (
                filteredHolidays.map((hl, idx) => (
                  <tr
                    key={`${hl.id || 'holiday'}-${idx}`}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      !hl.statusAktif ? 'opacity-50 bg-slate-950/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {hl.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-white font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 inline-block">
                        {hl.tanggal}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white text-sm">
                        {hl.keterangan}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-rose-300">
                        {hl.tipeLibur || 'Nasional'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(hl.id, !hl.statusAktif)}
                        disabled={isSaving}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                          hl.statusAktif
                            ? 'bg-rose-950/80 border-rose-600/60 text-rose-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {hl.statusAktif ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Libur Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(hl)}
                          disabled={isSaving}
                          title="Edit Libur"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(hl)}
                          disabled={isSaving}
                          title="Hapus Libur"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs">Belum ada tanggal libur yang terdaftar.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT HARI LIBUR */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingItem ? 'Edit Hari Libur' : 'Tambah Tanggal Libur Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">Pada tanggal libur aktif, bel otomatis dimatikan</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-600/50 text-xs text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p>{formError}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Tanggal Libur (YYYY-MM-DD) *
                </label>
                <input
                  type="date"
                  required
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Nama / Keterangan Libur *
                </label>
                <input
                  type="text"
                  required
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Contoh: Libur Hari Raya Idul Fitri / Libur Akhir Semester"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Kategori Libur
                  </label>
                  <select
                    value={formTipe}
                    onChange={(e) => setFormTipe(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
                  >
                    <option value="Nasional">Libur Nasional</option>
                    <option value="Semester">Libur Semester</option>
                    <option value="Khusus">Libur Khusus Madrasah</option>
                    <option value="Cuti Bersama">Cuti Bersama</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Status Libur
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormStatus(!formStatus)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      formStatus ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {formStatus ? 'Aktif (Bel Mati)' : 'Nonaktif'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950/50 disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan ke Spreadsheet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HAPUS */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Tanggal Libur?</h3>
                <p className="text-xs text-slate-400">Data akan dihapus dari Google Spreadsheet</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <p className="text-slate-200 font-bold">{itemToDelete.keterangan}</p>
              <p className="text-slate-400 font-mono">Tanggal: {itemToDelete.tanggal}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg disabled:opacity-50"
              >
                {isSaving ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
