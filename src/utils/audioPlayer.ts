/**
 * Audio Engine for Bel Sekolah / Madrasah Digital
 * Multi-layer resilient audio player for MP3, WAV, Google Drive, and Built-in Synthesizer.
 * (100% Cloud-compliant, in-memory runtime caching without localStorage/IndexedDB).
 * 
 * Fitur Utama & Prinsip:
 * 1. Playback PENUH dari awal sampai selesai (tidak pernah terpotong di tengah lagu/nada).
 * 2. Volume maksimal 100% (audio.volume = 1.0).
 * 3. TIDAK MENGGANTI audio kustom dengan default sound secara diam-diam.
 * 4. Multi-layer streaming & bypass CORS via Google Apps Script Base64 proxy.
 * 5. Pre-buffering memori (RAM) untuk pemutaran instan 0ms pada bel otomatis & manual.
 * 6. Kompatibel dengan Autoplay Policy pada semua browser (Chrome, Edge, Safari, Firefox, Android, iOS).
 */

// In-Memory Audio Cache (Hanya di RAM selama sesi berjalan, 0 localStorage)
const sessionAudioMemoryMap = new Map<string, string>();

let globalAudioCtx: AudioContext | null = null;
let currentHtmlAudio: HTMLAudioElement | null = null;
let currentActiveOnFinish: (() => void) | null = null;
let isAudioUnlocked = false;
let configuredGasApiUrl: string = '';

/**
 * Simpan konfigurasi URL Google Apps Script untuk pengambilan audio Drive via API
 */
export function setAudioEngineGasUrl(url: string) {
  if (url && typeof url === 'string') {
    configuredGasApiUrl = url.trim();
  }
}

/**
 * Daftarkan data audio Base64 ke cache memori (RAM) sesi saat ini
 */
export function registerSessionAudio(keyOrFileIdOrUrl: string, dataUri: string) {
  if (!keyOrFileIdOrUrl || !dataUri) return;
  const cleanKey = keyOrFileIdOrUrl.trim();
  sessionAudioMemoryMap.set(cleanKey, dataUri);

  const driveId = extractGoogleDriveFileId(cleanKey);
  if (driveId) {
    sessionAudioMemoryMap.set(driveId, dataUri);
    sessionAudioMemoryMap.set(`https://lh3.googleusercontent.com/d/${driveId}`, dataUri);
    sessionAudioMemoryMap.set(`https://drive.google.com/uc?export=download&id=${driveId}`, dataUri);
    sessionAudioMemoryMap.set(`https://drive.google.com/uc?id=${driveId}`, dataUri);
  }
}

/**
 * Ekstraksi Google Drive File ID dari berbagai format URL
 */
export function extractGoogleDriveFileId(input: string): string | null {
  if (!input) return null;
  const str = input.trim();

  // 1. URL dengan parameter id=...
  const matchIdParam = str.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
  if (matchIdParam) return matchIdParam[1];

  // 2. URL format /file/d/...
  const matchFileD = str.match(/\/file\/d\/([a-zA-Z0-9_-]{25,})/);
  if (matchFileD) return matchFileD[1];

  // 3. URL format /d/...
  const matchD = str.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
  if (matchD) return matchD[1];

  // 4. URL format /open?id=...
  const matchOpenId = str.match(/\/open\?id=([a-zA-Z0-9_-]{25,})/);
  if (matchOpenId) return matchOpenId[1];

  // 5. Raw 25-50 char Drive File ID
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(str)) {
    return str;
  }

  return null;
}

/**
 * Hasilkan daftar URL kandidat untuk audio Google Drive / Eksternal
 */
export function getCandidateAudioUrls(soundSource: string): string[] {
  const src = (soundSource || '').trim();
  if (!src) return [];

  // Jika berupa Preset Synthesizer
  if (src.startsWith('preset:')) return [src];

  // Jika berupa Data URI atau Blob URL
  if (src.startsWith('data:') || src.startsWith('blob:')) return [src];

  // Cek cache memori
  if (sessionAudioMemoryMap.has(src)) {
    const cached = sessionAudioMemoryMap.get(src);
    if (cached) return [cached];
  }

  const driveFileId = extractGoogleDriveFileId(src);
  if (driveFileId) {
    // Cek cache memori berdasarkan file ID
    if (sessionAudioMemoryMap.has(driveFileId)) {
      const cached = sessionAudioMemoryMap.get(driveFileId);
      if (cached) return [cached];
    }

    // Bangun daftar kandidat URL Google Drive dengan prioritas direct CDN
    return [
      `https://lh3.googleusercontent.com/d/${driveFileId}`,
      `https://drive.google.com/uc?export=download&id=${driveFileId}`,
      `https://docs.google.com/uc?export=open&id=${driveFileId}`,
      `https://drive.google.com/uc?id=${driveFileId}`,
      src
    ].filter((val, idx, arr) => arr.indexOf(val) === idx);
  }

  return [src];
}

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      globalAudioCtx = new AudioCtxClass();
    }
  }
  return globalAudioCtx;
}

export function isAudioActive(): boolean {
  return isAudioUnlocked && globalAudioCtx !== null && globalAudioCtx.state === 'running';
}

/**
 * Minta izin browser & buka kunci (unlock) AudioContext dan HTML5 Audio dengan interaksi pengguna
 */
export async function unlockAndTestAudio(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const ctx = getAudioContext();
    if (!ctx) {
      return { success: false, message: 'Web Audio API tidak didukung di browser ini.' };
    }

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Mainkan nada test chime (Ding tone: 587.33Hz -> 880Hz)
    await playSynthesizedTone([
      { freq: 587.33, duration: 0.15, gain: 0.3 },
      { freq: 880.00, duration: 0.35, gain: 0.35 }
    ]);

    // Buka kunci HTML5 Audio Element untuk Autoplay Policy
    try {
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A');
      silentAudio.volume = 0.01;
      const silentPromise = silentAudio.play();
      if (silentPromise !== undefined) {
        await silentPromise.catch(() => {});
      }
    } catch (e) {
      // Non-fatal
    }

    isAudioUnlocked = true;
    return {
      success: true,
      message: 'Audio berhasil diaktifkan! Bel otomatis dan manual siap berbunyi.'
    };
  } catch (err: any) {
    isAudioUnlocked = false;
    return {
      success: false,
      message: 'Browser memblokir pemutaran audio.',
      error: err.message || 'Klik kembali tombol Aktifkan Audio.'
    };
  }
}

/**
 * Ambil data Base64 file audio dari Google Apps Script (Bypass CORS 100%)
 */
export async function fetchAudioFromGasApi(fileId: string): Promise<string | null> {
  if (!configuredGasApiUrl || !configuredGasApiUrl.startsWith('http') || !fileId) {
    return null;
  }

  // Cek jika sudah ada di cache RAM
  if (sessionAudioMemoryMap.has(fileId)) {
    return sessionAudioMemoryMap.get(fileId) || null;
  }

  try {
    const url = new URL(configuredGasApiUrl);
    url.searchParams.set('action', 'getAudioBase64');
    url.searchParams.set('fileId', fileId);
    url.searchParams.set('_t', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) return null;

    const data = await response.json();
    const dataUri = data.dataUri || data.dataUrl;
    if (data && data.success && dataUri) {
      registerSessionAudio(fileId, dataUri);
      return dataUri;
    }
    return null;
  } catch (err) {
    console.warn('Gagal memuat audio via GAS API proxy:', err);
    return null;
  }
}

/**
 * Pre-cache semua audio aktif dari Google Drive di background
 * agar saat bel berbunyi langsung instan tanpa jeda download
 */
export async function prefetchAndCacheDriveSounds(
  soundList: Array<{ urlFile: string; statusAktif?: boolean }>,
  apiUrl?: string
) {
  if (apiUrl) {
    setAudioEngineGasUrl(apiUrl);
  }
  if (!configuredGasApiUrl) return;

  for (const sound of soundList) {
    if (sound.statusAktif === false) continue;
    const url = sound.urlFile || '';
    if (url.startsWith('preset:') || url.startsWith('data:')) continue;

    const fileId = extractGoogleDriveFileId(url);
    if (fileId && !sessionAudioMemoryMap.has(fileId)) {
      try {
        await fetchAudioFromGasApi(fileId);
      } catch (e) {
        // Abaikan error pada pre-fetch background
      }
    }
  }
}

/**
 * Putar audio via HTML5 Audio element dengan urutan inisialisasi yang presisi:
 * - Event listeners didaftarkan terlebih dahulu
 * - audio.src diisi dan audio.load() dipanggil
 * - audio.play() dijalankan
 * - Timeout HANYA untuk koneksi awal (10 detik) dan DIHAPUS saat audio mulai bunyi
 * - Audio berbunyi UTUH sampai 'onended' tanpa batasan durasi
 */
function playSingleAudioUrl(
  url: string,
  onFinish?: () => void
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio();
      currentHtmlAudio = audio;

      audio.volume = 1.0; // Pastikan volume maksimal 100%
      audio.preload = 'auto';

      let isSettled = false; // Status apakah promise inisialisasi sudah selesai
      let hasEnded = false;  // Status apakah event onended sudah dieksekusi

      // Daftarkan callback onFinish aktif ke global agar dapat dipanggil saat user menekan 'Stop'
      currentActiveOnFinish = () => {
        if (!hasEnded) {
          hasEnded = true;
          if (onFinish) {
            try {
              onFinish();
            } catch (err) {
              console.warn('onFinish callback error:', err);
            }
          }
        }
      };

      const cleanup = () => {
        if (currentHtmlAudio === audio) {
          currentHtmlAudio = null;
        }
      };

      // Timeout 12 detik HANYA untuk memulai koneksi audio (buffering awal).
      // Begitu audio berhasil mulai diputar (onplay / onplaying / ontimeupdate),
      // timeout INI LANGSUNG DIHAPUS SEPENUHNYA sehingga file berdurasi berapapun
      // (10s, 30s, 60s, lagu, mars) akan diputar sampai tuntas!
      let loadTimeoutId: any = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try {
            audio.pause();
          } catch (e) {}
          cleanup();
          resolve({ success: false, error: 'Waktu tunggu pemuatan audio habis (timeout 12s).' });
        }
      }, 12000);

      const clearLoadTimeout = () => {
        if (loadTimeoutId) {
          clearTimeout(loadTimeoutId);
          loadTimeoutId = null;
        }
      };

      const handlePlaybackStarted = () => {
        clearLoadTimeout();
        if (!isSettled) {
          isSettled = true;
          isAudioUnlocked = true;
          resolve({ success: true });
        }
      };

      // 1. Listeners untuk pemutaran berhasil
      audio.onplay = handlePlaybackStarted;
      audio.onplaying = handlePlaybackStarted;
      audio.ontimeupdate = () => {
        if (audio.currentTime > 0) {
          handlePlaybackStarted();
        }
      };

      // 2. Listener saat audio selesai secara alami (Full Duration Playback)
      audio.onended = () => {
        clearLoadTimeout();
        if (!isSettled) {
          isSettled = true;
          resolve({ success: true });
        }
        if (!hasEnded) {
          hasEnded = true;
          cleanup();
          currentActiveOnFinish = null;
          if (onFinish) {
            try {
              onFinish();
            } catch (err) {
              console.warn('onFinish callback error:', err);
            }
          }
        }
      };

      // 3. Listener saat terjadi kesalahan koneksi/format
      audio.onerror = () => {
        clearLoadTimeout();
        if (!isSettled) {
          isSettled = true;
          cleanup();
          currentActiveOnFinish = null;
          const errMsg = audio.error
            ? `Kode kesalahan ${audio.error.code}: ${audio.error.message || 'Media tidak dapat dimuat'}`
            : 'Gagal memuat format audio';
          resolve({ success: false, error: errMsg });
        }
      };

      // 4. Set src dan load BERKAS TERLEBIH DAHULU
      audio.src = url;
      audio.load();

      // 5. Jalankan play() SETELAH src ditetapkan
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            handlePlaybackStarted();
          })
          .catch((err) => {
            clearLoadTimeout();
            if (!isSettled) {
              isSettled = true;
              cleanup();
              currentActiveOnFinish = null;
              resolve({
                success: false,
                error: err.message || 'Browser memblokir pemutaran otomatis (klik Aktifkan Audio).'
              });
            }
          });
      }
    } catch (e: any) {
      resolve({ success: false, error: e.message || 'Gagal membuat elemen audio.' });
    }
  });
}

/**
 * Mainkan suara bel:
 * - Jika Preset Synthesizer (preset:*): Mainkan synthesized chime.
 * - Jika Audio Kustom (MP3/WAV di Google Drive / URL):
 *   1. Cek memory cache Base64.
 *   2. Jika belum ada di memory cache, ambil data Base64 via Google Apps Script (Bypass CORS 100%).
 *   3. Jika Apps Script belum merespons, coba direct Google Drive CDN stream.
 *   4. Mainkan audio kustom DARI AWAL SAMPAI SELESAI tanpa pemotongan.
 *   5. JANGAN PERNAH MENGGANTI AUDIO KUSTOM DENGAN DEFAULT CHIME! Jika gagal, kembalikan status error.
 */
export async function playBellAudio(
  soundSource: string,
  onFinish?: () => void
): Promise<{ success: boolean; error?: string }> {
  const ctx = getAudioContext();

  // Pastikan AudioContext aktif
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
      isAudioUnlocked = true;
    } catch (e) {
      // Ignored
    }
  }

  // Hentikan audio yang sedang berjalan sebelumnya
  stopCurrentBellAudio();

  const src = (soundSource || '').trim();

  // KASUS 1: Preset Synthesizer (Westminster, Triple Chime, Ding Dong, Sirine)
  if (src.startsWith('preset:') || !src) {
    try {
      await playPresetChime(src || 'preset:westminster');
      if (onFinish) onFinish();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // KASUS 2: Data URI atau Blob URL langsung
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    const playRes = await playSingleAudioUrl(src, onFinish);
    if (playRes.success) {
      return { success: true };
    } else {
      return { success: false, error: playRes.error || 'Gagal memutar audio kustom.' };
    }
  }

  // KASUS 3: File Google Drive atau URL Kustom
  const driveFileId = extractGoogleDriveFileId(src);

  // 3A. Cek apakah Base64 sudah ada di memory RAM
  if (sessionAudioMemoryMap.has(src)) {
    const cachedDataUri = sessionAudioMemoryMap.get(src)!;
    const playRes = await playSingleAudioUrl(cachedDataUri, onFinish);
    if (playRes.success) return { success: true };
  }
  if (driveFileId && sessionAudioMemoryMap.has(driveFileId)) {
    const cachedDataUri = sessionAudioMemoryMap.get(driveFileId)!;
    const playRes = await playSingleAudioUrl(cachedDataUri, onFinish);
    if (playRes.success) return { success: true };
  }

  // 3B. Jika ada Google Drive File ID dan URL GAS tersedia:
  // Ambil Base64 via Google Apps Script (Metode paling stabil, 100% bebas CORS dan firewall)
  if (driveFileId && configuredGasApiUrl) {
    console.info(`[AudioEngine] Mengambil Base64 untuk Drive ID [${driveFileId}] dari Google Apps Script...`);
    const fetchedDataUri = await fetchAudioFromGasApi(driveFileId);
    if (fetchedDataUri) {
      const playRes = await playSingleAudioUrl(fetchedDataUri, onFinish);
      if (playRes.success) {
        return { success: true };
      }
    }
  }

  // 3C. Coba direct candidate streaming URLs
  const candidateUrls = getCandidateAudioUrls(src);
  for (const candidateUrl of candidateUrls) {
    // Lewati jika candidateUrl sama dengan yang sudah gagal
    if (candidateUrl.startsWith('data:')) continue;
    const playRes = await playSingleAudioUrl(candidateUrl, onFinish);
    if (playRes.success) {
      return { success: true };
    }
  }

  // 3D. Jika SEMUA upaya pemutaran file kustom gagal:
  // JANGAN GANTI DENGAN DEFAULT NADA TING-TONG! Berikan pesan error transparan!
  const errMsg = driveFileId
    ? `File audio Google Drive (ID: ${driveFileId}) tidak dapat dimuat. Pastikan file ada dan izin sharing publik di Drive aktif.`
    : `Audio tidak dapat diputar dari sumber: ${src}`;

  console.error('[AudioEngine] ' + errMsg);
  return {
    success: false,
    error: errMsg
  };
}

/**
 * Hentikan pemutaran bel saat ini seketika (Manual Stop oleh pengguna)
 */
export function stopCurrentBellAudio() {
  if (currentHtmlAudio) {
    try {
      currentHtmlAudio.pause();
      currentHtmlAudio.currentTime = 0;
    } catch (e) {
      // Ignored
    }
    currentHtmlAudio = null;
  }

  // Panggil callback onFinish untuk membersihkan state UI
  if (currentActiveOnFinish) {
    const fn = currentActiveOnFinish;
    currentActiveOnFinish = null;
    try {
      fn();
    } catch (e) {
      // Ignored
    }
  }
}

/**
 * Memainkan nada synthesizer bawaan (Westminster, Triple Chime, Ding Dong, Sirine)
 */
export async function playPresetChime(presetName: string): Promise<void> {
  const name = presetName.replace('preset:', '').toLowerCase();

  switch (name) {
    case 'westminster':
      // Melodi Klasik 4 Nada Bel Sekolah (G#4, E4, F#4, B3)
      await playSynthesizedTone([
        { freq: 415.30, duration: 0.5, gain: 0.35 }, // G#4
        { freq: 329.63, duration: 0.5, gain: 0.35 }, // E4
        { freq: 369.99, duration: 0.5, gain: 0.35 }, // F#4
        { freq: 246.94, duration: 0.9, gain: 0.40 }  // B3
      ]);
      break;

    case 'triple_chime':
      // 3 Nada Ceria (C5, E5, G5)
      await playSynthesizedTone([
        { freq: 523.25, duration: 0.35, gain: 0.35 },
        { freq: 659.25, duration: 0.35, gain: 0.35 },
        { freq: 783.99, duration: 0.7, gain: 0.40 }
      ]);
      break;

    case 'ding_dong':
      // Nada Ding Dong (E5 -> C5)
      await playSynthesizedTone([
        { freq: 659.25, duration: 0.45, gain: 0.40 },
        { freq: 523.25, duration: 0.8, gain: 0.45 }
      ]);
      break;

    case 'siren':
      // Nada Pengumuman / Peringatan Cepat
      await playSynthesizedTone([
        { freq: 800, duration: 0.2, gain: 0.35 },
        { freq: 600, duration: 0.2, gain: 0.35 },
        { freq: 800, duration: 0.2, gain: 0.35 },
        { freq: 600, duration: 0.4, gain: 0.40 }
      ]);
      break;

    default:
      // Standar 2-tone Chime
      await playSynthesizedTone([
        { freq: 587.33, duration: 0.35, gain: 0.35 },
        { freq: 880.00, duration: 0.55, gain: 0.40 }
      ]);
      break;
  }
}

/**
 * Helper pembuat tone multi-frekuensi Web Audio API
 */
function playSynthesizedTone(tones: Array<{ freq: number; duration: number; gain: number }>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) {
        resolve();
        return;
      }

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      let startTime = ctx.currentTime + 0.05;

      tones.forEach((tone) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(tone.freq, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(tone.gain, startTime + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + tone.duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + tone.duration);

        startTime += tone.duration * 0.95;
      });

      const totalDuration = (startTime - ctx.currentTime) * 1000;
      setTimeout(() => {
        resolve();
      }, totalDuration);
    } catch (err) {
      reject(err);
    }
  });
}
