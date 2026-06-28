"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_DIFFICULTY_ID, GAME_RULE_MODES, WATER_COLORS } from "@/lib/constants";
import WaterPhysicsCanvas from "@/components/sections/gameplay/WaterPhysicsCanvas";

const OPPONENT_WATER_CLASS =
  "pointer-events-none absolute opacity-[0.22] mix-blend-multiply will-change-transform dark:opacity-[0.18]";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getInitialLevel(ruleMode) {
  return ruleMode === GAME_RULE_MODES.REVERSE_POUR ? 100 : 0;
}

function getWaterColor(waterColorId, fallbackId) {
  return (
    WATER_COLORS.find((color) => color.id === waterColorId) ||
    WATER_COLORS.find((color) => color.id === fallbackId) ||
    WATER_COLORS[0]
  );
}

function getCanvasStatus(state) {
  if (state.status === "filling" && state.isPouring) return "filling";
  if (state.status === "burst" && state.isPouring) return "burst";
  if (state.status === "leaking") return "leaking";
  if (state.status === "intro") return "intro";

  return "idle";
}

function getActiveRuleMode(settings, roundIndex) {
  return (
    settings?.modeQueue?.[roundIndex] ||
    settings?.ruleMode ||
    GAME_RULE_MODES.CLASSIC
  );
}

function getAverageLevel(levels) {
  if (!Array.isArray(levels) || levels.length !== 2) return null;

  return (Number(levels[0]) + Number(levels[1])) / 2;
}

function formatOpponentLevel(value) {
  return `${clamp(Number(value) || 0, 0, 100).toFixed(0)}%`;
}

function OpponentWaterMarker({ index, labelLevel, level, playerName }) {
  const markerSide =
    index % 2 === 0 ? "left-6 md:left-8" : "right-6 md:right-8";
  const markerOffset = (index % 3) * 8 - 8;

  return (
    <div
      className="absolute inset-x-0 z-[4] h-0"
      style={{ top: `calc(${100 - labelLevel}% + 0.45rem)` }}
    >
      <span
        className={`pc-label absolute top-0 flex h-7 max-w-[min(10.5rem,38vw)] items-center gap-2 overflow-hidden rounded-md border border-current bg-transparent px-2.5 text-[#0d0d0c]/82 dark:text-[#f7f7f2]/82 ${markerSide}`}
        style={{ transform: `translateY(calc(-50% + ${markerOffset}px))` }}
      >
        <span className="min-w-0 truncate">{playerName || `P${index + 1}`}</span>
        <span className="ml-auto tabular-nums">{formatOpponentLevel(level)}</span>
      </span>
    </div>
  );
}

function OpponentWaterLayer({ index, roundIndex, settings, state }) {
  const activeRuleMode = getActiveRuleMode(settings, roundIndex);
  const isInvert = activeRuleMode === GAME_RULE_MODES.INVERT;
  const isSplitFill = activeRuleMode === GAME_RULE_MODES.SPLIT_FILL;
  const initialSplitLevels = Array.isArray(state.splitLevels)
    ? state.splitLevels
    : [0, 0];
  const visibleLevel =
    isSplitFill ? getAverageLevel(initialSplitLevels) : state.level;
  const initialExternalLevel = clamp(visibleLevel ?? 0, 0, 100);
  const labelLevel = clamp(
    isInvert ? 100 - (visibleLevel ?? 0) : (visibleLevel ?? 0),
    3,
    96,
  );
  const levelRef = useRef(initialExternalLevel);
  const externalLevelRef = useRef(initialExternalLevel);
  const pourXRef = useRef(clamp(state.pourX ?? 0.5, 0.02, 0.98));
  const splitLeftLevelRef = useRef(clamp(initialSplitLevels[0] ?? 0, 0, 100));
  const splitLeftExternalLevelRef = useRef(
    clamp(initialSplitLevels[0] ?? 0, 0, 100),
  );
  const splitLeftPourXRef = useRef(
    clamp(state.splitPourX?.[0] ?? 0.5, 0.02, 0.98),
  );
  const splitRightLevelRef = useRef(clamp(initialSplitLevels[1] ?? 0, 0, 100));
  const splitRightExternalLevelRef = useRef(
    clamp(initialSplitLevels[1] ?? 0, 0, 100),
  );
  const splitRightPourXRef = useRef(
    clamp(state.splitPourX?.[1] ?? 0.5, 0.02, 0.98),
  );
  const tiltRef = useRef(clamp(state.tilt ?? 0, -1, 1));
  const playerName = state.player?.name || "";
  const waterColor = getWaterColor(
    state.player?.waterColorId,
    settings?.waterColorId,
  );

  useEffect(() => {
    const nextLevel = clamp(state.level ?? levelRef.current, 0, 100);
    const nextSplitLevels = Array.isArray(state.splitLevels)
      ? state.splitLevels
      : [
          splitLeftExternalLevelRef.current,
          splitRightExternalLevelRef.current,
        ];

    externalLevelRef.current = nextLevel;
    pourXRef.current = clamp(state.pourX ?? pourXRef.current, 0.02, 0.98);
    splitLeftExternalLevelRef.current = clamp(nextSplitLevels[0] ?? 0, 0, 100);
    splitRightExternalLevelRef.current = clamp(nextSplitLevels[1] ?? 0, 0, 100);
    splitLeftPourXRef.current = clamp(
      state.splitPourX?.[0] ?? splitLeftPourXRef.current,
      0.02,
      0.98,
    );
    splitRightPourXRef.current = clamp(
      state.splitPourX?.[1] ?? splitRightPourXRef.current,
      0.02,
      0.98,
    );
    tiltRef.current = clamp(state.tilt ?? tiltRef.current, -1, 1);
  }, [state.level, state.pourX, state.splitLevels, state.splitPourX, state.tilt]);

  if (isSplitFill) {
    return (
      <>
        <WaterPhysicsCanvas
          className={`${OPPONENT_WATER_CLASS} left-0 top-0 h-full w-1/2`}
          difficulty={settings?.difficulty || DEFAULT_DIFFICULTY_ID}
          externalLevelRef={splitLeftExternalLevelRef}
          initialLevel={0}
          isPourActive={state.isPouring && state.activeSplitIndex === 0}
          levelRef={splitLeftLevelRef}
          pourXRef={splitLeftPourXRef}
          renderStream={state.isPouring && state.activeSplitIndex === 0}
          roundIndex={roundIndex}
          status={getCanvasStatus(state)}
          tiltRef={tiltRef}
          waterColor={waterColor}
        />
        <WaterPhysicsCanvas
          className={`${OPPONENT_WATER_CLASS} right-0 top-0 h-full w-1/2`}
          difficulty={settings?.difficulty || DEFAULT_DIFFICULTY_ID}
          externalLevelRef={splitRightExternalLevelRef}
          initialLevel={0}
          isPourActive={state.isPouring && state.activeSplitIndex === 1}
          levelRef={splitRightLevelRef}
          pourXRef={splitRightPourXRef}
          renderStream={state.isPouring && state.activeSplitIndex === 1}
          roundIndex={roundIndex}
          status={getCanvasStatus(state)}
          tiltRef={tiltRef}
          waterColor={waterColor}
        />
        <OpponentWaterMarker
          index={index}
          labelLevel={labelLevel}
          level={visibleLevel ?? 0}
          playerName={playerName}
        />
      </>
    );
  }

  return (
    <>
      <WaterPhysicsCanvas
        burstPattern={
          activeRuleMode === GAME_RULE_MODES.BURST_CLICK
            ? "steady"
            : activeRuleMode === GAME_RULE_MODES.CHARGE_POUR
              ? "mass"
              : "chunked"
        }
        className={`${OPPONENT_WATER_CLASS} inset-0 h-full w-full`}
        difficulty={settings?.difficulty || DEFAULT_DIFFICULTY_ID}
        externalLevelRef={externalLevelRef}
        initialLevel={getInitialLevel(activeRuleMode)}
        isInvertedWater={isInvert}
        isPourActive={state.isPouring}
        isReversePour={activeRuleMode === GAME_RULE_MODES.REVERSE_POUR}
        levelRef={levelRef}
        pourXRef={pourXRef}
        renderStream={state.isPouring}
        roundIndex={roundIndex}
        status={getCanvasStatus(state)}
        tiltRef={tiltRef}
        waterColor={waterColor}
      />
      <OpponentWaterMarker
        index={index}
        labelLevel={labelLevel}
        level={visibleLevel ?? 0}
        playerName={playerName}
      />
    </>
  );
}

export default function OpponentWaterLayers({
  opponentWaterStates = [],
  playerId,
  roundIndex,
  settings,
}) {
  const currentRoundStates = opponentWaterStates.filter(
    (state) =>
      state?.player?.id &&
      state.player.id !== playerId &&
      state.roundIndex === roundIndex,
  );

  if (!currentRoundStates.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {currentRoundStates.map((state, index) => (
        <OpponentWaterLayer
          key={`${state.player.id}:${state.roundIndex}`}
          index={index}
          roundIndex={roundIndex}
          settings={settings}
          state={state}
        />
      ))}
    </div>
  );
}
