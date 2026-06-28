"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useTranslation } from "@/hooks/useLanguage";
import useFillGame from "@/hooks/useFillGame";
import PourExitDialog from "@/components/ui/game/PourExitDialog";
import PourIntroPhase from "@/components/ui/game/PourIntroPhase";
import PourTargetGuide from "@/components/ui/game/PourTargetGuide";
import OpponentWaterLayers from "@/components/sections/gameplay/OpponentWaterLayers";
import WaterPhysicsCanvas from "@/components/sections/gameplay/WaterPhysicsCanvas";
import {
  CHAOS_BRIEFING_MS,
  DEFAULT_DIFFICULTY_ID,
  GAME_DIFFICULTIES,
  GAME_MODE_OPTIONS,
  GAME_RULE_MODES,
  PERFECT_ZONE_RADIUS,
  SIPHON_LEAK_RATE_PER_SECOND,
  TIME_ATTACK_RESULT_AUTO_ADVANCE_MS,
  TIME_ATTACK_ZONE_RADIUS,
  WATER_COLORS,
} from "@/lib/constants";
import {
  playBriefingTimerTick,
  playRoundAdvance,
  playRoundResult,
  playTimeAttackFail,
  startRoundScoreCountSound,
  startChargeLoop,
  startPourLoop,
} from "@/lib/sound";
import { formatScore, normalizeRoundScore } from "@/lib/scoring";
import {
  releaseRevealRowMasks,
  setRevealRowMasks,
} from "@/lib/revealMasks";
import {
  releaseGameStartTransitionOverlay,
  requestNextFullScreenReveal,
} from "@/hooks/useScreenReveal";
import {
  clearGameResumeSnapshot,
  createGameResumeKey,
  readGameResumeSnapshot,
  writeGameResumeSnapshot,
} from "@/lib/gameResume";
import {
  fadeOutMusic,
  MUSIC_SCENES,
  startMusicScene,
  transitionMusicToScene,
} from "@/lib/music";

const STABLE_REVEAL_TRANSFORM = { force3D: false };
const ROUND_INTRO_MUSIC_FADE_SECONDS = 0.86;

function getRevealMaskRows(targets) {
  return Array.from(
    new Set(
      targets
        .map((target) => target?.parentElement)
        .filter((row) => row instanceof HTMLElement),
    ),
  );
}

function releaseOverflowMasks(rows) {
  releaseRevealRowMasks(gsap, rows);
}

function formatPercent(value) {
  return `${clamp(Number(value) || 0, 0, 100).toFixed(1)}%`;
}

function formatDiff(value) {
  if (value === null || value === undefined) {
    return "00";
  }

  return value.toFixed(2);
}

function formatTimerClock(value) {
  return (Math.max(0, value) / 1000).toFixed(2);
}

function formatRaceClock(value) {
  const totalSeconds = Math.max(0, Number(value) || 0) / 1000;

  if (totalSeconds < 60) {
    return totalSeconds.toFixed(2);
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2).padStart(5, "0");

  return `${minutes}:${seconds}`;
}

function formatChaosBriefingTimeParts(value) {
  const safeValue = Math.max(0, value);
  const totalCentiseconds = Math.ceil(safeValue / 10);
  const seconds = Math.floor(totalCentiseconds / 100);
  const centiseconds = totalCentiseconds % 100;

  return {
    centiseconds: String(centiseconds).padStart(2, "0"),
    seconds: String(clamp(seconds, 0, 9)),
    secondsValue: seconds,
    timerText: `${seconds}.${String(centiseconds).padStart(2, "0")}`,
  };
}

function ChaosCountdownWheel({ value }) {
  const { centiseconds, seconds, secondsValue, timerText } =
    formatChaosBriefingTimeParts(value);
  const wheelRef = useRef(null);
  const secondsRef = useRef(null);
  const previousSecondsRef = useRef(secondsValue);
  const previousTickRef = useRef(Math.ceil(value / 250));

  useLayoutEffect(() => {
    const secondsElement = secondsRef.current;
    const previousSeconds = previousSecondsRef.current;

    previousSecondsRef.current = secondsValue;

    if (!secondsElement || previousSeconds === secondsValue) {
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    gsap.killTweensOf(secondsElement);

    const timeline = gsap.timeline({
      defaults: {
        overwrite: "auto",
      },
      onComplete: () => {
        gsap.set(secondsElement, {
          clearProps: "filter,transform,willChange",
        });
      },
    });

    timeline
      .fromTo(
        secondsElement,
        {
          filter: "blur(2px)",
          scale: 0.94,
          y: -2,
          willChange: "transform",
        },
        {
          duration: 0.2,
          ease: "power3.out",
          filter: "blur(0px)",
          scale: 1.035,
          y: 0,
        },
      )
      .to(secondsElement, {
        duration: 0.16,
        ease: "power3.out",
        scale: 1,
      });

    return () => {
      timeline.kill();
      gsap.set(secondsElement, {
        clearProps: "filter,transform,willChange",
      });
    };
  }, [secondsValue]);

  useEffect(() => {
    const tick = Math.ceil(value / 250);
    const previousTick = previousTickRef.current;

    previousTickRef.current = tick;

    if (tick === previousTick || value <= 0 || value >= CHAOS_BRIEFING_MS) {
      return;
    }

    playBriefingTimerTick({
      accented: tick % 4 === 0,
      urgency: 1 - value / CHAOS_BRIEFING_MS,
    });
  }, [value]);

  return (
    <div
      aria-label={timerText}
      className="pc-chaos-countdown-wheel"
      ref={wheelRef}
      role="timer"
    >
      <span className="pc-chaos-countdown-seconds" ref={secondsRef}>
        {seconds}
      </span>
      <span className="pc-chaos-countdown-centiseconds">
        .{centiseconds}
      </span>
    </div>
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampPercent(value, fallback = 0) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return fallback;

  return clamp(parsed, 0, 100);
}

function clampUnit(value, fallback = 0.5) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return fallback;

  return clamp(parsed, 0, 1);
}

function clampTiltValue(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return 0;

  return clamp(parsed, -1, 1);
}

function createGameplayResumeKey({ isMultiplayer, playerId, settings }) {
  if (settings?.resumeKey) return settings.resumeKey;

  return createGameResumeKey([
    isMultiplayer ? "multiplayer" : settings?.mode,
    settings?.route,
    playerId,
    settings?.difficulty,
    settings?.ruleMode,
    settings?.roundCount,
    settings?.waterColorId,
    settings?.targetSeed,
  ]);
}

function getSnapshotRoundIndex(snapshot) {
  const roundIndex = Number(snapshot?.game?.roundIndex);

  return Number.isInteger(roundIndex) ? roundIndex : null;
}

function getRuleModeOption(ruleMode) {
  return (
    GAME_MODE_OPTIONS.find((option) => option.id === ruleMode) ||
    GAME_MODE_OPTIONS[0]
  );
}

function ModeRoundBriefing({ isChaosQueue, onComplete, ruleMode }) {
  const [timeLeftMs, setTimeLeftMs] = useState(CHAOS_BRIEFING_MS);
  const briefingRef = useRef(null);
  const completedRef = useRef(false);
  const option = getRuleModeOption(ruleMode);
  const { t } = useTranslation();

  const finishBriefing = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    setTimeLeftMs(0);
    onComplete();
  }, [onComplete]);

  const handleSkipBriefing = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      finishBriefing();
    },
    [finishBriefing],
  );

  useLayoutEffect(() => {
    const root = briefingRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const rows = Array.from(root.querySelectorAll("[data-chaos-briefing-row]"));
    const items = rows
      .map((row) => row.firstElementChild)
      .filter(Boolean);

    if (!items.length) {
      return undefined;
    }

    const timeline = gsap.timeline({
      defaults: {
        duration: 0.62,
        ease: "expo.out",
        overwrite: "auto",
      },
      onComplete: () => releaseOverflowMasks(rows),
    });

    setRevealRowMasks(gsap, rows);
    gsap.set(items, {
      autoAlpha: 0,
      ...STABLE_REVEAL_TRANSFORM,
      yPercent: -190,
    });

    timeline.to(items, {
      autoAlpha: 1,
      ...STABLE_REVEAL_TRANSFORM,
      stagger: 0.085,
      yPercent: 0,
    });

    return () => {
      timeline.kill();
      releaseOverflowMasks(rows);
    };
  }, [ruleMode]);

  useEffect(() => {
    completedRef.current = false;

    let animationFrameId;
    const startedAt = performance.now();

    const tick = (now) => {
      const nextTimeLeft = Math.max(0, CHAOS_BRIEFING_MS - (now - startedAt));

      setTimeLeftMs(nextTimeLeft);

      if (nextTimeLeft <= 0) {
        finishBriefing();
        return;
      }

      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [finishBriefing, ruleMode]);

  return (
    <section
      className="absolute inset-0 z-50 grid place-items-center bg-[#f7f7f2] px-6 py-8 text-center text-[#0d0d0c] sm:px-8 md:px-10"
      data-game-control="true"
      ref={briefingRef}
    >
      <div className="grid w-full max-w-[36rem] justify-items-center gap-4 sm:gap-5">
        <div data-chaos-briefing-row="true">
          <p className="pc-label text-[#0d0d0c]/52">
            {isChaosQueue ? t("game.chaosQueue") : t("setup.mode")}
          </p>
        </div>
        <div className="w-full min-w-0 px-2" data-chaos-briefing-row="true">
          <h1 className="pc-result-score mx-auto max-w-full break-words text-balance uppercase text-[#0d0d0c] [font-size:clamp(2.55rem,8.4vw,4.85rem)] [overflow-wrap:anywhere] sm:[font-size:clamp(3.05rem,6.9vw,5.75rem)]">
            {t(`modes.${option.id}.label`)}
          </h1>
        </div>
        <div data-chaos-briefing-row="true">
          <p className="pc-copy mx-auto max-w-[30rem] text-[#0d0d0c]/62">
            {t(`modes.${ruleMode}.briefing`)}
          </p>
        </div>
        <div data-chaos-briefing-row="true">
          <ChaosCountdownWheel value={timeLeftMs} />
        </div>
      </div>
      <button
        className="pc-chaos-skip pc-label absolute bottom-6 right-6 text-[#0d0d0c]/35 transition-colors duration-200 hover:text-[#0d0d0c]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] md:bottom-8 md:right-8"
        data-game-control="true"
        onClick={handleSkipBriefing}
        onPointerDown={(event) => event.stopPropagation()}
        type="button"
      >
        {t("game.skipBriefing")}
      </button>
    </section>
  );
}

function SplitTargetGuides({ splitTargets }) {
  const { t } = useTranslation();

  return (
    <div className="pointer-events-none absolute inset-0 z-40 grid grid-cols-2">
      {splitTargets.map((splitTarget, index) => (
        <div
          className="relative min-h-0 border-[#0d0d0c]/12 first:border-r"
          key={`${splitTarget}-${index}`}
        >
          <div
            className="absolute inset-x-0"
            style={{ top: `${100 - splitTarget}%` }}
          >
            <div className="absolute inset-x-0 top-0 border-t-2 border-dashed border-[#0d0d0c]/40" />
            <span
              className={[
                "pc-label absolute top-0 -mt-5 inline-flex rounded-md bg-[#0d0d0c] px-3 py-2 text-white",
                "right-4",
              ].join(" ")}
            >
              <span className="hidden sm:inline">
                {index === 0 ? t("game.left") : t("game.right")}{" "}
              </span>
              {formatPercent(splitTarget)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BandTargetGuides({ activeIndex = 0, bandTargets = [] }) {
  return (
    <>
      {bandTargets.map((bandTarget, index) => {
        const safeBandTarget = clamp(Number(bandTarget) || 0, 0, 100);

        return (
          <div
            className="pointer-events-none absolute inset-x-0 z-40"
            data-gameplay-reveal="target-guide"
            key={`${safeBandTarget}-${index}`}
            style={{ top: `${100 - safeBandTarget}%` }}
          >
            <div
              className={[
                "absolute inset-x-[-8vw] top-0 border-t-2 border-dashed [transform-origin:center_center] dark:border-[#f7f7f2]/46",
                index === activeIndex
                  ? "border-[#0d0d0c]/58"
                  : "border-[#0d0d0c]/24",
              ].join(" ")}
              data-gameplay-reveal-line="true"
            />
            <span
              className={[
                "pc-label absolute right-6 top-0 inline-flex -translate-y-1/2 rounded-md px-3 py-2 md:right-8",
                index === activeIndex
                  ? "bg-[#0d0d0c] text-white dark:bg-[#f7f7f2] dark:text-[#0d0d0c]"
                  : "bg-[#0d0d0c]/38 text-white dark:bg-[#f7f7f2]/22 dark:text-[#f7f7f2]",
              ].join(" ")}
              data-gameplay-reveal-badge="true"
            >
              {formatPercent(safeBandTarget)}
            </span>
          </div>
        );
      })}
    </>
  );
}

function getResultMessage(result, t) {
  if (!result) {
    return "";
  }

  if (result.ruleMode === GAME_RULE_MODES.TIME_ATTACK) {
    return t("game.timeAttackClearedMessage", {
      time: formatRaceClock(result.roundElapsedMs ?? result.elapsedMs),
    });
  }

  const diff = result.diff ?? 100;
  const bucket =
    diff <= 0.75
      ? "perfect"
      : diff <= 4
        ? "close"
        : result.level < result.target
          ? "low"
          : "high";
  const messages = t(`game.resultMessages.${bucket}`);
  const messageIndex =
    (result.round +
      Math.round(result.level * 10) +
      Math.round(result.target * 10)) %
    messages.length;

  return messages[messageIndex];
}

function getResultLabel(label, t) {
  const labels = {
    "NO SCORE": t("game.labels.noScore"),
    "BAND MISS": t("game.bandMiss"),
    "CLEARED": t("game.labels.cleared"),
    "PERFECT!": t("game.labels.perfect"),
    "SO CLOSE!": t("game.labels.soClose"),
    "SPLIT MISS": t("game.splitMiss"),
    "TOO HIGH!": t("game.labels.tooHigh"),
    "TOO LOW!": t("game.labels.tooLow"),
  };

  return labels[label] ?? label;
}

export default function GameplayScreen({
  animateCompleteExit = false,
  gameTargets = null,
  isMultiplayer = false,
  onComplete,
  onExit,
  onRoundResult,
  onWaterState,
  opponentWaterStates = [],
  playerId = null,
  settings,
}) {
  const { t } = useTranslation();
  useLayoutEffect(() => {
    releaseGameStartTransitionOverlay();
  }, []);
  const resumeKey = createGameplayResumeKey({
    isMultiplayer,
    playerId,
    settings,
  });
  const [initialResumeSnapshot] = useState(() =>
    readGameResumeSnapshot(resumeKey),
  );
  const initialWaterSnapshot = initialResumeSnapshot?.water || null;
  const initialActiveSplitIndex =
    initialWaterSnapshot?.activeSplitIndex === 1 ? 1 : 0;
  const resumeWaterLevel = clampPercent(initialWaterSnapshot?.level, 0);
  const resumeWaterSurfaceLevel = clampPercent(
    initialWaterSnapshot?.surfaceLevel,
    resumeWaterLevel,
  );
  const resumeSplitLeftLevel = clampPercent(
    initialWaterSnapshot?.splitLeftLevel,
    0,
  );
  const resumeSplitLeftSurfaceLevel = clampPercent(
    initialWaterSnapshot?.splitLeftSurfaceLevel,
    resumeSplitLeftLevel,
  );
  const resumeSplitRightLevel = clampPercent(
    initialWaterSnapshot?.splitRightLevel,
    0,
  );
  const resumeSplitRightSurfaceLevel = clampPercent(
    initialWaterSnapshot?.splitRightSurfaceLevel,
    resumeSplitRightLevel,
  );
  const pourXRef = useRef(clampUnit(initialWaterSnapshot?.pourX, 0.5));
  const pourSoundRef = useRef(null);
  const chargeSoundStartedAtRef = useRef(0);
  const completeExitTimelineRef = useRef(null);
  const gameMusicStartedRef = useRef(false);
  const gameplayRevealKeyRef = useRef("");
  const gameplayRevealTimelineRef = useRef(null);
  const gameplayRootRef = useRef(null);
  const gameplayRootRectRef = useRef({ left: 0, width: 1 });
  const gameplayTiltLayerRef = useRef(null);
  const timeAttackFailFlashRef = useRef(null);
  const timeAttackFailNonceRef = useRef(0);
  const resumeClearedRef = useRef(false);
  const resultSoundKeyRef = useRef("");
  const soundStatusRef = useRef("");
  const splitLeftLevelRef = useRef(resumeSplitLeftLevel);
  const splitLeftPourXRef = useRef(
    clampUnit(initialWaterSnapshot?.splitPourX?.[0], 0.5),
  );
  const splitLeftSettledRef = useRef(
    initialWaterSnapshot?.splitLeftSettled !== false,
  );
  const splitLeftSurfaceLevelRef = useRef(resumeSplitLeftSurfaceLevel);
  const splitRightLevelRef = useRef(resumeSplitRightLevel);
  const splitRightPourXRef = useRef(
    clampUnit(initialWaterSnapshot?.splitPourX?.[1], 0.5),
  );
  const splitRightSettledRef = useRef(
    initialWaterSnapshot?.splitRightSettled !== false,
  );
  const splitRightSurfaceLevelRef = useRef(resumeSplitRightSurfaceLevel);
  const splitStreamLevelRef = useRef(
    initialActiveSplitIndex === 0
      ? resumeSplitLeftSurfaceLevel
      : resumeSplitRightSurfaceLevel,
  );
  const submittedRoundsRef = useRef(new Set());
  const targetGuideLineRef = useRef(null);
  const targetGuideLabelRef = useRef(null);
  const tiltRef = useRef(clampTiltValue(initialWaterSnapshot?.tilt));
  const waterLevelRef = useRef(resumeWaterLevel);
  const waterSettledRef = useRef(initialWaterSnapshot?.settled !== false);
  const waterSurfaceLevelRef = useRef(resumeWaterSurfaceLevel);
  const isSplitFillModeRef = useRef(false);
  const [activeSplitIndex, setActiveSplitIndex] = useState(
    initialActiveSplitIndex,
  );
  const activeSplitIndexRef = useRef(initialActiveSplitIndex);
  const [modeBriefingRound, setModeBriefingRound] = useState(-1);
  const [blackoutVisible, setBlackoutVisible] = useState(false);
  const [flashTargetVisible, setFlashTargetVisible] = useState(false);
  const [isCompletingExit, setIsCompletingExit] = useState(false);
  const [visibleResultKey, setVisibleResultKey] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const diffValueRef = useRef(null);
  const resultScoreRef = useRef(null);
  const selectedWaterColor =
    WATER_COLORS.find((color) => color.id === settings?.waterColorId) ??
    WATER_COLORS[0];
  const difficulty = settings?.difficulty ?? DEFAULT_DIFFICULTY_ID;
  const ruleMode = settings?.ruleMode ?? GAME_RULE_MODES.CLASSIC;
  const getInitialLevelForMode = useCallback(
    (nextRuleMode = ruleMode) =>
      nextRuleMode === GAME_RULE_MODES.REVERSE_POUR ? 100 : 0,
    [ruleMode],
  );
  const getWaterLevel = useCallback(() => waterSurfaceLevelRef.current, []);
  const getWaterSettled = useCallback(
    () =>
      isSplitFillModeRef.current
        ? splitLeftSettledRef.current && splitRightSettledRef.current
        : waterSettledRef.current,
    [],
  );
  const getSplitLevels = useCallback(
    () => [splitLeftSurfaceLevelRef.current, splitRightSurfaceLevelRef.current],
    [],
  );
  const getTilt = useCallback(() => tiltRef.current, []);
  const resetWaterLevel = useCallback((nextRuleMode = ruleMode) => {
    const nextLevel = getInitialLevelForMode(nextRuleMode);

    waterLevelRef.current = nextLevel;
    waterSettledRef.current = true;
    waterSurfaceLevelRef.current = nextLevel;
    splitLeftLevelRef.current = 0;
    splitLeftSettledRef.current = true;
    splitLeftSurfaceLevelRef.current = 0;
    splitRightLevelRef.current = 0;
    splitRightSettledRef.current = true;
    splitRightSurfaceLevelRef.current = 0;
    splitStreamLevelRef.current = 0;
  }, [getInitialLevelForMode, ruleMode]);
  const {
    advanceRound,
    bandAttemptIndex,
    bandLevels,
    bandTargets,
    completeIntro,
    chargePowerRef,
    gameMode: activeRuleMode,
    fakeTarget,
    finishRound,
    isChaosQueue,
    isEndless,
    isFinalRound,
    lastResult,
    modeAllowsDone,
    phase,
    pourStatus,
    raceElapsedMs,
    raceRoundElapsedMs,
    raceRoundStartedAtElapsedMs,
    results,
    roundCount,
    roundIndex,
    roundResetNonce,
    showTargetGuide,
    splitTargets,
    startFilling,
    status,
    stopFilling,
    target,
    timeAttackFailNonce,
    timeLeftMs,
  } = useFillGame({
    getIsSettled: getWaterSettled,
    getSplitLevels,
    getTilt,
    getLevel: getWaterLevel,
    initialSnapshot: initialResumeSnapshot?.game,
    modeQueue: settings?.modeQueue,
    onRoundReset: resetWaterLevel,
    roundCount: settings?.roundCount,
    ruleMode,
    targetSeed: settings?.targetSeed,
    targets: gameTargets,
  });

  const isFakeTargetMode = activeRuleMode === GAME_RULE_MODES.FAKE_TARGET;
  const isFlashMode = activeRuleMode === GAME_RULE_MODES.FLASH;
  const isPerfectOrNothingMode =
    activeRuleMode === GAME_RULE_MODES.PERFECT_OR_NOTHING;
  const isInvertMode = activeRuleMode === GAME_RULE_MODES.INVERT;
  const isReversePourMode = activeRuleMode === GAME_RULE_MODES.REVERSE_POUR;
  const isSplitFillMode = activeRuleMode === GAME_RULE_MODES.SPLIT_FILL;
  const isBandRunMode = activeRuleMode === GAME_RULE_MODES.BAND_RUN;
  const isChargePourMode = activeRuleMode === GAME_RULE_MODES.CHARGE_POUR;
  const isBurstClickMode = activeRuleMode === GAME_RULE_MODES.BURST_CLICK;
  const isBlackoutBlindMode = activeRuleMode === GAME_RULE_MODES.COLORBLIND;
  const isAutoRiseMode = activeRuleMode === GAME_RULE_MODES.AUTO_RISE;
  const isSiphonMode = activeRuleMode === GAME_RULE_MODES.SIPHON;
  const isTimeAttackMode = activeRuleMode === GAME_RULE_MODES.TIME_ATTACK;
  const waterColor = selectedWaterColor;
  const canvasStatus =
    isChargePourMode && status === "filling" ? "idle" : status;
  const isPulsePourMode = isChargePourMode || isBurstClickMode;
  const isTiltMode = activeRuleMode === GAME_RULE_MODES.TILT;
  const resumeRoundIndex = getSnapshotRoundIndex(initialResumeSnapshot);
  const shouldUseResumeWater = resumeRoundIndex === roundIndex;
  const initialWaterLevel = shouldUseResumeWater
    ? resumeWaterLevel
    : getInitialLevelForMode(activeRuleMode);
  const initialSplitLeftWaterLevel = shouldUseResumeWater
    ? resumeSplitLeftLevel
    : 0;
  const initialSplitRightWaterLevel = shouldUseResumeWater
    ? resumeSplitRightLevel
    : 0;
  const roundResetKey = `${roundIndex}:${roundResetNonce}`;
  const isIntroPhase = status === "intro";
  const isResultPhase = status === "result";
  const shouldShowRoundBriefing =
    isIntroPhase &&
    (isChaosQueue
      ? modeBriefingRound !== roundIndex
      : roundIndex === 0 && modeBriefingRound !== 0);
  const startGameplayMusic = useCallback(() => {
    if (gameMusicStartedRef.current) return;

    gameMusicStartedRef.current = true;
    startMusicScene(MUSIC_SCENES.GAME, {
      duration: 1.05,
      fromZero: true,
      reset: true,
    });
  }, []);
  const handleIntroComplete = useCallback(() => {
    completeIntro();
    window.requestAnimationFrame(() => {
      startGameplayMusic();
    });
  }, [completeIntro, startGameplayMusic]);
  const shouldShowTargetGuide =
    !isSplitFillMode &&
    !isBandRunMode &&
    !isIntroPhase &&
    (isFlashMode
      ? isResultPhase || flashTargetVisible
      : showTargetGuide || isResultPhase);
  const shouldShowSplitTargets = isSplitFillMode && !isIntroPhase;
  const shouldShowBandTargets = isBandRunMode && !isIntroPhase && !isResultPhase;
  const resultLabel = getResultLabel(lastResult?.label ?? "", t);
  const resultGuidance = getResultMessage(lastResult, t);
  const roundDiff = isResultPhase ? "00" : "00";
  const displayedRaceTime = formatRaceClock(raceElapsedMs);
  const approachGuidance =
    isEndless
      ? t("game.guidance.endless")
      : activeRuleMode === GAME_RULE_MODES.SPLIT_FILL
        ? t("game.guidance.split")
        : activeRuleMode === GAME_RULE_MODES.BAND_RUN
          ? t("game.guidance.band")
        : activeRuleMode === GAME_RULE_MODES.CHARGE_POUR
          ? t(`modes.${GAME_RULE_MODES.CHARGE_POUR}.briefing`)
        : activeRuleMode === GAME_RULE_MODES.BURST_CLICK
          ? t(`modes.${GAME_RULE_MODES.BURST_CLICK}.briefing`)
        : activeRuleMode === GAME_RULE_MODES.COLORBLIND
          ? t(`modes.${GAME_RULE_MODES.COLORBLIND}.briefing`)
        : activeRuleMode === GAME_RULE_MODES.AUTO_RISE
          ? t(`modes.${GAME_RULE_MODES.AUTO_RISE}.briefing`)
        : activeRuleMode === GAME_RULE_MODES.FLASH
          ? t(`modes.${GAME_RULE_MODES.FLASH}.briefing`)
        : activeRuleMode === GAME_RULE_MODES.BLIND
          ? t(`modes.${GAME_RULE_MODES.BLIND}.briefing`)
          : activeRuleMode === GAME_RULE_MODES.PERFECT_OR_NOTHING
            ? t("game.guidance.perfect")
            : activeRuleMode === GAME_RULE_MODES.LEAKY
              ? t(`modes.${GAME_RULE_MODES.LEAKY}.briefing`)
              : activeRuleMode === GAME_RULE_MODES.SIPHON
                ? t(`modes.${GAME_RULE_MODES.SIPHON}.briefing`)
                : activeRuleMode === GAME_RULE_MODES.TIME_ATTACK
                  ? t(`modes.${GAME_RULE_MODES.TIME_ATTACK}.briefing`)
                  : activeRuleMode === GAME_RULE_MODES.FAKE_TARGET
                    ? t(`modes.${GAME_RULE_MODES.FAKE_TARGET}.briefing`)
                    : activeRuleMode === GAME_RULE_MODES.INVERT
                      ? t(`modes.${GAME_RULE_MODES.INVERT}.briefing`)
                      : activeRuleMode === GAME_RULE_MODES.REVERSE_POUR
                        ? t(`modes.${GAME_RULE_MODES.REVERSE_POUR}.briefing`)
                        : activeRuleMode === GAME_RULE_MODES.TILT
                          ? t(`modes.${GAME_RULE_MODES.TILT}.briefing`)
                          : t("game.guidance.classic");
  const displayedGoal =
    isSplitFillMode
        ? `${formatPercent(splitTargets[0])} / ${formatPercent(splitTargets[1])}`
        : isBandRunMode
          ? `${Math.min(bandAttemptIndex + 1, bandTargets.length)} / ${bandTargets.length}`
        : (isFakeTargetMode || isFlashMode) && !isResultPhase
          ? "--"
          : formatPercent(target);
  const displayedRound = isEndless
    ? `${t(`modes.${GAME_RULE_MODES.ENDLESS}.label`)} ${roundIndex + 1}`
    : `${t("game.round")} ${roundIndex + 1} / ${roundCount}`;
  const currentResultKey = lastResult
    ? `${lastResult.roundIndex}:${lastResult.score}:${lastResult.diff}:${lastResult.elapsedMs ?? ""}:${lastResult.roundElapsedMs ?? ""}`
    : "";
  const shouldShowResultContent =
    isResultPhase && Boolean(currentResultKey) && visibleResultKey === currentResultKey;
  const displayedLevelTime =
    shouldShowResultContent && lastResult?.ruleMode === GAME_RULE_MODES.TIME_ATTACK
      ? formatRaceClock(lastResult.roundElapsedMs ?? lastResult.elapsedMs)
      : formatRaceClock(raceRoundElapsedMs);

  useEffect(() => {
    if (isIntroPhase) {
      gameMusicStartedRef.current = false;
    }
  }, [isIntroPhase, roundIndex]);

  useEffect(() => {
    if (isIntroPhase || isResultPhase || shouldShowRoundBriefing) return;

    startGameplayMusic();
  }, [
    isIntroPhase,
    isResultPhase,
    shouldShowRoundBriefing,
    startGameplayMusic,
  ]);

  useEffect(() => {
    if (
      isIntroPhase ||
      isResultPhase ||
      shouldShowRoundBriefing ||
      !isFlashMode
    ) {
      const timerId = window.setTimeout(() => {
        setFlashTargetVisible(false);
      }, 0);
      return () => window.clearTimeout(timerId);
    }

    const showTimerId = window.setTimeout(() => {
      setFlashTargetVisible(true);
    }, 0);
    const hideTimerId = window.setTimeout(() => {
      setFlashTargetVisible(false);
    }, 500);

    return () => {
      window.clearTimeout(showTimerId);
      window.clearTimeout(hideTimerId);
    };
  }, [isFlashMode, isIntroPhase, isResultPhase, roundIndex, shouldShowRoundBriefing]);

  useLayoutEffect(() => {
    if (timeAttackFailNonce === timeAttackFailNonceRef.current) {
      return undefined;
    }

    timeAttackFailNonceRef.current = timeAttackFailNonce;

    if (!timeAttackFailNonce || !isTimeAttackMode || isIntroPhase || isResultPhase) {
      return undefined;
    }

    playTimeAttackFail();

    const root = gameplayRootRef.current;
    const flash = timeAttackFailFlashRef.current;
    if (!root) return undefined;

    const layers = [
      root.querySelector("[data-gameplay-water-layer='true']"),
      root.querySelector("[data-gameplay-content='true']"),
    ].filter(Boolean);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    gsap.killTweensOf([...layers, flash].filter(Boolean));

    if (reducedMotion) {
      if (flash) {
        gsap.fromTo(
          flash,
          { autoAlpha: 0.22 },
          { autoAlpha: 0, duration: 0.22, ease: "power2.out" },
        );
      }
      return undefined;
    }

    const timeline = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        gsap.set(layers, { clearProps: "transform,willChange" });
      },
    });

    timeline.set(layers, {
      transformOrigin: "50% 50%",
      willChange: "transform",
    });

    if (flash) {
      timeline.fromTo(
        flash,
        { autoAlpha: 0, scale: 0.985 },
        { autoAlpha: 0.26, duration: 0.035, ease: "power1.out", scale: 1 },
        0,
      );
      timeline.to(
        flash,
        { autoAlpha: 0, duration: 0.3, ease: "power3.out" },
        0.055,
      );
    }

    timeline
      .to(layers, { duration: 0.035, rotate: -0.18, x: -7, y: 3 }, 0)
      .to(layers, { duration: 0.045, rotate: 0.2, x: 8, y: -3 })
      .to(layers, { duration: 0.04, rotate: -0.1, x: -4, y: 2 })
      .to(layers, {
        duration: 0.18,
        ease: "expo.out",
        rotate: 0,
        scale: 1,
        x: 0,
        y: 0,
      });

    return () => {
      timeline.kill();
      gsap.set(layers, { clearProps: "transform,willChange" });
      if (flash) gsap.set(flash, { autoAlpha: 0, clearProps: "scale" });
    };
  }, [
    isIntroPhase,
    isResultPhase,
    isTimeAttackMode,
    timeAttackFailNonce,
  ]);

  useEffect(() => {
    const resetTimerId = window.setTimeout(() => {
      setBlackoutVisible(false);
    }, 0);

    if (
      !isBlackoutBlindMode ||
      isIntroPhase ||
      isResultPhase ||
      shouldShowRoundBriefing
    ) {
      return () => window.clearTimeout(resetTimerId);
    }

    const showTimerId = window.setTimeout(() => {
      setBlackoutVisible(true);
    }, 1000);

    return () => {
      window.clearTimeout(resetTimerId);
      window.clearTimeout(showTimerId);
    };
  }, [
    isBlackoutBlindMode,
    isIntroPhase,
    isResultPhase,
    roundIndex,
    shouldShowRoundBriefing,
  ]);

  useLayoutEffect(() => {
    const root = gameplayRootRef.current;
    if (!root) return undefined;

    const syncRootRect = () => {
      const rect = root.getBoundingClientRect();
      gameplayRootRectRef.current = {
        left: rect.left,
        width: rect.width || 1,
      };
    };

    syncRootRect();

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(syncRootRect);
      resizeObserver.observe(root);

      return () => resizeObserver.disconnect();
    }

    window.addEventListener("resize", syncRootRect);

    return () => window.removeEventListener("resize", syncRootRect);
  }, []);

  useLayoutEffect(() => {
    const root = gameplayRootRef.current;
    const revealKey = `${roundIndex}:${activeRuleMode}`;

    if (
      !root ||
      isIntroPhase ||
      isResultPhase ||
      shouldShowRoundBriefing ||
      gameplayRevealKeyRef.current === revealKey
    ) {
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gameplayRevealKeyRef.current = revealKey;
      return undefined;
    }

    gameplayRevealKeyRef.current = revealKey;
    gameplayRevealTimelineRef.current?.kill();

    const title = root.querySelector("[data-gameplay-reveal='hold-title']");
    const subtitle = root.querySelector("[data-gameplay-reveal='hold-copy']");
    const round = root.querySelector("[data-gameplay-reveal='round']");
    const goal = root.querySelector("[data-gameplay-reveal='goal']");
    const diff = root.querySelector("[data-gameplay-reveal='diff']");
    const lines = Array.from(
      root.querySelectorAll("[data-gameplay-reveal-line='true']"),
    );
    const badges = Array.from(
      root.querySelectorAll("[data-gameplay-reveal-badge='true']"),
    );
    const primary = [title, subtitle].filter(Boolean);
    const hud = [round, goal, diff].filter(Boolean);
    const maskRows = getRevealMaskRows([...primary, ...hud]);

    const timeline = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => releaseOverflowMasks(maskRows),
    });

    setRevealRowMasks(gsap, maskRows);
    gsap.set(primary, {
      autoAlpha: 0,
      ...STABLE_REVEAL_TRANSFORM,
      yPercent: -190,
    });
    gsap.set(hud, {
      autoAlpha: 0,
      ...STABLE_REVEAL_TRANSFORM,
      yPercent: -150,
    });
    gsap.set(lines, {
      autoAlpha: 0,
      ...STABLE_REVEAL_TRANSFORM,
      scaleX: 0,
      transformOrigin: "center center",
    });
    gsap.set(badges, {
      autoAlpha: 0,
      ...STABLE_REVEAL_TRANSFORM,
      y: -10,
      yPercent: -50,
      scale: 0.96,
    });

    timeline
      .to(
        title,
        {
          autoAlpha: 1,
          duration: 0.72,
          ease: "expo.out",
          ...STABLE_REVEAL_TRANSFORM,
          yPercent: 0,
        },
        0,
      )
      .to(
        subtitle,
        {
          autoAlpha: 1,
          duration: 0.64,
          ease: "expo.out",
          ...STABLE_REVEAL_TRANSFORM,
          yPercent: 0,
        },
        0.18,
      )
      .to(
        lines,
        {
          autoAlpha: 1,
          duration: 0.62,
          ease: "power3.inOut",
          ...STABLE_REVEAL_TRANSFORM,
          scaleX: 1,
        },
        0.4,
      )
      .to(
        badges,
        {
          autoAlpha: 1,
          duration: 0.48,
          ease: "back.out(1.35)",
          ...STABLE_REVEAL_TRANSFORM,
          scale: 1,
          y: 0,
          yPercent: -50,
        },
        0.58,
      )
      .to(
        hud,
        {
          autoAlpha: 1,
          duration: 0.58,
          ease: "expo.out",
          ...STABLE_REVEAL_TRANSFORM,
          yPercent: 0,
        },
        0.9,
      );

    gameplayRevealTimelineRef.current = timeline;

    return () => {
      timeline.kill();
      releaseOverflowMasks(maskRows);
    };
  }, [
    activeRuleMode,
    isIntroPhase,
    isResultPhase,
    roundIndex,
    shouldShowRoundBriefing,
  ]);

  useLayoutEffect(() => {
    if (!isResultPhase || !currentResultKey || shouldShowResultContent) {
      return undefined;
    }

    const root = gameplayRootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frameId = window.requestAnimationFrame(() => {
        setVisibleResultKey(currentResultKey);
      });
      return () => window.cancelAnimationFrame(frameId);
    }

    let completed = false;
    const showResult = () => {
      if (completed) return;
      completed = true;
      setVisibleResultKey(currentResultKey);
    };

    const showFrame = () => window.requestAnimationFrame(showResult);
    let frameId = 0;

    const title = root.querySelector("[data-gameplay-reveal='hold-title']");
    const copy = root.querySelector("[data-gameplay-reveal='hold-copy']");
    const targets = [title, copy].filter(Boolean);

    if (!targets.length) {
      frameId = showFrame();
      return () => window.cancelAnimationFrame(frameId);
    }

    const timeline = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: showResult,
    });

    timeline.to(targets, {
      autoAlpha: 0,
      duration: 0.28,
      ease: "power2.inOut",
      stagger: 0.035,
    });

    return () => {
      timeline.kill();
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [currentResultKey, isResultPhase, shouldShowResultContent]);

  useEffect(() => {
    const diffElement = diffValueRef.current;

    if (!diffElement) return undefined;

    if (isTimeAttackMode) {
      diffElement.textContent = displayedLevelTime;
      return undefined;
    }

    if (!isResultPhase || !shouldShowResultContent || !lastResult) {
      diffElement.textContent = "00";
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      diffElement.textContent = formatDiff(lastResult.diff);
      return undefined;
    }

    const state = { value: 0 };
    diffElement.textContent = "00";

    const tween = gsap.to(state, {
      value: lastResult.diff,
      duration: 0.92,
      ease: "power2.out",
      onUpdate: () => {
        diffElement.textContent = formatDiff(state.value);
      },
      onComplete: () => {
        diffElement.textContent = formatDiff(lastResult.diff);
      },
    });

    return () => tween.kill();
  }, [
    currentResultKey,
    displayedLevelTime,
    isResultPhase,
    isTimeAttackMode,
    lastResult,
    shouldShowResultContent,
  ]);

  useLayoutEffect(() => {
    if (!shouldShowResultContent || !lastResult) return undefined;

    const root = gameplayRootRef.current;
    if (!root) return undefined;

    const score = resultScoreRef.current;
    const title = root.querySelector("[data-gameplay-result-reveal='title']");
    const copy = root.querySelector("[data-gameplay-result-reveal='copy']");
    const action = root.querySelector("[data-gameplay-result-reveal='action']");
    const targets = [score, title, copy, action].filter(Boolean);
    const maskRows = getRevealMaskRows(targets);
    const resultKey = currentResultKey;
    const isTimeAttackResult = lastResult.ruleMode === GAME_RULE_MODES.TIME_ATTACK;
    const displayScore = isTimeAttackResult
      ? 0
      : normalizeRoundScore(lastResult.score);
    const displayTime = formatRaceClock(
      lastResult.roundElapsedMs ?? lastResult.elapsedMs,
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (score && isTimeAttackResult) {
        score.textContent = displayTime;
      }
      if (resultSoundKeyRef.current !== resultKey) {
        resultSoundKeyRef.current = resultKey;
        playRoundResult(isTimeAttackResult ? 10 : displayScore, lastResult.diff);
      }
      return undefined;
    }

    gsap.set(targets, {
      autoAlpha: 0,
      ...STABLE_REVEAL_TRANSFORM,
      y: 18,
    });
    setRevealRowMasks(gsap, maskRows);
    gsap.set(score, {
      ...STABLE_REVEAL_TRANSFORM,
      yPercent: 90,
      transformOrigin: "center center",
    });
    if (action) {
      gsap.set(action, {
        ...STABLE_REVEAL_TRANSFORM,
        scale: 0,
        transformOrigin: "center center",
      });
    }
    if (score) {
      score.textContent = isTimeAttackResult ? displayTime : formatScore(0);
    }

    let scoreSound = null;
    let scoreTween = null;
    const scoreQuality = clamp(displayScore / 10, 0, 1);
    const scoreCountDuration =
      displayScore <= 0.05 ? 0.28 : 0.46 + scoreQuality * 0.62;
    const timeline = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => releaseOverflowMasks(maskRows),
    });

    timeline
      .to(
        score,
        {
          autoAlpha: 1,
          duration: 0.64,
          ease: "expo.out",
          ...STABLE_REVEAL_TRANSFORM,
          y: 0,
          yPercent: 0,
        },
        0,
      )
      .call(
        () => {
          if (!score) return;

          if (isTimeAttackResult) {
            score.textContent = displayTime;
            if (resultSoundKeyRef.current !== resultKey) {
              resultSoundKeyRef.current = resultKey;
              playRoundResult(10, lastResult.diff);
            }
            return;
          }

          const state = { value: 0 };
          score.textContent = formatScore(0);
          scoreSound = startRoundScoreCountSound({
            duration: scoreCountDuration,
            score: displayScore,
          });

          scoreTween = gsap.to(state, {
            value: displayScore,
            duration: scoreCountDuration,
            ease: "power2.out",
            onUpdate: () => {
              const nextScore =
                Math.abs(displayScore - state.value) < 0.005
                  ? displayScore
                  : state.value;
              score.textContent = formatScore(nextScore);
            },
            onComplete: () => {
              score.textContent = formatScore(displayScore);
              scoreSound?.finish();
              if (resultSoundKeyRef.current !== resultKey) {
                resultSoundKeyRef.current = resultKey;
                playRoundResult(displayScore, lastResult.diff);
              }
            },
          });
        },
        null,
        0.3,
      )
      .to(
        title,
        {
          autoAlpha: 1,
          duration: 0.48,
          ease: "expo.out",
          ...STABLE_REVEAL_TRANSFORM,
          y: 0,
        },
        1.16,
      )
      .to(
        copy,
        {
          autoAlpha: 1,
          duration: 0.58,
          ease: "power4.out",
          ...STABLE_REVEAL_TRANSFORM,
          y: 0,
        },
        1.34,
      );

    if (action) {
      timeline
        .to(
          action,
          {
            autoAlpha: 1,
            duration: 0.22,
            ease: "expo.out",
            ...STABLE_REVEAL_TRANSFORM,
            scale: 1.08,
            y: 0,
          },
          1.64,
        )
        .to(
          action,
          {
            duration: 0.1,
            ease: "power3.out",
            ...STABLE_REVEAL_TRANSFORM,
            scale: 0.96,
          },
          1.86,
        )
        .to(
          action,
          {
            duration: 0.14,
            ease: "expo.out",
            ...STABLE_REVEAL_TRANSFORM,
            scale: 1,
          },
          1.96,
        );
    }

    return () => {
      timeline.kill();
      scoreTween?.kill();
      scoreSound?.stop?.();
      releaseOverflowMasks(maskRows);
    };
  }, [currentResultKey, lastResult, shouldShowResultContent]);

  useEffect(() => {
    isSplitFillModeRef.current = isSplitFillMode;
  }, [isSplitFillMode]);

  useEffect(() => {
    activeSplitIndexRef.current = activeSplitIndex;
  }, [activeSplitIndex]);

  useEffect(() => {
    if (isAutoRiseMode && status === "filling") {
      pourXRef.current = 0.5;
    }
  }, [isAutoRiseMode, roundIndex, status]);

  useEffect(() => {
    return () => {
      pourSoundRef.current?.stop({ level: waterLevelRef.current });
      pourSoundRef.current = null;
    };
  }, []);

  useEffect(() => {
    const previousStatus = soundStatusRef.current;

    if (previousStatus !== status) {
      if (
        previousStatus === "filling" ||
        previousStatus === "leaking" ||
        previousStatus === "burst"
      ) {
        const activeLevel = isSplitFillMode
          ? activeSplitIndexRef.current === 0
            ? splitLeftLevelRef.current
            : splitRightLevelRef.current
          : waterLevelRef.current;

        pourSoundRef.current?.stop({ level: activeLevel });
        pourSoundRef.current = null;
      }

      if (status === "filling" && isChargePourMode) {
        chargeSoundStartedAtRef.current = Date.now();
        pourSoundRef.current = startChargeLoop();
      }

      if (status === "filling" && !isChargePourMode) {
        pourSoundRef.current = startPourLoop({
          reverse: isReversePourMode,
        });
      }

      if (status === "burst") {
        pourSoundRef.current = startPourLoop({
          heavy: isChargePourMode,
        });
      }

      if (status === "leaking") {
        pourSoundRef.current = startPourLoop({
          leaky: true,
        });
      }

      soundStatusRef.current = status;
    }

  }, [isChargePourMode, isReversePourMode, isSplitFillMode, status]);

  useEffect(() => {
    const getActiveSoundLevel = () =>
      isSplitFillMode
        ? activeSplitIndexRef.current === 0
          ? splitLeftLevelRef.current
          : splitRightLevelRef.current
        : waterLevelRef.current;

    const stopLocalPourSound = ({ release = false } = {}) => {
      pourSoundRef.current?.stop({
        level: getActiveSoundLevel(),
        release,
      });
      pourSoundRef.current = null;
      soundStatusRef.current = "";
    };

    const restartLocalPourSound = () => {
      if (status !== "filling" && status !== "leaking" && status !== "burst") return;

      stopLocalPourSound({ release: false });
      pourSoundRef.current =
        isChargePourMode && status === "filling"
          ? (() => {
              chargeSoundStartedAtRef.current = Date.now();
              return startChargeLoop();
            })()
          : startPourLoop({
              heavy: isChargePourMode && status === "burst",
              leaky: status === "leaking",
              reverse: status === "filling" && isReversePourMode,
            });
      soundStatusRef.current = status;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopLocalPourSound({ release: false });
        return;
      }

      if (document.visibilityState === "visible") {
        restartLocalPourSound();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", restartLocalPourSound);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", restartLocalPourSound);
    };
  }, [isChargePourMode, isReversePourMode, isSplitFillMode, status]);

  useEffect(() => {
    if (
      status !== "filling" &&
      status !== "leaking" &&
      status !== "burst"
    ) return undefined;

    let animationFrameId = 0;

    const tick = () => {
      const activeLevel = isSplitFillMode
        ? activeSplitIndexRef.current === 0
          ? splitLeftLevelRef.current
          : splitRightLevelRef.current
        : waterLevelRef.current;
      const activeSurfaceLevel = isSplitFillMode
        ? activeSplitIndexRef.current === 0
          ? splitLeftSurfaceLevelRef.current
          : splitRightSurfaceLevelRef.current
        : waterSurfaceLevelRef.current;
      const soundLevel =
        isChargePourMode && status === "filling"
          ? clamp((Date.now() - chargeSoundStartedAtRef.current) / 1600, 0, 1)
          : isChargePourMode && status === "burst"
            ? clamp((chargePowerRef.current ?? 1) / 3.2, 0, 1)
          : activeLevel / 100;

      if (isSplitFillMode) {
        splitStreamLevelRef.current = activeSurfaceLevel;
      }

      pourSoundRef.current?.update(soundLevel);
      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [chargePowerRef, isChargePourMode, isSplitFillMode, status]);

  useEffect(() => {
    if (!isMultiplayer || !lastResult || !onRoundResult) {
      return;
    }

    const roundKey = `${lastResult.roundIndex}:${lastResult.level}`;
    if (submittedRoundsRef.current.has(roundKey)) {
      return;
    }

    submittedRoundsRef.current.add(roundKey);
    onRoundResult(lastResult);
  }, [isMultiplayer, lastResult, onRoundResult]);

  useEffect(() => {
    if (!isMultiplayer || !onWaterState) return undefined;

    let animationFrameId = 0;
    let lastSentAt = 0;

    const tick = (time) => {
      if (time - lastSentAt >= 90) {
        lastSentAt = time;
        onWaterState({
          activeSplitIndex: isSplitFillMode ? activeSplitIndexRef.current : null,
          isPouring:
            status === "filling" ||
            ((isChargePourMode || isBurstClickMode) && status === "burst"),
          level: isSplitFillMode
            ? activeSplitIndexRef.current === 0
              ? splitLeftLevelRef.current
              : splitRightLevelRef.current
            : waterLevelRef.current,
          pourX: pourXRef.current,
          roundIndex,
          splitLevels: isSplitFillMode
            ? [splitLeftLevelRef.current, splitRightLevelRef.current]
            : null,
          splitPourX: isSplitFillMode
            ? [splitLeftPourXRef.current, splitRightPourXRef.current]
            : null,
          status,
          tilt: tiltRef.current,
        });
      }

      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [
    isBurstClickMode,
    isChargePourMode,
    isMultiplayer,
    isSplitFillMode,
    onWaterState,
    roundIndex,
    status,
  ]);

  const createResumeSnapshot = useCallback(
    () => ({
      game: {
        bandAttemptIndex,
        bandLevels,
        bandTargets,
        fakeTarget,
        lastResult,
        phase,
        pourStatus,
        raceElapsedMs,
        raceRoundStartedAtElapsedMs,
        results,
        roundIndex,
        splitTargets,
        target,
        timeLeftMs,
      },
      water: {
        activeSplitIndex: activeSplitIndexRef.current,
        level: waterLevelRef.current,
        pourX: pourXRef.current,
        settled: waterSettledRef.current,
        splitLeftLevel: splitLeftLevelRef.current,
        splitLeftSettled: splitLeftSettledRef.current,
        splitLeftSurfaceLevel: splitLeftSurfaceLevelRef.current,
        splitPourX: [splitLeftPourXRef.current, splitRightPourXRef.current],
        splitRightLevel: splitRightLevelRef.current,
        splitRightSettled: splitRightSettledRef.current,
        splitRightSurfaceLevel: splitRightSurfaceLevelRef.current,
        surfaceLevel: waterSurfaceLevelRef.current,
        tilt: tiltRef.current,
      },
    }),
    [
      bandAttemptIndex,
      bandLevels,
      bandTargets,
      fakeTarget,
      lastResult,
      phase,
      pourStatus,
      raceElapsedMs,
      raceRoundStartedAtElapsedMs,
      results,
      roundIndex,
      splitTargets,
      target,
      timeLeftMs,
    ],
  );

  const clearResumeSnapshot = useCallback(() => {
    resumeClearedRef.current = true;
    clearGameResumeSnapshot(resumeKey);
  }, [resumeKey]);

  useEffect(() => {
    resumeClearedRef.current = false;
  }, [resumeKey]);

  useEffect(() => {
    if (!resumeKey) return undefined;

    if (status === "complete") {
      clearResumeSnapshot();
      return undefined;
    }

    const persistResumeSnapshot = () => {
      if (resumeClearedRef.current) return;

      writeGameResumeSnapshot(resumeKey, createResumeSnapshot());
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistResumeSnapshot();
      }
    };

    persistResumeSnapshot();

    const intervalId = window.setInterval(persistResumeSnapshot, 350);

    window.addEventListener("beforeunload", persistResumeSnapshot);
    window.addEventListener("pagehide", persistResumeSnapshot);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      persistResumeSnapshot();
      window.clearInterval(intervalId);
      window.removeEventListener("beforeunload", persistResumeSnapshot);
      window.removeEventListener("pagehide", persistResumeSnapshot);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearResumeSnapshot, createResumeSnapshot, resumeKey, status]);

  const playCompleteExit = useCallback(
    () =>
      new Promise((resolve) => {
        completeExitTimelineRef.current?.kill();

        if (
          !animateCompleteExit ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          resolve();
          return;
        }

        const root = gameplayRootRef.current;
        if (!root) {
          resolve();
          return;
        }

        const exitTargets = Array.from(
          root.querySelectorAll(
            "[data-gameplay-water-layer='true'], [data-gameplay-content='true']",
          ),
        );

        if (!exitTargets.length) {
          resolve();
          return;
        }

        const timeline = gsap.timeline({
          defaults: { overwrite: "auto" },
          onComplete: resolve,
        });

        timeline.to(exitTargets, {
          autoAlpha: 0,
          duration: 0.42,
          ease: "power2.inOut",
          ...STABLE_REVEAL_TRANSFORM,
          y: -8,
          stagger: 0.045,
        });

        completeExitTimelineRef.current = timeline;
      }),
    [animateCompleteExit],
  );

  const handleAdvance = useCallback(async () => {
    if (isCompletingExit) return;

    if (!isFinalRound) {
      gameMusicStartedRef.current = false;
      fadeOutMusic({
        curve: "linear",
        duration: ROUND_INTRO_MUSIC_FADE_SECONDS,
        keepSchedulerDuringFade: true,
      });
    }

    playRoundAdvance();
    const finalResults = advanceRound();

    if (finalResults) {
      clearResumeSnapshot();
      if (animateCompleteExit) {
        setIsCompletingExit(true);
        await playCompleteExit();
      }
      await onComplete?.(finalResults);
    }
  }, [
    advanceRound,
    animateCompleteExit,
    clearResumeSnapshot,
    isCompletingExit,
    isFinalRound,
    onComplete,
    playCompleteExit,
  ]);

  useEffect(() => {
    if (!isTimeAttackMode || !shouldShowResultContent || !currentResultKey) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void handleAdvance();
    }, TIME_ATTACK_RESULT_AUTO_ADVANCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [
    currentResultKey,
    handleAdvance,
    isTimeAttackMode,
    shouldShowResultContent,
  ]);

  const handleExit = () => {
    transitionMusicToScene(MUSIC_SCENES.MENU, {
      fadeIn: 1.05,
      fadeOut: 0.55,
      reset: true,
    });
    requestNextFullScreenReveal();
    clearResumeSnapshot();
    onExit?.();
  };

  const handleManualDone = () => {
    playRoundAdvance();
    finishRound();
  };

  const updateTargetGuideTilt = useCallback((value) => {
    const line = targetGuideLineRef.current;
    const label = targetGuideLabelRef.current;
    const safeTilt = clamp(value, -1, 1);
    const maxOffset = Math.min(
      window.innerHeight * 0.54,
      window.innerWidth * 0.42,
      560,
    );
    const angle = (Math.atan2(maxOffset * safeTilt, window.innerWidth) * 180) /
      Math.PI;

    if (line) {
      line.style.transform = `rotate(${angle}deg)`;
    }

    if (label) {
      const offset = (maxOffset * safeTilt) / 2;
      const offsetSign = offset >= 0 ? "+" : "-";
      const offsetValue = Math.abs(offset).toFixed(2);

      label.style.transform = `translateY(calc(-50% ${offsetSign} ${offsetValue}px))`;
    }
  }, []);

  useEffect(() => {
    const root = gameplayTiltLayerRef.current;

    if (!isTiltMode) {
      tiltRef.current = 0;
      updateTargetGuideTilt(0);
      if (root) {
      root.style.transform = "";
      root.style.transformOrigin = "";
      root.style.willChange = "";
      }
      return undefined;
    }

    if (isIntroPhase) {
      tiltRef.current = 0;
      updateTargetGuideTilt(0);
      if (root) {
      root.style.transform = "";
      root.style.transformOrigin = "";
      root.style.willChange = "";
      }
      return undefined;
    }

    if (isResultPhase) {
      updateTargetGuideTilt(tiltRef.current);
      if (root) {
      root.style.transform = "";
      root.style.transformOrigin = "";
      root.style.willChange = "";
      }
      return undefined;
    }

    let animationFrameId;
    const startTime = performance.now();
    if (root) {
      root.style.transformOrigin = "center center";
      root.style.willChange = "transform";
    }

    const tick = (time) => {
      const seconds = (time - startTime) / 1000;
      const targetTilt = clamp(
        Math.sin(seconds * 1.85) * 1.24 +
          Math.sin(seconds * 3.45 + 1.15) * 0.58 +
          Math.sin(seconds * 0.92 + 2.4) * 0.32,
        -1,
        1,
      );
      const nextTilt = tiltRef.current + (targetTilt - tiltRef.current) * 0.18;

      tiltRef.current = nextTilt;
      updateTargetGuideTilt(nextTilt);
      if (root) {
        const shakeX =
          Math.sin(seconds * 18.4) * 8.6 + Math.sin(seconds * 6.3) * 4.1;
        const shakeY =
          Math.cos(seconds * 15.6) * 6.2 + Math.sin(seconds * 8.5) * 2.9;
        root.style.transform = `translate3d(${shakeX}px, ${shakeY}px, 0) rotate(${nextTilt * 3.55}deg) scale(1.095)`;
      }
      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      if (root) {
        root.style.transform = "";
        root.style.transformOrigin = "";
        root.style.willChange = "";
      }
    };
  }, [
    isIntroPhase,
    isResultPhase,
    isTiltMode,
    roundIndex,
    updateTargetGuideTilt,
  ]);

  const isGameControlEvent = (event) =>
    event.target.closest?.("[data-game-control='true']");

  const updatePourX = (event) => {
    const rect = gameplayRootRectRef.current;

    if (!rect.width) {
      return;
    }

    if (isSplitFillMode) {
      const relativeX = clamp(event.clientX - rect.left, 0, rect.width);
      const halfWidth = rect.width / 2;
      const nextSplitIndex = relativeX >= halfWidth ? 1 : 0;
      const localLeft =
        nextSplitIndex === 0 ? relativeX : relativeX - halfWidth;
      const localPourX = clamp(localLeft / halfWidth, 0.02, 0.98);

      pourXRef.current = clamp(relativeX / rect.width, 0.02, 0.98);
      activeSplitIndexRef.current = nextSplitIndex;
      setActiveSplitIndex(nextSplitIndex);

      if (nextSplitIndex === 0) {
        splitLeftPourXRef.current = localPourX;
        splitStreamLevelRef.current = splitLeftSurfaceLevelRef.current;
      } else {
        splitRightPourXRef.current = localPourX;
        splitStreamLevelRef.current = splitRightSurfaceLevelRef.current;
      }
      return;
    }

    pourXRef.current = Math.max(
      0.02,
      Math.min(0.98, (event.clientX - rect.left) / rect.width),
    );
  };

  const handlePointerDown = (event) => {
    if (isGameControlEvent(event)) {
      return;
    }

    if (isAutoRiseMode) {
      pourXRef.current = 0.5;
      if (status === "filling") {
        stopFilling();
      }
      return;
    }

    updatePourX(event);
    event.currentTarget.setPointerCapture?.(event.pointerId);

    startFilling();
  };

  const handlePointerMove = (event) => {
    if (isGameControlEvent(event)) {
      return;
    }

    if (isAutoRiseMode) {
      pourXRef.current = 0.5;
      return;
    }

    updatePourX(event);
  };

  const handlePointerUp = (event) => {
    if (isGameControlEvent(event)) {
      return;
    }

    if (isAutoRiseMode) {
      return;
    }

    stopFilling();
  };

  return (
    <main
      className="relative h-dvh touch-none select-none overflow-hidden bg-[#f7f7f2] p-6 text-[#0d0d0c] [isolation:isolate] md:p-8 dark:bg-[#080807] dark:text-[#f7f7f2]"
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={gameplayRootRef}
    >
      {shouldShowRoundBriefing ? (
        <ModeRoundBriefing
          isChaosQueue={isChaosQueue}
          key={`mode-briefing-${roundIndex}-${activeRuleMode}`}
          onComplete={() => setModeBriefingRound(roundIndex)}
          ruleMode={activeRuleMode}
        />
      ) : isIntroPhase ? (
        <PourIntroPhase key={roundIndex} onComplete={handleIntroComplete} />
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[55] opacity-0 mix-blend-multiply dark:mix-blend-screen"
        ref={timeAttackFailFlashRef}
        style={{
          background:
            "radial-gradient(circle at 50% 54%, rgba(239,47,37,0.2) 0%, rgba(239,47,37,0.12) 24%, rgba(13,13,12,0.1) 48%, rgba(13,13,12,0) 72%)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20"
        data-gameplay-water-layer="true"
        ref={gameplayTiltLayerRef}
      >
        {shouldShowTargetGuide ? (
          <PourTargetGuide
            fakeTarget={fakeTarget}
            isResultPhase={isResultPhase}
            target={target}
            targetWindow={
              isTimeAttackMode
                ? TIME_ATTACK_ZONE_RADIUS * 2
                : isPerfectOrNothingMode
                  ? PERFECT_ZONE_RADIUS * 2
                  : 0
            }
            targetWindowLabel={
              isTimeAttackMode ? t("game.timeAttackGate") : null
            }
            targetGuideLabelRef={targetGuideLabelRef}
            targetGuideLineRef={targetGuideLineRef}
            showBadge={!isFlashMode || isResultPhase}
          />
        ) : null}

        {shouldShowSplitTargets ? (
          <SplitTargetGuides splitTargets={splitTargets} />
        ) : null}

        {shouldShowBandTargets ? (
          <BandTargetGuides
            activeIndex={bandAttemptIndex}
            bandTargets={bandTargets}
          />
        ) : null}

        {isSplitFillMode ? (
          <>
            <WaterPhysicsCanvas
              className="pointer-events-none absolute inset-0 z-20 h-full w-full will-change-transform"
              difficulty={difficulty}
              initialLevel={
                activeSplitIndex === 0
                  ? initialSplitLeftWaterLevel
                  : initialSplitRightWaterLevel
              }
              isPourActive={status === "filling"}
              levelRef={splitStreamLevelRef}
              pourXRef={pourXRef}
              renderStream
              resetKey={roundResetKey}
              roundIndex={roundIndex}
              status={status}
              streamOnly
              surfaceLevelRef={null}
              tiltRef={tiltRef}
              waterColor={waterColor}
            />
            <WaterPhysicsCanvas
              className="pointer-events-none absolute left-0 top-0 z-10 h-full w-1/2 border-r border-[#0d0d0c]/10 will-change-transform dark:border-[#f7f7f2]/12"
              difficulty={difficulty}
              initialLevel={initialSplitLeftWaterLevel}
              isPourActive={activeSplitIndex === 0}
              levelRef={splitLeftLevelRef}
              pourXRef={splitLeftPourXRef}
              resetKey={roundResetKey}
              roundIndex={roundIndex}
              settledRef={splitLeftSettledRef}
              status={
                status === "filling"
                  ? "filling"
                  : status === "result" || status === "intro"
                    ? status
                    : "idle"
              }
              surfaceLevelRef={splitLeftSurfaceLevelRef}
              tiltRef={tiltRef}
              waterColor={waterColor}
              renderStream={false}
            />
            <WaterPhysicsCanvas
              className="pointer-events-none absolute right-0 top-0 z-10 h-full w-1/2 will-change-transform"
              difficulty={difficulty}
              initialLevel={initialSplitRightWaterLevel}
              isPourActive={activeSplitIndex === 1}
              levelRef={splitRightLevelRef}
              pourXRef={splitRightPourXRef}
              resetKey={roundResetKey}
              roundIndex={roundIndex}
              settledRef={splitRightSettledRef}
              status={
                status === "filling"
                  ? "filling"
                  : status === "result" || status === "intro"
                    ? status
                    : "idle"
              }
              surfaceLevelRef={splitRightSurfaceLevelRef}
              tiltRef={tiltRef}
              waterColor={waterColor}
              renderStream={false}
            />
          </>
        ) : (
          <WaterPhysicsCanvas
            burstPattern={
              isBurstClickMode ? "steady" : isChargePourMode ? "mass" : "chunked"
            }
            chargePowerRef={chargePowerRef}
            difficulty={difficulty}
            initialLevel={initialWaterLevel}
            isPourActive={
              isPulsePourMode ? status === "burst" : status === "filling"
            }
            isInvertedWater={isInvertMode}
            isReversePour={isReversePourMode}
            leakRatePerSecond={
              isSiphonMode ? SIPHON_LEAK_RATE_PER_SECOND : undefined
            }
            levelRef={waterLevelRef}
            pourXRef={pourXRef}
            resetKey={roundResetKey}
            roundIndex={roundIndex}
            settledRef={waterSettledRef}
            status={canvasStatus}
            surfaceLevelRef={waterSurfaceLevelRef}
            tiltRef={tiltRef}
            waterColor={waterColor}
          />
        )}

        {isMultiplayer ? (
          <OpponentWaterLayers
            opponentWaterStates={opponentWaterStates}
            playerId={playerId}
            roundIndex={roundIndex}
            settings={settings}
          />
        ) : null}
      </div>

      <section
        className="relative z-30 grid h-full grid-rows-[auto_1fr_auto]"
        data-gameplay-content="true"
      >
        {timeLeftMs !== null || isTimeAttackMode ? (
          <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2">
            <div
              aria-label={`${t("game.time")} ${
                isTimeAttackMode ? displayedRaceTime : formatTimerClock(timeLeftMs)
              }`}
              className="grid min-w-[4.75rem] place-items-center text-center text-[#0d0d0c] dark:text-[#f7f7f2]"
              role="timer"
            >
              <span className="font-heading text-[clamp(1.55rem,2.6vw,2.25rem)] font-black leading-none tabular-nums">
                {isTimeAttackMode ? displayedRaceTime : formatTimerClock(timeLeftMs)}
              </span>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div>
            <p
              className="pc-label overflow-hidden text-[#0d0d0c]/48 dark:text-[#f7f7f2]/50"
              data-gameplay-reveal-row="true"
            >
              <span className="inline-block" data-gameplay-reveal="round">
                {displayedRound}
              </span>
            </p>
          </div>
          <button
            aria-label={t("common.mainMenu")}
            className="pc-icon-button -mr-[calc((var(--pc-icon-button)-var(--pc-icon-size))/2)] -mt-[calc((var(--pc-icon-button)-var(--pc-icon-size))/2)] grid shrink-0 place-items-center text-[#0d0d0c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:text-[#f7f7f2] dark:focus-visible:outline-[#f7f7f2]"
            data-game-control="true"
            onClick={() => setShowExitConfirm(true)}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="pc-icon"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="self-center justify-self-center text-center">
          {shouldShowResultContent ? (
            <div className="space-y-4">
              <div
                className="overflow-hidden"
                data-gameplay-result-reveal-row="true"
              >
                <p
                  className="pc-result-score text-[#0d0d0c] dark:text-[#f7f7f2]"
                  data-gameplay-result-reveal="score"
                  ref={resultScoreRef}
                >
                  {lastResult?.ruleMode === GAME_RULE_MODES.TIME_ATTACK
                    ? formatRaceClock(
                        lastResult?.roundElapsedMs ?? lastResult?.elapsedMs,
                      )
                    : formatScore(lastResult?.score)}
                </p>
              </div>
              <div>
                <div
                  className="overflow-hidden"
                  data-gameplay-result-reveal-row="true"
                >
                  <h1
                    className="pc-card-title text-[#0d0d0c] dark:text-[#f7f7f2]"
                    data-gameplay-result-reveal="title"
                  >
                    {resultLabel}
                  </h1>
                </div>
                <div
                  className="mt-3 overflow-hidden"
                  data-gameplay-result-reveal-row="true"
                >
                  <p
                    className="pc-copy text-[#0d0d0c]/58 dark:text-[#f7f7f2]/64"
                    data-gameplay-result-reveal="copy"
                  >
                    {resultGuidance}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <h1
                className="pc-result-score overflow-hidden uppercase text-[#0d0d0c] dark:text-[#f7f7f2]"
                data-gameplay-reveal-row="true"
              >
                <span className="inline-block" data-gameplay-reveal="hold-title">
                  {t("game.actionHold")}
                </span>
              </h1>
              <p
                className="pc-copy overflow-hidden text-[#0d0d0c]/58 dark:text-[#f7f7f2]/64"
                data-gameplay-reveal-row="true"
              >
                <span className="block" data-gameplay-reveal="hold-copy">
                  {approachGuidance}
                </span>
              </p>
            </div>
          )}
        </div>

        <section
          data-water-hud="true"
          className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-4 text-[#0d0d0c]/78 dark:text-[#f7f7f2]/82"
        >
          <div className="overflow-hidden" data-gameplay-reveal-row="true">
            <div data-gameplay-reveal="goal">
              <p className="pc-label">{t("game.goal")}</p>
              <p className="pc-round-value mt-2">{displayedGoal}</p>
            </div>
          </div>
          {shouldShowResultContent && !isTimeAttackMode ? (
            <div
              className="overflow-hidden"
              data-gameplay-result-reveal-row="true"
            >
              <button
                className="pc-action inline-flex min-w-36 items-center justify-center rounded-lg bg-[#0d0d0c] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] sm:min-w-44 dark:bg-[#f7f7f2] dark:text-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]"
                data-game-control="true"
                data-gameplay-result-reveal="action"
                disabled={isCompletingExit || isTimeAttackMode}
                onClick={handleAdvance}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                type="button"
              >
                {isTimeAttackMode
                  ? t("game.autoNext")
                  : isFinalRound
                    ? t("game.scoreboard")
                    : t("game.nextRound")}
              </button>
            </div>
          ) : shouldShowResultContent && isTimeAttackMode ? (
            <div aria-hidden="true" className="min-h-12 min-w-36 sm:min-w-44" />
          ) : modeAllowsDone && status !== "complete" && status !== "settling" ? (
            <button
              className="pc-action inline-flex min-w-36 items-center justify-center rounded-lg bg-[#0d0d0c] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] sm:min-w-44 dark:bg-[#f7f7f2] dark:text-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]"
              data-game-control="true"
              onClick={handleManualDone}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              type="button"
            >
              {t("game.done")}
            </button>
          ) : (
            <div aria-hidden="true" className="min-h-12 min-w-36 sm:min-w-44" />
          )}
          <div
            className="overflow-hidden text-right"
            data-gameplay-reveal-row="true"
          >
            <div data-gameplay-reveal="diff">
              <p className="pc-label">
                {isTimeAttackMode ? t("game.time") : t("game.diff")}
              </p>
              <p className="pc-round-value mt-2" ref={diffValueRef}>
                {isTimeAttackMode ? displayedLevelTime : roundDiff}
              </p>
            </div>
          </div>
        </section>
      </section>
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0 z-[70] bg-[#050504]",
          "transition-opacity duration-[900ms] ease-[cubic-bezier(0.76,0,0.24,1)]",
          blackoutVisible ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
      {showExitConfirm ? (
        <PourExitDialog
          onCancel={() => setShowExitConfirm(false)}
          onExit={handleExit}
        />
      ) : null}
    </main>
  );
}
