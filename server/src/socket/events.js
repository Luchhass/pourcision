import {
  requestScoreboardReveal,
  submitRoundGuess,
} from "../game/gameService.js";
import { ROOM_STATUSES } from "../constants.js";
import { getRoom } from "../rooms/roomStore.js";
import {
  configureRoomService,
  createRoom,
  getRoomSnapshot,
  handleSocketDisconnect,
  joinRoom,
  kickPlayer,
  leaveRoom,
  listJoinableRooms,
  requestRoomState,
  returnRoomToLobby,
  scheduleCompletedCleanup,
  startRoomGame,
  updatePlayerWaterColor,
  updateRoomSettings,
} from "../rooms/roomService.js";
import {
  validateLevel,
  validatePlayerId,
  validateRoomCode,
  validateRoundIndex,
} from "../rooms/roomValidation.js";
import { logger } from "../utils/logger.js";
import { createEmitters } from "./emitters.js";

function ackOk(ack, data = {}) {
  ack?.({
    data,
    ok: true,
    ...data,
  });
}

function ackFail(ack, error = "Unexpected multiplayer error.") {
  ack?.({
    error,
    ok: false,
  });
}

function safeEvent(handler) {
  return async (payload = {}, ack) => {
    try {
      await handler(payload || {}, ack);
    } catch (error) {
      logger.error("socket event failed", { message: error.message });
      ackFail(ack);
    }
  };
}

function joinSocketToRoom(socket, roomCode) {
  if (roomCode) socket.join(roomCode);
}

function leaveSocketFromRoom(socket, roomCode) {
  if (roomCode) socket.leave(roomCode);
}

function getRoomFromPayload(payload) {
  const code = validateRoomCode(payload.roomCode);
  if (!code.ok) return code;

  const room = getRoom(code.data.roomCode);
  if (!room) return { error: "Lobby not found or expired.", ok: false };

  return { data: { room }, ok: true };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value, decimals = 3) {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

function sanitizeLevelArray(values) {
  if (!Array.isArray(values) || values.length !== 2) return null;

  const levels = values.map((value) => Number(value));
  if (levels.some((value) => !Number.isFinite(value))) return null;

  return levels.map((value) => roundTo(clamp(value, 0, 100), 2));
}

function sanitizePourXArray(values) {
  if (!Array.isArray(values) || values.length !== 2) return null;

  const positions = values.map((value) => Number(value));
  if (positions.some((value) => !Number.isFinite(value))) return null;

  return positions.map((value) => roundTo(clamp(value, 0.02, 0.98)));
}

function sanitizeWaterState(room, payload) {
  if (room.status !== ROOM_STATUSES.IN_GAME || !room.game) {
    return { error: "Game has not started.", ok: false };
  }

  const playerIdResult = validatePlayerId(payload.playerId);
  if (!playerIdResult.ok) return playerIdResult;

  const player = room.players.get(playerIdResult.data.playerId);
  if (!player || player.kicked || player.inactive) {
    return { error: "Player is not in this lobby.", ok: false };
  }

  const roundResult = validateRoundIndex(payload.roundIndex, room.game.roundCount);
  if (!roundResult.ok) return roundResult;

  const levelResult = validateLevel(payload.level);
  if (!levelResult.ok) return levelResult;

  const pourX = Number(payload.pourX);
  const tilt = Number(payload.tilt);
  const activeSplitIndex = Number(payload.activeSplitIndex);
  const allowedStatuses = new Set([
    "filling",
    "idle",
    "intro",
    "leaking",
    "result",
    "settling",
  ]);
  const status = allowedStatuses.has(payload.status) ? payload.status : "idle";

  return {
    data: {
      player,
      waterState: {
        isPouring: Boolean(payload.isPouring),
        level: roundTo(levelResult.data.level, 2),
        pourX: roundTo(Number.isFinite(pourX) ? clamp(pourX, 0.02, 0.98) : 0.5),
        roundIndex: roundResult.data.roundIndex,
        sentAt: Date.now(),
        activeSplitIndex: activeSplitIndex === 1 ? 1 : 0,
        splitLevels: sanitizeLevelArray(payload.splitLevels),
        splitPourX: sanitizePourXArray(payload.splitPourX),
        status,
        tilt: roundTo(Number.isFinite(tilt) ? clamp(tilt, -1, 1) : 0),
      },
    },
    ok: true,
  };
}

export function registerSocketEvents(io) {
  const emitters = createEmitters(io);

  configureRoomService(emitters);

  io.on("connection", (socket) => {
    socket.on(
      "room:create",
      safeEvent((payload, ack) => {
        const result = createRoom({ ...payload, socketId: socket.id });
        if (!result.ok) return ackFail(ack, result.error);

        joinSocketToRoom(socket, result.data.room.code);
        ackOk(ack, result.data);
        socket.emit("room:created", result.data);
        emitters.emitRoomState(getRoom(result.data.room.code));
        emitters.emitRoomList();
      }),
    );

    socket.on(
      "room:list",
      safeEvent((payload, ack) => {
        const result = listJoinableRooms(payload);
        if (!result.ok) return ackFail(ack, result.error);

        ackOk(ack, result.data);
      }),
    );

    const handleJoin = safeEvent((payload, ack) => {
      const result = joinRoom({ ...payload, socketId: socket.id });
      if (!result.ok) return ackFail(ack, result.error);

      joinSocketToRoom(socket, result.data.room.code);
      ackOk(ack, result.data);
      socket.emit("room:joined", result.data);
      emitters.emitRoomState(getRoom(result.data.room.code));
      emitters.emitRoomList();
    });

    socket.on("room:join", handleJoin);

    const handleGetState = safeEvent((payload, ack) => {
      const result = requestRoomState({ ...payload, socketId: socket.id });
      if (!result.ok) return ackFail(ack, result.error);

      if (result.data.room) {
        joinSocketToRoom(socket, result.data.room.code);
        socket.emit("connection:restored", result.data);
        emitters.emitRoomState(getRoom(result.data.room.code));
      }

      ackOk(ack, result.data);
    });

    socket.on("room:getState", handleGetState);
    socket.on("room:requestState", handleGetState);

    socket.on(
      "room:leave",
      safeEvent((payload, ack) => {
        const result = leaveRoom(payload);
        if (!result.ok) return ackFail(ack, result.error);

        leaveSocketFromRoom(socket, payload.roomCode);
        ackOk(ack, result.data);
        if (result.data.room) emitters.emitRoomState(getRoom(result.data.room.code));
        emitters.emitRoomList();
      }),
    );

    socket.on(
      "room:kickPlayer",
      safeEvent((payload, ack) => {
        const result = kickPlayer(payload);
        if (!result.ok) return ackFail(ack, result.error);

        ackOk(ack, result.data);
        if (result.data.room) emitters.emitRoomState(getRoom(result.data.room.code));
        emitters.emitRoomList();
      }),
    );

    socket.on(
      "room:updateSettings",
      safeEvent((payload, ack) => {
        const result = updateRoomSettings(payload);
        if (!result.ok) return ackFail(ack, result.error);

        ackOk(ack, result.data);
        if (result.data.room) emitters.emitRoomState(getRoom(result.data.room.code));
        emitters.emitRoomList();
      }),
    );

    socket.on(
      "room:updatePlayerColor",
      safeEvent((payload, ack) => {
        const result = updatePlayerWaterColor(payload);
        if (!result.ok) return ackFail(ack, result.error);

        ackOk(ack, result.data);
        if (result.data.room) emitters.emitRoomState(getRoom(result.data.room.code));
        emitters.emitRoomList();
      }),
    );

    socket.on(
      "room:returnToLobby",
      safeEvent((payload, ack) => {
        const result = returnRoomToLobby(payload);
        if (!result.ok) return ackFail(ack, result.error);

        ackOk(ack, result.data);
        if (result.data.room) emitters.emitRoomState(getRoom(result.data.room.code));
        emitters.emitRoomList();
      }),
    );

    const handleStartGame = safeEvent((payload, ack) => {
      const result = startRoomGame(payload);
      if (!result.ok) return ackFail(ack, result.error);

      const room = getRoom(result.data.room.code);
      ackOk(ack, result.data);
      emitters.emitRoomState(room);
      emitters.emitRoomList();
      io.to(room.code).emit("game:started", {
        game: result.data.game,
        room: getRoomSnapshot(room),
        roomCode: room.code,
      });
    });

    socket.on("room:startGame", handleStartGame);
    socket.on("game:start", handleStartGame);

    const handleSubmitGuess = safeEvent((payload, ack) => {
      const roomResult = getRoomFromPayload(payload);
      if (!roomResult.ok) return ackFail(ack, roomResult.error);

      const result = submitRoundGuess(roomResult.data.room, payload);
      if (!result.ok) return ackFail(ack, result.error);

      const player = roomResult.data.room.players.get(String(payload.playerId));
      ackOk(ack, {
        ...result.data,
        completed: false,
        room: getRoomSnapshot(roomResult.data.room),
      });
      emitters.emitRoomState(roomResult.data.room);

      if (player && result.data.result) {
        emitters.emitSubmission(roomResult.data.room, player, result.data.result);
      }

    });

    socket.on("game:submitGuess", handleSubmitGuess);
    socket.on("round:submitGuess", handleSubmitGuess);

    const handleShowScoreboard = safeEvent((payload, ack) => {
      const roomResult = getRoomFromPayload(payload);
      if (!roomResult.ok) return ackFail(ack, roomResult.error);

      const result = requestScoreboardReveal(roomResult.data.room, payload);
      if (!result.ok) return ackFail(ack, result.error);

      ackOk(ack, {
        ...result.data,
        room: getRoomSnapshot(roomResult.data.room),
      });
      emitters.emitRoomState(roomResult.data.room);

      if (result.data.completed && result.data.leaderboard) {
        emitters.emitScoreboard(roomResult.data.room, result.data.leaderboard);
        scheduleCompletedCleanup(roomResult.data.room);
      }
    });

    socket.on("game:showScoreboard", handleShowScoreboard);
    socket.on("round:showScoreboard", handleShowScoreboard);

    socket.on(
      "game:waterState",
      safeEvent((payload) => {
        const roomResult = getRoomFromPayload(payload);
        if (!roomResult.ok) return;

        const result = sanitizeWaterState(roomResult.data.room, payload);
        if (!result.ok) return;

        emitters.emitWaterState(
          roomResult.data.room,
          result.data.player,
          result.data.waterState,
          socket.id,
        );
      }),
    );

    socket.on("disconnect", () => {
      handleSocketDisconnect(socket.id);
    });
  });
}
