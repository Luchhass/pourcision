"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHAOS_QUEUE_MODE_POOL,
  GAME_ROUND_COUNT,
  GAME_RULE_MODES,
  LEAKY_ROUND_MS,
} from "@/lib/constants";
import { gameModeAllowsManualDone, gameModeIsOneHold } from "@/lib/gameMode";
import { calculateRoundResult } from "@/lib/scoring";
import {
  createFakeTarget,
  createRoundTargets,
  createSeededRandom,
  createSplitTargets,
} from "@/lib/targets";

export const GAME_PHASES = {
  INTRO: "intro",
  POUR: "pour",
  RESULT: "result",
  FINAL: "final",
};

export const POUR_STATUSES = {
  INTRO: "intro",
  IDLE: "idle",
  FILLING: "filling",
  SETTLING: "settling",
  LEAKING: "leaking",
  RESULT: "result",
  COMPLETE: "complete",
};

const FULL_LEVEL_LOCK = 99.95;
const EMPTY_LEVEL_LOCK = 0.05;
const SETTLING_MIN_MS = 700;
const SETTLING_MAX_MS = 2400;
const CHAOS_ELIGIBLE_MODE_POOL = CHAOS_QUEUE_MODE_POOL.filter(
  (mode) => mode !== GAME_RULE_MODES.ENDLESS,
);

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function normalizeRoundTarget(roundTarget) {
  if (!roundTarget) return null;

  return {
    fakeTarget:
      typeof roundTarget.fakeTarget === "number"
        ? roundTarget.fakeTarget
        : createFakeTarget(roundTarget.target),
    splitTargets: Array.isArray(roundTarget.splitTargets)
      ? roundTarget.splitTargets
      : createSplitTargets(),
    target: roundTarget.target,
  };
}

function createChaosModes(seed, roundCount) {
  const random = createSeededRandom(seed || "chaos-queue");

  return Array.from({ length: roundCount }, () => {
    const index = Math.floor(random() * CHAOS_ELIGIBLE_MODE_POOL.length);
    return CHAOS_ELIGIBLE_MODE_POOL[index] ?? GAME_RULE_MODES.CLASSIC;
  });
}

function sanitizeChaosModeQueue(modeQueue) {
  if (!Array.isArray(modeQueue)) return null;

  return modeQueue.map((mode) =>
    mode === GAME_RULE_MODES.ENDLESS ? GAME_RULE_MODES.CLASSIC : mode,
  );
}

export function useSingleplayerGame({
  getIsSettled,
  getSplitLevels,
  getLevel,
  onRoundReset,
  modeQueue = null,
  roundCount = GAME_ROUND_COUNT,
  ruleMode = GAME_RULE_MODES.CLASSIC,
  targetSeed = null,
  targets = null,
} = {}) {
  const targetBaseSeed = targetSeed || `${ruleMode}:${roundCount}`;
  const generatedTargets = useMemo(
    () =>
      targets
        ? null
        : createRoundTargets(targetBaseSeed, roundCount),
    [roundCount, targetBaseSeed, targets],
  );
  const chaosModes = useMemo(
    () => {
      if (ruleMode !== GAME_RULE_MODES.CHAOS_QUEUE) return null;
      const cleanModeQueue = sanitizeChaosModeQueue(modeQueue);
      if (cleanModeQueue?.length) return cleanModeQueue;

      return createChaosModes(targetBaseSeed, roundCount);
    },
    [modeQueue, roundCount, ruleMode, targetBaseSeed],
  );
  const getRoundTarget = useCallback(
    (index) => {
      const roundTarget =
        targets?.[index] ||
        generatedTargets?.[index] ||
        createRoundTargets(`${targetBaseSeed}:${index}`, 1)[0];

      return normalizeRoundTarget(roundTarget);
    },
    [generatedTargets, targetBaseSeed, targets],
  );
  const initialTarget = getRoundTarget(0);
  const [phase, setPhase] = useState(GAME_PHASES.INTRO);
  const [pourStatus, setPourStatus] = useState(POUR_STATUSES.INTRO);
  const [roundIndex, setRoundIndex] = useState(0);
  const [target, setTarget] = useState(initialTarget?.target ?? 50);
  const [fakeTarget, setFakeTarget] = useState(initialTarget?.fakeTarget ?? 62);
  const [splitTargets, setSplitTargets] = useState(
    initialTarget?.splitTargets ?? [42, 68],
  );
  const [lastResult, setLastResult] = useState(null);
  const [results, setResults] = useState([]);
  const [timeLeftMs, setTimeLeftMs] = useState(LEAKY_ROUND_MS);
  const effectiveRuleMode =
    chaosModes?.[roundIndex] ?? ruleMode ?? GAME_RULE_MODES.CLASSIC;
  const getSplitLevelsRef = useRef(getSplitLevels);
  const getIsSettledRef = useRef(getIsSettled);
  const getLevelRef = useRef(getLevel);
  const onRoundResetRef = useRef(onRoundReset);
  const effectiveRuleModeRef = useRef(effectiveRuleMode);
  const phaseRef = useRef(phase);
  const pourStatusRef = useRef(pourStatus);
  const resultsRef = useRef(results);
  const roundIndexRef = useRef(roundIndex);
  const fakeTargetRef = useRef(fakeTarget);
  const splitTargetsRef = useRef(splitTargets);
  const targetRef = useRef(target);
  const timeLeftRef = useRef(timeLeftMs);
  const settlingStartedAtRef = useRef(0);
  const isBlind = effectiveRuleMode === GAME_RULE_MODES.BLIND;
  const isFakeTarget = effectiveRuleMode === GAME_RULE_MODES.FAKE_TARGET;
  const isReversePour = effectiveRuleMode === GAME_RULE_MODES.REVERSE_POUR;
  const isLeaky = effectiveRuleMode === GAME_RULE_MODES.LEAKY;
  const isEndless = ruleMode === GAME_RULE_MODES.ENDLESS;
  const isOneHold = gameModeIsOneHold(effectiveRuleMode);

  useEffect(() => {
    getLevelRef.current = getLevel;
  }, [getLevel]);

  useEffect(() => {
    getIsSettledRef.current = getIsSettled;
  }, [getIsSettled]);

  useEffect(() => {
    getSplitLevelsRef.current = getSplitLevels;
  }, [getSplitLevels]);

  useEffect(() => {
    effectiveRuleModeRef.current = effectiveRuleMode;
  }, [effectiveRuleMode]);

  useEffect(() => {
    onRoundResetRef.current = onRoundReset;
  }, [onRoundReset]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    pourStatusRef.current = pourStatus;
  }, [pourStatus]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    roundIndexRef.current = roundIndex;
  }, [roundIndex]);

  useEffect(() => {
    fakeTargetRef.current = fakeTarget;
  }, [fakeTarget]);

  useEffect(() => {
    splitTargetsRef.current = splitTargets;
  }, [splitTargets]);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    timeLeftRef.current = timeLeftMs;
  }, [timeLeftMs]);

  const setPhaseValue = useCallback((nextPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const setPourStatusValue = useCallback((nextStatus) => {
    pourStatusRef.current = nextStatus;
    setPourStatus(nextStatus);
  }, []);

  const lockRound = useCallback(() => {
    if (
      phaseRef.current === GAME_PHASES.RESULT ||
      phaseRef.current === GAME_PHASES.FINAL
    ) {
      return;
    }

    const currentRuleMode = effectiveRuleModeRef.current;
    const sourceLevel = getLevelRef.current?.() ?? 0;
    const level = Math.round(clampPercent(sourceLevel) * 10) / 10;
    const splitLevels = getSplitLevelsRef.current?.();
    const result = calculateRoundResult({
      fakeTarget:
        currentRuleMode === GAME_RULE_MODES.FAKE_TARGET
          ? fakeTargetRef.current
          : null,
      level,
      roundIndex: roundIndexRef.current,
      ruleMode: currentRuleMode,
      splitLevels,
      splitTargets: splitTargetsRef.current,
      target: targetRef.current,
    });
    const nextResults = [...resultsRef.current, result];

    setLastResult(result);
    resultsRef.current = nextResults;
    setResults(nextResults);
    setPourStatusValue(POUR_STATUSES.RESULT);
    setPhaseValue(GAME_PHASES.RESULT);
  }, [setPhaseValue, setPourStatusValue]);

  const startSettling = useCallback(() => {
    if (
      phaseRef.current !== GAME_PHASES.POUR ||
      pourStatusRef.current === POUR_STATUSES.SETTLING
    ) {
      return;
    }

    settlingStartedAtRef.current = Date.now();
    setPourStatusValue(POUR_STATUSES.SETTLING);
  }, [setPourStatusValue]);

  useEffect(() => {
    if (pourStatus !== POUR_STATUSES.SETTLING) return undefined;

    let animationFrameId = 0;

    const tick = () => {
      if (pourStatusRef.current !== POUR_STATUSES.SETTLING) {
        return;
      }

      const elapsed = Date.now() - settlingStartedAtRef.current;
      const isSettled = getIsSettledRef.current?.() ?? false;

      if (elapsed >= SETTLING_MIN_MS && (isSettled || elapsed >= SETTLING_MAX_MS)) {
        lockRound();
        return;
      }

      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [lockRound, pourStatus]);

  useEffect(() => {
    if (!isLeaky || phase !== GAME_PHASES.POUR) return undefined;

    const intervalId = window.setInterval(() => {
      if (phaseRef.current !== GAME_PHASES.POUR) return;

      const nextTime = Math.max(0, timeLeftRef.current - 100);

      timeLeftRef.current = nextTime;
      setTimeLeftMs(nextTime);

      if (nextTime === 0) {
        startSettling();
      }
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [isLeaky, phase, startSettling]);

  useEffect(() => {
    if (pourStatus !== POUR_STATUSES.FILLING) return undefined;

    const intervalId = window.setInterval(() => {
      if (pourStatusRef.current !== POUR_STATUSES.FILLING) return;

      const level = getLevelRef.current?.() ?? 0;

      if (
        (isReversePour && level <= EMPTY_LEVEL_LOCK) ||
        (!isReversePour && level >= FULL_LEVEL_LOCK)
      ) {
        startSettling();
      }
    }, 50);

    return () => window.clearInterval(intervalId);
  }, [isReversePour, pourStatus, startSettling]);

  const finishIntro = useCallback(() => {
    if (phaseRef.current !== GAME_PHASES.INTRO) return;

    setPourStatusValue(POUR_STATUSES.IDLE);
    setPhaseValue(GAME_PHASES.POUR);
  }, [setPhaseValue, setPourStatusValue]);

  const startPour = useCallback(() => {
    if (
      phaseRef.current !== GAME_PHASES.POUR ||
      pourStatusRef.current === POUR_STATUSES.SETTLING ||
      (isOneHold && pourStatusRef.current !== POUR_STATUSES.IDLE) ||
      (isLeaky && timeLeftRef.current <= 0)
    ) {
      return;
    }

    setLastResult(null);
    setPourStatusValue(POUR_STATUSES.FILLING);
  }, [isLeaky, isOneHold, setPourStatusValue]);

  const stopPour = useCallback(() => {
    if (pourStatusRef.current !== POUR_STATUSES.FILLING) return;

    if (isOneHold) {
      startSettling();
      return;
    }

    setPourStatusValue(isLeaky ? POUR_STATUSES.LEAKING : POUR_STATUSES.IDLE);
  }, [isLeaky, isOneHold, setPourStatusValue, startSettling]);

  const submitRound = useCallback(() => {
    startSettling();
  }, [startSettling]);

  const continueFromResult = useCallback(() => {
    if (phaseRef.current !== GAME_PHASES.RESULT) return null;

    if (!isEndless && roundIndexRef.current + 1 >= roundCount) {
      setPourStatusValue(POUR_STATUSES.COMPLETE);
      setPhaseValue(GAME_PHASES.FINAL);
      return resultsRef.current;
    }

    const nextRoundIndex = roundIndexRef.current + 1;
    const nextTarget = getRoundTarget(nextRoundIndex);
    const nextRuleMode = chaosModes?.[nextRoundIndex] ?? ruleMode;

    setRoundIndex(nextRoundIndex);
    setTarget(nextTarget.target);
    setFakeTarget(nextTarget.fakeTarget);
    setSplitTargets(nextTarget.splitTargets);
    onRoundResetRef.current?.(nextRuleMode);
    setLastResult(null);
    timeLeftRef.current = LEAKY_ROUND_MS;
    setTimeLeftMs(LEAKY_ROUND_MS);
    setPourStatusValue(POUR_STATUSES.INTRO);
    setPhaseValue(GAME_PHASES.INTRO);
    return null;
  }, [
    chaosModes,
    getRoundTarget,
    isEndless,
    roundCount,
    ruleMode,
    setPhaseValue,
    setPourStatusValue,
  ]);

  const playAgain = useCallback(() => {
    const firstTarget = getRoundTarget(0);
    const firstRuleMode = chaosModes?.[0] ?? ruleMode;

    setRoundIndex(0);
    setTarget(firstTarget.target);
    setFakeTarget(firstTarget.fakeTarget);
    setSplitTargets(firstTarget.splitTargets);
    setLastResult(null);
    setResults([]);
    resultsRef.current = [];
    timeLeftRef.current = LEAKY_ROUND_MS;
    setTimeLeftMs(LEAKY_ROUND_MS);
    onRoundResetRef.current?.(firstRuleMode);
    setPourStatusValue(POUR_STATUSES.INTRO);
    setPhaseValue(GAME_PHASES.INTRO);
  }, [chaosModes, getRoundTarget, ruleMode, setPhaseValue, setPourStatusValue]);

  const summary = useMemo(() => {
    const totalScore =
      Math.round(
        results.reduce((total, result) => total + result.score, 0) * 10,
      ) / 10;
    const bestDiff = results.length
      ? Math.min(...results.map((result) => result.diff))
      : null;

    return {
      bestDiff,
      maxScore: isEndless ? null : roundCount * 10,
      totalScore,
    };
  }, [isEndless, results, roundCount]);

  return {
    chaosModes,
    continueFromResult,
    fakeTarget: isFakeTarget ? fakeTarget : null,
    finishIntro,
    gameMode: effectiveRuleMode,
    isChaosQueue: ruleMode === GAME_RULE_MODES.CHAOS_QUEUE,
    isEndless,
    isFinalRound: !isEndless && roundIndex + 1 >= roundCount,
    lastResult,
    modeAllowsDone: gameModeAllowsManualDone(effectiveRuleMode),
    phase,
    playAgain,
    pourStatus,
    selectedGameMode: ruleMode,
    results,
    roundCount,
    roundIndex,
    showTargetGuide: !isBlind,
    splitTargets,
    startPour,
    stopPour,
    submitRound,
    summary,
    target,
    timeLeftMs: isLeaky ? timeLeftMs : null,
  };
}
