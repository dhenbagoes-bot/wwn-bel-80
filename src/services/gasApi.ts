import {
  ApiResponse,
  DatabaseStatus,
  SchoolConfig,
  SheetInfo,
  JadwalBelItem,
  SuaraBelItem,
  HariAktifItem,
  HariLiburItem,
  RiwayatBelItem,
  PenggunaItem,
  UserRole,
  FullBackupData
} from '../types';
import {
  STANDARD_SHEET_SPECS,
  DEFAULT_SAMPLE_SCHEDULES,
  DEFAULT_SAMPLE_SOUNDS,
  DEFAULT_HARI_AKTIF,
  DEFAULT_HARI_LIBUR,
  DEFAULT_USERS
} from '../constants/defaultData';
import { registerSessionAudio } from '../utils/audioPlayer';
import { getSafeTimeZone } from '../utils/timezoneHelper';

// In-memory runtime audio cache for instant playback without browser database
const AUDIO_BASE64_CACHE = new Map<string, string>();

export function cacheAudioDataUrl(idOrUrl: string, dataUrl: string) {
  if (idOrUrl && dataUrl) {
    AUDIO_BASE64_CACHE.set(idOrUrl, dataUrl);
    registerSessionAudio(idOrUrl, dataUrl);
  }
}

export function getCachedAudioDataUrl(idOrUrl: string): string | undefined {
  return AUDIO_BASE64_CACHE.get(idOrUrl);
}

export async function fetchAudioDataUrlFromGAS(apiUrl: string, fileIdOrUrl: string): Promise<{
  success: boolean;
  dataUrl?: string;
  fileName?: string;
  error?: string;
}> {
  if (!fileIdOrUrl) return { success: false, error: 'File audio tidak ditentukan.' };

  // 1. If already a data URI, return immediately
  if (fileIdOrUrl.startsWith('data:')) {
    return { success: true, dataUrl: fileIdOrUrl };
  }

  // 2. Check in-memory runtime cache
  if (AUDIO_BASE64_CACHE.has(fileIdOrUrl)) {
    return { success: true, dataUrl: AUDIO_BASE64_CACHE.get(fileIdOrUrl)! };
  }

  // 3. Extract Drive File ID
  let fileId = fileIdOrUrl.trim();
  if (fileId.startsWith('drive:')) {
    fileId = fileId.replace('drive:', '');
  } else if (fileId.includes('id=')) {
    const match = fileId.match(/id=([a-zA-Z0-9_-]+)/);
    if (match) fileId = match[1];
  } else if (fileId.includes('/d/')) {
    const match = fileId.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) fileId = match[1];
  }

  // If already cached by extracted ID
  if (AUDIO_BASE64_CACHE.has(fileId)) {
    return { success: true, dataUrl: AUDIO_BASE64_CACHE.get(fileId)! };
  }

  if (!apiUrl || !apiUrl.trim().startsWith('http')) {
    return {
      success: false,
      error: 'URL Google Apps Script belum dikonfigurasi untuk memuat audio dari Google Drive.'
    };
  }

  try {
    const url = new URL(apiUrl.trim());
    url.searchParams.set('action', 'getAudioBase64');
    url.searchParams.set('fileId', fileId);
    url.searchParams.set('_t', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Gagal memuat audio dari Google Apps Script (HTTP ${response.status})`);
    }

    const result = await response.json();
    const audioDataUrl = result.dataUrl || result.dataUri;
    if (result.success && audioDataUrl) {
      cacheAudioDataUrl(fileIdOrUrl, audioDataUrl);
      cacheAudioDataUrl(fileId, audioDataUrl);
      return {
        success: true,
        dataUrl: audioDataUrl,
        fileName: result.fileName
      };
    } else {
      return {
        success: false,
        error: result.message || result.error || 'File audio tidak ditemukan di Google Drive.'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal menghubungi Google Apps Script untuk mengambil audio Drive.'
    };
  }
}

export async function testGasConnection(apiUrl: string): Promise<{
  success: boolean;
  latencyMs: number;
  message: string;
  data?: any;
  error?: string;
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) {
    return {
      success: false,
      latencyMs: 0,
      message: 'URL Google Apps Script tidak valid.',
      error: 'Harap masukkan URL Web App yang diawali dengan https://script.google.com/macros/s/...'
    };
  }

  const startTime = performance.now();
  try {
    const url = new URL(apiUrl.trim());
    url.searchParams.set('action', 'ping');
    url.searchParams.set('_t', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      throw new Error(`Server merespons status HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    return {
      success: json.success !== false,
      latencyMs,
      message: json.message || 'Koneksi ke Google Apps Script berhasil.',
      data: json
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      latencyMs,
      message: 'Gagal menghubungi Google Apps Script.',
      error: err.message || 'Kemungkinan masalah CORS atau URL Web App belum diizinkan untuk "Anyone" (Siapa saja).'
    };
  }
}

export async function fetchSchoolDataFromGAS(apiUrl: string): Promise<{
  success: boolean;
  settings?: SchoolConfig;
  jadwal?: JadwalBelItem[];
  suara?: SuaraBelItem[];
  hariAktif?: HariAktifItem[];
  hariLibur?: HariLiburItem[];
  riwayat?: RiwayatBelItem[];
  pengguna?: PenggunaItem[];
  database?: DatabaseStatus;
  error?: string;
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) {
    return {
      success: false,
      error: 'URL Google Apps Script belum dikonfigurasi.'
    };
  }

  const startTime = performance.now();
  try {
    const url = new URL(apiUrl.trim());
    url.searchParams.set('action', 'getAllData');
    url.searchParams.set('_t', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      throw new Error(`Gagal memuat data dari Spreadsheet (HTTP ${response.status})`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      const serverSettings = result.data.settings || {};
      const safeZonaWaktu = getSafeTimeZone(serverSettings.zonaWaktu || serverSettings.zona_waktu);

      // Helper to ensure strictly unique IDs for lists
      const ensureUniqueIds = <T extends { id: string }>(items: T[], prefix: string): T[] => {
        const seen = new Set<string>();
        return items.map((item, idx) => {
          let cleanId = (item.id || '').toString().trim();
          if (!cleanId || seen.has(cleanId)) {
            cleanId = cleanId ? `${cleanId}_${idx + 1}` : `${prefix}-${String(idx + 1).padStart(3, '0')}`;
          }
          while (seen.has(cleanId)) {
            cleanId = `${cleanId}_${Math.floor(Math.random() * 1000)}`;
          }
          seen.add(cleanId);
          return { ...item, id: cleanId };
        });
      };

      const rawJadwal: JadwalBelItem[] = Array.isArray(result.data.jadwal)
        ? result.data.jadwal.map((j: any, idx: number) => ({
            id: (j.id || '').toString().trim() || `JB-${String(idx + 1).padStart(3, '0')}`,
            hari: j.hari || 'Semua Hari',
            jam: j.jam || '07:00',
            keterangan: j.keterangan || '',
            tipe: j.tipe || j.jenis || 'Lainnya',
            audio: j.audio || 'preset:westminster',
            statusAktif: j.statusAktif !== false && (j.status === undefined || j.status === 'Aktif' || j.status === true)
          }))
        : DEFAULT_SAMPLE_SCHEDULES;

      const serverJadwal = ensureUniqueIds(rawJadwal, 'JB');

      const rawSuara: SuaraBelItem[] = Array.isArray(result.data.suara) && result.data.suara.length > 0
        ? result.data.suara.map((s: any, idx: number) => ({
            id: (s.id || '').toString().trim() || `SB-${String(idx + 1).padStart(3, '0')}`,
            namaSuara: s.namaSuara || s.nama || 'Suara Bel',
            urlFile: s.urlFile || s.url || 'preset:westminster',
            tipe: s.tipe || 'Bel Standar',
            statusAktif: s.statusAktif !== false && (s.status === undefined || s.status === 'Aktif' || s.status === true),
            keterangan: s.keterangan || '',
            format: s.format,
            ukuran: s.ukuran
          }))
        : DEFAULT_SAMPLE_SOUNDS;

      const serverSuara = ensureUniqueIds(rawSuara, 'SB');

      const serverHariAktif: HariAktifItem[] = Array.isArray(result.data.hariAktif) && result.data.hariAktif.length > 0
        ? result.data.hariAktif.map((h: any) => ({
            hari: h.hari || 'Senin',
            status: (h.status === 'Nonaktif' || h.statusAktif === false) ? 'Nonaktif' : 'Aktif',
            jamMasuk: h.jamMasuk || '',
            jamPulang: h.jamPulang || '',
            keterangan: h.keterangan || ''
          }))
        : DEFAULT_HARI_AKTIF;

      const rawHariLibur: HariLiburItem[] = Array.isArray(result.data.hariLibur)
        ? result.data.hariLibur.map((hl: any, idx: number) => ({
            id: (hl.id || '').toString().trim() || `HL-${String(idx + 1).padStart(3, '0')}`,
            tanggal: hl.tanggal || '',
            keterangan: hl.keterangan || hl.keteranganLibur || 'Hari Libur',
            tipeLibur: hl.tipeLibur || 'Nasional',
            statusAktif: hl.statusAktif !== false && (hl.status === undefined || hl.status === 'Aktif' || hl.status === true)
          }))
        : DEFAULT_HARI_LIBUR;

      const serverHariLibur = ensureUniqueIds(rawHariLibur, 'HL');

      const rawRiwayat: RiwayatBelItem[] = Array.isArray(result.data.riwayat)
        ? result.data.riwayat.map((r: any, idx: number) => ({
            id: (r.id || '').toString().trim() || `LOG-${String(idx + 1).padStart(3, '0')}`,
            tanggal: r.tanggal || '',
            jam: r.jam || '',
            namaJadwal: r.namaJadwal || 'Bel Sekolah',
            mode: r.mode === 'Manual' ? 'Manual' : 'Otomatis',
            status: r.status === 'Gagal' ? 'Gagal' : 'Berhasil',
            keterangan: r.keterangan || ''
          }))
        : [];

      const serverRiwayat = ensureUniqueIds(rawRiwayat, 'LOG');

      const rawPengguna: PenggunaItem[] = Array.isArray(result.data.pengguna) && result.data.pengguna.length > 0
        ? result.data.pengguna.map((u: any, idx: number) => ({
            id: (u.id || '').toString().trim() || `USR-${String(idx + 1).padStart(3, '0')}`,
            username: u.username || `user_${idx + 1}`,
            password: u.password || '',
            nama: u.nama || u.namaLengkap || u.username || 'Pengguna',
            namaLengkap: u.namaLengkap || u.nama || u.username || 'Pengguna',
            role: (u.role === 'Admin' ? 'Admin' : 'Operator') as UserRole,
            status: (u.status === 'Nonaktif' || u.statusAktif === false) ? 'Nonaktif' : 'Aktif',
            statusAktif: u.statusAktif !== false && u.status !== 'Nonaktif',
            terakhirLogin: u.terakhirLogin || '-'
          }))
        : DEFAULT_USERS;

      const serverPengguna = ensureUniqueIds(rawPengguna, 'USR');

      const serverDb = result.data.database;

      const sheets: SheetInfo[] = STANDARD_SHEET_SPECS.map(spec => {
        const found = Array.isArray(serverDb?.sheets) ? serverDb.sheets.find((s: any) => s.name === spec.name) : null;
        return {
          ...spec,
          exists: found ? !!found.exists : spec.exists,
          rowCount: found && typeof found.rowCount === 'number' ? found.rowCount : spec.rowCount,
          headers: Array.isArray(found?.headers) ? found.headers : spec.headers,
          description: found?.description || spec.description
        };
      });

      return {
        success: true,
        settings: {
          namaSekolah: serverSettings.namaSekolah || serverSettings.nama_sekolah || '',
          npsnNsm: serverSettings.npsnNsm || serverSettings.npsn_nsm || '',
          tahunPelajaran: serverSettings.tahunPelajaran || serverSettings.tahun_pelajaran || '',
          alamat: serverSettings.alamat || '',
          kepalaSekolah: serverSettings.kepalaSekolah || serverSettings.kepala_sekolah || '',
          logoUrl: serverSettings.logoUrl || serverSettings.logo_url || '',
          zonaWaktu: safeZonaWaktu,
          spreadsheetUrl: serverSettings.spreadsheetUrl || serverDb?.spreadsheetUrl || '',
          terakhirDiperbarui: serverSettings.terakhirDiperbarui || new Date().toISOString()
        },
        jadwal: serverJadwal,
        suara: serverSuara,
        hariAktif: serverHariAktif,
        hariLibur: serverHariLibur,
        riwayat: serverRiwayat,
        pengguna: serverPengguna,
        database: {
          connected: true,
          statusText: 'Terhubung ke Google Spreadsheet (100% Cloud)',
          lastChecked: new Date().toLocaleTimeString('id-ID'),
          latencyMs,
          spreadsheetTitle: serverDb?.spreadsheetTitle || 'Database Bel Sekolah',
          spreadsheetId: serverDb?.spreadsheetId,
          sheets
        }
      };
    } else {
      return {
        success: false,
        error: result.error || result.message || 'Format data dari Spreadsheet tidak sesuai.'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Terjadi kesalahan jaringan saat membaca data Google Spreadsheet.'
    };
  }
}

export async function saveSchoolSettingsToGAS(apiUrl: string, config: SchoolConfig): Promise<{
  success: boolean;
  message: string;
  updatedSettings?: SchoolConfig;
  database?: DatabaseStatus;
  error?: string;
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) {
    return { success: false, message: 'Gagal menyimpan', error: 'URL belum diisi.' };
  }

  const startTime = performance.now();
  try {
    const payload = { action: 'saveSettings', settings: config };
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const latencyMs = Math.round(performance.now() - startTime);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: result.message || 'Konfigurasi berhasil disimpan!',
        updatedSettings: { ...config, ...result.data?.settings, terakhirDiperbarui: new Date().toISOString() },
        database: {
          connected: true,
          statusText: 'Tersinkronisasi dengan Google Spreadsheet',
          lastChecked: new Date().toLocaleTimeString('id-ID'),
          latencyMs,
          spreadsheetTitle: result.data?.database?.spreadsheetTitle || 'Database Bel Sekolah',
          sheets: result.data?.database?.sheets || STANDARD_SHEET_SPECS
        }
      };
    } else {
      return { success: false, message: 'Gagal menyimpan', error: result.error || result.message };
    }
  } catch (err: any) {
    return { success: false, message: 'Gagal mengirim data', error: err.message };
  }
}

export async function saveAllJadwalToGAS(apiUrl: string, items: JadwalBelItem[]): Promise<{
  success: boolean;
  message: string;
  jadwal?: JadwalBelItem[];
  database?: DatabaseStatus;
  error?: string;
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) return { success: false, message: 'URL belum diisi.' };
  try {
    const payload = { action: 'saveAllJadwal', jadwal: items };
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    return {
      success: result.success !== false,
      message: result.message || 'Jadwal bel berhasil disimpan!',
      jadwal: result.data?.jadwal || items,
      database: result.data?.database
    };
  } catch (err: any) {
    return { success: false, message: 'Gagal', error: err.message };
  }
}

export async function saveAllSuaraToGAS(apiUrl: string, items: SuaraBelItem[]): Promise<{
  success: boolean;
  message: string;
  suara?: SuaraBelItem[];
  error?: string;
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) return { success: false, message: 'URL belum diisi.' };
  try {
    const payload = { action: 'saveAllSuara', suara: items };
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    const rawSuara = result.data?.suara || items;
    const seen = new Set<string>();
    const safeSuara = Array.isArray(rawSuara)
      ? rawSuara.map((s: any, idx: number) => {
          let cleanId = (s.id || '').toString().trim() || `SB-${String(idx + 1).padStart(3, '0')}`;
          if (seen.has(cleanId)) cleanId = `${cleanId}_${idx + 1}`;
          seen.add(cleanId);
          return { ...s, id: cleanId };
        })
      : items;

    return {
      success: result.success !== false,
      message: result.message || 'Suara bel berhasil disimpan!',
      suara: safeSuara
    };
  } catch (err: any) {
    return { success: false, message: 'Gagal', error: err.message };
  }
}

export async function uploadAudioFileToDriveViaGAS(
  apiUrl: string,
  params: {
    fileName: string;
    base64Data: string;
    mimeType: string;
    namaSuara: string;
    tipe: string;
    keterangan: string;
    ukuran?: string;
  }
): Promise<{
  success: boolean;
  message: string;
  fileId?: string;
  url?: string;
  suara?: SuaraBelItem[];
  newItem?: SuaraBelItem;
  error?: string;
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
  }

  try {
    const payload = {
      action: 'uploadAudioToDrive',
      ...params
    };
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (result.success && result.data) {
      const fileId = result.data.fileId;
      const url = result.data.url;
      // Auto cache base64 for immediate playback without re-downloading
      if (fileId && params.base64Data) {
        cacheAudioDataUrl(fileId, params.base64Data);
      }
      if (url && params.base64Data) {
        cacheAudioDataUrl(url, params.base64Data);
      }

      const rawSuara = result.data.suara;
      const seen = new Set<string>();
      const safeSuara = Array.isArray(rawSuara)
        ? rawSuara.map((s: any, idx: number) => {
            let cleanId = (s.id || '').toString().trim() || `SB-${String(idx + 1).padStart(3, '0')}`;
            if (seen.has(cleanId)) cleanId = `${cleanId}_${idx + 1}`;
            seen.add(cleanId);
            return { ...s, id: cleanId };
          })
        : undefined;

      return {
        success: true,
        message: result.message || 'Audio berhasil diunggah ke Google Drive!',
        fileId: fileId,
        url: url,
        suara: safeSuara,
        newItem: result.data.newItem
      };
    } else {
      return {
        success: false,
        message: result.message || 'Gagal mengunggah ke Google Drive',
        error: result.error
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Gagal mengunggah file audio ke Google Drive.',
      error: err.message
    };
  }
}

export async function uploadLogoToDriveViaGAS(
  apiUrl: string,
  params: {
    fileName: string;
    base64Data: string;
    mimeType: string;
  }
): Promise<{
  success: boolean;
  message: string;
  fileId?: string;
  url?: string;
  error?: string;
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
  }

  try {
    const payload = {
      action: 'uploadLogoToDrive',
      ...params
    };
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (result.success && result.data) {
      return {
        success: true,
        message: result.message || 'Logo berhasil diunggah ke Google Drive!',
        fileId: result.data.fileId,
        url: result.data.url
      };
    } else {
      return {
        success: false,
        message: result.message || 'Gagal mengunggah logo ke Google Drive',
        error: result.error
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Gagal mengunggah logo ke Google Drive.',
      error: err.message
    };
  }
}

export async function saveHariAktifToGAS(apiUrl: string, items: HariAktifItem[]): Promise<{
  success: boolean;
  message: string;
  hariAktif?: HariAktifItem[];
  error?: string;
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) return { success: false, message: 'URL belum diisi.' };
  try {
    const payload = { action: 'saveHariAktif', hariAktif: items };
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    return {
      success: result.success !== false,
      message: result.message || 'Hari aktif berhasil disimpan!',
      hariAktif: result.data?.hariAktif || items
    };
  } catch (err: any) {
    return { success: false, message: 'Gagal', error: err.message };
  }
}

export async function saveAllHariLiburToGAS(apiUrl: string, items: HariLiburItem[]): Promise<{
  success: boolean;
  message: string;
  hariLibur?: HariLiburItem[];
  error?: string;
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) return { success: false, message: 'URL belum diisi.' };
  try {
    const payload = { action: 'saveAllHariLibur', hariLibur: items };
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    return {
      success: result.success !== false,
      message: result.message || 'Daftar hari libur berhasil disimpan!',
      hariLibur: result.data?.hariLibur || items
    };
  } catch (err: any) {
    return { success: false, message: 'Gagal', error: err.message };
  }
}

export async function saveAllPenggunaToGAS(apiUrl: string, items: PenggunaItem[]): Promise<{
  success: boolean;
  message: string;
  pengguna?: PenggunaItem[];
  error?: string;
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) return { success: false, message: 'URL belum diisi.' };
  try {
    const payload = { action: 'saveAllPengguna', pengguna: items };
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    return {
      success: result.success !== false,
      message: result.message || 'Data pengguna berhasil disimpan!',
      pengguna: result.data?.pengguna || items
    };
  } catch (err: any) {
    return { success: false, message: 'Gagal', error: err.message };
  }
}

export async function loginUserViaGAS(apiUrl: string, username: string, password: string): Promise<{
  success: boolean;
  message: string;
  user?: PenggunaItem;
  error?: string;
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) {
    // Fallback in-memory
    const defaultUser = DEFAULT_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (defaultUser && defaultUser.password === password) {
      return {
        success: true,
        message: 'Login berhasil sebagai ' + defaultUser.nama,
        user: defaultUser
      };
    }
    return { success: false, message: 'Username atau kata sandi salah.' };
  }

  try {
    const payload = { action: 'login', username, password };
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    // Backend mengembalikan user di level atas (result.user); dukung juga format lama (result.data.user)
    const rawUser = (result as any).user || result.data?.user;
    const user = rawUser ? {
      id: rawUser.id || '',
      username: rawUser.username || '',
      nama: rawUser.nama || rawUser.namaLengkap || rawUser.username || '',
      namaLengkap: rawUser.namaLengkap || rawUser.nama || '',
      role: rawUser.role === 'Admin' ? 'Admin' : 'Operator',
      status: rawUser.status || (rawUser.statusAktif ? 'Aktif' : 'Nonaktif'),
      statusAktif: typeof rawUser.statusAktif === 'boolean' ? rawUser.statusAktif : rawUser.status === 'Aktif',
      terakhirLogin: rawUser.terakhirLogin || ''
    } as PenggunaItem : undefined;
    return {
      success: result.success !== false,
      message: result.message || (result.success ? 'Login berhasil!' : 'Login gagal.'),
      user,
      error: result.error
    };
  } catch (err: any) {
    return { success: false, message: 'Gagal terhubung ke Google Apps Script', error: err.message };
  }
}

export async function restoreFullBackupToGAS(apiUrl: string, backupData: FullBackupData): Promise<{
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) {
    return { success: false, message: 'URL belum diisi.' };
  }

  try {
    const payload = { action: 'restoreBackup', backup: backupData };
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    return {
      success: result.success !== false,
      message: result.message || 'Database berhasil dipulihkan dari data backup!',
      data: result.data
    };
  } catch (err: any) {
    return { success: false, message: 'Gagal memulihkan backup', error: err.message };
  }
}

export async function addRiwayatLogToGAS(apiUrl: string, entry: Omit<RiwayatBelItem, 'id'>): Promise<{
  success: boolean;
  message: string;
  riwayat?: RiwayatBelItem[];
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) return { success: false, message: 'URL belum diisi.' };
  try {
    const payload = {
      action: 'addRiwayat',
      entry: { ...entry, id: 'LOG-' + Date.now().toString().slice(-6) }
    };
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    return {
      success: result.success !== false,
      message: result.message || 'Riwayat berhasil dicatat.',
      riwayat: result.data?.riwayat
    };
  } catch (err: any) {
    return { success: false, message: 'Gagal' };
  }
}

export async function clearAllRiwayatFromGAS(apiUrl: string): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) return { success: false, message: 'URL belum diisi.' };
  try {
    const payload = { action: 'clearRiwayat' };
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    return {
      success: result.success !== false,
      message: result.message || 'Riwayat berhasil dibersihkan.'
    };
  } catch (err: any) {
    return { success: false, message: 'Gagal', error: err.message };
  }
}

export async function initializeDatabaseSheetsInGAS(apiUrl: string): Promise<{
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) {
    return { success: false, message: 'URL tidak valid.', error: 'Harap atur URL terlebih dahulu.' };
  }

  try {
    const payload = { action: 'initDatabase' };
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    return {
      success: result.success !== false,
      message: result.message || 'Seluruh 7 sheet database berhasil diinisialisasi.',
      data: result.data
    };
  } catch (err: any) {
    return { success: false, message: 'Gagal inisialisasi sheet.', error: err.message };
  }
}
