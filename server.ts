import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_ROOM_PLAYERS = 8;

const ALLOWED_WORLDS = new Set(['taman', 'pantai', 'salju', 'angkasa']);
const ALLOWED_HATS = new Set(['sport', 'astronaut', 'bunny', 'graduation', 'starCrown']);
const GRADE_LABELS_ID: Record<string, string> = {
  kelas1: 'Kelas 1 SD (usia 6–7 tahun, sangat sederhana, kalimat sangat pendek, angka 1–20)',
  kelas2: 'Kelas 2 SD (usia 7–8 tahun, penjumlahan/pengurangan sampai 100, perkalian dasar 2–5, pengetahuan sehari-hari)',
  kelas3: 'Kelas 3 SD (usia 8–9 tahun, perkalian & pembagian dasar, pecahan sederhana, lingkungan & bahasa)',
  kelas4: 'Kelas 4 SD (usia 9–10 tahun, operasi hitung campuran, bangun datar, IPAS & Bahasa Indonesia SD)',
  kelas56: 'Kelas 5–6 SD (usia 10–12 tahun, pecahan, persen, volume, kecepatan, tata surya, IPA/IPS & Bahasa menantang)',
};

function normalizeWorldTheme(raw: unknown): string {
  const s = String(raw || 'taman');
  return ALLOWED_WORLDS.has(s) ? s : 'taman';
}

function normalizeHatStyle(raw: unknown): string {
  const s = String(raw || 'sport');
  return ALLOWED_HATS.has(s) ? s : 'sport';
}

interface ServerQuestion {
  id: string;
  subject: string;
  prompt: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanation?: string;
}

interface RoomMember {
  id: string;
  ws: WebSocket;
  name: string;
  slot: number;
  colorIndex: number;
  hatStyle: string;
  isHost: boolean;
}

interface MultiplayerRoom {
  code: string;
  subject: string;
  grade: string;
  pace: string;
  worldTheme: string;
  questions: ServerQuestion[];
  members: Map<string, RoomMember>;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  createdAt: number;
  lastActivityAt: number;
}

const rooms = new Map<string, MultiplayerRoom>();
const socketMeta = new WeakMap<WebSocket, { roomCode: string; playerId: string }>();
let playerSeq = 0;

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 25; attempt++) {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!rooms.has(code)) return code;
  }
  return `R${Math.floor(100 + Math.random() * 899)}`;
}

function nextPlayerId(): string {
  playerSeq += 1;
  return `p-${Date.now().toString(36)}-${playerSeq}`;
}

function sendJson(ws: WebSocket | null | undefined, payload: unknown): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
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

function serializeMembers(room: MultiplayerRoom) {
  return Array.from(room.members.values())
    .sort((a, b) => a.slot - b.slot)
    .map((m) => ({
      id: m.id,
      name: m.name,
      slot: m.slot,
      colorIndex: m.colorIndex,
      hatStyle: m.hatStyle,
      isHost: m.isHost,
    }));
}

function broadcastRoomState(room: MultiplayerRoom): void {
  const membersList = serializeMembers(room);
  for (const member of room.members.values()) {
    sendJson(member.ws, {
      type: 'room:state',
      room: {
        code: room.code,
        subject: room.subject,
        grade: room.grade,
        pace: room.pace,
        worldTheme: room.worldTheme,
        questionCount: room.questions.length,
        status: room.status,
        maxPlayers: MAX_ROOM_PLAYERS,
        myPlayerId: member.id,
        isHost: member.isHost,
        members: membersList,
      },
    });
  }
}

function leaveCurrentRoom(ws: WebSocket): void {
  const meta = socketMeta.get(ws);
  if (!meta) return;
  socketMeta.delete(ws);
  const room = rooms.get(meta.roomCode);
  if (!room) return;

  const leaving = room.members.get(meta.playerId);
  if (!leaving) return;

  room.members.delete(meta.playerId);
  if (room.members.size === 0) {
    rooms.delete(meta.roomCode);
    return;
  }

  // Promote the next remaining player to Host if the Host leaves
  if (leaving.isHost) {
    const remaining = Array.from(room.members.values()).sort((a, b) => a.slot - b.slot);
    if (remaining[0]) {
      remaining[0].isHost = true;
    }
  }

  if (room.members.size < 2 && room.status === 'ready') {
    room.status = 'waiting';
  }

  for (const member of room.members.values()) {
    sendJson(member.ws, {
      type: 'player:left',
      playerId: leaving.id,
      name: leaving.name,
    });
  }
  broadcastRoomState(room);
}

function getNextAvailableSlot(room: MultiplayerRoom): number {
  const used = new Set(Array.from(room.members.values()).map((m) => m.slot));
  for (let s = 1; s <= MAX_ROOM_PLAYERS; s++) {
    if (!used.has(s)) return s;
  }
  return room.members.size + 1;
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, activeRooms: rooms.size });
  });

  app.post('/api/generate-questions', async (req, res) => {
    const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    const grade = typeof body.grade === 'string' && GRADE_LABELS_ID[body.grade] ? body.grade : '';
    const rawCount = Number(body.count);
    const count = Number.isInteger(rawCount) ? rawCount : NaN;

    if (topic.length < 3 || topic.length > 120) {
      res.status(400).json({
        error: 'Topik soal harus diisi antara 3 hingga 120 karakter.',
      });
      return;
    }
    if (!grade) {
      res.status(400).json({
        error: 'Tingkat kelas SD tidak valid.',
      });
      return;
    }
    if (!Number.isInteger(count) || count < 3 || count > 15) {
      res.status(400).json({
        error: 'Jumlah soal harus berupa angka antara 3 sampai 15.',
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'Layanan pembuat soal otomatis belum dikonfigurasi pada server.',
      });
      return;
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
          console.warn(`Server: Model ${model} failed, trying next candidate...`, err?.message || err);
        }
      }

      if (!response || !response.text) {
        throw lastError || new Error('All candidate models failed to respond.');
      }

      const rawText = response.text;
      if (!rawText) {
        res.status(502).json({
          error: 'Respon generator soal kosong. Silakan coba lagi.',
        });
        return;
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
        res.status(502).json({
          error: 'Tidak ada soal valid yang berhasil dibuat. Coba perjelas topik soal.',
        });
        return;
      }

      res.json({ questions: sanitized });
    } catch (err) {
      console.error('Failed to generate questions:', err);
      res.status(502).json({
        error: 'Gagal menghubungi layanan pembuat soal otomatis. Silakan coba beberapa saat lagi.',
      });
    }
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      const type = String(msg.type || '');

      if (type === 'room:create') {
        leaveCurrentRoom(ws);
        const code = generateRoomCode();
        const hostName = String(msg.playerName || 'Pemain 1').trim().slice(0, 20) || 'Pemain 1';
        const subject = String(msg.subject || 'campuran').slice(0, 32);
        const grade = String(msg.grade || 'kelas4').slice(0, 20);
        const pace = String(msg.pace || 'normal').slice(0, 20);
        const worldTheme = normalizeWorldTheme(msg.worldTheme);
        const hatStyle = normalizeHatStyle(msg.hatStyle);
        const questions = sanitizeQuestions(msg.questions);
        const playerId = nextPlayerId();

        const room: MultiplayerRoom = {
          code,
          subject,
          grade,
          pace,
          worldTheme,
          questions,
          members: new Map(),
          status: 'waiting',
          createdAt: Date.now(),
          lastActivityAt: Date.now(),
        };
        room.members.set(playerId, {
          id: playerId,
          ws,
          name: hostName,
          slot: 1,
          colorIndex: 0,
          hatStyle,
          isHost: true,
        });
        rooms.set(code, room);
        socketMeta.set(ws, { roomCode: code, playerId });
        broadcastRoomState(room);
        return;
      }

      if (type === 'room:join') {
        leaveCurrentRoom(ws);
        const code = String(msg.code || '').trim().toUpperCase();
        const room = rooms.get(code);
        if (!room || room.members.size === 0) {
          sendJson(ws, {
            type: 'room:error',
            message: `Kode ruang "${code}" tidak ditemukan. Pastikan kode atau link dari guru/teman benar.`,
          });
          return;
        }
        if (room.members.size >= MAX_ROOM_PLAYERS) {
          sendJson(ws, {
            type: 'room:error',
            message: `Ruang "${code}" sudah penuh (${MAX_ROOM_PLAYERS}/${MAX_ROOM_PLAYERS} pemain).`,
          });
          return;
        }
        const slot = getNextAvailableSlot(room);
        const guestName =
          String(msg.playerName || `Pemain ${slot}`).trim().slice(0, 20) || `Pemain ${slot}`;
        const hatStyle = normalizeHatStyle(msg.hatStyle);
        const playerId = nextPlayerId();

        room.members.set(playerId, {
          id: playerId,
          ws,
          name: guestName,
          slot,
          colorIndex: (slot - 1) % 8,
          hatStyle,
          isHost: false,
        });
        if (room.status === 'waiting' && room.members.size >= 2) {
          room.status = 'ready';
        }
        room.lastActivityAt = Date.now();
        socketMeta.set(ws, { roomCode: code, playerId });
        broadcastRoomState(room);
        return;
      }

      if (type === 'room:updateConfig') {
        const meta = socketMeta.get(ws);
        if (!meta) return;
        const room = rooms.get(meta.roomCode);
        const member = room?.members.get(meta.playerId);
        if (!room || !member?.isHost) return;

        if (typeof msg.subject === 'string') room.subject = msg.subject.slice(0, 32);
        if (typeof msg.grade === 'string') room.grade = msg.grade.slice(0, 20);
        if (typeof msg.pace === 'string') room.pace = msg.pace.slice(0, 20);
        if (typeof msg.worldTheme === 'string') room.worldTheme = normalizeWorldTheme(msg.worldTheme);
        const nextQuestions = sanitizeQuestions(msg.questions);
        if (nextQuestions.length > 0) {
          room.questions = nextQuestions;
        }
        room.lastActivityAt = Date.now();
        broadcastRoomState(room);
        return;
      }

      if (type === 'room:updateProfile') {
        const meta = socketMeta.get(ws);
        if (!meta) return;
        const room = rooms.get(meta.roomCode);
        const member = room?.members.get(meta.playerId);
        if (!room || !member) return;
        if (typeof msg.hatStyle === 'string') {
          member.hatStyle = normalizeHatStyle(msg.hatStyle);
        }
        room.lastActivityAt = Date.now();
        broadcastRoomState(room);
        return;
      }

      if (type === 'room:start') {
        const meta = socketMeta.get(ws);
        if (!meta) return;
        const room = rooms.get(meta.roomCode);
        const member = room?.members.get(meta.playerId);
        if (!room || !member?.isHost) return;

        if (room.members.size < 2) {
          sendJson(ws, {
            type: 'room:error',
            message: 'Minimal 2 perangkat harus bergabung sebelum balapan dimulai.',
          });
          return;
        }
        const startDeck = sanitizeQuestions(msg.deck);
        const finalDeck = startDeck.length > 0 ? startDeck : room.questions;
        room.questions = finalDeck;
        room.status = 'playing';
        room.lastActivityAt = Date.now();

        const membersList = serializeMembers(room);
        for (const m of room.members.values()) {
          sendJson(m.ws, {
            type: 'race:started',
            code: room.code,
            subject: room.subject,
            grade: room.grade,
            pace: room.pace,
            worldTheme: room.worldTheme,
            deck: finalDeck,
            members: membersList,
            myPlayerId: m.id,
            startedAt: Date.now(),
          });
        }
        return;
      }

      if (type === 'player:state') {
        const meta = socketMeta.get(ws);
        if (!meta) return;
        const room = rooms.get(meta.roomCode);
        if (!room) return;
        const sender = room.members.get(meta.playerId);
        if (!sender) return;
        room.lastActivityAt = Date.now();

        const state = msg.state && typeof msg.state === 'object' ? msg.state : null;
        if (!state) return;

        const outbound = {
          type: 'peer:state',
          state: {
            ...(state as Record<string, unknown>),
            playerId: sender.id,
            name: sender.name,
            colorIndex: sender.colorIndex,
            hatStyle: sender.hatStyle,
          },
        };
        for (const other of room.members.values()) {
          if (other.id !== sender.id) {
            sendJson(other.ws, outbound);
          }
        }
        return;
      }

      if (type === 'room:leave') {
        leaveCurrentRoom(ws);
      }
    });

    ws.on('close', () => {
      leaveCurrentRoom(ws);
    });
  });

  // Periodic cleanup of stale rooms (> 30 min idle)
  setInterval(() => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [code, room] of rooms.entries()) {
      if (room.lastActivityAt < cutoff) {
        rooms.delete(code);
      }
    }
  }, 5 * 60 * 1000).unref();

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT || 3000);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Lari Pintar 3D server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
