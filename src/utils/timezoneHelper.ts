/**
 * Timezone Sanitizer & Helper for Bel Sekolah Digital
 * Guarantees a 100% valid IANA timezone to prevent Intl.DateTimeFormat RangeErrors.
 */

export const SUPPORTED_TIMEZONES = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'] as const;
export type ValidTimeZone = typeof SUPPORTED_TIMEZONES[number];

export function getSafeTimeZone(tz?: string | null): ValidTimeZone {
  if (!tz || typeof tz !== 'string') return 'Asia/Jakarta';

  const clean = tz.trim();

  // 1. Exact match
  if (clean === 'Asia/Jakarta' || clean === 'Asia/Makassar' || clean === 'Asia/Jayapura') {
    return clean as ValidTimeZone;
  }

  // 2. Acronym / partial match
  const upper = clean.toUpperCase();
  if (upper === 'WITA' || clean.toLowerCase().includes('makassar') || clean.toLowerCase().includes('tengah')) {
    return 'Asia/Makassar';
  }
  if (upper === 'WIT' || clean.toLowerCase().includes('jayapura') || clean.toLowerCase().includes('timur')) {
    return 'Asia/Jayapura';
  }
  if (upper === 'WIB' || clean.toLowerCase().includes('jakarta') || clean.toLowerCase().includes('barat')) {
    return 'Asia/Jakarta';
  }

  // 3. Test if browser Intl accepts it
  try {
    new Intl.DateTimeFormat('id-ID', { timeZone: clean });
    return (clean.startsWith('Asia/') ? clean : 'Asia/Jakarta') as ValidTimeZone;
  } catch (e) {
    return 'Asia/Jakarta';
  }
}
