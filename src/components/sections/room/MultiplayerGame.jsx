"use client";

import { useEffect, useRef, useState } from "react";
import GameplayScreen from "@/components/sections/gameplay/GameplayScreen";
import ScoreboardScreen from "@/components/sections/scoreboard/ScoreboardScreen";
import { useTranslation } from "@/hooks/useLanguage";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import {
  playActiveScreenExit,
  playScoreboardScreenExit,
  requestNextFullScreenReveal,
} from "@/hooks/useScreenReveal";
import { trackMatchEnd, trackMatchStart } from "@/lib/analytics";
import { normalizeTotalScore } from "@/lib/scoring";
import RoomCardShell from "./RoomCardShell";
import WaitingCard from "./WaitingCard";

function getLeaderboardPlayers(leaderboard) {
  if (!leaderboard) return [];
  if (Array.isArray(leaderboard.players)) return leaderboard.players;
  if (Array.isArray(leaderboard.leaderboard)) return leaderboard.leaderboard;
  if (Array.isArray(leaderboard.leaderboard?.players)) {
    return leaderboard.leaderboard.players;
  }

  return [];
}

function getLeaderboardRevealKey(leaderboard, trackedGameKey) {
  if (!leaderboard) return "";

  const players = getLeaderboardPlayers(leaderboard);

  return [
    trackedGameKey,
    players.length,
    players
      .map((row) => `${row.id || row.playerId || row.name}:${row.score ?? row.totalScore ?? 0}`)
      .join("|"),
  ].join(":");
}

function responseData(response) {
  return response?.data || response || {};
}

export default function MultiplayerGame({
  error = "",
  gamePayload,
  isReturningLobby = false,
  leaderboard,
  onBackLobby,
  onLeave,
  playerId,
  room,
  roomCode,
  waterStates,
}) {
  const { t } = useTranslation();
  const completionTrackedRef = useRef("");
  const scoreboardTransitionPendingRef = useRef("");
  const startTrackedRef = useRef("");
  const [isFinalFinisherScoreboardPending, setIsFinalFinisherScoreboardPending] =
    useState(false);
  const [revealedLeaderboardState, setRevealedLeaderboardState] =
    useState(null);
  const game = useMultiplayerGame({
    gamePayload,
    incomingLeaderboard: leaderboard,
    playerId,
    room,
    roomCode,
  });
  const activeRoomPlayers =
    room?.players?.filter(
      (roomPlayer) => !roomPlayer.kicked && !roomPlayer.inactive,
    ) || [];
  const currentPlayer =
    room?.players?.find((roomPlayer) => roomPlayer.id === playerId) || null;
  const isWaitingForNextGame =
    Boolean(game.activeGame) &&
    Boolean(currentPlayer) &&
    (currentPlayer.waitingForNextGame || currentPlayer.inactive);
  const waitingPlayers = activeRoomPlayers.length
    ? activeRoomPlayers
    : room?.players || [];
  const waitingPlayerTotalCount = waitingPlayers.length;
  const waitingPlayerRemainingCount = waitingPlayers.filter(
    (roomPlayer) => !roomPlayer.submitted,
  ).length;
  const activeGameSeed = game.activeGame?.seed || gamePayload?.seed || room?.game?.seed;
  const trackedGameKey = [
    activeGameSeed,
    game.gameSettings.difficulty,
    game.gameSettings.ruleMode,
  ].join(":");
  const visibleLeaderboardKey = getLeaderboardRevealKey(
    game.visibleLeaderboard,
    trackedGameKey,
  );
  const revealedLeaderboard =
    game.visibleLeaderboard &&
    revealedLeaderboardState?.key === visibleLeaderboardKey
      ? revealedLeaderboardState.data
      : null;
  const isFinalFinisherCandidate =
    activeRoomPlayers.length > 0 &&
    activeRoomPlayers
      .filter((roomPlayer) => roomPlayer.id !== playerId)
      .every((roomPlayer) => roomPlayer.submitted);

  useEffect(() => {
    if (!game.activeGame || !activeGameSeed) return;
    if (startTrackedRef.current === trackedGameKey) return;

    startTrackedRef.current = trackedGameKey;
    trackMatchStart({
      difficulty: game.gameSettings.difficulty,
      gameMode: game.gameSettings.ruleMode,
      gameType: "multiplayer",
    });
  }, [
    activeGameSeed,
    game.activeGame,
    game.gameSettings.difficulty,
    game.gameSettings.ruleMode,
    trackedGameKey,
  ]);

  useEffect(() => {
    if (!game.visibleLeaderboard || completionTrackedRef.current === trackedGameKey) {
      return;
    }

    const players = getLeaderboardPlayers(game.visibleLeaderboard);
    const currentPlayer =
      players.find((row) => row.id === playerId || row.playerId === playerId) ||
      players[0];
    const rounds =
      game.visibleLeaderboard.totalRounds ||
      game.visibleLeaderboard.roundCount ||
      currentPlayer?.results?.length ||
      0;
    const totalScore = normalizeTotalScore(
      currentPlayer?.score ?? currentPlayer?.totalScore ?? 0,
    );

    completionTrackedRef.current = trackedGameKey;
    trackMatchEnd({
      averageScore: rounds ? totalScore / rounds : 0,
      difficulty: game.gameSettings.difficulty,
      gameMode: game.gameSettings.ruleMode,
      gameType: "multiplayer",
      rounds,
      totalScore,
    });
  }, [
    game.gameSettings.difficulty,
    game.gameSettings.ruleMode,
    game.visibleLeaderboard,
    playerId,
    trackedGameKey,
  ]);

  useEffect(() => {
    if (!game.visibleLeaderboard) {
      scoreboardTransitionPendingRef.current = "";
      return undefined;
    }

    if (revealedLeaderboardState?.key === visibleLeaderboardKey) {
      return undefined;
    }
    if (scoreboardTransitionPendingRef.current === visibleLeaderboardKey) {
      return undefined;
    }

    let cancelled = false;
    scoreboardTransitionPendingRef.current = visibleLeaderboardKey;

    playScoreboardScreenExit().then(() => {
      if (cancelled) return;

      scoreboardTransitionPendingRef.current = "";
      setRevealedLeaderboardState({
        data: game.visibleLeaderboard,
        key: visibleLeaderboardKey,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [game.visibleLeaderboard, revealedLeaderboardState?.key, visibleLeaderboardKey]);

  const handleGameComplete = async () => {
    const shouldBypassWaiting = isFinalFinisherCandidate;

    setIsFinalFinisherScoreboardPending(shouldBypassWaiting);
    requestNextFullScreenReveal();
    const response = await game.markComplete({
      deferFinishedState: shouldBypassWaiting,
    });

    const data = responseData(response);
    if (response.ok && shouldBypassWaiting && data.completed && data.leaderboard) {
      setRevealedLeaderboardState({
        data: data.leaderboard,
        key: getLeaderboardRevealKey(data.leaderboard, trackedGameKey),
      });
    }

    setIsFinalFinisherScoreboardPending(false);
    return response;
  };

  const handleBackLobby = async () => {
    const response = await onBackLobby?.();
    if (response?.ok !== false) {
      game.resetForLobby();
    }
  };
  const handleLeave = async () => {
    await playActiveScreenExit();
    onLeave?.();
  };

  if (
    game.activeGame &&
    !game.visibleLeaderboard &&
    !game.hasFinishedGame &&
    !isWaitingForNextGame
  ) {
    return (
      <GameplayScreen
        animateCompleteExit
        gameTargets={game.activeGame.targets}
        isMultiplayer
        onComplete={handleGameComplete}
        onExit={onLeave}
        onRoundResult={game.submitRoundResult}
        onWaterState={game.publishWaterState}
        opponentWaterStates={waterStates}
        playerId={playerId}
        settings={game.gameSettings}
      />
    );
  }

  if (
    game.activeGame &&
    !revealedLeaderboard &&
    !isFinalFinisherScoreboardPending
  ) {
    return (
      <RoomCardShell
        description={error || game.error || t("room.waitingPlayers")}
        onBackHome={handleLeave}
        revealKey="waiting-active-game"
        title={t("setup.multiplayerTitle")}
        waterColorId={game.gameSettings.waterColorId}
        waterContentPlacement="start"
      >
        <WaitingCard
          onLeave={handleLeave}
          remainingCount={waitingPlayerRemainingCount}
          totalCount={waitingPlayerTotalCount}
        />
      </RoomCardShell>
    );
  }

  if (revealedLeaderboard) {
    return (
      <ScoreboardScreen
        currentPlayerId={playerId}
        error={error || game.error}
        isReturningLobby={isReturningLobby}
        leaderboard={revealedLeaderboard}
        onMenu={onLeave}
        onPlayAgain={handleBackLobby}
        playAgainLabel={t("room.returnLobby")}
        results={[]}
        settings={game.gameSettings}
      />
    );
  }

  if (isFinalFinisherScoreboardPending) {
    return (
      <main
        aria-busy="true"
        className="relative h-dvh min-h-dvh overflow-hidden bg-[#050504] text-[#f7f7f2]"
      />
    );
  }

  return (
    <RoomCardShell
      description={error || game.error || t("room.waitingPlayers")}
      onBackHome={handleLeave}
      revealKey="waiting-game"
      title={t("setup.multiplayerTitle")}
      waterColorId={game.gameSettings.waterColorId}
      waterContentPlacement="start"
    >
      <WaitingCard
        onLeave={handleLeave}
        remainingCount={waitingPlayerRemainingCount}
        totalCount={waitingPlayerTotalCount}
      />
    </RoomCardShell>
  );
}
