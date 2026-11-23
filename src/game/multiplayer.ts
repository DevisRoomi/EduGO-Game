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

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private callbacks: MultiplayerCallbacks = {};
  private pendingMessages: string[] = [];

  public setCallbacks(callbacks: MultiplayerCallbacks): void {
    this.callbacks = callbacks;
  }

  public connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultUrl = `${protocol}//${window.location.host}/ws`;
    const envWsUrl = (import.meta.env.VITE_WS_URL as string | undefined)?.trim();
    const url = envWsUrl || defaultUrl;
    const socket = new WebSocket(url);
    this.ws = socket;

    socket.onopen = () => {
      this.callbacks.onConnectionChange?.(true);
      while (this.pendingMessages.length > 0 && socket.readyState === WebSocket.OPEN) {
        const next = this.pendingMessages.shift();
        if (next) socket.send(next);
      }
    };

    socket.onclose = () => {
      this.callbacks.onConnectionChange?.(false);
      if (this.ws === socket) {
        this.ws = null;
      }
    };

    socket.onerror = () => {
      this.callbacks.onRoomError?.('Koneksi ke server multiplayer terganggu. Coba lagi sebentar.');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data));
        if (data.type === 'room:state') {
          this.callbacks.onRoomState?.(data.room);
        } else if (data.type === 'room:error') {
          this.callbacks.onRoomError?.(data.message);
        } else if (data.type === 'player:left') {
          this.callbacks.onPlayerLeft?.(data.playerId, data.name);
        } else if (data.type === 'race:started') {
          this.callbacks.onRaceStarted?.({
            code: data.code,
            subject: data.subject,
            grade: data.grade || 'kelas4',
            pace: data.pace || 'normal',
            worldTheme: data.worldTheme || 'taman',
            deck: data.deck,
            members: data.members || [],
            myPlayerId: data.myPlayerId,
          });
        } else if (data.type === 'peer:state' && data.state) {
          this.callbacks.onPeerState?.(data.state);
        }
      } catch {
        // Ignore malformed socket frames
      }
    };
  }

  private send(payload: unknown): void {
    const serialized = JSON.stringify(payload);
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.pendingMessages.push(serialized);
      this.connect();
      return;
    }
    if (this.ws.readyState === WebSocket.CONNECTING) {
      this.pendingMessages.push(serialized);
      return;
    }
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(serialized);
    }
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
    this.send({ type: 'room:create', playerName, subject, grade, pace, worldTheme, hatStyle, questions });
  }

  public joinRoom(code: string, playerName: string, hatStyle: HatStyle): void {
    this.send({ type: 'room:join', code: code.trim().toUpperCase(), playerName, hatStyle });
  }

  public updateConfig(
    subject: SubjectId,
    grade: GradeLevel,
    pace: PaceLevel,
    worldTheme: WorldTheme,
    questions: Question[],
  ): void {
    this.send({ type: 'room:updateConfig', subject, grade, pace, worldTheme, questions });
  }

  public updateProfile(hatStyle: HatStyle): void {
    this.send({ type: 'room:updateProfile', hatStyle });
  }

  public startRace(deck: Question[]): void {
    this.send({ type: 'room:start', deck });
  }

  public sendPlayerState(state: RemotePlayerState): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'player:state', state }));
    }
  }

  public leaveRoom(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'room:leave' }));
    }
  }

  public disconnect(): void {
    this.leaveRoom();
    this.pendingMessages = [];
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
