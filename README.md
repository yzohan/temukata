# 🐧 TemuKata — Lab Literasi Membaca & Petualangan Bahasa Indonesia

TemuKata adalah platform pembelajaran literasi membaca Bahasa Indonesia interaktif berbasis bukti teks (*evidence-based reading*), dirancang dengan antarmuka gamifikasi yang menyenangkan seperti Duolingo dan palet warna pastel yang lembut (*calming aesthetic*).

Platform ini membantu murid meningkatkan pemahaman membaca mendalam melalui penemuan kalimat bukti langsung pada teks (*highlighter / stabilo*), didukung maskot pinguin TemuKata, sistem streak harian, permata (*diamonds*), papan juara (*leaderboard*), dan mode gelap/terang.

---

## 🌟 Fitur Utama

1. **6 Modul Literasi Membaca Resmi**:
   - 🎯 **Gagasan Pokok**: Menentukan inti dan ide utama paragraf deduktif/induktif.
   - 🔍 **Fakta vs Opini**: Membedakan pernyataan objektif berbasis data versus opini subjektif.
   - 💡 **Pesan Moral & Amanat**: Menggali nilai budi pekerti dan amanat cerita fabel/cerpen.
   - ⚖️ **Hubungan Sebab-Akibat**: Menganalisis korelasi kausalitas antarperistiwa dalam teks.
   - 🌸 **Makna Kiasan & Peribahasa**: Memahami ungkapan kontekstual dan metafora sastra.
   - 🧠 **Membaca Kritis & Evaluasi Teks**: Menilai objektivitas teks argumentatif dan membedakan klaim valid vs hoaks.

2. **Bukti Teks Interaktif (Interactive Highlighter / Stabilo)**:
   - Setiap soal menuntut murid menyorot kalimat bukti di dalam teks sebelum menjawab.
   - Melatih ketelitian membaca dan penalaran kritis.

3. **Timer 5 Menit per Sesi**:
   - Melatih manajemen waktu murid saat membaca teks dan menjawab soal.

4. **Sistem Gamifikasi Dinamis**:
   - 🔥 **Streak Api Harian**:
     - **Api Abu-Abu**: Muncul saat streak mati (0 hari) atau murid **belum menyelesaikan bacaan hari ini**.
     - **Api Oranye Menyala**: Otomatis menyala dan bergerak aktif begitu murid **selesai membaca 1 teks hari ini**.
   - 💎 **Permata (Diamonds)**: Bonus permata setiap menyelesaikan modul latihan.
   - 🏆 **Papan Juara (Leaderboard)**: Peringkat membaca mingguan antarmurid.
   - 📅 **Kalender Streak Mingguan**: Pelacak konsistensi membaca 7 hari dengan *streak freeze protection*.

5. **Mode Gelap (Dark Mode) & Mode Terang (Light Mode)**:
   - Tombol toggle di navbar atas (`🌙 Gelap` / `☀️ Terang`).
   - Warna mode gelap disesuaikan dengan *soft midnight navy & slate* agar tidak menyilaukan mata saat membaca.
   - Preferensi tersimpan otomatis di `localStorage`.

6. **Dashboard Guru & Admin**:
   - Guru dapat membuat bacaan baru dan menyusun soal interaktif beserta kunci bukti teks.
   - Rekap nilai dan evaluasi akurasi jawaban murid.
   - Sinkronisasi langsung ke database Supabase.

---

## 🔑 Akun Bawaan (Default Credentials)

| Peran (Role) | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Guru / Admin** | `ijah@gmail.com` | `admin123` | Akses Dashboard Admin, Buat Bacaan, & Evaluasi Murid |
| **Murid** | `budi@gmail.com` | `budi123` | Akses Peta Belajar, 6 Modul Literasi, & Leaderboard |

> 💡 **Catatan**: Murid baru juga dapat mendaftar langsung melalui tombol **Daftar Akun Baru** di halaman login.

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat
- **Node.js** versi 18 atau lebih baru.
- Koneksi internet (untuk sinkronisasi Supabase).

---

### 2. Setup Database Supabase
Jika database Supabase baru dibuat atau direset:
1. Buka dashboard proyek Supabase Anda.
2. Masuk ke menu **SQL Editor**.
3. Buka file `supabase/full_setup.sql` di proyek ini.
4. Salin seluruh isi file tersebut, tempelkan ke SQL Editor Supabase, lalu klik **Run**.
5. Skrip ini akan membuat seluruh tabel (`profiles`, `lessons`, `questions`, `results`), relasi, trigger pendaftaran, serta mengisikan 6 modul resmi Bahasa Indonesia beserta 30 soal lengkap.

---

### 3. Konfigurasi Environment (`.env`)

#### Backend (`backend/.env`):
```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

#### Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

### 4. Menjalankan Backend Server

Buka terminal baru:
```bash
cd backend
npm install
npm run dev
```
Backend akan aktif di: **`http://localhost:4000`**

---

### 5. Menjalankan Frontend Web

Buka terminal kedua:
```bash
cd frontend
npm install
npm run dev
```
Frontend akan aktif di: **`http://localhost:5173`**

Buka browser dan akses **`http://localhost:5173`**.

---

## ☁️ Panduan Deploy ke Cloudflare (Frontend + Backend 1 Paket)

Aplikasi **TemuKata** sudah dilengkapi arsitektur **Cloudflare Pages Full-Stack (Pages + Functions)**. Artinya, **Frontend (React)** dan **Backend (API Serverless)** akan dideploy bersamaan ke Cloudflare dalam **1 domain yang sama** tanpa butuh server terpisah!

### Cara Deploy Lewat GitHub (Otomatis):
1. **Push Proyek ke Repository GitHub**.
2. Buka [dash.cloudflare.com](https://dash.cloudflare.com/) > menu **Workers & Pages** > klik **Create Application** > tab **Pages** > **Connect to Git**.
3. Pilih repository GitHub TemuKata.
4. Pada **Build settings**:
   - **Framework preset**: `Vite`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Pada **Environment variables**:
   - `NODE_VERSION` = `20`
   - `SUPABASE_URL` = ``
   - `SUPABASE_SERVICE_ROLE_KEY` = *(isi dengan Service Role Key Supabase Anda)*
   - `VITE_SUPABASE_URL` = ``
   - `VITE_SUPABASE_ANON_KEY` = *(isi dengan Anon Key Supabase Anda)*
6. Klik **Save and Deploy**. Cloudflare akan mem-build frontend dan backend API sekaligus di domain `https://temukata.pages.dev`!

---

## 📁 Struktur Direktori

```
learning app/
├── backend/                  # REST API Express & Node.js
│   ├── src/
│   │   ├── config/supabase.ts# Koneksi Supabase Service Role
│   │   ├── routes/           # Endpoint auth, lessons, questions, results
│   │   └── server.ts         # Entry point backend server
│   ├── package.json
│   └── .env
│
├── frontend/                 # Client Aplikasi React + Vite + Tailwind CSS
│   ├── public/
│   │   ├── streak-active.png # Ikon api menyala oranye (streak aktif)
│   │   ├── streak-inactive.png# Ikon api abu-abu (belum main / mati)
│   │   ├── temukata-penguin.svg
│   │   └── temukata-penguin-clean.png
│   ├── src/
│   │   ├── auth/             # AuthProvider & proteksi rute
│   │   ├── components/       # AppShell, StreakFlame, Mascot, Timer, Modal
│   │   ├── lib/              # api.ts (Supabase + fallback), sounds, gamification
│   │   ├── pages/            # StudentDashboard, LessonPage, TeacherDashboard, Login
│   │   ├── style.css         # Styling kustom, 3D buttons, & dark mode theme
│   │   └── main.tsx
│   ├── package.json
│   └── .env
│
├── supabase/
│   ├── full_setup.sql        # Skrip skema database lengkap & seed data
│   └── schema.sql
│
└── README.md                 # Dokumentasi lengkap proyek
```

---

## 🛠️ Tech Stack & Arsitektur (Penjelasan untuk Pemula / Awam)

Biar gampang dipahami, bayangkan aplikasi TemuKata ini seperti sebuah **Restoran**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🍽️ FRONTEND (Ruang Makan & Pelayan)                                    │
│ React 19 + TypeScript + Vite + Tailwind CSS v4                         │
│ ➜ Bagian yang dilihat dan diklik oleh pengguna di layar HP / Laptop.   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Kirim pesanan / request data)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 👨‍🍳 BACKEND (Dapur Restoran)                                            │
│ Node.js + Express.js + TypeScript                                      │
│ ➜ Mengolah logika, memvalidasi jawaban, menghitung skor & streak.      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Simpan & ambil bahan makanan)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 📦 DATABASE & AUTH (Gudang Bahan / Brankas)                            │
│ Supabase (PostgreSQL + Auth System)                                    │
│ ➜ Tempat menyimpan akun user, riwayat bacaan, soal, dan tabel profil.  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. 🖥️ Frontend (Tampilan Aplikasi)
Bagian yang langsung dilihat dan digunakan oleh murid dan guru:
- **React 19**: Fondasi antarmuka (*UI*) modern yang membuat halaman terasa interaktif, cepat, dan tidak perlu *reload/refresh* layar saat berpindah menu.
- **TypeScript**: Bahasa JavaScript versi aman dengan sistem pengecekan tipe (*type-safety*) otomatis, meminimalisir *bug* atau eror kodingan saat aplikasi dikembangkan.
- **Vite**: Alat pembuat (*bundler*) proyek super kilat. Membuka server lokal hanya butuh hitungan detik.
- **Tailwind CSS v4**: Alat penata gaya (*styling*) desain. Bertanggung jawab atas warna estetik, tata letak ala Duolingo, tombol 3D, serta peralihan mulus antara **Light Mode** dan **Dark Mode**.
- **Lucide React & SVG Icons**: Koleksi ikon grafis modern (rumah burung, barbel, perisai juara, toko) yang ringan dan tajam di semua ukuran layar.
- **Web Audio API**: Efek suara sintetis (suara *pop*, klik tombol, efek berhasil) yang diproses langsung oleh browser tanpa perlu men-download file audio `.mp3` berat.

### 2. ⚙️ Backend (Otak & Logika Bisnis)
Bagian server di balik layar yang memproses data:
- **Node.js**: Mesin yang menjalankan bahasa pemrograman JavaScript/TypeScript di sisi server (luar browser).
- **Express.js**: Kerangka kerja (*framework*) minimalis untuk membuat jalur API (*REST endpoints*), menjadi jembatan penghubung antara tampilan web (Frontend) dan database.
- **Zod**: Penjaga pintu data yang memverifikasi input dari pengguna agar data yang dikirim tidak rusak atau disusupi format salah.

### 3. 🗄️ Database & Keamanan (Tempat Simpan Data)
- **Supabase (PostgreSQL)**: Database berbasis cloud tingkat industri untuk menyimpan data akun murid/guru, bank soal bacaan, serta riwayat jawaban.
- **Supabase Auth**: Sistem keamanan untuk login dan pendaftaran akun murid dengan enkripsi kata sandi yang aman.
- **Row Level Security (RLS)**: Sistem perizinan ketat di database sehingga murid hanya bisa mengubah profil milik mereka sendiri tanpa bisa mengutak-atik akun orang lain.

---

Dibuat dengan ❤️ untuk kemajuan literasi membaca anak-anak Indonesia.
