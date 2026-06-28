import {
  GAME_RULE_MODES,
  MAX_ROUND_SCORE,
  PERFECT_ZONE_RADIUS,
} from "../constants.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export const SCORE_PRECISION = 2;

const ROUNDING_EPSILON = 1e-9;

function roundTo(value, precision = 1) {
  const factor = 10 ** precision;
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  const adjustment = parsed >= 0 ? ROUNDING_EPSILON : -ROUNDING_EPSILON;

  return Math.round((parsed + adjustment) * factor) / factor;
}

export function getResultLabel(level, target, diff) {
  if (diff <= 1) return "PERFECT!";
  if (diff <= 4) return "SO CLOSE!";
  return level < target ? "TOO LOW!" : "TOO HIGH!";
}

export function getRoundScore(diff) {
  return normalizeRoundScore(MAX_ROUND_SCORE - diff * 0.25);
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

export function normalizeRoundScore(value) {
  return clamp(roundTo(value, SCORE_PRECISION), 0, MAX_ROUND_SCORE);
}

export function normalizeTotalScore(value) {
  return roundTo(value, SCORE_PRECISION);
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
  tilt = 0,
}) {
  const parsedTilt = Number(tilt);
  const safeTilt = roundTo(
    clamp(Number.isFinite(parsedTilt) ? parsedTilt : 0, -1, 1),
    2,
  );

  if (ruleMode === GAME_RULE_MODES.BAND_RUN && bandLevels && bandTargets) {
    const safeBandLevels = bandLevels.map((bandLevel) =>
      roundTo(clamp(Number(bandLevel), 0, 100), 1),
    );
    const safeBandTargets = bandTargets.map((bandTarget) =>
      roundTo(clamp(Number(bandTarget), 0, 100), 1),
    );
    const bandDiffs = safeBandTargets.map((bandTarget, index) =>
      roundTo(Math.abs((safeBandLevels[index] ?? 0) - bandTarget), 2),
    );
    const bandScores = bandDiffs.map(getRoundScore);
    const diff = roundTo(average(bandDiffs), 2);
    const score = normalizeRoundScore(average(bandScores));
    const levelAverage = roundTo(average(safeBandLevels), 1);
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
      ruleMode,
      score,
      target: targetAverage,
      tilt: safeTilt,
    };
  }

  if (ruleMode === GAME_RULE_MODES.SPLIT_FILL && splitLevels && splitTargets) {
    const safeSplitLevels = splitLevels.map((splitLevel) =>
      roundTo(clamp(Number(splitLevel), 0, 100), 1),
    );
    const safeSplitTargets = splitTargets.map((splitTarget) =>
      roundTo(clamp(Number(splitTarget), 0, 100), 1),
    );
    const splitDiffs = safeSplitLevels.map((splitLevel, index) =>
      roundTo(Math.abs(splitLevel - safeSplitTargets[index]), 2),
    );
    const splitScores = splitDiffs.map(getRoundScore);
    const diff = roundTo(average(splitDiffs), 2);
    const score = normalizeRoundScore(average(splitScores));
    const levelAverage = roundTo(average(safeSplitLevels), 1);
    const targetAverage = roundTo(average(safeSplitTargets), 1);

    return {
      diff,
      fakeTarget: null,
      label: diff <= 1 ? "PERFECT!" : diff <= 4 ? "SO CLOSE!" : "SPLIT MISS",
      level: levelAverage,
      round: roundIndex + 1,
      roundIndex,
      ruleMode,
      score,
      splitDiffs,
      splitLevels: safeSplitLevels,
      splitScores,
      splitTargets: safeSplitTargets,
      target: targetAverage,
      tilt: safeTilt,
    };
  }

  const safeLevel = roundTo(clamp(Number(level), 0, 100), 1);
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
    ruleMode,
    score: normalizeRoundScore(score),
    target,
    tilt: safeTilt,
  };
}
