"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useLanguage";
import { createPlayerId, useRoomSession } from "@/hooks/useRoomSession";
import { useMultiplayerRoom } from "@/hooks/useMultiplayerRoom";
import { useRedeemCodes } from "@/hooks/useRedeemCodes";
import {
  playActiveScreenExit,
  playGameStartScreenExit,
  playScoreboardScreenExit,
} from "@/hooks/useScreenReveal";
import { trackEvent } from "@/lib/analytics";
import { resolveWaterColorId, ROUTES } from "@/lib/constants";
import { fadeOutMusic } from "@/lib/music";
import {
  getFallbackWaterColorId,
  getWaterColorPreferenceSnapshot,
  saveStoredWaterColorId,
  subscribeToWaterColorPreference,
} from "@/lib/waterColorPreference";
import JoinRoomCard from "./JoinRoomCard";
import LobbyCard, { LobbyWaterColorPanel } from "./LobbyCard";
import MultiplayerGame from "./MultiplayerGame";
import RoomCardShell from "./RoomCardShell";
import RoomMessageCard from "./RoomMessageCard";
import WaitingCard from "./WaitingCard";
import ScoreboardScreen from "@/components/sections/scoreboard/ScoreboardScreen";

const ROOM_CODE_PATTERN = /^\d{6}$/;

function subscribeToHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

function responseData(response) {
  return response?.data || response || {};
}

function findRoomPlayer(room, playerId) {
  return room?.players?.find((roomPlayer) => roomPlayer.id === playerId) || null;
}

function canJoinRoom(room) {
  return room?.status === "lobby" || room?.status === "in_game";
}

async function copyInviteLink(roomCode) {
  if (!navigator.clipboard) {
    throw new Error("Clipboard unavailable");
  }

  await navigator.clipboard.writeText(`${window.location.origin}/${roomCode}`);
}

function roomViewFromState({ activeGame, leaderboard, room, sessionPlayer }) {
  if (!sessionPlayer) return canJoinRoom(room) ? "join" : "not-found";
  if (room?.status === "lobby") return "lobby";
  if (room?.status === "completed" && sessionPlayer.returnedToLobby) {
    return "lobby";
  }
  if (leaderboard || room?.status === "completed") return "leaderboard";
  if (activeGame || room?.status === "in_game") return "game";

  return "lobby";
}

function canStartLobbyGame(room) {
  return (
    room?.status === "lobby" &&
    room.players?.every((roomPlayer) => !roomPlayer.returnedToLobby)
  );
}

export default function MultiplayerRoomClient({ roomCode }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { visibleWaterColors } = useRedeemCodes();
  const { clearSession, isLoaded, saveSession, session } = useRoomSession(roomCode);
  const {
    closedMessage,
    connectionError,
    joinRoom,
    kickPlayer,
    kickedMessage,
    leaderboard,
    leaveRoom,
    requestState,
    returnToLobby,
    room,
    startGame,
    startedGame,
    updatePlayerColor,
    updateSettings,
    waterStates,
  } = useMultiplayerRoom(roomCode, session?.playerId);
  const bootstrappedRef = useRef(false);
  const gameEntryTransitionPendingRef = useRef("");
  const scoreboardEntryTransitionPendingRef = useRef("");
  const [error, setError] = useState("");
  const [gameEntryReadyKey, setGameEntryReadyKey] = useState("");
  const [scoreboardEntryReadyKey, setScoreboardEntryReadyKey] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isReturningLobby, setIsReturningLobby] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isUpdatingPlayerColor, setIsUpdatingPlayerColor] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isLobbySettingsOpen, setIsLobbySettingsOpen] = useState(false);
  const [player, setPlayer] = useState(null);
  const [previousRoomStatus, setPreviousRoomStatus] = useState(null);
  const [view, setView] = useState("loading");
  const storedPreferredWaterColorId = useSyncExternalStore(
    subscribeToWaterColorPreference,
    getWaterColorPreferenceSnapshot,
    getFallbackWaterColorId,
  );
  const hasHydratedClient = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const preferredWaterColorId = hasHydratedClient
    ? storedPreferredWaterColorId
    : getFallbackWaterColorId();
  const playerId = player?.playerId || "";
  const currentPlayer = findRoomPlayer(room, playerId);
  const activeGame = startedGame || room?.game;
  const activeGameTransitionKey = activeGame
    ? [roomCode, activeGame.seed || room?.game?.seed || "game"].join(":")
    : "";
  const leaderboardPlayers =
    leaderboard?.players ||
    leaderboard?.leaderboard?.players ||
    (Array.isArray(leaderboard?.leaderboard) ? leaderboard.leaderboard : []);
  const scoreboardEntryKey = leaderboard || room?.status === "completed"
    ? [
        roomCode,
        activeGame?.seed || room?.game?.seed || "completed",
        leaderboardPlayers.length,
        leaderboardPlayers
          .map((row) => `${row.id || row.playerId || row.name}:${row.score ?? row.totalScore ?? 0}`)
          .join("|"),
      ].join(":")
    : "";

  useEffect(() => {
    if (!session || (!kickedMessage && !closedMessage)) return;

    clearSession();
  }, [clearSession, closedMessage, kickedMessage, session]);

  useEffect(() => {
    if (!isLoaded || bootstrappedRef.current) return;

    bootstrappedRef.current = true;

    const bootstrap = async () => {
      if (!ROOM_CODE_PATTERN.test(roomCode)) {
        setView("not-found");
        return;
      }

      const response = await requestState(session?.playerId);

      if (!response.ok) {
        setError(response.error || t("room.lobbyNotFound"));
        setView("not-found");
        return;
      }

      const data = responseData(response);
      const sessionRoomPlayer = findRoomPlayer(data.room, session?.playerId);

      if (session?.playerId && sessionRoomPlayer) {
        setPlayer(session);
        setView(
          roomViewFromState({
            activeGame: data.game || data.room?.game,
            leaderboard: data.leaderboard,
            room: data.room,
            sessionPlayer: sessionRoomPlayer,
          }),
        );
        return;
      }

      setView(canJoinRoom(data.room) ? "join" : "not-found");
    };

    void bootstrap();
  }, [isLoaded, requestState, roomCode, session, t]);

  const handleBackHome = useCallback(async () => {
    await playActiveScreenExit();
    setIsLobbySettingsOpen(false);

    if (playerId) {
      await leaveRoom(playerId);
    }

    clearSession();
    router.push(ROUTES.HOME);
  }, [clearSession, leaveRoom, playerId, router]);

  const handleJoin = async (playerName, password = "") => {
    setIsJoining(true);
    setError("");
    const resolvedWaterColorId = resolveWaterColorId(preferredWaterColorId, {
      excludeIds:
        room?.players?.map((roomPlayer) => roomPlayer.waterColorId).filter(Boolean) ||
        [],
    });

    const nextPlayer = {
      isHost: false,
      playerId: createPlayerId(),
      playerName: playerName.trim() || t("room.defaultPlayer"),
      roomCode,
      waterColorId: resolvedWaterColorId,
    };
    const response = await joinRoom({
      ...nextPlayer,
      password,
    });

    setIsJoining(false);

    if (!response.ok) {
      setError(response.error || t("room.joinFailed"));
      return;
    }

    const data = responseData(response);
    trackEvent("lobby_join", {
      difficulty: data.room?.difficulty,
      game_mode: data.room?.ruleMode || data.room?.mode,
      game_type: "multiplayer",
    });
    await playActiveScreenExit();
    setIsLobbySettingsOpen(false);
    saveSession(nextPlayer);
    setPlayer(nextPlayer);
    setView(data.room?.status === "in_game" ? "game" : "lobby");
  };

  const handleCopyInvite = async () => {
    setError("");

    try {
      await copyInviteLink(roomCode);
    } catch {
      setError(t("room.couldNotCopy"));
    }
  };

  const handleStart = async () => {
    if (!currentPlayer) return;
    if (!canStartLobbyGame(room)) {
      setError(t("room.waitingLobbyReturn"));
      return;
    }

    setIsStarting(true);
    setError("");
    const response = await startGame(currentPlayer.id);
    setIsStarting(false);

    if (!response.ok) {
      setError(response.error || t("room.couldNotStart"));
      return;
    }

    trackEvent("multiplayer_game_start", {
      difficulty: room?.difficulty,
      game_mode: room?.ruleMode || room?.mode,
      game_type: "multiplayer",
      player_count: room?.players?.length || 0,
    });
    setIsLobbySettingsOpen(false);
    setView("game");
  };

  const handleKickPlayer = async (targetPlayerId) => {
    if (!currentPlayer) return;

    setError("");
    const response = await kickPlayer({
      hostPlayerId: currentPlayer.id,
      targetPlayerId,
    });

    if (!response.ok) {
      setError(response.error || t("room.couldNotKick"));
    }
  };

  const handleUpdateSettings = async (settings) => {
    if (!currentPlayer) return;

    setIsUpdatingSettings(true);
    setError("");
    const response = await updateSettings({
      playerId: currentPlayer.id,
      ...settings,
    });
    setIsUpdatingSettings(false);

    if (!response.ok) {
      setError(response.error || t("room.couldNotUpdateSettings"));
    }
  };

  const handleUpdatePlayerColor = async (waterColorId) => {
    if (!currentPlayer) return;
    const resolvedWaterColorId = resolveWaterColorId(waterColorId, {
      excludeIds:
        room?.players
          ?.filter((roomPlayer) => roomPlayer.id !== currentPlayer.id)
          .map((roomPlayer) => roomPlayer.waterColorId)
          .filter(Boolean) || [],
    });

    setIsUpdatingPlayerColor(true);
    setError("");
    const response = await updatePlayerColor({
      playerId: currentPlayer.id,
      waterColorId: resolvedWaterColorId,
    });
    setIsUpdatingPlayerColor(false);

    if (!response.ok) {
      setError(response.error || t("room.couldNotUpdateSettings"));
      return;
    }

    saveStoredWaterColorId(waterColorId);
    if (session) {
      saveSession({ ...session, waterColorId: resolvedWaterColorId });
    }
  };

  const handleReturnToLobby = async () => {
    if (!currentPlayer) return { ok: false };

    setIsReturningLobby(true);
    setError("");
    const response = await returnToLobby(currentPlayer.id);
    setIsReturningLobby(false);

    if (!response.ok) {
      setError(response.error || t("room.couldNotReturnToLobby"));
      return response;
    }

    const data = responseData(response);
    setIsLobbySettingsOpen(false);
    setView("lobby");
    return response;
  };

  let computedEffectiveView = view;
  if (kickedMessage) {
    computedEffectiveView = "kicked";
  } else if (closedMessage) {
    computedEffectiveView = "closed";
  } else if (player && room && currentPlayer) {
    computedEffectiveView = roomViewFromState({
      activeGame,
      leaderboard,
      room,
      sessionPlayer: currentPlayer,
    });
  }
  const shouldGateGameEntry =
    previousRoomStatus === "lobby" &&
    room?.status === "in_game" &&
    Boolean(activeGameTransitionKey) &&
    gameEntryReadyKey !== activeGameTransitionKey;
  const shouldGateScoreboardEntry =
    previousRoomStatus === "in_game" &&
    computedEffectiveView === "leaderboard" &&
    Boolean(scoreboardEntryKey) &&
    scoreboardEntryReadyKey !== scoreboardEntryKey;
  const effectiveView = shouldGateGameEntry || shouldGateScoreboardEntry
    ? shouldGateGameEntry
      ? "lobby"
      : "game"
    : computedEffectiveView;

  useEffect(() => {
    if (!shouldGateGameEntry || !activeGameTransitionKey) return undefined;
    if (gameEntryTransitionPendingRef.current === activeGameTransitionKey) {
      return undefined;
    }

    let cancelled = false;
    gameEntryTransitionPendingRef.current = activeGameTransitionKey;

    fadeOutMusic();
    playGameStartScreenExit().then(() => {
      if (cancelled) return;

      gameEntryTransitionPendingRef.current = "";
      setGameEntryReadyKey(activeGameTransitionKey);
    });

    return () => {
      cancelled = true;
    };
  }, [activeGameTransitionKey, shouldGateGameEntry]);

  useEffect(() => {
    if (!shouldGateScoreboardEntry || !scoreboardEntryKey) return undefined;
    if (scoreboardEntryTransitionPendingRef.current === scoreboardEntryKey) {
      return undefined;
    }

    let cancelled = false;
    scoreboardEntryTransitionPendingRef.current = scoreboardEntryKey;

    playScoreboardScreenExit().then(() => {
      if (cancelled) return;

      scoreboardEntryTransitionPendingRef.current = "";
      setScoreboardEntryReadyKey(scoreboardEntryKey);
    });

    return () => {
      cancelled = true;
    };
  }, [scoreboardEntryKey, shouldGateScoreboardEntry]);

  useEffect(() => {
    if (shouldGateGameEntry || shouldGateScoreboardEntry) return undefined;

    const nextStatus = room?.status || null;
    const timerId = window.setTimeout(() => {
      setPreviousRoomStatus((currentStatus) =>
        currentStatus === nextStatus ? currentStatus : nextStatus,
      );
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [room?.status, shouldGateGameEntry, shouldGateScoreboardEntry]);

  const shellTitle =
    effectiveView === "leaderboard"
      ? t("results.title")
      : t("setup.multiplayerTitle");
  const lobbyRuleMode = room?.ruleMode || room?.mode;
  const lobbySettingsDescription =
    room && lobbyRuleMode && room.difficulty
      ? [
          t("setup.singleplayerModeDescription", {
            mode: t(`modes.${lobbyRuleMode}.label`),
            modeDescription: t(`modes.${lobbyRuleMode}.description`),
          }),
          t("setup.singleplayerDifficultyDescription", {
            difficulty: t(`difficulties.${room.difficulty}.label`),
            difficultyDescription: t(`difficulties.${room.difficulty}.description`),
          }),
        ]
      : null;
  const shouldUseLobbySettingsDescription =
    lobbySettingsDescription &&
    (effectiveView === "lobby" ||
      (effectiveView === "loading" && Boolean(room)));
  const shellDescription =
    effectiveView === "leaderboard"
      ? t("room.resultsDescription")
      : effectiveView === "not-found"
        ? error || connectionError || t("room.lobbyNotFound")
      : shouldUseLobbySettingsDescription
        ? lobbySettingsDescription
      : effectiveView === "loading"
        ? connectionError || t("room.findingLobby")
      : effectiveView === "kicked"
        ? kickedMessage || t("room.kickedMessage")
      : effectiveView === "closed"
        ? closedMessage || t("room.closedMessage")
      : effectiveView === "waiting-lobby"
        ? t("room.waitingLobbyReturn")
      : t("room.multiplayerDescription");
  const roomPlayers = room?.players || [];
  const activeRoomPlayers = roomPlayers.filter(
    (roomPlayer) => !roomPlayer.kicked && !roomPlayer.inactive,
  );
  const waitingLobbyPlayers = activeRoomPlayers.length
    ? activeRoomPlayers
    : roomPlayers;
  const waitingLobbyTotalCount = waitingLobbyPlayers.length;
  const waitingLobbyRemainingCount = waitingLobbyPlayers.filter(
    (roomPlayer) => !roomPlayer.returnedToLobby,
  ).length;
  const currentPlayerWaterColorId = currentPlayer?.waterColorId;
  const playerFallbackWaterColorId =
    currentPlayerWaterColorId ||
    session?.waterColorId ||
    preferredWaterColorId;
  const shellWaterColorId =
    effectiveView === "waiting-lobby"
      ? playerFallbackWaterColorId
      : currentPlayerWaterColorId ||
        session?.waterColorId ||
        preferredWaterColorId;
  const shouldStretchWaterContent =
    effectiveView === "lobby" ||
    effectiveView === "waiting-lobby" ||
    effectiveView === "not-found" ||
    effectiveView === "loading" ||
    effectiveView === "kicked" ||
    effectiveView === "closed";
  const takenWaterColorIds =
    room?.players
      ?.filter((roomPlayer) => roomPlayer.id !== currentPlayer?.id)
      .map((roomPlayer) => roomPlayer.waterColorId)
      .filter(Boolean) || [];
  const lobbyWaterColorPanel =
    effectiveView === "lobby" && room && currentPlayer ? (
      <LobbyWaterColorPanel
        colors={visibleWaterColors}
        disabled={isUpdatingPlayerColor}
        label={t("setup.waterColor")}
        onChange={handleUpdatePlayerColor}
        takenColorIds={takenWaterColorIds}
        value={currentPlayerWaterColorId}
      />
    ) : null;

  if (effectiveView === "game" && player && room && activeGame) {
    return (
      <MultiplayerGame
        error={error || connectionError}
        gamePayload={activeGame}
        isReturningLobby={isReturningLobby}
        leaderboard={shouldGateScoreboardEntry ? null : leaderboard}
        onBackLobby={handleReturnToLobby}
        onLeave={handleBackHome}
        playerId={playerId}
        room={room}
        roomCode={roomCode}
        waterStates={waterStates}
      />
    );
  }

  if (effectiveView === "leaderboard") {
    return (
      <ScoreboardScreen
        currentPlayerId={playerId}
        error={error || connectionError}
        isReturningLobby={isReturningLobby}
        leaderboard={leaderboard}
        onMenu={handleBackHome}
        onPlayAgain={handleReturnToLobby}
        playAgainLabel={t("room.returnLobby")}
        results={[]}
        settings={{
          difficulty: room?.difficulty,
          roundCount: room?.roundCount,
          ruleMode: room?.ruleMode,
          waterColorId: currentPlayerWaterColorId || preferredWaterColorId,
        }}
      />
    );
  }

  return (
    <RoomCardShell
      description={shellDescription}
      leftContent={lobbyWaterColorPanel}
      onBackHome={handleBackHome}
      revealKey={effectiveView}
      title={shellTitle}
      waterContentPlacement={shouldStretchWaterContent ? "start" : "end"}
      waterColorId={shellWaterColorId}
    >
      {effectiveView === "loading" ? (
        <RoomMessageCard
          onBackHome={handleBackHome}
          title={t("common.loading")}
          variant="minimal"
        />
      ) : null}

      {effectiveView === "not-found" ? (
        <RoomMessageCard
          onBackHome={handleBackHome}
          title={t("room.lobby")}
          variant="minimal"
        />
      ) : null}

      {effectiveView === "kicked" ? (
        <RoomMessageCard
          onBackHome={handleBackHome}
          title={t("room.kicked")}
          variant="minimal"
        />
      ) : null}

      {effectiveView === "closed" ? (
        <RoomMessageCard
          onBackHome={handleBackHome}
          title={t("room.lobby")}
          variant="minimal"
        />
      ) : null}

      {effectiveView === "join" ? (
        <JoinRoomCard
          error={error || connectionError}
          isJoining={isJoining}
          onJoin={handleJoin}
          room={room}
        />
      ) : null}

      {effectiveView === "lobby" && room && currentPlayer ? (
        <LobbyCard
          currentPlayer={currentPlayer}
          error={error || connectionError}
          isStarting={isStarting}
          isUpdatingPlayerColor={isUpdatingPlayerColor}
          isUpdatingSettings={isUpdatingSettings}
          canStartGame={canStartLobbyGame(room)}
          onCopyInvite={handleCopyInvite}
          onDifficultyChange={(difficulty) => handleUpdateSettings({ difficulty })}
          onKickPlayer={handleKickPlayer}
          onRoundCountChange={(roundCount) => handleUpdateSettings({ roundCount })}
          onRuleModeChange={(ruleMode) => handleUpdateSettings({ ruleMode })}
          onSettingsOpenChange={setIsLobbySettingsOpen}
          onStart={handleStart}
          onWaterColorChange={handleUpdatePlayerColor}
          room={room}
          takenColorIds={takenWaterColorIds}
        />
      ) : null}

      {effectiveView === "waiting-lobby" ? (
        <WaitingCard
          onLeave={handleBackHome}
          remainingCount={waitingLobbyRemainingCount}
          totalCount={waitingLobbyTotalCount}
        />
      ) : null}

    </RoomCardShell>
  );
}
