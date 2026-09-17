# LMS STIE Nasional Banjarmasin (v2.0 Serverless Edition)

Aplikasi Web **Learning Management System (LMS) STIE Nasional Banjarmasin** dengan arsitektur **Jamstack Serverless**:
- **Frontend**: Single Page Application (SPA) berbasis **React 18 + Vite + Tailwind CSS + Lucide Icons**, di-deploy ke **GitHub Pages**.
- **Backend (BaaS)**: **Google Cloud Firebase** (Firebase Authentication, Cloud Firestore NoSQL, Firebase Storage, dan Security Rules).

---

## 🌟 Fitur Unggulan Sesuai PRD

1. **Multi-Role RBAC (FR-01)**:
   - Mendukung 4 persona: **Super Admin**, **Admin Akademik**, **Dosen Pengampu**, dan **Mahasiswa**.
   - Pemetaan login otomatis berbasis Email maupun format angka **NIM/NIDN** (`...@lms.stienas.ac.id`).
   - Pengecekan status akun aktif (`isActive == false` otomatis ditolak).
   - Dilengkapi *Quick Role Switcher* untuk kemudahan evaluasi & pengujian peran.
2. **Master Data Akademik (FR-02)**:
   - Manajemen Fakultas & Program Studi (S1 Manajemen & S1 Akuntansi).
   - Kontrol Tahun Akademik Aktif (otomatis hanya 1 TA yang aktif).
   - Kurikulum Mata Kuliah lengkap dengan bobot SKS dan Dosen Pengampu.
   - **Impor Massal JSON Sisi Klien (FR-02.4)** untuk entri data massal Mahasiswa, Dosen, dan Mata Kuliah dengan batch insert.
3. **Otomatisasi 16 Pertemuan Perkuliahan (FR-03)**:
   - Setiap kelas kuliah yang dibuka secara otomatis membentuk **16 modul pertemuan**:
     - Pertemuan 1–7: Materi Pokok & Konsep
     - **Pertemuan 8: Khusus Ujian Tengah Semester (UTS)**
     - Pertemuan 9–15: Materi Lanjutan & Analisis Studi Kasus
     - **Pertemuan 16: Khusus Ujian Akhir Semester (UAS)**
   - Manajemen Kuota Kelas & Enrollment Mahasiswa.
4. **Bahan Ajar & Media Perkuliahan (FR-04)**:
   - Unggah berkas modul kuliah (PDF, DOCX, PPTX, XLSX, ZIP).
   - Integrasi langsung media YouTube Player, MP4 Player, Google Meet, dan Zoom Meeting.
5. **Presensi Pertemuan Cepat (FR-05)**:
   - Modal presensi kilat bagi Dosen (`HADIR`, `IZIN`, `SAKIT`, `ALPHA` + catatan).
   - Mahasiswa dapat memantau status presensi secara real-time.
6. **Pengumpulan Tugas & Client-Side Image Compression (FR-06)**:
   - **Optimasi Kompresi Sisi Klien (FR-06.1)**: Berkas gambar di atas 2 MB otomatis di-downscale dan dikompres via HTML5 Canvas menjadi JPEG kualitas 70% sebelum diunggah (menghemat kuota Firebase Storage & mempercepat upload).
   - Penilaian tugas oleh Dosen (skala 0–100) dan umpan balik (*feedback*).
7. **Buku Nilai (Gradebook) Otomatis (FR-07)**:
   - Formula perhitungan standar:
     $$\text{Nilai Akhir} = (20\% \times \text{Tugas}) + (15\% \times \text{Kuis}) + (30\% \times \text{UTS}) + (35\% \times \text{UAS})$$
   - Konversi huruf mutu terstandar: A (≥85), B (≥75), C (≥65), D (≥50), E (<50).
   - Ekspor Buku Nilai ke format **CSV / Excel** langsung di browser.
8. **Laporan Kinerja Dosen & Audit Log (FR-08)**:
   - Akumulasi Skor Keaktifan Dosen:
     $$\text{Skor} = (\text{Total Materi} \times 2) + (\text{Total Presensi} \times 1) + (\text{Total Tugas Dinilai} \times 3)$$
   - Audit Trail Logs terpusat untuk seluruh aktivitas krusial kampus.

---

## 🚀 Menjalankan Aplikasi Secara Lokal

### Prasyarat:
- Node.js versi 18+ atau 20+
- npm

### Langkah Menjalankan:
```bash
# 1. Masuk ke direktori
cd d:/VM/lms

# 2. Jalankan development server
npm run dev
```

Buka peramban pada alamat lokal (contoh: `http://localhost:5173`).

---

## 📦 Membangun untuk Produksi & GitHub Pages

```bash
# Kompilasi aset statis ke direktori dist/
npm run build
```

Hasil kompilasi pada folder `dist/` siap dipublikasikan ke GitHub Pages dengan jalur aset relatif `./` sehingga bebas error 404 pada subpath repository `https://stienasbjm.github.io/lms/`.

---

## 🔄 Deployment Otomatis via GitHub Actions

Workflow CI/CD telah dikonfigurasi pada [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

Setiap kali kode di-push ke branch `main`, GitHub Actions akan:
1. Menjalankan checkout repository
2. Menginstall dependensi via `npm ci`
3. Menjalankan `npm run build`
4. Mendistribusikan berkas `dist/` ke **GitHub Pages** secara otomatis!

---

## 🔒 Konfigurasi Keamanan Firebase

- **Aturan Firestore**: Lihat berkas [`firestore.rules`](firestore.rules).
- **Aturan Storage**: Lihat berkas [`storage.rules`](storage.rules).
- **Setup Kredensial**: Pengguna dapat memasukkan kredensial Firebase langsung dari antarmuka aplikasi melalui tombol **Firebase: Demo/Config** pada Header atau via modal pengaturan.
