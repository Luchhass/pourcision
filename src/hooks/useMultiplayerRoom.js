"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useLanguage";
import { emitWithAck, getSocket } from "@/lib/socket";

function responseData(response) {
  return response?.data || response || {};
}

function isSameRoom(payload, roomCode) {
  return payload?.roomCode === roomCode || payload?.code === roomCode;
}

function getWaterStateKey(item) {
  const playerId = item?.player?.id;
  const roundIndex = item?.roundIndex;

  return playerId && Number.isInteger(roundIndex)
    ? `${playerId}:${roundIndex}`
    : null;
}

function getSubmittedWaterState(payload) {
  if (!payload?.player?.id || !payload?.result) return null;

  return {
    activeSplitIndex: 0,
    isPouring: false,
    level: payload.result.level,
    player: payload.player,
    pourX: 0.5,
    receivedAt: Date.now(),
    roundIndex: payload.result.roundIndex,
    sentAt: Date.now(),
    splitLevels: payload.result.splitLevels || null,
    splitPourX: null,
    status: "idle",
    tilt: 0,
  };
}

export function useMultiplayerRoom(roomCode, sessionPlayerId = "") {
  const { t } = useTranslation();
  const [room, setRoom] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [startedGame, setStartedGame] = useState(null);
  const [roundSubmissions, setRoundSubmissions] = useState([]);
  const [waterStates, setWaterStates] = useState([]);
  const [connectionError, setConnectionError] = useState("");
  const [kickedMessage, setKickedMessage] = useState("");
  const [closedMessage, setClosedMessage] = useState("");

  const applyStateData = useCallback((data) => {
    const nextRoom = data.room;
    const nextWaterStates = data.waterStates || nextRoom?.waterStates || [];

    setRoom(nextRoom);
    if (nextRoom) {
      setClosedMessage("");
      setConnectionError("");
      setKickedMessage("");
    }
    setStartedGame(
      nextRoom?.status === "completed"
        ? null
        : data.game || nextRoom?.game || null,
    );
    setLeaderboard(data.leaderboard || nextRoom?.leaderboard || null);

    if (nextRoom?.status !== "in_game") {
      setWaterStates([]);
    } else if (Array.isArray(nextWaterStates)) {
      setWaterStates(nextWaterStates);
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const handleRoomState = (nextRoom) => {
      if (nextRoom?.code !== roomCode) return;

      setRoom(nextRoom);
      setClosedMessage("");
      setConnectionError("");
      setKickedMessage("");
      if (nextRoom.status === "in_game" && nextRoom.game) {
        setStartedGame(nextRoom.game);
        if (Array.isArray(nextRoom.waterStates)) {
          setWaterStates(nextRoom.waterStates);
        }
      }
      if (nextRoom.status === "lobby") {
        setStartedGame(null);
        setLeaderboard(null);
        setRoundSubmissions([]);
        setWaterStates([]);
      }
      if (nextRoom.status === "completed") {
        setStartedGame(null);
        setWaterStates([]);
        if (nextRoom.leaderboard) {
          setLeaderboard(nextRoom.leaderboard);
        }
      }
    };

    const handleGameStarted = (payload) => {
      if (!isSameRoom(payload, roomCode)) return;

      setStartedGame(payload.game || null);
      if (payload.room) setRoom(payload.room);
      setLeaderboard(null);
      setRoundSubmissions([]);
      setWaterStates([]);
    };

    const handleScoreboard = (payload) => {
      if (!isSameRoom(payload, roomCode)) return;

      setLeaderboard(payload);
      if (payload.room) setRoom(payload.room);
      setWaterStates([]);
    };

    const handleSubmission = (payload) => {
      if (!isSameRoom(payload, roomCode) || !payload.result) return;

      setRoundSubmissions((current) => {
        const key = `${payload.player?.id}-${payload.result.roundIndex}`;
        const filtered = current.filter(
          (item) => `${item.player?.id}-${item.result?.roundIndex}` !== key,
        );

        return [...filtered, payload];
      });

      const submittedWaterState = getSubmittedWaterState(payload);
      const submittedWaterStateKey = getWaterStateKey(submittedWaterState);
      if (!submittedWaterStateKey) return;

      setWaterStates((current) => {
        const filtered = current.filter(
          (item) => getWaterStateKey(item) !== submittedWaterStateKey,
        );

        return [...filtered, submittedWaterState];
      });
    };

    const handleWaterState = (payload) => {
      if (!isSameRoom(payload, roomCode) || !payload.player?.id) return;

      setWaterStates((current) => {
        const nextItem = { ...payload, receivedAt: Date.now() };
        const nextKey = getWaterStateKey(nextItem);
        if (!nextKey) return current;

        const filtered = current.filter(
          (item) => getWaterStateKey(item) !== nextKey,
        );

        return [...filtered, nextItem];
      });
    };

    const handleKicked = (payload) => {
      if (!isSameRoom(payload, roomCode)) return;

      setKickedMessage(payload.message || t("room.kickedMessage"));
      setRoom(null);
      setStartedGame(null);
      setLeaderboard(null);
      setRoundSubmissions([]);
      setWaterStates([]);
    };

    const handleClosed = (payload) => {
      if (!isSameRoom(payload, roomCode)) return;

      setClosedMessage(payload.message || t("room.closedMessage"));
      setRoom(null);
      setStartedGame(null);
      setLeaderboard(null);
      setRoundSubmissions([]);
      setWaterStates([]);
    };

    const handleConnectError = () => {
      setConnectionError(t("room.couldNotReachServer"));
    };

    const handleConnect = () => {
      setConnectionError("");

      if (!sessionPlayerId) return;

      void emitWithAck("room:getState", {
        playerId: sessionPlayerId,
        roomCode,
      }).then((response) => {
        if (!response?.ok) return;

        applyStateData(responseData(response));
      });
    };

    socket.on("room:state", handleRoomState);
    socket.on("game:started", handleGameStarted);
    socket.on("game:scoreboard", handleScoreboard);
    socket.on("game:leaderboard", handleScoreboard);
    socket.on("game:submissionReceived", handleSubmission);
    socket.on("game:waterState", handleWaterState);
    socket.on("room:playerKicked", handleKicked);
    socket.on("room:closed", handleClosed);
    socket.on("connect_error", handleConnectError);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("room:state", handleRoomState);
      socket.off("game:started", handleGameStarted);
      socket.off("game:scoreboard", handleScoreboard);
      socket.off("game:leaderboard", handleScoreboard);
      socket.off("game:submissionReceived", handleSubmission);
      socket.off("game:waterState", handleWaterState);
      socket.off("room:playerKicked", handleKicked);
      socket.off("room:closed", handleClosed);
      socket.off("connect_error", handleConnectError);
      socket.off("connect", handleConnect);
    };
  }, [applyStateData, roomCode, sessionPlayerId, t]);

  const requestState = useCallback(
    async (playerId) => {
      const response = await emitWithAck("room:getState", {
        playerId,
        roomCode,
      });

      if (response.ok) {
        applyStateData(responseData(response));
      }

      return response;
    },
    [applyStateData, roomCode],
  );

  const joinRoom = useCallback(
    async ({ password = "", playerId, playerName, waterColorId }) => {
      const response = await emitWithAck("room:join", {
        password,
        playerId,
        playerName,
        roomCode,
        waterColorId,
      });

      if (response.ok) {
        const data = responseData(response);
        setRoom(data.room);
        setStartedGame(data.game || data.room?.game || null);
        if (data.room?.status !== "in_game") {
          setWaterStates([]);
        }
      }

      return response;
    },
    [roomCode],
  );

  const leaveRoom = useCallback(
    (playerId) =>
      emitWithAck("room:leave", {
        playerId,
        roomCode,
      }),
    [roomCode],
  );

  const startGame = useCallback(
    async (playerId) => {
      const response = await emitWithAck("room:startGame", {
        playerId,
        roomCode,
      });

      if (response.ok) {
        const data = responseData(response);
        setRoom(data.room);
        setStartedGame(data.game);
        setLeaderboard(null);
        setRoundSubmissions([]);
        setWaterStates([]);
      }

      return response;
    },
    [roomCode],
  );

  const updateSettings = useCallback(
    async (payload) => {
      const response = await emitWithAck("room:updateSettings", {
        ...payload,
        roomCode,
      });

      if (response.ok) {
        const data = responseData(response);
        setRoom(data.room);
      }

      return response;
    },
    [roomCode],
  );

  const updatePlayerColor = useCallback(
    async ({ playerId, waterColorId }) => {
      const response = await emitWithAck("room:updatePlayerColor", {
        playerId,
        roomCode,
        waterColorId,
      });

      if (response.ok) {
        const data = responseData(response);
        setRoom(data.room);
      }

      return response;
    },
    [roomCode],
  );

  const returnToLobby = useCallback(
    async (playerId) => {
      const response = await emitWithAck("room:returnToLobby", {
        playerId,
        roomCode,
      });

      if (response.ok) {
        const data = responseData(response);
        setRoom(data.room);
        setStartedGame(null);
        setLeaderboard(null);
        setRoundSubmissions([]);
        setWaterStates([]);
      }

      return response;
    },
    [roomCode],
  );

  const kickPlayer = useCallback(
    async ({ hostPlayerId, targetPlayerId }) => {
      const response = await emitWithAck("room:kickPlayer", {
        hostPlayerId,
        roomCode,
        targetPlayerId,
      });

      if (response.ok) {
        const data = responseData(response);
        setRoom(data.room);
      }

      return response;
    },
    [roomCode],
  );

  return {
    closedMessage,
    connectionError,
    kickPlayer,
    kickedMessage,
    joinRoom,
    leaderboard,
    leaveRoom,
    requestState,
    returnToLobby,
    room,
    roundSubmissions,
    startGame,
    startedGame,
    updatePlayerColor,
    updateSettings,
    waterStates,
  };
}
