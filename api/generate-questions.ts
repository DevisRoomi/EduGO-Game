import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const GRADE_LABELS_ID: Record<string, string> = {
  kelas1: 'Kelas 1 SD (usia 6–7 tahun, sangat sederhana, kalimat sangat pendek, angka 1–20)',
  kelas2: 'Kelas 2 SD (usia 7–8 tahun, penjumlahan/pengurangan sampai 100, perkalian dasar 2–5, pengetahuan sehari-hari)',
  kelas3: 'Kelas 3 SD (usia 8–9 tahun, perkalian & pembagian dasar, pecahan sederhana, lingkungan & bahasa)',
  kelas4: 'Kelas 4 SD (usia 9–10 tahun, operasi hitung campuran, bangun datar, IPAS & Bahasa Indonesia SD)',
  kelas56: 'Kelas 5–6 SD (usia 10–12 tahun, pecahan, persen, volume, kecepatan, tata surya, IPA/IPS & Bahasa menantang)',
};

interface ServerQuestion {
  id: string;
  subject: string;
  prompt: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanation?: string;
}

function sanitizeQuestions(raw: unknown): ServerQuestion[] {
  if (!Array.isArray(raw)) return [];
  const valid: ServerQuestion[] = [];
  for (const item of raw.slice(0, 30)) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as ServerQuestion).prompt === 'string' &&
      Array.isArray((item as ServerQuestion).options) &&
      (item as ServerQuestion).options.length === 3 &&
      ((item as ServerQuestion).correctIndex === 0 ||
        (item as ServerQuestion).correctIndex === 1 ||
        (item as ServerQuestion).correctIndex === 2)
    ) {
      const q = item as ServerQuestion;
      valid.push({
        id: String(q.id || `q-${valid.length}`),
        subject: String(q.subject || 'Soal Guru').slice(0, 40),
        prompt: q.prompt.trim().slice(0, 220),
        options: [
          String(q.options[0]).trim().slice(0, 80),
          String(q.options[1]).trim().slice(0, 80),
          String(q.options[2]).trim().slice(0, 80),
        ],
        correctIndex: q.correctIndex,
        explanation: q.explanation ? String(q.explanation).slice(0, 220) : undefined,
      });
    }
  }
  return valid;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
  const grade = typeof body.grade === 'string' && GRADE_LABELS_ID[body.grade] ? body.grade : '';
  const rawCount = Number(body.count);
  const count = Number.isInteger(rawCount) ? rawCount : NaN;

  if (topic.length < 3 || topic.length > 120) {
    return res.status(400).json({
      error: 'Topik soal harus diisi antara 3 hingga 120 karakter.',
    });
  }
  if (!grade) {
    return res.status(400).json({
      error: 'Tingkat kelas SD tidak valid.',
    });
  }
  if (!Number.isInteger(count) || count < 3 || count > 15) {
    return res.status(400).json({
      error: 'Jumlah soal harus berupa angka antara 3 sampai 15.',
    });
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(503).json({
      error: 'Layanan pembuat soal otomatis belum dikonfigurasi (GEMINI_API_KEY belum disetel).',
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const promptText = [
      `Buatkan tepat ${count} soal pilihan ganda (3 pilihan jawaban: A, B, C) dalam Bahasa Indonesia yang ramah anak, akurat secara edukatif, dan menarik untuk siswa ${GRADE_LABELS_ID[grade]}.`,
      `Topik soal: "${topic}".`,
      'Aturan penting untuk format game balapan 3D:',
      '- Setiap pertanyaan singkat, jelas, dan mudah dibaca cepat (maksimal 95 karakter).',
      '- Setiap pilihan jawaban sangat ringkas (1–4 kata, maksimal 28 karakter) agar terbaca jelas di papan gerbang 3D.',
      '- Hanya ada 1 jawaban paling benar; letakkan posisi correctIndex (0, 1, atau 2) secara acak dan bervariasi antar soal.',
      '- Berikan penjelasan singkat (1 kalimat) untuk review siswa di akhir balapan.',
    ].join('\n');

    const candidateModels = process.env.GEMINI_MODEL
      ? [process.env.GEMINI_MODEL]
      : ['gemini-4-hydrogen', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];

    let response: any = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: promptText,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      prompt: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING },
                    },
                    required: ['prompt', 'options', 'correctIndex', 'explanation'],
                  },
                },
              },
              required: ['questions'],
            },
          },
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed, trying next candidate...`, err?.message || err);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All candidate models failed to respond.');
    }

    const rawText = response.text;
    if (!rawText) {
      return res.status(502).json({
        error: 'Respon generator soal kosong. Silakan coba lagi.',
      });
    }

    const parsed = JSON.parse(rawText) as { questions?: unknown[] };
    const subjectLabel = topic.slice(0, 30);
    const rawItems = Array.isArray(parsed.questions)
      ? parsed.questions.map((item, idx) => ({
          ...(item && typeof item === 'object' ? (item as Record<string, unknown>) : {}),
          id: `ai-${Date.now()}-${idx}`,
          subject: subjectLabel,
        }))
      : [];

    const sanitized = sanitizeQuestions(rawItems).slice(0, count);
    if (sanitized.length === 0) {
      return res.status(502).json({
        error: 'Tidak ada soal valid yang berhasil dibuat. Coba perjelas topik soal.',
      });
    }

    return res.status(200).json({ questions: sanitized });
  } catch (err) {
    console.error('Failed to generate questions:', err);
    return res.status(502).json({
      error: 'Gagal menghubungi layanan pembuat soal otomatis. Silakan coba beberapa saat lagi.',
    });
  }
}
