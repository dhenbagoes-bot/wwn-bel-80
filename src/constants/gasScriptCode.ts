export const GAS_SCRIPT_CODE = `/**
 * ============================================================================
 * BACKEND API GOOGLE APPS SCRIPT - BEL SEKOLAH / MADRASAH DIGITAL (100% CLOUD)
 * ============================================================================
 * Arsitektur:
 * - Google Spreadsheet = DATABASE UTAMA & SATU-SATUNYA DATABASE APLIKASI
 * - Google Drive       = PENYIMPANAN FILE AUDIO (MP3/WAV) & LOGO
 * - Google Apps Script = API BRIDGE ANTARA WEB APP & GOOGLE CLOUD
 * 
 * 7 Lembar Kerja Database:
 * 1. Pengaturan (Identitas sekolah, tahun pelajaran, zona waktu)
 * 2. JadwalBel   (Master jadwal bel KBM sekolah)
 * 3. SuaraBel   (Daftar nada, file audio Google Drive, & preset)
 * 4. HariAktif  (Status aktif hari Senin s/d Minggu)
 * 5. HariLibur  (Kalender hari libur & ujian)
 * 6. RiwayatBel (Catatan audit pemutaran bel)
 * 7. Pengguna   (Akun login Admin & Operator)
 * ============================================================================
 */

/**
 * ============================================================================
 * 🔑 FUNGSI KHUSUS OTORISASI GOOGLE DRIVE & SPREADSHEET (JALANKAN SEKALI)
 * ============================================================================
 * Pilih fungsi 'authorizeGoogleDriveAccess' di dropdown Apps Script lalu klik 'Jalankan'.
 * Berikan izin akses saat jendela popup Google muncul.
 */
function authorizeGoogleDriveAccess() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('1. Memeriksa izin Google Spreadsheet: ' + (ss ? ss.getName() : 'OK'));

  const folderName = 'BelSekolah_Audio';
  let folder;
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    folder = folders.next();
    Logger.log('2. Folder Google Drive ditemukan: ' + folder.getName());
  } else {
    folder = DriveApp.createFolder(folderName);
    try {
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      // Non-fatal
    }
    Logger.log('2. Folder baru berhasil dibuat di Google Drive: ' + folder.getName());
  }

  Logger.log('✅ OTORISASI GOOGLE DRIVE & SPREADSHEET BERHASIL 100%!');
  return 'Otorisasi Google Drive dan Spreadsheet Berhasil!';
}

const REQUIRED_SHEETS = {
  PENGATURAN: 'Pengaturan',
  JADWAL_BEL: 'JadwalBel',
  SUARA_BEL: 'SuaraBel',
  HARI_AKTIF: 'HariAktif',
  HARI_LIBUR: 'HariLibur',
  RIWAYAT_BEL: 'RiwayatBel',
  PENGGUNA: 'Pengguna'
};

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAllData';
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'ping' || action === 'test') {
      return jsonResponse({
        success: true,
        message: 'Koneksi ke Google Apps Script dan Spreadsheet berhasil!',
        spreadsheetTitle: ss ? ss.getName() : 'Google Spreadsheet',
        spreadsheetId: ss ? ss.getId() : '',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'init' || action === 'initDatabase') {
      const initResult = initializeAllSheets(ss);
      return jsonResponse({
        success: true,
        message: 'Inisialisasi seluruh 7 sheet berhasil dilakukan.',
        data: initResult,
        timestamp: new Date().toISOString()
      });
    }

    // Ambil file audio Base64 dari Google Drive berdasarkan File ID (sebagai stream bebas batasan CORS)
    if (action === 'getAudio' || action === 'getAudioBase64' || action === 'getAudioData') {
      const fileId = (e && e.parameter && (e.parameter.fileId || e.parameter.id)) || '';
      const audioResult = getAudioBase64FromDrive(fileId);
      return jsonResponse(audioResult);
    }

    // Default: Ambil seluruh data dari 7 lembar kerja Google Spreadsheet
    return jsonResponse({
      success: true,
      data: {
        settings: getSchoolSettings(ss),
        jadwal: getJadwalBel(ss),
        suara: getSuaraBel(ss),
        hariAktif: getHariAktif(ss),
        hariLibur: getHariLibur(ss),
        riwayat: getRiwayatBel(ss),
        pengguna: getPengguna(ss),
        database: getDatabaseSummary(ss)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.toString(),
      message: 'Gagal memproses permintaan GET: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (pErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || (e && e.parameter && e.parameter.action) || 'getAllData';
    let ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'testConnection') {
      return jsonResponse({
        success: true,
        message: 'Koneksi POST ke Google Apps Script berhasil!',
        spreadsheetTitle: ss ? ss.getName() : 'Google Spreadsheet',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'initDatabase' || action === 'init') {
      const initResult = initializeAllSheets(ss);
      return jsonResponse({
        success: true,
        message: 'Struktur database 7 sheet berhasil diinisialisasi.',
        data: initResult,
        timestamp: new Date().toISOString()
      });
    }

    // 1. Simpan Pengaturan Sekolah
    if (action === 'saveSettings') {
      const config = payload.settings || payload.data || payload;
      const updatedSettings = saveSchoolSettings(ss, config);
      return jsonResponse({
        success: true,
        message: 'Konfigurasi identitas sekolah berhasil disimpan ke Google Spreadsheet!',
        data: { settings: updatedSettings, database: getDatabaseSummary(ss) },
        timestamp: new Date().toISOString()
      });
    }

    // 2. Simpan Seluruh Jadwal Bel
    if (action === 'saveAllJadwal') {
      const items = payload.jadwal || payload.items || payload.data || [];
      const updatedJadwal = saveAllJadwalBel(ss, items);
      return jsonResponse({
        success: true,
        message: 'Data jadwal bel berhasil disimpan ke Google Spreadsheet!',
        data: { jadwal: updatedJadwal, database: getDatabaseSummary(ss) },
        timestamp: new Date().toISOString()
      });
    }

    // 3. Simpan Seluruh Suara Bel
    if (action === 'saveAllSuara') {
      const items = payload.suara || payload.items || payload.data || [];
      const updatedSuara = saveAllSuaraBel(ss, items);
      return jsonResponse({
        success: true,
        message: 'Daftar suara bel berhasil disimpan ke Google Spreadsheet!',
        data: { suara: updatedSuara, database: getDatabaseSummary(ss) },
        timestamp: new Date().toISOString()
      });
    }

    // 4. Upload Audio ke Google Drive & Catat ke SuaraBel
    if (action === 'uploadAudioToDrive' || action === 'uploadAudio') {
      const uploadResult = uploadAudioFileToDrive(ss, payload);
      return jsonResponse(uploadResult);
    }

    // 4b. Upload Logo Sekolah ke Google Drive & Catat ke Pengaturan
    if (action === 'uploadLogoToDrive' || action === 'uploadLogo') {
      const uploadResult = uploadLogoFileToDrive(ss, payload);
      return jsonResponse(uploadResult);
    }

    // 5. Ambil data Base64 file audio dari Google Drive
    if (action === 'getAudioBase64' || action === 'getAudio' || action === 'getAudioData') {
      const fileId = payload.fileId || payload.id || (e && e.parameter && (e.parameter.fileId || e.parameter.id)) || '';
      const audioResult = getAudioBase64FromDrive(fileId);
      return jsonResponse(audioResult);
    }

    // 6. Simpan Hari Aktif
    if (action === 'saveHariAktif') {
      const items = payload.hariAktif || payload.items || payload.data || [];
      const updatedHariAktif = saveHariAktif(ss, items);
      return jsonResponse({
        success: true,
        message: 'Konfigurasi hari aktif sekolah berhasil disimpan ke Google Spreadsheet!',
        data: { hariAktif: updatedHariAktif, database: getDatabaseSummary(ss) },
        timestamp: new Date().toISOString()
      });
    }

    // 7. Simpan Seluruh Hari Libur
    if (action === 'saveAllHariLibur') {
      const items = payload.hariLibur || payload.items || payload.data || [];
      const updatedHariLibur = saveAllHariLibur(ss, items);
      return jsonResponse({
        success: true,
        message: 'Daftar tanggal hari libur berhasil disimpan ke Google Spreadsheet!',
        data: { hariLibur: updatedHariLibur, database: getDatabaseSummary(ss) },
        timestamp: new Date().toISOString()
      });
    }

    // 8. Tambah Catatan Riwayat Bel
    if (action === 'addRiwayat') {
      const entry = payload.entry || payload.data || payload;
      const updatedRiwayat = addRiwayatBel(ss, entry);
      return jsonResponse({
        success: true,
        message: 'Riwayat bel berhasil dicatat.',
        data: { riwayat: updatedRiwayat, database: getDatabaseSummary(ss) },
        timestamp: new Date().toISOString()
      });
    }

    // 9. Bersihkan / Hapus Seluruh Riwayat Bel
    if (action === 'clearRiwayat') {
      const clearedRiwayat = clearRiwayatBel(ss);
      return jsonResponse({
        success: true,
        message: 'Seluruh riwayat pemutaran bel berhasil dibersihkan dari Google Spreadsheet.',
        data: { riwayat: clearedRiwayat, database: getDatabaseSummary(ss) },
        timestamp: new Date().toISOString()
      });
    }

    // 10. Simpan Seluruh Pengguna (Sheet: Pengguna)
    if (action === 'saveAllPengguna') {
      const items = payload.pengguna || payload.items || payload.data || [];
      const updatedPengguna = saveAllPengguna(ss, items);
      return jsonResponse({
        success: true,
        message: 'Data pengguna dan hak akses berhasil disimpan ke Google Spreadsheet!',
        data: { pengguna: updatedPengguna, database: getDatabaseSummary(ss) },
        timestamp: new Date().toISOString()
      });
    }

    // 11. Login Verifikasi Pengguna
    if (action === 'login') {
      const username = (payload.username || '').toString().trim();
      const password = (payload.password || '').toString();
      const loginResult = verifyAndLoginUser(ss, username, password);
      return jsonResponse(loginResult);
    }

    // 12. Pulihkan Seluruh Database dari Backup (Restore Full Database)
    if (action === 'restoreDatabase' || action === 'restoreFullBackup') {
      const backupData = payload.backupData || payload.data || payload;
      const restoreResult = restoreFullDatabase(ss, backupData);
      return jsonResponse(restoreResult);
    }

    // Default: Ambil seluruh data
    return jsonResponse({
      success: true,
      data: {
        settings: getSchoolSettings(ss),
        jadwal: getJadwalBel(ss),
        suara: getSuaraBel(ss),
        hariAktif: getHariAktif(ss),
        hariLibur: getHariLibur(ss),
        riwayat: getRiwayatBel(ss),
        pengguna: getPengguna(ss),
        database: getDatabaseSummary(ss)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.toString(),
      message: 'Gagal memproses permintaan POST: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Helper JSON Response dengan Header CORS Terbuka
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ============================================================================
 * INISIALISASI SELURUH 7 LEMBAR KERJA (7 SHEETS)
 * ============================================================================
 */
function initializeAllSheets(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  if (!ss) {
    throw new Error('Spreadsheet aktif tidak ditemukan.');
  }

  const results = {
    pengaturan: !!getPengaturanSheet(ss),
    jadwal: !!getJadwalBelSheet(ss),
    suara: !!getSuaraBelSheet(ss),
    hariAktif: !!getHariAktifSheet(ss),
    hariLibur: !!getHariLiburSheet(ss),
    riwayat: !!getRiwayatBelSheet(ss),
    pengguna: !!getPenggunaSheet(ss)
  };

  // Pastikan folder Google Drive BelSekolah_Audio siap
  try {
    const folderName = 'BelSekolah_Audio';
    const folders = DriveApp.getFoldersByName(folderName);
    if (!folders.hasNext()) {
      const newFolder = DriveApp.createFolder(folderName);
      try {
        newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (fErr) {}
    }
  } catch (dErr) {}

  Logger.log('Inisialisasi 7 Sheet Berhasil: ' + JSON.stringify(results));
  return results;
}

/**
 * ============================================================================
 * 1. OPERASI DATABASE PENGATURAN (SHEET: Pengaturan)
 * ============================================================================
 */
function getPengaturanSheet(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  let sheet = ss.getSheetByName(REQUIRED_SHEETS.PENGATURAN);
  if (!sheet) {
    sheet = ss.insertSheet(REQUIRED_SHEETS.PENGATURAN);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Kunci', 'Nilai', 'Keterangan']);
    sheet.getRange('A1:C1').setFontWeight('bold').setBackground('#E2E8F0');
    sheet.setFrozenRows(1);
    const defaults = [
      ['namaSekolah', 'SMP NEGERI 1 CONTOH', 'Nama Resmi Sekolah / Madrasah'],
      ['alamat', 'Jl. Pendidikan No. 45, Jakarta Pusat', 'Alamat Lengkap Sekolah'],
      ['tahunPelajaran', '2026/2027', 'Tahun Pelajaran Berjalan'],
      ['semester', 'Ganjil', 'Semester Aktif (Ganjil / Genap)'],
      ['kepalaSekolah', 'Drs. H. Ahmad Dahlan, M.Pd.', 'Nama Kepala Sekolah / Madrasah'],
      ['nipKepalaSekolah', '19750101 200003 1 001', 'NIP / NUPTK Kepala Sekolah'],
      ['zonaWaktu', 'Asia/Jakarta', 'Zona Waktu (Asia/Jakarta, Asia/Makassar, Asia/Jayapura)'],
      ['suaraDefault', 'preset:westminster', 'Suara bel cadangan default'],
      ['durasiBelDefault', '5', 'Durasi bunyi bel dalam detik'],
      ['toleransiWaktuDetik', '2', 'Toleransi deteksi sinkronisasi detik'],
      ['logoUrl', '', 'URL Gambar Logo Sekolah (Cloud)']
    ];
    defaults.forEach(function(row) { sheet.appendRow(row); });
    sheet.autoResizeColumns(1, 3);
  }
  return sheet;
}

function getSchoolSettings(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getPengaturanSheet(ss);
  const data = sheet.getDataRange().getValues();
  const settings = {
    namaSekolah: 'SMA / MA Negeri 1 Nusantara',
    npsnNsm: '20123456 / 131234567890',
    alamat: 'Jl. Pendidikan No. 45, Kompleks Madrasah Terpadu, Jakarta',
    tahunPelajaran: '2026/2027',
    semester: 'Ganjil',
    kepalaSekolah: 'Dr. H. Ahmad Fauzi, M.Pd.',
    nipKepalaSekolah: '19750101 200003 1 001',
    zonaWaktu: 'Asia/Jakarta',
    theme: 'emerald',
    suaraDefault: 'preset:westminster',
    durasiBelDefault: 5,
    toleransiWaktuDetik: 2,
    logoUrl: ''
  };

  for (let i = 1; i < data.length; i++) {
    const key = (data[i][0] || '').toString().trim();
    const val = data[i][1];
    if (key) {
      if (key === 'durasiBelDefault' || key === 'toleransiWaktuDetik') {
        settings[key] = Number(val) || settings[key];
      } else {
        settings[key] = (val !== undefined && val !== null) ? val.toString().trim() : '';
      }
    }
  }
  return settings;
}

function saveSchoolSettings(ss, config) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getPengaturanSheet(ss);
  const data = sheet.getDataRange().getValues();
  const keyMap = {};

  for (let i = 1; i < data.length; i++) {
    const key = (data[i][0] || '').toString().trim();
    if (key) {
      keyMap[key] = i + 1;
    }
  }

  for (const prop in config) {
    if (config.hasOwnProperty(prop)) {
      const val = config[prop];
      if (val !== undefined && val !== null) {
        if (keyMap[prop]) {
          sheet.getRange(keyMap[prop], 2).setValue(val.toString());
        } else {
          sheet.appendRow([prop, val.toString(), 'Pengaturan Aplikasi']);
        }
      }
    }
  }
  return getSchoolSettings(ss);
}

/**
 * ============================================================================
 * 2. OPERASI DATABASE JADWAL BEL (SHEET: JadwalBel)
 * ============================================================================
 */
function getJadwalBelSheet(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  let sheet = ss.getSheetByName(REQUIRED_SHEETS.JADWAL_BEL);
  if (!sheet) {
    sheet = ss.insertSheet(REQUIRED_SHEETS.JADWAL_BEL);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Hari', 'Jam', 'Keterangan', 'Jenis', 'Audio', 'Durasi', 'Status']);
    sheet.getRange('A1:H1').setFontWeight('bold').setBackground('#E2E8F0');
    sheet.setFrozenRows(1);
    const defaults = [
      ['JB-001', 'Semua Hari', '07:00', 'Masuk Kelas / Bel Pagi', 'Masuk', 'preset:westminster', 5, 'Aktif'],
      ['JB-002', 'Semua Hari', '07:45', 'Ganti Jam Pelajaran 1 ke 2', 'Ganti Jam', 'preset:triple_chime', 4, 'Aktif'],
      ['JB-003', 'Semua Hari', '08:30', 'Ganti Jam Pelajaran 2 ke 3', 'Ganti Jam', 'preset:triple_chime', 4, 'Aktif'],
      ['JB-004', 'Semua Hari', '09:45', 'Istirahat Pertama', 'Istirahat', 'preset:ding_dong', 5, 'Aktif'],
      ['JB-005', 'Semua Hari', '10:15', 'Selesai Istirahat Masuk Kembali', 'Masuk', 'preset:westminster', 5, 'Aktif'],
      ['JB-006', 'Jumat', '11:45', 'Selesai KBM Jumat & Shalat', 'Pulang', 'preset:westminster', 6, 'Aktif'],
      ['JB-007', 'Semua Hari', '14:30', 'KBM Selesai / Bel Pulang', 'Pulang', 'preset:westminster', 6, 'Aktif']
    ];
    defaults.forEach(function(row) { sheet.appendRow(row); });
    sheet.autoResizeColumns(1, 8);
  }
  return sheet;
}

function getJadwalBel(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getJadwalBelSheet(ss);
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = (row[0] || '').toString().trim();
    if (!id && !row[2]) continue;

    let jamVal = row[2];
    if (jamVal instanceof Date) {
      const h = String(jamVal.getHours()).padStart(2, '0');
      const m = String(jamVal.getMinutes()).padStart(2, '0');
      jamVal = h + ':' + m;
    } else {
      jamVal = (jamVal || '').toString().trim();
      if (jamVal.length === 4 && jamVal.indexOf(':') === -1) {
        jamVal = jamVal.substring(0, 2) + ':' + jamVal.substring(2);
      }
    }

    const statusVal = (row[7] || '').toString().trim().toLowerCase();
    const isActive = statusVal === 'aktif' || statusVal === 'true' || statusVal === '1';

    list.push({
      id: id || ('JB-' + i),
      hari: (row[1] || 'Semua Hari').toString().trim(),
      jam: jamVal,
      keterangan: (row[3] || '').toString().trim(),
      jenis: (row[4] || 'Lainnya').toString().trim(),
      audio: (row[5] || 'preset:westminster').toString().trim(),
      durasiDetik: Number(row[6]) || 5,
      statusAktif: isActive
    });
  }
  return list;
}

function saveAllJadwalBel(ss, items) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getJadwalBelSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 8).clearContent();
  }

  const rows = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    rows.push([
      item.id || ('JB-' + (i + 1)),
      item.hari || 'Semua Hari',
      item.jam || '07:00',
      item.keterangan || '',
      item.jenis || 'Lainnya',
      item.audio || 'preset:westminster',
      item.durasiDetik || 5,
      item.statusAktif ? 'Aktif' : 'Nonaktif'
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }
  return getJadwalBel(ss);
}

/**
 * ============================================================================
 * 3. OPERASI DATABASE SUARA BEL (SHEET: SuaraBel)
 * ============================================================================
 */
function getSuaraBelSheet(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  let sheet = ss.getSheetByName(REQUIRED_SHEETS.SUARA_BEL);
  if (!sheet) {
    sheet = ss.insertSheet(REQUIRED_SHEETS.SUARA_BEL);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'NamaSuara', 'UrlFile', 'Tipe', 'Status', 'Keterangan']);
    sheet.getRange('A1:F1').setFontWeight('bold').setBackground('#E2E8F0');
    sheet.setFrozenRows(1);
    const defaults = [
      ['SB-001', 'Westminster Melodi (4 Tone)', 'preset:westminster', 'Synthesizer', 'Aktif', 'Melodi standar sekolah resmi (G#4, E4, F#4, B3)'],
      ['SB-002', 'Triple Chime Ceria', 'preset:triple_chime', 'Synthesizer', 'Aktif', '3 Nada ceria (C5, E5, G5) cocok pergantian jam'],
      ['SB-003', 'Ding Dong Klasik', 'preset:ding_dong', 'Synthesizer', 'Aktif', 'Nada Ding Dong ganda untuk istirahat'],
      ['SB-004', 'Sirine Peringatan / Pengumuman', 'preset:siren', 'Synthesizer', 'Aktif', 'Nada ganda peringatan atau apel darurat'],
      ['SB-005', 'Dua Nada Standar (Ding)', 'preset:ding', 'Synthesizer', 'Aktif', 'Nada pendek dua ketukan']
    ];
    defaults.forEach(function(row) { sheet.appendRow(row); });
    sheet.autoResizeColumns(1, 6);
  }
  return sheet;
}

function getSuaraBel(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getSuaraBelSheet(ss);
  const data = sheet.getDataRange().getValues();
  const list = [];
  const seenIds = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let id = (row[0] || '').toString().trim();
    if (!id && !row[1]) continue;
    if (!id || seenIds[id]) {
      id = (id || 'SB-' + i) + '_' + i;
    }
    seenIds[id] = true;

    const statusVal = (row[4] || '').toString().trim().toLowerCase();
    const isActive = statusVal === 'aktif' || statusVal === 'true' || statusVal === '1';

    list.push({
      id: id,
      namaSuara: (row[1] || '').toString().trim(),
      urlFile: (row[2] || 'preset:westminster').toString().trim(),
      tipe: (row[3] || 'Bel Standar').toString().trim(),
      statusAktif: isActive,
      keterangan: (row[5] || '').toString().trim()
    });
  }
  return list;
}

function saveAllSuaraBel(ss, items) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getSuaraBelSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 6).clearContent();
  }

  const rows = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    rows.push([
      item.id || ('SB-' + (i + 1)),
      item.namaSuara || '',
      item.urlFile || '',
      item.tipe || 'Bel Standar',
      item.statusAktif ? 'Aktif' : 'Nonaktif',
      item.keterangan || ''
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }
  return getSuaraBel(ss);
}

/**
 * Membaca data base64 file audio dari Google Drive untuk diputar secara instan di browser tanpa batasan CORS
 */
function getAudioBase64FromDrive(fileId) {
  if (!fileId) {
    return {
      success: false,
      message: 'Parameter fileId tidak boleh kosong.'
    };
  }
  try {
    let cleanId = (fileId || '').toString().trim();
    if (cleanId.indexOf('id=') !== -1) {
      var matchId = cleanId.match(/id=([a-zA-Z0-9_-]+)/);
      if (matchId) cleanId = matchId[1];
    } else if (cleanId.indexOf('/d/') !== -1) {
      var matchD = cleanId.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (matchD) cleanId = matchD[1];
    }
    const file = DriveApp.getFileById(cleanId);
    if (!file) {
      return {
        success: false,
        message: 'File audio dengan ID "' + cleanId + '" tidak ditemukan di Google Drive.'
      };
    }
    const mimeType = file.getMimeType() || 'audio/mpeg';
    const blob = file.getBlob();
    const bytes = blob.getBytes();
    const base64 = Utilities.base64Encode(bytes);
    const dataUri = 'data:' + (mimeType || 'audio/mpeg') + ';base64,' + base64;
    return {
      success: true,
      fileId: cleanId,
      fileName: file.getName(),
      mimeType: mimeType,
      sizeBytes: bytes.length,
      dataUri: dataUri,
      dataUrl: dataUri
    };
  } catch (err) {
    return {
      success: false,
      error: err.toString(),
      message: 'Gagal membaca audio dari Google Drive: ' + err.message
    };
  }
}

/**
 * Upload Audio File to Google Drive and Save Metadata to Google Spreadsheet
 */
function uploadAudioFileToDrive(ss, payload) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  try {
    const rawFileName = (payload.fileName || payload.filename || ('Bel_' + Date.now() + '.mp3')).toString().trim();
    const cleanFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const base64Data = (payload.base64Data || payload.fileData || payload.data || '').toString();
    const mimeType = (payload.mimeType || 'audio/mpeg').toString();
    const customName = (payload.namaSuara || cleanFileName.replace(/\\.[^/.]+$/, '').replace(/[_-]/g, ' ')).toString();
    const tipe = (payload.tipe || 'Bel Standar').toString();
    const keterangan = (payload.keterangan || 'Audio Cloud Google Drive').toString();

    if (!base64Data) {
      return {
        success: false,
        message: 'Data audio base64 kosong.'
      };
    }

    // 1. Buat / Dapatkan Folder Google Drive BelSekolah_Audio
    const folderName = 'BelSekolah_Audio';
    let folders;
    try {
      folders = DriveApp.getFoldersByName(folderName);
    } catch (permError) {
      return {
        success: false,
        error: permError.toString(),
        message: 'Google Drive belum diotorisasi. Silakan buka editor Google Apps Script, pilih fungsi "authorizeGoogleDriveAccess", lalu klik "Jalankan (Run)" dan berikan izin.'
      };
    }

    let folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
      try {
        folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (fPermErr) {
        // Non-fatal
      }
    }

    // 2. Decode base64 dan Buat File di Drive
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const decodedBytes = Utilities.base64Decode(cleanBase64);
    const blob = Utilities.newBlob(decodedBytes, mimeType, cleanFileName);
    const driveFile = folder.createFile(blob);
    
    try {
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (permErr) {
      // Non-fatal
    }

    const fileId = driveFile.getId();
    // Direct CDN streaming URL (Google User Content CDN) yang tercepat dan didukung penuh oleh browser
    const streamUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
    
    // 3. Simpan entri baru ke Sheet SuaraBel di Google Spreadsheet
    const sheet = getSuaraBelSheet(ss);
    const existingData = sheet.getDataRange().getValues();
    const existingIds = {};
    let maxIdNum = 0;
    for (let r = 1; r < existingData.length; r++) {
      const rawId = (existingData[r][0] || '').toString().trim();
      if (rawId) {
        existingIds[rawId] = true;
        const match = rawId.match(/SB-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
        }
      }
    }
    let nextNum = Math.max(maxIdNum + 1, existingData.length);
    let newId = 'SB-' + String(nextNum).padStart(3, '0');
    while (existingIds[newId]) {
      nextNum++;
      newId = 'SB-' + String(nextNum).padStart(3, '0');
    }
    
    const sizeStr = payload.ukuran || (Math.round(decodedBytes.length / 1024) + ' KB');
    const noteWithDrive = (keterangan ? keterangan + ' | ' : '') + 'Drive ID: ' + fileId + ' (' + sizeStr + ')';

    sheet.appendRow([
      newId,
      customName,
      streamUrl,
      tipe,
      'Aktif',
      noteWithDrive
    ]);

    const updatedSuaraList = getSuaraBel(ss);

    return {
      success: true,
      message: 'File audio "' + cleanFileName + '" berhasil diunggah ke Google Drive & dicatat di Google Spreadsheet!',
      data: {
        fileId: fileId,
        url: streamUrl,
        suara: updatedSuaraList,
        newItem: {
          id: newId,
          namaSuara: customName,
          urlFile: streamUrl,
          tipe: tipe,
          statusAktif: true,
          keterangan: noteWithDrive
        },
        database: getDatabaseSummary(ss)
      }
    };
  } catch (err) {
    const errStr = err.toString();
    if (errStr.indexOf('DriveApp') !== -1 || errStr.indexOf('izin') !== -1 || errStr.indexOf('permission') !== -1 || errStr.indexOf('auth/drive') !== -1) {
      return {
        success: false,
        error: err.toString(),
        message: 'Izin Google Drive belum aktif. Buka editor Google Apps Script, pilih fungsi "authorizeGoogleDriveAccess", klik "Jalankan", lalu berikan izin Google Drive.'
      };
    }
    return {
      success: false,
      error: err.toString(),
      message: 'Gagal mengunggah audio ke Google Drive: ' + err.message
    };
  }
}

/**
 * Upload Logo File to Google Drive and Save to Sheet Pengaturan
 */
function uploadLogoFileToDrive(ss, payload) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  try {
    const rawFileName = (payload.fileName || payload.filename || ('Logo_' + Date.now() + '.png')).toString().trim();
    const cleanFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const base64Data = (payload.base64Data || payload.fileData || payload.data || '').toString();
    const mimeType = (payload.mimeType || 'image/png').toString();

    if (!base64Data) {
      return { success: false, message: 'Data logo base64 kosong.' };
    }

    const folderName = 'BelSekolah_Audio';
    let folders;
    try {
      folders = DriveApp.getFoldersByName(folderName);
    } catch (permError) {
      return {
        success: false,
        error: permError.toString(),
        message: 'Izin Google Drive belum aktif. Buka editor Google Apps Script, pilih fungsi "authorizeGoogleDriveAccess", klik "Jalankan", lalu berikan izin Google Drive.'
      };
    }

    let folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
      try {
        folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (fErr) {}
    }

    let cleanBase64 = base64Data;
    if (cleanBase64.indexOf(',') > -1) {
      cleanBase64 = cleanBase64.split(',')[1];
    }

    const decodedBytes = Utilities.base64Decode(cleanBase64);
    const blob = Utilities.newBlob(decodedBytes, mimeType, cleanFileName);
    const file = folder.createFile(blob);

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {}

    const fileId = file.getId();
    const logoUrl = 'https://lh3.googleusercontent.com/d/' + fileId;

    // Simpan otomatis ke sheet Pengaturan
    const sheet = getPengaturanSheet(ss);
    const data = sheet.getDataRange().getValues();
    let rowIdx = -1;
    for (let i = 1; i < data.length; i++) {
      if ((data[i][0] || '').toString().trim() === 'logoUrl') {
        rowIdx = i + 1;
        break;
      }
    }
    if (rowIdx > 0) {
      sheet.getRange(rowIdx, 2).setValue(logoUrl);
    } else {
      sheet.appendRow(['logoUrl', logoUrl, 'URL Gambar Logo Sekolah']);
    }

    return {
      success: true,
      message: 'Logo berhasil diunggah ke Google Drive!',
      data: {
        fileId: fileId,
        url: logoUrl,
        downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.toString(),
      message: 'Gagal mengunggah logo ke Google Drive: ' + err.message
    };
  }
}

/**
 * ============================================================================
 * 4. OPERASI DATABASE HARI AKTIF (SHEET: HariAktif)
 * ============================================================================
 */
function getHariAktifSheet(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  let sheet = ss.getSheetByName(REQUIRED_SHEETS.HARI_AKTIF);
  if (!sheet) {
    sheet = ss.insertSheet(REQUIRED_SHEETS.HARI_AKTIF);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Hari', 'Status', 'JamMasuk', 'JamPulang', 'Keterangan']);
    sheet.getRange('A1:E1').setFontWeight('bold').setBackground('#E2E8F0');
    sheet.setFrozenRows(1);
    const defaultDays = [
      ['Senin', 'Aktif', '07:00', '15:00', 'KBM Reguler & Upacara Bendera'],
      ['Selasa', 'Aktif', '07:00', '15:00', 'KBM Reguler'],
      ['Rabu', 'Aktif', '07:00', '15:00', 'KBM Reguler'],
      ['Kamis', 'Aktif', '07:00', '15:00', 'KBM Reguler'],
      ['Jumat', 'Aktif', '07:00', '11:45', 'KBM Pendek & Shalat Jumat'],
      ['Sabtu', 'Aktif', '07:00', '13:00', 'Ekstrakurikuler & Pengembangan'],
      ['Minggu', 'Nonaktif', '-', '-', 'Libur Akhir Pekan']
    ];
    defaultDays.forEach(function(d) { sheet.appendRow(d); });
    sheet.autoResizeColumns(1, 5);
  }
  return sheet;
}

function getHariAktif(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getHariAktifSheet(ss);
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const hari = (row[0] || '').toString().trim();
    if (!hari) continue;
    list.push({
      hari: hari,
      status: (row[1] || 'Aktif').toString().trim() === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
      jamMasuk: (row[2] || '').toString().trim(),
      jamPulang: (row[3] || '').toString().trim(),
      keterangan: (row[4] || '').toString().trim()
    });
  }
  return list;
}

function saveHariAktif(ss, items) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getHariAktifSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
  }

  const rows = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    rows.push([
      item.hari || '',
      item.status || 'Aktif',
      item.jamMasuk || '',
      item.jamPulang || '',
      item.keterangan || ''
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
  return getHariAktif(ss);
}

/**
 * ============================================================================
 * 5. OPERASI DATABASE HARI LIBUR (SHEET: HariLibur)
 * ============================================================================
 */
function getHariLiburSheet(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  let sheet = ss.getSheetByName(REQUIRED_SHEETS.HARI_LIBUR);
  if (!sheet) {
    sheet = ss.insertSheet(REQUIRED_SHEETS.HARI_LIBUR);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Tanggal', 'KeteranganLibur', 'TipeLibur', 'StatusAktif']);
    sheet.getRange('A1:E1').setFontWeight('bold').setBackground('#E2E8F0');
    sheet.setFrozenRows(1);
    sheet.appendRow(['HL-001', '2026-08-17', 'Hari Kemerdekaan Republik Indonesia', 'Nasional', 'Aktif']);
    sheet.appendRow(['HL-002', '2026-12-25', 'Hari Raya Natal', 'Nasional', 'Aktif']);
    sheet.autoResizeColumns(1, 5);
  } else {
    const headerRange = sheet.getRange('A1:E1');
    headerRange.setValues([['ID', 'Tanggal', 'KeteranganLibur', 'TipeLibur', 'StatusAktif']]);
    headerRange.setFontWeight('bold').setBackground('#E2E8F0');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 5);
  }
  return sheet;
}

function getHariLibur(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getHariLiburSheet(ss);
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = (row[0] || '').toString().trim();
    let tanggal = row[1];
    
    if (tanggal instanceof Date) {
      const y = tanggal.getFullYear();
      const m = String(tanggal.getMonth() + 1).padStart(2, '0');
      const d = String(tanggal.getDate()).padStart(2, '0');
      tanggal = y + '-' + m + '-' + d;
    } else {
      tanggal = (tanggal || '').toString().trim();
    }

    if (!id && !tanggal) continue;

    const statusVal = (row[4] || '').toString().trim().toLowerCase();
    const isActive = statusVal === 'aktif' || statusVal === 'true' || statusVal === '1';

    list.push({
      id: id || ('HL-' + i),
      tanggal: tanggal,
      keterangan: (row[2] || '').toString().trim(),
      tipeLibur: (row[3] || 'Nasional').toString().trim(),
      statusAktif: isActive
    });
  }
  return list;
}

function saveAllHariLibur(ss, items) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getHariLiburSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
  }

  const rows = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    rows.push([
      item.id || ('HL-' + (i + 1)),
      item.tanggal || '',
      item.keterangan || '',
      item.tipeLibur || 'Nasional',
      item.statusAktif ? 'Aktif' : 'Nonaktif'
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
  return getHariLibur(ss);
}

/**
 * ============================================================================
 * 6. OPERASI DATABASE RIWAYAT BEL (SHEET: RiwayatBel)
 * ============================================================================
 */
function getRiwayatBelSheet(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  let sheet = ss.getSheetByName(REQUIRED_SHEETS.RIWAYAT_BEL);
  if (!sheet) {
    sheet = ss.insertSheet(REQUIRED_SHEETS.RIWAYAT_BEL);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Tanggal', 'Jam', 'NamaJadwal', 'Mode', 'Status', 'Keterangan']);
    sheet.getRange('A1:G1').setFontWeight('bold').setBackground('#E2E8F0');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 7);
  }
  return sheet;
}

function getRiwayatBel(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getRiwayatBelSheet(ss);
  const data = sheet.getDataRange().getValues();
  const list = [];
  const startRow = Math.max(1, data.length - 100);
  for (let i = data.length - 1; i >= startRow; i--) {
    const row = data[i];
    const id = (row[0] || '').toString().trim();
    if (!id && !row[1]) continue;

    list.push({
      id: id || ('LOG-' + i),
      tanggal: (row[1] || '').toString().trim(),
      jam: (row[2] || '').toString().trim(),
      namaJadwal: (row[3] || '').toString().trim(),
      mode: (row[4] || 'Otomatis').toString().trim(),
      status: (row[5] || 'Berhasil').toString().trim(),
      keterangan: (row[6] || '').toString().trim()
    });
  }
  return list;
}

function addRiwayatBel(ss, entry) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getRiwayatBelSheet(ss);
  sheet.appendRow([
    entry.id || ('LOG-' + Date.now().toString().slice(-6)),
    entry.tanggal || new Date().toLocaleDateString('id-ID'),
    entry.jam || new Date().toLocaleTimeString('id-ID'),
    entry.namaJadwal || 'Bel Sekolah',
    entry.mode || 'Otomatis',
    entry.status || 'Berhasil',
    entry.keterangan || ''
  ]);
  return getRiwayatBel(ss);
}

function clearRiwayatBel(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getRiwayatBelSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
  }
  return [];
}

/**
 * ============================================================================
 * 7. OPERASI DATABASE PENGGUNA & AUTHENTICATION (SHEET: Pengguna)
 * ============================================================================
 */
function getPenggunaSheet(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  let sheet = ss.getSheetByName(REQUIRED_SHEETS.PENGGUNA);
  if (!sheet) {
    sheet = ss.insertSheet(REQUIRED_SHEETS.PENGGUNA);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Username', 'Password', 'NamaLengkap', 'Role', 'Status', 'TerakhirLogin']);
    sheet.getRange('A1:G1').setFontWeight('bold').setBackground('#E2E8F0');
    sheet.setFrozenRows(1);
    sheet.appendRow(['USR-001', 'admin', 'admin123', 'Administrator Utama', 'Admin', 'Aktif', '-']);
    sheet.appendRow(['USR-002', 'operator', 'operator123', 'Operator Bel Sekolah', 'Operator', 'Aktif', '-']);
    sheet.autoResizeColumns(1, 7);
  }
  return sheet;
}

function getPengguna(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getPenggunaSheet(ss);
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = (row[0] || '').toString().trim();
    const username = (row[1] || '').toString().trim();
    if (!id && !username) continue;

    const statusVal = (row[5] || '').toString().trim().toLowerCase();
    const isActive = statusVal === 'aktif' || statusVal === 'true' || statusVal === '1';

    list.push({
      id: id || ('USR-' + i),
      username: username,
      password: (row[2] || '').toString(),
      namaLengkap: (row[3] || username).toString().trim(),
      role: (row[4] || 'Operator').toString().trim() === 'Admin' ? 'Admin' : 'Operator',
      statusAktif: isActive,
      terakhirLogin: (row[6] || '-').toString().trim()
    });
  }
  return list;
}

function saveAllPengguna(ss, items) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const sheet = getPenggunaSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
  }

  const rows = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    rows.push([
      item.id || ('USR-' + (i + 1)),
      item.username || '',
      item.password || '',
      item.namaLengkap || item.username || '',
      item.role || 'Operator',
      item.statusAktif ? 'Aktif' : 'Nonaktif',
      item.terakhirLogin || '-'
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 7).setValues(rows);
  }
  return getPengguna(ss);
}

function verifyAndLoginUser(ss, username, password) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  const users = getPengguna(ss);
  const matched = users.find(function(u) {
    return u.username.toLowerCase() === username.toLowerCase() && u.password === password;
  });

  if (!matched) {
    return {
      success: false,
      message: 'Username atau password salah.'
    };
  }

  if (!matched.statusAktif) {
    return {
      success: false,
      message: 'Akun Anda sedang dinonaktifkan oleh Administrator.'
    };
  }

  try {
    const sheet = getPenggunaSheet(ss);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if ((data[i][1] || '').toString().toLowerCase() === username.toLowerCase()) {
        sheet.getRange(i + 1, 7).setValue(new Date().toLocaleString('id-ID'));
        break;
      }
    }
  } catch (e) {
    // Non-fatal
  }

  return {
    success: true,
    message: 'Login berhasil sebagai ' + matched.namaLengkap,
    user: {
      id: matched.id,
      username: matched.username,
      namaLengkap: matched.namaLengkap,
      role: matched.role,
      statusAktif: matched.statusAktif
    }
  };
}

/**
 * ============================================================================
 * 8. OPERASI PEMULIHAN SELURUH DATABASE (RESTORE FULL BACKUP)
 * ============================================================================
 */
function restoreFullDatabase(ss, backup) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  if (!backup) {
    return { success: false, message: 'Data cadangan tidak valid.' };
  }

  try {
    if (backup.settings) saveSchoolSettings(ss, backup.settings);
    if (backup.jadwal && Array.isArray(backup.jadwal)) saveAllJadwalBel(ss, backup.jadwal);
    if (backup.suara && Array.isArray(backup.suara)) saveAllSuaraBel(ss, backup.suara);
    if (backup.hariAktif && Array.isArray(backup.hariAktif)) saveHariAktif(ss, backup.hariAktif);
    if (backup.hariLibur && Array.isArray(backup.hariLibur)) saveAllHariLibur(ss, backup.hariLibur);
    if (backup.pengguna && Array.isArray(backup.pengguna)) saveAllPengguna(ss, backup.pengguna);

    return {
      success: true,
      message: 'Seluruh database 7 sheet berhasil dipulihkan dari file cadangan.',
      data: {
        settings: getSchoolSettings(ss),
        jadwal: getJadwalBel(ss),
        suara: getSuaraBel(ss),
        hariAktif: getHariAktif(ss),
        hariLibur: getHariLibur(ss),
        riwayat: getRiwayatBel(ss),
        pengguna: getPengguna(ss),
        database: getDatabaseSummary(ss)
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.toString(),
      message: 'Gagal memulihkan database: ' + err.message
    };
  }
}

/**
 * ============================================================================
 * SUMMARY INFORMASI 7 LEMBAR KERJA
 * ============================================================================
 */
function getDatabaseSummary(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  if (!ss) return null;

  const sheetsInfo = [];
  const sheetSpecs = [
    { name: REQUIRED_SHEETS.PENGATURAN, description: 'Konfigurasi identitas sekolah & tahun ajaran', headers: ['Kunci', 'Nilai', 'Keterangan'] },
    { name: REQUIRED_SHEETS.JADWAL_BEL, description: 'Master jadwal bel KBM harian', headers: ['ID', 'Hari', 'Jam', 'Keterangan', 'Jenis', 'Audio', 'Durasi', 'Status'] },
    { name: REQUIRED_SHEETS.SUARA_BEL, description: 'Daftar audio & Google Drive stream', headers: ['ID', 'NamaSuara', 'UrlFile', 'Tipe', 'Status', 'Keterangan'] },
    { name: REQUIRED_SHEETS.HARI_AKTIF, description: 'Status hari aktif belajar sekolah', headers: ['Hari', 'Status', 'JamMasuk', 'JamPulang', 'Keterangan'] },
    { name: REQUIRED_SHEETS.HARI_LIBUR, description: 'Daftar kalender libur & ujian', headers: ['ID', 'Tanggal', 'KeteranganLibur', 'TipeLibur', 'StatusAktif'] },
    { name: REQUIRED_SHEETS.RIWAYAT_BEL, description: 'Catatan riwayat bunyi bel sekolah', headers: ['ID', 'Tanggal', 'Jam', 'NamaJadwal', 'Mode', 'Status', 'Keterangan'] },
    { name: REQUIRED_SHEETS.PENGGUNA, description: 'Akun login Admin & Operator', headers: ['ID', 'Username', 'Password', 'NamaLengkap', 'Role', 'Status', 'TerakhirLogin'] }
  ];

  sheetSpecs.forEach(function(spec) {
    const s = ss.getSheetByName(spec.name);
    if (s) {
      sheetsInfo.push({
        name: spec.name,
        exists: true,
        rowCount: Math.max(0, s.getLastRow() - 1),
        description: spec.description,
        headers: spec.headers,
        lastUpdated: new Date().toISOString()
      });
    } else {
      sheetsInfo.push({
        name: spec.name,
        exists: false,
        rowCount: 0,
        description: spec.description,
        headers: spec.headers,
        lastUpdated: null
      });
    }
  });

  return {
    connected: true,
    statusText: 'Database Google Spreadsheet Terhubung (100% Cloud)',
    spreadsheetTitle: ss.getName(),
    spreadsheetId: ss.getId(),
    lastChecked: new Date().toISOString(),
    sheets: sheetsInfo
  };
}
`;

