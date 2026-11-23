import test from 'node:test';
import assert from 'node:assert/strict';
import { exportQuestionsToCsv, parseSpreadsheetQuestions } from './csvParser';
import type { Question } from './types';

test('parseSpreadsheetQuestions parses CSV with header and quoted commas', () => {
  const input = [
    'Pertanyaan,Opsi A,Opsi B,Opsi C,Kunci Jawaban,Penjelasan',
    '"Urutan bilangan 2, 4, 6 berikutnya adalah?",7,8,10,B,"Pola bertambah 2"',
    'Ibu kota Indonesia adalah?,Jakarta,Bandung,Surabaya,A,DKI Jakarta',
  ].join('\n');

  const res = parseSpreadsheetQuestions(input);
  assert.equal(res.errors.length, 0);
  assert.equal(res.questions.length, 2);
  assert.equal(res.questions[0].prompt, 'Urutan bilangan 2, 4, 6 berikutnya adalah?');
  assert.deepEqual(res.questions[0].options, ['7', '8', '10']);
  assert.equal(res.questions[0].correctIndex, 1);
  assert.equal(res.questions[1].correctIndex, 0);
});

test('parseSpreadsheetQuestions supports TSV pasted from Excel or Google Sheets', () => {
  const input = [
    'Hasil 9 x 8 adalah?\t72\t64\t81\t1',
    'Planet merah di tata surya?\tVenus\tMars\tSaturnus\tB',
  ].join('\n');

  const res = parseSpreadsheetQuestions(input);
  assert.equal(res.errors.length, 0);
  assert.equal(res.questions.length, 2);
  assert.equal(res.questions[0].correctIndex, 0);
  assert.equal(res.questions[1].correctIndex, 1);
});

test('parseSpreadsheetQuestions reports invalid keys and empty fields clearly', () => {
  const input = [
    'Soal salah kunci?,A1,B1,C1,D',
    'Soal kurang kolom?,A1,B1',
    ',A1,B1,C1,A',
  ].join('\n');

  const res = parseSpreadsheetQuestions(input);
  assert.equal(res.questions.length, 0);
  assert.equal(res.errors.length, 3);
});

test('exportQuestionsToCsv round-trips cleanly through parseSpreadsheetQuestions', () => {
  const sample: Question[] = [
    {
      id: 'q1',
      subject: 'Soal Guru',
      prompt: 'Berapakah 1/2 + 1/4, dalam bentuk desimal?',
      options: ['0,5', '0,75', '1,25'],
      correctIndex: 1,
      explanation: '0,5 + 0,25 = 0,75',
    },
  ];
  const csv = exportQuestionsToCsv(sample);
  const reparsed = parseSpreadsheetQuestions(csv);
  assert.equal(reparsed.errors.length, 0);
  assert.equal(reparsed.questions.length, 1);
  assert.equal(reparsed.questions[0].prompt, sample[0].prompt);
  assert.deepEqual(reparsed.questions[0].options, sample[0].options);
  assert.equal(reparsed.questions[0].correctIndex, 1);
});
