"use client";

import { useEffect, useRef } from "react";
import GameplayScreen from "@/components/sections/gameplay/GameplayScreen";
import ScoreboardScreen from "@/components/sections/scoreboard/ScoreboardScreen";
import { useTranslation } from "@/hooks/useLanguage";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { playActiveScreenExit } from "@/hooks/useScreenReveal";
import { trackMatchEnd, trackMatchStart } from "@/lib/analytics";
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
  const startTrackedRef = useRef("");
  const game = useMultiplayerGame({
    gamePayload,
    incomingLeaderboard: leaderboard,
    playerId,
    room,
    roomCode,
  });
  const activeRoomPlayers =
    room?.players?.filter(
      (roomPlayer) => !roomPlayer.kicked && roomPlayer.connected !== false,
    ) || [];
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
    const totalScore = currentPlayer?.score ?? currentPlayer?.totalScore ?? 0;

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

  if (game.activeGame && !game.visibleLeaderboard && !game.hasFinishedGame) {
    return (
      <GameplayScreen
        gameTargets={game.activeGame.targets}
        isMultiplayer
        onComplete={game.markComplete}
        onExit={onLeave}
        onRoundResult={game.submitRoundResult}
        onWaterState={game.publishWaterState}
        opponentWaterStates={waterStates}
        playerId={playerId}
        settings={game.gameSettings}
      />
    );
  }

  if (game.visibleLeaderboard) {
    return (
      <ScoreboardScreen
        currentPlayerId={playerId}
        error={error || game.error}
        isReturningLobby={isReturningLobby}
        leaderboard={game.visibleLeaderboard}
        onMenu={onLeave}
        onPlayAgain={handleBackLobby}
        playAgainLabel={t("room.returnLobby")}
        results={[]}
        settings={game.gameSettings}
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
