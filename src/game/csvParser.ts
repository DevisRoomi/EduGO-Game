import type { Question } from './types';

export interface SpreadsheetParseResult {
  questions: Question[];
  errors: string[];
}

function detectDelimiter(line: string): string {
  if (line.includes('\t')) return '\t';
  const semicolons = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

export function splitDelimitedLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseAnswerKey(raw: string): 0 | 1 | 2 | null {
  const cleaned = raw.trim().toUpperCase();
  if (cleaned === 'A' || cleaned === '1') return 0;
  if (cleaned === 'B' || cleaned === '2') return 1;
  if (cleaned === 'C' || cleaned === '3') return 2;
  return null;
}

function looksLikeHeader(cols: string[]): boolean {
  const first = (cols[0] || '').trim().toLowerCase();
  const second = (cols[1] || '').trim().toLowerCase();
  const fifth = (cols[4] || '').trim().toLowerCase();
  if (first.includes('?')) return false;
  const firstIsHeader = first === 'pertanyaan' || first === 'soal' || first === 'question';
  const secondIsHeader = second.startsWith('opsi') || second.startsWith('pilihan') || second === 'a' || second === 'option a';
  const fifthIsHeader = fifth.includes('jawaban') || fifth.includes('kunci') || fifth === 'answer';
  return firstIsHeader || (secondIsHeader && fifthIsHeader);
}

/**
 * Parses CSV or TSV (Excel / Google Sheets copy-paste) text into Questions.
 * Expected columns: Pertanyaan | Opsi A | Opsi B | Opsi C | Kunci (A/B/C atau 1/2/3) | [Penjelasan]
 */
export function parseSpreadsheetQuestions(rawText: string): SpreadsheetParseResult {
  const normalized = rawText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) {
    return {
      questions: [],
      errors: ['Teks spreadsheet masih kosong. Tempel data atau pilih file CSV/TSV terlebih dahulu.'],
    };
  }

  const questions: Question[] = [];
  const errors: string[] = [];
  const now = Date.now();

  rawLines.forEach((line, idx) => {
    const delimiter = detectDelimiter(line);
    const cols = splitDelimitedLine(line, delimiter);

    if (idx === 0 && looksLikeHeader(cols)) {
      return;
    }

    const rowNumber = idx + 1;
    if (cols.length < 5) {
      errors.push(`Baris ${rowNumber}: butuh minimal 5 kolom (Pertanyaan, Opsi A, Opsi B, Opsi C, Kunci A/B/C).`);
      return;
    }

    const [prompt, optA, optB, optC, answerRaw, explanation] = cols;
    if (!prompt || !optA || !optB || !optC) {
      errors.push(`Baris ${rowNumber}: pertanyaan dan ketiga opsi jawaban (A, B, C) tidak boleh kosong.`);
      return;
    }

    const correctIndex = parseAnswerKey(answerRaw);
    if (correctIndex === null) {
      errors.push(`Baris ${rowNumber}: kunci jawaban "${answerRaw}" harus berupa A, B, atau C (atau 1, 2, 3).`);
      return;
    }

    questions.push({
      id: `imp-${now}-${idx}`,
      subject: 'Soal Guru',
      prompt,
      options: [optA, optB, optC],
      correctIndex,
      explanation: explanation || undefined,
    });
  });

  return { questions, errors };
}

function escapeCsvCell(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportQuestionsToCsv(questions: Question[]): string {
  const letters = ['A', 'B', 'C'] as const;
  const header = 'Pertanyaan,Opsi A,Opsi B,Opsi C,Kunci Jawaban,Penjelasan';
  const rows = questions.map((q) =>
    [
      escapeCsvCell(q.prompt),
      escapeCsvCell(q.options[0]),
      escapeCsvCell(q.options[1]),
      escapeCsvCell(q.options[2]),
      letters[q.correctIndex],
      escapeCsvCell(q.explanation || ''),
    ].join(','),
  );
  return `\uFEFF${header}\n${rows.join('\n')}`;
}
