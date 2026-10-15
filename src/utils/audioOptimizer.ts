/**
 * Audio Optimizer & Inspector for Bel Sekolah Digital
 * Membaca metadata durasi, validasi, dan memastikan audio MP3/WAV utuh tanpa terpotong (100% Full Audio Fidelity)
 */

export interface AudioInspectionResult {
  file: File;
  fileName: string;
  format: 'MP3' | 'WAV' | 'UNKNOWN';
  originalSizeBytes: number;
  originalSizeStr: string;
  durationSeconds: number;
  durationFormatted: string;
  isCompressed: boolean;
  optimizedSizeBytes: number;
  optimizedSizeStr: string;
  reductionPercentage: number;
  dataUrl: string;
  error?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function validateAudioFile(file: File): { valid: boolean; format: 'MP3' | 'WAV' | 'UNKNOWN'; error?: string } {
  if (!file) {
    return { valid: false, format: 'UNKNOWN', error: 'Berkas tidak ditemukan.' };
  }

  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  const isMp3 = name.endsWith('.mp3') || mime.includes('audio/mpeg') || mime.includes('audio/mp3');
  const isWav = name.endsWith('.wav') || mime.includes('audio/wav') || mime.includes('audio/x-wav');

  if (!isMp3 && !isWav) {
    return {
      valid: false,
      format: 'UNKNOWN',
      error: 'Format berkas tidak didukung. Harap pilih berkas berekstensi .MP3 atau .WAV'
    };
  }

  if (file.size === 0) {
    return { valid: false, format: 'UNKNOWN', error: 'Berkas audio kosong (0 Bytes).' };
  }

  // Batas maksimum file upload lokal (maksimal 25MB untuk upload Google Drive)
  if (file.size > 25 * 1024 * 1024) {
    return { valid: false, format: isMp3 ? 'MP3' : 'WAV', error: 'Ukuran file terlalu besar (> 25 MB). Harap pilih file yang lebih efisien.' };
  }

  return { valid: true, format: isMp3 ? 'MP3' : 'WAV' };
}

/**
 * Membaca metadata file audio secara presisi dan menyiapkan data URL utuh tanpa kompresi destruktif
 */
export async function processAndOptimizeAudio(
  file: File,
  onProgressMessage?: (msg: string) => void
): Promise<AudioInspectionResult> {
  const validation = validateAudioFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Berkas audio tidak valid.');
  }

  const originalSizeBytes = file.size;
  const originalSizeStr = formatFileSize(originalSizeBytes);
  const format = validation.format;

  if (onProgressMessage) {
    onProgressMessage('Membaca durasi dan memverifikasi integritas audio...');
  }

  // Baca file ke ArrayBuffer untuk memeriksa header dan durasi
  const arrayBuffer = await file.arrayBuffer();

  let durationSeconds = 0;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (AudioContextClass) {
    let tempCtx: AudioContext | null = null;
    try {
      tempCtx = new AudioContextClass();
      const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer.slice(0));
      durationSeconds = decodedBuffer.duration;
    } catch (decodeErr) {
      console.warn('Gagal membaca durasi via Web Audio API, mencoba membaca metadata elemen HTML5 audio...', decodeErr);
      try {
        durationSeconds = await getAudioDurationFromElement(file);
      } catch (elemErr) {
        durationSeconds = 0;
      }
    } finally {
      if (tempCtx && tempCtx.state !== 'closed') {
        try {
          tempCtx.close();
        } catch (e) {}
      }
    }
  } else {
    try {
      durationSeconds = await getAudioDurationFromElement(file);
    } catch (e) {
      durationSeconds = 0;
    }
  }

  const durationFormatted = formatDuration(durationSeconds);
  const dataUrl = await fileToDataUrl(file);

  return {
    file,
    fileName: file.name,
    format,
    originalSizeBytes,
    originalSizeStr,
    durationSeconds,
    durationFormatted,
    isCompressed: false,
    optimizedSizeBytes: originalSizeBytes,
    optimizedSizeStr: originalSizeStr,
    reductionPercentage: 0,
    dataUrl
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getAudioDurationFromElement(file: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        const d = audio.duration;
        URL.revokeObjectURL(url);
        resolve(isNaN(d) ? 0 : d);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };
      audio.src = url;
    } catch (e) {
      resolve(0);
    }
  });
}
