import { JadwalBelItem, HariAktifItem, HariLiburItem } from '../types';
import { getSafeTimeZone } from './timezoneHelper';

export type DaySchoolStatus = 'HARI_SEKOLAH' | 'HARI_LIBUR' | 'HARI_NONAKTIF';

export interface ScheduleCalculationResult {
  currentActivity: {
    item: JadwalBelItem | null;
    startTime: string | null;
    endTime: string | null;
    statusText: string;
  };
  nextActivity: {
    item: JadwalBelItem | null;
    targetTime: string | null;
    isTomorrow: boolean;
    countdownFormatted: string; // "HH:MM:SS"
    remainingSeconds: number;
    statusText: string;
  };
  activeTodaySchedules: JadwalBelItem[];
  currentDayName: string;
  currentTimeString: string;
  currentDateString: string;
  daySchoolStatus: DaySchoolStatus;
  statusBadgeText: string;
  holidayReason?: string;
  isAutomaticBellAllowed: boolean;
}

/**
 * Validasi ketat format jam 24-jam (HH:mm)
 */
export function isValidTimeFormat(timeStr: string): boolean {
  if (!timeStr || typeof timeStr !== 'string') return false;
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeStr.trim());
}

/**
 * Cek apakah terdapat duplikat jadwal pada jam dan hari yang sama
 */
export function checkDuplicateSchedule(
  schedules: JadwalBelItem[] = [],
  jam: string = '',
  hari: string = '',
  excludeId?: string
): boolean {
  const cleanJam = (jam || '').trim();
  const cleanHari = (hari || '').trim();
  if (!Array.isArray(schedules)) return false;

  return schedules.some(s => {
    if (!s) return false;
    if (excludeId && s.id === excludeId) return false;
    const sJam = (s.jam || '').trim();
    const sHari = (s.hari || '').trim();
    const sameTime = sJam === cleanJam;
    const sameDay = sHari === 'Semua Hari' || cleanHari === 'Semua Hari' || sHari.toLowerCase() === cleanHari.toLowerCase();
    return sameTime && sameDay;
  });
}

function padZero(num: number): string {
  const n = Math.max(0, Math.floor(isNaN(num) ? 0 : num));
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Normalisasi format tanggal ke YYYY-MM-DD
 */
export function normalizeDateToYYYYMMDD(date: Date, timezone: string = 'Asia/Jakarta'): string {
  const safeTz = getSafeTimeZone(timezone);
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: safeTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date); // Output format: "YYYY-MM-DD"
  } catch (e) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Hitung Status Hari (Hari Libur / Hari Nonaktif / Hari Sekolah), Jadwal Saat Ini, dan Jadwal Berikutnya
 */
export function calculateRealtimeSchedule(
  schedules: JadwalBelItem[] = [],
  hariAktifList: HariAktifItem[] = [],
  hariLiburList: HariLiburItem[] = [],
  zonaWaktu: string = 'Asia/Jakarta',
  nowDate: Date = new Date()
): ScheduleCalculationResult {
  const safeTz = getSafeTimeZone(zonaWaktu);
  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const safeHariAktif = Array.isArray(hariAktifList) ? hariAktifList : [];
  const safeHariLibur = Array.isArray(hariLiburList) ? hariLiburList : [];

  // 1. Dapatkan Nama Hari, Tanggal, dan Waktu saat ini di zona waktu yang dipilih
  let currentDayName = 'Senin';
  try {
    const dayFormatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: safeTz,
      weekday: 'long'
    });
    currentDayName = dayFormatter.format(nowDate); // e.g. "Senin"
  } catch (e) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    currentDayName = days[nowDate.getDay()];
  }

  const currentDateString = normalizeDateToYYYYMMDD(nowDate, safeTz);

  let curHour = 0;
  let curMin = 0;
  let curSec = 0;

  try {
    const hourFormatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: safeTz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = hourFormatter.formatToParts(nowDate);
    curHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    curMin = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    curSec = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);
  } catch (e) {
    curHour = nowDate.getHours();
    curMin = nowDate.getMinutes();
    curSec = nowDate.getSeconds();
  }

  curHour = isNaN(curHour) ? 0 : curHour;
  curMin = isNaN(curMin) ? 0 : curMin;
  curSec = isNaN(curSec) ? 0 : curSec;

  const currentSecondsOfDay = curHour * 3600 + curMin * 60 + curSec;
  const currentTimeString = `${padZero(curHour)}:${padZero(curMin)}:${padZero(curSec)}`;

  // 2. PRIORITAS 1: Periksa apakah hari ini adalah HARI LIBUR
  const matchingHoliday = safeHariLibur.find(hl => {
    if (!hl || !hl.statusAktif) return false;
    const hlDate = (hl.tanggal || '').trim();
    return hlDate === currentDateString || hlDate === nowDate.toLocaleDateString('id-ID');
  });

  if (matchingHoliday) {
    return {
      currentActivity: {
        item: null,
        startTime: null,
        endTime: null,
        statusText: `Hari Libur: ${matchingHoliday.keterangan || 'Libur Sekolah'}`
      },
      nextActivity: {
        item: null,
        targetTime: null,
        isTomorrow: false,
        countdownFormatted: '00:00:00',
        remainingSeconds: 0,
        statusText: 'Bel otomatis nonaktif pada hari libur.'
      },
      activeTodaySchedules: [],
      currentDayName,
      currentTimeString,
      currentDateString,
      daySchoolStatus: 'HARI_LIBUR',
      statusBadgeText: '🔴 HARI LIBUR — BEL OTOMATIS NONAKTIF',
      holidayReason: matchingHoliday.keterangan || 'Hari Libur',
      isAutomaticBellAllowed: false
    };
  }

  // 3. PRIORITAS 2: Periksa apakah hari ini berstatus AKTIF di HariAktif
  const matchingDayConfig = safeHariAktif.find(h => h && h.hari && h.hari.toLowerCase() === currentDayName.toLowerCase());
  const isDayActive = matchingDayConfig ? matchingDayConfig.status === 'Aktif' : currentDayName !== 'Minggu';

  if (!isDayActive) {
    return {
      currentActivity: {
        item: null,
        startTime: null,
        endTime: null,
        statusText: `Hari ${currentDayName} Nonaktif (Tidak Ada KBM)`
      },
      nextActivity: {
        item: null,
        targetTime: null,
        isTomorrow: false,
        countdownFormatted: '00:00:00',
        remainingSeconds: 0,
        statusText: `Hari ${currentDayName} berstatus Nonaktif. Bel otomatis tidak berbunyi.`
      },
      activeTodaySchedules: [],
      currentDayName,
      currentTimeString,
      currentDateString,
      daySchoolStatus: 'HARI_NONAKTIF',
      statusBadgeText: '⚪ HARI NONAKTIF — TIDAK ADA KBM',
      isAutomaticBellAllowed: false
    };
  }

  // 4. PRIORITAS 3: Hari Sekolah Aktif -> Proses JadwalBel
  const activeSchedulesForToday = safeSchedules
    .filter(s => s && s.statusAktif && ((s.hari || '').trim() === 'Semua Hari' || (s.hari || '').toLowerCase() === currentDayName.toLowerCase()))
    .map(s => {
      const jamStr = (s.jam || '00:00').trim();
      let [h, m] = jamStr.split(':').map(x => parseInt(x, 10));
      h = isNaN(h) ? 0 : h;
      m = isNaN(m) ? 0 : m;
      const seconds = h * 3600 + m * 60;
      return {
        ...s,
        totalSeconds: seconds
      };
    })
    .sort((a, b) => a.totalSeconds - b.totalSeconds);

  if (activeSchedulesForToday.length === 0) {
    return {
      currentActivity: {
        item: null,
        startTime: null,
        endTime: null,
        statusText: 'Tidak ada kegiatan saat ini.'
      },
      nextActivity: {
        item: null,
        targetTime: null,
        isTomorrow: false,
        countdownFormatted: '00:00:00',
        remainingSeconds: 0,
        statusText: 'Tidak ada jadwal bel aktif hari ini.'
      },
      activeTodaySchedules: [],
      currentDayName,
      currentTimeString,
      currentDateString,
      daySchoolStatus: 'HARI_SEKOLAH',
      statusBadgeText: '🟢 HARI SEKOLAH — BEL OTOMATIS AKTIF',
      isAutomaticBellAllowed: true
    };
  }

  let currentItem: JadwalBelItem | null = null;
  let currentStartTime: string | null = null;
  let currentEndTime: string | null = null;

  let nextItem: JadwalBelItem | null = null;
  let nextTargetSeconds = 0;
  let isTomorrow = false;

  const nextIdx = activeSchedulesForToday.findIndex(s => s.totalSeconds > currentSecondsOfDay);

  if (nextIdx === -1) {
    // Semua jadwal hari ini sudah lewat
    const lastItem = activeSchedulesForToday[activeSchedulesForToday.length - 1];
    currentItem = lastItem;
    currentStartTime = lastItem.jam || '00:00';
    currentEndTime = 'Selesai';

    nextItem = activeSchedulesForToday[0];
    nextTargetSeconds = activeSchedulesForToday[0].totalSeconds + (24 * 3600);
    isTomorrow = true;
  } else if (nextIdx === 0) {
    // Sebelum jadwal pertama hari ini
    currentItem = null;
    nextItem = activeSchedulesForToday[0];
    nextTargetSeconds = activeSchedulesForToday[0].totalSeconds;
    isTomorrow = false;
  } else {
    // Di tengah KBM
    const activeCurrent = activeSchedulesForToday[nextIdx - 1];
    currentItem = activeCurrent;
    currentStartTime = activeCurrent.jam || '00:00';
    currentEndTime = activeSchedulesForToday[nextIdx].jam || '00:00';

    nextItem = activeSchedulesForToday[nextIdx];
    nextTargetSeconds = activeSchedulesForToday[nextIdx].totalSeconds;
    isTomorrow = false;
  }

  // Hitung Hitung Mundur Detik Menuju Jadwal Berikutnya
  const remainingSeconds = Math.max(0, nextTargetSeconds - currentSecondsOfDay);
  const remHours = Math.floor(remainingSeconds / 3600);
  const remMins = Math.floor((remainingSeconds % 3600) / 60);
  const remSecs = remainingSeconds % 60;
  const countdownFormatted = `${padZero(remHours)}:${padZero(remMins)}:${padZero(remSecs)}`;

  const currentStatusText = currentItem
    ? `${currentItem.keterangan || 'Kegiatan'} (Mulai: ${currentStartTime}${currentEndTime && currentEndTime !== 'Selesai' ? ` s.d ${currentEndTime}` : ''})`
    : (nextItem ? `Menunggu jadwal bel pertama (${nextItem.jam})` : 'Tidak ada jadwal');

  const nextStatusText = nextItem
    ? `${nextItem.keterangan || 'Bel Berikutnya'} (${nextItem.jam})${isTomorrow ? ' - Besok' : ''}`
    : 'Semua jadwal bel hari ini telah selesai.';

  return {
    currentActivity: {
      item: currentItem,
      startTime: currentStartTime,
      endTime: currentEndTime,
      statusText: currentStatusText
    },
    nextActivity: {
      item: nextItem,
      targetTime: nextItem ? (nextItem.jam || null) : null,
      isTomorrow,
      countdownFormatted,
      remainingSeconds,
      statusText: nextStatusText
    },
    activeTodaySchedules: activeSchedulesForToday,
    currentDayName,
    currentTimeString,
    currentDateString,
    daySchoolStatus: 'HARI_SEKOLAH',
    statusBadgeText: '🟢 HARI SEKOLAH — BEL OTOMATIS AKTIF',
    isAutomaticBellAllowed: true
  };
}
