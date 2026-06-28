import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import {
  DEFAULT_SETTINGS,
  GAME_ROUND_COUNT,
  ROOM_STATUSES,
  ROOM_VISIBILITIES,
  WATER_COLOR_ID_LIST,
} from "../constants.js";
import {
  buildGamePayload,
  markPlayerInactiveForGame,
  startGameForRoom,
  submitRoundGuess,
} from "../game/gameService.js";
import { normalizeTotalScore } from "../game/scoring.js";
import { generateRoomCode } from "../utils/ids.js";
import { logger } from "../utils/logger.js";
import { now } from "../utils/time.js";
import { deleteRoom, getRoom, listRooms, setRoom } from "./roomStore.js";
import {
  fail,
  ok,
  validateDifficulty,
  validatePlayerId,
  validatePlayerName,
  validateRoomCode,
  validateRoomName,
  validateRoomPassword,
  validateRoomVisibility,
  validateRoundCount,
  validateRuleMode,
  validateWaterColor,
} from "./roomValidation.js";

let callbacks = {
  emitPlayerKicked: () => {},
  emitRoomClosed: () => {},
  emitRoomList: () => {},
  emitRoomState: () => {},
  emitScoreboard: () => {},
  leaveSocketRoom: () => {},
};

export function configureRoomService(nextCallbacks) {
  callbacks = {
    ...callbacks,
    ...nextCallbacks,
  };
}

function createWaterStateStore() {
  return new Map();
}

function createTimerStore() {
  return {
    completed: null,
    empty: null,
    hostDisconnect: null,
    playerDisconnects: new Map(),
    stale: null,
  };
}

function clearTimer(timer) {
  if (timer) clearTimeout(timer);
}

function clearRoomTimers(room) {
  clearTimer(room.timers.completed);
  clearTimer(room.timers.empty);
  clearTimer(room.timers.hostDisconnect);
  clearTimer(room.timers.stale);
  for (const timer of room.timers.playerDisconnects.values()) clearTimer(timer);
  room.timers.playerDisconnects.clear();
}

function touchRoom(room) {
  room.updatedAt = now();
  room.expiresAt = now() + env.roomTtlMs;
}

function createPasswordRecord(password) {
  if (!password) return null;

  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex");

  return { hash, salt };
}

function verifyPassword(password, record) {
  if (!record) return true;
  if (!password) return false;

  const hash = createHash("sha256")
    .update(`${record.salt}:${password}`)
    .digest("hex");

  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(record.hash, "hex"));
}

function getRoomHost(room) {
  return room.players.get(room.hostPlayerId) || null;
}

function getTakenWaterColorIds(room, ignoredPlayerId = null) {
  return new Set(
    Array.from(room.players.values())
      .filter(
        (player) =>
          !player.kicked &&
          (!ignoredPlayerId || player.id !== ignoredPlayerId) &&
          player.waterColorId,
      )
      .map((player) => player.waterColorId),
  );
}

function getJoinablePlayerCount(room) {
  return Array.from(room.players.values()).filter((player) => !player.kicked)
    .length;
}

function isRoomJoinable(room) {
  return (
    (room.status === ROOM_STATUSES.LOBBY ||
      room.status === ROOM_STATUSES.IN_GAME) &&
    getJoinablePlayerCount(room) < room.maxPlayers
  );
}

function pickAvailableWaterColorId(room, requestedColorId, ignoredPlayerId = null) {
  const takenColorIds = getTakenWaterColorIds(room, ignoredPlayerId);

  if (
    requestedColorId &&
    WATER_COLOR_ID_LIST.includes(requestedColorId) &&
    !takenColorIds.has(requestedColorId)
  ) {
    return requestedColorId;
  }

  return (
    WATER_COLOR_ID_LIST.find((colorId) => !takenColorIds.has(colorId)) ||
    requestedColorId ||
    DEFAULT_SETTINGS.waterColorId
  );
}

function ensureUniquePlayerWaterColors(room) {
  if (!room?.players) return;

  const players = Array.from(room.players.values()).sort(
    (first, second) => first.joinedAt - second.joinedAt,
  );

  for (const player of players) {
    if (player.kicked) continue;

    player.waterColorId = pickAvailableWaterColorId(
      room,
      player.waterColorId || DEFAULT_SETTINGS.waterColorId,
      player.id,
    );
  }
}

function getPlayerProgress(player, room) {
  const completedRounds = player.results?.filter(Boolean).length || 0;
  const totalRounds = room?.game?.roundCount || room?.roundCount || GAME_ROUND_COUNT;
  const currentRound =
    room?.status === ROOM_STATUSES.IN_GAME
      ? Math.min(completedRounds + (player.submitted ? 0 : 1), totalRounds)
      : completedRounds;

  return {
    completedRounds,
    currentRound,
    totalRounds,
  };
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

function serializePlayer(player, room = null) {
  const progress = getPlayerProgress(player, room);

  return {
    completedRounds: progress.completedRounds,
    connected: player.connected,
    currentRound: progress.currentRound,
    id: player.id,
    inactive: Boolean(player.inactive),
    isHost: player.isHost,
    joinedAt: player.joinedAt,
    lastSeenAt: player.lastSeenAt,
    name: player.name,
    playerId: player.id,
    progress,
    results: player.results.filter(Boolean).map(serializeResult),
    returnedToLobby: Boolean(player.returnedToLobby),
    score: normalizeTotalScore(player.score || player.totalScore || 0),
    submitted: Boolean(player.submitted),
    submittedRounds: player.results.filter(Boolean).length,
    totalRounds: progress.totalRounds,
    waitingForNextGame: Boolean(player.waitingForNextGame),
    waterColorId: player.waterColorId || DEFAULT_SETTINGS.waterColorId,
  };
}

function serializeWaterState(room, entry) {
  const player = room.players.get(entry.playerId);
  if (!player || player.kicked || player.inactive) return null;

  return {
    ...entry.state,
    player: {
      id: player.id,
      name: player.name,
      waterColorId: player.waterColorId || DEFAULT_SETTINGS.waterColorId,
    },
    roomCode: room.code,
  };
}

function getWaterStateSnapshot(room) {
  if (!room?.waterStates || room.status !== ROOM_STATUSES.IN_GAME) return [];

  return Array.from(room.waterStates.values())
    .map((entry) => serializeWaterState(room, entry))
    .filter(Boolean);
}

export function getRoomSnapshot(room) {
  if (!room) return null;
  ensureUniquePlayerWaterColors(room);

  return {
    code: room.code,
    createdAt: room.createdAt,
    difficulty: room.difficulty,
    expiresAt: room.expiresAt,
    game:
      room.status === ROOM_STATUSES.IN_GAME ||
      room.status === ROOM_STATUSES.COMPLETED
        ? buildGamePayload(room)
        : null,
    hasPassword: Boolean(room.password),
    hostPlayerId: room.hostPlayerId,
    isPrivate: room.visibility === ROOM_VISIBILITIES.PRIVATE,
    leaderboard:
      room.status === ROOM_STATUSES.COMPLETED ? room.leaderboard : null,
    lobbyName: room.name,
    maxPlayers: room.maxPlayers,
    mode: room.ruleMode,
    name: room.name,
    playerCount: getJoinablePlayerCount(room),
    players: Array.from(room.players.values())
      .filter((player) => !player.kicked)
      .sort((first, second) => first.joinedAt - second.joinedAt)
      .map((player) => serializePlayer(player, room)),
    roomCode: room.code,
    roundCount: room.roundCount || GAME_ROUND_COUNT,
    ruleMode: room.ruleMode,
    status: room.status,
    updatedAt: room.updatedAt,
    visibility: room.visibility,
    waterStates: getWaterStateSnapshot(room),
  };
}

export const serializeRoom = getRoomSnapshot;

function getRoomListSnapshot(room) {
  const host = getRoomHost(room);

  return {
    code: room.code,
    difficulty: room.difficulty,
    expiresAt: room.expiresAt,
    hasPassword: Boolean(room.password),
    hostName: host?.name || "",
    isPrivate: room.visibility === ROOM_VISIBILITIES.PRIVATE,
    lobbyName: room.name,
    maxPlayers: room.maxPlayers,
    name: room.name,
    playerCount: getJoinablePlayerCount(room),
    roomCode: room.code,
    roundCount: room.roundCount || GAME_ROUND_COUNT,
    ruleMode: room.ruleMode,
    status: room.status,
    updatedAt: room.updatedAt,
    visibility: room.visibility,
  };
}

function normalizeSearchQuery(query) {
  return typeof query === "string" ? query.trim().toLowerCase().slice(0, 60) : "";
}

export function listJoinableRooms(payload = {}) {
  const query = normalizeSearchQuery(payload.query);
  const currentTime = now();
  const rooms = listRooms()
    .filter((room) => isRoomJoinable(room))
    .filter((room) => room.expiresAt > currentTime)
    .map(getRoomListSnapshot)
    .filter((room) => {
      if (!query) return true;

      return [
        room.code,
        room.name,
        room.hostName,
        room.ruleMode,
        room.difficulty,
        room.visibility,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((first, second) => second.updatedAt - first.updatedAt)
    .slice(0, 50);

  return ok({ rooms });
}

function scheduleRoomDeletion(room, delayMs, reason, notify = false) {
  clearTimer(room.timers[reason] || null);

  const timer = setTimeout(() => {
    const currentRoom = getRoom(room.code);
    if (!currentRoom) return;

    closeRoom(currentRoom, reason, notify);
  }, delayMs);

  timer.unref?.();

  if (reason === "completed") room.timers.completed = timer;
  if (reason === "empty") room.timers.empty = timer;
  if (reason === "stale") room.timers.stale = timer;
}

function cancelEmptyDeletion(room) {
  clearTimer(room.timers.empty);
  room.timers.empty = null;
}

export function closeRoom(room, reason = "closed", notify = true) {
  if (!room) return;

  room.status = ROOM_STATUSES.CLOSED;
  clearRoomTimers(room);
  deleteRoom(room.code);

  if (notify) callbacks.emitRoomClosed(room, reason);
  callbacks.emitRoomList();
  logger.info("room closed", { reason, roomCode: room.code });
}

function maybeScheduleEmptyRoom(room) {
  const activePlayers = Array.from(room.players.values()).filter(
    (player) => !player.kicked,
  );

  if (!activePlayers.length) {
    scheduleRoomDeletion(room, env.emptyRoomTtlMs, "empty", false);
  }
}

function validateRoomCreatePayload(payload) {
  const playerId = validatePlayerId(payload.playerId || payload.hostPlayerId);
  if (!playerId.ok) return playerId;

  const playerName = validatePlayerName(payload.playerName || payload.hostName);
  if (!playerName.ok) return playerName;

  const difficulty = validateDifficulty(payload.difficulty);
  if (!difficulty.ok) return difficulty;

  const ruleMode = validateRuleMode(payload.ruleMode || payload.gameMode || payload.mode);
  if (!ruleMode.ok) return ruleMode;

  const waterColor = validateWaterColor(payload.waterColorId);
  if (!waterColor.ok) return waterColor;

  const roundCount = validateRoundCount(
    payload.roundCount ?? payload.levelCount ?? payload.levels,
  );
  if (!roundCount.ok) return roundCount;

  const roomName = validateRoomName(
    payload.roomName || payload.lobbyName,
    `${playerName.data.playerName}'s lobby`,
  );
  if (!roomName.ok) return roomName;

  const visibility = validateRoomVisibility(payload.visibility);
  if (!visibility.ok) return visibility;

  const password = validateRoomPassword(payload.password, {
    required: visibility.data.visibility === ROOM_VISIBILITIES.PRIVATE,
  });
  if (!password.ok) return password;

  return ok({
    difficulty: difficulty.data.difficulty,
    password: password.data.password,
    playerId: playerId.data.playerId,
    playerName: playerName.data.playerName,
    roomName: roomName.data.roomName,
    roundCount: roundCount.data.roundCount,
    ruleMode: ruleMode.data.ruleMode,
    visibility: visibility.data.visibility,
    waterColorId: waterColor.data.waterColorId,
  });
}

export function createRoom(payload) {
  const validation = validateRoomCreatePayload(payload);
  if (!validation.ok) return validation;

  const createdAt = now();
  const room = {
    code: generateRoomCode(),
    createdAt,
    difficulty: validation.data.difficulty,
    expiresAt: createdAt + env.roomTtlMs,
    game: null,
    hostPlayerId: validation.data.playerId,
    kickedPlayerIds: new Set(),
    leaderboard: null,
    maxPlayers: env.maxPlayersPerRoom,
    name: validation.data.roomName,
    password:
      validation.data.visibility === ROOM_VISIBILITIES.PRIVATE
        ? createPasswordRecord(validation.data.password)
        : null,
    players: new Map(),
    roundCount: validation.data.roundCount,
    ruleMode: validation.data.ruleMode,
    seed: null,
    status: ROOM_STATUSES.LOBBY,
    timers: createTimerStore(),
    updatedAt: createdAt,
    visibility: validation.data.visibility,
    waterStates: createWaterStateStore(),
  };

  room.players.set(validation.data.playerId, {
    connected: true,
    id: validation.data.playerId,
    inactive: false,
    isHost: true,
    joinedAt: createdAt,
    kicked: false,
    lastSeenAt: createdAt,
    name: validation.data.playerName,
    results: [],
    returnedToLobby: false,
    score: 0,
    scoreboardReady: false,
    socketId: payload.socketId || null,
    submitted: false,
    totalScore: 0,
    waitingForNextGame: false,
    waterColorId: validation.data.waterColorId,
  });

  setRoom(room);
  scheduleRoomDeletion(room, env.roomTtlMs, "stale", true);
  logger.info("room created", { roomCode: room.code });

  return ok({
    player: serializePlayer(room.players.get(validation.data.playerId), room),
    room: getRoomSnapshot(room),
    roomCode: room.code,
  });
}

function reconnectPlayer(room, player, socketId) {
  const disconnectTimer = room.timers.playerDisconnects.get(player.id);

  clearTimer(disconnectTimer);
  room.timers.playerDisconnects.delete(player.id);

  if (player.isHost) {
    clearTimer(room.timers.hostDisconnect);
    room.timers.hostDisconnect = null;
  }

  player.connected = true;
  player.inactive =
    room.status === ROOM_STATUSES.IN_GAME && player.waitingForNextGame
      ? true
      : false;
  player.lastSeenAt = now();
  player.socketId = socketId;
  touchRoom(room);
}

export function requestRoomState(payload) {
  const roomCode = validateRoomCode(payload.roomCode);
  if (!roomCode.ok) return roomCode;

  const room = getRoom(roomCode.data.roomCode);
  if (!room) return fail("Lobby not found or expired.");
  if (room.status === ROOM_STATUSES.CLOSED) return fail("Lobby is closed.");

  const playerId = payload.playerId ? validatePlayerId(payload.playerId) : null;
  let player = null;

  if (playerId?.ok) {
    player = room.players.get(playerId.data.playerId) || null;
    if (player && !player.kicked) reconnectPlayer(room, player, payload.socketId);
  }

  touchRoom(room);

  return ok({
    game: player ? buildGamePayload(room) : null,
    leaderboard: room.leaderboard,
    player: player ? serializePlayer(player, room) : null,
    room: getRoomSnapshot(room),
  });
}

export function joinRoom(payload) {
  const roomCode = validateRoomCode(payload.roomCode);
  if (!roomCode.ok) return roomCode;

  const playerId = validatePlayerId(payload.playerId);
  if (!playerId.ok) return playerId;

  const playerName = validatePlayerName(payload.playerName);
  if (!playerName.ok) return playerName;

  const room = getRoom(roomCode.data.roomCode);
  if (!room) return fail("Lobby not found or expired.");
  if (room.status === ROOM_STATUSES.CLOSED) return fail("Lobby is closed.");
  if (room.kickedPlayerIds.has(playerId.data.playerId)) {
    return fail("You were removed from this lobby.");
  }

  const existingPlayer = room.players.get(playerId.data.playerId);
  if (existingPlayer && !existingPlayer.kicked) {
    const waterColor = validateWaterColor(payload.waterColorId);
    existingPlayer.name = playerName.data.playerName;
    existingPlayer.waterColorId =
      existingPlayer.waterColorId ||
      pickAvailableWaterColorId(
        room,
        waterColor.ok
          ? waterColor.data.waterColorId
          : DEFAULT_SETTINGS.waterColorId,
        existingPlayer.id,
      );
    reconnectPlayer(room, existingPlayer, payload.socketId);

    return ok({
      game: buildGamePayload(room),
      leaderboard: room.leaderboard,
      player: serializePlayer(existingPlayer, room),
      room: getRoomSnapshot(room),
    });
  }

  if (room.visibility === ROOM_VISIBILITIES.PRIVATE && room.password) {
    const password = validateRoomPassword(payload.password, { required: true });
    if (!password.ok) return password;
    if (!verifyPassword(password.data.password, room.password)) {
      return fail("Invalid lobby password.");
    }
  }

  if (!isRoomJoinable(room)) {
    if (
      room.status !== ROOM_STATUSES.LOBBY &&
      room.status !== ROOM_STATUSES.IN_GAME
    ) {
      return fail("Lobby is not accepting players right now.");
    }

    return fail("Lobby is full.");
  }

  const waterColor = validateWaterColor(payload.waterColorId);
  if (!waterColor.ok) return waterColor;

  const joinedAt = now();
  const joinsActiveGame = room.status === ROOM_STATUSES.IN_GAME;
  const player = {
    connected: true,
    id: playerId.data.playerId,
    inactive: joinsActiveGame,
    isHost: false,
    joinedAt,
    kicked: false,
    lastSeenAt: joinedAt,
    name: playerName.data.playerName,
    results: [],
    returnedToLobby: false,
    score: 0,
    scoreboardReady: false,
    socketId: payload.socketId || null,
    submitted: false,
    totalScore: 0,
    waitingForNextGame: joinsActiveGame,
    waterColorId: pickAvailableWaterColorId(
      room,
      waterColor.data.waterColorId,
      playerId.data.playerId,
    ),
  };

  room.players.set(player.id, player);
  cancelEmptyDeletion(room);
  touchRoom(room);

  return ok({
    game: buildGamePayload(room),
    player: serializePlayer(player, room),
    room: getRoomSnapshot(room),
  });
}

export function updateRoomSettings(payload) {
  const roomCode = validateRoomCode(payload.roomCode);
  if (!roomCode.ok) return roomCode;

  const playerId = validatePlayerId(payload.hostPlayerId || payload.playerId);
  if (!playerId.ok) return playerId;

  const room = getRoom(roomCode.data.roomCode);
  if (!room) return fail("Lobby not found or expired.");
  if (room.status !== ROOM_STATUSES.LOBBY) {
    return fail("Settings can only be changed in the lobby.");
  }
  if (room.hostPlayerId !== playerId.data.playerId) {
    return fail("Only the host can change lobby settings.");
  }

  if (
    payload.ruleMode !== undefined ||
    payload.gameMode !== undefined ||
    payload.mode !== undefined
  ) {
    const ruleMode = validateRuleMode(payload.ruleMode || payload.gameMode || payload.mode);
    if (!ruleMode.ok) return ruleMode;
    room.ruleMode = ruleMode.data.ruleMode;
  }

  if (payload.difficulty !== undefined) {
    const difficulty = validateDifficulty(payload.difficulty);
    if (!difficulty.ok) return difficulty;
    room.difficulty = difficulty.data.difficulty;
  }

  if (
    payload.roundCount !== undefined ||
    payload.levelCount !== undefined ||
    payload.levels !== undefined
  ) {
    const roundCount = validateRoundCount(
      payload.roundCount ?? payload.levelCount ?? payload.levels,
    );
    if (!roundCount.ok) return roundCount;
    room.roundCount = roundCount.data.roundCount;
  }

  touchRoom(room);
  return ok({ room: getRoomSnapshot(room) });
}

export function updatePlayerWaterColor(payload) {
  const roomCode = validateRoomCode(payload.roomCode);
  if (!roomCode.ok) return roomCode;

  const playerId = validatePlayerId(payload.playerId);
  if (!playerId.ok) return playerId;

  const waterColor = validateWaterColor(payload.waterColorId);
  if (!waterColor.ok) return waterColor;

  const room = getRoom(roomCode.data.roomCode);
  if (!room) return fail("Lobby not found or expired.");
  if (room.status !== ROOM_STATUSES.LOBBY) {
    return fail("Water color can only be changed in the lobby.");
  }

  const player = room.players.get(playerId.data.playerId);
  if (!player || player.kicked) return fail("Player is not in this lobby.");

  const takenColorIds = getTakenWaterColorIds(room, player.id);
  if (takenColorIds.has(waterColor.data.waterColorId)) {
    return fail("Water color is already taken.");
  }

  player.waterColorId = waterColor.data.waterColorId;
  player.lastSeenAt = now();

  touchRoom(room);

  return ok({
    player: serializePlayer(player, room),
    room: getRoomSnapshot(room),
  });
}

export function recordWaterState(room, player, waterState) {
  if (!room || !player || room.status !== ROOM_STATUSES.IN_GAME) return null;

  if (!room.waterStates) room.waterStates = createWaterStateStore();

  const key = `${player.id}:${waterState.roundIndex}`;
  room.waterStates.set(key, {
    playerId: player.id,
    state: waterState,
  });
  touchRoom(room);

  return serializeWaterState(room, room.waterStates.get(key));
}

function getConnectedRoomPlayers(room) {
  return Array.from(room.players.values()).filter(
    (player) => !player.kicked && player.connected,
  );
}

function haveAllConnectedPlayersReturnedToLobby(room) {
  if (!room || room.status !== ROOM_STATUSES.COMPLETED) return false;

  const connectedPlayers = getConnectedRoomPlayers(room);

  return (
    connectedPlayers.length > 0 &&
    connectedPlayers.every((player) => player.returnedToLobby)
  );
}

function resetCompletedRoomToLobby(room) {
  clearTimer(room.timers.completed);
  room.timers.completed = null;
  room.status = ROOM_STATUSES.LOBBY;
  room.game = null;
  room.leaderboard = null;
  room.seed = null;
  room.waterStates = createWaterStateStore();

  for (const [id, player] of room.players.entries()) {
    if (player.kicked || !player.connected) {
      room.players.delete(id);
      continue;
    }

    player.inactive = false;
    player.results = [];
    player.returnedToLobby = false;
    player.score = 0;
    player.scoreboardReady = false;
    player.submitted = false;
    player.totalScore = 0;
    player.waitingForNextGame = false;
    player.lastSeenAt = now();
  }

  if (!room.players.has(room.hostPlayerId)) {
    const nextHost = Array.from(room.players.values())[0] || null;
    if (!nextHost) {
      closeRoom(room, "empty", true);
      return { closed: true, room: null };
    }

    room.hostPlayerId = nextHost.id;
    for (const player of room.players.values()) {
      player.isHost = player.id === nextHost.id;
    }
  }

  touchRoom(room);

  return { returnedAll: true, room: getRoomSnapshot(room) };
}

export function returnRoomToLobby(payload) {
  const roomCode = validateRoomCode(payload.roomCode);
  if (!roomCode.ok) return roomCode;

  const playerId = validatePlayerId(payload.playerId);
  if (!playerId.ok) return playerId;

  const room = getRoom(roomCode.data.roomCode);
  if (!room) return fail("Lobby not found or expired.");
  if (room.status === ROOM_STATUSES.LOBBY) {
    return ok({ returnedAll: true, room: getRoomSnapshot(room) });
  }
  if (room.status !== ROOM_STATUSES.COMPLETED) {
    return fail("The match is still running.");
  }

  const requester = room.players.get(playerId.data.playerId);
  if (!requester || requester.kicked) return fail("Player is not in this lobby.");

  requester.returnedToLobby = true;
  requester.lastSeenAt = now();

  if (!haveAllConnectedPlayersReturnedToLobby(room)) {
    touchRoom(room);
    return ok({
      leaderboard: room.leaderboard,
      pendingLobbyReturn: true,
      player: serializePlayer(requester, room),
      room: getRoomSnapshot(room),
    });
  }

  return ok(resetCompletedRoomToLobby(room));
}

export const returnToLobby = returnRoomToLobby;

export function leaveRoom(payload) {
  const roomCode = validateRoomCode(payload.roomCode);
  if (!roomCode.ok) return roomCode;

  const playerId = validatePlayerId(payload.playerId);
  if (!playerId.ok) return playerId;

  const room = getRoom(roomCode.data.roomCode);
  if (!room) return ok({ room: null });

  const player = room.players.get(playerId.data.playerId);
  if (!player) return ok({ room: getRoomSnapshot(room) });

  if (room.status === ROOM_STATUSES.LOBBY && player.isHost) {
    closeRoom(room, "host-left", true);
    return ok({ closed: true, room: null });
  }

  if (room.status === ROOM_STATUSES.LOBBY) {
    room.players.delete(player.id);
  } else {
    player.connected = false;
    player.inactive = true;
    markPlayerInactiveForGame(room, player.id);
  }

  touchRoom(room);
  maybeScheduleEmptyRoom(room);

  return ok({
    leaderboard: room.leaderboard,
    room: getRoomSnapshot(room),
  });
}

export function kickPlayer(payload) {
  const roomCode = validateRoomCode(payload.roomCode);
  if (!roomCode.ok) return roomCode;

  const hostId = validatePlayerId(payload.hostPlayerId || payload.playerId);
  if (!hostId.ok) return hostId;

  const targetId = validatePlayerId(payload.targetPlayerId);
  if (!targetId.ok) return targetId;

  const room = getRoom(roomCode.data.roomCode);
  if (!room) return fail("Lobby not found or expired.");
  if (room.status !== ROOM_STATUSES.LOBBY) {
    return fail("Players can only be removed before the game starts.");
  }

  const host = room.players.get(hostId.data.playerId);
  if (!host || host.id !== room.hostPlayerId) {
    return fail("Only the host can remove players.");
  }
  if (host.id === targetId.data.playerId) return fail("Host cannot remove self.");

  const target = room.players.get(targetId.data.playerId);
  if (!target) return fail("Player not found.");

  target.kicked = true;
  room.kickedPlayerIds.add(target.id);
  room.players.delete(target.id);
  touchRoom(room);

  callbacks.emitPlayerKicked(room, target);
  if (target.socketId) callbacks.leaveSocketRoom(room.code, target.socketId);
  maybeScheduleEmptyRoom(room);

  return ok({ room: getRoomSnapshot(room) });
}

export function startRoomGame(payload) {
  const roomCode = validateRoomCode(payload.roomCode);
  if (!roomCode.ok) return roomCode;

  const playerId = validatePlayerId(payload.playerId);
  if (!playerId.ok) return playerId;

  const room = getRoom(roomCode.data.roomCode);
  if (!room) return fail("Lobby not found or expired.");
  if (room.status === ROOM_STATUSES.COMPLETED) {
    return fail("Every player must return to the lobby before starting again.");
  }
  if (room.status !== ROOM_STATUSES.LOBBY) return fail("Game already started.");
  if (room.hostPlayerId !== playerId.data.playerId) {
    return fail("Only the host can start the game.");
  }

  room.status = ROOM_STATUSES.STARTING;
  room.waterStates = createWaterStateStore();
  touchRoom(room);
  const game = startGameForRoom(room);
  touchRoom(room);

  return ok({
    game,
    room: getRoomSnapshot(room),
  });
}

export const startGame = startRoomGame;

export function submitGuess(payload) {
  const roomCode = validateRoomCode(payload.roomCode);
  if (!roomCode.ok) return roomCode;

  const room = getRoom(roomCode.data.roomCode);
  const result = submitRoundGuess(room, payload);
  if (!result.ok) return result;

  return ok({
    completed: Boolean(result.data.leaderboard),
    ...result.data,
    room: getRoomSnapshot(room),
  });
}

export function findRoomsBySocketId(socketId) {
  const matches = [];

  for (const room of listRooms()) {
    for (const player of room.players.values()) {
      if (player.socketId === socketId) matches.push({ player, room });
    }
  }

  return matches;
}

function expireDisconnectedPlayer(roomCode, playerId) {
  const room = getRoom(roomCode);
  if (!room) return;

  const player = room.players.get(playerId);
  if (!player || player.connected) return;

  room.timers.playerDisconnects.delete(playerId);

  if (room.status === ROOM_STATUSES.LOBBY) {
    room.players.delete(playerId);
    touchRoom(room);
    maybeScheduleEmptyRoom(room);
    callbacks.emitRoomState(room);
    callbacks.emitRoomList();
    return;
  }

  if (
    room.status === ROOM_STATUSES.IN_GAME ||
    room.status === ROOM_STATUSES.COMPLETED
  ) {
    const leaderboard =
      room.status === ROOM_STATUSES.IN_GAME
        ? markPlayerInactiveForGame(room, playerId)
        : null;

    touchRoom(room);
    callbacks.emitRoomState(room);
    if (leaderboard) {
      callbacks.emitScoreboard(room, leaderboard);
      scheduleCompletedCleanup(room);
    }
    callbacks.emitRoomList();
  }
}

function expireDisconnectedHost(roomCode, playerId) {
  const room = getRoom(roomCode);
  if (!room || room.status !== ROOM_STATUSES.LOBBY) return;

  const host = room.players.get(playerId);
  if (!host || host.connected) return;

  closeRoom(room, "host-disconnected", true);
}

export function handleSocketDisconnect(socketId) {
  const matches = findRoomsBySocketId(socketId);

  for (const { player, room } of matches) {
    if (player.socketId !== socketId) continue;

    player.connected = false;
    player.lastSeenAt = now();
    player.socketId = null;
    touchRoom(room);

    if (room.status === ROOM_STATUSES.LOBBY && player.isHost) {
      clearTimer(room.timers.hostDisconnect);
      room.timers.hostDisconnect = setTimeout(
        () => expireDisconnectedHost(room.code, player.id),
        env.hostDisconnectGraceMs,
      );
      room.timers.hostDisconnect.unref?.();
    } else {
      clearTimer(room.timers.playerDisconnects.get(player.id));
      const timer = setTimeout(
        () => expireDisconnectedPlayer(room.code, player.id),
        env.disconnectGraceMs,
      );
      timer.unref?.();
      room.timers.playerDisconnects.set(player.id, timer);
    }

    callbacks.emitRoomState(room);
    callbacks.emitRoomList();
  }
}

export function attachSocket({ playerId, roomCode, socketId }) {
  const room = getRoom(roomCode);
  if (!room) return null;

  const player = room.players.get(String(playerId || ""));
  if (player) reconnectPlayer(room, player, socketId);

  return room;
}

export function markDisconnected({ playerId, roomCode }) {
  const room = getRoom(roomCode);
  if (!room) return null;

  const player = room.players.get(String(playerId || ""));
  if (!player) return room;

  player.connected = false;
  player.socketId = null;
  touchRoom(room);

  return room;
}

export function scheduleCompletedCleanup(room) {
  scheduleRoomDeletion(room, env.roomTtlMs, "completed", false);
}

export function runRoomCleanup() {
  const currentTime = now();

  for (const room of listRooms()) {
    if (room.expiresAt <= currentTime) {
      closeRoom(room, "stale", true);
      continue;
    }

    maybeScheduleEmptyRoom(room);
  }
}

export const cleanupExpiredRooms = runRoomCleanup;

export function createRoomLegacy(payload) {
  return createRoom({
    ...payload,
    playerId: payload.hostPlayerId,
    playerName: payload.hostName,
  });
}

export const defaultSettings = DEFAULT_SETTINGS;
