import React from 'react';
import {
  Info,
  School,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  Volume2,
  Clock,
  Calendar,
  Layers,
  CheckCircle2,
  HardDriveDownload,
  Users,
  ExternalLink,
  Code,
  Github,
  Globe,
  BookOpen,
  Cpu
} from 'lucide-react';
import { SchoolConfig } from '../types';

interface AboutViewProps {
  config: SchoolConfig;
  onOpenGuide: () => void;
  onOpenConfig: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  config,
  onOpenGuide,
  onOpenConfig
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Hero Header */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Versi 5.0 Final Edition
              </span>
              <span className="text-xs text-slate-400">
                Tahap 1, 2, 3, 4, &amp; 5 Selesai
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Bel Sekolah &amp; Madrasah Digital
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Aplikasi web operasional bel digital otomatis dan manual terintegrasi dengan Google Spreadsheet sebagai basis data cloud realtime, Google Apps Script API, Web Audio API presisi, manajemen hari aktif &amp; libur, multi-user role, serta sistem backup mandiri.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenGuide}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Panduan Google Apps Script</span>
              </button>
              <button
                onClick={onOpenConfig}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <School className="w-4 h-4 text-emerald-400" />
                <span>Konfigurasi Identitas Sekolah</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center w-full md:w-64 flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center mb-3">
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt="Logo"
                  className="w-12 h-12 object-contain rounded-xl"
                />
              ) : (
                <School className="w-8 h-8 text-emerald-400" />
              )}
            </div>
            <h4 className="text-xs font-bold text-white truncate max-w-full">
              {config.namaSekolah || 'Sekolah'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              NPSN/NSM: {config.npsnNsm || '-'}
            </p>
            <div className="mt-3 text-[10px] text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
              Tahun Ajaran {config.tahunPelajaran}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Milestones Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Tahap 1: Database &amp; Identitas</span>
          </div>
          <p className="text-xs text-slate-400">
            Koneksi Google Spreadsheet via Google Apps Script API, konfigurasi identitas madrasah/sekolah, dan struktur lembar kerja awal.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Tahap 2: Manajemen Jadwal</span>
          </div>
          <p className="text-xs text-slate-400">
            CRUD jadwal bel KBM, jam realtime 1 detik, indikator kegiatan saat ini, jadwal berikutnya, dan countdown realtime.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Tahap 3: Audio &amp; Bel Otomatis</span>
          </div>
          <p className="text-xs text-slate-400">
            Sintesis Web Audio API (Westminster, Ding Dong, Sirine), dukungan MP3/WAV, tombol Aktifkan Audio, dan bel manual.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2.5 text-teal-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Tahap 4: Hari Aktif &amp; Libur</span>
          </div>
          <p className="text-xs text-slate-400">
            Logika prioritas sistem (Hari Libur &gt; Hari Aktif &gt; Jadwal Bel) dan pencatatan riwayat pemutaran otomatis ke spreadsheet.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Tahap 5: Sidebar &amp; Multi-User</span>
          </div>
          <p className="text-xs text-slate-400">
            Sidebar responsif bernavigasi penuh, login autentikasi Admin/Operator (Sheet Pengguna), dan pusat Backup &amp; Restore.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2.5 text-purple-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Deployment Ready</span>
          </div>
          <p className="text-xs text-slate-400">
            Dapat dihosting di Vercel, GitHub Pages, Cloud Run, atau server lokal tanpa backend server terpisah (Zero Server Cost).
          </p>
        </div>

      </div>

      {/* Database Schema Summary (7 Sheets) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Struktur 7 Lembar Kerja Google Spreadsheet</h3>
            <p className="text-xs text-slate-400">Format tabel database yang otomatis diinisialisasi oleh skrip Google Apps Script</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <strong className="text-emerald-400 block mb-1">1. Sheet: Pengaturan</strong>
            <span className="text-slate-400 text-[11px]">Kunci, Nilai, Keterangan, TerakhirDiperbarui</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <strong className="text-amber-400 block mb-1">2. Sheet: JadwalBel</strong>
            <span className="text-slate-400 text-[11px]">ID, Hari, Jam, Keterangan, Tipe, Audio, StatusAktif</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <strong className="text-cyan-400 block mb-1">3. Sheet: SuaraBel</strong>
            <span className="text-slate-400 text-[11px]">ID, NamaSuara, UrlFile, Tipe, StatusAktif, Keterangan</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <strong className="text-teal-400 block mb-1">4. Sheet: HariAktif</strong>
            <span className="text-slate-400 text-[11px]">Hari, Status, JamMasuk, JamPulang, Keterangan</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <strong className="text-rose-400 block mb-1">5. Sheet: HariLibur</strong>
            <span className="text-slate-400 text-[11px]">ID, Tanggal, KeteranganLibur, TipeLibur, StatusAktif</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <strong className="text-purple-400 block mb-1">6. Sheet: RiwayatBel</strong>
            <span className="text-slate-400 text-[11px]">ID, Tanggal, Jam, NamaJadwal, Mode, Status, Keterangan</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-1 md:col-span-2">
            <strong className="text-blue-400 block mb-1">7. Sheet: Pengguna</strong>
            <span className="text-slate-400 text-[11px]">ID, Username, Password, Nama, Role, Status, TerakhirLogin</span>
          </div>
        </div>
      </div>

    </div>
  );
};
