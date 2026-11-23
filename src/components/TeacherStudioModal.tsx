import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { GradeLevel, Question } from '../game/types';
import { BUILTIN_QUESTIONS, DEFAULT_CUSTOM_QUESTIONS, GRADE_META } from '../game/questions';
import { exportQuestionsToCsv, parseSpreadsheetQuestions } from '../game/csvParser';

interface TeacherStudioModalProps {
  questions: Question[];
  defaultGrade: GradeLevel;
  onSaveQuestions: (next: Question[]) => void;
  onUseCustomSubject: () => void;
  onClose: () => void;
}

const SAMPLE_PASTE = `Pertanyaan,Opsi A,Opsi B,Opsi C,Kunci Jawaban,Penjelasan
Hasil dari 7 × 8 adalah ...,54,56,64,B,7 dikali 8 sama dengan 56
Hewan pemakan tumbuhan disebut ...,Herbivora,Karnivora,Omnivora,A,Herbivora memakan tumbuhan`;

const QUICK_TOPICS = [
  'Pecahan Senilai',
  'Tata Surya dan Planet',
  'Rantai Makanan Ekosistem',
  'Sejarah Kemerdekaan Indonesia',
  'Bangun Datar & Keliling',
];

const GRADE_KEYS: GradeLevel[] = ['kelas1', 'kelas2', 'kelas3', 'kelas4', 'kelas56'];

export const TeacherStudioModal: React.FC<TeacherStudioModalProps> = ({
  questions,
  defaultGrade,
  onSaveQuestions,
  onUseCustomSubject,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'spreadsheet' | 'auto'>('manual');

  // Manual form state
  const [prompt, setPrompt] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [correctIndex, setCorrectIndex] = useState<0 | 1 | 2>(0);
  const [explanation, setExplanation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Spreadsheet import state
  const [pasteText, setPasteText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [importFeedback, setImportFeedback] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);

  // Auto question generator state
  const [autoTopic, setAutoTopic] = useState('');
  const [autoGrade, setAutoGrade] = useState<GradeLevel>(defaultGrade);
  const [autoCount, setAutoCount] = useState<number>(5);
  const [autoMode, setAutoMode] = useState<'append' | 'replace'>('append');
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoError, setAutoError] = useState<string | null>(null);
  const [autoSuccessCount, setAutoSuccessCount] = useState<number | null>(null);

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !optA.trim() || !optB.trim() || !optC.trim()) {
      setFormError('Pertanyaan dan ketiga pilihan jawaban (A, B, C) wajib diisi.');
      return;
    }
    setFormError(null);
    const newQuestion: Question = {
      id: `manual-${Date.now()}`,
      subject: 'Soal Guru',
      prompt: prompt.trim(),
      options: [optA.trim(), optB.trim(), optC.trim()],
      correctIndex,
      explanation: explanation.trim() || undefined,
    };
    onSaveQuestions([newQuestion, ...questions]);
    setPrompt('');
    setOptA('');
    setOptB('');
    setOptC('');
    setExplanation('');
    setCorrectIndex(0);
  };

  const handleDelete = (id: string) => {
    onSaveQuestions(questions.filter((q) => q.id !== id));
  };

  const handleLoadPreset = (preset: 'matematika' | 'ipas' | 'bahasa' | 'default') => {
    if (preset === 'default') {
      onSaveQuestions([...DEFAULT_CUSTOM_QUESTIONS]);
      return;
    }
    onSaveQuestions(
      BUILTIN_QUESTIONS[preset].map((q, i) => ({
        ...q,
        id: `copy-${preset}-${Date.now()}-${i}`,
        subject: 'Soal Guru',
      })),
    );
  };

  const handleImportSpreadsheetText = (raw: string) => {
    const res = parseSpreadsheetQuestions(raw);
    if (res.questions.length > 0) {
      const nextList =
        importMode === 'replace' ? res.questions : [...res.questions, ...questions];
      onSaveQuestions(nextList);
      setPasteText('');
    }
    setImportFeedback({
      imported: res.questions.length,
      errors: res.errors,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      handleImportSpreadsheetText(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadTemplate = () => {
    const csv = exportQuestionsToCsv(questions.length > 0 ? questions : DEFAULT_CUSTOM_QUESTIONS);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-soal-lari-pintar.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = autoTopic.trim();
    if (trimmed.length < 3) {
      setAutoError('Ketik topik pelajaran terlebih dahulu (minimal 3 karakter).');
      return;
    }

    setAutoLoading(true);
    setAutoError(null);
    setAutoSuccessCount(null);

    try {
      const resp = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trimmed,
          grade: autoGrade,
          count: autoCount,
        }),
      });
      const data = (await resp.json()) as { questions?: Question[]; error?: string };
      if (!resp.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
        setAutoError(data.error || 'Gagal membuat soal otomatis. Silakan coba lagi.');
        return;
      }

      const nextList =
        autoMode === 'replace' ? data.questions : [...data.questions, ...questions];
      onSaveQuestions(nextList);
      setAutoSuccessCount(data.questions.length);
    } catch {
      setAutoError('Tidak dapat terhubung ke server pembuat soal. Periksa koneksi jaringan.');
    } finally {
      setAutoLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-guru-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/65 p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border-[3px] border-slate-900 bg-[#FFFDF5] shadow-[0_10px_0_#0F172A]">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b-2 border-slate-200 bg-amber-300 px-5 py-3.5">
          <div>
            <h2 id="studio-guru-title" className="font-display text-xl font-bold text-slate-900">
              Studio Bank Soal Guru
            </h2>
            <p className="text-xs font-semibold text-slate-800">
              Total tersimpan: {questions.length} soal · Otomatis dipakai saat memilih materi &quot;Soal Guru&quot;
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Studio Bank Soal Guru"
            className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-slate-900 bg-white text-slate-900 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-2.5">
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'manual'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Manual &amp; Daftar ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spreadsheet')}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'spreadsheet'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Impor Spreadsheet
            </button>
            <button
              type="button"
              data-testid="tab-auto-questions"
              onClick={() => setActiveTab('auto')}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'auto'
                  ? 'bg-indigo-600 text-white'
                  : 'text-indigo-800 hover:bg-indigo-50'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Buat Soal Otomatis
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border-2 border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:border-slate-900"
          >
            <Download className="h-3.5 w-3.5" />
            Unduh Template CSV
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'manual' ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
              {/* Manual Add Form */}
              <form onSubmit={handleAddManual} className="space-y-3 rounded-xl border-2 border-slate-200 bg-white p-4">
                <h3 className="font-display text-base font-bold text-slate-900">
                  Tambah Pertanyaan Baru
                </h3>

                <div>
                  <label htmlFor="q-prompt" className="mb-1 block text-xs font-bold text-slate-700">
                    Pertanyaan
                  </label>
                  <textarea
                    id="q-prompt"
                    rows={2}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Contoh: Berapakah hasil dari 3/4 + 1/4?"
                    className="w-full rounded-lg border-2 border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid gap-2">
                  <div>
                    <label htmlFor="q-opt-a" className="mb-0.5 block text-xs font-bold text-blue-700">
                      Pilihan A (Gerbang Biru)
                    </label>
                    <input
                      id="q-opt-a"
                      type="text"
                      value={optA}
                      onChange={(e) => setOptA(e.target.value)}
                      placeholder="Opsi A"
                      className="w-full rounded-lg border-2 border-slate-300 px-3 py-1.5 text-sm font-semibold focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="q-opt-b" className="mb-0.5 block text-xs font-bold text-amber-700">
                      Pilihan B (Gerbang Kuning)
                    </label>
                    <input
                      id="q-opt-b"
                      type="text"
                      value={optB}
                      onChange={(e) => setOptB(e.target.value)}
                      placeholder="Opsi B"
                      className="w-full rounded-lg border-2 border-slate-300 px-3 py-1.5 text-sm font-semibold focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="q-opt-c" className="mb-0.5 block text-xs font-bold text-emerald-700">
                      Pilihan C (Gerbang Hijau)
                    </label>
                    <input
                      id="q-opt-c"
                      type="text"
                      value={optC}
                      onChange={(e) => setOptC(e.target.value)}
                      placeholder="Opsi C"
                      className="w-full rounded-lg border-2 border-slate-300 px-3 py-1.5 text-sm font-semibold focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="q-key" className="mb-1 block text-xs font-bold text-slate-700">
                      Kunci Jawaban Benar
                    </label>
                    <select
                      id="q-key"
                      value={correctIndex}
                      onChange={(e) => setCorrectIndex(Number(e.target.value) as 0 | 1 | 2)}
                      className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-slate-900 focus:outline-none"
                    >
                      <option value={0}>A (Gerbang Biru)</option>
                      <option value={1}>B (Gerbang Kuning)</option>
                      <option value={2}>C (Gerbang Hijau)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="q-exp" className="mb-1 block text-xs font-bold text-slate-700">
                      Penjelasan (Opsional)
                    </label>
                    <input
                      id="q-exp"
                      type="text"
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      placeholder="Singkat untuk review"
                      className="w-full rounded-lg border-2 border-slate-300 px-3 py-2 text-sm font-medium focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                {formError && (
                  <p role="alert" className="text-xs font-bold text-rose-600">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-slate-900 bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-900 shadow-[0_3px_0_#0F172A] hover:bg-emerald-300"
                >
                  <Plus className="h-4 w-4" />
                  Simpan ke Bank Soal
                </button>
              </form>

              {/* Current Saved Question List */}
              <div className="flex flex-col">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Daftar Soal Tersimpan
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-semibold text-slate-500">Salin contoh:</span>
                    <button
                      type="button"
                      onClick={() => handleLoadPreset('matematika')}
                      className="rounded border border-slate-300 bg-white px-2 py-0.5 font-bold text-slate-700 hover:border-slate-900"
                    >
                      Matematika
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadPreset('ipas')}
                      className="rounded border border-slate-300 bg-white px-2 py-0.5 font-bold text-slate-700 hover:border-slate-900"
                    >
                      IPAS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadPreset('default')}
                      aria-label="Reset ke 5 soal contoh awal"
                      className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 font-bold text-slate-700 hover:border-slate-900"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center">
                    <p className="text-sm font-bold text-slate-700">Belum ada soal custom.</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Tambahkan soal di formulir kiri, impor dari spreadsheet, atau buat otomatis berdasarkan topik.
                    </p>
                  </div>
                ) : (
                  <ul className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
                    {questions.map((q, index) => (
                      <li
                        key={q.id}
                        className="flex items-start justify-between gap-3 rounded-xl border-2 border-slate-200 bg-white p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900">
                            {index + 1}. {q.prompt}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-semibold text-slate-600">
                            <span className={q.correctIndex === 0 ? 'font-extrabold text-emerald-700' : ''}>
                              A: {q.options[0]}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className={q.correctIndex === 1 ? 'font-extrabold text-emerald-700' : ''}>
                              B: {q.options[1]}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className={q.correctIndex === 2 ? 'font-extrabold text-emerald-700' : ''}>
                              C: {q.options[2]}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(q.id)}
                          aria-label={`Hapus soal "${q.prompt}"`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : activeTab === 'spreadsheet' ? (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
                <h3 className="font-display text-base font-bold text-slate-900">
                  Impor dari Google Sheets, Microsoft Excel, atau File CSV
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Urutan kolom: <strong>Pertanyaan</strong> | <strong>Opsi A</strong> | <strong>Opsi B</strong> | <strong>Opsi C</strong> | <strong>Kunci (A/B/C atau 1/2/3)</strong> | <em>Penjelasan (opsional)</em>.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-slate-900 bg-sky-100 px-4 py-2 text-xs font-bold text-slate-900 hover:bg-sky-200">
                    <Upload className="h-4 w-4" />
                    Pilih File .CSV / .TSV
                    <input
                      type="file"
                      accept=".csv,.tsv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <span>Mode impor:</span>
                    <button
                      type="button"
                      onClick={() => setImportMode('append')}
                      className={`rounded-lg px-2.5 py-1 ${
                        importMode === 'append' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Tambahkan
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('replace')}
                      className={`rounded-lg px-2.5 py-1 ${
                        importMode === 'replace' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Ganti Semua
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="spreadsheet-paste" className="text-xs font-bold text-slate-700">
                      Atau tempel (Copy-Paste) langsung baris dari Excel / Google Sheets:
                    </label>
                    <button
                      type="button"
                      onClick={() => setPasteText(SAMPLE_PASTE)}
                      className="text-xs font-bold text-sky-700 underline hover:text-sky-900"
                    >
                      Isi Contoh CSV
                    </button>
                  </div>
                  <textarea
                    id="spreadsheet-paste"
                    rows={6}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={SAMPLE_PASTE}
                    className="font-mono w-full rounded-xl border-2 border-slate-300 bg-slate-50 p-3 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleImportSpreadsheetText(pasteText)}
                    className="rounded-xl border-2 border-slate-900 bg-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-[0_3px_0_#0F172A] hover:bg-emerald-300"
                  >
                    Impor Soal ke Bank
                  </button>
                </div>

                {importFeedback && (
                  <div className="mt-3 space-y-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-xs">
                    {importFeedback.imported > 0 && (
                      <p className="font-bold text-emerald-700">
                        Berhasil mengimpor {importFeedback.imported} soal baru ke Bank Soal Guru!
                      </p>
                    )}
                    {importFeedback.errors.length > 0 && (
                      <div className="space-y-0.5 text-rose-700">
                        <p className="font-bold">Catatan baris yang dilewati:</p>
                        {importFeedback.errors.map((err, idx) => (
                          <p key={idx}>• {err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleGenerateQuestions}
              className="space-y-4 rounded-xl border-2 border-indigo-200 bg-white p-5"
            >
              <div>
                <h3 className="font-display flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  Pembuat Soal Otomatis dari Topik Pelajaran
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Ketik bab atau topik apa saja yang sedang diajarkan hari ini. Sistem akan menyusun soal pilihan ganda 3 opsi yang singkat dan langsung masuk ke Bank Soal Guru.
                </p>
              </div>

              <div>
                <label htmlFor="auto-topic-input" className="mb-1 block text-xs font-bold text-slate-800">
                  Topik atau Bab Pelajaran
                </label>
                <input
                  id="auto-topic-input"
                  data-testid="auto-topic-input"
                  type="text"
                  maxLength={120}
                  value={autoTopic}
                  onChange={(e) => setAutoTopic(e.target.value)}
                  placeholder="Contoh: Pecahan senilai, Siklus air, Pahlawan nasional, atau Perkalian 6–9"
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500">Topik cepat:</span>
                  {QUICK_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setAutoTopic(topic)}
                      className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-indigo-600 hover:bg-indigo-50 hover:text-indigo-900"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="auto-grade-select" className="mb-1 block text-xs font-bold text-slate-800">
                    Tingkat Kelas SD
                  </label>
                  <select
                    id="auto-grade-select"
                    value={autoGrade}
                    onChange={(e) => setAutoGrade(e.target.value as GradeLevel)}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                  >
                    {GRADE_KEYS.map((g) => (
                      <option key={g} value={g}>
                        {GRADE_META[g].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="mb-1 block text-xs font-bold text-slate-800">Jumlah Soal</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[5, 10, 15].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setAutoCount(cnt)}
                        className={`font-num rounded-xl border-2 py-2 text-sm font-bold ${
                          autoCount === cnt
                            ? 'border-slate-900 bg-indigo-600 text-white'
                            : 'border-slate-300 bg-white text-slate-800 hover:border-slate-900'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-1 block text-xs font-bold text-slate-800">Penyimpanan</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAutoMode('append')}
                      className={`rounded-xl border-2 py-2 text-xs font-bold ${
                        autoMode === 'append'
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      Tambahkan
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoMode('replace')}
                      className={`rounded-xl border-2 py-2 text-xs font-bold ${
                        autoMode === 'replace'
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      Ganti Semua
                    </button>
                  </div>
                </div>
              </div>

              {autoError && (
                <p role="alert" className="rounded-xl border-2 border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700">
                  {autoError}
                </p>
              )}

              {autoSuccessCount !== null && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-800">
                  <span>
                    Berhasil membuat {autoSuccessCount} soal baru! Soal sudah tersimpan di Bank Soal Guru.
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className="rounded-lg border border-emerald-700 bg-white px-2.5 py-1 text-emerald-800 hover:bg-emerald-100"
                  >
                    Lihat Daftar Soal
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={autoLoading}
                data-testid="generate-questions-submit"
                className="font-display flex w-full items-center justify-center gap-2 rounded-xl border-[3px] border-slate-900 bg-indigo-500 px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_#0F172A] hover:bg-indigo-400 disabled:cursor-wait disabled:opacity-65"
              >
                {autoLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sedang Menyusun {autoCount} Soal...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Buat {autoCount} Soal Sekarang
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t-2 border-slate-200 bg-white px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-900 hover:text-slate-900"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => {
              onUseCustomSubject();
              onClose();
            }}
            className="rounded-xl border-2 border-slate-900 bg-rose-500 px-5 py-2 text-sm font-bold text-white shadow-[0_3px_0_#0F172A] hover:bg-rose-400"
          >
            Pakai Bank Soal Guru ({questions.length} Soal)
          </button>
        </div>
      </div>
    </div>
  );
};
