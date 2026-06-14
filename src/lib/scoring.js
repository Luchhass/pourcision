import {
  GAME_RULE_MODES,
  MAX_ROUND_SCORE,
  PERFECT_ZONE_RADIUS,
} from "@/lib/constants";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function getResultLabel(level, target, diff) {
  if (diff <= 1) return "PERFECT!";
  if (diff <= 4) return "SO CLOSE!";
  return level < target ? "TOO LOW!" : "TOO HIGH!";
}

export function getRoundScore(diff) {
  return clamp(roundTo(MAX_ROUND_SCORE - diff * 0.25, 2), 0, MAX_ROUND_SCORE);
}

function getPerfectOrNothingScore(diff) {
  return diff <= PERFECT_ZONE_RADIUS ? MAX_ROUND_SCORE : 0;
}

function getPerfectOrNothingLabel(diff) {
  return diff <= PERFECT_ZONE_RADIUS ? "PERFECT!" : "NO SCORE";
}

function average(values) {
  if (!values.length) return 0;

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function calculateRoundResult({
  bandLevels = null,
  bandTargets = null,
  fakeTarget = null,
  level,
  roundIndex,
  ruleMode = GAME_RULE_MODES.CLASSIC,
  splitLevels = null,
  splitTargets = null,
  target,
}) {
  if (ruleMode === GAME_RULE_MODES.BAND_RUN && bandLevels && bandTargets) {
    const safeBandLevels = bandLevels.map((bandLevel) =>
      roundTo(clamp(Number(bandLevel), 0, 100), 2),
    );
    const safeBandTargets = bandTargets.map((bandTarget) =>
      roundTo(clamp(Number(bandTarget), 0, 100), 1),
    );
    const bandDiffs = safeBandTargets.map((bandTarget, index) =>
      roundTo(Math.abs((safeBandLevels[index] ?? 0) - bandTarget), 2),
    );
    const bandScores = bandDiffs.map(getRoundScore);
    const diff = roundTo(average(bandDiffs), 2);
    const score = roundTo(average(bandScores), 2);
    const levelAverage = roundTo(average(safeBandLevels), 2);
    const targetAverage = roundTo(average(safeBandTargets), 1);

    return {
      bandDiffs,
      bandLevels: safeBandLevels,
      bandScores,
      bandTargets: safeBandTargets,
      diff,
      fakeTarget: null,
      label: diff <= 1 ? "PERFECT!" : diff <= 4 ? "SO CLOSE!" : "BAND MISS",
      level: levelAverage,
      round: roundIndex + 1,
      roundIndex,
      score,
      target: targetAverage,
    };
  }

  if (ruleMode === GAME_RULE_MODES.SPLIT_FILL && splitLevels && splitTargets) {
    const safeSplitLevels = splitLevels.map((splitLevel) =>
      roundTo(clamp(Number(splitLevel), 0, 100), 2),
    );
    const safeSplitTargets = splitTargets.map((splitTarget) =>
      roundTo(clamp(Number(splitTarget), 0, 100), 1),
    );
    const splitDiffs = safeSplitLevels.map((splitLevel, index) =>
      roundTo(Math.abs(splitLevel - safeSplitTargets[index]), 2),
    );
    const splitScores = splitDiffs.map(getRoundScore);
    const diff = roundTo(average(splitDiffs), 2);
    const score = roundTo(average(splitScores), 2);
    const levelAverage = roundTo(average(safeSplitLevels), 2);
    const targetAverage = roundTo(average(safeSplitTargets), 1);

    return {
      diff,
      fakeTarget: null,
      label: diff <= 1 ? "PERFECT!" : diff <= 4 ? "SO CLOSE!" : "SPLIT MISS",
      level: levelAverage,
      round: roundIndex + 1,
      roundIndex,
      score,
      splitDiffs,
      splitLevels: safeSplitLevels,
      splitScores,
      splitTargets: safeSplitTargets,
      target: targetAverage,
    };
  }

  const safeLevel = roundTo(clamp(Number(level), 0, 100), 2);
  const diff = roundTo(Math.abs(safeLevel - target), 2);
  const isPerfectOrNothing = ruleMode === GAME_RULE_MODES.PERFECT_OR_NOTHING;
  const score = isPerfectOrNothing
    ? getPerfectOrNothingScore(diff)
    : getRoundScore(diff);

  return {
    diff,
    fakeTarget,
    label: isPerfectOrNothing
      ? getPerfectOrNothingLabel(diff)
      : getResultLabel(safeLevel, target, diff),
    level: safeLevel,
    round: roundIndex + 1,
    roundIndex,
    score,
    target,
  };
}

export function formatScore(value) {
  if (value === null || value === undefined) return "--";
  return Number(value).toFixed(2);
}

export function getFinalAssessment(totalScore) {
  if (totalScore >= 42) {
    return "The water barely argued. Your hand found the quiet part.";
  }
  if (totalScore >= 30) {
    return "A clean run is already in the room. It just needs one calmer release.";
  }
  if (totalScore >= 18) {
    return "The line moved like a rumor. You caught enough of it to come back sharper.";
  }
  return "The water kept its secret this time. The next pour starts with better eyes.";
}
