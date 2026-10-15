/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ClockCard } from './components/ClockCard';
import { AudioActivationBanner } from './components/AudioActivationBanner';
import { ManualBellCard } from './components/ManualBellCard';
import { CurrentNextScheduleCard } from './components/CurrentNextScheduleCard';
import { ScheduleManagementView } from './components/ScheduleManagementView';
import { SoundManagementView } from './components/SoundManagementView';
import { HariAktifView } from './components/HariAktifView';
import { HariLiburView } from './components/HariLiburView';
import { RiwayatBelView } from './components/RiwayatBelView';
import { UserManagementView } from './components/UserManagementView';
import { BackupExportView } from './components/BackupExportView';
import { AboutView } from './components/AboutView';
import { SchoolIdentityCard } from './components/SchoolIdentityCard';
import { DatabaseStatusCard } from './components/DatabaseStatusCard';
import { RiwayatBelCard } from './components/RiwayatBelCard';
import { BellRingingPopup } from './components/BellRingingPopup';
import { ConfigModal } from './components/ConfigModal';
import { ScriptGuideModal } from './components/ScriptGuideModal';
import { LoginModal } from './components/LoginModal';
import { SchoolPickerModal } from './components/SchoolPickerModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  SchoolConfig,
  DatabaseStatus,
  JadwalBelItem,
  SuaraBelItem,
  HariAktifItem,
  HariLiburItem,
  RiwayatBelItem,
  PenggunaItem,
  ActiveAppView,
  AuthSession,
  ActiveRingingBell,
  FullBackupData,
  SchoolEntry
} from './types';
import {
  DEFAULT_SCHOOL_CONFIG,
  DEFAULT_GAS_API_URL,
  STANDARD_SHEET_SPECS,
  DEFAULT_SAMPLE_SCHEDULES,
  DEFAULT_SAMPLE_SOUNDS,
  DEFAULT_HARI_AKTIF,
  DEFAULT_HARI_LIBUR,
  DEFAULT_USERS
} from './constants/defaultData';
import {
  fetchSchoolDataFromGAS,
  saveSchoolSettingsToGAS,
  saveAllJadwalToGAS,
  saveAllSuaraToGAS,
  uploadAudioFileToDriveViaGAS,
  saveHariAktifToGAS,
  saveAllHariLiburToGAS,
  saveAllPenggunaToGAS,
  restoreFullBackupToGAS,
  addRiwayatLogToGAS,
  clearAllRiwayatFromGAS,
  initializeDatabaseSheetsInGAS
} from './services/gasApi';
import { calculateRealtimeSchedule, normalizeDateToYYYYMMDD } from './utils/scheduleCalculator';
import {
  unlockAndTestAudio,
  playBellAudio,
  stopCurrentBellAudio,
  isAudioActive,
  setAudioEngineGasUrl,
  registerSessionAudio,
  prefetchAndCacheDriveSounds
} from './utils/audioPlayer';
import {
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  School,
  Copy,
  Bell,
  Clock,
  LayoutDashboard,
  Volume2,
  Users,
  HardDriveDownload,
  Info
} from 'lucide-react';

function AppContent() {
  const { themeClasses, isLight, setTheme } = useTheme();

  const getInitialApiUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('api') || params.get('gas');
      if (urlParam) return decodeURIComponent(urlParam);
    }
    const envUrl = (import.meta as any).env?.VITE_GAS_API_URL || (import.meta as any).env?.VITE_API_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().startsWith('http')) {
      return envUrl.trim();
    }
    return DEFAULT_GAS_API_URL;
  };

  const [apiUrl, setApiUrl] = useState<string>(getInitialApiUrl);
  const [cloudLoadState, setCloudLoadState] = useState<'idle' | 'loading' | 'success' | 'error'>(() => {
    const init = getInitialApiUrl();
    return init ? 'loading' : 'idle';
  });
  const [quickApiInput, setQuickApiInput] = useState<string>('');
  const [config, setConfig] = useState<SchoolConfig>(DEFAULT_SCHOOL_CONFIG);
  const [jadwalList, setJadwalList] = useState<JadwalBelItem[]>(DEFAULT_SAMPLE_SCHEDULES);
  const [suaraList, setSuaraList] = useState<SuaraBelItem[]>(DEFAULT_SAMPLE_SOUNDS);
  const [hariAktifList, setHariAktifList] = useState<HariAktifItem[]>(DEFAULT_HARI_AKTIF);
  const [hariLiburList, setHariLiburList] = useState<HariLiburItem[]>(DEFAULT_HARI_LIBUR);
  const [riwayatList, setRiwayatList] = useState<RiwayatBelItem[]>([]);
  const [usersList, setUsersList] = useState<PenggunaItem[]>(DEFAULT_USERS);

  // Multi-sekolah: daftar sekolah dari public/schools.json (satu alamat untuk banyak sekolah)
  const [schoolList, setSchoolList] = useState<SchoolEntry[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [isSchoolPickerOpen, setIsSchoolPickerOpen] = useState(false);
  const SCHOOL_STORAGE_KEY = 'wwn-bel-80:school-id';

  const readStoredSchoolId = (): string | null => {
    try {
      return window.localStorage.getItem(SCHOOL_STORAGE_KEY);
    } catch {
      return null;
    }
  };

  const writeStoredSchoolId = (id: string | null) => {
    try {
      if (id) window.localStorage.setItem(SCHOOL_STORAGE_KEY, id);
      else window.localStorage.removeItem(SCHOOL_STORAGE_KEY);
    } catch {
      /* abaikan jika penyimpanan tidak tersedia */
    }
  };

  const applySchoolSelection = (school: SchoolEntry, silent: boolean = false) => {
    setSelectedSchoolId(school.id);
    writeStoredSchoolId(school.id);
    setApiUrl(school.apiUrl);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set('api', school.apiUrl);
      window.history.replaceState({}, '', url.toString());
    }
    if (!silent) {
      addToast('success', 'Sekolah Terhubung', `${school.nama} berhasil dihubungkan.`);
    }
  };

  const handleSelectSchool = (school: SchoolEntry) => {
    setIsSchoolPickerOpen(false);
    applySchoolSelection(school);
  };

  // Muat daftar sekolah saat aplikasi dibuka
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('schools.json', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        const valid: SchoolEntry[] = data.filter(
          (s: any) => s && typeof s.id === 'string' && typeof s.nama === 'string' && typeof s.apiUrl === 'string' && s.apiUrl.startsWith('http')
        );
        if (valid.length === 0) return;
        setSchoolList(valid);

        // Prioritas: parameter ?api= > sekolah tersimpan > tampilkan pilihan
        const params = new URLSearchParams(window.location.search);
        const urlParam = params.get('api') || params.get('gas');
        if (urlParam) {
          const matched = valid.find(s => s.apiUrl === decodeURIComponent(urlParam));
          if (matched) {
            setSelectedSchoolId(matched.id);
            writeStoredSchoolId(matched.id);
          }
          return;
        }
        const storedId = readStoredSchoolId();
        const stored = storedId ? valid.find(s => s.id === storedId) : undefined;
        if (stored) {
          applySchoolSelection(stored, true);
        } else {
          setIsSchoolPickerOpen(true);
        }
      } catch {
        /* schools.json tidak ada / tidak valid -> mode konfigurasi manual seperti biasa */
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Authentication State
  const [authSession, setAuthSession] = useState<AuthSession>({
    isLoggedIn: true,
    user: DEFAULT_USERS[0] // Default Administrator session for immediate ease of use
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Navigation and Sidebar View State
  const [activeView, setActiveView] = useState<ActiveAppView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    connected: false,
    statusText: 'Belum Terhubung ke Google Spreadsheet',
    lastChecked: null,
    latencyMs: null,
    spreadsheetTitle: 'Belum Dikonfigurasi',
    sheets: STANDARD_SHEET_SPECS
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializingSheets, setIsInitializingSheets] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Audio Engine State
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isActivatingAudio, setIsActivatingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingSoundUrl, setPlayingSoundUrl] = useState<string | null>(null);
  const [activeRingingBell, setActiveRingingBell] = useState<ActiveRingingBell | null>(null);

  // Set of triggered bells today: "id_YYYY-MM-DD_HH:mm"
  const triggeredBellsRef = useRef<Set<string>>(new Set());

  // 1-second interval timer
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Unlock / Activate Audio
  const handleActivateAudio = async () => {
    setIsActivatingAudio(true);
    try {
      const res = await unlockAndTestAudio();
      if (res.success) {
        setIsAudioReady(true);
        addToast('success', '🟢 AUDIO AKTIF', res.message);
      } else {
        setIsAudioReady(false);
        addToast('error', '🔴 AUDIO BELUM AKTIF', res.message);
      }
    } catch (err: any) {
      setIsAudioReady(false);
      addToast('error', 'Gagal Mengaktifkan Audio', err.message);
    } finally {
      setIsActivatingAudio(false);
    }
  };

  const handleStopBell = () => {
    stopCurrentBellAudio();
    setIsPlayingAudio(false);
    setPlayingSoundUrl(null);
    setActiveRingingBell(null);
  };

  // Play Bell Sound Helper & Log to RiwayatBel
  const executePlayBell = useCallback(async (
    soundSource: string,
    namaJadwal: string,
    mode: 'Otomatis' | 'Manual'
  ): Promise<boolean> => {
    if (isPlayingAudio) return false;

    setIsPlayingAudio(true);
    setPlayingSoundUrl(soundSource);

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('id-ID');
    const dateFormatted = now.toLocaleDateString('id-ID');

    setActiveRingingBell({
      id: `BELL-${Date.now()}`,
      namaJadwal,
      jam: timeFormatted,
      mode,
      timestamp: now.toISOString()
    });

    try {
      const result = await playBellAudio(soundSource, () => {
        setIsPlayingAudio(false);
        setPlayingSoundUrl(null);
        setTimeout(() => setActiveRingingBell(null), 3000);
      });

      if (result.success) {
        const logEntry = {
          tanggal: dateFormatted,
          jam: timeFormatted,
          namaJadwal,
          mode,
          status: 'Berhasil' as const,
          keterangan: mode === 'Otomatis' ? 'Sesuai Jadwal KBM' : `Manual oleh ${authSession.user?.nama || 'Operator'}`
        };

        setRiwayatList(prev => [
          { id: `LOG-${Date.now().toString().slice(-6)}`, ...logEntry },
          ...prev.slice(0, 99)
        ]);

        if (apiUrl) {
          addRiwayatLogToGAS(apiUrl, logEntry).catch(() => {});
        }

        return true;
      } else {
        setIsPlayingAudio(false);
        setPlayingSoundUrl(null);
        setActiveRingingBell(null);
        addToast('error', 'Gagal Memutar Audio', result.error || 'Periksa izin audio browser.');
        return false;
      }
    } catch (err: any) {
      setIsPlayingAudio(false);
      setPlayingSoundUrl(null);
      setActiveRingingBell(null);
      addToast('error', 'Kesalahan Audio', err.message);
      return false;
    }
  }, [isPlayingAudio, apiUrl, authSession, addToast]);

  // Real-time calculation result including Holidays & Active Days rules
  const calcResult = useMemo(() => {
    return calculateRealtimeSchedule(jadwalList, hariAktifList, hariLiburList, config.zonaWaktu, currentTime);
  }, [jadwalList, hariAktifList, hariLiburList, config.zonaWaktu, currentTime]);

  // Master 1-second Tick & Automatic Bell Detection
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const hourFormatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: config.zonaWaktu || 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const parts = hourFormatter.formatToParts(now);
      const curHour = parts.find(p => p.type === 'hour')?.value || '00';
      const curMin = parts.find(p => p.type === 'minute')?.value || '00';
      const curSec = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);
      const currentHHmm = `${curHour}:${curMin}`;

      const dayFormatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: config.zonaWaktu || 'Asia/Jakarta',
        weekday: 'long'
      });
      const currentDay = dayFormatter.format(now);
      const todayYYYYMMDD = normalizeDateToYYYYMMDD(now, config.zonaWaktu);

      // Check if automatic bell is triggered at the start of each minute
      if (curSec <= 3) {
        // 1. PRIORITAS 1: Cek Hari Libur
        const isTodayHoliday = hariLiburList.some(
          hl => hl.statusAktif && (hl.tanggal === todayYYYYMMDD || hl.tanggal === now.toLocaleDateString('id-ID'))
        );
        if (isTodayHoliday) {
          return; // STOP! Hari Libur -> Jangan jalankan bel otomatis!
        }

        // 2. PRIORITAS 2: Cek Hari Aktif
        const dayConfig = hariAktifList.find(h => h.hari.toLowerCase() === currentDay.toLowerCase());
        const isDayActive = dayConfig ? dayConfig.status === 'Aktif' : currentDay !== 'Minggu';
        if (!isDayActive) {
          return; // STOP! Hari Nonaktif -> Jangan jalankan bel otomatis!
        }

        // 3. PRIORITAS 3: Hari Sekolah Aktif -> Cek JadwalBel
        const matchingSchedules = jadwalList.filter(s =>
          s.statusAktif &&
          (s.hari === 'Semua Hari' || s.hari.toLowerCase() === currentDay.toLowerCase()) &&
          s.jam === currentHHmm
        );

        for (const schedule of matchingSchedules) {
          const triggerKey = `${schedule.id}_${todayYYYYMMDD}_${schedule.jam}`;

          if (!triggeredBellsRef.current.has(triggerKey)) {
            triggeredBellsRef.current.add(triggerKey);

            if (!isAudioActive()) {
              addToast(
                'warning',
                '⚠️ WAKTU BEL TIBA (AUDIO BELUM AKTIF)',
                `Jadwal "${schedule.keterangan}" (${schedule.jam}) telah tiba, namun Audio belum diaktifkan. Klik Aktifkan Audio di Dashboard!`
              );
            } else {
              let soundSource = 'preset:westminster';
              const schedAudio = schedule.audio;
              if (schedAudio) {
                const foundSound = suaraList.find(s =>
                  s.id === schedAudio ||
                  s.namaSuara.toLowerCase() === schedAudio.toLowerCase() ||
                  s.urlFile === schedAudio
                );
                if (foundSound && foundSound.statusAktif) {
                  soundSource = foundSound.urlFile;
                } else if (schedAudio.startsWith('http') || schedAudio.startsWith('preset:') || schedAudio.startsWith('data:')) {
                  soundSource = schedAudio;
                }
              }
              executePlayBell(soundSource, schedule.keterangan, 'Otomatis');
            }
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [jadwalList, suaraList, hariAktifList, hariLiburList, config.zonaWaktu, executePlayBell, addToast]);

  // Sync audio engine GAS API URL
  useEffect(() => {
    if (apiUrl) {
      setAudioEngineGasUrl(apiUrl);
    }
  }, [apiUrl]);

  // Upload audio to Google Drive & Google Spreadsheet
  const handleUploadAudioToDrive = async (params: {
    fileName: string;
    base64Data: string;
    mimeType: string;
    namaSuara: string;
    tipe: string;
    keterangan: string;
    ukuran?: string;
  }): Promise<{ success: boolean; url?: string; message?: string }> => {
    if (!apiUrl || !apiUrl.trim().startsWith('http')) {
      return {
        success: false,
        message: 'Harap konfigurasi URL Google Apps Script di menu Konfigurasi Sistem terlebih dahulu.'
      };
    }

    setIsSaving(true);
    try {
      const res = await uploadAudioFileToDriveViaGAS(apiUrl, params);
      if (res.success) {
        if (res.suara) setSuaraList(res.suara);
        if (params.base64Data) {
          if (res.url) registerSessionAudio(res.url, params.base64Data);
          if (res.fileId) registerSessionAudio(res.fileId, params.base64Data);
          if (params.fileName) registerSessionAudio(params.fileName, params.base64Data);
        }
        addToast('success', 'Upload Cloud Berhasil', res.message || 'Audio tersimpan di Google Drive & dicatat di Google Spreadsheet.');
        setIsSaving(false);
        return { success: true, url: res.url, message: res.message };
      } else {
        addToast('error', 'Gagal Upload ke Drive', res.error || res.message || 'Terjadi kesalahan.');
        setIsSaving(false);
        return { success: false, message: res.error || res.message };
      }
    } catch (err: any) {
      addToast('error', 'Kesalahan Jaringan', err.message);
      setIsSaving(false);
      return { success: false, message: err.message };
    }
  };

  // Sync data from Google Apps Script / Spreadsheet
  const syncDataFromSpreadsheet = useCallback(async (targetApiUrl?: string, silent = false) => {
    const activeUrl = targetApiUrl !== undefined ? targetApiUrl : apiUrl;
    if (!activeUrl || !activeUrl.trim().startsWith('http')) {
      setCloudLoadState('idle');
      setDbStatus(prev => ({
        ...prev,
        connected: false,
        statusText: 'URL Google Apps Script belum diisi'
      }));
      return;
    }

    if (!silent) {
      setIsSyncing(true);
      setCloudLoadState('loading');
    }

    try {
      const res = await fetchSchoolDataFromGAS(activeUrl);
      if (res.success) {
        setCloudLoadState('success');
        if (res.settings) {
          setConfig(res.settings);
          if (res.settings.theme && (res.settings.theme === 'light' || res.settings.theme === 'dark' || res.settings.theme === 'emerald')) {
            setTheme(res.settings.theme);
          }
        }
        if (res.jadwal && Array.isArray(res.jadwal)) setJadwalList(res.jadwal);
        if (res.suara && Array.isArray(res.suara)) {
          setSuaraList(res.suara);
          prefetchAndCacheDriveSounds(res.suara, activeUrl);
        }
        if (res.hariAktif && Array.isArray(res.hariAktif)) setHariAktifList(res.hariAktif);
        if (res.hariLibur && Array.isArray(res.hariLibur)) setHariLiburList(res.hariLibur);
        if (res.riwayat && Array.isArray(res.riwayat)) setRiwayatList(res.riwayat);
        if (res.pengguna && Array.isArray(res.pengguna)) setUsersList(res.pengguna);
        if (res.database) {
          setDbStatus(res.database);
        } else {
          setDbStatus(prev => ({
            ...prev,
            connected: true,
            statusText: 'Terhubung ke Google Spreadsheet (100% Cloud)',
            lastChecked: new Date().toLocaleTimeString('id-ID')
          }));
        }
        if (!silent) {
          addToast('success', 'Sinkronisasi Berhasil', 'Seluruh data 7 sheet berhasil dimuat dari Google Spreadsheet.');
        }
      } else {
        setCloudLoadState('error');
        setDbStatus(prev => ({
          ...prev,
          connected: false,
          statusText: 'CLOUD TERPUTUS',
          error: res.error
        }));
        if (!silent) {
          addToast('error', 'Gagal Membaca Data', res.error || 'Data cloud gagal dimuat. Data lama tidak diubah.');
        }
      }
    } catch (err: any) {
      setCloudLoadState('error');
      setDbStatus(prev => ({
        ...prev,
        connected: false,
        statusText: 'CLOUD TERPUTUS',
        error: err.message
      }));
      if (!silent) {
        addToast('error', 'Kesalahan Jaringan', err.message);
      }
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, [apiUrl, addToast]);

  const handleQuickConnect = (urlToConnect: string) => {
    const cleanUrl = urlToConnect.trim();
    if (!cleanUrl || !cleanUrl.startsWith('http')) {
      addToast('error', 'URL Tidak Valid', 'Harap masukkan URL Google Apps Script yang diawali https://script.google.com/...');
      return;
    }
    setApiUrl(cleanUrl);
    const matched = schoolList.find(s => s.apiUrl === cleanUrl);
    if (matched) {
      setSelectedSchoolId(matched.id);
      writeStoredSchoolId(matched.id);
    } else {
      setSelectedSchoolId(null);
      writeStoredSchoolId(null);
    }
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set('api', cleanUrl);
      window.history.replaceState({}, '', url.toString());
    }
    syncDataFromSpreadsheet(cleanUrl);
  };

  useEffect(() => {
    if (!apiUrl) return;

    // 1. Initial Auto-Sync immediately upon app opening / refresh
    syncDataFromSpreadsheet(apiUrl);

    // 2. Multi-device realtime cloud auto-polling every 20 seconds
    const pollTimer = setInterval(() => {
      syncDataFromSpreadsheet(apiUrl, true);
    }, 20000);

    // 3. Tab visibility & focus re-sync (fetches fresh cloud data when switching back to app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncDataFromSpreadsheet(apiUrl, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [apiUrl, syncDataFromSpreadsheet]);

  // Save Settings
  const handleSaveConfig = async (newConfig: SchoolConfig, newApiUrl: string): Promise<boolean> => {
    setIsSaving(true);
    try {
      if (newApiUrl !== apiUrl) {
        setApiUrl(newApiUrl);
        if (typeof window !== 'undefined' && window.history) {
          const url = new URL(window.location.href);
          if (newApiUrl) url.searchParams.set('api', newApiUrl);
          else url.searchParams.delete('api');
          window.history.replaceState({}, '', url.toString());
        }
        // Jika URL manual tidak cocok dengan sekolah terpilih, lepas pilihan sekolah
        const matched = schoolList.find(s => s.apiUrl === newApiUrl.trim());
        if (matched) {
          setSelectedSchoolId(matched.id);
          writeStoredSchoolId(matched.id);
        } else {
          setSelectedSchoolId(null);
          writeStoredSchoolId(null);
        }
      }

      if (!newApiUrl || !newApiUrl.trim().startsWith('http')) {
        setConfig(newConfig);
        addToast('warning', 'Tersimpan Sementara', 'Konfigurasi disimpan di browser.');
        setIsSaving(false);
        return true;
      }

      const res = await saveSchoolSettingsToGAS(newApiUrl, newConfig);
      if (res.success) {
        const updated = res.updatedSettings || newConfig;
        setConfig(updated);
        if (updated.theme && (updated.theme === 'light' || updated.theme === 'dark' || updated.theme === 'emerald')) {
          setTheme(updated.theme);
        }
        if (res.database) setDbStatus(res.database);
        addToast('success', 'Berhasil Disimpan!', 'Konfigurasi identitas sekolah dan tema tersimpan ke Google Spreadsheet.');
        setIsSaving(false);
        return true;
      } else {
        addToast('error', 'Gagal Menyimpan', res.error || 'Pastikan izin Web App diatur ke Anyone.');
        setIsSaving(false);
        return false;
      }
    } catch (err: any) {
      addToast('error', 'Kesalahan Sistem', err.message);
      setIsSaving(false);
      return false;
    }
  };

  // Jadwal CRUD
  const handleSaveAllJadwal = async (items: JadwalBelItem[]): Promise<boolean> => {
    setIsSaving(true);
    try {
      if (!apiUrl || !apiUrl.trim().startsWith('http')) {
        setJadwalList(items);
        addToast('warning', 'Tersimpan Sementara', 'Jadwal diperbarui di browser.');
        setIsSaving(false);
        return true;
      }
      const res = await saveAllJadwalToGAS(apiUrl, items);
      if (res.success) {
        setJadwalList(res.jadwal || items);
        if (res.database) setDbStatus(res.database);
        addToast('success', 'Jadwal Disimpan', 'Seluruh jadwal bel berhasil diperbarui di Google Spreadsheet.');
        setIsSaving(false);
        return true;
      } else {
        addToast('error', 'Gagal Menyimpan Jadwal', res.error || 'Terjadi kesalahan saat menyimpan jadwal.');
        setIsSaving(false);
        return false;
      }
    } catch (err: any) {
      addToast('error', 'Gagal Eksekusi', err.message || 'Terjadi kesalahan.');
      setIsSaving(false);
      return false;
    }
  };

  const handleAddOrUpdateJadwal = async (item: JadwalBelItem): Promise<boolean> => {
    const existingIdx = jadwalList.findIndex(j => j.id === item.id);
    let newList: JadwalBelItem[];
    if (existingIdx >= 0) {
      newList = [...jadwalList];
      newList[existingIdx] = item;
    } else {
      newList = [...jadwalList, item];
    }
    newList.sort((a, b) => (a.jam || '').localeCompare(b.jam || ''));
    return await handleSaveAllJadwal(newList);
  };

  const handleDeleteJadwal = async (id: string): Promise<boolean> => {
    const newList = jadwalList.filter(j => j.id !== id);
    return await handleSaveAllJadwal(newList);
  };

  const handleToggleJadwalStatus = async (id: string, newStatus: boolean): Promise<boolean> => {
    const newList = jadwalList.map(j => (j.id === id ? { ...j, statusAktif: newStatus } : j));
    return await handleSaveAllJadwal(newList);
  };

  // Suara Bel CRUD
  const handleSaveAllSuara = async (items: SuaraBelItem[]): Promise<boolean> => {
    setIsSaving(true);
    try {
      if (!apiUrl || !apiUrl.trim().startsWith('http')) {
        setSuaraList(items);
        addToast('warning', 'Tersimpan Sementara', 'Daftar suara diperbarui di browser.');
        setIsSaving(false);
        return true;
      }
      const res = await saveAllSuaraToGAS(apiUrl, items);
      if (res.success) {
        setSuaraList(res.suara || items);
        addToast('success', 'Suara Bel Disimpan', 'Daftar suara bel berhasil disimpan ke Google Spreadsheet.');
        setIsSaving(false);
        return true;
      } else {
        addToast('error', 'Gagal Menyimpan Suara', res.error || 'Terjadi kesalahan saat menyimpan suara.');
        setIsSaving(false);
        return false;
      }
    } catch (err: any) {
      addToast('error', 'Gagal Eksekusi', err.message);
      setIsSaving(false);
      return false;
    }
  };

  // Hari Aktif CRUD
  const handleSaveHariAktif = async (items: HariAktifItem[]): Promise<boolean> => {
    setIsSaving(true);
    try {
      if (!apiUrl || !apiUrl.trim().startsWith('http')) {
        setHariAktifList(items);
        addToast('warning', 'Tersimpan Sementara', 'Konfigurasi hari aktif diperbarui di browser.');
        setIsSaving(false);
        return true;
      }
      const res = await saveHariAktifToGAS(apiUrl, items);
      if (res.success) {
        setHariAktifList(res.hariAktif || items);
        addToast('success', 'Hari Aktif Disimpan', 'Konfigurasi hari aktif sekolah berhasil disimpan ke Google Spreadsheet.');
        setIsSaving(false);
        return true;
      } else {
        addToast('error', 'Gagal Menyimpan', res.error || 'Terjadi kesalahan pada spreadsheet.');
        setIsSaving(false);
        return false;
      }
    } catch (err: any) {
      addToast('error', 'Gagal Eksekusi', err.message);
      setIsSaving(false);
      return false;
    }
  };

  // Hari Libur CRUD
  const handleSaveHariLibur = async (items: HariLiburItem[]): Promise<boolean> => {
    setIsSaving(true);
    try {
      if (!apiUrl || !apiUrl.trim().startsWith('http')) {
        setHariLiburList(items);
        addToast('warning', 'Tersimpan Sementara', 'Hari libur diperbarui di browser.');
        setIsSaving(false);
        return true;
      }
      const res = await saveAllHariLiburToGAS(apiUrl, items);
      if (res.success) {
        setHariLiburList(res.hariLibur || items);
        addToast('success', 'Hari Libur Disimpan', 'Daftar hari libur berhasil disimpan ke Google Spreadsheet.');
        setIsSaving(false);
        return true;
      } else {
        addToast('error', 'Gagal Menyimpan', res.error || 'Terjadi kesalahan pada spreadsheet.');
        setIsSaving(false);
        return false;
      }
    } catch (err: any) {
      addToast('error', 'Gagal Eksekusi', err.message);
      setIsSaving(false);
      return false;
    }
  };

  // Users CRUD
  const handleSaveUsers = async (newUsers: PenggunaItem[]): Promise<void> => {
    setIsSaving(true);
    try {
      if (!apiUrl || !apiUrl.trim().startsWith('http')) {
        setUsersList(newUsers);
        addToast('warning', 'Tersimpan Lokal', 'Data pengguna disimpan pada browser.');
        setIsSaving(false);
        return;
      }

      const res = await saveAllPenggunaToGAS(apiUrl, newUsers);
      if (res.success) {
        setUsersList(res.pengguna || newUsers);
        addToast('success', 'Pengguna Disimpan', 'Data pengguna berhasil disimpan ke sheet Pengguna di Google Spreadsheet.');
      } else {
        addToast('error', 'Gagal Menyimpan Pengguna', res.error || 'Terjadi kesalahan.');
      }
    } catch (err: any) {
      addToast('error', 'Gagal', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Restore Backup
  const handleRestoreBackup = async (backup: FullBackupData): Promise<void> => {
    setIsSaving(true);
    try {
      if (backup.settings) setConfig(backup.settings);
      if (backup.jadwal && Array.isArray(backup.jadwal)) setJadwalList(backup.jadwal);
      if (backup.suara && Array.isArray(backup.suara)) setSuaraList(backup.suara);
      if (backup.hariAktif && Array.isArray(backup.hariAktif)) setHariAktifList(backup.hariAktif);
      if (backup.hariLibur && Array.isArray(backup.hariLibur)) setHariLiburList(backup.hariLibur);
      if (backup.pengguna && Array.isArray(backup.pengguna)) setUsersList(backup.pengguna);
      if (backup.riwayat && Array.isArray(backup.riwayat)) setRiwayatList(backup.riwayat);

      if (apiUrl && apiUrl.trim().startsWith('http')) {
        const res = await restoreFullBackupToGAS(apiUrl, backup);
        if (res.success) {
          addToast('success', 'Pemulihan Berhasil', 'Seluruh data backup berhasil dipulihkan dan disinkronkan ke Google Spreadsheet.');
        } else {
          addToast('warning', 'Pemulihan Lokal Selesai', 'Data dipulihkan di aplikasi, namun gagal memperbarui Spreadsheet: ' + res.error);
        }
      } else {
        addToast('success', 'Pemulihan Berhasil', 'Data cadangan berhasil dimuat ke aplikasi.');
      }
    } catch (err: any) {
      addToast('error', 'Gagal Pemulihan', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Force Sync All Local to GAS
  const handleForceSyncAllToGAS = async (): Promise<void> => {
    if (!apiUrl || !apiUrl.trim().startsWith('http')) {
      addToast('warning', 'URL Belum Diisi', 'Atur URL Google Apps Script di menu Konfigurasi terlebih dahulu.');
      return;
    }
    setIsSyncing(true);
    try {
      await saveSchoolSettingsToGAS(apiUrl, config);
      await saveAllJadwalToGAS(apiUrl, jadwalList);
      await saveAllSuaraToGAS(apiUrl, suaraList);
      await saveHariAktifToGAS(apiUrl, hariAktifList);
      await saveAllHariLiburToGAS(apiUrl, hariLiburList);
      await saveAllPenggunaToGAS(apiUrl, usersList);
      addToast('success', 'Sinkronisasi Penuh Selesai', 'Seluruh 7 sheet di Google Spreadsheet telah diselaraskan dengan data terbaru.');
      await syncDataFromSpreadsheet(apiUrl);
    } catch (err: any) {
      addToast('error', 'Gagal Sinkronisasi', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Clear Riwayat Log
  const handleClearRiwayat = async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      if (!apiUrl || !apiUrl.trim().startsWith('http')) {
        setRiwayatList([]);
        addToast('info', 'Riwayat Dibersihkan', 'Riwayat lokal telah dibersihkan.');
        setIsSaving(false);
        return true;
      }
      const res = await clearAllRiwayatFromGAS(apiUrl);
      if (res.success) {
        setRiwayatList([]);
        addToast('success', 'Riwayat Dibersihkan', 'Seluruh catatan riwayat bel berhasil dihapus dari Google Spreadsheet.');
        setIsSaving(false);
        return true;
      } else {
        addToast('error', 'Gagal Menghapus Riwayat', res.error || 'Terjadi kesalahan saat menghapus riwayat.');
        setIsSaving(false);
        return false;
      }
    } catch (err: any) {
      addToast('error', 'Gagal', err.message || 'Terjadi kesalahan.');
      setIsSaving(false);
      return false;
    }
  };

  const handlePlayPreviewSound = async (url: string): Promise<boolean> => {
    setPlayingSoundUrl(url);
    setIsPlayingAudio(true);
    const res = await playBellAudio(url, () => {
      setPlayingSoundUrl(null);
      setIsPlayingAudio(false);
    });
    if (!res.success) {
      setPlayingSoundUrl(null);
      setIsPlayingAudio(false);
      addToast('error', 'Gagal Memutar Audio', res.error || 'Audio tidak dapat dimuat dari Google Drive.');
    }
    return res.success;
  };

  const handlePlayManualBell = async (soundSource: string, namaSuara: string): Promise<boolean> => {
    return await executePlayBell(soundSource, `Bel Manual: ${namaSuara}`, 'Manual');
  };

  const handleInitSheets = async (targetApiUrl?: string): Promise<boolean> => {
    const activeUrl = targetApiUrl || apiUrl;
    if (!activeUrl) {
      addToast('warning', 'URL Belum Diatur', 'Harap masukkan URL Web App Google Apps Script terlebih dahulu.');
      return false;
    }
    setIsInitializingSheets(true);
    try {
      const res = await initializeDatabaseSheetsInGAS(activeUrl);
      if (res.success) {
        addToast('success', 'Inisialisasi Selesai', 'Seluruh 7 Sheet database berhasil disiapkan di Google Spreadsheet.');
        await syncDataFromSpreadsheet(activeUrl);
        return true;
      } else {
        addToast('error', 'Inisialisasi Gagal', res.error || 'Tidak dapat membuat lembar kerja otomatis.');
        return false;
      }
    } catch (err: any) {
      addToast('error', 'Gagal Eksekusi', err.message);
      return false;
    } finally {
      setIsInitializingSheets(false);
    }
  };

  const handleLoginSuccess = (user: PenggunaItem) => {
    setAuthSession({
      isLoggedIn: true,
      user
    });
    addToast('success', 'Login Berhasil', `Selamat datang, ${user.nama} (${user.role})!`);
  };

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar / logout?')) {
      setAuthSession({
        isLoggedIn: false,
        user: null
      });
      addToast('info', 'Telah Keluar', 'Sesi login telah ditutup.');
    }
  };

  const handleCopyDeviceLink = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (apiUrl) {
        url.searchParams.set('api', apiUrl);
      }
      navigator.clipboard.writeText(url.toString());
      addToast('success', 'Tautan Cloud Disalin!', 'Tautan tersinkronisasi telah disalin. Buka di HP, PC, atau laptop lain untuk langsung membaca database yang sama!');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200 ${themeClasses.appBg}`}>
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          if (view === 'konfigurasi') {
            setIsConfigOpen(true);
          } else {
            setActiveView(view);
          }
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        authSession={authSession}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        totalJadwalCount={jadwalList.length}
        totalSuaraCount={suaraList.length}
        totalLiburCount={hariLiburList.filter(h => h.statusAktif).length}
        totalUsersCount={usersList.length}
        dbStatus={dbStatus}
        schoolName={config.namaSekolah}
        logoUrl={config.logoUrl}
      />

      {/* Main Content Area (Offset for Desktop Sidebar) */}
      <div className="flex-1 flex flex-col lg:pl-72 transition-all duration-300">
        
        {/* Top Header Bar */}
        <Header
          schoolName={config.namaSekolah}
          npsnNsm={config.npsnNsm}
          logoUrl={config.logoUrl}
          dbStatus={dbStatus}
          isSyncing={isSyncing}
          activeView={activeView}
          setActiveView={setActiveView}
          onRefresh={() => syncDataFromSpreadsheet()}
          onOpenConfig={() => setIsConfigOpen(true)}
          onOpenGuide={() => setIsGuideOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          totalJadwalCount={jadwalList.length}
          totalSuaraCount={suaraList.length}
          totalLiburCount={hariLiburList.filter(h => h.statusAktif).length}
          isAudioActive={isAudioReady}
          onActivateAudio={handleActivateAudio}
          authSession={authSession}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onOpenSchoolPicker={() => setIsSchoolPickerOpen(true)}
          hasSchools={schoolList.length > 0}
        />

        {/* Main Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          
          {/* Audio Activation Banner */}
          <AudioActivationBanner
            isAudioActive={isAudioReady}
            isActivating={isActivatingAudio}
            onActivateAudio={handleActivateAudio}
          />

          {/* 1. Loading Cloud Data Banner */}
          {cloudLoadState === 'loading' && (
            <div className="p-4 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 shadow-lg flex items-center justify-between gap-3 text-xs text-cyan-200 animate-pulse">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-white">Memuat data cloud Google Spreadsheet...</h4>
                  <p className="text-cyan-300 text-xs mt-0.5">Menyelaraskan 7 lembar kerja database secara langsung tanpa menyimpan data di browser.</p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-900/80 text-cyan-300 font-mono border border-cyan-700/50">
                100% Cloud Synchronizing
              </span>
            </div>
          )}

          {/* 2. Unconfigured Cloud Warning & Quick Connect Box */}
          {!apiUrl && (
            <div className="p-5 rounded-2xl bg-amber-950/70 border border-amber-500/50 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-amber-200 animate-fade-in">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0 mt-0.5">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white flex items-center gap-2">
                    <span>Sistem Beroperasi 100% Cloud (Google Spreadsheet &amp; Drive)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 font-mono">Belum Terhubung</span>
                  </h4>
                  <p className="text-slate-300 text-xs mt-1 max-w-2xl">
                    Masukkan URL Web App Google Apps Script Anda untuk memuat jadwal, pengaturan, dan suara bel yang sama di laptop, PC, HP, atau tablet ini:
                  </p>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2 max-w-xl">
                    <input
                      type="url"
                      value={quickApiInput}
                      onChange={(e) => setQuickApiInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900/90 border border-amber-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={() => handleQuickConnect(quickApiInput)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hubungkan Cloud</span>
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsGuideOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 self-end md:self-auto flex-shrink-0 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>Panduan Setup Cloud</span>
              </button>
            </div>
          )}

          {/* 3. Cloud Disconnected / Error Banner with strict safety guarantee */}
          {apiUrl && cloudLoadState === 'error' && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-600/60 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-200 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>🔴 CLOUD TIDAK TERHUBUNG</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 font-mono">Data Aman &amp; Terlindungi</span>
                  </h4>
                  <p className="text-slate-200 text-xs mt-0.5 font-medium">
                    Data cloud gagal dimuat. Data lama tidak diubah. Periksa koneksi dan konfigurasi server, kemudian coba lagi.
                  </p>
                  {dbStatus.error && (
                    <p className="text-rose-300/80 text-[11px] mt-0.5 font-mono">
                      Detail: {dbStatus.error}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                <button
                  onClick={() => setIsConfigOpen(true)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
                >
                  Buka Pengaturan
                </button>
                <button
                  onClick={() => syncDataFromSpreadsheet(apiUrl)}
                  disabled={isSyncing}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>🔄 Coba Sinkronkan Lagi</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 1: DASHBOARD UTAMA                                                   */}
          {/* ========================================================================= */}
          {activeView === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* 1. Realtime Clock Card with Day School / Holiday status & Live Cloud Sync Status */}
              <ClockCard
                zonaWaktu={config.zonaWaktu}
                tahunPelajaran={config.tahunPelajaran}
                daySchoolStatus={calcResult.daySchoolStatus}
                statusBadgeText={calcResult.statusBadgeText}
                holidayReason={calcResult.holidayReason}
                dbStatus={dbStatus}
                isSyncing={isSyncing}
                onRefresh={() => syncDataFromSpreadsheet(apiUrl)}
              />

              {/* 2. Manual Bell Card & Current/Next Schedule Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5">
                  <ManualBellCard
                    suaraList={suaraList}
                    isAudioActive={isAudioReady}
                    isPlaying={isPlayingAudio}
                    onPlayManualBell={handlePlayManualBell}
                    onStopBell={handleStopBell}
                    onActivateAudio={handleActivateAudio}
                  />
                </div>
                <div className="lg:col-span-7">
                  <CurrentNextScheduleCard
                    calcResult={calcResult}
                    onNavigateToSchedule={() => setActiveView('jadwal')}
                  />
                </div>
              </div>

              {/* 3. Grid: School Identity, Database Status & Riwayat Bel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SchoolIdentityCard
                  config={config}
                  onEdit={() => setIsConfigOpen(true)}
                />

                <DatabaseStatusCard
                  dbStatus={dbStatus}
                  apiUrl={apiUrl}
                  spreadsheetUrl={config.spreadsheetUrl}
                  isInitializing={isInitializingSheets}
                  onInitializeSheets={() => handleInitSheets()}
                  onOpenConfig={() => setIsConfigOpen(true)}
                  onOpenGuide={() => setIsGuideOpen(true)}
                />

                <RiwayatBelCard
                  riwayatList={riwayatList}
                  onRefresh={() => syncDataFromSpreadsheet()}
                  isSyncing={isSyncing}
                />
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: MANAJEMEN JADWAL BEL                                              */}
          {/* ========================================================================= */}
          {activeView === 'jadwal' && (
            <div className="animate-fade-in">
              <ScheduleManagementView
                jadwalList={jadwalList}
                suaraList={suaraList}
                onSaveAll={handleSaveAllJadwal}
                onAddOrUpdate={handleAddOrUpdateJadwal}
                onDelete={handleDeleteJadwal}
                onToggleStatus={handleToggleJadwalStatus}
                isSaving={isSaving}
                onRefresh={() => syncDataFromSpreadsheet()}
                spreadsheetUrl={config.spreadsheetUrl}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 3: MANAJEMEN SUARA BEL (100% CLOUD & DRIVE)                         */}
          {/* ========================================================================= */}
          {activeView === 'suara' && (
            <div className="animate-fade-in">
              <SoundManagementView
                suaraList={suaraList}
                onSaveAll={handleSaveAllSuara}
                onUploadAudioToDrive={handleUploadAudioToDrive}
                onPlayPreview={handlePlayPreviewSound}
                onStopPreview={handleStopBell}
                playingSoundUrl={playingSoundUrl}
                isSaving={isSaving}
                onRefresh={() => syncDataFromSpreadsheet()}
                onActivateAudio={handleActivateAudio}
                isAudioActive={isAudioReady}
                isCloudConnected={dbStatus.connected}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 4: KONFIGURASI HARI AKTIF (TAHAP 4)                                  */}
          {/* ========================================================================= */}
          {activeView === 'hariAktif' && (
            <div className="animate-fade-in">
              <HariAktifView
                hariAktifList={hariAktifList}
                onSaveAll={handleSaveHariAktif}
                isSaving={isSaving}
                onRefresh={() => syncDataFromSpreadsheet()}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 5: KALENDER HARI LIBUR (TAHAP 4)                                     */}
          {/* ========================================================================= */}
          {activeView === 'hariLibur' && (
            <div className="animate-fade-in">
              <HariLiburView
                hariLiburList={hariLiburList}
                onSaveAll={handleSaveHariLibur}
                isSaving={isSaving}
                onRefresh={() => syncDataFromSpreadsheet()}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 6: RIWAYAT BEL LENGKAP & FILTER (TAHAP 4)                            */}
          {/* ========================================================================= */}
          {activeView === 'riwayat' && (
            <div className="animate-fade-in">
              <RiwayatBelView
                riwayatList={riwayatList}
                onClearAll={handleClearRiwayat}
                onRefresh={() => syncDataFromSpreadsheet()}
                isSaving={isSaving}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 7: MANAJEMEN PENGGUNA (TAHAP 5)                                      */}
          {/* ========================================================================= */}
          {activeView === 'pengguna' && (
            <div className="animate-fade-in">
              <UserManagementView
                usersList={usersList}
                onSaveUsers={handleSaveUsers}
                isSaving={isSaving}
                authSession={authSession}
                onRefresh={() => syncDataFromSpreadsheet()}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 8: BACKUP & EXPORT DATA (TAHAP 5)                                    */}
          {/* ========================================================================= */}
          {activeView === 'backup' && (
            <div className="animate-fade-in">
              <BackupExportView
                config={config}
                jadwalList={jadwalList}
                suaraList={suaraList}
                hariAktifList={hariAktifList}
                hariLiburList={hariLiburList}
                riwayatList={riwayatList}
                usersList={usersList}
                dbStatus={dbStatus}
                authSession={authSession}
                onRestoreBackup={handleRestoreBackup}
                onForceSyncAllToGAS={handleForceSyncAllToGAS}
                isSyncing={isSyncing}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 9: TENTANG APLIKASI (TAHAP 5)                                        */}
          {/* ========================================================================= */}
          {activeView === 'tentang' && (
            <div className="animate-fade-in">
              <AboutView
                config={config}
                onOpenGuide={() => setIsGuideOpen(true)}
                onOpenConfig={() => setIsConfigOpen(true)}
              />
            </div>
          )}

          {/* Bottom helper sync banner */}
          <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs ${themeClasses.cardBg}`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm">
                  Bel Sekolah &amp; Madrasah Digital (v5.0 Final Edition)
                </h4>
                <p className={`mt-0.5 max-w-2xl ${themeClasses.textMuted}`}>
                  Sistem beroperasi mandiri dengan basis data 7 lembar kerja Google Spreadsheet. Audio presisi Web Audio API + MP3/WAV, otomatisasi hari libur, upload lokal dengan kompresi cerdas, serta tema Light, Dark &amp; Emerald Madrasah.
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyDeviceLink}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Salin Tautan Aplikasi</span>
            </button>
          </div>

        </main>

        {/* Footer */}
        <footer className={`border-t py-5 text-center text-xs transition-colors ${themeClasses.cardSubtleBg} ${themeClasses.border}`}>
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              © {new Date().getFullYear()} <strong>{config.namaSekolah || 'Bel Sekolah / Madrasah Digital'}</strong> — Versi 5.0 Final Release.
            </span>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                7 Sheet Google Spreadsheet Engine
              </span>
              <span className="text-slate-400">Tahap 5 Lengkap</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Bell Ringing Popup */}
      <BellRingingPopup
        activeBell={activeRingingBell}
        onStop={handleStopBell}
      />

      {/* Configuration Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        apiUrl={apiUrl}
        onSave={handleSaveConfig}
        onInitSheets={handleInitSheets}
        isSaving={isSaving}
      />

      {/* Google Apps Script & Spreadsheet Guide Modal */}
      <ScriptGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenConfig={() => setIsConfigOpen(true)}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        apiUrl={apiUrl}
        usersList={usersList}
        onLoginSuccess={handleLoginSuccess}
        authSession={authSession}
      />

      {/* School Picker Modal (multi-sekolah, satu alamat) */}
      <SchoolPickerModal
        isOpen={isSchoolPickerOpen}
        schools={schoolList}
        selectedId={selectedSchoolId}
        onSelect={handleSelectSchool}
        onClose={() => setIsSchoolPickerOpen(false)}
      />

      {/* Notification Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
