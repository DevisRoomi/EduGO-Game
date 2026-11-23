import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRaceDeck,
  computeBotTargetLane,
  computeCameraFraming,
  computeEffectiveSpeed,
  determineRaceWinner,
  evaluateGateAnswer,
  evaluateObstacleEncounter,
  exportRaceReportToCsv,
  getFinishLineZ,
  getLaneWorldX,
  PACE_CONFIGS,
  selectNeighborRivals,
  TRACK_CONFIG,
} from './rules';
import { getQuestionPool, GRADED_QUESTIONS } from './questions';
import type { PlayerStats, Question, RemotePlayerState } from './types';

test('evaluateGateAnswer rewards correct choice with streak bonus, boost, and 2x Fever at streak 3+', () => {
  const first = evaluateGateAnswer(1, 1, 0);
  assert.equal(first.correct, true);
  assert.equal(first.pointsDelta, 100);
  assert.equal(first.nextStreak, 1);
  assert.equal(first.feverActive, false);
  assert.equal(first.boostTimer, TRACK_CONFIG.boostDurationSec);

  const third = evaluateGateAnswer(2, 2, 2);
  assert.equal(third.correct, true);
  assert.equal(third.nextStreak, 3);
  assert.equal(third.feverActive, true);
  // (100 + 2*25) * 2 = 300 in Fever Mode!
  assert.equal(third.pointsDelta, 300);
});

test('evaluateGateAnswer resets streak on wrong choice unless Shield absorbs the stumble', () => {
  const wrongNoShield = evaluateGateAnswer(0, 2, 3, false);
  assert.equal(wrongNoShield.correct, false);
  assert.equal(wrongNoShield.pointsDelta, 0);
  assert.equal(wrongNoShield.nextStreak, 0);
  assert.equal(wrongNoShield.stumbleTimer, TRACK_CONFIG.stumbleDurationSec);
  assert.equal(wrongNoShield.shieldConsumed, false);

  const wrongWithShield = evaluateGateAnswer(0, 2, 3, true);
  assert.equal(wrongWithShield.correct, false);
  assert.equal(wrongWithShield.stumbleTimer, 0);
  assert.equal(wrongWithShield.nextStreak, 3);
  assert.equal(wrongWithShield.shieldConsumed, true);
});

test('evaluateObstacleEncounter rewards clean jump clearance, blocks with Shield, and penalizes unshielded hit', () => {
  const cleared = evaluateObstacleEncounter(1, 1.3, 1, 'hurdle');
  assert.equal(cleared.hit, false);
  assert.equal(cleared.clearedBonus, 20);
  assert.equal(cleared.stumbleTimer, 0);

  const shielded = evaluateObstacleEncounter(1, 0.1, 1, 'hurdle', true);
  assert.equal(shielded.hit, false);
  assert.equal(shielded.shieldConsumed, true);
  assert.equal(shielded.stumbleTimer, 0);

  const hit = evaluateObstacleEncounter(1, 0.2, 1, 'hurdle', false);
  assert.equal(hit.hit, true);
  assert.equal(hit.clearedBonus, 0);
  assert.equal(hit.stumbleTimer, TRACK_CONFIG.obstacleStumbleDurationSec);

  const otherLane = evaluateObstacleEncounter(0, 0, 2, 'cone');
  assert.equal(otherLane.hit, false);
  assert.equal(otherLane.clearedBonus, 0);
});

test('computeEffectiveSpeed ramps with gate progress and respects boost, Fever, and stumble', () => {
  const normal0 = computeEffectiveSpeed(10.6, 0, 0, 0, false);
  const normal5 = computeEffectiveSpeed(10.6, 0, 0, 5, false);
  assert.ok(normal5 > normal0);

  const boosted = computeEffectiveSpeed(10.6, 1.5, 0, 2, false);
  const feverBoosted = computeEffectiveSpeed(10.6, 1.5, 0, 2, true);
  const stumbled = computeEffectiveSpeed(10.6, 0, 0.8, 2, false);
  assert.ok(feverBoosted > boosted);
  assert.ok(boosted > normal0);
  assert.ok(stumbled < normal0);
});

test('buildRaceDeck populates exact count even from smaller custom pools', () => {
  const tinyPool: Question[] = [
    { id: 'a', subject: 'Custom', prompt: 'Q1', options: ['1', '2', '3'], correctIndex: 0 },
    { id: 'b', subject: 'Custom', prompt: 'Q2', options: ['4', '5', '6'], correctIndex: 1 },
  ];
  const deck = buildRaceDeck(tinyPool, 10, () => 0.42);
  assert.equal(deck.length, 10);
});

test('determineRaceWinner resolves higher score, tie-breakers, and true draws', () => {
  assert.equal(
    determineRaceWinner(
      { score: 520, correctCount: 4, distance: 400, finishTime: 50 },
      { score: 480, correctCount: 4, distance: 410, finishTime: 48 },
    ),
    'p1',
  );
  assert.equal(
    determineRaceWinner(
      { score: 500, correctCount: 3, distance: 400, finishTime: 50 },
      { score: 500, correctCount: 4, distance: 400, finishTime: 50 },
    ),
    'p2',
  );
  assert.equal(
    determineRaceWinner(
      { score: 500, correctCount: 4, distance: 400, finishTime: 50 },
      { score: 500, correctCount: 4, distance: 400, finishTime: 50 },
    ),
    'draw',
  );
});

test('computeBotTargetLane chooses correct lane when rng < accuracy and wrong otherwise', () => {
  assert.equal(computeBotTargetLane(2, 0.75, () => 0.2), 2);
  const wrongChoice = computeBotTargetLane(2, 0.75, () => 0.95);
  assert.notEqual(wrongChoice, 2);
  assert.ok(wrongChoice === 0 || wrongChoice === 1);
});

test('screen-left to screen-right layout places P1 left of P2 and lanes A, B, C left-to-right', () => {
  assert.ok(TRACK_CONFIG.p1TrackCenterX > TRACK_CONFIG.p2TrackCenterX);
  const laneA = getLaneWorldX(1, 0);
  const laneB = getLaneWorldX(1, 1);
  const laneC = getLaneWorldX(1, 2);
  assert.ok(laneA > laneB && laneB > laneC);
});

test('pace presets give progressively slower speed and longer track from cepat to santai', () => {
  assert.ok(PACE_CONFIGS.santai.baseSpeed < PACE_CONFIGS.normal.baseSpeed);
  assert.ok(PACE_CONFIGS.normal.baseSpeed < PACE_CONFIGS.cepat.baseSpeed);
  assert.ok(getFinishLineZ('santai') > getFinishLineZ('normal'));
  assert.ok(getFinishLineZ('normal') > getFinishLineZ('cepat'));
});

test('graded question banks cover Kelas 1, 2, 3, 4, and 5-6 across all subjects', () => {
  const grades = ['kelas1', 'kelas2', 'kelas3', 'kelas4', 'kelas56'] as const;
  for (const g of grades) {
    assert.ok(GRADED_QUESTIONS[g].matematika.length >= 10);
    assert.ok(GRADED_QUESTIONS[g].ipas.length >= 10);
    assert.ok(GRADED_QUESTIONS[g].bahasa.length >= 10);
    const mixed = getQuestionPool('campuran', [], g);
    assert.ok(mixed.length >= 30);
  }
});

test('selectNeighborRivals picks the two closest rivals for left and right tracks in 5-player rooms', () => {
  const makeRemote = (playerId: string, z: number, score: number): RemotePlayerState => ({
    playerId,
    name: playerId,
    colorIndex: 1,
    hatStyle: 'sport',
    z,
    lane: 1,
    y: 0,
    speed: 10,
    score,
    streak: 0,
    bestStreak: 0,
    correctCount: 0,
    wrongCount: 0,
    obstaclesCleared: 0,
    starsCollected: 0,
    boostActive: false,
    stumbleActive: false,
    hasShield: false,
    magnetActive: false,
    feverActive: false,
    finished: false,
    finishTime: null,
  });

  const remotes = [
    makeRemote('far-ahead', 280, 600),
    makeRemote('close-ahead', 112, 320),
    makeRemote('close-behind', 94, 290),
    makeRemote('far-behind', 20, 100),
  ];

  const picked = selectNeighborRivals(100, 'me', remotes);
  assert.equal(picked.left?.playerId, 'close-ahead');
  assert.equal(picked.right?.playerId, 'close-behind');
});

test('exportRaceReportToCsv outputs UTF-8 BOM, headers, accuracy, and neutralizes formula cells', () => {
  const sample: PlayerStats[] = [
    {
      id: 'p1',
      name: '=HYPERLINK("bad")',
      colorIndex: 0,
      hatStyle: 'astronaut',
      score: 640,
      streak: 3,
      bestStreak: 4,
      correctCount: 4,
      wrongCount: 1,
      obstaclesCleared: 3,
      starsCollected: 5,
      distance: 480,
      progress: 1,
      speed: 38,
      boostActive: false,
      stumbleActive: false,
      hasShield: false,
      magnetActive: false,
      feverActive: true,
      finished: true,
      finishTime: 42,
    },
  ];
  const csv = exportRaceReportToCsv(sample, {
    gradeLabel: 'Kelas 4 SD',
    subjectLabel: 'Campuran',
    worldLabel: 'Pantai Tropis',
    dateIso: '2026-11-21',
  });
  assert.ok(csv.startsWith('\uFEFFPeringkat,Nama Siswa'));
  assert.ok(csv.includes(`"'=HYPERLINK(""bad"")"`));
  assert.ok(csv.includes(',80,')); // 4/5 = 80% accuracy
  assert.ok(csv.includes('Pantai Tropis'));
});

test('computeCameraFraming locks onto player track on portrait phones and widens FOV for readability', () => {
  const portraitLocal = computeCameraFraming(390 / 844, 'local2p', TRACK_CONFIG.p1TrackCenterX, false, false);
  assert.equal(portraitLocal.isPortrait, true);
  assert.equal(portraitLocal.focusX, TRACK_CONFIG.p1TrackCenterX);
  assert.ok(portraitLocal.fov >= 68 && portraitLocal.fov <= 76);

  const portraitMulti = computeCameraFraming(390 / 844, 'onlineMulti', 0, false, true);
  assert.equal(portraitMulti.isPortrait, true);
  assert.equal(portraitMulti.focusX, 0);
  assert.ok(portraitMulti.fov > portraitLocal.fov);

  const desktopLocal = computeCameraFraming(1440 / 900, 'local2p', TRACK_CONFIG.p1TrackCenterX, false, false);
  assert.equal(desktopLocal.isPortrait, false);
  assert.equal(desktopLocal.focusX, 0);
  assert.equal(desktopLocal.fov, 56);
});

