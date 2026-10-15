import React, { useState, useRef } from 'react';
import {
  HardDriveDownload,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  FileText,
  ShieldCheck,
  Database,
  ArrowRight,
  Info,
  Clock,
  Layers,
  Sparkles,
  Lock,
  X
} from 'lucide-react';
import {
  SchoolConfig,
  JadwalBelItem,
  SuaraBelItem,
  HariAktifItem,
  HariLiburItem,
  RiwayatBelItem,
  PenggunaItem,
  FullBackupData,
  AuthSession,
  DatabaseStatus
} from '../types';

interface BackupExportViewProps {
  config: SchoolConfig;
  jadwalList: JadwalBelItem[];
  suaraList: SuaraBelItem[];
  hariAktifList: HariAktifItem[];
  hariLiburList: HariLiburItem[];
  riwayatList: RiwayatBelItem[];
  usersList: PenggunaItem[];
  dbStatus: DatabaseStatus;
  authSession: AuthSession;
  onRestoreBackup: (backup: FullBackupData) => Promise<void>;
  onForceSyncAllToGAS: () => Promise<void>;
  isSyncing: boolean;
}

export const BackupExportView: React.FC<BackupExportViewProps> = ({
  config,
  jadwalList,
  suaraList,
  hariAktifList,
  hariLiburList,
  riwayatList,
  usersList,
  dbStatus,
  authSession,
  onRestoreBackup,
  onForceSyncAllToGAS,
  isSyncing
}) => {
  const isAdmin = authSession.user?.role === 'Admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewBackup, setPreviewBackup] = useState<FullBackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportSuccessMsg(`Berkas "${filename}" berhasil diunduh!`);
    setTimeout(() => setExportSuccessMsg(null), 4000);
  };

  // 1. Export Full System Backup (JSON)
  const handleExportFullBackup = () => {
    const backup: FullBackupData = {
      version: '5.0-final',
      exportDate: new Date().toISOString(),
      appName: 'Bel Sekolah / Madrasah Digital',
      settings: config,
      jadwal: jadwalList,
      suara: suaraList,
      hariAktif: hariAktifList,
      hariLibur: hariLiburList,
      pengguna: usersList,
      riwayat: riwayatList
    };

    const sanitizedName = (config.namaSekolah || 'Sekolah')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `backup_bel_${sanitizedName}_${dateStr}.json`;

    triggerDownload(filename, JSON.stringify(backup, null, 2), 'application/json');
  };

  // 2. Export Jadwal Bel to JSON
  const handleExportJadwalJSON = () => {
    const filename = `jadwal_bel_${new Date().toISOString().slice(0, 10)}.json`;
    triggerDownload(filename, JSON.stringify(jadwalList, null, 2), 'application/json');
  };

  // 3. Export Jadwal Bel to CSV
  const handleExportJadwalCSV = () => {
    const headers = ['No', 'ID', 'Hari', 'Jam', 'Nama Bel / Kegiatan', 'Tipe', 'Audio', 'Status'];
    const rows = jadwalList.map((item, idx) => [
      idx + 1,
      item.id,
      `"${item.hari}"`,
      `"${item.jam}"`,
      `"${item.keterangan.replace(/"/g, '""')}"`,
      `"${item.tipe}"`,
      `"${item.audio || ''}"`,
      item.statusAktif ? 'Aktif' : 'Nonaktif'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filename = `jadwal_bel_${new Date().toISOString().slice(0, 10)}.csv`;
    triggerDownload(filename, csvContent, 'text/csv;charset=utf-8;');
  };

  // 4. Export Riwayat Bel to CSV
  const handleExportRiwayatCSV = () => {
    const headers = ['No', 'ID', 'Tanggal', 'Jam', 'Nama Jadwal', 'Mode', 'Status', 'Keterangan'];
    const rows = riwayatList.map((item, idx) => [
      idx + 1,
      item.id,
      `"${item.tanggal}"`,
      `"${item.jam}"`,
      `"${item.namaJadwal.replace(/"/g, '""')}"`,
      `"${item.mode}"`,
      `"${item.status}"`,
      `"${(item.keterangan || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filename = `riwayat_bel_${new Date().toISOString().slice(0, 10)}.csv`;
    triggerDownload(filename, csvContent, 'text/csv;charset=utf-8;');
  };

  // 5. Handle File Selection for Restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setImportError('Format berkas harus berupa .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.settings && !json.jadwal) {
          setImportError('Format berkas backup tidak valid (tidak ada struktur settings atau jadwal).');
          return;
        }
        setPreviewBackup(json);
      } catch (err: any) {
        setImportError('Gagal membaca isi berkas JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!previewBackup) return;
    setIsRestoring(true);
    try {
      await onRestoreBackup(previewBackup);
      setPreviewBackup(null);
    } catch (err: any) {
      setImportError('Gagal memulihkan backup: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 text-indigo-400">
              <HardDriveDownload className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Backup &amp; Export Data
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                  v5.0 Data Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Cadangkan seluruh konfigurasi, jadwal, suara, hari aktif, libur, dan akun pengguna ke berkas lokal atau pulihkan data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onForceSyncAllToGAS}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkronkan ke Spreadsheet'}</span>
            </button>
          </div>
        </div>

        {exportSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-600/50 flex items-center gap-2.5 text-xs text-emerald-200 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Grid: Export vs Restore */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Export Hub */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ekspor &amp; Unduh Cadangan</h3>
              <p className="text-xs text-slate-400">Unduh data dalam format JSON, CSV, atau teks</p>
            </div>
          </div>

          {/* Full System Backup Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-950/60 border border-indigo-500/30 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <FileJson className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Full System Backup (.JSON)</h4>
                  <p className="text-xs text-slate-400">
                    Mencakup 7 lembar kerja: Pengaturan, Jadwal ({jadwalList.length}), Suara ({suaraList.length}), Hari Aktif, Hari Libur ({hariLiburList.length}), Pengguna ({usersList.length}), Riwayat.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleExportFullBackup}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-950/50"
            >
              <HardDriveDownload className="w-4 h-4" />
              <span>Unduh Full Backup JSON Sekarang</span>
            </button>
          </div>

          {/* Granular Exports */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ekspor Data Terpisah (Tabel Spesifik)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Jadwal Bel JSON */}
              <button
                onClick={handleExportJadwalJSON}
                className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200">Jadwal Bel (.JSON)</p>
                  <p className="text-[11px] text-slate-400">{jadwalList.length} Jadwal terdaftar</p>
                </div>
                <Download className="w-4 h-4 text-amber-400" />
              </button>

              {/* Jadwal Bel CSV */}
              <button
                onClick={handleExportJadwalCSV}
                className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200">Jadwal Bel (.CSV / Excel)</p>
                  <p className="text-[11px] text-slate-400">Kompatibel Microsoft Excel</p>
                </div>
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              </button>

              {/* Riwayat Bel CSV */}
              <button
                onClick={handleExportRiwayatCSV}
                className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200">Riwayat Bel (.CSV)</p>
                  <p className="text-[11px] text-slate-400">{riwayatList.length} Catatan pemutaran</p>
                </div>
                <FileText className="w-4 h-4 text-purple-400" />
              </button>

              {/* Data Sekolah Info */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-left flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-300">Identitas Sekolah</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{config.namaSekolah}</p>
                </div>
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Restore / Import Hub */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pulihkan Data (Restore Backup)</h3>
              <p className="text-xs text-slate-400">Unggah berkas cadangan .json untuk memulihkan seluruh sistem</p>
            </div>
          </div>

          {!isAdmin ? (
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-800/60 text-purple-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Khusus Administrator</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Fitur pemulihan data (Restore) hanya dapat dilakukan oleh akun dengan hak akses <strong>Admin</strong> demi keamanan data sekolah.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dropzone / File Picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 text-center cursor-pointer transition-all space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    Klik untuk memilih berkas <span className="text-indigo-400">.JSON</span> backup
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pilih berkas hasil ekspor Full Backup sebelumnya
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600/50 text-xs text-rose-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Petunjuk Pemulihan:</span>
                </div>
                <p>1. Memulihkan data akan mengganti data lokal dan memperbarui sheet Google Spreadsheet terkait.</p>
                <p>2. Pastikan koneksi internet stabil saat proses pemulihan berlangsung.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Preview Backup before Applying */}
      {previewBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0">
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  <HardDriveDownload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Konfirmasi Pemulihan Cadangan</h3>
                  <p className="text-[11px] text-slate-400">Verifikasi rincian data sebelum memulihkan</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewBackup(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sekolah:</span>
                  <span className="font-bold text-white">{previewBackup.settings?.namaSekolah || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tahun Pelajaran:</span>
                  <span className="font-bold text-slate-200">{previewBackup.settings?.tahunPelajaran || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal Ekspor:</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {previewBackup.exportDate ? new Date(previewBackup.exportDate).toLocaleString('id-ID') : '-'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">JADWAL BEL</span>
                  <strong className="text-amber-400 text-sm">{previewBackup.jadwal?.length || 0} Jadwal</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">SUARA BEL</span>
                  <strong className="text-cyan-400 text-sm">{previewBackup.suara?.length || 0} Nada</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">HARI LIBUR</span>
                  <strong className="text-rose-400 text-sm">{previewBackup.hariLibur?.length || 0} Tanggal</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">AKUN PENGGUNA</span>
                  <strong className="text-blue-400 text-sm">{previewBackup.pengguna?.length || 0} Pengguna</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-600/50 text-xs text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  Perhatian: Data sistem saat ini akan ditimpa dengan data cadangan ini dan disinkronkan ke Google Spreadsheet.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewBackup(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={isRestoring}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/60 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isRestoring ? 'Memulihkan Data...' : 'Pulihkan Data Sekarang'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
