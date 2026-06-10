import { GAME_DIFFICULTIES } from "@/lib/constants";

export const WATER_COLUMN_COUNT = 88;
export const MAX_WATER_PARTICLES = 84;
export const FIXED_TIMESTEP_SECONDS = 1 / 90;
export const MAX_FRAME_SECONDS = 0.033;
export const WATER_BASE_MIN = 0;
export const WATER_BASE_MAX = 1;
export const WAVE_VISUAL_SCALE = 3.65;
export const WAVE_REFERENCE_WIDTH = 960;
export const WAVE_MAX_COLUMN_SCALE = 2.45;
export const WAVE_MIN_VISUAL_VIEWPORT_SCALE = 0.64;

export const WATER_RENDER_COLORS = {
  particle: "rgba(186, 220, 254, 0.8)",
  stream: "rgba(147, 197, 253, 0.7)",
  streamHighlight: "rgba(220, 240, 255, 0.5)",
  surfaceHighlight: "rgba(255, 255, 255, 0.35)",
  waterDeep: "rgba(70, 130, 190, 0.95)",
  waterMid: "rgba(100, 160, 215, 0.88)",
  waterTop: "rgba(125, 186, 232, 0.92)",
};

export const WATER_PHYSICS_DIFFICULTY = {
  [GAME_DIFFICULTIES.EASY]: {
    CONTINUOUS_FORCE: 0.2,
    DAMPING: 0.89,
    DRAIN_PULL_FORCE: 0.07,
    DRAIN_SIGMA: 46,
    EDGE_REBOUND: 0.16,
    EMISSION_RATE: 20,
    FILL_RATE: 0.2,
    GRAVITY: 3800,
    HEIGHT_DAMPING: 0.985,
    IMPACT_FORCE: 2.2,
    POUR_RIPPLE_FORCE: 0.84,
    POUR_RIPPLE_SPEED: 12,
    POUR_SURGE_FORCE: 0.16,
    POUR_SURGE_SIGMA: 28,
    SPLASH_COUNT: 2,
    SPLASH_SPREAD: 95,
    SPLASH_UP_FORCE: 360,
    SPREAD_SIGMA: 22,
    STREAM_VISUAL_WIDTH: 12,
    STREAM_WIDTH: 8,
    STREAM_WOBBLE: 2,
    SURFACE_CARRY_RATIO: 0.22,
    TENSION: 0.32,
    UNSETTLED_RATIO: 0.06,
    UNSETTLED_SETTLE_RATE: 5.1,
  },
  [GAME_DIFFICULTIES.NORMAL]: {
    CONTINUOUS_FORCE: 0.34,
    DAMPING: 0.9,
    DRAIN_PULL_FORCE: 0.1,
    DRAIN_SIGMA: 38,
    EDGE_REBOUND: 0.22,
    EMISSION_RATE: 32,
    FILL_RATE: 0.29,
    GRAVITY: 4400,
    HEIGHT_DAMPING: 0.982,
    IMPACT_FORCE: 3.0,
    POUR_RIPPLE_FORCE: 1.36,
    POUR_RIPPLE_SPEED: 14,
    POUR_SURGE_FORCE: 0.24,
    POUR_SURGE_SIGMA: 22,
    SPLASH_COUNT: 3,
    SPLASH_SPREAD: 135,
    SPLASH_UP_FORCE: 470,
    SPREAD_SIGMA: 17,
    STREAM_VISUAL_WIDTH: 17,
    STREAM_WIDTH: 11,
    STREAM_WOBBLE: 3.4,
    SURFACE_CARRY_RATIO: 0.36,
    TENSION: 0.39,
    UNSETTLED_RATIO: 0.13,
    UNSETTLED_SETTLE_RATE: 2.85,
  },
  [GAME_DIFFICULTIES.HARD]: {
    CONTINUOUS_FORCE: 0.52,
    DAMPING: 0.91,
    DRAIN_PULL_FORCE: 0.14,
    DRAIN_SIGMA: 30,
    EDGE_REBOUND: 0.3,
    EMISSION_RATE: 44,
    FILL_RATE: 0.4,
    GRAVITY: 5000,
    HEIGHT_DAMPING: 0.978,
    IMPACT_FORCE: 4.2,
    POUR_RIPPLE_FORCE: 2.04,
    POUR_RIPPLE_SPEED: 16,
    POUR_SURGE_FORCE: 0.34,
    POUR_SURGE_SIGMA: 16,
    SPLASH_COUNT: 5,
    SPLASH_SPREAD: 175,
    SPLASH_UP_FORCE: 600,
    SPREAD_SIGMA: 12,
    STREAM_VISUAL_WIDTH: 24,
    STREAM_WIDTH: 15,
    STREAM_WOBBLE: 5,
    SURFACE_CARRY_RATIO: 0.52,
    TENSION: 0.46,
    UNSETTLED_RATIO: 0.22,
    UNSETTLED_SETTLE_RATE: 1.95,
  },
};

export function getWaterDifficultyConfig(difficulty) {
  return (
    WATER_PHYSICS_DIFFICULTY[difficulty] ??
    WATER_PHYSICS_DIFFICULTY[GAME_DIFFICULTIES.NORMAL]
  );
}

export function getWaveColumnScale(dimensions) {
  const width =
    typeof dimensions === "number" ? dimensions : dimensions?.width ?? 0;

  if (!Number.isFinite(width) || width <= 0) {
    return 1;
  }

  return Math.max(1, Math.min(WAVE_MAX_COLUMN_SCALE, WAVE_REFERENCE_WIDTH / width));
}

export function getWaveVisualScale(dimensions) {
  const viewportWidth =
    typeof dimensions === "number"
      ? dimensions
      : dimensions?.viewportWidth ?? dimensions?.width ?? 0;

  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    return WAVE_VISUAL_SCALE;
  }

  const viewportScale = Math.max(
    WAVE_MIN_VISUAL_VIEWPORT_SCALE,
    Math.min(1, Math.sqrt(viewportWidth / WAVE_REFERENCE_WIDTH)),
  );

  return WAVE_VISUAL_SCALE * viewportScale;
}

export function scaleWaveSigma(sigma, columnScale) {
  const safeSigma = Number.isFinite(sigma) ? sigma : 1;
  const safeScale = Number.isFinite(columnScale) ? Math.max(1, columnScale) : 1;

  return safeSigma * safeScale * safeScale;
}
