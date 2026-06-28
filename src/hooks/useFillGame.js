"use client";

import {
  GAME_PHASES,
  POUR_STATUSES,
  useSingleplayerGame,
} from "@/hooks/useSingleplayerGame";

export default function useFillGame(options) {
  const game = useSingleplayerGame(options);
  const status =
    game.phase === GAME_PHASES.FINAL ? POUR_STATUSES.COMPLETE : game.pourStatus;

  return {
    advanceRound: game.continueFromResult,
    bandAttemptIndex: game.bandAttemptIndex,
    bandLevels: game.bandLevels,
    bandTargets: game.bandTargets,
    bestDiff: game.summary.bestDiff,
    chargePowerRef: game.chargePowerRef,
    completeIntro: game.finishIntro,
    fakeTarget: game.fakeTarget,
    finishRound: game.submitRound,
    gameMode: game.gameMode,
    isChaosQueue: game.isChaosQueue,
    isEndless: game.isEndless,
    isFinalRound: game.isFinalRound,
    lastResult: game.lastResult,
    mode: game.gameMode,
    modeAllowsDone: game.modeAllowsDone,
    phase: game.phase,
    pourStatus: game.pourStatus,
    results: game.results,
    roundCount: game.roundCount,
    roundIndex: game.roundIndex,
    showTargetGuide: game.showTargetGuide,
    splitTargets: game.splitTargets,
    startFilling: game.startPour,
    status,
    stopFilling: game.stopPour,
    target: game.target,
    timeLeftMs: game.timeLeftMs,
  };
}
