import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  ArrowUpDown,
  Tag,
  Save,
  X,
  Layers,
  FileSpreadsheet,
  Music
} from 'lucide-react';
import { JadwalBelItem, BellType, SuaraBelItem } from '../types';
import { HARI_OPTIONS, TIPE_BEL_OPTIONS, DEFAULT_SAMPLE_SCHEDULES } from '../constants/defaultData';
import { isValidTimeFormat, checkDuplicateSchedule } from '../utils/scheduleCalculator';

interface ScheduleManagementViewProps {
  jadwalList: JadwalBelItem[];
  suaraList?: SuaraBelItem[];
  onSaveAll: (items: JadwalBelItem[]) => Promise<boolean>;
  onAddOrUpdate: (item: JadwalBelItem) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onToggleStatus: (id: string, newStatus: boolean) => Promise<boolean>;
  isSaving: boolean;
  onRefresh: () => void;
  spreadsheetUrl?: string;
}

export const ScheduleManagementView: React.FC<ScheduleManagementViewProps> = ({
  jadwalList,
  suaraList = [],
  onSaveAll,
  onAddOrUpdate,
  onDelete,
  onToggleStatus,
  isSaving,
  onRefresh,
  spreadsheetUrl
}) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Add / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JadwalBelItem | null>(null);

  // Form Fields
  const [formHari, setFormHari] = useState<string>('Semua Hari');
  const [formJam, setFormJam] = useState<string>('');
  const [formKeterangan, setFormKeterangan] = useState<string>('');
  const [formTipe, setFormTipe] = useState<BellType>('Masuk');
  const [formAudio, setFormAudio] = useState<string>('SB-001');
  const [formStatus, setFormStatus] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [itemToDelete, setItemToDelete] = useState<JadwalBelItem | null>(null);

  // Filtered and Sorted Schedules
  const filteredList = jadwalList
    .filter(item => {
      const matchDay = selectedDayFilter === 'Semua' || item.hari === 'Semua Hari' || item.hari === selectedDayFilter;
      const matchSearch = item.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) || item.jam.includes(searchQuery);
      return matchDay && matchSearch;
    })
    .sort((a, b) => (a.jam || '').localeCompare(b.jam || ''));

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormHari(selectedDayFilter === 'Semua' ? 'Semua Hari' : selectedDayFilter);
    setFormJam('');
    setFormKeterangan('');
    setFormTipe('Masuk');
    setFormAudio(suaraList[0]?.id || 'SB-001');
    setFormStatus(true);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: JadwalBelItem) => {
    setEditingItem(item);
    setFormHari(item.hari);
    setFormJam(item.jam);
    setFormKeterangan(item.keterangan);
    setFormTipe(item.tipe);
    setFormAudio(item.audio || 'SB-001');
    setFormStatus(item.statusAktif);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Validasi Format Jam
    if (!isValidTimeFormat(formJam)) {
      setFormError('Format jam tidak valid! Gunakan format 24 jam HH:mm (contoh: 07:00, 12:30, 15:45).');
      return;
    }

    // 2. Validasi Nama Kegiatan
    if (!formKeterangan.trim()) {
      setFormError('Nama bel atau keterangan kegiatan wajib diisi.');
      return;
    }

    // 3. Validasi Duplikat pada Jam & Hari yang sama
    const isDuplicate = checkDuplicateSchedule(
      jadwalList,
      formJam,
      formHari,
      editingItem ? editingItem.id : undefined
    );

    if (isDuplicate) {
      setFormError(`Sudah ada jadwal bel pada jam ${formJam} untuk ${formHari}. Harap gunakan jam berbeda untuk mencegah jadwal ganda.`);
      return;
    }

    const newItem: JadwalBelItem = {
      id: editingItem ? editingItem.id : `JB-${Date.now().toString().slice(-4)}`,
      hari: formHari,
      jam: formJam.trim(),
      keterangan: formKeterangan.trim(),
      tipe: formTipe,
      audio: formAudio,
      statusAktif: formStatus
    };

    const success = await onAddOrUpdate(newItem);
    if (success) {
      setIsFormModalOpen(false);
    } else {
      setFormError('Gagal menyimpan jadwal ke Google Spreadsheet. Periksa koneksi internet.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const success = await onDelete(itemToDelete.id);
    if (success) {
      setItemToDelete(null);
    }
  };

  const handleLoadSampleSchedules = async () => {
    if (confirm('Muat 13 jadwal standar KBM sekolah? Jadwal ini akan otomatis disimpan ke Google Spreadsheet.')) {
      await onSaveAll(DEFAULT_SAMPLE_SCHEDULES);
    }
  };

  const getTipeBadge = (tipe: BellType) => {
    const found = TIPE_BEL_OPTIONS.find(t => t.value === tipe);
    return found ? found.badgeColor : 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const getSoundName = (audioId?: string) => {
    if (!audioId) return 'Melodi Standar';
    const sound = suaraList.find(s => s.id === audioId || s.urlFile === audioId);
    return sound ? sound.namaSuara : 'Melodi Standar';
  };

  return (
    <div className="space-y-6">
      
      {/* View Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/50">
              Tahap 2 &amp; 3
            </span>
            <span className="text-xs text-slate-400">Sheet: <strong>JadwalBel</strong></span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Manajemen Jadwal Bel KBM
          </h2>
          <p className="text-xs text-slate-400">
            Atur seluruh jadwal bel sekolah/madrasah dan tautkan dengan suara bel otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {jadwalList.length === 0 && (
            <button
              onClick={handleLoadSampleSchedules}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Muat Template Jadwal Standar</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isSaving}
            title="Muat Ulang dari Spreadsheet"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal Bel</span>
          </button>
        </div>

      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/50 border border-slate-800/80 p-3 rounded-2xl">
        
        {/* Day Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedDayFilter('Semua')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDayFilter === 'Semua'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            Semua Hari ({jadwalList.length})
          </button>
          {HARI_OPTIONS.filter(h => h !== 'Semua Hari').map(hari => {
            const count = jadwalList.filter(j => j.hari === 'Semua Hari' || j.hari === hari).length;
            return (
              <button
                key={hari}
                onClick={() => setSelectedDayFilter(hari)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedDayFilter === hari
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {hari} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari jadwal / jam..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

      </div>

      {/* Main Schedule Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-14 text-center">No</th>
                <th className="py-3.5 px-4 w-20">Urutan</th>
                <th className="py-3.5 px-4">Nama Bel / Kegiatan</th>
                <th className="py-3.5 px-4 w-28">Jam</th>
                <th className="py-3.5 px-4 w-28">Hari</th>
                <th className="py-3.5 px-4">Suara Bel</th>
                <th className="py-3.5 px-4 w-28">Kategori</th>
                <th className="py-3.5 px-4 w-28 text-center">Status</th>
                <th className="py-3.5 px-4 w-24 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
              {filteredList.length > 0 ? (
                filteredList.map((item, index) => (
                  <tr
                    key={`${item.id || 'schedule'}-${index}`}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      !item.statusAktif ? 'opacity-50 bg-slate-950/30' : ''
                    }`}
                  >
                    {/* 1. No */}
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {index + 1}
                    </td>

                    {/* 2. Urutan */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        #{index + 1}
                      </span>
                    </td>

                    {/* 3. Nama Bel / Kegiatan */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-white text-sm">
                        {item.keterangan}
                      </span>
                    </td>

                    {/* 4. Jam */}
                    <td className="py-3 px-4">
                      <span className="font-mono-clock text-sm font-bold text-emerald-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 inline-block">
                        {item.jam}
                      </span>
                    </td>

                    {/* 5. Hari */}
                    <td className="py-3 px-4">
                      <span className="text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                        {item.hari}
                      </span>
                    </td>

                    {/* 6. Suara Bel */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-cyan-300">
                        <Music className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate max-w-[140px]" title={getSoundName(item.audio)}>
                          {getSoundName(item.audio)}
                        </span>
                      </div>
                    </td>

                    {/* 7. Kategori / Tipe */}
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getTipeBadge(item.tipe)}`}>
                        {item.tipe}
                      </span>
                    </td>

                    {/* 8. Status Aktif / Nonaktif Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(item.id, !item.statusAktif)}
                        disabled={isSaving}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                          item.statusAktif
                            ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/80'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {item.statusAktif ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* 9. Aksi Edit & Hapus */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          disabled={isSaving}
                          title="Edit Jadwal"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          disabled={isSaving}
                          title="Hapus Jadwal"
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
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-3">
                      <Clock className="w-10 h-10 text-slate-600 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-200">
                        Belum Ada Jadwal Bel
                      </h4>
                      <p className="text-xs text-slate-400">
                        Tambahkan jadwal bel baru atau muat template jadwal standar untuk memulai.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Total Jadwal: <strong>{jadwalList.length}</strong> (Aktif: <strong>{jadwalList.filter(x => x.statusAktif).length}</strong>)
          </span>
          <span className="text-[11px] text-slate-400">
            *Semua perubahan otomatis tersimpan di Google Spreadsheet (Sheet JadwalBel)
          </span>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT JADWAL BEL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingItem ? 'Edit Jadwal Bel' : 'Tambah Jadwal Bel Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Masukkan waktu, nama kegiatan, dan pilih nada bel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-600/50 text-xs text-rose-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p>{formError}</p>
                </div>
              )}

              {/* Nama Bel / Kegiatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Nama Bel / Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Contoh: Bel Masuk Sekolah / KBM Jam ke-1 / Istirahat 1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              {/* Jam & Hari Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Jam (Format HH:mm) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Waktu Jam (HH:mm) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={formJam}
                    onChange={(e) => setFormJam(e.target.value)}
                    placeholder="Contoh: 07:00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Gunakan format 24 jam (00:00 s/d 23:59)
                  </p>
                </div>

                {/* Hari */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Hari Berlaku *
                  </label>
                  <select
                    value={formHari}
                    onChange={(e) => setFormHari(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    {HARI_OPTIONS.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Pilih Nada Suara Bel */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Pilih Suara Bel yang Berbunyi</span>
                </label>
                <select
                  value={formAudio}
                  onChange={(e) => setFormAudio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {suaraList.filter(s => s.statusAktif).map((s, sIdx) => (
                    <option key={`${s.id || 'sound'}-${sIdx}`} value={s.id}>
                      {s.namaSuara} ({s.tipe})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipe Bel */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Kategori / Tipe Bel *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIPE_BEL_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        formTipe === opt.value
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-semibold">{opt.value}</span>
                      <input
                        type="radio"
                        name="tipeBel"
                        value={opt.value}
                        checked={formTipe === opt.value}
                        onChange={() => setFormTipe(opt.value)}
                        className="accent-emerald-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Aktif Switch */}
              <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white block">Status Jadwal</span>
                  <span className="text-[11px] text-slate-400">
                    Jadwal aktif akan dibunyikan otomatis tepat waktu
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormStatus(!formStatus)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    formStatus
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {formStatus ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan ke Spreadsheet'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS JADWAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Jadwal Bel?</h3>
                <p className="text-xs text-slate-400">Data akan dihapus permanen dari Spreadsheet</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <p className="text-slate-200 font-bold">{itemToDelete.keterangan}</p>
              <p className="text-slate-400 font-mono">Waktu: {itemToDelete.jam} ({itemToDelete.hari})</p>
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
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 disabled:opacity-50"
              >
                {isSaving ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
