import {
  CHAOS_QUEUE_MODE_POOL,
  DEFAULT_SETTINGS,
  GAME_ROUND_COUNT,
  GAME_RULE_MODES,
  MAX_ROUND_SCORE,
  ROOM_STATUSES,
} from "../constants.js";
import { calculateRoundResult, normalizeTotalScore } from "./scoring.js";
import { createRoundTargets } from "./targets.js";
import {
  fail,
  ok,
  validateBandLevels,
  validateLevel,
  validatePlayerId,
  validateRoundIndex,
  validateSplitLevels,
} from "../rooms/roomValidation.js";
import { createSeed } from "../utils/ids.js";
import { now } from "../utils/time.js";

function roundScore(value) {
  return normalizeTotalScore(value);
}

const ENDLESS_RULE_MODE_ID = "endless";
const CHAOS_ELIGIBLE_MODE_POOL = CHAOS_QUEUE_MODE_POOL.filter(
  (mode) => mode !== ENDLESS_RULE_MODE_ID,
);

function hashSeed(seed) {
  let hash = 2166136261;

  for (let index = 0; index < String(seed).length; index += 1) {
    hash ^= String(seed).charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed) {
  let value = hashSeed(seed) >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function createModeQueue(seed, roundCount) {
  const random = createSeededRandom(seed || "chaos-queue");
  const modes = [];

  while (modes.length < roundCount) {
    const bag = [...CHAOS_ELIGIBLE_MODE_POOL];

    for (let index = bag.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
    }

    modes.push(...bag);
  }

  return modes.slice(0, roundCount);
}

function getRoundRuleMode(game, roundIndex) {
  const ruleMode =
    game?.modeQueue?.[roundIndex] ?? game?.ruleMode ?? GAME_RULE_MODES.CLASSIC;

  return ruleMode === ENDLESS_RULE_MODE_ID ? GAME_RULE_MODES.CLASSIC : ruleMode;
}

function getActivePlayers(room) {
  return Array.from(room.players.values()).filter(
    (player) => !player.inactive && !player.kicked,
  );
}

function serializeResult(result) {
  if (!result) return null;

  return {
    diff: result.diff,
    fakeTarget: result.fakeTarget,
    label: result.label,
    level: result.level,
    round: result.round,
    roundIndex: result.roundIndex,
    ruleMode: result.ruleMode,
    score: result.score,
    tilt: result.tilt || 0,
    bandDiffs: result.bandDiffs || null,
    bandLevels: result.bandLevels || null,
    bandScores: result.bandScores || null,
    bandTargets: result.bandTargets || null,
    splitDiffs: result.splitDiffs || null,
    splitLevels: result.splitLevels || null,
    splitScores: result.splitScores || null,
    splitTargets: result.splitTargets || null,
    target: result.target,
  };
}

function serializePlayerWaterColors(room) {
  return Object.fromEntries(
    Array.from(room.players.values())
      .filter((player) => !player.kicked)
      .map((player) => [
        player.id,
        player.waterColorId || DEFAULT_SETTINGS.waterColorId,
      ]),
  );
}

export function buildGamePayload(room) {
  if (!room.game) return null;

  return {
    difficulty: room.game.difficulty,
    mode: room.game.ruleMode,
    roomCode: room.code,
    roundCount: room.game.roundCount,
    ruleMode: room.game.ruleMode,
    seed: room.game.seed,
    startedAt: room.game.startedAt,
    targets: room.game.targets,
    modeQueue: room.game.modeQueue || null,
    playerWaterColorIds:
      room.game.playerWaterColorIds || serializePlayerWaterColors(room),
    waterColorId: room.game.waterColorId,
  };
}

export function startGameForRoom(room) {
  const seed = createSeed();
  const roundCount = room.roundCount || GAME_ROUND_COUNT;
  const modeQueue =
    room.ruleMode === GAME_RULE_MODES.CHAOS_QUEUE
      ? createModeQueue(seed, roundCount)
      : null;

  room.status = ROOM_STATUSES.IN_GAME;
  room.seed = seed;
  room.game = {
    difficulty: room.difficulty,
    roundCount,
    ruleMode: room.ruleMode,
    seed,
    startedAt: now(),
    targets: createRoundTargets(seed, roundCount),
    modeQueue,
    playerWaterColorIds: serializePlayerWaterColors(room),
    waterColorId: DEFAULT_SETTINGS.waterColorId,
  };
  room.leaderboard = null;

  for (const player of room.players.values()) {
    player.inactive = false;
    player.returnedToLobby = false;
    player.results = [];
    player.score = 0;
    player.scoreboardReady = false;
    player.submitted = false;
    player.totalScore = 0;
    player.waitingForNextGame = false;
  }

  return buildGamePayload(room);
}

export function markPlayerInactiveForGame(room, playerId) {
  const player = room?.players?.get(playerId);
  if (!player || !room.game) return null;

  player.connected = false;
  player.inactive = true;
  player.lastSeenAt = now();
  room.updatedAt = now();

  return maybeFinishRoom(room);
}

export function submitRoundGuess(room, payload) {
  if (!room) return fail("Lobby not found or expired.");
  if (room.status !== ROOM_STATUSES.IN_GAME || !room.game) {
    return fail("Game has not started.");
  }

  const playerIdResult = validatePlayerId(payload.playerId);
  if (!playerIdResult.ok) return playerIdResult;

  const player = room.players.get(playerIdResult.data.playerId);
  if (!player || player.kicked) return fail("Player is not in this lobby.");
  if (player.inactive) return fail("This player is no longer active in the game.");

  const roundResult = validateRoundIndex(payload.roundIndex, room.game.roundCount);
  if (!roundResult.ok) return roundResult;

  const levelResult = validateLevel(payload.level);
  if (!levelResult.ok) return levelResult;

  const { roundIndex } = roundResult.data;
  const activeRuleMode = getRoundRuleMode(room.game, roundIndex);
  const existing = player.results[roundIndex];

  if (existing) {
    return ok({
      leaderboard: room.leaderboard,
      playerResults: player.results.filter(Boolean).map(serializeResult),
      result: serializeResult(existing),
    });
  }

  const target = room.game.targets[roundIndex];
  if (!target) return fail("Target is unavailable.");

  const splitLevelsResult =
    activeRuleMode === GAME_RULE_MODES.SPLIT_FILL
      ? validateSplitLevels(payload.splitLevels)
      : ok({ splitLevels: null });
  if (!splitLevelsResult.ok) return splitLevelsResult;

  const bandLevelsResult =
    activeRuleMode === GAME_RULE_MODES.BAND_RUN
      ? validateBandLevels(payload.bandLevels, target.bandTargets?.length || 0)
      : ok({ bandLevels: null });
  if (!bandLevelsResult.ok) return bandLevelsResult;

  const result = calculateRoundResult({
    bandLevels: bandLevelsResult.data.bandLevels,
    bandTargets: Array.isArray(target.bandTargets)
      ? target.bandTargets
      : [target.target, target.target],
    fakeTarget:
      activeRuleMode === GAME_RULE_MODES.FAKE_TARGET
        ? target.fakeTarget
        : null,
    level: levelResult.data.level,
    roundIndex,
    ruleMode: activeRuleMode,
    splitLevels: splitLevelsResult.data.splitLevels,
    splitTargets: Array.isArray(target.splitTargets)
      ? target.splitTargets
      : [target.target, target.target],
    target: target.target,
    tilt: payload.tilt,
  });

  player.results[roundIndex] = result;
  player.score = roundScore(
    player.results.filter(Boolean).reduce((total, round) => total + round.score, 0),
  );
  player.totalScore = player.score;
  player.submitted =
    player.results.filter(Boolean).length >= room.game.roundCount;
  player.lastSeenAt = now();
  room.updatedAt = now();

  return ok({
    leaderboard: room.leaderboard,
    playerResults: player.results.filter(Boolean).map(serializeResult),
    playerTotalScoreSoFar: player.score,
    result: serializeResult(result),
  });
}

export function requestScoreboardReveal(room, payload) {
  if (!room) return fail("Lobby not found or expired.");
  if (room.status === ROOM_STATUSES.COMPLETED && room.leaderboard) {
    return ok({ completed: true, leaderboard: room.leaderboard });
  }
  if (room.status !== ROOM_STATUSES.IN_GAME || !room.game) {
    return fail("Game has not started.");
  }

  const playerIdResult = validatePlayerId(payload.playerId);
  if (!playerIdResult.ok) return playerIdResult;

  const player = room.players.get(playerIdResult.data.playerId);
  if (!player || player.kicked) return fail("Player is not in this lobby.");
  if (player.inactive) return fail("This player is no longer active in the game.");
  if (!player.submitted) {
    return fail("Finish every round before opening the scoreboard.");
  }

  player.scoreboardReady = true;
  player.lastSeenAt = now();
  room.updatedAt = now();

  const leaderboard = maybeFinishRoom(room);

  return ok({
    completed: Boolean(leaderboard),
    leaderboard,
  });
}

export function submitFullResults(room, payload) {
  if (!Array.isArray(payload.results)) return fail("Invalid score payload.");

  let lastResult = null;

  for (const item of payload.results) {
    const submission = submitRoundGuess(room, {
      bandLevels: item.bandLevels,
      level: item.level,
      playerId: payload.playerId,
      roundIndex: item.roundIndex,
      splitLevels: item.splitLevels,
    });

    if (!submission.ok) return submission;
    lastResult = submission.data;
  }

  return ok(lastResult || {});
}

export function buildLeaderboard(room) {
  const activePlayers = getActivePlayers(room);
  const totalRounds = room.game?.roundCount || GAME_ROUND_COUNT;
  const maxTotalScore = totalRounds * MAX_ROUND_SCORE;
  const ranked = activePlayers
    .map((player) => {
      const roundResults = Array.from({ length: totalRounds }, (_, index) => {
        const result = player.results[index];
        const target = room.game.targets[index];
        const activeRuleMode = getRoundRuleMode(room.game, index);
        const missedResult = calculateRoundResult({
          fakeTarget:
            activeRuleMode === GAME_RULE_MODES.FAKE_TARGET
              ? target?.fakeTarget
              : null,
          level: 0,
          bandLevels:
            activeRuleMode === GAME_RULE_MODES.BAND_RUN
              ? Array.from({ length: target?.bandTargets?.length || 2 }, () => 0)
              : null,
          bandTargets: Array.isArray(target?.bandTargets)
            ? target.bandTargets
            : [target?.target ?? 0, target?.target ?? 0],
          roundIndex: index,
          ruleMode: activeRuleMode,
          splitLevels:
            activeRuleMode === GAME_RULE_MODES.SPLIT_FILL ? [0, 0] : null,
          splitTargets: Array.isArray(target?.splitTargets)
            ? target.splitTargets
            : [target?.target ?? 0, target?.target ?? 0],
          target: target?.target ?? 0,
        });

        return serializeResult(result || { ...missedResult, label: "MISSED", score: 0 });
      });
      const totalScore = roundScore(
        roundResults.reduce((total, result) => total + result.score, 0),
      );
      const bestDiff = roundResults.length
        ? Math.min(...roundResults.map((result) => result.diff))
        : null;

      return {
        bestDiff,
        connected: player.connected,
        id: player.id,
        isHost: player.isHost,
        maxTotalScore,
        name: player.name,
        playerId: player.id,
        playerName: player.name,
        results: roundResults,
        roundResults,
        score: totalScore,
        submitted: player.submitted,
        totalScore,
        waterColorId: player.waterColorId || room.game.waterColorId,
      };
    })
    .sort((first, second) => {
      if (second.totalScore !== first.totalScore) {
        return second.totalScore - first.totalScore;
      }

      return (first.bestDiff ?? 100) - (second.bestDiff ?? 100);
    });

  return {
    completedAt: now(),
    difficulty: room.game.difficulty,
    gameMode: room.game.ruleMode,
    leaderboard: ranked.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    })),
    maxRoundScore: MAX_ROUND_SCORE,
    maxTotalScore,
    mode: room.game.ruleMode,
    players: ranked,
    roomCode: room.code,
    roundCount: totalRounds,
    ruleMode: room.game.ruleMode,
    targets: room.game.targets,
    modeQueue: room.game.modeQueue || null,
    totalRounds,
    waterColorId: room.game.waterColorId,
    winner: ranked[0] || null,
  };
}

export function maybeFinishRoom(room) {
  if (!room.game || room.status !== ROOM_STATUSES.IN_GAME) {
    return room.leaderboard;
  }

  const activePlayers = getActivePlayers(room);
  const allFinished =
    activePlayers.length > 0 &&
    activePlayers.every((player) => player.submitted && player.scoreboardReady);

  if (!allFinished) return null;

  room.status = ROOM_STATUSES.COMPLETED;
  room.leaderboard = buildLeaderboard(room);
  room.updatedAt = now();

  return room.leaderboard;
}
