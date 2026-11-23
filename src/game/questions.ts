import type { GradeLevel, PaceLevel, Question, SubjectId } from './types';

export const GRADE_META: Record<
  GradeLevel,
  { label: string; shortLabel: string; description: string; recommendedPace: PaceLevel }
> = {
  kelas1: {
    label: 'Kelas 1 SD',
    shortLabel: 'Kelas 1',
    description: 'Berhitung 1–20, hewan, warna, huruf & kata dasar',
    recommendedPace: 'santai',
  },
  kelas2: {
    label: 'Kelas 2 SD',
    shortLabel: 'Kelas 2',
    description: 'Perkalian dasar, jam & uang, wujud benda, kalimat tanya',
    recommendedPace: 'santai',
  },
  kelas3: {
    label: 'Kelas 3 SD',
    shortLabel: 'Kelas 3',
    description: 'Perkalian/pembagian, satuan ukur, cuaca, sinonim & antonim',
    recommendedPace: 'normal',
  },
  kelas4: {
    label: 'Kelas 4 SD',
    shortLabel: 'Kelas 4',
    description: 'Pecahan, FPB/KPK, luas bangun, gaya & energi, budaya Nusantara',
    recommendedPace: 'normal',
  },
  kelas56: {
    label: 'Kelas 5–6 SD',
    shortLabel: 'Kelas 5–6',
    description: 'Pecahan campuran, volume, tata surya, organ tubuh, majas & KBBI',
    recommendedPace: 'normal',
  },
};

export const SUBJECT_META: Record<
  SubjectId,
  { label: string; shortLabel: string; description: string; color: string }
> = {
  matematika: {
    label: 'Matematika',
    shortLabel: 'Matematika',
    description: 'Berhitung, logika bilangan, pecahan & geometri sesuai kelas',
    color: '#2563EB',
  },
  ipas: {
    label: 'IPAS / IPA',
    shortLabel: 'IPAS',
    description: 'Alam, hewan, tubuh manusia, energi, tata surya & Nusantara',
    color: '#059669',
  },
  bahasa: {
    label: 'Bahasa Indonesia',
    shortLabel: 'B. Indonesia',
    description: 'Kosakata, ejaan, bacaan, lawan kata, majas & tata bahasa',
    color: '#D97706',
  },
  campuran: {
    label: 'Campuran Cerdas',
    shortLabel: 'Campuran',
    description: 'Tantangan acak dari Matematika, IPAS & Bahasa Indonesia',
    color: '#7C3AED',
  },
  custom: {
    label: 'Soal Guru',
    shortLabel: 'Soal Guru',
    description: 'Bank soal custom buatan guru (Spreadsheet / Manual)',
    color: '#E11D48',
  },
};

type SubjectKey = 'matematika' | 'ipas' | 'bahasa';

export const GRADED_QUESTIONS: Record<GradeLevel, Record<SubjectKey, Question[]>> = {
  kelas1: {
    matematika: [
      { id: 'k1-m1', subject: 'Matematika', grade: 'kelas1', prompt: '4 + 5 = ...', options: ['8', '9', '10'], correctIndex: 1, explanation: '4 ditambah 5 sama dengan 9.' },
      { id: 'k1-m2', subject: 'Matematika', grade: 'kelas1', prompt: '10 - 3 = ...', options: ['7', '6', '8'], correctIndex: 0, explanation: '10 dikurangi 3 hasilnya 7.' },
      { id: 'k1-m3', subject: 'Matematika', grade: 'kelas1', prompt: '7 + 6 = ...', options: ['12', '14', '13'], correctIndex: 2, explanation: '7 ditambah 6 sama dengan 13.' },
      { id: 'k1-m4', subject: 'Matematika', grade: 'kelas1', prompt: '15 - 5 = ...', options: ['10', '9', '11'], correctIndex: 0, explanation: '15 dikurangi 5 adalah 10.' },
      { id: 'k1-m5', subject: 'Matematika', grade: 'kelas1', prompt: 'Bentuk roda sepeda adalah ...', options: ['Segitiga', 'Lingkaran', 'Persegi'], correctIndex: 1, explanation: 'Roda berbentuk bulat atau lingkaran.' },
      { id: 'k1-m6', subject: 'Matematika', grade: 'kelas1', prompt: 'Bilangan setelah angka 14 adalah ...', options: ['13', '16', '15'], correctIndex: 2, explanation: 'Urutan bilangan: 13, 14, 15.' },
      { id: 'k1-m7', subject: 'Matematika', grade: 'kelas1', prompt: '8 + 8 = ...', options: ['16', '14', '18'], correctIndex: 0, explanation: '8 ditambah 8 sama dengan 16.' },
      { id: 'k1-m8', subject: 'Matematika', grade: 'kelas1', prompt: 'Ada 6 apel, dimakan 2 apel. Sisanya ...', options: ['3 apel', '4 apel', '5 apel'], correctIndex: 1, explanation: '6 dikurangi 2 sama dengan 4 apel.' },
      { id: 'k1-m9', subject: 'Matematika', grade: 'kelas1', prompt: 'Manakah bilangan yang paling besar?', options: ['11', '9', '17'], correctIndex: 2, explanation: '17 lebih besar daripada 11 dan 9.' },
      { id: 'k1-m10', subject: 'Matematika', grade: 'kelas1', prompt: 'Segitiga memiliki berapa sisi?', options: ['3 sisi', '4 sisi', '5 sisi'], correctIndex: 0, explanation: 'Segitiga punya 3 sisi dan 3 sudut.' },
    ],
    ipas: [
      { id: 'k1-i1', subject: 'IPAS', grade: 'kelas1', prompt: 'Bagian tubuh untuk melihat adalah ...', options: ['Telinga', 'Mata', 'Hidung'], correctIndex: 1, explanation: 'Kita melihat dengan kedua mata.' },
      { id: 'k1-i2', subject: 'IPAS', grade: 'kelas1', prompt: 'Hewan yang berkaki dua adalah ...', options: ['Ayam', 'Kucing', 'Sapi'], correctIndex: 0, explanation: 'Ayam memiliki 2 kaki dan 2 sayap.' },
      { id: 'k1-i3', subject: 'IPAS', grade: 'kelas1', prompt: 'Matahari terbit di sebelah ...', options: ['Barat', 'Selatan', 'Timur'], correctIndex: 2, explanation: 'Matahari terbit di timur setiap pagi.' },
      { id: 'k1-i4', subject: 'IPAS', grade: 'kelas1', prompt: 'Warna daun yang sehat biasanya ...', options: ['Hijau', 'Biru', 'Ungu'], correctIndex: 0, explanation: 'Daun segar berwarna hijau.' },
      { id: 'k1-i5', subject: 'IPAS', grade: 'kelas1', prompt: 'Ikan bernapas dan hidup di dalam ...', options: ['Udara', 'Air', 'Tanah'], correctIndex: 1, explanation: 'Ikan adalah hewan yang hidup di air.' },
      { id: 'k1-i6', subject: 'IPAS', grade: 'kelas1', prompt: 'Suara kucing berbunyi ...', options: ['Guk-guk', 'Mooo', 'Meong'], correctIndex: 2, explanation: 'Kucing bersuara meong.' },
      { id: 'k1-i7', subject: 'IPAS', grade: 'kelas1', prompt: 'Sebelum makan sebaiknya kita mencuci ...', options: ['Tangan', 'Sepatu', 'Buku'], correctIndex: 0, explanation: 'Cuci tangan dengan sabun agar kuman hilang.' },
      { id: 'k1-i8', subject: 'IPAS', grade: 'kelas1', prompt: 'Benda langit yang tampak terang di malam hari adalah ...', options: ['Pelangi', 'Bulan', 'Awan'], correctIndex: 1, explanation: 'Bulan dan bintang tampak di malam hari.' },
      { id: 'k1-i9', subject: 'IPAS', grade: 'kelas1', prompt: 'Sapi adalah hewan penghasil ...', options: ['Telur', 'Madu', 'Susu'], correctIndex: 2, explanation: 'Sapi perah menghasilkan susu bergizi.' },
      { id: 'k1-i10', subject: 'IPAS', grade: 'kelas1', prompt: 'Bagian tubuh untuk mendengar suara adalah ...', options: ['Telinga', 'Tangan', 'Kaki'], correctIndex: 0, explanation: 'Telinga adalah indra pendengaran.' },
    ],
    bahasa: [
      { id: 'k1-b1', subject: 'Bahasa Indonesia', grade: 'kelas1', prompt: 'Lawan kata "besar" adalah ...', options: ['Tinggi', 'Kecil', 'Panjang'], correctIndex: 1, explanation: 'Lawan kata besar adalah kecil.' },
      { id: 'k1-b2', subject: 'Bahasa Indonesia', grade: 'kelas1', prompt: 'Huruf pertama dari kata "Bola" adalah ...', options: ['B', 'O', 'L'], correctIndex: 0, explanation: 'Kata Bola diawali huruf B.' },
      { id: 'k1-b3', subject: 'Bahasa Indonesia', grade: 'kelas1', prompt: 'Lawan kata "siang" adalah ...', options: ['Pagi', 'Sore', 'Malam'], correctIndex: 2, explanation: 'Lawan kata siang adalah malam.' },
      { id: 'k1-b4', subject: 'Bahasa Indonesia', grade: 'kelas1', prompt: 'Jika diberi hadiah, kita mengucapkan ...', options: ['Terima kasih', 'Permisi', 'Maaf'], correctIndex: 0, explanation: 'Kita selalu bilang terima kasih saat menerima sesuatu.' },
      { id: 'k1-b5', subject: 'Bahasa Indonesia', grade: 'kelas1', prompt: 'Kata "bu-ku" terdiri dari berapa suku kata?', options: ['1 suku kata', '2 suku kata', '3 suku kata'], correctIndex: 1, explanation: 'Bu - ku memiliki 2 suku kata.' },
      { id: 'k1-b6', subject: 'Bahasa Indonesia', grade: 'kelas1', prompt: 'Jika berbuat salah kepada teman, kita ucapkan ...', options: ['Halo', 'Tolong', 'Maaf'], correctIndex: 2, explanation: 'Ucapkan maaf jika melakukan kesalahan.' },
      { id: 'k1-b7', subject: 'Bahasa Indonesia', grade: 'kelas1', prompt: 'Lawan kata "panas" adalah ...', options: ['Dingin', 'Hangat', 'Terang'], correctIndex: 0, explanation: 'Es terasa dingin, lawan kata panas.' },
      { id: 'k1-b8', subject: 'Bahasa Indonesia', grade: 'kelas1', prompt: 'Yang termasuk huruf vokal adalah ...', options: ['B, C, D', 'A, I, U, E, O', 'K, L, M'], correctIndex: 1, explanation: 'Huruf vokal ada lima: A, I, U, E, O.' },
      { id: 'k1-b9', subject: 'Bahasa Indonesia', grade: 'kelas1', prompt: 'Ayah membaca koran. Siapa yang membaca?', options: ['Ibu', 'Adik', 'Ayah'], correctIndex: 2, explanation: 'Tokoh yang membaca koran adalah Ayah.' },
      { id: 'k1-b10', subject: 'Bahasa Indonesia', grade: 'kelas1', prompt: 'Lawan kata "sedih" adalah ...', options: ['Senang', 'Marah', 'Takut'], correctIndex: 0, explanation: 'Lawan kata sedih adalah senang atau gembira.' },
    ],
  },

  kelas2: {
    matematika: [
      { id: 'k2-m1', subject: 'Matematika', grade: 'kelas2', prompt: '25 + 14 = ...', options: ['38', '39', '41'], correctIndex: 1, explanation: '25 + 14 = 39.' },
      { id: 'k2-m2', subject: 'Matematika', grade: 'kelas2', prompt: '4 × 5 = ...', options: ['20', '16', '25'], correctIndex: 0, explanation: '4 kali 5 sama dengan 5+5+5+5 = 20.' },
      { id: 'k2-m3', subject: 'Matematika', grade: 'kelas2', prompt: '50 - 18 = ...', options: ['42', '34', '32'], correctIndex: 2, explanation: '50 dikurangi 18 adalah 32.' },
      { id: 'k2-m4', subject: 'Matematika', grade: 'kelas2', prompt: '3 × 6 = ...', options: ['18', '15', '21'], correctIndex: 0, explanation: '3 dikali 6 sama dengan 18.' },
      { id: 'k2-m5', subject: 'Matematika', grade: 'kelas2', prompt: '1 jam sama dengan ... menit.', options: ['30 menit', '60 menit', '100 menit'], correctIndex: 1, explanation: 'Satu jam terdiri dari 60 menit.' },
      { id: 'k2-m6', subject: 'Matematika', grade: 'kelas2', prompt: 'Uang Rp2.000 + Rp5.000 = ...', options: ['Rp6.000', 'Rp8.000', 'Rp7.000'], correctIndex: 2, explanation: '2.000 ditambah 5.000 sama dengan Rp7.000.' },
      { id: 'k2-m7', subject: 'Matematika', grade: 'kelas2', prompt: '12 ÷ 3 = ...', options: ['4', '3', '6'], correctIndex: 0, explanation: '12 dibagi 3 sama dengan 4.' },
      { id: 'k2-m8', subject: 'Matematika', grade: 'kelas2', prompt: 'Angka 3 pada bilangan 345 menempati nilai ...', options: ['Puluhan', 'Ratusan', 'Satuan'], correctIndex: 1, explanation: '345 = 300 (ratusan) + 40 + 5.' },
      { id: 'k2-m9', subject: 'Matematika', grade: 'kelas2', prompt: 'Dalam 1 minggu ada berapa hari?', options: ['5 hari', '6 hari', '7 hari'], correctIndex: 2, explanation: 'Senin sampai Minggu berjumlah 7 hari.' },
      { id: 'k2-m10', subject: 'Matematika', grade: 'kelas2', prompt: '5 × 7 = ...', options: ['35', '30', '40'], correctIndex: 0, explanation: '5 dikali 7 sama dengan 35.' },
    ],
    ipas: [
      { id: 'k2-i1', subject: 'IPAS', grade: 'kelas2', prompt: 'Contoh benda cair adalah ...', options: ['Batu', 'Air minum', 'Pensil'], correctIndex: 1, explanation: 'Air mengalir dan berbentuk seperti wadahnya (cair).' },
      { id: 'k2-i2', subject: 'IPAS', grade: 'kelas2', prompt: 'Bagian tumbuhan yang menyerap air di tanah adalah ...', options: ['Akar', 'Bunga', 'Buah'], correctIndex: 0, explanation: 'Akar berada di tanah untuk menyerap air.' },
      { id: 'k2-i3', subject: 'IPAS', grade: 'kelas2', prompt: 'Hewan pemakan rumput dan daun adalah ...', options: ['Harimau', 'Elang', 'Kambing'], correctIndex: 2, explanation: 'Kambing makan rumput dan dedaunan.' },
      { id: 'k2-i4', subject: 'IPAS', grade: 'kelas2', prompt: 'Saat lampu lalu lintas berwarna merah, kendaraan harus ...', options: ['Berhenti', 'Berjalan cepat', 'Belok kanan'], correctIndex: 0, explanation: 'Lampu merah berarti semua kendaraan wajib berhenti.' },
      { id: 'k2-i5', subject: 'IPAS', grade: 'kelas2', prompt: 'Udara di dalam balon termasuk benda ...', options: ['Padat', 'Gas', 'Cair'], correctIndex: 1, explanation: 'Udara adalah benda berwujud gas.' },
      { id: 'k2-i6', subject: 'IPAS', grade: 'kelas2', prompt: 'Sampah sebaiknya dibuang ke ...', options: ['Sungai', 'Jalan', 'Tempat sampah'], correctIndex: 2, explanation: 'Membuang sampah pada tempatnya menjaga lingkungan bersih.' },
      { id: 'k2-i7', subject: 'IPAS', grade: 'kelas2', prompt: 'Katak bergerak di darat dengan cara ...', options: ['Melompat', 'Terbang', 'Merayap'], correctIndex: 0, explanation: 'Katak memiliki kaki belakang kuat untuk melompat.' },
      { id: 'k2-i8', subject: 'IPAS', grade: 'kelas2', prompt: 'Benda padat yang mudah berubah bentuk jika ditekan adalah ...', options: ['Besi', 'Plastisin', 'Kaca'], correctIndex: 1, explanation: 'Plastisin atau tanah liat lunak dan mudah dibentuk.' },
      { id: 'k2-i9', subject: 'IPAS', grade: 'kelas2', prompt: 'Pekerjaan membersihkan kelas bersama-sama disebut ...', options: ['Bermain', 'Ulangan', 'Piket kelas'], correctIndex: 2, explanation: 'Piket kelas melatih kerja sama dan kebersihan.' },
      { id: 'k2-i10', subject: 'IPAS', grade: 'kelas2', prompt: 'Es batu yang dibiarkan di luar kulkas akan ...', options: ['Mencair', 'Membeku', 'Mengeras'], correctIndex: 0, explanation: 'Es berubah dari padat menjadi air (mencair).' },
    ],
    bahasa: [
      { id: 'k2-b1', subject: 'Bahasa Indonesia', grade: 'kelas2', prompt: 'Kata tanya untuk menanyakan tempat adalah ...', options: ['Kapan', 'Di mana', 'Berapa'], correctIndex: 1, explanation: '"Di mana" dipakai untuk menanyakan lokasi atau tempat.' },
      { id: 'k2-b2', subject: 'Bahasa Indonesia', grade: 'kelas2', prompt: 'Kalimat tanya selalu diakhiri dengan tanda ...', options: ['Tanya (?)', 'Titik (.)', 'Koma (,)'], correctIndex: 0, explanation: 'Kalimat tanya memakai tanda tanya (?) di akhir.' },
      { id: 'k2-b3', subject: 'Bahasa Indonesia', grade: 'kelas2', prompt: 'Penulisan nama orang yang benar adalah ...', options: ['budi santoso', 'BUDI santoso', 'Budi Santoso'], correctIndex: 2, explanation: 'Huruf pertama nama orang ditulis dengan huruf kapital.' },
      { id: 'k2-b4', subject: 'Bahasa Indonesia', grade: 'kelas2', prompt: 'Kata tanya "Kapan" digunakan untuk menanyakan ...', options: ['Waktu', 'Jumlah', 'Nama orang'], correctIndex: 0, explanation: 'Kapan menanyakan waktu kejadian.' },
      { id: 'k2-b5', subject: 'Bahasa Indonesia', grade: 'kelas2', prompt: 'Lawan kata "rajin" adalah ...', options: ['Pintar', 'Malas', 'Cepat'], correctIndex: 1, explanation: 'Lawan kata rajin adalah malas.' },
      { id: 'k2-b6', subject: 'Bahasa Indonesia', grade: 'kelas2', prompt: '"___ nama gurumu?" Kata tanya yang tepat adalah ...', options: ['Berapa', 'Ke mana', 'Siapa'], correctIndex: 2, explanation: 'Siapa digunakan untuk menanyakan orang.' },
      { id: 'k2-b7', subject: 'Bahasa Indonesia', grade: 'kelas2', prompt: 'Sinonim (arti sama) kata "gembira" adalah ...', options: ['Senang', 'Lelah', 'Marah'], correctIndex: 0, explanation: 'Gembira sama artinya dengan senang.' },
      { id: 'k2-b8', subject: 'Bahasa Indonesia', grade: 'kelas2', prompt: 'Tempat meminjam banyak buku di sekolah disebut ...', options: ['Kantin', 'Perpustakaan', 'Lapangan'], correctIndex: 1, explanation: 'Perpustakaan adalah ruang koleksi buku bacaan.' },
      { id: 'k2-b9', subject: 'Bahasa Indonesia', grade: 'kelas2', prompt: 'Susunan kalimat yang benar adalah ...', options: ['bola bermain Raka', 'bermain Raka bola', 'Raka bermain bola'], correctIndex: 2, explanation: 'Pola kalimat yang benar: Subjek + Predikat + Objek.' },
      { id: 'k2-b10', subject: 'Bahasa Indonesia', grade: 'kelas2', prompt: 'Lawan kata "bersih" adalah ...', options: ['Kotor', 'Rapi', 'Harum'], correctIndex: 0, explanation: 'Lawan kata bersih adalah kotor.' },
    ],
  },

  kelas3: {
    matematika: [
      { id: 'k3-m1', subject: 'Matematika', grade: 'kelas3', prompt: '8 × 7 = ...', options: ['54', '56', '64'], correctIndex: 1, explanation: '8 dikali 7 sama dengan 56.' },
      { id: 'k3-m2', subject: 'Matematika', grade: 'kelas3', prompt: '72 ÷ 8 = ...', options: ['9', '8', '7'], correctIndex: 0, explanation: '72 dibagi 8 sama dengan 9 karena 8 × 9 = 72.' },
      { id: 'k3-m3', subject: 'Matematika', grade: 'kelas3', prompt: '3 meter sama dengan berapa sentimeter (cm)?', options: ['30 cm', '3.000 cm', '300 cm'], correctIndex: 2, explanation: '1 meter = 100 cm, maka 3 m = 300 cm.' },
      { id: 'k3-m4', subject: 'Matematika', grade: 'kelas3', prompt: 'Kue dipotong 4 bagian sama besar. 1 potong bernilai ...', options: ['1/4', '1/2', '4/1'], correctIndex: 0, explanation: 'Satu dari empat bagian sama besar adalah 1/4.' },
      { id: 'k3-m5', subject: 'Matematika', grade: 'kelas3', prompt: '2 kilogram (kg) sama dengan ... gram.', options: ['200 gram', '2.000 gram', '20 gram'], correctIndex: 1, explanation: '1 kg = 1.000 gram, jadi 2 kg = 2.000 gram.' },
      { id: 'k3-m6', subject: 'Matematika', grade: 'kelas3', prompt: 'Keliling persegi dengan panjang sisi 9 cm adalah ...', options: ['18 cm', '27 cm', '36 cm'], correctIndex: 2, explanation: 'Keliling persegi = 4 × sisi = 4 × 9 = 36 cm.' },
      { id: 'k3-m7', subject: 'Matematika', grade: 'kelas3', prompt: '245 + 135 = ...', options: ['380', '370', '390'], correctIndex: 0, explanation: '245 + 135 = 380.' },
      { id: 'k3-m8', subject: 'Matematika', grade: 'kelas3', prompt: 'Hasil dari 9 × 9 adalah ...', options: ['72', '81', '90'], correctIndex: 1, explanation: '9 dikali 9 sama dengan 81.' },
      { id: 'k3-m9', subject: 'Matematika', grade: 'kelas3', prompt: '1/4 + 2/4 = ...', options: ['3/8', '2/4', '3/4'], correctIndex: 2, explanation: 'Penyebut sudah sama: (1+2)/4 = 3/4.' },
      { id: 'k3-m10', subject: 'Matematika', grade: 'kelas3', prompt: 'Sudut pada ujung buku tulis berbentuk sudut ...', options: ['Siku-siku', 'Lancip', 'Tumpul'], correctIndex: 0, explanation: 'Sudut 90 derajat disebut sudut siku-siku.' },
    ],
    ipas: [
      { id: 'k3-i1', subject: 'IPAS', grade: 'kelas3', prompt: 'Hewan yang berkembang biak dengan bertelur disebut ...', options: ['Vivipar', 'Ovipar', 'Karnivora'], correctIndex: 1, explanation: 'Ovipar adalah hewan bertelur seperti ayam dan burung.' },
      { id: 'k3-i2', subject: 'IPAS', grade: 'kelas3', prompt: 'Urutan daur hidup kupu-kupu setelah ulat adalah ...', options: ['Kepompong', 'Telur', 'Dewasa'], correctIndex: 0, explanation: 'Telur → Ulat → Kepompong (pupa) → Kupu-kupu.' },
      { id: 'k3-i3', subject: 'IPAS', grade: 'kelas3', prompt: 'Sumber energi panas terbesar bagi bumi adalah ...', options: ['Lampu', 'Api unggun', 'Matahari'], correctIndex: 2, explanation: 'Matahari menyinari dan menghangatkan seluruh bumi.' },
      { id: 'k3-i4', subject: 'IPAS', grade: 'kelas3', prompt: 'Perubahan air menjadi uap saat dipanaskan disebut ...', options: ['Menguap', 'Membeku', 'Mencair'], correctIndex: 0, explanation: 'Air mendidih berubah menjadi uap air (menguap).' },
      { id: 'k3-i5', subject: 'IPAS', grade: 'kelas3', prompt: 'Cuaca ketika awan tebal gelap dan turun titik air disebut ...', options: ['Cerah', 'Hujan', 'Berangin'], correctIndex: 1, explanation: 'Awan mendung gelap menandakan cuaca hujan.' },
      { id: 'k3-i6', subject: 'IPAS', grade: 'kelas3', prompt: 'Hewan pemakan daging disebut ...', options: ['Herbivora', 'Omnivora', 'Karnivora'], correctIndex: 2, explanation: 'Singa dan harimau termasuk hewan karnivora.' },
      { id: 'k3-i7', subject: 'IPAS', grade: 'kelas3', prompt: 'Lambang sila pertama Pancasila adalah ...', options: ['Bintang', 'Rantai', 'Pohon beringin'], correctIndex: 0, explanation: 'Ketuhanan Yang Maha Esa dilambangkan oleh Bintang.' },
      { id: 'k3-i8', subject: 'IPAS', grade: 'kelas3', prompt: 'Alat untuk mengukur suhu tubuh saat demam adalah ...', options: ['Penggaris', 'Termometer', 'Timbangan'], correctIndex: 1, explanation: 'Termometer digunakan untuk mengukur suhu.' },
      { id: 'k3-i9', subject: 'IPAS', grade: 'kelas3', prompt: 'Bagian tumbuhan tempat membuat makanan adalah ...', options: ['Batang', 'Akar', 'Daun'], correctIndex: 2, explanation: 'Daun hijau melakukan fotosintesis untuk membuat makanan.' },
      { id: 'k3-i10', subject: 'IPAS', grade: 'kelas3', prompt: 'Salah satu cara menghemat listrik di rumah adalah ...', options: ['Matikan lampu siang hari', 'Nyalakan TV terus', 'Buka kulkas lama'], correctIndex: 0, explanation: 'Mematikan lampu saat tidak dipakai menghemat energi listrik.' },
    ],
    bahasa: [
      { id: 'k3-b1', subject: 'Bahasa Indonesia', grade: 'kelas3', prompt: 'Sinonim (persamaan kata) dari "pintar" adalah ...', options: ['Lupa', 'Cerdas', 'Lambat'], correctIndex: 1, explanation: 'Pintar memiliki arti yang sama dengan cerdas atau pandai.' },
      { id: 'k3-b2', subject: 'Bahasa Indonesia', grade: 'kelas3', prompt: 'Antonim (lawan kata) dari "terang" adalah ...', options: ['Gelap', 'Cerah', 'Silau'], correctIndex: 0, explanation: 'Lawan kata terang adalah gelap.' },
      { id: 'k3-b3', subject: 'Bahasa Indonesia', grade: 'kelas3', prompt: 'Kalimat yang berisi ajakan biasanya memakai kata ...', options: ['Jangan', 'Bukan', 'Ayo / Mari'], correctIndex: 2, explanation: 'Kalimat ajakan diawali kata "Ayo" atau "Mari".' },
      { id: 'k3-b4', subject: 'Bahasa Indonesia', grade: 'kelas3', prompt: 'Cerita fabel memiliki tokoh utama berupa ...', options: ['Hewan', 'Robot', 'Benda mati'], correctIndex: 0, explanation: 'Fabel adalah dongeng tentang hewan yang berperilaku seperti manusia.' },
      { id: 'k3-b5', subject: 'Bahasa Indonesia', grade: 'kelas3', prompt: 'Kata dasar dari "berlari" adalah ...', options: ['Berla', 'Lari', 'Ari'], correctIndex: 1, explanation: 'Berlari berasal dari imbuhan ber- + kata dasar lari.' },
      { id: 'k3-b6', subject: 'Bahasa Indonesia', grade: 'kelas3', prompt: 'Tanda koma (,) digunakan untuk ...', options: ['Mengakhiri pertanyaan', 'Memulai judul', 'Memisahkan perincian'], correctIndex: 2, explanation: 'Contoh: Ibu membeli apel, jeruk, dan mangga.' },
      { id: 'k3-b7', subject: 'Bahasa Indonesia', grade: 'kelas3', prompt: 'Arti ungkapan "ringan tangan" adalah ...', options: ['Suka menolong', 'Suka mencuri', 'Malas bekerja'], correctIndex: 0, explanation: 'Ringan tangan artinya rajin dan suka membantu sesama.' },
      { id: 'k3-b8', subject: 'Bahasa Indonesia', grade: 'kelas3', prompt: 'Percakapan antara dua orang atau lebih disebut ...', options: ['Puisi', 'Dialog', 'Pantun'], correctIndex: 1, explanation: 'Dialog adalah percakapan timbal balik antar tokoh.' },
      { id: 'k3-b9', subject: 'Bahasa Indonesia', grade: 'kelas3', prompt: 'Lawan kata "sombong" adalah ...', options: ['Tinggi hati', 'Berani', 'Rendah hati'], correctIndex: 2, explanation: 'Rendah hati berarti tidak sombong.' },
      { id: 'k3-b10', subject: 'Bahasa Indonesia', grade: 'kelas3', prompt: 'Kegiatan bertanya jawab untuk mencari informasi disebut ...', options: ['Wawancara', 'Pidato', 'Deklamasi'], correctIndex: 0, explanation: 'Wawancara dilakukan pewawancara kepada narasumber.' },
    ],
  },

  kelas4: {
    matematika: [
      { id: 'k4-m1', subject: 'Matematika', grade: 'kelas4', prompt: 'Pecahan yang senilai dengan 1/2 adalah ...', options: ['2/6', '3/6', '4/6'], correctIndex: 1, explanation: '1/2 dikali 3/3 menghasilkan 3/6.' },
      { id: 'k4-m2', subject: 'Matematika', grade: 'kelas4', prompt: 'KPK dari 4 dan 6 adalah ...', options: ['12', '24', '8'], correctIndex: 0, explanation: 'Kelipatan 4: 4,8,12. Kelipatan 6: 6,12. Jadi KPK = 12.' },
      { id: 'k4-m3', subject: 'Matematika', grade: 'kelas4', prompt: 'FPB dari 16 dan 24 adalah ...', options: ['4', '6', '8'], correctIndex: 2, explanation: 'Faktor persekutuan terbesar 16 dan 24 adalah 8.' },
      { id: 'k4-m4', subject: 'Matematika', grade: 'kelas4', prompt: 'Luas persegi dengan sisi 8 cm adalah ...', options: ['64 cm²', '32 cm²', '16 cm²'], correctIndex: 0, explanation: 'Luas persegi = sisi × sisi = 8 × 8 = 64 cm².' },
      { id: 'k4-m5', subject: 'Matematika', grade: 'kelas4', prompt: 'Luas persegi panjang 10 cm × 6 cm adalah ...', options: ['32 cm²', '60 cm²', '16 cm²'], correctIndex: 1, explanation: 'Luas = panjang × lebar = 10 × 6 = 60 cm².' },
      { id: 'k4-m6', subject: 'Matematika', grade: 'kelas4', prompt: 'Bentuk desimal dari 1/4 adalah ...', options: ['0,5', '0,4', '0,25'], correctIndex: 2, explanation: '1 dibagi 4 sama dengan 0,25.' },
      { id: 'k4-m7', subject: 'Matematika', grade: 'kelas4', prompt: 'Besar sudut lurus adalah ... derajat.', options: ['180°', '90°', '360°'], correctIndex: 0, explanation: 'Sudut lurus besarnya tepat 180 derajat.' },
      { id: 'k4-m8', subject: 'Matematika', grade: 'kelas4', prompt: 'Keliling segitiga sama sisi dengan sisi 11 cm adalah ...', options: ['22 cm', '33 cm', '44 cm'], correctIndex: 1, explanation: 'Keliling = 11 + 11 + 11 = 33 cm.' },
      { id: 'k4-m9', subject: 'Matematika', grade: 'kelas4', prompt: 'Bilangan prima antara 10 dan 15 adalah ...', options: ['12 dan 14', '10 dan 12', '11 dan 13'], correctIndex: 2, explanation: '11 dan 13 hanya habis dibagi 1 dan dirinya sendiri.' },
      { id: 'k4-m10', subject: 'Matematika', grade: 'kelas4', prompt: 'Hasil pembulatan 47 ke puluhan terdekat adalah ...', options: ['50', '40', '45'], correctIndex: 0, explanation: 'Satuan 7 ≥ 5, maka dibulatkan ke atas menjadi 50.' },
    ],
    ipas: [
      { id: 'k4-i1', subject: 'IPAS', grade: 'kelas4', prompt: 'Proses tumbuhan membuat makanan dengan cahaya matahari disebut ...', options: ['Respirasi', 'Fotosintesis', 'Adaptasi'], correctIndex: 1, explanation: 'Fotosintesis terjadi pada daun berklorofil dengan bantuan cahaya.' },
      { id: 'k4-i2', subject: 'IPAS', grade: 'kelas4', prompt: 'Gaya yang menahan benda saat bergesekan di lantai adalah gaya ...', options: ['Gesek', 'Pegas', 'Magnet'], correctIndex: 0, explanation: 'Gaya gesek memperlambat benda yang bergerak di permukaan.' },
      { id: 'k4-i3', subject: 'IPAS', grade: 'kelas4', prompt: 'Alat musik tradisional Angklung berasal dari provinsi ...', options: ['Bali', 'Jawa Timur', 'Jawa Barat'], correctIndex: 2, explanation: 'Angklung dari bambu merupakan warisan budaya Jawa Barat.' },
      { id: 'k4-i4', subject: 'IPAS', grade: 'kelas4', prompt: 'Kipas angin mengubah energi listrik menjadi energi ...', options: ['Gerak', 'Cahaya', 'Kimia'], correctIndex: 0, explanation: 'Baling-baling kipas berputar (energi gerak) dari listrik.' },
      { id: 'k4-i5', subject: 'IPAS', grade: 'kelas4', prompt: 'Benda yang dapat ditarik kuat oleh magnet adalah ...', options: ['Plastik', 'Besi', 'Kayu'], correctIndex: 1, explanation: 'Besi dan baja merupakan bahan feromagnetik.' },
      { id: 'k4-i6', subject: 'IPAS', grade: 'kelas4', prompt: 'Rumah adat Tongkonan berasal dari suku Toraja di pulau ...', options: ['Sumatra', 'Kalimantan', 'Sulawesi'], correctIndex: 2, explanation: 'Tongkonan adalah rumah adat Tana Toraja, Sulawesi Selatan.' },
      { id: 'k4-i7', subject: 'IPAS', grade: 'kelas4', prompt: 'Perubahan wujud dari gas menjadi cair disebut ...', options: ['Mengembun', 'Menyublim', 'Membeku'], correctIndex: 0, explanation: 'Titik embun di daun pagi hari adalah contoh mengembun.' },
      { id: 'k4-i8', subject: 'IPAS', grade: 'kelas4', prompt: 'Hewan yang mengalami metamorfosis tidak sempurna adalah ...', options: ['Kupu-kupu', 'Belalang', 'Nyamuk'], correctIndex: 1, explanation: 'Belalang tidak melalui fase kepompong (telur → nimfa → dewasa).' },
      { id: 'k4-i9', subject: 'IPAS', grade: 'kelas4', prompt: 'Tari Kecak adalah tarian tradisional terkenal dari ...', options: ['Aceh', 'Papua', 'Bali'], correctIndex: 2, explanation: 'Tari Kecak berasal dari Pulau Bali.' },
      { id: 'k4-i10', subject: 'IPAS', grade: 'kelas4', prompt: 'Kerajaan Sriwijaya terkenal sebagai kerajaan maritim di pulau ...', options: ['Sumatra', 'Jawa', 'Maluku'], correctIndex: 0, explanation: 'Kerajaan Sriwijaya berpusat di Palembang, Sumatra Selatan.' },
    ],
    bahasa: [
      { id: 'k4-b1', subject: 'Bahasa Indonesia', grade: 'kelas4', prompt: 'Kalimat utama yang menjadi inti paragraf disebut ...', options: ['Kalimat penjelas', 'Gagasan pokok', 'Judul cerita'], correctIndex: 1, explanation: 'Gagasan pokok memuat ide inti dari satu paragraf.' },
      { id: 'k4-b2', subject: 'Bahasa Indonesia', grade: 'kelas4', prompt: 'Imbuhan "me-" pada kata dasar "tulis" menjadi ...', options: ['Menulis', 'Mentulis', 'Metulis'], correctIndex: 0, explanation: 'Huruf "t" luluh saat bertemu awalan me- menjadi menulis.' },
      { id: 'k4-b3', subject: 'Bahasa Indonesia', grade: 'kelas4', prompt: 'Manakah kalimat transitif (memiliki objek)?', options: ['Adik tertidur pulas', 'Budi berlari kencang', 'Siti membaca buku'], correctIndex: 2, explanation: '"Buku" adalah objek pada kalimat "Siti membaca buku".' },
      { id: 'k4-b4', subject: 'Bahasa Indonesia', grade: 'kelas4', prompt: 'Teks yang berisi langkah-langkah membuat sesuatu disebut teks ...', options: ['Prosedur', 'Deskripsi', 'Puisi'], correctIndex: 0, explanation: 'Teks prosedur menjelaskan urutan cara membuat atau melakukan sesuatu.' },
      { id: 'k4-b5', subject: 'Bahasa Indonesia', grade: 'kelas4', prompt: 'Kata berhomonim "bisa" dapat berarti racun ular atau ...', options: ['Besar', 'Dapat / mampu', 'Cepat'], correctIndex: 1, explanation: 'Homonim punya ejaan sama tapi arti berbeda: racun & mampu.' },
      { id: 'k4-b6', subject: 'Bahasa Indonesia', grade: 'kelas4', prompt: 'Bagian awal surat yang berisi kota dan tanggal disebut ...', options: ['Salam penutup', 'Isi surat', 'Titi mangsa'], correctIndex: 2, explanation: 'Titi mangsa menunjukkan tempat dan tanggal penulisan surat.' },
      { id: 'k4-b7', subject: 'Bahasa Indonesia', grade: 'kelas4', prompt: 'Kata penghubung untuk menunjukkan sebab adalah ...', options: ['Karena', 'Tetapi', 'Atau'], correctIndex: 0, explanation: '"Karena" menghubungkan akibat dengan sebabnya.' },
      { id: 'k4-b8', subject: 'Bahasa Indonesia', grade: 'kelas4', prompt: 'Pantun dalam satu bait terdiri dari berapa baris?', options: ['2 baris', '4 baris', '6 baris'], correctIndex: 1, explanation: 'Pantun terdiri atas 4 baris (2 sampiran + 2 isi).' },
      { id: 'k4-b9', subject: 'Bahasa Indonesia', grade: 'kelas4', prompt: 'Sajak atau rima akhir pantun biasanya berpola ...', options: ['a-a-b-b', 'a-b-b-a', 'a-b-a-b'], correctIndex: 2, explanation: 'Pantun memiliki pola rima silang a-b-a-b.' },
      { id: 'k4-b10', subject: 'Bahasa Indonesia', grade: 'kelas4', prompt: 'Penulisan tempat dan waktu kejadian cerita disebut ...', options: ['Latar', 'Watak', 'Amanat'], correctIndex: 0, explanation: 'Latar menggambarkan tempat, waktu, dan suasana cerita.' },
    ],
  },

  kelas56: {
    matematika: [
      { id: 'mat-1', subject: 'Matematika', grade: 'kelas56', prompt: 'Hasil dari 3/4 + 1/2 adalah ...', options: ['4/6', '1 1/4', '3/8'], correctIndex: 1, explanation: '3/4 + 2/4 = 5/4 = 1 1/4.' },
      { id: 'mat-2', subject: 'Matematika', grade: 'kelas56', prompt: 'KPK dari bilangan 12 dan 18 adalah ...', options: ['36', '24', '6'], correctIndex: 0, explanation: 'Kelipatan persekutuan terkecil 12 dan 18 adalah 36.' },
      { id: 'mat-3', subject: 'Matematika', grade: 'kelas56', prompt: 'FPB dari bilangan 24 dan 36 adalah ...', options: ['6', '8', '12'], correctIndex: 2, explanation: 'Faktor persekutuan terbesar 24 dan 36 adalah 12.' },
      { id: 'mat-4', subject: 'Matematika', grade: 'kelas56', prompt: 'Luas segitiga dengan alas 14 cm dan tinggi 10 cm adalah ...', options: ['140 cm²', '70 cm²', '48 cm²'], correctIndex: 1, explanation: 'Luas segitiga = 1/2 × 14 × 10 = 70 cm².' },
      { id: 'mat-5', subject: 'Matematika', grade: 'kelas56', prompt: 'Volume kubus dengan panjang rusuk 5 cm adalah ...', options: ['25 cm³', '100 cm³', '125 cm³'], correctIndex: 2, explanation: 'Volume kubus = 5 × 5 × 5 = 125 cm³.' },
      { id: 'mat-6', subject: 'Matematika', grade: 'kelas56', prompt: 'Sepeda melaju 60 km dalam 2 jam. Kecepatannya adalah ...', options: ['30 km/jam', '120 km/jam', '40 km/jam'], correctIndex: 0, explanation: 'Kecepatan = Jarak ÷ Waktu = 60 ÷ 2 = 30 km/jam.' },
      { id: 'mat-7', subject: 'Matematika', grade: 'kelas56', prompt: 'Bentuk persen dari pecahan 3/5 adalah ...', options: ['35%', '60%', '75%'], correctIndex: 1, explanation: '3/5 × 100% = 60%.' },
      { id: 'mat-8', subject: 'Matematika', grade: 'kelas56', prompt: 'Hasil dari (-8) + 15 adalah ...', options: ['-7', '23', '7'], correctIndex: 2, explanation: '(-8) + 15 = 15 - 8 = 7.' },
      { id: 'mat-9', subject: 'Matematika', grade: 'kelas56', prompt: 'Keliling persegi panjang panjang 12 cm dan lebar 8 cm adalah ...', options: ['40 cm', '96 cm', '20 cm'], correctIndex: 0, explanation: 'Keliling = 2 × (12 + 8) = 40 cm.' },
      { id: 'mat-10', subject: 'Matematika', grade: 'kelas56', prompt: 'Nilai dari 15 + 6 × 4 adalah ...', options: ['84', '39', '45'], correctIndex: 1, explanation: 'Perkalian dulu: 6 × 4 = 24, lalu 15 + 24 = 39.' },
      { id: 'mat-11', subject: 'Matematika', grade: 'kelas56', prompt: '2,5 jam sama dengan berapa menit?', options: ['125 menit', '150 menit', '180 menit'], correctIndex: 1, explanation: '2,5 × 60 menit = 150 menit.' },
      { id: 'mat-12', subject: 'Matematika', grade: 'kelas56', prompt: 'Pecahan yang senilai dengan 2/3 adalah ...', options: ['4/9', '6/8', '8/12'], correctIndex: 2, explanation: '(2×4)/(3×4) = 8/12.' },
      { id: 'mat-13', subject: 'Matematika', grade: 'kelas56', prompt: 'Harga tas Rp100.000 diskon 20%. Harga bayarnya adalah ...', options: ['Rp80.000', 'Rp75.000', 'Rp20.000'], correctIndex: 0, explanation: 'Diskon Rp20.000, bayar Rp80.000.' },
      { id: 'mat-14', subject: 'Matematika', grade: 'kelas56', prompt: 'Keliling lingkaran diameter 14 cm (π = 22/7) adalah ...', options: ['22 cm', '44 cm', '88 cm'], correctIndex: 1, explanation: 'Keliling = (22/7) × 14 = 44 cm.' },
      { id: 'mat-15', subject: 'Matematika', grade: 'kelas56', prompt: 'Bilangan berikutnya pada pola 3, 6, 12, 24, ... adalah ...', options: ['36', '42', '48'], correctIndex: 2, explanation: 'Setiap suku dikali 2, jadi 24 × 2 = 48.' },
    ],
    ipas: [
      { id: 'ipas-1', subject: 'IPAS', grade: 'kelas56', prompt: 'Gas yang dihasilkan tumbuhan saat fotosintesis adalah ...', options: ['Oksigen', 'Karbon dioksida', 'Nitrogen'], correctIndex: 0, explanation: 'Fotosintesis menghasilkan glukosa dan gas oksigen (O₂).' },
      { id: 'ipas-2', subject: 'IPAS', grade: 'kelas56', prompt: 'Organ tubuh yang memompa darah ke seluruh tubuh adalah ...', options: ['Paru-paru', 'Jantung', 'Ginjal'], correctIndex: 1, explanation: 'Jantung memompa darah kaya oksigen ke seluruh tubuh.' },
      { id: 'ipas-3', subject: 'IPAS', grade: 'kelas56', prompt: 'Perpindahan panas matahari sampai ke bumi terjadi secara ...', options: ['Konduksi', 'Konveksi', 'Radiasi'], correctIndex: 2, explanation: 'Radiasi adalah perpindahan kalor tanpa zat perantara.' },
      { id: 'ipas-4', subject: 'IPAS', grade: 'kelas56', prompt: 'Hubungan saling menguntungkan lebah dan bunga disebut simbiosis ...', options: ['Mutualisme', 'Parasitisme', 'Komensalisme'], correctIndex: 0, explanation: 'Lebah mendapat nektar dan bunga terbantu penyerbukannya.' },
      { id: 'ipas-5', subject: 'IPAS', grade: 'kelas56', prompt: 'Planet terbesar dalam sistem Tata Surya kita adalah ...', options: ['Saturnus', 'Jupiter', 'Neptunus'], correctIndex: 1, explanation: 'Jupiter adalah planet paling besar di Tata Surya.' },
      { id: 'ipas-6', subject: 'IPAS', grade: 'kelas56', prompt: 'Perubahan wujud benda padat langsung menjadi gas disebut ...', options: ['Mencair', 'Mengembun', 'Menyublim'], correctIndex: 2, explanation: 'Contoh menyublim adalah kapur barus.' },
      { id: 'ipas-7', subject: 'IPAS', grade: 'kelas56', prompt: 'Terjadinya siang dan malam di bumi disebabkan oleh ...', options: ['Rotasi bumi', 'Revolusi bumi', 'Gerhana bulan'], correctIndex: 0, explanation: 'Bumi berputar pada porosnya (rotasi) selama 24 jam.' },
      { id: 'ipas-8', subject: 'IPAS', grade: 'kelas56', prompt: 'Dalam "Padi → Tikus → Ular", tikus berperan sebagai ...', options: ['Produsen', 'Konsumen I', 'Pengurai'], correctIndex: 1, explanation: 'Tikus memakan produsen (padi), disebut konsumen tingkat I.' },
      { id: 'ipas-9', subject: 'IPAS', grade: 'kelas56', prompt: 'Contoh sumber energi alternatif terbarukan adalah ...', options: ['Batu bara', 'Minyak bumi', 'Tenaga surya'], correctIndex: 2, explanation: 'Tenaga surya dari matahari dapat diperbarui terus.' },
      { id: 'ipas-10', subject: 'IPAS', grade: 'kelas56', prompt: 'Kerajaan Hindu tertua di Indonesia (Kalimantan Timur) adalah ...', options: ['Kutai', 'Majapahit', 'Sriwijaya'], correctIndex: 0, explanation: 'Kerajaan Kutai berdiri abad ke-4 M di Sungai Mahakam.' },
      { id: 'ipas-11', subject: 'IPAS', grade: 'kelas56', prompt: 'Gaya yang membuat buah mangga jatuh ke tanah adalah gaya ...', options: ['Gesek', 'Gravitasi', 'Magnet'], correctIndex: 1, explanation: 'Gaya gravitasi bumi menarik benda menuju pusat bumi.' },
      { id: 'ipas-12', subject: 'IPAS', grade: 'kelas56', prompt: 'Selat yang memisahkan Pulau Jawa dan Sumatra adalah ...', options: ['Selat Bali', 'Selat Malaka', 'Selat Sunda'], correctIndex: 2, explanation: 'Selat Sunda terletak antara Banten dan Lampung.' },
      { id: 'ipas-13', subject: 'IPAS', grade: 'kelas56', prompt: 'Bagian telinga yang menangkap getaran bunyi pertama kali adalah ...', options: ['Daun telinga', 'Koklea', 'Saluran Eustachius'], correctIndex: 0, explanation: 'Daun telinga mengumpulkan gelombang bunyi dari luar.' },
      { id: 'ipas-14', subject: 'IPAS', grade: 'kelas56', prompt: 'Candi Borobudur dibangun pada masa Dinasti ...', options: ['Sanjaya', 'Syailendra', 'Isyana'], correctIndex: 1, explanation: 'Candi Borobudur peninggalan Buddha Dinasti Syailendra.' },
      { id: 'ipas-15', subject: 'IPAS', grade: 'kelas56', prompt: 'Benda penghantar arus listrik yang baik disebut ...', options: ['Isolator', 'Respirator', 'Konduktor'], correctIndex: 2, explanation: 'Logam tembaga dan aluminium adalah konduktor listrik.' },
    ],
    bahasa: [
      { id: 'ind-1', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: 'Penulisan kata baku yang benar menurut KBBI adalah ...', options: ['Apotek', 'Apotik', 'Apoteek'], correctIndex: 0, explanation: 'Kata baku sesuai KBBI adalah "apotek".' },
      { id: 'ind-2', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: '"Angin malam berbisik lembut." Kalimat ini bermajas ...', options: ['Hiperbola', 'Personifikasi', 'Metafora'], correctIndex: 1, explanation: 'Personifikasi mengumpamakan benda mati seolah hidup.' },
      { id: 'ind-3', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: 'Antonim (lawan kata) dari kata "hemat" adalah ...', options: ['Cermat', 'Rajin', 'Boros'], correctIndex: 2, explanation: 'Lawan kata hemat adalah boros.' },
      { id: 'ind-4', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: 'Pesan moral yang disampaikan penulis dalam cerita disebut ...', options: ['Amanat', 'Latar', 'Alur'], correctIndex: 0, explanation: 'Amanat adalah nasihat atau pesan kebaikan cerita.' },
      { id: 'ind-5', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: 'Manakah yang merupakan kalimat pasif?', options: ['Rina menyiram bunga', 'Bunga disiram Rina', 'Rina menanam melati'], correctIndex: 1, explanation: 'Kalimat pasif memakai predikat berawalan di-.' },
      { id: 'ind-6', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: 'Arti ungkapan "buah tangan" adalah ...', options: ['Hasil kebun', 'Anak kesayangan', 'Oleh-oleh'], correctIndex: 2, explanation: 'Buah tangan bermakna oleh-oleh.' },
      { id: 'ind-7', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: 'Penulisan kata baku untuk "nasehat" yang tepat adalah ...', options: ['Nasihat', 'Nasiihat', 'Nasehat'], correctIndex: 0, explanation: 'Bentuk baku KBBI adalah "nasihat".' },
      { id: 'ind-8', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: 'Sinonim (persamaan kata) dari kata "teliti" adalah ...', options: ['Ceroboh', 'Cermat', 'Cepat'], correctIndex: 1, explanation: 'Teliti bersinonim dengan cermat atau saksama.' },
      { id: 'ind-9', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: '"Suaranya menggelegar membelah angkasa." Bermajas ...', options: ['Litotes', 'Simile', 'Hiperbola'], correctIndex: 2, explanation: 'Hiperbola melebih-lebihkan kenyataan.' },
      { id: 'ind-10', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: 'Imbuhan "me-" bertemu kata dasar "sapu" menjadi ...', options: ['Menyapu', 'Mensapu', 'Mesapu'], correctIndex: 0, explanation: 'Huruf "s" luluh menjadi menyapu.' },
      { id: 'ind-11', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: 'Peribahasa "Bagai air di daun talas" menggambarkan orang yang ...', options: ['Sangat sabar', 'Tidak tetap pendirian', 'Suka menolong'], correctIndex: 1, explanation: 'Melambangkan pendirian yang mudah berubah.' },
      { id: 'ind-12', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: 'Tanda baca pengakhir kalimat perintah adalah ...', options: ['Tanda tanya (?)', 'Tanda koma (,)', 'Tanda seru (!)'], correctIndex: 2, explanation: 'Kalimat perintah diakhiri tanda seru (!).' },
      { id: 'ind-13', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: 'Ide utama pengembangan sebuah paragraf disebut ...', options: ['Gagasan pokok', 'Kalimat penjelas', 'Daftar pustaka'], correctIndex: 0, explanation: 'Gagasan pokok adalah inti bahasan paragraf.' },
      { id: 'ind-14', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: 'Kata baku yang benar antara berikut ini adalah ...', options: ['Aktifitas', 'Aktivitas', 'Aktipitas'], correctIndex: 1, explanation: 'Kata baku KBBI menggunakan huruf v: "aktivitas".' },
      { id: 'ind-15', subject: 'Bahasa Indonesia', grade: 'kelas56', prompt: 'Tokoh berwatak baik dalam cerita disebut ...', options: ['Antagonis', 'Tritagonis', 'Protagonis'], correctIndex: 2, explanation: 'Protagonis adalah tokoh utama berwatak baik.' },
    ],
  },
};

export const BUILTIN_QUESTIONS = GRADED_QUESTIONS.kelas56;

export const DEFAULT_CUSTOM_QUESTIONS: Question[] = [
  {
    id: 'cust-1',
    subject: 'Soal Guru',
    prompt: 'Semboyan negara Indonesia adalah ...',
    options: ['Bhinneka Tunggal Ika', 'Tut Wuri Handayani', 'Ing Ngarsa Sung Tulada'],
    correctIndex: 0,
    explanation: 'Bhinneka Tunggal Ika berarti berbeda-beda tetapi tetap satu jua.',
  },
  {
    id: 'cust-2',
    subject: 'Soal Guru',
    prompt: 'Hasil dari 12 × 12 adalah ...',
    options: ['124', '144', '164'],
    correctIndex: 1,
    explanation: '12 × 12 = 144.',
  },
  {
    id: 'cust-3',
    subject: 'Soal Guru',
    prompt: 'Ibukota Provinsi Jawa Tengah adalah ...',
    options: ['Surabaya', 'Bandung', 'Semarang'],
    correctIndex: 2,
    explanation: 'Semarang merupakan ibu kota Provinsi Jawa Tengah.',
  },
  {
    id: 'cust-4',
    subject: 'Soal Guru',
    prompt: 'Hewan yang mengalami metamorfosis sempurna adalah ...',
    options: ['Kupu-kupu', 'Belalang', 'Kecoak'],
    correctIndex: 0,
    explanation: 'Kupu-kupu melewati fase telur, ulat, kepompong (pupa), dan dewasa.',
  },
  {
    id: 'cust-5',
    subject: 'Soal Guru',
    prompt: 'Hari Kemerdekaan Indonesia diperingati setiap tanggal ...',
    options: ['20 Mei', '17 Agustus', '10 November'],
    correctIndex: 1,
    explanation: 'Proklamasi Kemerdekaan RI dibacakan pada 17 Agustus 1945.',
  },
];

const CUSTOM_STORAGE_KEY = 'lari-pintar-3d-custom-questions-v1';

export function loadCustomQuestions(): Question[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!raw) return [...DEFAULT_CUSTOM_QUESTIONS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...DEFAULT_CUSTOM_QUESTIONS];
    }
    return parsed.filter(
      (item): item is Question =>
        Boolean(item) &&
        typeof item.prompt === 'string' &&
        Array.isArray(item.options) &&
        item.options.length === 3 &&
        (item.correctIndex === 0 || item.correctIndex === 1 || item.correctIndex === 2),
    );
  } catch {
    return [...DEFAULT_CUSTOM_QUESTIONS];
  }
}

export function saveCustomQuestions(questions: Question[]): void {
  try {
    window.localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(questions));
  } catch {
    // Ignore storage quota errors in restricted sandboxes
  }
}

export function getQuestionPool(
  subject: SubjectId,
  customQuestions: Question[],
  grade: GradeLevel = 'kelas56',
): Question[] {
  if (subject === 'custom') {
    return customQuestions.length > 0 ? customQuestions : DEFAULT_CUSTOM_QUESTIONS;
  }
  const bank = GRADED_QUESTIONS[grade] || GRADED_QUESTIONS.kelas56;
  if (subject === 'matematika') return bank.matematika;
  if (subject === 'ipas') return bank.ipas;
  if (subject === 'bahasa') return bank.bahasa;
  return [...bank.matematika, ...bank.ipas, ...bank.bahasa];
}
