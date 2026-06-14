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
  GAME_DIFFICULTIES,
  GAME_MODE_OPTIONS,
  GAME_RULE_MODES,
  PERFECT_ZONE_RADIUS,
  WATER_COLORS,
} from "@/lib/constants";
import {
  playRoundAdvance,
  playRoundResult,
  startRoundScoreCountSound,
  startChargeLoop,
  startPourLoop,
} from "@/lib/sound";

const STABLE_REVEAL_TRANSFORM = { force3D: false };

function formatPercent(value) {
  return `${clamp(Number(value) || 0, 0, 100).toFixed(1)}%`;
}

function formatDiff(value) {
  if (value === null || value === undefined) {
    return "00";
  }

  return value.toFixed(2);
}

function formatScore(value) {
  if (value === null || value === undefined) {
    return "--";
  }

  return Number(value).toFixed(2);
}

function formatResultScore(value) {
  if (value === null || value === undefined) {
    return "--";
  }

  return Number(value).toFixed(2);
}

function formatSeconds(value) {
  return `${(value / 1000).toFixed(1)}s`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getRuleModeOption(ruleMode) {
  return (
    GAME_MODE_OPTIONS.find((option) => option.id === ruleMode) ||
    GAME_MODE_OPTIONS[0]
  );
}

function ChaosRoundBriefing({ onComplete, ruleMode }) {
  const [secondsLeft, setSecondsLeft] = useState(3);
  const briefingRef = useRef(null);
  const option = getRuleModeOption(ruleMode);
  const { t } = useTranslation();

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
      onComplete: () => {
        gsap.set(rows, { clearProps: "overflow" });
        gsap.set(items, { clearProps: "opacity,visibility,willChange" });
      },
    });

    gsap.set(rows, { overflow: "hidden" });
    gsap.set(items, {
      autoAlpha: 0,
      ...STABLE_REVEAL_TRANSFORM,
      yPercent: -120,
    });

    timeline.to(items, {
      autoAlpha: 1,
      ...STABLE_REVEAL_TRANSFORM,
      stagger: 0.085,
      yPercent: 0,
    });

    return () => {
      timeline.kill();
    };
  }, [ruleMode]);

  useEffect(() => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextSeconds = Math.max(
        1,
        Math.ceil((CHAOS_BRIEFING_MS - elapsed) / 1000),
      );

      setSecondsLeft(nextSeconds);
    }, 120);
    const timerId = window.setTimeout(onComplete, CHAOS_BRIEFING_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timerId);
    };
  }, [onComplete]);

  return (
    <section
      className="absolute inset-0 z-50 grid place-items-center bg-[#f7f7f2] px-6 py-8 text-center text-[#0d0d0c] sm:px-8 md:px-10"
      data-game-control="true"
      ref={briefingRef}
    >
      <div className="grid w-full max-w-[36rem] justify-items-center gap-4 sm:gap-5">
        <div data-chaos-briefing-row="true">
          <p className="pc-label text-[#0d0d0c]/52">
            {t("game.chaosQueue")}
          </p>
        </div>
        <div className="w-full min-w-0 px-2" data-chaos-briefing-row="true">
          <h1 className="pc-result-score-compact mx-auto max-w-full break-words text-balance uppercase leading-[0.88] text-[#0d0d0c] [font-size:clamp(2rem,10.5vw,5.75rem)] [overflow-wrap:anywhere] sm:[font-size:clamp(2.6rem,8.2vw,7.4rem)]">
            {t(`modes.${option.id}.label`)}
          </h1>
        </div>
        <div data-chaos-briefing-row="true">
          <p className="pc-copy mx-auto max-w-[30rem] text-[#0d0d0c]/62">
            {t(`modes.${ruleMode}.briefing`)}
          </p>
        </div>
        <div data-chaos-briefing-row="true">
          <p className="pc-result-score-compact text-[#0d0d0c] sm:text-[var(--pc-result-score)]">
            {secondsLeft}
          </p>
        </div>
      </div>
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
    "PERFECT!": t("game.labels.perfect"),
    "SO CLOSE!": t("game.labels.soClose"),
    "SPLIT MISS": t("game.splitMiss"),
    "TOO HIGH!": t("game.labels.tooHigh"),
    "TOO LOW!": t("game.labels.tooLow"),
  };

  return labels[label] ?? label;
}

export default function GameplayScreen({
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
  const pourXRef = useRef(0.5);
  const pourSoundRef = useRef(null);
  const chargeSoundStartedAtRef = useRef(0);
  const gameplayRevealKeyRef = useRef("");
  const gameplayRevealTimelineRef = useRef(null);
  const gameplayRootRef = useRef(null);
  const resultSoundKeyRef = useRef("");
  const soundStatusRef = useRef("");
  const splitLeftLevelRef = useRef(0);
  const splitLeftPourXRef = useRef(0.5);
  const splitLeftSettledRef = useRef(true);
  const splitLeftSurfaceLevelRef = useRef(0);
  const splitRightLevelRef = useRef(0);
  const splitRightPourXRef = useRef(0.5);
  const splitRightSettledRef = useRef(true);
  const splitRightSurfaceLevelRef = useRef(0);
  const splitStreamLevelRef = useRef(0);
  const submittedRoundsRef = useRef(new Set());
  const targetGuideLineRef = useRef(null);
  const targetGuideLabelRef = useRef(null);
  const tiltRef = useRef(0);
  const waterLevelRef = useRef(0);
  const waterSettledRef = useRef(true);
  const waterSurfaceLevelRef = useRef(0);
  const isSplitFillModeRef = useRef(false);
  const [activeSplitIndex, setActiveSplitIndex] = useState(0);
  const activeSplitIndexRef = useRef(0);
  const [chaosBriefingRound, setChaosBriefingRound] = useState(-1);
  const [flashTargetVisible, setFlashTargetVisible] = useState(false);
  const [visibleResultKey, setVisibleResultKey] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const diffValueRef = useRef(null);
  const resultScoreRef = useRef(null);
  const selectedWaterColor =
    WATER_COLORS.find((color) => color.id === settings?.waterColorId) ??
    WATER_COLORS[0];
  const difficulty = settings?.difficulty ?? GAME_DIFFICULTIES.NORMAL;
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
  }, [getInitialLevelForMode, ruleMode]);
  const {
    advanceRound,
    bandAttemptIndex,
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
    roundCount,
    roundIndex,
    showTargetGuide,
    splitTargets,
    startFilling,
    status,
    stopFilling,
    target,
    timeLeftMs,
  } = useFillGame({
    getIsSettled: getWaterSettled,
    getSplitLevels,
    getLevel: getWaterLevel,
    modeQueue: settings?.modeQueue,
    onRoundReset: resetWaterLevel,
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
  const isColorblindMode = activeRuleMode === GAME_RULE_MODES.COLORBLIND;
  const waterColor = isColorblindMode
    ? {
        id: "colorblind",
        name: "Colorblind",
        value: "#0d0d0c",
        text: "#f7f7f2",
      }
    : selectedWaterColor;
  const canvasStatus =
    isChargePourMode && status === "filling" ? "idle" : status;
  const isPulsePourMode = isChargePourMode || isBurstClickMode;
  const isTiltMode = activeRuleMode === GAME_RULE_MODES.TILT;
  const initialWaterLevel = getInitialLevelForMode(activeRuleMode);
  const isIntroPhase = status === "intro";
  const isResultPhase = status === "result";
  const shouldShowChaosBriefing =
    isChaosQueue && isIntroPhase && chaosBriefingRound !== roundIndex;
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
        : activeRuleMode === GAME_RULE_MODES.FLASH
          ? t(`modes.${GAME_RULE_MODES.FLASH}.briefing`)
        : activeRuleMode === GAME_RULE_MODES.BLIND
          ? t(`modes.${GAME_RULE_MODES.BLIND}.briefing`)
          : activeRuleMode === GAME_RULE_MODES.PERFECT_OR_NOTHING
            ? t("game.guidance.perfect")
            : activeRuleMode === GAME_RULE_MODES.LEAKY
              ? t(`modes.${GAME_RULE_MODES.LEAKY}.briefing`)
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
    ? `${lastResult.roundIndex}:${lastResult.score}:${lastResult.diff}`
    : "";
  const shouldShowResultContent =
    isResultPhase && Boolean(currentResultKey) && visibleResultKey === currentResultKey;

  useEffect(() => {
    if (
      isIntroPhase ||
      isResultPhase ||
      shouldShowChaosBriefing ||
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
  }, [isFlashMode, isIntroPhase, isResultPhase, roundIndex, shouldShowChaosBriefing]);

  useLayoutEffect(() => {
    const root = gameplayRootRef.current;
    const revealKey = `${roundIndex}:${activeRuleMode}`;

    if (
      !root ||
      isIntroPhase ||
      isResultPhase ||
      shouldShowChaosBriefing ||
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

    const timeline = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        gsap.set([...primary, ...hud, ...lines, ...badges], {
          clearProps: "opacity,visibility,willChange",
        });
      },
    });

    gsap.set(primary, {
      autoAlpha: 0,
      ...STABLE_REVEAL_TRANSFORM,
      yPercent: -115,
    });
    gsap.set(hud, {
      autoAlpha: 0,
      ...STABLE_REVEAL_TRANSFORM,
      yPercent: -85,
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
    };
  }, [
    activeRuleMode,
    isIntroPhase,
    isResultPhase,
    roundIndex,
    shouldShowChaosBriefing,
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
  }, [currentResultKey, isResultPhase, lastResult, shouldShowResultContent]);

  useLayoutEffect(() => {
    if (!shouldShowResultContent || !lastResult) return undefined;

    const root = gameplayRootRef.current;
    if (!root) return undefined;

    const score = resultScoreRef.current;
    const title = root.querySelector("[data-gameplay-result-reveal='title']");
    const copy = root.querySelector("[data-gameplay-result-reveal='copy']");
    const action = root.querySelector("[data-gameplay-result-reveal='action']");
    const targets = [score, title, copy, action].filter(Boolean);
    const resultKey = currentResultKey;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (resultSoundKeyRef.current !== resultKey) {
        resultSoundKeyRef.current = resultKey;
        playRoundResult(lastResult.score, lastResult.diff);
      }
      return undefined;
    }

    gsap.set(targets, {
      autoAlpha: 0,
      ...STABLE_REVEAL_TRANSFORM,
      y: 18,
    });
    gsap.set(score, {
      ...STABLE_REVEAL_TRANSFORM,
      yPercent: 90,
      transformOrigin: "center center",
    });
    gsap.set(action, {
      ...STABLE_REVEAL_TRANSFORM,
      scale: 0,
      transformOrigin: "center center",
    });
    if (score) {
      score.textContent = formatResultScore(0);
    }

    let scoreSound = null;
    let scoreTween = null;
    const scoreQuality = clamp((lastResult?.score ?? 0) / 10, 0, 1);
    const scoreCountDuration =
      (lastResult?.score ?? 0) <= 0.05 ? 0.28 : 0.46 + scoreQuality * 0.62;
    const timeline = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        gsap.set(targets, {
          clearProps: "opacity,visibility,willChange",
        });
      },
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

          const state = { value: 0 };
          score.textContent = formatResultScore(0);
          scoreSound = startRoundScoreCountSound({
            duration: scoreCountDuration,
            score: lastResult.score,
          });

          scoreTween = gsap.to(state, {
            value: lastResult.score,
            duration: scoreCountDuration,
            ease: "power2.out",
            onUpdate: () => {
              score.textContent = formatResultScore(state.value);
            },
            onComplete: () => {
              score.textContent = formatResultScore(lastResult.score);
              scoreSound?.finish();
              if (resultSoundKeyRef.current !== resultKey) {
                resultSoundKeyRef.current = resultKey;
                playRoundResult(lastResult.score, lastResult.diff);
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
      )
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

    return () => {
      timeline.kill();
      scoreTween?.kill();
      scoreSound?.stop?.();
    };
  }, [currentResultKey, lastResult, shouldShowResultContent]);

  useEffect(() => {
    isSplitFillModeRef.current = isSplitFillMode;
  }, [isSplitFillMode]);

  useEffect(() => {
    activeSplitIndexRef.current = activeSplitIndex;
  }, [activeSplitIndex]);

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
      const soundLevel =
        isChargePourMode && status === "filling"
          ? clamp((Date.now() - chargeSoundStartedAtRef.current) / 1600, 0, 1)
          : isChargePourMode && status === "burst"
            ? clamp((chargePowerRef.current ?? 1) / 3.2, 0, 1)
          : activeLevel / 100;

      if (isSplitFillMode) {
        splitStreamLevelRef.current = activeLevel;
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

  const handleAdvance = () => {
    playRoundAdvance();
    const finalResults = advanceRound();

    if (finalResults) {
      onComplete(finalResults);
    }
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
      label.style.transform = `translateY(${(maxOffset * safeTilt) / 2}px)`;
    }
  }, []);

  useEffect(() => {
    const root = gameplayRootRef.current;

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
          Math.sin(seconds * 16.8) * 6.4 + Math.sin(seconds * 5.6) * 3.2;
        const shakeY =
          Math.cos(seconds * 14.2) * 4.6 + Math.sin(seconds * 7.7) * 2.2;
        root.style.transform = `translate3d(${shakeX}px, ${shakeY}px, 0) rotate(${nextTilt * 2.85}deg) scale(1.07)`;
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
    const rect = event.currentTarget.getBoundingClientRect();

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
        splitStreamLevelRef.current = splitLeftLevelRef.current;
      } else {
        splitRightPourXRef.current = localPourX;
        splitStreamLevelRef.current = splitRightLevelRef.current;
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

    updatePourX(event);
    event.currentTarget.setPointerCapture?.(event.pointerId);

    startFilling();
  };

  const handlePointerMove = (event) => {
    if (isGameControlEvent(event)) {
      return;
    }

    updatePourX(event);
  };

  const handlePointerUp = (event) => {
    if (isGameControlEvent(event)) {
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
      {shouldShowChaosBriefing ? (
        <ChaosRoundBriefing
          key={`chaos-${roundIndex}-${activeRuleMode}`}
          onComplete={() => setChaosBriefingRound(roundIndex)}
          ruleMode={activeRuleMode}
        />
      ) : isIntroPhase ? (
        <PourIntroPhase key={roundIndex} onComplete={completeIntro} />
      ) : null}

      {shouldShowTargetGuide ? (
        <PourTargetGuide
          fakeTarget={fakeTarget}
          isResultPhase={isResultPhase}
          target={target}
          targetWindow={
            isPerfectOrNothingMode ? PERFECT_ZONE_RADIUS * 2 : 0
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
            initialLevel={0}
            isPourActive={status === "filling"}
            levelRef={splitStreamLevelRef}
            pourXRef={pourXRef}
            renderStream
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
            initialLevel={0}
            isPourActive={activeSplitIndex === 0}
            levelRef={splitLeftLevelRef}
            pourXRef={splitLeftPourXRef}
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
            initialLevel={0}
            isPourActive={activeSplitIndex === 1}
            levelRef={splitRightLevelRef}
            pourXRef={splitRightPourXRef}
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
          levelRef={waterLevelRef}
          pourXRef={pourXRef}
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

      <section className="relative z-30 grid h-full grid-rows-[auto_1fr_auto]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div>
            <p className="pc-label overflow-hidden text-[#0d0d0c]/48 dark:text-[#f7f7f2]/50">
              <span className="inline-block" data-gameplay-reveal="round">
                {displayedRound}
              </span>
            </p>
            {timeLeftMs !== null ? (
              <p className="pc-label mt-2 text-[#0d0d0c]/48 dark:text-[#f7f7f2]/50">
                {t("game.time")} {formatSeconds(timeLeftMs)}
              </p>
            ) : null}
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
              <div className="overflow-hidden">
                <p
                  className="pc-result-score text-[#0d0d0c] dark:text-[#f7f7f2]"
                  data-gameplay-result-reveal="score"
                  ref={resultScoreRef}
                >
                  {formatResultScore(lastResult?.score)}
                </p>
              </div>
              <div>
                <div className="overflow-hidden">
                  <h1
                    className="pc-card-title text-[#0d0d0c] dark:text-[#f7f7f2]"
                    data-gameplay-result-reveal="title"
                  >
                    {resultLabel}
                  </h1>
                </div>
                <div className="mt-3 overflow-hidden">
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
              <h1 className="pc-result-score overflow-hidden uppercase text-[#0d0d0c] dark:text-[#f7f7f2]">
                <span className="inline-block" data-gameplay-reveal="hold-title">
                  {t("game.actionHold")}
                </span>
              </h1>
              <p className="pc-copy overflow-hidden text-[#0d0d0c]/58 dark:text-[#f7f7f2]/64">
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
          <div className="overflow-hidden">
            <div data-gameplay-reveal="goal">
              <p className="pc-label">{t("game.goal")}</p>
              <p className="pc-round-value mt-2">{displayedGoal}</p>
            </div>
          </div>
          {shouldShowResultContent ? (
            <div className="overflow-hidden">
              <button
                className="pc-action inline-flex min-w-36 items-center justify-center rounded-lg bg-[#0d0d0c] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] sm:min-w-44 dark:bg-[#f7f7f2] dark:text-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]"
                data-game-control="true"
                data-gameplay-result-reveal="action"
                onClick={handleAdvance}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                type="button"
              >
                {isFinalRound ? t("game.scoreboard") : t("game.nextRound")}
              </button>
            </div>
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
          <div className="overflow-hidden text-right">
            <div data-gameplay-reveal="diff">
              <p className="pc-label">{t("game.diff")}</p>
              <p className="pc-round-value mt-2" ref={diffValueRef}>
                {roundDiff}
              </p>
            </div>
          </div>
        </section>
      </section>
      {showExitConfirm ? (
        <PourExitDialog
          onCancel={() => setShowExitConfirm(false)}
          onExit={onExit}
        />
      ) : null}
    </main>
  );
}
