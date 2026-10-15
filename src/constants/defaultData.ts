import {
  SchoolConfig,
  SheetInfo,
  JadwalBelItem,
  BellType,
  SuaraBelItem,
  HariAktifItem,
  HariLiburItem,
  RiwayatBelItem,
  PenggunaItem
} from '../types';

export const DEFAULT_GAS_API_URL = '';

export const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
  namaSekolah: 'SMA / MA Negeri 1 Nusantara',
  npsnNsm: '20123456 / 131234567890',
  tahunPelajaran: '2026/2027',
  alamat: 'Jl. Pendidikan No. 45, Kompleks Madrasah Terpadu, Jakarta',
  kepalaSekolah: 'Dr. H. Ahmad Fauzi, M.Pd.',
  logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80',
  zonaWaktu: 'Asia/Jakarta',
  spreadsheetUrl: '',
  terakhirDiperbarui: new Date().toISOString()
};

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Jakarta', label: 'WIB - Waktu Indonesia Barat (UTC+7)', short: 'WIB', city: 'Jakarta, Sumatera, Jawa, Kalbar, Kalteng' },
  { value: 'Asia/Makassar', label: 'WITA - Waktu Indonesia Tengah (UTC+8)', short: 'WITA', city: 'Bali, NTB, NTT, Kalsel, Kaltim, Kaltara, Sulawesi' },
  { value: 'Asia/Jayapura', label: 'WIT - Waktu Indonesia Timur (UTC+9)', short: 'WIT', city: 'Maluku, Maluku Utara, Papua' }
] as const;

export const HARI_OPTIONS = [
  'Semua Hari',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu'
] as const;

export const ALL_DAYS_WEEK = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu'
] as const;

export const DEFAULT_HARI_AKTIF: HariAktifItem[] = [
  { hari: 'Senin', status: 'Aktif', jamMasuk: '07:00', jamPulang: '15:00', keterangan: 'KBM Reguler & Upacara Bendera' },
  { hari: 'Selasa', status: 'Aktif', jamMasuk: '07:00', jamPulang: '15:00', keterangan: 'KBM Reguler' },
  { hari: 'Rabu', status: 'Aktif', jamMasuk: '07:00', jamPulang: '15:00', keterangan: 'KBM Reguler' },
  { hari: 'Kamis', status: 'Aktif', jamMasuk: '07:00', jamPulang: '15:00', keterangan: 'KBM Reguler' },
  { hari: 'Jumat', status: 'Aktif', jamMasuk: '07:00', jamPulang: '11:45', keterangan: 'KBM Pendek & Shalat Jumat Berjamaah' },
  { hari: 'Sabtu', status: 'Aktif', jamMasuk: '07:00', jamPulang: '13:00', keterangan: 'Ekstrakurikuler & Pengembangan Diri' },
  { hari: 'Minggu', status: 'Nonaktif', jamMasuk: '-', jamPulang: '-', keterangan: 'Libur Akhir Pekan' }
];

export const DEFAULT_HARI_LIBUR: HariLiburItem[] = [
  { id: 'HL-001', tanggal: '2026-08-17', keterangan: 'Hari Kemerdekaan Republik Indonesia', tipeLibur: 'Nasional', statusAktif: true },
  { id: 'HL-002', tanggal: '2026-12-25', keterangan: 'Hari Raya Natal', tipeLibur: 'Nasional', statusAktif: true }
];

export const DEFAULT_USERS: PenggunaItem[] = [
  { id: 'USR-001', username: 'admin', password: '123', nama: 'Administrator Utama', role: 'Admin', status: 'Aktif' },
  { id: 'USR-002', username: 'operator', password: '123', nama: 'Operator Bel Sekolah', role: 'Operator', status: 'Aktif' }
];

export const TIPE_BEL_OPTIONS: { value: BellType; label: string; badgeColor: string }[] = [
  { value: 'Masuk', label: 'Bel Masuk KBM', badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' },
  { value: 'Ganti Jam', label: 'Ganti Jam Pelajaran', badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-700/60' },
  { value: 'Istirahat', label: 'Istirahat / Shalat', badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-700/60' },
  { value: 'Pulang', label: 'Bel Pulang Sekolah', badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-700/60' },
  { value: 'Upacara', label: 'Upacara / Apel Pagi', badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-700/60' },
  { value: 'Khusus', label: 'Kegiatan Khusus', badgeColor: 'bg-slate-800 text-slate-300 border-slate-600/60' }
];

export const STANDARD_SHEET_SPECS: SheetInfo[] = [
  {
    name: 'Pengaturan',
    exists: true,
    rowCount: 8,
    description: 'Menyimpan parameter identitas sekolah, zona waktu, dan konfigurasi sistem',
    headers: ['Kunci', 'Nilai', 'Keterangan', 'TerakhirDiperbarui']
  },
  {
    name: 'JadwalBel',
    exists: true,
    rowCount: 13,
    description: 'Master data jadwal bel KBM (Tahap 2)',
    headers: ['ID', 'Hari', 'Jam', 'Keterangan', 'Tipe', 'Audio', 'StatusAktif']
  },
  {
    name: 'SuaraBel',
    exists: true,
    rowCount: 5,
    description: 'Daftar nada dan berkas suara bel sekolah (Tahap 3)',
    headers: ['ID', 'NamaSuara', 'UrlFile', 'Tipe', 'StatusAktif', 'Keterangan']
  },
  {
    name: 'HariAktif',
    exists: true,
    rowCount: 7,
    description: 'Konfigurasi hari aktif kegiatan KBM (Senin - Minggu)',
    headers: ['Hari', 'Status', 'JamMasuk', 'JamPulang', 'Keterangan']
  },
  {
    name: 'HariLibur',
    exists: true,
    rowCount: 2,
    description: 'Daftar tanggal libur nasional, libur semester, dan khusus',
    headers: ['ID', 'Tanggal', 'KeteranganLibur', 'TipeLibur', 'StatusAktif']
  },
  {
    name: 'RiwayatBel',
    exists: true,
    rowCount: 0,
    description: 'Log catatan audit pemutaran bel otomatis dan manual',
    headers: ['ID', 'Tanggal', 'Jam', 'NamaJadwal', 'Mode', 'Status', 'Keterangan']
  },
  {
    name: 'Pengguna',
    exists: true,
    rowCount: 2,
    description: 'Master data akun pengguna dan role (Admin & Operator)',
    headers: ['ID', 'Username', 'Password', 'Nama', 'Role', 'Status', 'TerakhirLogin']
  }
];

export const DEFAULT_SAMPLE_SCHEDULES: JadwalBelItem[] = [
  { id: 'JB-001', hari: 'Semua Hari', jam: '06:45', keterangan: 'Bel Persiapan Masuk Sekolah', tipe: 'Masuk', audio: 'SB-001', statusAktif: true },
  { id: 'JB-002', hari: 'Senin', jam: '07:00', keterangan: 'Upacara Bendera / Apel Pagi', tipe: 'Upacara', audio: 'SB-002', statusAktif: true },
  { id: 'JB-003', hari: 'Semua Hari', jam: '07:45', keterangan: 'KBM Jam Pelajaran ke-1', tipe: 'Ganti Jam', audio: 'SB-003', statusAktif: true },
  { id: 'JB-004', hari: 'Semua Hari', jam: '08:30', keterangan: 'KBM Jam Pelajaran ke-2', tipe: 'Ganti Jam', audio: 'SB-003', statusAktif: true },
  { id: 'JB-005', hari: 'Semua Hari', jam: '09:15', keterangan: 'KBM Jam Pelajaran ke-3', tipe: 'Ganti Jam', audio: 'SB-003', statusAktif: true },
  { id: 'JB-006', hari: 'Semua Hari', jam: '10:00', keterangan: 'Istirahat Pertama / Dhuha', tipe: 'Istirahat', audio: 'SB-002', statusAktif: true },
  { id: 'JB-007', hari: 'Semua Hari', jam: '10:30', keterangan: 'Bel Masuk Setelah Istirahat 1', tipe: 'Masuk', audio: 'SB-001', statusAktif: true },
  { id: 'JB-008', hari: 'Semua Hari', jam: '11:15', keterangan: 'KBM Jam Pelajaran ke-4', tipe: 'Ganti Jam', audio: 'SB-003', statusAktif: true },
  { id: 'JB-009', hari: 'Semua Hari', jam: '12:00', keterangan: 'Istirahat Kedua & Shalat Dzuhur', tipe: 'Istirahat', audio: 'SB-002', statusAktif: true },
  { id: 'JB-010', hari: 'Semua Hari', jam: '12:45', keterangan: 'Bel Masuk Setelah Istirahat 2', tipe: 'Masuk', audio: 'SB-001', statusAktif: true },
  { id: 'JB-011', hari: 'Semua Hari', jam: '13:30', keterangan: 'KBM Jam Pelajaran ke-5', tipe: 'Ganti Jam', audio: 'SB-003', statusAktif: true },
  { id: 'JB-012', hari: 'Semua Hari', jam: '14:15', keterangan: 'KBM Jam Pelajaran ke-6', tipe: 'Ganti Jam', audio: 'SB-003', statusAktif: true },
  { id: 'JB-013', hari: 'Semua Hari', jam: '15:00', keterangan: 'Bel Pulang Sekolah / Akhir KBM', tipe: 'Pulang', audio: 'SB-001', statusAktif: true }
];

export const DEFAULT_SAMPLE_SOUNDS: SuaraBelItem[] = [
  {
    id: 'SB-001',
    namaSuara: 'Bel Melodi Westminster (Klasik 4 Nada)',
    urlFile: 'preset:westminster',
    tipe: 'Bel Standar',
    statusAktif: true,
    keterangan: 'Melodi klasik lonceng 4 nada (G#-E-F#-B) untuk Masuk & Pulang'
  },
  {
    id: 'SB-002',
    namaSuara: 'Bel Nada Ceria (Triple Chime)',
    urlFile: 'preset:triple_chime',
    tipe: 'Nada Chime',
    statusAktif: true,
    keterangan: 'Nada ceria 3 tingkat (C-E-G) untuk Istirahat & Kegiatan Relaksasi'
  },
  {
    id: 'SB-003',
    namaSuara: 'Bel Ding Dong Sekolah',
    urlFile: 'preset:ding_dong',
    tipe: 'Bel Standar',
    statusAktif: true,
    keterangan: 'Nada ganda Ding Dong lembut untuk Pergantian Jam Pelajaran'
  },
  {
    id: 'SB-004',
    namaSuara: 'Nada Peringatan / Sirine Apel',
    urlFile: 'preset:siren',
    tipe: 'Sirine',
    statusAktif: true,
    keterangan: 'Nada peringatan singkat untuk Apel Pagi, Upacara, atau Pengumuman'
  },
  {
    id: 'SB-005',
    namaSuara: 'Bel MP3 Sekolah Modern (Online)',
    urlFile: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    tipe: 'Bel Standar',
    statusAktif: true,
    keterangan: 'File MP3 audio lonceng sekolah modern'
  }
];

export const PRESET_LOGOS = [
  {
    name: 'Lambang Madrasah Hijau Emas',
    url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80',
    type: 'Madrasah'
  },
  {
    name: 'Emblem Sekolah Biru Akademik',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&auto=format&fit=crop&q=80',
    type: 'Sekolah Umum'
  },
  {
    name: 'Simbol Buku & Obor Pendidikan',
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200&auto=format&fit=crop&q=80',
    type: 'Akademik'
  },
  {
    name: 'Gedung Sekolah Modern',
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=200&auto=format&fit=crop&q=80',
    type: 'Kampus'
  }
];
