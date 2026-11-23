import { useCallback, useEffect, useRef, useState } from 'react';
import { RaceEngine } from './game/RaceEngine';
import { MultiplayerClient } from './game/multiplayer';
import {
  GRADE_META,
  SUBJECT_META,
  getQuestionPool,
  loadCustomQuestions,
  saveCustomQuestions,
} from './game/questions';
import { buildRaceDeck, PACE_CONFIGS, TRACK_CONFIG, WORLD_META } from './game/rules';
import { soundEngine } from './game/sound';
import type {
  GameMode,
  GradeLevel,
  HatStyle,
  HudSnapshot,
  PaceLevel,
  PlayerStats,
  Question,
  RoomStatePayload,
  SubjectId,
  WorldTheme,
} from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { GameHud } from './components/GameHud';
import { TeacherStudioModal } from './components/TeacherStudioModal';
import { PauseModal } from './components/PauseModal';
import { WinnerModal } from './components/WinnerModal';

const INITIAL_STATS = (id: string, name: string, colorIndex: number): PlayerStats => ({
  id,
  name,
  colorIndex,
  hatStyle: 'sport',
  score: 0,
  streak: 0,
  bestStreak: 0,
  correctCount: 0,
  wrongCount: 0,
  obstaclesCleared: 0,
  starsCollected: 0,
  distance: 0,
  progress: 0,
  speed: 0,
  boostActive: false,
  stumbleActive: false,
  hasShield: false,
  magnetActive: false,
  feverActive: false,
  finished: false,
  finishTime: null,
});

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  countdownValue: 3,
  timeRemaining: PACE_CONFIGS.normal.roundDurationSec,
  p1: INITIAL_STATS('p1', 'Raka', 0),
  p2: INITIAL_STATS('p2', 'Siti', 1),
  p1Lane: 1,
  p2Lane: 1,
  standings: [INITIAL_STATS('p1', 'Raka', 0), INITIAL_STATS('p2', 'Siti', 1)],
  localPlayerId: 'p1',
  leftRivalName: null,
  rightRivalName: null,
  activeQuestion: null,
  p1Feedback: null,
  p2Feedback: null,
  winner: null,
  winnerName: null,
  answerHistory: [],
};

function parseValidGrade(raw: string | null): GradeLevel {
  if (
    raw === 'kelas1' ||
    raw === 'kelas2' ||
    raw === 'kelas3' ||
    raw === 'kelas4' ||
    raw === 'kelas56'
  ) {
    return raw;
  }
  return 'kelas4';
}

function parseValidPace(raw: string | null): PaceLevel {
  if (raw === 'santai' || raw === 'normal' || raw === 'cepat') {
    return raw;
  }
  return 'normal';
}

function parseValidWorld(raw: string | null): WorldTheme {
  if (raw === 'taman' || raw === 'pantai' || raw === 'salju' || raw === 'angkasa') {
    return raw;
  }
  return 'taman';
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RaceEngine | null>(null);
  const mpRef = useRef<MultiplayerClient | null>(null);

  const [grade, setGrade] = useState<GradeLevel>(() => {
    const params = new URLSearchParams(window.location.search);
    return parseValidGrade(params.get('grade'));
  });
  const [pace, setPace] = useState<PaceLevel>(() => {
    const params = new URLSearchParams(window.location.search);
    return parseValidPace(params.get('pace'));
  });
  const [worldTheme, setWorldTheme] = useState<WorldTheme>(() => {
    const params = new URLSearchParams(window.location.search);
    return parseValidWorld(params.get('world'));
  });
  const [subject, setSubject] = useState<SubjectId>('campuran');
  const [mode, setMode] = useState<GameMode>(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'local2p' || modeParam === 'soloBot' || modeParam === 'onlineMulti') {
      return modeParam;
    }
    if ((params.get('room') || '').trim().length >= 3) {
      return 'onlineMulti';
    }
    // On narrow touch phones, default to 1P vs Bot so controls & single-track view shine immediately
    return window.innerWidth < 768 ? 'soloBot' : 'local2p';
  });
  const [p1Name, setP1Name] = useState('Raka');
  const [p2Name, setP2Name] = useState('Siti');
  const [p1Hat, setP1Hat] = useState<HatStyle>('sport');
  const [p2Hat, setP2Hat] = useState<HatStyle>('bunny');
  const [customQuestions, setCustomQuestions] = useState<Question[]>(() => loadCustomQuestions());
  const [showTeacherStudio, setShowTeacherStudio] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(() => soundEngine.isSfxMuted());
  const [bgmMuted, setBgmMuted] = useState(() => soundEngine.isBgmMuted());
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);

  // Multi-device WebSocket room state (2..8 players)
  const [wsConnected, setWsConnected] = useState(false);
  const [room, setRoom] = useState<RoomStatePayload | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [initialJoinCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('room') || '').toUpperCase().slice(0, 6);
  });
  const [durationOverrideSec] = useState<number | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = Number(params.get('duration'));
    if (Number.isFinite(raw) && raw >= 2 && raw <= 300) {
      return raw;
    }
    return undefined;
  });

  // Keep latest config in refs for stable keyboard & engine callbacks
  const configRef = useRef({
    grade,
    pace,
    worldTheme,
    subject,
    mode,
    p1Name,
    p2Name,
    p1Hat,
    p2Hat,
    customQuestions,
    showTeacherStudio,
    room,
    phase: hud.phase,
    durationOverrideSec,
  });
  configRef.current = {
    grade,
    pace,
    worldTheme,
    subject,
    mode,
    p1Name,
    p2Name,
    p1Hat,
    p2Hat,
    customQuestions,
    showTeacherStudio,
    room,
    phase: hud.phase,
    durationOverrideSec,
  };

  // Switch to multi-device mode automatically if URL contains ?room=CODE
  useEffect(() => {
    if (initialJoinCode.length >= 3) {
      setMode('onlineMulti');
    }
  }, [initialJoinCode]);

  // Live 3D World & Runner Hat previews whenever changed on Title Screen
  useEffect(() => {
    engineRef.current?.setWorldTheme(worldTheme);
  }, [worldTheme]);

  useEffect(() => {
    engineRef.current?.setPreviewHats(p1Hat, p2Hat);
  }, [p1Hat, p2Hat]);

  const startLocalRace = useCallback((skipCountdown = false) => {
    const cfg = configRef.current;
    const engine = engineRef.current;
    if (!engine) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const pool = getQuestionPool(cfg.subject, cfg.customQuestions, cfg.grade);
    const deck = buildRaceDeck(pool, TRACK_CONFIG.gateCount);
    engine.startRace({
      mode: cfg.mode === 'onlineMulti' ? 'local2p' : cfg.mode,
      pace: cfg.pace,
      worldTheme: cfg.worldTheme,
      p1Name: cfg.p1Name.trim() || 'Pemain 1',
      p2Name: cfg.mode === 'soloBot' ? 'Bot Bima' : cfg.p2Name.trim() || 'Pemain 2',
      p1Hat: cfg.p1Hat,
      p2Hat: cfg.p2Hat,
      deck,
      skipCountdown,
      durationOverrideSec: cfg.durationOverrideSec,
    });
  }, []);

  // Mount Three.js RaceEngine ONCE in isolated sibling ref container
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const mp = new MultiplayerClient();
    mpRef.current = mp;

    const engine = new RaceEngine(mount, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onLocalPlayerSync: (state) => {
        mp.sendPlayerState(state);
      },
    });
    engineRef.current = engine;

    // Apply initial query-param world and preview hats
    engine.setWorldTheme(configRef.current.worldTheme);
    engine.setPreviewHats(configRef.current.p1Hat, configRef.current.p2Hat);

    mp.setCallbacks({
      onConnectionChange: (connected) => setWsConnected(connected),
      onRoomState: (nextRoom) => {
        setRoom(nextRoom);
        setRoomError(null);
        // Sync host's chosen grade, pace, worldTheme, and subject to guests
        if (!nextRoom.isHost) {
          setSubject(nextRoom.subject);
          setGrade(nextRoom.grade);
          setPace(nextRoom.pace);
          if (nextRoom.worldTheme) {
            setWorldTheme(nextRoom.worldTheme);
          }
        }
      },
      onRoomError: (message) => setRoomError(message),
      onPlayerLeft: (playerId, name) => {
        engine.removePeer(playerId);
        if (configRef.current.phase === 'title') {
          setRoomError(`${name} keluar dari ruang.`);
        }
      },
      onRaceStarted: ({
        pace: racePace,
        grade: raceGrade,
        subject: raceSubject,
        worldTheme: raceWorld,
        deck,
        members,
        myPlayerId,
      }) => {
        setRoomError(null);
        setMode('onlineMulti');
        setPace(racePace);
        setGrade(raceGrade);
        setSubject(raceSubject);
        setWorldTheme(raceWorld);
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        const me = members.find((m) => m.id === myPlayerId);
        const firstOther = members.find((m) => m.id !== myPlayerId);
        engine.startRace({
          mode: 'onlineMulti',
          pace: racePace,
          worldTheme: raceWorld,
          p1Name: me?.name || configRef.current.p1Name || 'Kamu',
          p2Name: firstOther?.name || 'Lawan',
          p1Hat: me?.hatStyle || configRef.current.p1Hat,
          deck,
          localPlayerId: myPlayerId,
          members,
          skipCountdown: false,
          durationOverrideSec: configRef.current.durationOverrideSec,
        });
      },
      onPeerState: (state) => {
        engine.applyPeerState(state);
      },
    });

    // Support ?autostart=1 for instant play / verification
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const startGrade = parseValidGrade(params.get('grade'));
      const startPace = parseValidPace(params.get('pace'));
      const startWorld = parseValidWorld(params.get('world'));
      const rawDur = Number(params.get('duration'));
      const durOverride = Number.isFinite(rawDur) && rawDur >= 2 && rawDur <= 300 ? rawDur : undefined;
      const pool = getQuestionPool('campuran', loadCustomQuestions(), startGrade);
      const deck = buildRaceDeck(pool, TRACK_CONFIG.gateCount);
      engine.startRace({
        mode: 'local2p',
        pace: startPace,
        worldTheme: startWorld,
        p1Name: 'Raka',
        p2Name: 'Siti',
        p1Hat: configRef.current.p1Hat,
        p2Hat: configRef.current.p2Hat,
        deck,
        skipCountdown: true,
        durationOverrideSec: durOverride,
      });
    }

    return () => {
      mp.disconnect();
      engine.dispose();
      engineRef.current = null;
      mpRef.current = null;
    };
  }, []);

  // Global keyboard shortcuts: Enter/Space on title to start, P/Esc to pause/resume, M to mute
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      const cfg = configRef.current;
      if (cfg.showTeacherStudio) {
        if (e.code === 'Escape') setShowTeacherStudio(false);
        return;
      }

      if (e.code === 'KeyM') {
        const nextAll = !(soundEngine.isSfxMuted() && soundEngine.isBgmMuted());
        soundEngine.setMuted(nextAll);
        setSfxMuted(nextAll);
        setBgmMuted(nextAll);
        return;
      }

      if (cfg.phase === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        if (cfg.mode !== 'onlineMulti') {
          e.preventDefault();
          startLocalRace(false);
        }
        return;
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (cfg.phase === 'playing') {
          e.preventDefault();
          engineRef.current?.setPaused(true);
        } else if (cfg.phase === 'paused') {
          e.preventDefault();
          engineRef.current?.setPaused(false);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [startLocalRace]);

  const handleToggleSfx = useCallback(() => {
    setSfxMuted((prev) => {
      const next = !prev;
      soundEngine.setSfxMuted(next);
      return next;
    });
  }, []);

  const handleToggleBgm = useCallback(() => {
    setBgmMuted((prev) => {
      const next = !prev;
      soundEngine.setBgmMuted(next);
      return next;
    });
  }, []);

  const syncHostRoomConfig = useCallback(
    (
      nextSubject: SubjectId,
      nextGrade: GradeLevel,
      nextPace: PaceLevel,
      nextWorld: WorldTheme,
      nextCustom: Question[],
    ) => {
      if (configRef.current.room?.isHost) {
        const pool = getQuestionPool(nextSubject, nextCustom, nextGrade);
        mpRef.current?.updateConfig(nextSubject, nextGrade, nextPace, nextWorld, pool);
      }
    },
    [],
  );

  const handleSaveCustomQuestions = useCallback(
    (next: Question[]) => {
      setCustomQuestions(next);
      saveCustomQuestions(next);
      const cfg = configRef.current;
      if (cfg.subject === 'custom') {
        syncHostRoomConfig('custom', cfg.grade, cfg.pace, cfg.worldTheme, next);
      }
    },
    [syncHostRoomConfig],
  );

  const handleSelectGrade = useCallback(
    (nextGrade: GradeLevel) => {
      setGrade(nextGrade);
      const recommended = GRADE_META[nextGrade].recommendedPace;
      setPace(recommended);
      syncHostRoomConfig(
        configRef.current.subject,
        nextGrade,
        recommended,
        configRef.current.worldTheme,
        configRef.current.customQuestions,
      );
    },
    [syncHostRoomConfig],
  );

  const handleSelectPace = useCallback(
    (nextPace: PaceLevel) => {
      setPace(nextPace);
      syncHostRoomConfig(
        configRef.current.subject,
        configRef.current.grade,
        nextPace,
        configRef.current.worldTheme,
        configRef.current.customQuestions,
      );
    },
    [syncHostRoomConfig],
  );

  const handleSelectWorld = useCallback(
    (nextWorld: WorldTheme) => {
      setWorldTheme(nextWorld);
      syncHostRoomConfig(
        configRef.current.subject,
        configRef.current.grade,
        configRef.current.pace,
        nextWorld,
        configRef.current.customQuestions,
      );
    },
    [syncHostRoomConfig],
  );

  const handleSelectSubject = useCallback(
    (nextSubject: SubjectId) => {
      setSubject(nextSubject);
      syncHostRoomConfig(
        nextSubject,
        configRef.current.grade,
        configRef.current.pace,
        configRef.current.worldTheme,
        configRef.current.customQuestions,
      );
    },
    [syncHostRoomConfig],
  );

  const handleSelectP1Hat = useCallback((nextHat: HatStyle) => {
    setP1Hat(nextHat);
    if (configRef.current.room) {
      mpRef.current?.updateProfile(nextHat);
    }
  }, []);

  const handleCreateRoom = useCallback(() => {
    setRoomError(null);
    const pool = getQuestionPool(subject, customQuestions, grade);
    mpRef.current?.createRoom(
      p1Name.trim() || 'Pemain 1',
      subject,
      grade,
      pace,
      worldTheme,
      p1Hat,
      pool,
    );
  }, [subject, customQuestions, grade, pace, worldTheme, p1Hat, p1Name]);

  const handleJoinRoom = useCallback(
    (code: string) => {
      if (code.trim().length < 3) {
        setRoomError('Masukkan kode ruang 4 huruf dari temanmu.');
        return;
      }
      setRoomError(null);
      mpRef.current?.joinRoom(code, p1Name.trim() || 'Pelari', p1Hat);
    },
    [p1Name, p1Hat],
  );

  const handleLeaveRoom = useCallback(() => {
    mpRef.current?.leaveRoom();
    setRoom(null);
    setRoomError(null);
  }, []);

  const handleStartRoomRace = useCallback(() => {
    const pool = getQuestionPool(subject, customQuestions, grade);
    const deck = buildRaceDeck(pool, TRACK_CONFIG.gateCount);
    mpRef.current?.startRace(deck);
  }, [subject, customQuestions, grade]);

  const handlePlayAgain = useCallback(() => {
    if (mode === 'onlineMulti' && room) {
      if (room.isHost) {
        handleStartRoomRace();
      } else {
        engineRef.current?.returnToTitle();
      }
    } else {
      startLocalRace(false);
    }
  }, [mode, room, handleStartRoomRace, startLocalRace]);

  const handleReturnToTitle = useCallback(() => {
    engineRef.current?.returnToTitle();
  }, []);

  return (
    <main
      className="relative h-dvh w-screen overflow-hidden"
      style={{ backgroundColor: WORLD_META[worldTheme].skyBgHex }}
    >
      {/* Isolated Full-Bleed Three.js Canvas Mount */}
      <div
        ref={canvasMountRef}
        className="fixed inset-0 z-0 h-full w-full"
        aria-label="Arena Balapan 3D Lari Pintar"
      />

      {/* Title Screen */}
      {hud.phase === 'title' && (
        <TitleScreen
          grade={grade}
          onSelectGrade={handleSelectGrade}
          pace={pace}
          onSelectPace={handleSelectPace}
          worldTheme={worldTheme}
          onSelectWorld={handleSelectWorld}
          subject={subject}
          onSelectSubject={handleSelectSubject}
          mode={mode}
          onSelectMode={setMode}
          p1Name={p1Name}
          p2Name={p2Name}
          onChangeP1Name={setP1Name}
          onChangeP2Name={setP2Name}
          p1Hat={p1Hat}
          p2Hat={p2Hat}
          onSelectP1Hat={handleSelectP1Hat}
          onSelectP2Hat={setP2Hat}
          customCount={customQuestions.length}
          sfxMuted={sfxMuted}
          bgmMuted={bgmMuted}
          onToggleSfx={handleToggleSfx}
          onToggleBgm={handleToggleBgm}
          onStartLocal={() => startLocalRace(false)}
          onOpenTeacherStudio={() => setShowTeacherStudio(true)}
          room={room}
          roomError={roomError}
          wsConnected={wsConnected}
          initialJoinCode={initialJoinCode}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={handleLeaveRoom}
          onStartRoomRace={handleStartRoomRace}
        />
      )}

      {/* Active Gameplay HUD */}
      {(hud.phase === 'countdown' || hud.phase === 'playing') && (
        <GameHud
          hud={hud}
          mode={mode}
          sfxMuted={sfxMuted}
          bgmMuted={bgmMuted}
          onToggleSfx={handleToggleSfx}
          onToggleBgm={handleToggleBgm}
          onPause={() => engineRef.current?.setPaused(true)}
          onTouchMove={(slot, dir) => engineRef.current?.triggerLaneMove(slot, dir)}
          onSelectLane={(slot, lane) => engineRef.current?.setRunnerLane(slot, lane)}
          onTouchJump={(slot) => engineRef.current?.triggerJump(slot)}
        />
      )}

      {/* Pause Modal */}
      {hud.phase === 'paused' && (
        <PauseModal
          onResume={() => engineRef.current?.setPaused(false)}
          onRestart={() => startLocalRace(false)}
          onMainMenu={handleReturnToTitle}
        />
      )}

      {/* Winner / Victory Modal */}
      {hud.phase === 'gameover' && (
        <WinnerModal
          hud={hud}
          gradeLabel={GRADE_META[grade].label}
          subjectLabel={SUBJECT_META[subject].label}
          worldLabel={WORLD_META[worldTheme].label}
          onPlayAgain={handlePlayAgain}
          onMainMenu={handleReturnToTitle}
        />
      )}

      {/* Teacher Custom Question Studio Modal */}
      {showTeacherStudio && (
        <TeacherStudioModal
          questions={customQuestions}
          defaultGrade={grade}
          onSaveQuestions={handleSaveCustomQuestions}
          onUseCustomSubject={() => handleSelectSubject('custom')}
          onClose={() => setShowTeacherStudio(false)}
        />
      )}
    </main>
  );
}
