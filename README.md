# 🔔 Bel Sekolah & Madrasah Digital (Versi 5.0 Final Edition)

Aplikasi web modern, stabil, responsif, dan mudah digunakan untuk manajemen dan operasional **Bel Sekolah / Madrasah Digital** otomatis dan manual. Menggunakan **Google Spreadsheet sebagai basis data cloud** dan **Google Apps Script API** sebagai backend serverless tanpa biaya server (Zero Server Cost).

---

## ✨ Fitur Lengkap (Tahap 1 s/d 5)

1. **Dashboard Realtime Modern:**
   * Jam digital presisi tinggi (HH:MM:SS) dengan sinkronisasi zona waktu (WIB, WITA, WIT).
   * Status kegiatan belajar mengajar (KBM) saat ini & jadwal berikutnya dengan hitung mundur (*countdown*) realtime.
   * Banner status audio (Aktif / Nonaktif) dengan penanganan kebijakan autoplay browser modern (Chrome, Edge, Safari).
   * Ringkasan identitas madrasah/sekolah, koneksi spreadsheet, dan log pemutaran bel.

2. **Manajemen Jadwal Bel (Sheet: `JadwalBel`):**
   * Tambah, edit, hapus, dan aktif/nonaktifkan jadwal.
   * Validasi format jam `HH:mm` 24 jam dan pencegahan duplikasi jadwal.
   * Pemilihan suara bel per jadwal.

3. **Manajemen Suara Bel & Web Audio Engine (Sheet: `SuaraBel`):**
   * Sintesis nada bawaan berbasis Web Audio API presisi (*Westminster Chime*, *Triple Chime*, *Ding Dong*, *Sirine Apel*).
   * Dukungan tautan file audio eksternal format MP3 dan WAV.
   * Fitur pratinjau (*preview*) suara bel dan kontrol bel manual 1-klik.

4. **Konfigurasi Hari Aktif & Kalender Libur (Sheet: `HariAktif` & `HariLibur`):**
   * Pengaturan status aktif hari Senin sampai Minggu.
   * Kalender hari libur nasional / ujian / khusus.
   * **Prioritas Otomasi:** *Hari Libur* ➔ *Hari Aktif* ➔ *Jadwal Bel*.

5. **Sidebar Navigasi Responsif:**
   * Menu navigasi lengkap berikon modern: Dashboard, Jadwal, Suara, Hari Aktif, Hari Libur, Riwayat, Konfigurasi, Backup & Export, Pengguna, dan Tentang Aplikasi.
   * Tampilan drawer ramah sentuhan untuk smartphone & tablet.

6. **Sistem Autentikasi Pengguna Multi-Role (Sheet: `Pengguna`):**
   * **Admin:** Akses penuh seluruh sistem, manajemen akun pengguna, backup/restore, pengaturan sekolah.
   * **Operator:** Operasional bel harian, pemutaran bel manual, pemantauan jadwal & riwayat.

7. **Backup & Export Data Mandiri:**
   * Ekspor 1-klik Full System Backup (.JSON).
   * Ekspor Jadwal Bel dan Riwayat Bel ke format Excel (.CSV).
   * Pemulihan (*Restore*) data cadangan terverifikasi langsung ke Google Spreadsheet.

---

## 🗄️ Struktur 7 Lembar Kerja Google Spreadsheet

| No | Nama Sheet | Kolom Header | Deskripsi |
|---|---|---|---|
| 1 | `Pengaturan` | `Kunci`, `Nilai`, `Keterangan`, `TerakhirDiperbarui` | Identitas sekolah, tahun ajaran, dan zona waktu |
| 2 | `JadwalBel` | `ID`, `Hari`, `Jam`, `Keterangan`, `Tipe`, `Audio`, `StatusAktif` | Master jadwal bel KBM |
| 3 | `SuaraBel` | `ID`, `NamaSuara`, `UrlFile`, `Tipe`, `StatusAktif`, `Keterangan` | Daftar nada dan berkas audio |
| 4 | `HariAktif` | `Hari`, `Status`, `JamMasuk`, `JamPulang`, `Keterangan` | Status operasional hari sekolah |
| 5 | `HariLibur` | `ID`, `Tanggal`, `KeteranganLibur`, `TipeLibur`, `StatusAktif` | Daftar tanggal libur |
| 6 | `RiwayatBel` | `ID`, `Tanggal`, `Jam`, `NamaJadwal`, `Mode`, `Status`, `Keterangan` | Audit log pemutaran bel |
| 7 | `Pengguna` | `ID`, `Username`, `Password`, `Nama`, `Role`, `Status`, `TerakhirLogin` | Master akun pengguna dan hak akses |

---

## 🚀 Panduan Instalasi & Deployment

### 1. Persiapan Backend Google Apps Script

1. Buka [Google Spreadsheet](https://sheets.new) baru.
2. Beri nama spreadsheet (contoh: `Database Bel Sekolah`).
3. Klik menu **Ekstensi** > **Apps Script**.
4. Hapus kode bawaan dan tempelkan kode yang tersedia di menu **Panduan Apps Script** di dalam aplikasi web ini.
5. Klik tombol **Terapkan (Deploy)** > **Deployment Baru (New Deployment)**.
6. Pilih jenis: **Aplikasi Web (Web App)**:
   * *Jalankan sebagai (Execute as):* **Saya (Me / Email Anda)**
   * *Yang memiliki akses (Who has access):* **Siapa saja (Anyone)**
7. Salin URL Aplikasi Web yang berakhiran `/exec`.
8. Buka aplikasi web ini, masuk ke menu **Konfigurasi Sistem**, tempelkan URL tersebut dan klik **Simpan Konfigurasi** serta **Inisialisasi 7 Sheet**.

### 2. Menjalankan di Lokal (Development)

```bash
# Clone repositori
git clone https://github.com/username/bel-sekolah-digital.git
cd bel-sekolah-digital

# Install dependensi
npm install

# Jalankan server lokal
npm run dev
```

### 3. Deploy ke Vercel

1. Buat repositori baru di GitHub dan lakukan `push` kode.
2. Buka [Vercel](https://vercel.com/) dan impor repositori.
3. Framework Preset: **Vite**.
4. Klik **Deploy**. Selesai!

---

## 🏫 Mode Multi-Sekolah (Satu Alamat untuk Banyak Sekolah)

Aplikasi mendukung banyak sekolah/madrasah dalam satu alamat deployment melalui file **`public/schools.json`**. Saat dibuka, pengunjung memilih sekolah dari daftar, dan aplikasi otomatis tersambung ke backend (Google Spreadsheet + Apps Script) masing-masing sekolah. Data tiap sekolah tetap terpisah.

Format `public/schools.json`:

```json
[
  {
    "id": "mts-alislam-ngleses",
    "nama": "MTs Al Islam Ngleses",
    "kota": "Juwangi, Boyolali",
    "apiUrl": "https://script.google.com/macros/s/XXXX/exec"
  },
  {
    "id": "sdn-01-nusantara",
    "nama": "SDN 01 Nusantara",
    "apiUrl": "https://script.google.com/macros/s/YYYY/exec"
  }
]
```

* `id`: unik, huruf kecil tanpa spasi (dipakai sebagai penanda).
* `nama`: nama sekolah yang tampil di daftar pilih.
* `kota`: opsional, tampil sebagai keterangan.
* `apiUrl`: URL Web App (`/exec`) milik sekolah tersebut.

**Menambah sekolah baru:** edit `public/schools.json`, commit, push — Vercel otomatis deploy ulang. Prioritas koneksi: parameter URL `?school=` (atau `?api=` manual) → sekolah yang terakhir dipilih (tersimpan di browser) → daftar pilih sekolah → konfigurasi manual. Untuk sekolah terdaftar, aplikasi memakai `?school=<id>` agar URL Apps Script tidak terlihat di address bar.

---

## 🛡️ Akun Bawaan Sistem (Sheet: `Pengguna`)

* **Administrator Utama:**
  * Username: `admin`
  * Password: `admin123`
  * Role: `Admin` (Akses Penuh)

* **Operator Bel:**
  * Username: `operator`
  * Password: `operator123`
  * Role: `Operator` (Operasional Harian)

*Kata sandi dapat diubah langsung melalui menu Manajemen Pengguna atau sheet `Pengguna`.*

---

## 📄 Lisensi
Hak Cipta © 2026 - Dikembangkan untuk kemajuan digitalisasi madrasah dan sekolah di Indonesia.
