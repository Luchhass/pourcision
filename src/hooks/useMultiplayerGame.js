"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useLanguage";
import { GAME_DIFFICULTIES, GAME_RULE_MODES, MENU_MODES, ROUTES, WATER_COLORS } from "@/lib/constants";
import { emitWithAck, getSocket } from "@/lib/socket";

function responseData(response) {
  return response?.data || response || {};
}

export function useMultiplayerGame({
  gamePayload,
  incomingLeaderboard,
  playerId,
  room,
  roomCode,
}) {
  const { t } = useTranslation();
  const [finishedGameSeed, setFinishedGameSeed] = useState(null);
  const [localLeaderboard, setLocalLeaderboard] = useState(null);
  const [error, setError] = useState("");
  const activeGame = gamePayload || room?.game || null;
  const hasFinishedGame = Boolean(activeGame?.seed && finishedGameSeed === activeGame.seed);
  const visibleLeaderboard =
    localLeaderboard && (!activeGame || localLeaderboard.seed === activeGame.seed)
      ? localLeaderboard.data
      : incomingLeaderboard;
  const currentPlayer = room?.players?.find((player) => player.id === playerId);

  const gameSettings = useMemo(
    () => ({
      difficulty: activeGame?.difficulty || room?.difficulty || GAME_DIFFICULTIES.NORMAL,
      mode: MENU_MODES.MULTIPLAYER,
      modeQueue: activeGame?.modeQueue || null,
      route: ROUTES.MULTIPLAYER,
      ruleMode: activeGame?.ruleMode || room?.ruleMode || GAME_RULE_MODES.CLASSIC,
      targetSeed: activeGame?.seed || null,
      waterColorId:
        activeGame?.playerWaterColorIds?.[playerId] ||
        currentPlayer?.waterColorId ||
        activeGame?.waterColorId ||
        WATER_COLORS[0].id,
    }),
    [activeGame, currentPlayer?.waterColorId, playerId, room],
  );

  const submitRoundResult = useCallback(
    async (result) => {
      if (!playerId) return { ok: false, error: t("room.playerNotInLobby") };

      setError("");
      const response = await emitWithAck("game:submitGuess", {
        level: result.level,
        bandLevels: result.bandLevels,
        playerId,
        roomCode,
        roundIndex: result.roundIndex,
        splitLevels: result.splitLevels,
      });

      if (!response.ok) {
        setError(response.error || t("room.couldNotStart"));
        return response;
      }

      const data = responseData(response);
      if (data.completed && data.leaderboard) {
        setLocalLeaderboard({
          data: data.leaderboard,
          seed: activeGame?.seed || null,
        });
      }

      return response;
    },
    [activeGame?.seed, playerId, roomCode, t],
  );

  const publishWaterState = useCallback(
    (waterState) => {
      if (!playerId || !roomCode) return;

      const socket = getSocket();
      if (!socket?.connected) return;

      socket.emit("game:waterState", {
        ...waterState,
        playerId,
        roomCode,
      });
    },
    [playerId, roomCode],
  );

  const markComplete = useCallback(async () => {
    setFinishedGameSeed(activeGame?.seed || null);

    if (!playerId || !roomCode) return { ok: false };

    setError("");
    const response = await emitWithAck("game:showScoreboard", {
      playerId,
      roomCode,
    });

    if (!response.ok) {
      setError(response.error || t("room.couldNotStart"));
      return response;
    }

    const data = responseData(response);
    if (data.completed && data.leaderboard) {
      setLocalLeaderboard({
        data: data.leaderboard,
        seed: activeGame?.seed || null,
      });
    }

    return response;
  }, [activeGame?.seed, playerId, roomCode, t]);

  const resetForLobby = useCallback(() => {
    setError("");
    setFinishedGameSeed(null);
    setLocalLeaderboard(null);
  }, []);

  return {
    activeGame,
    error,
    gameSettings,
    hasFinishedGame,
    markComplete,
    publishWaterState,
    resetForLobby,
    submitRoundResult,
    visibleLeaderboard,
  };
}
