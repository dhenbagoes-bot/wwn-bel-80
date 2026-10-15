export interface SchoolConfig {
  namaSekolah: string;
  npsnNsm: string;
  tahunPelajaran: string;
  semester?: string;
  alamat: string;
  kepalaSekolah: string;
  nipKepalaSekolah?: string;
  logoUrl: string;
  zonaWaktu: 'Asia/Jakarta' | 'Asia/Makassar' | 'Asia/Jayapura';
  theme?: 'emerald' | 'dark' | 'light';
  suaraDefault?: string;
  durasiBelDefault?: number;
  toleransiWaktuDetik?: number;
  spreadsheetUrl?: string;
  terakhirDiperbarui?: string;
}

export type BellType = 'Masuk' | 'Ganti Jam' | 'Istirahat' | 'Pulang' | 'Upacara' | 'Khusus';

export interface JadwalBelItem {
  id: string;
  hari: string; // 'Semua Hari' | 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'
  jam: string; // Format "HH:mm" (24-jam, e.g. "07:00")
  keterangan: string; // Nama Bel / Kegiatan (e.g. "Bel Masuk", "KBM Jam 1")
  tipe: BellType;
  audio?: string; // ID Suara atau URL Nada
  statusAktif: boolean;
}

export interface SuaraBelItem {
  id: string;
  namaSuara: string;
  urlFile: string; // URL file MP3 atau WAV (atau preset: / local:)
  tipe: string; // 'Bel Standar', 'Nada Chime', 'Lagu/Mars', 'Sirine'
  statusAktif: boolean;
  keterangan?: string;
  format?: 'MP3' | 'WAV' | 'PRESET' | 'UNKNOWN';
  ukuran?: string;
}

export interface HariAktifItem {
  hari: string; // 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
  status: 'Aktif' | 'Nonaktif';
  jamMasuk?: string;
  jamPulang?: string;
  keterangan?: string;
}

export interface HariLiburItem {
  id: string;
  tanggal: string; // 'YYYY-MM-DD'
  keterangan: string; // 'Libur Nasional / Ujian / Libur Semester'
  tipeLibur?: string;
  statusAktif: boolean;
}

export interface RiwayatBelItem {
  id: string;
  tanggal: string; // e.g. '05/10/2026'
  jam: string; // e.g. '07:00:00'
  namaJadwal: string; // e.g. 'Bel Masuk Sekolah'
  mode: 'Otomatis' | 'Manual';
  status: 'Berhasil' | 'Gagal';
  keterangan?: string;
}

export type UserRole = 'Admin' | 'Operator';

export interface PenggunaItem {
  id: string;
  username: string;
  password?: string;
  nama: string;
  namaLengkap?: string;
  role: UserRole;
  status: 'Aktif' | 'Nonaktif';
  statusAktif?: boolean;
  terakhirLogin?: string;
}

export interface AuthSession {
  isLoggedIn: boolean;
  user: PenggunaItem | null;
}

export type ActiveAppView =
  | 'dashboard'
  | 'jadwal'
  | 'suara'
  | 'hariAktif'
  | 'hariLibur'
  | 'riwayat'
  | 'konfigurasi'
  | 'backup'
  | 'pengguna'
  | 'tentang';

export type AppTheme = 'light' | 'dark' | 'emerald';

export interface SheetInfo {
  name: 'Pengaturan' | 'JadwalBel' | 'SuaraBel' | 'HariAktif' | 'HariLibur' | 'RiwayatBel' | 'Pengguna' | string;
  exists: boolean;
  rowCount: number;
  description: string;
  headers: string[];
}

export interface DatabaseStatus {
  connected: boolean;
  statusText: string;
  lastChecked: string | null;
  latencyMs: number | null;
  spreadsheetTitle?: string;
  spreadsheetId?: string;
  sheets: SheetInfo[];
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface ActiveRingingBell {
  id: string;
  namaJadwal: string;
  jam: string;
  mode: 'Otomatis' | 'Manual';
  timestamp: string;
}

export interface FullBackupData {
  version: string;
  exportDate: string;
  appName: string;
  settings: SchoolConfig;
  jadwal: JadwalBelItem[];
  suara: SuaraBelItem[];
  hariAktif: HariAktifItem[];
  hariLibur: HariLiburItem[];
  pengguna: PenggunaItem[];
  riwayat?: RiwayatBelItem[];
}

export interface SchoolEntry {
  id: string;
  nama: string;
  apiUrl: string;
  kota?: string;
}
