# Rencana Pengembangan Lari Pintar 3D — Edisi Dunia Baru, Power-Up & Studio Guru Pintar

Peningkatan menyeluruh untuk menjadikan **Lari Pintar 3D** semakin seru, variatif, dan siap dipakai mengajar di kelas SD (Kelas 1–6) maupun bermain bersama di rumah—menghadirkan 4 dunia 3D tematik, power-up aksi & Mode Fever, aksesori karakter 3D, musik latar ceria dinamis, QR Code ruang + rekap nilai CSV, serta pembuat soal otomatis berbasis topik untuk guru, dengan performa tetap ringan di HP maupun laptop sekolah.

---

## Ringkasan Keputusan & Konfirmasi Pengguna

> [!IMPORTANT]
> Semua pilihan berikut sudah dikonfirmasi dari sesi tanya-jawab dan akan langsung menjadi acuan utama pengembangan:

- **Pilihan Fitur Utama (Semua Aktif)**:
  1. **4 Tema Dunia 3D**: Taman Nusantara, Pantai Tropis, Lembah Salju, dan Kota Angkasa.
  2. **Power-Up Trek & Mode Fever**: Perisai Pelindung, Magnet Bintang, dan Mode Fever Pelangi (saat 3x benar berturut-turut).
  3. **Kustomisasi Aksesori Pelari 3D**: Topi Olahraga (bawaan), Helm Astronot, Telinga Kelinci, Topi Wisuda, dan Mahkota Bintang.
  4. **Fitur Kelas & Guru**: QR Code ruang multi-perangkat (langsung scan dari HP/tablet siswa) serta tombol ekspor **Rekap Nilai CSV** di akhir balapan.
  5. **Musik Latar Ceria Dinamis (Web Audio BGM)**: Musik sintesis ringan yang temponya meningkat saat Mode Fever atau detik-detik akhir, dengan kontrol suara terpisah dari efek SFX.
- **Pembuat Soal Otomatis di Studio Guru**: Guru cukup mengetik topik (misalnya *"Pecahan desimal kelas 5"* atau *"Bagian tubuh hewan kelas 1"*), memilih tingkat kelas dan jumlah soal (5–15 soal), lalu soal pilihan ganda 3 opsi + kunci + penjelasan dibuat otomatis lewat server dan siap ditinjau/disimpan ke Bank Soal Guru.
- **Profil Visual & Performa**: **Seimbang** — efek meriah (partikel, cuaca ringan, kilau Fever, aksesori 3D), namun menjaga jumlah objek dan *instancing* hemat agar tetap lancar di laptop sekolah maupun HP siswa.

---

## 1. Gambaran Umum & Konsep Utama

- **Apa yang Dihadirkan**: Transformasi Lari Pintar 3D dari satu lintasan taman menjadi arena edukasi multi-dunia yang penuh kejutan positif. Setiap sesi balapan terasa baru karena guru atau siswa dapat memilih latar dunia 3D, mendandani pelari dengan aksesori lucu, memungut power-up strategis di tengah lintasan, serta mendengar iringan musik ceria yang bereaksi terhadap *streak* jawaban benar.
- **Target Pengguna**:
  - **Siswa SD Kelas 1–6**: Belajar sambil berkompetisi sehat, termotivasi mengejar Mode Fever, mengumpulkan bintang, dan tampil keren dengan topi pilihan sendiri.
  - **Guru & Orang Tua**: Menyiapkan soal tematik hanya dalam hitungan detik (ketik topik → jadi), mengajak hingga 8 perangkat siswa bergabung instan lewat scan QR Code, lalu mengunduh rekap nilai kelas dalam format CSV untuk dokumentasi belajar.
- **Nilai Tambah Utama**: Memperpanjang daya tarik ulang (*replayability*) game edukasi di kelas sekaligus memangkas waktu persiapan guru dari puluhan menit menjadi di bawah 1 menit.

---

## 2. Pengalaman Pengguna & Desain Visual

### Alur Pengguna Utama
1. **Menu Utama 3D Interaktif (Live Preview Dunia & Karakter)**:
   - Saat pemain mengganti **Tema Dunia 3D** (Taman / Pantai / Salju / Angkasa), latar 3D di belakang menu langsung berubah secara instan (langit, kabut horizon, bukit/pulau/salju/planet, pohon/palem/kristal).
   - Saat pemain mengganti **Aksesori Pelari** (Topi Olahraga, Helm Astronot, Telinga Kelinci, Topi Wisuda, Mahkota Bintang), karakter 3D yang sedang joging di lintasan langsung mengenakan aksesori tersebut secara real-time.
   - Di tab **Multi-Perangkat (2–8)**, setelah Host membuat ruang, muncul **QR Code lokal** (tanpa perlu internet luar) di samping kode ruang dan link undangan sehingga siswa cukup mengarahkan kamera HP/tablet untuk langsung masuk ruang.
2. **Studio Guru — Tab Baru "Buat Soal Otomatis"**:
   - Di samping tab *Tambah Manual* dan *Impor Spreadsheet*, hadir tab **Buat Soal Otomatis**.
   - Guru mengisi topik materi, memilih tingkat kelas SD (`Kelas 1`–`Kelas 5–6`), jumlah soal (`5`, `10`, atau `15`), dan mode (`Tambahkan` / `Ganti Semua`), lalu menekan **Buat Soal Sekarang**.
   - Status loading yang jelas tampil selama proses pembuatan, hasil soal langsung masuk ke daftar Bank Soal Guru agar guru bisa meninjau, menghapus, atau mengedit sebelum balapan dimulai.
3. **Gameplay 3D Penuh Aksi (Power-Up, Mode Fever & Musik Dinamis)**:
   - Di antara gerbang soal dan rintangan, muncul **ikon 3D berputar** untuk **Perisai Biru** (melindungi 1 kali benturan rintangan atau 1 kali salah gerbang tanpa tersandung) dan **Magnet Ungu** (menarik otomatis bintang emas di semua jalur selama 7 detik).
   - Menjawab **3 gerbang benar berturut-turut** memicu **Mode Fever**: pelari memancarkan aura & jejak partikel pelangi, perolehan poin gerbang & bintang menjadi **2x lipat**, FOV kamera melebar halus, dan tempo musik latar naik lebih bersemangat!
   - HUD atas tetap lapang ($\ge 85\%$ kanvas 3D terbuka), menampilkan indikator aktif Perisai/Magnet/Fever secara ringkas di kartu pemain tanpa *pill* dekoratif berlebihan, serta tombol kontrol terpisah untuk **Musik (BGM)** dan **Efek Suara (SFX)**.
4. **Layar Pemenang & Rekap Nilai Guru**:
   - Tetap diramaikan kembang api 3D + konfeti meriah, podium peringkat 1–8 pemain, dan **Review Kunci Jawaban** (termasuk ringkasan jumlah benar/salah).
   - Tersedia tombol **Unduh Rekap Nilai (.CSV)** yang langsung mengekspor tabel lengkap (Peringkat, Nama Siswa, Skor Akhir, Jawaban Benar, Salah, Streak Terbaik, Bintang, Jarak, Tingkat Kelas, Materi) untuk dibuka di Excel atau Google Sheets.

### Identitas Visual & Aturan Desain 3D
- **Arah Estetika**: *Playful Low-Poly Toybox 3D* — cerah, ramah anak, siluet karakter & properti tegas (3–12 bagian komposit per model), dengan pencahayaan 3-titik (*Key* hangat + *Hemisphere* sejuk + *Rim* belakang) dan *fog* horizon yang menyatu mulus dengan warna langit setiap dunia.
- **Palet 4 Tema Dunia 3D**:
  - **Taman Nusantara**: Langit biru cerah (`#87CEFA`), padang hijau segar, pinus zamrud, kincir angin berputar, balon udara.
  - **Pantai Tropis**: Langit biru pirus (`#5CD6FF`), laut berkilau di sisi lintasan, pasir emas hangat, pohon kelapa miring, mercusuar merah-putih, dan bola pantai.
  - **Lembah Salju**: Langit biru dingin cerah (`#C7E4FA`), hamparan salju bersih, pinus bersalju, pondok kayu beratap salju, manusia salju, dan keping salju ringan yang turun perlahan (*instanced*).
  - **Kota Angkasa**: Langit senja kosmik ramah anak (`#1E1B4B` dengan bintang cerah), lintasan futuristik bercahaya, pulau melayang, cincin energi, planet bercincin, dan roket mini di pinggir arena (dengan kompensasi kontras tinggi agar teks HUD tetap terbaca jelas).
- **Tipografi & Disiplin UI**: Mempertahankan pasangan **Fredoka** (judul & angka ceria), **Plus Jakarta Sans** (teks soal & tombol), dan **JetBrains Mono** (`tabular-nums` untuk skor/waktu/kode ruang). Seluruh overlay HUD menggunakan permukaan solid/semi-transparan tanpa `backdrop-filter` di atas kanvas WebGL agar performa tetap mulus, tanpa titik berkedip dekoratif, dan tanpa kapsul *pill* statis pada metadata.

---

## 3. Keputusan Produk & Pertimbangan Teknis

1. **4 Dunia 3D dengan Performa Seimbang (*Instancing* & Pool Partikel)**
   - *Pilihan*: Membangun keempat dunia dari generator prosedural modular yang memanfaatkan `InstancedMesh` untuk pepohonan/palem/kristal/pagar serta satu kolam partikel bersama (salju, bintang kosmik, jejak Fever, kembang api) dengan batas objek ringan.
   - *Alasan*: Menjaga *draw calls* tetap rendah sehingga HP/laptop sekolah tetap halus di 60 FPS tanpa mengunduh file tekstur/model 3D eksternal (nol risiko 404).
   - *Alternatif yang Ditinggalkan*: Memuat model `.glb` berat atau efek *post-processing bloom* multi-pass yang membebani GPU terintegrasi dan *software WebGL*.

2. **Pembuatan Soal Otomatis Lewat Server (Gemini API)**
   - *Pilihan*: Menambahkan rute backend `POST /api/generate-questions` yang memanggil model **`gemini-4-hydrogen`** menggunakan `@google/genai` dengan skema JSON terstruktur (`responseSchema`), memvalidasi panjang topik, tingkat kelas, dan jumlah soal di server.
   - *Alasan*: Cepat, akurat untuk soal SD Bahasa Indonesia, tidak memerlukan paket API berbayar, dan menjaga kunci API sepenuhnya di sisi server tanpa pernah dikirim ke browser.
   - *Alternatif yang Ditinggalkan*: Pembuatan soal acak berbasis template lokal yang kaku dan tidak bisa mengikuti topik bebas dari guru.

3. **QR Code Lokal (Tanpa Layanan Eksternal)**
   - *Pilihan*: Menghasilkan QR Code secara lokal di browser (SVG/Data URL) langsung dari tautan ruang `...?room=KODE`.
   - *Alasan*: Tetap tampil instan bahkan di jaringan Wi-Fi sekolah yang memblokir situs gambar eksternal, sekaligus tajam saat diproyeksikan ke layar LCD kelas.

4. **Musik Latar Prosedural Web Audio Dinamis**
   - *Pilihan*: Sequencer nada ringan (melodi ceria + bass + perkusi lembut) dengan Web Audio API yang dapat mengubah tempo (Normal ↔ Mode Fever ↔ 15 detik terakhir) dan mematikan BGM secara terpisah dari SFX.
   - *Alasan*: Nol beban unduh audio MP3, transisi tempo mulus tanpa jeda, dan aman dari masalah *autoplay* (aktif otomatis saat pemain menekan tombol Mulai).

5. **Sinkronisasi Aksesori & Tema Dunia di Multi-Perangkat (2–8 Pemain)**
   - *Pilihan*: Menyertakan `worldTheme` di konfigurasi ruang (dikendalikan Host) serta `hatStyle` di profil tiap anggota ruang sehingga pemain di perangkat lain bisa melihat topi astronot/kelinci/wisuda milik lawan di jalur kiri dan kanan.
   - *Alasan*: Membuat pengalaman multi-perangkat terasa personal dan kompak dalam satu dunia yang sama.

---

## 4. Arsitektur Teknis & Strategi Data *(Referensi Teknis)*

### Diagram Arsitektur & Aliran Data

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                       Layar Browser Siswa / Guru                        │
│                                                                         │
│  ┌──────────────────────┐   ┌──────────────────┐   ┌─────────────────┐  │
│  │ Menu Utama & Lobi    │   │ Studio Soal Guru │   │ HUD & Pemenang  │  │
│  │ • Pilih Dunia 3D (4) │   │ • Input Manual   │   │ • Skor & Rank   │  │
│  │ • Aksesori Pelari (5)│   │ • Impor CSV/XLS  │   │ • Status Shield │  │
│  │ • QR Code & Link     │   │ • Buat Otomatis  │   │   Magnet/Fever  │  │
│  │ • Kontrol BGM / SFX  │   │   (Topik → Soal) │   │ • Ekspor CSV    │  │
│  └──────────┬───────────┘   └────────┬─────────┘   └────────┬────────┘  │
│             │                        │                      │           │
│             ▼                        │                      ▼           │
│  ┌───────────────────────────────────┼───────────────────────────────┐  │
│  │              State Aplikasi & Klien Multiplayer                   │  │
│  └──────────┬────────────────────────┼──────────────────────┬────────┘  │
│             │                        │                      │           │
│             ▼                        │                      ▼           │
│  ┌────────────────────────┐          │           ┌───────────────────┐  │
│  │ Mesn 3D (Three.js)     │          │           │ Mesin Audio Web   │  │
│  │ • 4 Generator Dunia    │          │           │ • SFX Aksi        │  │
│  │ • Rig Pelari + 5 Topi  │          │           │ • BGM Dinamis     │  │
│  │ • Power-Up & Fever     │          │           │   (Normal/Fever)  │  │
│  │ • Partikel & Cuaca     │          │           └───────────────────┘  │
│  └────────────────────────┘          │                                  │
└─────────────┼────────────────────────┼───────────────────┼──────────────┘
              │ WebSocket (/ws)        │ HTTP POST         │
              │ Tema, Topi, Posisi     │ /api/generate-    │
              ▼                        │ questions         │
┌──────────────────────────────────────▼───────────────────┴──────────────┐
│                 Server Express + WebSocket (Port 3000)                  │
│  • Manajemen Ruang 2–8 Perangkat (worldTheme, grade, pace, hatStyle)    │
│  • Validasi Input & Panggilan Server-Side Gemini (gemini-4-hydrogen)    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Model Data & Status Utama
- **Tema Dunia (`WorldTheme`)**: `'taman' | 'pantai' | 'salju' | 'angkasa'` — memengaruhi langit, kabut, pencahayaan, daratan/lautan, prop latar, cuaca ringan, dan warna lintasan.
- **Aksesori Pelari (`HatStyle`)**: `'sport' | 'astronaut' | 'bunny' | 'graduation' | 'starCrown'` — dipasang pada `headGroup` pelari 3D dan disinkronkan ke peserta lain lewat `RoomMemberInfo` serta `RemotePlayerState`.
- **Status Power-Up & Fever (`PlayerPowerups`)**:
  - `hasShield: boolean` (menyerap 1 benturan rintangan atau 1 salah gerbang lalu pecah dengan efek partikel biru).
  - `magnetTimer: number` (menarik bintang emas pada radius luas selama 7 detik).
  - `feverActive: boolean` (aktif otomatis saat `streak >= 3`, memberi pengali skor **2x**, aura & jejak partikel pelangi, serta mempercepat tempo BGM).
- **Audio Terpisah (`AudioPreferences`)**: `sfxMuted` dan `bgmMuted` tersimpan di `localStorage` agar preferensi kelas tidak hilang saat refresh.
- **Rekap Hasil Balapan (`RaceReportRow`)**: Menggabungkan `HudSnapshot.standings` dengan metadata ronde (kelas, materi, tema, tanggal) untuk ekspor CSV UTF-8 yang rapi di Excel/Google Sheets.

### Pemetaan Komponen Interaktif & Transisi Status
- **Pemilih Tema Dunia & Aksesori di Menu Utama**: Mengubah state React sekaligus memanggil metode preview di mesin 3D secara langsung (`setWorldTheme`, `setPreviewHats`) tanpa membongkar kanvas WebGL; jika Host sedang berada di ruang multi-perangkat, perubahan tema & topi ikut disiarkan lewat `room:updateConfig` / `room:updateProfile`.
- **Panel QR Code Lobi Multi-Perangkat**: Saat `room.code` aktif, generator QR lokal merender SVG/canvas QR untuk URL `...?room=KODE` lengkap dengan tombol perbesar (*Modal QR Layar Proyektor*) agar mudah discan dari bangku belakang kelas.
- **Tab Pembuat Soal Otomatis di Studio Guru**: Validasi input topik wajib diisi (3–120 karakter), memanggil `POST /api/generate-questions`, menampilkan spinner saat memproses, memunculkan pesan error yang jelas jika gagal/timeout, dan menggabungkan soal hasil validasi ke daftar tersimpan (`localStorage`) + menyinkronkannya ke ruang jika sedang menjadi Host.
- **Mekanik Power-Up di Loop Balapan**: Deteksi tabrakan power-up di jalur aktif, perisai otomatis memblokir penalti rintangan/salah gerbang (dengan umpan balik visual & suara khusus), magnet menarik koordinat bintang mendekati pelari, dan Mode Fever mengubah skor gerbang menjadi 2x serta memicu perubahan tempo BGM.
- **Ekspor CSV di Layar Pemenang**: Menghasilkan berkas `rekap-nilai-lari-pintar-<tanggal>.csv` (dengan BOM UTF-8 agar karakter dan pemisah kolom terbaca sempurna di Excel) berisi seluruh peringkat peserta dan ringkasan akurasi.

### Jaminan Keamanan & Keandalan
- Kunci `GEMINI_API_KEY` hanya dibaca di server Express (`process.env.GEMINI_API_KEY`) dan tidak pernah dikirim ke sisi klien; tidak ada formulir input kunci API di antarmuka.
- Rute `POST /api/generate-questions` memvalidasi ketat panjang topik, nilai `grade` & `count` (dibatasi 3–15 soal), menyaring struktur respons JSON sebelum dikirim balik ke klien, dan menerapkan batas ukuran payload serta penanganan error eksplisit.
- Seluruh input teks dari pengguna dan AI dirender menggunakan *binding* teks aman React (tanpa injeksi HTML mentah) dan nilai sel CSV disanitasi agar aman dibuka di aplikasi spreadsheet.
