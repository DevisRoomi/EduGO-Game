import { Peer, type DataConnection } from 'peerjs';
import type {
  GradeLevel,
  HatStyle,
  PaceLevel,
  Question,
  RemotePlayerState,
  RoomMemberInfo,
  RoomStatePayload,
  SubjectId,
  WorldTheme,
} from './types';

export interface MultiplayerCallbacks {
  onConnectionChange?: (connected: boolean) => void;
  onRoomState?: (room: RoomStatePayload) => void;
  onRoomError?: (message: string) => void;
  onPlayerLeft?: (playerId: string, name: string) => void;
  onRaceStarted?: (payload: {
    code: string;
    subject: SubjectId;
    grade: GradeLevel;
    pace: PaceLevel;
    worldTheme: WorldTheme;
    deck: Question[];
    members: RoomMemberInfo[];
    myPlayerId: string;
  }) => void;
  onPeerState?: (state: RemotePlayerState) => void;
}

const PEER_CONFIG = {
  debug: 0,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  },
};

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface GuestRecord {
  conn: DataConnection;
  member: RoomMemberInfo;
}

export class MultiplayerClient {
  private peer: Peer | null = null;
  private callbacks: MultiplayerCallbacks = {};
  private isHost = false;
  private roomCode = '';
  private myPlayerId = '';

  // Host state
  private hostMember: RoomMemberInfo | null = null;
  private guests: Map<string, GuestRecord> = new Map();
  private subject: SubjectId = 'campuran';
  private grade: GradeLevel = 'kelas4';
  private pace: PaceLevel = 'normal';
  private worldTheme: WorldTheme = 'taman';
  private questions: Question[] = [];
  private status: 'waiting' | 'ready' | 'playing' | 'finished' = 'waiting';

  // Guest state
  private hostConn: DataConnection | null = null;

  public setCallbacks(callbacks: MultiplayerCallbacks): void {
    this.callbacks = callbacks;
  }

  public connect(): void {
    // WebRTC connects on room creation or join
  }

  public createRoom(
    playerName: string,
    subject: SubjectId,
    grade: GradeLevel,
    pace: PaceLevel,
    worldTheme: WorldTheme,
    hatStyle: HatStyle,
    questions: Question[],
  ): void {
    this.disconnect();

    this.isHost = true;
    this.roomCode = generateRoomCode();
    this.myPlayerId = `p-host-${Date.now().toString(36)}`;
    this.subject = subject;
    this.grade = grade;
    this.pace = pace;
    this.worldTheme = worldTheme;
    this.questions = questions;
    this.status = 'waiting';

    this.hostMember = {
      id: this.myPlayerId,
      name: playerName.trim() || 'Host',
      slot: 1,
      colorIndex: 0,
      hatStyle,
      isHost: true,
    };

    const hostPeerId = `edugo-r-${this.roomCode.toLowerCase()}`;
    const peer = new Peer(hostPeerId, PEER_CONFIG);
    this.peer = peer;

    peer.on('open', () => {
      this.callbacks.onConnectionChange?.(true);
      this.broadcastHostRoomState();
    });

    peer.on('connection', (conn) => {
      this.handleIncomingGuest(conn);
    });

    peer.on('error', (err: any) => {
      if (err?.type === 'unavailable-id') {
        // Retry with another code if collision
        this.createRoom(playerName, subject, grade, pace, worldTheme, hatStyle, questions);
        return;
      }
      this.callbacks.onRoomError?.('Gagal membuat ruang multiplayer. Periksa koneksi internet.');
    });
  }

  private handleIncomingGuest(conn: DataConnection): void {
    let guestId = '';

    conn.on('data', (raw: any) => {
      if (!raw || typeof raw !== 'object') return;

      if (raw.type === 'room:join') {
        if (this.guests.size >= 7) {
          conn.send({ type: 'room:error', message: 'Ruang balapan sudah penuh (maksimal 8 pemain).' });
          conn.close();
          return;
        }
        if (this.status === 'playing') {
          conn.send({ type: 'room:error', message: 'Balapan di ruang ini sedang berlangsung.' });
          conn.close();
          return;
        }

        guestId = `p-guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const usedSlots = new Set<number>([1]);
        for (const g of this.guests.values()) {
          usedSlots.add(g.member.slot);
        }

        let slot = 2;
        for (let s = 2; s <= 8; s++) {
          if (!usedSlots.has(s)) {
            slot = s;
            break;
          }
        }

        const colorIndex = (slot - 1) % 6;
        const member: RoomMemberInfo = {
          id: guestId,
          name: String(raw.playerName || `Pelari ${slot}`).slice(0, 24),
          slot,
          colorIndex,
          hatStyle: (raw.hatStyle as HatStyle) || 'sport',
          isHost: false,
        };

        this.guests.set(guestId, { conn, member });
        if (this.guests.size >= 1 && this.status === 'waiting') {
          this.status = 'ready';
        }

        this.broadcastHostRoomState();
        return;
      }

      if (raw.type === 'player:state' && raw.state && guestId) {
        const sender = this.guests.get(guestId);
        if (!sender) return;

        const outboundState: RemotePlayerState = {
          ...(raw.state as Record<string, any>),
          playerId: sender.member.id,
          name: sender.member.name,
          colorIndex: sender.member.colorIndex,
          hatStyle: sender.member.hatStyle,
        } as RemotePlayerState;

        // Relay to other guests
        const msg = { type: 'peer:state', state: outboundState };
        for (const [id, g] of this.guests.entries()) {
          if (id !== guestId && g.conn.open) {
            g.conn.send(msg);
          }
        }

        // Deliver to Host engine
        this.callbacks.onPeerState?.(outboundState);
        return;
      }

      if (raw.type === 'room:updateProfile' && guestId) {
        const g = this.guests.get(guestId);
        if (g && raw.hatStyle) {
          g.member.hatStyle = raw.hatStyle as HatStyle;
          this.broadcastHostRoomState();
        }
        return;
      }

      if (raw.type === 'room:leave' && guestId) {
        this.removeGuest(guestId);
      }
    });

    conn.on('close', () => {
      if (guestId) {
        this.removeGuest(guestId);
      }
    });

    conn.on('error', () => {
      if (guestId) {
        this.removeGuest(guestId);
      }
    });
  }

  private removeGuest(guestId: string): void {
    const record = this.guests.get(guestId);
    if (!record) return;

    this.guests.delete(guestId);
    if (this.guests.size === 0 && this.status === 'ready') {
      this.status = 'waiting';
    }

    this.callbacks.onPlayerLeft?.(guestId, record.member.name);
    for (const g of this.guests.values()) {
      if (g.conn.open) {
        g.conn.send({ type: 'player:left', playerId: guestId, name: record.member.name });
      }
    }
    this.broadcastHostRoomState();
  }

  private getAllMembers(): RoomMemberInfo[] {
    const list: RoomMemberInfo[] = [];
    if (this.hostMember) {
      list.push(this.hostMember);
    }
    for (const g of this.guests.values()) {
      list.push(g.member);
    }
    return list.sort((a, b) => a.slot - b.slot);
  }

  private broadcastHostRoomState(): void {
    if (!this.isHost || !this.hostMember) return;

    const members = this.getAllMembers();

    // Notify Host UI
    this.callbacks.onRoomState?.({
      code: this.roomCode,
      subject: this.subject,
      grade: this.grade,
      pace: this.pace,
      worldTheme: this.worldTheme,
      questionCount: this.questions.length,
      status: this.status,
      maxPlayers: 8,
      myPlayerId: this.myPlayerId,
      isHost: true,
      members,
    });

    // Notify all Guests
    for (const [guestId, g] of this.guests.entries()) {
      if (g.conn.open) {
        g.conn.send({
          type: 'room:state',
          room: {
            code: this.roomCode,
            subject: this.subject,
            grade: this.grade,
            pace: this.pace,
            worldTheme: this.worldTheme,
            questionCount: this.questions.length,
            status: this.status,
            maxPlayers: 8,
            myPlayerId: guestId,
            isHost: false,
            members,
          },
        });
      }
    }
  }

  public joinRoom(code: string, playerName: string, hatStyle: HatStyle): void {
    this.disconnect();

    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode.length < 3) {
      this.callbacks.onRoomError?.('Kode ruang tidak valid.');
      return;
    }

    this.isHost = false;
    this.roomCode = normalizedCode;
    const guestPeerId = `edugo-g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const peer = new Peer(guestPeerId, PEER_CONFIG);
    this.peer = peer;

    peer.on('open', () => {
      const targetHostId = `edugo-r-${normalizedCode.toLowerCase()}`;
      const conn = peer.connect(targetHostId, { reliable: true });
      this.hostConn = conn;

      conn.on('open', () => {
        this.callbacks.onConnectionChange?.(true);
        conn.send({
          type: 'room:join',
          playerName: playerName.trim() || 'Pelari',
          hatStyle,
        });
      });

      conn.on('data', (raw: any) => {
        if (!raw || typeof raw !== 'object') return;

        if (raw.type === 'room:state' && raw.room) {
          this.callbacks.onRoomState?.(raw.room);
          return;
        }

        if (raw.type === 'room:error') {
          this.callbacks.onRoomError?.(raw.message || 'Gagal bergabung ke ruang.');
          return;
        }

        if (raw.type === 'race:started') {
          this.callbacks.onRaceStarted?.({
            code: raw.code,
            subject: raw.subject,
            grade: raw.grade || 'kelas4',
            pace: raw.pace || 'normal',
            worldTheme: raw.worldTheme || 'taman',
            deck: raw.deck,
            members: raw.members || [],
            myPlayerId: raw.myPlayerId,
          });
          return;
        }

        if (raw.type === 'peer:state' && raw.state) {
          this.callbacks.onPeerState?.(raw.state);
          return;
        }

        if (raw.type === 'player:left') {
          this.callbacks.onPlayerLeft?.(raw.playerId, raw.name);
        }
      });

      conn.on('close', () => {
        this.callbacks.onConnectionChange?.(false);
        this.callbacks.onRoomError?.('Ruang balapan ditutup oleh Host.');
      });

      conn.on('error', () => {
        this.callbacks.onRoomError?.('Koneksi ke Host terputus.');
      });
    });

    peer.on('error', (err: any) => {
      if (err?.type === 'peer-unavailable') {
        this.callbacks.onRoomError?.('Ruang tidak ditemukan. Pastikan kode benar atau Host masih aktif.');
      } else {
        this.callbacks.onRoomError?.('Gagal menghubungi jaringan multiplayer.');
      }
    });
  }

  public updateConfig(
    subject: SubjectId,
    grade: GradeLevel,
    pace: PaceLevel,
    worldTheme: WorldTheme,
    questions: Question[],
  ): void {
    if (!this.isHost) return;
    this.subject = subject;
    this.grade = grade;
    this.pace = pace;
    this.worldTheme = worldTheme;
    this.questions = questions;
    this.broadcastHostRoomState();
  }

  public updateProfile(hatStyle: HatStyle): void {
    if (this.isHost && this.hostMember) {
      this.hostMember.hatStyle = hatStyle;
      this.broadcastHostRoomState();
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({ type: 'room:updateProfile', hatStyle });
    }
  }

  public startRace(deck: Question[]): void {
    if (!this.isHost || !this.hostMember) return;

    this.status = 'playing';
    const members = this.getAllMembers();

    // Broadcast race:started to all guests
    for (const [guestId, g] of this.guests.entries()) {
      if (g.conn.open) {
        g.conn.send({
          type: 'race:started',
          code: this.roomCode,
          subject: this.subject,
          grade: this.grade,
          pace: this.pace,
          worldTheme: this.worldTheme,
          deck,
          members,
          myPlayerId: guestId,
        });
      }
    }

    // Trigger on Host
    this.callbacks.onRaceStarted?.({
      code: this.roomCode,
      subject: this.subject,
      grade: this.grade,
      pace: this.pace,
      worldTheme: this.worldTheme,
      deck,
      members,
      myPlayerId: this.myPlayerId,
    });
  }

  public sendPlayerState(state: RemotePlayerState): void {
    if (this.isHost) {
      if (!this.hostMember) return;
      const outbound = {
        type: 'peer:state',
        state: {
          ...state,
          playerId: this.hostMember.id,
          name: this.hostMember.name,
          colorIndex: this.hostMember.colorIndex,
          hatStyle: this.hostMember.hatStyle,
        },
      };
      for (const g of this.guests.values()) {
        if (g.conn.open) {
          g.conn.send(outbound);
        }
      }
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({ type: 'player:state', state });
    }
  }

  public leaveRoom(): void {
    if (this.isHost) {
      for (const g of this.guests.values()) {
        if (g.conn.open) {
          g.conn.close();
        }
      }
      this.guests.clear();
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({ type: 'room:leave' });
      this.hostConn.close();
      this.hostConn = null;
    }
  }

  public disconnect(): void {
    this.leaveRoom();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.isHost = false;
    this.roomCode = '';
    this.myPlayerId = '';
    this.hostMember = null;
    this.guests.clear();
    this.hostConn = null;
    this.status = 'waiting';
  }
}
