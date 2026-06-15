"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHAOS_QUEUE_MODE_POOL,
  GAME_ROUND_COUNT,
  GAME_RULE_MODES,
  LEAKY_ROUND_MS,
} from "@/lib/constants";
import {
  gameModeAllowsManualDone,
  gameModeIsOneHold,
  getGameModeOption,
} from "@/lib/gameMode";
import { calculateRoundResult } from "@/lib/scoring";
import {
  createFakeTarget,
  createBandTargets,
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
  BURST: "burst",
  RESULT: "result",
  COMPLETE: "complete",
};

const FULL_LEVEL_LOCK = 99.95;
const EMPTY_LEVEL_LOCK = 0.05;
const SETTLING_MIN_MS = 900;
const BURST_CLICK_WINDOW_MS = 460;
const BURST_CLICK_MIN_CLICKS = 2;
const BURST_CLICK_MIN_CPS = 4.25;
const BURST_CLICK_MAX_CPS = 13.2;
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
    bandTargets: Array.isArray(roundTarget.bandTargets)
      ? roundTarget.bandTargets
      : createBandTargets(),
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

function getRoundDurationMs(ruleMode) {
  return getGameModeOption(ruleMode)?.roundDurationMs ?? null;
}

function getBurstClickFlow(now, previousClicks = []) {
  const recentClicks = previousClicks.filter(
    (clickTime) => now - clickTime <= BURST_CLICK_WINDOW_MS,
  );
  const cps = (recentClicks.length / BURST_CLICK_WINDOW_MS) * 1000;

  if (recentClicks.length < BURST_CLICK_MIN_CLICKS || cps < BURST_CLICK_MIN_CPS) {
    return {
      active: false,
      clicks: recentClicks,
    };
  }

  const rawPressure = clampPercent(
    ((cps - BURST_CLICK_MIN_CPS) / (BURST_CLICK_MAX_CPS - BURST_CLICK_MIN_CPS)) *
      100,
  ) / 100;
  const pressure = Math.pow(rawPressure, 0.58);

  return {
    active: true,
    clicks: recentClicks,
    durationMs: 135 + pressure * 145,
    power: 1.1 + pressure * 2.35,
  };
}

export function useSingleplayerGame({
  getIsSettled,
  getSplitLevels,
  getTilt,
  getLevel,
  onRoundReset,
  modeQueue = null,
  roundCount = GAME_ROUND_COUNT,
  ruleMode = GAME_RULE_MODES.CLASSIC,
  targetSeed = null,
  targets = null,
} = {}) {
  const normalizedRuleMode =
    ruleMode === GAME_RULE_MODES.ENDLESS ? GAME_RULE_MODES.CLASSIC : ruleMode;
  const targetBaseSeed = targetSeed || `${normalizedRuleMode}:${roundCount}`;
  const generatedTargets = useMemo(
    () =>
      targets
        ? null
        : createRoundTargets(targetBaseSeed, roundCount),
    [roundCount, targetBaseSeed, targets],
  );
  const chaosModes = useMemo(
    () => {
      if (normalizedRuleMode !== GAME_RULE_MODES.CHAOS_QUEUE) return null;
      const cleanModeQueue = sanitizeChaosModeQueue(modeQueue);
      if (cleanModeQueue?.length) return cleanModeQueue;

      return createChaosModes(targetBaseSeed, roundCount);
    },
    [modeQueue, normalizedRuleMode, roundCount, targetBaseSeed],
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
  const [bandTargets, setBandTargets] = useState(
    initialTarget?.bandTargets ?? [38, 62],
  );
  const [bandLevels, setBandLevels] = useState([]);
  const [bandAttemptIndex, setBandAttemptIndex] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [results, setResults] = useState([]);
  const [timeLeftMs, setTimeLeftMs] = useState(LEAKY_ROUND_MS);
  const effectiveRuleMode =
    chaosModes?.[roundIndex] ?? normalizedRuleMode ?? GAME_RULE_MODES.CLASSIC;
  const getSplitLevelsRef = useRef(getSplitLevels);
  const getIsSettledRef = useRef(getIsSettled);
  const getLevelRef = useRef(getLevel);
  const getTiltRef = useRef(getTilt);
  const onRoundResetRef = useRef(onRoundReset);
  const effectiveRuleModeRef = useRef(effectiveRuleMode);
  const phaseRef = useRef(phase);
  const pourStatusRef = useRef(pourStatus);
  const resultsRef = useRef(results);
  const roundIndexRef = useRef(roundIndex);
  const fakeTargetRef = useRef(fakeTarget);
  const splitTargetsRef = useRef(splitTargets);
  const bandTargetsRef = useRef(bandTargets);
  const bandLevelsRef = useRef([]);
  const bandAttemptIndexRef = useRef(0);
  const targetRef = useRef(target);
  const timeLeftRef = useRef(timeLeftMs);
  const chargeStartedAtRef = useRef(0);
  const chargeBurstStartedAtRef = useRef(0);
  const chargeBurstMsRef = useRef(0);
  const chargePowerRef = useRef(1);
  const burstClickTimesRef = useRef([]);
  const settlingStartedAtRef = useRef(0);
  const isBlind = effectiveRuleMode === GAME_RULE_MODES.BLIND;
  const isFakeTarget = effectiveRuleMode === GAME_RULE_MODES.FAKE_TARGET;
  const isReversePour = effectiveRuleMode === GAME_RULE_MODES.REVERSE_POUR;
  const isInvert = effectiveRuleMode === GAME_RULE_MODES.INVERT;
  const isLeaky = effectiveRuleMode === GAME_RULE_MODES.LEAKY;
  const isBandRun = effectiveRuleMode === GAME_RULE_MODES.BAND_RUN;
  const isChargePour = effectiveRuleMode === GAME_RULE_MODES.CHARGE_POUR;
  const isBurstClick = effectiveRuleMode === GAME_RULE_MODES.BURST_CLICK;
  const timedRoundMs = getRoundDurationMs(effectiveRuleMode);
  const isTimedRound = typeof timedRoundMs === "number";
  const isEndless = false;
  const isOneHold = gameModeIsOneHold(effectiveRuleMode);

  useEffect(() => {
    getLevelRef.current = getLevel;
  }, [getLevel]);

  useEffect(() => {
    getTiltRef.current = getTilt;
  }, [getTilt]);

  useEffect(() => {
    getIsSettledRef.current = getIsSettled;
  }, [getIsSettled]);

  useEffect(() => {
    getSplitLevelsRef.current = getSplitLevels;
  }, [getSplitLevels]);

  useEffect(() => {
    effectiveRuleModeRef.current = effectiveRuleMode;
    if (effectiveRuleMode !== GAME_RULE_MODES.BURST_CLICK) {
      burstClickTimesRef.current = [];
    }
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
    bandTargetsRef.current = bandTargets;
  }, [bandTargets]);

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
    const level = Math.round(clampPercent(sourceLevel) * 100) / 100;
    const tilt = getTiltRef.current?.() ?? 0;
    const splitLevels = getSplitLevelsRef.current?.();
    const currentBandTargets = bandTargetsRef.current;

    if (currentRuleMode === GAME_RULE_MODES.BAND_RUN) {
      const nextBandLevels = [...bandLevelsRef.current, level];
      const nextAttemptIndex = bandAttemptIndexRef.current + 1;

      bandLevelsRef.current = nextBandLevels;
      bandAttemptIndexRef.current = nextAttemptIndex;
      setBandLevels(nextBandLevels);
      setBandAttemptIndex(nextAttemptIndex);

      if (nextAttemptIndex < currentBandTargets.length) {
        onRoundResetRef.current?.(currentRuleMode);
        setLastResult(null);
        setPourStatusValue(POUR_STATUSES.IDLE);
        setPhaseValue(GAME_PHASES.POUR);
        return;
      }

      const result = calculateRoundResult({
        bandLevels: nextBandLevels,
        bandTargets: currentBandTargets,
        level,
        roundIndex: roundIndexRef.current,
        ruleMode: currentRuleMode,
        target: targetRef.current,
        tilt,
      });
      const nextResults = [...resultsRef.current, result];

      setLastResult(result);
      resultsRef.current = nextResults;
      setResults(nextResults);
      setPourStatusValue(POUR_STATUSES.RESULT);
      setPhaseValue(GAME_PHASES.RESULT);
      return;
    }

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
      tilt,
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
    burstClickTimesRef.current = [];
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

      if (elapsed >= SETTLING_MIN_MS && isSettled) {
        lockRound();
        return;
      }

      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [lockRound, pourStatus]);

  useEffect(() => {
    if (!isTimedRound || phase !== GAME_PHASES.POUR) return undefined;

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
  }, [isTimedRound, phase, startSettling]);

  useEffect(() => {
    if (
      (!isChargePour && !isBurstClick) ||
      pourStatus !== POUR_STATUSES.BURST
    ) return undefined;

    let animationFrameId = 0;

    const tick = () => {
      if (pourStatusRef.current !== POUR_STATUSES.BURST) {
        return;
      }

      const elapsed = Date.now() - chargeBurstStartedAtRef.current;
      if (elapsed >= chargeBurstMsRef.current) {
        if (effectiveRuleModeRef.current === GAME_RULE_MODES.BURST_CLICK) {
          setPourStatusValue(POUR_STATUSES.IDLE);
          return;
        }

        startSettling();
        return;
      }

      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isBurstClick, isChargePour, pourStatus, setPourStatusValue, startSettling]);

  useEffect(() => {
    if (pourStatus !== POUR_STATUSES.FILLING) return undefined;

    const intervalId = window.setInterval(() => {
      if (pourStatusRef.current !== POUR_STATUSES.FILLING) return;

      const level = getLevelRef.current?.() ?? 0;

      if (
        (isReversePour && level <= EMPTY_LEVEL_LOCK) ||
        (isInvert && level <= EMPTY_LEVEL_LOCK) ||
        (!isReversePour && !isInvert && level >= FULL_LEVEL_LOCK)
      ) {
        startSettling();
      }
    }, 50);

    return () => window.clearInterval(intervalId);
  }, [isInvert, isReversePour, pourStatus, startSettling]);

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
      (isTimedRound && timeLeftRef.current <= 0)
    ) {
      return;
    }

    setLastResult(null);
    if (isBurstClick) {
      const now = Date.now();
      const clickFlow = getBurstClickFlow(now, [
        ...burstClickTimesRef.current,
        now,
      ]);

      burstClickTimesRef.current = clickFlow.clicks;

      if (!clickFlow.active) {
        return;
      }

      chargePowerRef.current = clickFlow.power;
      chargeBurstMsRef.current = clickFlow.durationMs;
      chargeBurstStartedAtRef.current = now;
      setPourStatusValue(POUR_STATUSES.BURST);
      return;
    }

    if (isChargePour) {
      chargeStartedAtRef.current = Date.now();
    }
    setPourStatusValue(POUR_STATUSES.FILLING);
  }, [isBurstClick, isChargePour, isOneHold, isTimedRound, setPourStatusValue]);

  const stopPour = useCallback(() => {
    if (pourStatusRef.current !== POUR_STATUSES.FILLING) return;

    if (isChargePour) {
      const heldMs = Math.max(120, Date.now() - chargeStartedAtRef.current);
      const chargeRatio = clampPercent((heldMs / 1600) * 100) / 100;

      chargePowerRef.current = 0.95 + chargeRatio * 2.05;
      chargeBurstMsRef.current = 460 + chargeRatio * 520;
      chargeBurstStartedAtRef.current = Date.now();
      setPourStatusValue(POUR_STATUSES.BURST);
      return;
    }

    if (isOneHold || isBandRun) {
      startSettling();
      return;
    }

    setPourStatusValue(isLeaky ? POUR_STATUSES.LEAKING : POUR_STATUSES.IDLE);
  }, [isBandRun, isChargePour, isLeaky, isOneHold, setPourStatusValue, startSettling]);

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
    const nextRuleMode = chaosModes?.[nextRoundIndex] ?? normalizedRuleMode;
    const nextRoundDuration = getRoundDurationMs(nextRuleMode) ?? LEAKY_ROUND_MS;

    setRoundIndex(nextRoundIndex);
    setTarget(nextTarget.target);
    setFakeTarget(nextTarget.fakeTarget);
    setSplitTargets(nextTarget.splitTargets);
    setBandTargets(nextTarget.bandTargets);
    bandLevelsRef.current = [];
    bandAttemptIndexRef.current = 0;
    burstClickTimesRef.current = [];
    setBandLevels([]);
    setBandAttemptIndex(0);
    onRoundResetRef.current?.(nextRuleMode);
    setLastResult(null);
    timeLeftRef.current = nextRoundDuration;
    setTimeLeftMs(nextRoundDuration);
    setPourStatusValue(POUR_STATUSES.INTRO);
    setPhaseValue(GAME_PHASES.INTRO);
    return null;
  }, [
    chaosModes,
    getRoundTarget,
    isEndless,
    roundCount,
    normalizedRuleMode,
    setPhaseValue,
    setPourStatusValue,
  ]);

  const playAgain = useCallback(() => {
    const firstTarget = getRoundTarget(0);
    const firstRuleMode = chaosModes?.[0] ?? normalizedRuleMode;
    const firstRoundDuration = getRoundDurationMs(firstRuleMode) ?? LEAKY_ROUND_MS;

    setRoundIndex(0);
    setTarget(firstTarget.target);
    setFakeTarget(firstTarget.fakeTarget);
    setSplitTargets(firstTarget.splitTargets);
    setBandTargets(firstTarget.bandTargets);
    bandLevelsRef.current = [];
    bandAttemptIndexRef.current = 0;
    burstClickTimesRef.current = [];
    setBandLevels([]);
    setBandAttemptIndex(0);
    setLastResult(null);
    setResults([]);
    resultsRef.current = [];
    timeLeftRef.current = firstRoundDuration;
    setTimeLeftMs(firstRoundDuration);
    onRoundResetRef.current?.(firstRuleMode);
    setPourStatusValue(POUR_STATUSES.INTRO);
    setPhaseValue(GAME_PHASES.INTRO);
  }, [chaosModes, getRoundTarget, normalizedRuleMode, setPhaseValue, setPourStatusValue]);

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
    bandAttemptIndex,
    bandLevels,
    bandTargets,
    finishIntro,
    gameMode: effectiveRuleMode,
    isChaosQueue: normalizedRuleMode === GAME_RULE_MODES.CHAOS_QUEUE,
    isEndless,
    isFinalRound: !isEndless && roundIndex + 1 >= roundCount,
    lastResult,
    modeAllowsDone: gameModeAllowsManualDone(effectiveRuleMode),
    phase,
    playAgain,
    pourStatus,
    chargePowerRef,
    selectedGameMode: normalizedRuleMode,
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
    timeLeftMs: isTimedRound ? timeLeftMs : null,
  };
}
