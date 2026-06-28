"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHAOS_QUEUE_MODE_POOL,
  GAME_ROUND_COUNT,
  GAME_RULE_MODES,
  LEAKY_ROUND_MS,
  SIPHON_DRAIN_MS,
  TIME_ATTACK_ZONE_RADIUS,
} from "@/lib/constants";
import {
  gameModeAllowsManualDone,
  gameModeIsOneHold,
  getGameModeOption,
} from "@/lib/gameMode";
import { calculateRoundResult, normalizeTotalScore } from "@/lib/scoring";
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
const RESUMABLE_PHASES = new Set(Object.values(GAME_PHASES));
const RESUMABLE_POUR_STATUSES = new Set(Object.values(POUR_STATUSES));

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function clampRoundIndex(value, roundCount) {
  const parsed = Number(value);
  const maxRoundIndex = Math.max(0, (Number(roundCount) || 1) - 1);

  if (!Number.isInteger(parsed)) return 0;

  return Math.max(0, Math.min(maxRoundIndex, parsed));
}

function sanitizePercentList(values) {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => Number(value))
    .filter(Number.isFinite)
    .map(clampPercent);
}

function sanitizeResumeResults(results) {
  if (!Array.isArray(results)) return [];

  return results.filter((result) => result && typeof result === "object");
}

function sanitizeResumeResult(result) {
  return result && typeof result === "object" ? result : null;
}

function sanitizeElapsedMs(value) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function normalizeResumePhase(snapshot) {
  const phase = snapshot?.phase;
  const pourStatus = snapshot?.pourStatus;

  if (RESUMABLE_PHASES.has(phase)) return phase;
  if (pourStatus === POUR_STATUSES.RESULT) return GAME_PHASES.RESULT;
  if (pourStatus === POUR_STATUSES.COMPLETE) return GAME_PHASES.FINAL;

  return GAME_PHASES.INTRO;
}

function normalizeResumePourStatus(snapshot, phase, ruleMode) {
  const pourStatus = snapshot?.pourStatus;

  if (phase === GAME_PHASES.INTRO) return POUR_STATUSES.INTRO;
  if (phase === GAME_PHASES.RESULT) return POUR_STATUSES.RESULT;
  if (phase === GAME_PHASES.FINAL) return POUR_STATUSES.COMPLETE;
  if (!RESUMABLE_POUR_STATUSES.has(pourStatus)) return POUR_STATUSES.IDLE;
  if (
    pourStatus === POUR_STATUSES.FILLING &&
    ruleMode !== GAME_RULE_MODES.AUTO_RISE
  ) {
    return POUR_STATUSES.IDLE;
  }
  if (pourStatus === POUR_STATUSES.BURST) return POUR_STATUSES.SETTLING;
  if (
    pourStatus === POUR_STATUSES.LEAKING &&
    ruleMode === GAME_RULE_MODES.SIPHON
  ) {
    return POUR_STATUSES.SETTLING;
  }

  return pourStatus === POUR_STATUSES.INTRO ? POUR_STATUSES.IDLE : pourStatus;
}

function getResumeTimeLeft(snapshot, fallback) {
  const timeLeftMs = Number(snapshot?.timeLeftMs);

  if (!Number.isFinite(timeLeftMs)) return fallback;

  return Math.max(0, timeLeftMs);
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
  const modes = [];

  while (modes.length < roundCount) {
    const bag = [...CHAOS_ELIGIBLE_MODE_POOL];

    for (let index = bag.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
    }

    modes.push(...bag);
  }

  return modes.slice(0, roundCount);
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
  initialSnapshot = null,
} = {}) {
  const normalizedRuleMode =
    ruleMode === GAME_RULE_MODES.ENDLESS ? GAME_RULE_MODES.CLASSIC : ruleMode;
  const targetBaseSeed = targetSeed || `${normalizedRuleMode}:${roundCount}`;
  const chaosModes = useMemo(
    () => {
      if (normalizedRuleMode !== GAME_RULE_MODES.CHAOS_QUEUE) return null;
      const cleanModeQueue = sanitizeChaosModeQueue(modeQueue);
      if (cleanModeQueue?.length) return cleanModeQueue;

      return createChaosModes(targetBaseSeed, roundCount);
    },
    [modeQueue, normalizedRuleMode, roundCount, targetBaseSeed],
  );
  const generatedTargets = useMemo(
    () =>
      targets
        ? null
        : createRoundTargets(targetBaseSeed, roundCount, {
            modeQueue: chaosModes,
            ruleMode: normalizedRuleMode,
          }),
    [chaosModes, normalizedRuleMode, roundCount, targetBaseSeed, targets],
  );
  const getRoundTarget = useCallback(
    (index) => {
      const fallbackRuleMode = chaosModes?.[index] ?? normalizedRuleMode;
      const roundTarget =
        targets?.[index] ||
        generatedTargets?.[index] ||
        createRoundTargets(`${targetBaseSeed}:${index}`, 1, {
          ruleMode: fallbackRuleMode,
        })[0];

      return normalizeRoundTarget(roundTarget);
    },
    [chaosModes, generatedTargets, normalizedRuleMode, targetBaseSeed, targets],
  );
  const initialRoundIndex = clampRoundIndex(
    initialSnapshot?.roundIndex,
    roundCount,
  );
  const initialRuleMode =
    chaosModes?.[initialRoundIndex] ??
    normalizedRuleMode ??
    GAME_RULE_MODES.CLASSIC;
  const initialTarget = getRoundTarget(initialRoundIndex);
  const resumedPhase = normalizeResumePhase(initialSnapshot);
  const initialResults = sanitizeResumeResults(initialSnapshot?.results);
  const initialLastResult = sanitizeResumeResult(initialSnapshot?.lastResult);
  const initialPhase =
    resumedPhase === GAME_PHASES.RESULT && !initialLastResult
      ? GAME_PHASES.POUR
      : resumedPhase;
  const initialPourStatus = normalizeResumePourStatus(
    initialSnapshot,
    initialPhase,
    initialRuleMode,
  );
  const initialBandLevels = sanitizePercentList(initialSnapshot?.bandLevels);
  const initialBandAttemptIndex = Math.max(
    0,
    Math.min(
      initialTarget?.bandTargets?.length ?? 0,
      Number.isInteger(Number(initialSnapshot?.bandAttemptIndex))
        ? Number(initialSnapshot.bandAttemptIndex)
        : initialBandLevels.length,
    ),
  );
  const initialRoundDuration =
    getRoundDurationMs(initialRuleMode) ?? LEAKY_ROUND_MS;
  const initialTimeLeftMs = getResumeTimeLeft(
    initialSnapshot,
    initialRoundDuration,
  );
  const initialRaceElapsedMs = sanitizeElapsedMs(initialSnapshot?.raceElapsedMs);
  const fallbackRaceRoundStartedAtElapsedMs = initialResults.length
    ? sanitizeElapsedMs(initialResults[initialResults.length - 1]?.elapsedMs)
    : 0;
  const initialRaceRoundStartedAtElapsedMs = sanitizeElapsedMs(
    initialSnapshot?.raceRoundStartedAtElapsedMs ??
      fallbackRaceRoundStartedAtElapsedMs,
  );
  const initialRaceRoundElapsedMs = Math.max(
    0,
    initialRaceElapsedMs - initialRaceRoundStartedAtElapsedMs,
  );
  const [phase, setPhase] = useState(initialPhase);
  const [pourStatus, setPourStatus] = useState(initialPourStatus);
  const [roundIndex, setRoundIndex] = useState(initialRoundIndex);
  const [target, setTarget] = useState(initialTarget?.target ?? 50);
  const [fakeTarget, setFakeTarget] = useState(initialTarget?.fakeTarget ?? 62);
  const [splitTargets, setSplitTargets] = useState(
    initialTarget?.splitTargets ?? [42, 68],
  );
  const [bandTargets, setBandTargets] = useState(
    initialTarget?.bandTargets ?? [38, 62],
  );
  const [bandLevels, setBandLevels] = useState(initialBandLevels);
  const [bandAttemptIndex, setBandAttemptIndex] = useState(
    initialBandAttemptIndex,
  );
  const [lastResult, setLastResult] = useState(initialLastResult);
  const [results, setResults] = useState(initialResults);
  const [timeLeftMs, setTimeLeftMs] = useState(initialTimeLeftMs);
  const [raceElapsedMs, setRaceElapsedMs] = useState(initialRaceElapsedMs);
  const [raceRoundElapsedMs, setRaceRoundElapsedMs] = useState(
    initialRaceRoundElapsedMs,
  );
  const [raceRoundStartedAtElapsedMs, setRaceRoundStartedAtElapsedMs] = useState(
    initialRaceRoundStartedAtElapsedMs,
  );
  const [roundResetNonce, setRoundResetNonce] = useState(0);
  const [timeAttackFailNonce, setTimeAttackFailNonce] = useState(0);
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
  const bandLevelsRef = useRef(initialBandLevels);
  const bandAttemptIndexRef = useRef(initialBandAttemptIndex);
  const targetRef = useRef(target);
  const timeLeftRef = useRef(timeLeftMs);
  const raceElapsedMsRef = useRef(initialRaceElapsedMs);
  const raceRoundStartedAtElapsedMsRef = useRef(
    initialRaceRoundStartedAtElapsedMs,
  );
  const raceSegmentStartedAtRef = useRef(0);
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
  const isSiphon = effectiveRuleMode === GAME_RULE_MODES.SIPHON;
  const isTimeAttack = effectiveRuleMode === GAME_RULE_MODES.TIME_ATTACK;
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

  const getRaceElapsedMs = useCallback(() => {
    const segmentStartedAt = raceSegmentStartedAtRef.current;
    const segmentElapsed = segmentStartedAt
      ? Date.now() - segmentStartedAt
      : 0;

    return raceElapsedMsRef.current + segmentElapsed;
  }, []);

  const getRaceRoundElapsedMs = useCallback(
    (nextElapsedMs = getRaceElapsedMs()) =>
      Math.max(0, nextElapsedMs - raceRoundStartedAtElapsedMsRef.current),
    [getRaceElapsedMs],
  );

  const syncRaceElapsedMs = useCallback(() => {
    const nextElapsedMs = getRaceElapsedMs();

    setRaceElapsedMs(nextElapsedMs);
    setRaceRoundElapsedMs(getRaceRoundElapsedMs(nextElapsedMs));
    return nextElapsedMs;
  }, [getRaceElapsedMs, getRaceRoundElapsedMs]);

  const pauseRaceTimer = useCallback(() => {
    if (!raceSegmentStartedAtRef.current) {
      return raceElapsedMsRef.current;
    }

    const nextElapsedMs = getRaceElapsedMs();

    raceElapsedMsRef.current = nextElapsedMs;
    raceSegmentStartedAtRef.current = 0;
    setRaceElapsedMs(nextElapsedMs);
    setRaceRoundElapsedMs(getRaceRoundElapsedMs(nextElapsedMs));

    return nextElapsedMs;
  }, [getRaceElapsedMs, getRaceRoundElapsedMs]);

  const resetRaceTimer = useCallback(() => {
    raceElapsedMsRef.current = 0;
    raceRoundStartedAtElapsedMsRef.current = 0;
    raceSegmentStartedAtRef.current = 0;
    setRaceElapsedMs(0);
    setRaceRoundElapsedMs(0);
    setRaceRoundStartedAtElapsedMs(0);
  }, []);

  const lockRound = useCallback(() => {
    if (
      phaseRef.current === GAME_PHASES.RESULT ||
      phaseRef.current === GAME_PHASES.FINAL
    ) {
      return;
    }

    const currentRuleMode = effectiveRuleModeRef.current;
    const isCurrentTimeAttack = currentRuleMode === GAME_RULE_MODES.TIME_ATTACK;
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
        setRoundResetNonce((value) => value + 1);
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

    const raceTotalElapsedMs = isCurrentTimeAttack ? getRaceElapsedMs() : null;
    const raceRoundElapsedMs = isCurrentTimeAttack
      ? getRaceRoundElapsedMs(raceTotalElapsedMs)
      : null;
    const result = calculateRoundResult({
      fakeTarget:
        currentRuleMode === GAME_RULE_MODES.FAKE_TARGET
          ? fakeTargetRef.current
          : null,
      level,
      elapsedMs: raceTotalElapsedMs,
      roundElapsedMs: raceRoundElapsedMs,
      roundIndex: roundIndexRef.current,
      ruleMode: currentRuleMode,
      splitLevels,
      splitTargets: splitTargetsRef.current,
      target: targetRef.current,
      tilt,
    });

    if (isCurrentTimeAttack && result.diff > TIME_ATTACK_ZONE_RADIUS) {
      onRoundResetRef.current?.(currentRuleMode);
      setRoundResetNonce((value) => value + 1);
      setTimeAttackFailNonce((value) => value + 1);
      setLastResult(null);
      setPourStatusValue(POUR_STATUSES.IDLE);
      setPhaseValue(GAME_PHASES.POUR);
      return;
    }

    const nextResults = [...resultsRef.current, result];

    if (isCurrentTimeAttack) {
      raceElapsedMsRef.current = raceTotalElapsedMs;
      raceSegmentStartedAtRef.current = 0;
      setRaceElapsedMs(raceTotalElapsedMs);
      setRaceRoundElapsedMs(raceRoundElapsedMs);
    }

    setLastResult(result);
    resultsRef.current = nextResults;
    setResults(nextResults);
    setPourStatusValue(POUR_STATUSES.RESULT);
    setPhaseValue(GAME_PHASES.RESULT);
  }, [getRaceElapsedMs, getRaceRoundElapsedMs, setPhaseValue, setPourStatusValue]);

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
    if (!isTimeAttack) return undefined;

    const shouldRun =
      phase === GAME_PHASES.POUR &&
      pourStatus !== POUR_STATUSES.INTRO &&
      pourStatus !== POUR_STATUSES.COMPLETE;

    if (!shouldRun) {
      pauseRaceTimer();
      return undefined;
    }

    if (!raceSegmentStartedAtRef.current) {
      raceSegmentStartedAtRef.current = Date.now();
    }

    const intervalId = window.setInterval(syncRaceElapsedMs, 80);

    return () => window.clearInterval(intervalId);
  }, [isTimeAttack, pauseRaceTimer, phase, pourStatus, syncRaceElapsedMs]);

  useEffect(() => {
    if (!isSiphon || pourStatus !== POUR_STATUSES.LEAKING) return undefined;

    const timeoutId = window.setTimeout(() => {
      if (pourStatusRef.current === POUR_STATUSES.LEAKING) {
        startSettling();
      }
    }, SIPHON_DRAIN_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isSiphon, pourStatus, startSettling]);

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

    setPourStatusValue(
      effectiveRuleModeRef.current === GAME_RULE_MODES.AUTO_RISE
        ? POUR_STATUSES.FILLING
        : POUR_STATUSES.IDLE,
    );
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

    if (isSiphon) {
      setPourStatusValue(POUR_STATUSES.LEAKING);
      return;
    }

    if (isOneHold || isBandRun) {
      startSettling();
      return;
    }

    setPourStatusValue(isLeaky ? POUR_STATUSES.LEAKING : POUR_STATUSES.IDLE);
  }, [isBandRun, isChargePour, isLeaky, isOneHold, isSiphon, setPourStatusValue, startSettling]);

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
    if (nextRuleMode === GAME_RULE_MODES.TIME_ATTACK) {
      const nextRaceRoundStartedAtElapsedMs = raceElapsedMsRef.current;

      raceRoundStartedAtElapsedMsRef.current =
        nextRaceRoundStartedAtElapsedMs;
      setRaceRoundStartedAtElapsedMs(nextRaceRoundStartedAtElapsedMs);
      setRaceRoundElapsedMs(0);
    }
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
    resetRaceTimer();
    setRoundResetNonce((value) => value + 1);
    timeLeftRef.current = firstRoundDuration;
    setTimeLeftMs(firstRoundDuration);
    onRoundResetRef.current?.(firstRuleMode);
    setPourStatusValue(POUR_STATUSES.INTRO);
    setPhaseValue(GAME_PHASES.INTRO);
  }, [chaosModes, getRoundTarget, normalizedRuleMode, resetRaceTimer, setPhaseValue, setPourStatusValue]);

  const summary = useMemo(() => {
    const totalScore = normalizeTotalScore(
      results.reduce((total, result) => total + result.score, 0),
    );
    const bestDiff = results.length
      ? Math.min(...results.map((result) => result.diff))
      : null;

    return {
      bestDiff,
      maxScore: isEndless ? null : roundCount * 10,
      totalElapsedMs: raceElapsedMs,
      roundElapsedMs: raceRoundElapsedMs,
      totalScore,
    };
  }, [isEndless, raceElapsedMs, raceRoundElapsedMs, results, roundCount]);

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
    raceElapsedMs,
    raceRoundElapsedMs,
    raceRoundStartedAtElapsedMs,
    selectedGameMode: normalizedRuleMode,
    results,
    roundCount,
    roundIndex,
    roundResetNonce,
    showTargetGuide: !isBlind,
    splitTargets,
    startPour,
    stopPour,
    submitRound,
    summary,
    target,
    timeAttackFailNonce,
    timeLeftMs: isTimedRound ? timeLeftMs : null,
  };
}
