"use client";

import { useEffect, useRef } from "react";
import {
  FIXED_TIMESTEP_SECONDS,
  MAX_FRAME_SECONDS,
  WATER_COLUMN_COUNT,
  WATER_RENDER_COLORS,
  WAVE_VISUAL_SCALE,
  getWaterDifficultyConfig,
  getWaveColumnScale,
  getWaveVisualScale,
  scaleWaveSigma,
} from "@/lib/waterPhysicsConfig";
import {
  computeSurfaceY,
  createWaterSimulationState,
  getWaterLevelPercent,
  resetWaterSimulationState,
  syncWaterSimulationLevel,
  stepWaterSimulation,
} from "@/lib/waterSimulation";

const CANVAS_DPR_LIMIT = 2;
const DESKTOP_DPR_LIMIT = 1;
const MOBILE_DPR_LIMIT = 1;
const OLD_LEAK_RATE_PER_SECOND = 24;
const PARTICLE_TYPE_SPLASH = 1;
const STREAM_DESCEND_SPEED = 3.6;
const STREAM_SOURCE_FOLLOW = 0.24;
const STREAM_MID_FOLLOW = 0.14;
const STREAM_TAIL_FOLLOW = 0.09;
const WHITE_RGB = { b: 255, g: 255, r: 255 };
const DEEP_RGB = { b: 36, g: 28, r: 20 };

function getCanvasDpr(width) {
  const limit = width < 768 ? MOBILE_DPR_LIMIT : DESKTOP_DPR_LIMIT;

  return Math.min(window.devicePixelRatio || 1, CANVAS_DPR_LIMIT, limit);
}

function syncCanvasSize(canvas, dimensions) {
  const width = canvas.clientWidth || 1;
  const height = canvas.clientHeight || 1;
  const dpr = getCanvasDpr(width);
  const nextWidth = Math.max(1, Math.floor(width * dpr));
  const nextHeight = Math.max(1, Math.floor(height * dpr));

  dimensions.cssWidth = width;
  dimensions.cssHeight = height;
  dimensions.dpr = dpr;
  dimensions.viewportWidth = window.innerWidth || width;
  dimensions.width = width;
  dimensions.height = height;

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

function cubicPoint(p0, p1, p2, p3, amount) {
  const t = clamp(amount, 0, 1);
  const inverseT = 1 - t;
  const inverseT2 = inverseT * inverseT;
  const t2 = t * t;

  return {
    x:
      inverseT2 * inverseT * p0.x +
      3 * inverseT2 * t * p1.x +
      3 * inverseT * t2 * p2.x +
      t2 * t * p3.x,
    y:
      inverseT2 * inverseT * p0.y +
      3 * inverseT2 * t * p1.y +
      3 * inverseT * t2 * p2.y +
      t2 * t * p3.y,
  };
}

function hexToRgb(hex) {
  const normalized = hex?.replace("#", "");

  if (!normalized || normalized.length !== 6) {
    return null;
  }

  const value = Number.parseInt(normalized, 16);

  if (Number.isNaN(value)) {
    return null;
  }

  return {
    b: value & 255,
    g: (value >> 8) & 255,
    r: (value >> 16) & 255,
  };
}

function mixRgb(from, to, amount) {
  return {
    b: Math.round(from.b + (to.b - from.b) * amount),
    g: Math.round(from.g + (to.g - from.g) * amount),
    r: Math.round(from.r + (to.r - from.r) * amount),
  };
}

function rgba(color, alpha) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function makeWaterPalette(waterColor) {
  const base = hexToRgb(waterColor?.value) ?? { b: 232, g: 186, r: 125 };

  return {
    particle: rgba(mixRgb(base, WHITE_RGB, 0.45), 0.8),
    splash: rgba(mixRgb(base, WHITE_RGB, 0.72), 0.76),
    stream: rgba(mixRgb(base, WHITE_RGB, 0.14), 0.58),
    streamCore: rgba(mixRgb(base, WHITE_RGB, 0.34), 0.5),
    streamHighlight: rgba(mixRgb(base, WHITE_RGB, 0.78), 0.52),
    impactFoam: rgba(mixRgb(base, WHITE_RGB, 0.9), 0.52),
    surfaceFoam: rgba(mixRgb(base, WHITE_RGB, 0.82), 0.3),
    surfaceHighlight: WATER_RENDER_COLORS.surfaceHighlight,
    waterDeep: rgba(mixRgb(base, DEEP_RGB, 0.28), 0.95),
    waterMid: rgba(base, 0.88),
    waterTop: rgba(mixRgb(base, WHITE_RGB, 0.18), 0.92),
  };
}

function buildSurfaceCurvePath(ctx, surfaceY, dimensions) {
  const width = dimensions.width;
  const lastColumn = WATER_COLUMN_COUNT - 1;

  ctx.beginPath();
  ctx.moveTo(0, surfaceY[0]);

  for (let i = 0; i < lastColumn; i += 1) {
    const x = (i / lastColumn) * width;
    const mx = ((i + 0.5) / lastColumn) * width;
    const my = (surfaceY[i] + surfaceY[i + 1]) * 0.5;

    ctx.quadraticCurveTo(x, surfaceY[i], mx, my);
  }

  ctx.lineTo(width, surfaceY[lastColumn]);
}

function buildClosedWaterPath(ctx, surfaceY, dimensions) {
  buildSurfaceCurvePath(ctx, surfaceY, dimensions);
  ctx.lineTo(dimensions.width, dimensions.height);
  ctx.lineTo(0, dimensions.height);
  ctx.closePath();
}

function drawWaterBody(ctx, surfaceY, dimensions, palette) {
  let minSurfaceY = dimensions.height;

  for (let i = 0; i < WATER_COLUMN_COUNT; i += 1) {
    if (surfaceY[i] < minSurfaceY) {
      minSurfaceY = surfaceY[i];
    }
  }

  const gradient = ctx.createLinearGradient(0, minSurfaceY, 0, dimensions.height);

  gradient.addColorStop(0, palette.waterTop);
  gradient.addColorStop(0.3, palette.waterMid);
  gradient.addColorStop(1, palette.waterDeep);

  buildClosedWaterPath(ctx, surfaceY, dimensions);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function drawSurfaceHighlight(ctx, surfaceY, dimensions, palette) {
  buildSurfaceCurvePath(ctx, surfaceY, dimensions);
  ctx.strokeStyle = palette.surfaceHighlight;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawSurfaceDetails(ctx, state, surfaceY, dimensions, time, palette, intensity) {
  if (intensity <= 0.02) {
    return;
  }

  const columnScale = getWaveColumnScale(dimensions);
  const detailScale = Math.min(1.32, Math.sqrt(columnScale));
  const visualEnergyScale = getWaveVisualScale(dimensions) / WAVE_VISUAL_SCALE;
  const step = Math.max(6, Math.round(6 * columnScale));
  const columnWidth = dimensions.width / (WATER_COLUMN_COUNT - 1);

  ctx.fillStyle = palette.surfaceFoam;

  for (let i = 2; i < WATER_COLUMN_COUNT - 2; i += step) {
    const localEnergy =
      (Math.abs(state.h[i]) * 0.09 + Math.abs(state.vel[i]) * 0.18) *
      visualEnergyScale;
    const pulse =
      0.5 +
      Math.sin(time * 2.2 + i * 0.71 + state.waterBase * 4.8) * 0.5;
    const visibility = clamp((localEnergy + pulse * 0.22) * intensity, 0, 0.78);

    if (visibility < 0.12) {
      continue;
    }

    const x =
      i * columnWidth +
      Math.sin(time * 1.6 + i * 0.37) * 5 * intensity;
    const y = surfaceY[i] + 4 + Math.sin(time * 2.8 + i) * 1.5;
    const width = clamp(5 + localEnergy * 10, 5, 18) * intensity * detailScale;
    const height = clamp(1.2 + localEnergy * 1.8, 1.2, 4.2);

    ctx.globalAlpha = visibility;
    ctx.beginPath();
    ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
    ctx.fill();

    if (visibility > 0.42 && localEnergy > 0.8) {
      const chipAlpha = clamp((localEnergy - 0.55) * 0.14 * intensity, 0, 0.32);
      const chipLift =
        5 + Math.sin(time * 3.4 + i * 0.53) * 3 + localEnergy * 2.6;

      ctx.globalAlpha = chipAlpha;
      ctx.fillStyle = palette.impactFoam;
      ctx.beginPath();
      ctx.ellipse(
        x + Math.sin(time * 4.2 + i) * 6,
        surfaceY[i] - chipLift,
        clamp(1.1 + localEnergy * 1.5, 1.1, 3.6),
        clamp(0.9 + localEnergy * 1.1, 0.9, 3),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillStyle = palette.surfaceFoam;
    }
  }

  ctx.globalAlpha = 1;
}

function applyAmbientSurfaceMotion(surfaceY, dimensions, time, intensity) {
  if (intensity <= 0.01) {
    return;
  }

  const amplitude = Math.min(2.4, dimensions.height * 0.0032) * intensity;
  const columnScale = getWaveColumnScale(dimensions);

  for (let i = 0; i < WATER_COLUMN_COUNT; i += 1) {
    const x = i / (WATER_COLUMN_COUNT - 1);
    const broad = Math.sin(time * 0.9 + (x * 7.6) / columnScale);
    const tight =
      Math.sin(time * 1.45 + (x * 18.5) / columnScale + 0.8) * 0.34;

    surfaceY[i] += (broad + tight) * amplitude;
  }
}

function applySurfaceTilt(surfaceY, dimensions, tiltValue) {
  if (!tiltValue) {
    return;
  }

  const safeTilt = clamp(tiltValue, -1, 1);
  const maxOffset = Math.min(
    dimensions.height * 0.38,
    dimensions.width * 0.28,
    360,
  );

  for (let i = 0; i < WATER_COLUMN_COUNT; i += 1) {
    const xProgress = i / (WATER_COLUMN_COUNT - 1);

    surfaceY[i] += (xProgress - 0.5) * maxOffset * safeTilt;
  }
}

function writeSurfaceLevelRef(
  surfaceLevelTargetRef,
  surfaceY,
  dimensions,
  xRatio = 0.5,
) {
  const surfaceLevelRef = surfaceLevelTargetRef?.current;

  if (!surfaceLevelRef || !dimensions.height) {
    return;
  }

  const column = clamp(
    Math.round(clamp(xRatio, 0.02, 0.98) * (WATER_COLUMN_COUNT - 1)),
    0,
    WATER_COLUMN_COUNT - 1,
  );

  surfaceLevelRef.current = clamp(
    (1 - surfaceY[column] / dimensions.height) * 100,
    0,
    100,
  );
}

function isSimulationSettled(state, dimensions) {
  if (state.activeCount > 0 || state.unsettledWater > 0.0015) {
    return false;
  }

  const waveVisualScale = getWaveVisualScale(dimensions);
  let maxHeight = 0;
  let maxVelocity = 0;

  for (let i = 0; i < WATER_COLUMN_COUNT; i += 1) {
    maxHeight = Math.max(maxHeight, Math.abs(state.h[i]));
    maxVelocity = Math.max(maxVelocity, Math.abs(state.vel[i]));
  }

  return maxHeight * waveVisualScale < 2.5 && maxVelocity * waveVisualScale < 2;
}

function writeSettledRef(settledTargetRef, state, currentStatus, dimensions) {
  const settledRef = settledTargetRef?.current;

  if (!settledRef) {
    return;
  }

  settledRef.current =
    currentStatus !== "filling" &&
    currentStatus !== "leaking" &&
    isSimulationSettled(state, dimensions);
}

function applyPersistentPourCrater(surfaceY, dimensions, config, streamState) {
  if (!streamState?.active || streamState.headProgress < 0.96) {
    return;
  }

  const safeTailX = clamp(streamState.tailX, 0.02, 0.98);
  const center = safeTailX * (WATER_COLUMN_COUNT - 1);
  const streamScale = Math.max(1, (config.STREAM_WIDTH ?? 10) / 10);
  const columnScale = getWaveColumnScale(dimensions);
  const visualScale = getWaveVisualScale(dimensions) / WAVE_VISUAL_SCALE;
  const pressureScale = clamp((config.FILL_RATE ?? 0.25) / 0.2, 0.8, 2.2);
  const craterDepth =
    Math.min(dimensions.height * 0.055, 14 + streamScale * pressureScale * 9) *
    visualScale;
  const craterSigma = Math.max(6, scaleWaveSigma(streamScale * 7.5, columnScale));
  const rimOffset = Math.max(2.8, streamScale * 2.5 * columnScale);
  const rimSigma = Math.max(3.5, scaleWaveSigma(streamScale * 2.7, columnScale));
  const rimLift = craterDepth * 0.42;

  for (let i = 0; i < WATER_COLUMN_COUNT; i += 1) {
    const distance = i - center;
    const centerPush =
      craterDepth * Math.exp(-(distance * distance) / craterSigma);
    const leftRim =
      rimLift *
      Math.exp(-((distance + rimOffset) * (distance + rimOffset)) / rimSigma);
    const rightRim =
      rimLift *
      Math.exp(-((distance - rimOffset) * (distance - rimOffset)) / rimSigma);

    surfaceY[i] += centerPush - leftRim - rightRim;
  }
}

function applyPersistentDrainFunnel(surfaceY, dimensions, config) {
  const center = (WATER_COLUMN_COUNT - 1) * 0.5;
  const columnScale = getWaveColumnScale(dimensions);
  const streamScale = Math.max(1, (config.STREAM_WIDTH ?? 10) / 10);
  const visualScale = getWaveVisualScale(dimensions) / WAVE_VISUAL_SCALE;
  const funnelDepth =
    Math.min(dimensions.height * 0.042, 9 + streamScale * 7) * visualScale;
  const funnelSigma = Math.max(
    12,
    scaleWaveSigma((config.DRAIN_SIGMA ?? 38) * 0.55, columnScale),
  );
  const rimOffset = Math.max(4, 4.6 * columnScale);
  const rimSigma = Math.max(5.5, funnelSigma * 0.22);
  const rimLift = funnelDepth * 0.24;

  for (let i = 0; i < WATER_COLUMN_COUNT; i += 1) {
    const distance = i - center;
    const centerSink =
      funnelDepth * Math.exp(-(distance * distance) / funnelSigma);
    const leftRim =
      rimLift *
      Math.exp(-((distance + rimOffset) * (distance + rimOffset)) / rimSigma);
    const rightRim =
      rimLift *
      Math.exp(-((distance - rimOffset) * (distance - rimOffset)) / rimSigma);

    surfaceY[i] += centerSink - leftRim - rightRim;
  }
}

function drawPourStream(
  ctx,
  surfaceY,
  dimensions,
  config,
  isPouring,
  time,
  streamState,
  palette,
) {
  if (!isPouring || !streamState?.active) {
    return;
  }

  const safeSourceX = clamp(streamState.sourceX, 0.02, 0.98);
  const safeMidX = clamp(streamState.midX, 0.02, 0.98);
  const safeTailX = clamp(streamState.tailX, 0.02, 0.98);
  const progress = clamp(streamState.headProgress, 0, 1);
  const easedProgress = 1 - (1 - progress) * (1 - progress);
  const sourceX = dimensions.width * safeSourceX;
  const midX = dimensions.width * safeMidX;
  const tailTargetX = dimensions.width * safeTailX;
  const centerColumn = clamp(
    Math.round(safeTailX * (WATER_COLUMN_COUNT - 1)),
    0,
    WATER_COLUMN_COUNT - 1,
  );
  const surfaceTargetY = Math.max(24, surfaceY[centerColumn] + 2);
  const sourceY = -8;
  const endY = lerp(sourceY, surfaceTargetY, easedProgress);
  const streamWidth = Math.max(
    10,
    config.STREAM_VISUAL_WIDTH ?? config.STREAM_WIDTH * 1.28,
  );
  const wobbleA = Math.sin(time * 8.5 + safeSourceX * 7) * config.STREAM_WOBBLE;
  const wobbleB = Math.sin(time * 5.2 + safeTailX * 11) * config.STREAM_WOBBLE;
  const endX = clamp(
    lerp(sourceX, tailTargetX, easedProgress) + wobbleB * 0.22,
    streamWidth,
    dimensions.width - streamWidth,
  );
  const firstControlX = clamp(
    lerp(sourceX, midX, 0.72) + wobbleA * 0.65,
    streamWidth,
    dimensions.width - streamWidth,
  );
  const secondControlX = clamp(
    lerp(midX, endX, 0.78) - wobbleB * 0.45,
    streamWidth,
    dimensions.width - streamWidth,
  );
  const firstControlY = lerp(sourceY, endY, 0.22);
  const secondControlY = lerp(sourceY, endY, 0.72);
  const pathStart = { x: sourceX, y: sourceY };
  const pathControlA = { x: firstControlX, y: firstControlY };
  const pathControlB = { x: secondControlX, y: secondControlY };
  const pathEnd = { x: endX, y: endY };

  const strokeStream = (offset, width, color, alphaOffset = 0) => {
    ctx.beginPath();
    ctx.moveTo(sourceX + offset, sourceY);
    ctx.bezierCurveTo(
      firstControlX + offset * 0.65,
      firstControlY,
      secondControlX + offset * 0.35,
      secondControlY,
      endX + offset * 0.2,
      endY,
    );
    ctx.strokeStyle = color;
    ctx.globalAlpha = clamp(progress * 1.3 - alphaOffset, 0, 1);
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  strokeStream(0, streamWidth * 1.55, palette.stream, 0.2);
  strokeStream(0, streamWidth, palette.stream);
  strokeStream(
    streamWidth * 0.14,
    Math.max(4, streamWidth * 0.38),
    palette.streamCore,
    0.04,
  );
  strokeStream(
    -streamWidth * 0.18,
    Math.max(2, streamWidth * 0.16),
    palette.streamHighlight,
    0.1,
  );

  const visibleLength = clamp(easedProgress, 0.05, 1);

  for (let i = 0; i < 4; i += 1) {
    const travel = (time * (0.26 + i * 0.035) + i * 0.23) % 1;
    const t = clamp(0.08 + travel * 0.82, 0.08, 0.9);

    if (t > visibleLength) {
      continue;
    }

    const point = cubicPoint(pathStart, pathControlA, pathControlB, pathEnd, t);
    const pulse = 0.7 + Math.sin(time * 5.4 + i * 1.9) * 0.3;
    const side =
      Math.sin(time * 4.1 + i * 2.7 + safeTailX * 3) * streamWidth * 0.14;

    ctx.globalAlpha = clamp(progress * 0.42 - i * 0.035, 0, 0.48);
    ctx.fillStyle = i % 2 === 0 ? palette.streamCore : palette.streamHighlight;
    ctx.beginPath();
    ctx.ellipse(
      point.x + side,
      point.y,
      streamWidth * (0.2 + pulse * 0.12),
      streamWidth * (0.55 + pulse * 0.2),
      Math.sin(time + i) * 0.12,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawImpactFoam(
  ctx,
  surfaceY,
  dimensions,
  config,
  isPouring,
  isLeaking,
  time,
  streamState,
  palette,
) {
  if (!isPouring || !streamState?.active || streamState.headProgress < 0.96) {
    return;
  }

  const safeTailX = clamp(streamState.tailX, 0.02, 0.98);
  const column = clamp(
    Math.round(safeTailX * (WATER_COLUMN_COUNT - 1)),
    0,
    WATER_COLUMN_COUNT - 1,
  );
  const centerX = dimensions.width * safeTailX;
  const centerY = surfaceY[column] + 1;
  const baseWidth = Math.max(18, config.STREAM_WIDTH * 3.4);
  const pulse = 0.78 + Math.sin(time * 8.2 + safeTailX * 5) * 0.22;

  ctx.fillStyle = palette.impactFoam;

  for (let i = 0; i < 5; i += 1) {
    const side = i - 2;
    const x =
      centerX +
      side * baseWidth * 0.2 +
      Math.sin(time * 4.6 + i * 1.7) * baseWidth * 0.08;
    const y = centerY + Math.sin(time * 5.1 + i) * 1.2;
    const width = baseWidth * (0.18 + (2 - Math.abs(side)) * 0.055) * pulse;
    const height = 2.6 + (2 - Math.abs(side)) * 0.7;

    ctx.globalAlpha = clamp(0.18 + (2 - Math.abs(side)) * 0.075, 0.16, 0.34);
    ctx.beginPath();
    ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawParticles(ctx, state, palette) {
  const particles = state.particles;

  for (let i = 0; i < state.activeCount; i += 1) {
    const radius = particles.radius[i];
    const isSplash = particles.type[i] === PARTICLE_TYPE_SPLASH;
    const elongation = isSplash
      ? 1.12
      : clamp(1 + (particles.vy[i] / 800) * 2, 1.2, 4);

    ctx.fillStyle = isSplash ? palette.splash : palette.particle;
    ctx.beginPath();
    ctx.ellipse(
      particles.x[i],
      particles.y[i],
      radius,
      radius * elongation,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function renderWater(
  ctx,
  state,
  dimensions,
  config,
  isPouring,
  isLeaking,
  time,
  streamState,
  tiltValue,
  palette,
  surfaceIntensity,
  renderStream,
  surfaceLevelRef,
  surfaceSampleX,
) {
  const surfaceY = computeSurfaceY(state, dimensions);

  applySurfaceTilt(surfaceY, dimensions, tiltValue);
  writeSurfaceLevelRef(
    surfaceLevelRef,
    surfaceY,
    dimensions,
    surfaceSampleX,
  );
  applyAmbientSurfaceMotion(
    surfaceY,
    dimensions,
    time,
    isPouring
      ? 0.42
      : surfaceIntensity <= 0
        ? 0
        : Math.max(surfaceIntensity, 0.36),
  );
  if (renderStream) {
    applyPersistentPourCrater(surfaceY, dimensions, config, streamState);
  }
  if (isLeaking) {
    applyPersistentDrainFunnel(surfaceY, dimensions, config);
  }
  ctx.clearRect(0, 0, dimensions.width, dimensions.height);
  if (renderStream) {
    drawPourStream(
      ctx,
      surfaceY,
      dimensions,
      config,
      isPouring,
      time,
      streamState,
      palette,
    );
  }
  drawWaterBody(ctx, surfaceY, dimensions, palette);
  drawSurfaceHighlight(ctx, surfaceY, dimensions, palette);
  if (renderStream) {
    drawImpactFoam(
      ctx,
      surfaceY,
      dimensions,
      config,
      isPouring,
      time,
      streamState,
      palette,
    );
  }
  drawSurfaceDetails(
    ctx,
    state,
    surfaceY,
    dimensions,
    time,
    palette,
    surfaceIntensity,
  );
  drawParticles(ctx, state, palette);
}

export default function WaterPhysicsCanvas({
  className = "pointer-events-none absolute inset-0 z-10 h-full w-full will-change-transform",
  difficulty,
  initialLevel = 0,
  isPourActive = true,
  isReversePour = false,
  levelRef,
  externalLevelRef = null,
  pourXRef,
  roundIndex,
  status,
  tiltRef,
  waterColor,
  renderStream = true,
  surfaceLevelRef = null,
  settledRef = null,
  streamOnly = false,
}) {
  const canvasRef = useRef(null);
  const dimensionsRef = useRef({
    cssHeight: 0,
    cssWidth: 0,
    dpr: 1,
    height: 1,
    viewportWidth: 1,
    width: 1,
  });
  const stateRef = useRef(createWaterSimulationState());
  const animationRef = useRef(null);
  const accumulatorRef = useRef(0);
  const difficultyRef = useRef(difficulty);
  const lastTimeRef = useRef(null);
  const paletteRef = useRef(makeWaterPalette(waterColor));
  const previousStatusRef = useRef(status);
  const surfaceLevelTargetRef = useRef(surfaceLevelRef);
  const settledTargetRef = useRef(settledRef);
  const streamRef = useRef({
    active: false,
    headProgress: 0,
    midX: 0.5,
    sourceX: 0.5,
    tailX: 0.5,
  });
  const visualPourXRef = useRef(0.5);
  const stepOptionsRef = useRef({
    config: getWaterDifficultyConfig(difficulty),
    dimensions: null,
    isLeaking: false,
    isPouring: false,
    isReversePour: false,
    leakRatePerSecond: OLD_LEAK_RATE_PER_SECOND,
    pourX: 0.5,
  });
  const statusRef = useRef(status);
  const isPourActiveRef = useRef(isPourActive);
  const previousPourActiveRef = useRef(isPourActive);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    isPourActiveRef.current = isPourActive;
  }, [isPourActive]);

  useEffect(() => {
    paletteRef.current = makeWaterPalette(waterColor);
  }, [waterColor]);

  useEffect(() => {
    surfaceLevelTargetRef.current = surfaceLevelRef;
  }, [surfaceLevelRef]);

  useEffect(() => {
    settledTargetRef.current = settledRef;
  }, [settledRef]);

  useEffect(() => {
    const initialBase = clamp(initialLevel / 100, 0, 1);

      if (!streamOnly) {
        resetWaterSimulationState(stateRef.current, initialBase);
        levelRef.current = initialLevel;
        if (surfaceLevelTargetRef.current) {
          surfaceLevelTargetRef.current.current = initialLevel;
        }
        if (settledTargetRef.current) {
          settledTargetRef.current.current = true;
        }
      }
    accumulatorRef.current = 0;
    visualPourXRef.current = clamp(pourXRef?.current ?? 0.5, 0.02, 0.98);
    streamRef.current = {
      active: false,
      headProgress: 0,
      midX: visualPourXRef.current,
      sourceX: visualPourXRef.current,
      tailX: visualPourXRef.current,
    };
  }, [initialLevel, levelRef, pourXRef, roundIndex, streamOnly]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return undefined;
    }

    syncCanvasSize(canvas, dimensionsRef.current);

    let resizeObserver;

    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => {
        syncCanvasSize(canvas, dimensionsRef.current);
      });
      resizeObserver.observe(canvas);
    } else {
      const handleResize = () => syncCanvasSize(canvas, dimensionsRef.current);

      window.addEventListener("resize", handleResize);
      resizeObserver = { disconnect: () => window.removeEventListener("resize", handleResize) };
    }

    const tick = (time) => {
      ctx.setTransform(
        dimensionsRef.current.dpr,
        0,
        0,
        dimensionsRef.current.dpr,
        0,
        0,
      );

      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }

      const frameSeconds = Math.min(
        (time - lastTimeRef.current) / 1000,
        MAX_FRAME_SECONDS,
      );
      const state = stateRef.current;
      const currentStatus = statusRef.current;
      const currentPourActive = isPourActiveRef.current;
      const config = getWaterDifficultyConfig(difficultyRef.current);
      const stepOptions = stepOptionsRef.current;
      const rawPourX = clamp(pourXRef?.current ?? 0.5, 0.02, 0.98);
      const currentTilt = tiltRef?.current ?? 0;
      const stream = streamRef.current;
      const previousStatus = previousStatusRef.current;
      const externalLevel = externalLevelRef?.current;

      lastTimeRef.current = time;

      if (currentStatus !== previousStatus) {
        if (currentStatus === "filling") {
          stream.active = !isReversePour;
          stream.headProgress = 0;
          stream.sourceX = rawPourX;
          stream.midX = rawPourX;
          stream.tailX = rawPourX;
        }

        if (currentStatus === "result") {
          stream.active = false;
        }

        if (currentStatus === "intro") {
          stream.active = false;
          stream.headProgress = 0;
        }

        previousStatusRef.current = currentStatus;
      }

      previousPourActiveRef.current = currentPourActive;

      if (currentStatus === "filling" && !isReversePour) {
        stream.active = true;
        stream.sourceX += (rawPourX - stream.sourceX) * STREAM_SOURCE_FOLLOW;
        stream.midX += (stream.sourceX - stream.midX) * STREAM_MID_FOLLOW;
        stream.tailX += (stream.midX - stream.tailX) * STREAM_TAIL_FOLLOW;
        stream.headProgress = clamp(
          stream.headProgress + frameSeconds * STREAM_DESCEND_SPEED,
          0,
          1,
        );
        visualPourXRef.current = stream.tailX;
      } else {
        stream.active = false;
        visualPourXRef.current = rawPourX;
      }

      if (!streamOnly && Number.isFinite(externalLevel)) {
        syncWaterSimulationLevel(
          state,
          externalLevel,
          currentStatus === "filling" ? 0.18 : 0.42,
        );
      }

      if (
        currentStatus === "intro" ||
        (!streamOnly &&
          state.waterBase === 0 &&
          state.activeCount === 0 &&
          currentStatus !== "filling")
      ) {
        writeSettledRef(
          settledTargetRef,
          state,
          currentStatus,
          dimensionsRef.current,
        );
        accumulatorRef.current = 0;
        ctx.clearRect(0, 0, dimensionsRef.current.width, dimensionsRef.current.height);
        animationRef.current = requestAnimationFrame(tick);
        return;
      }

      accumulatorRef.current += frameSeconds;
      const streamImpactReady =
        currentStatus === "filling" &&
        currentPourActive &&
        (isReversePour || stream.headProgress >= 0.98);
      const effectivePourX = isReversePour ? rawPourX : stream.tailX;

      if (streamOnly) {
        const surfaceLevel = clamp((levelRef.current ?? initialLevel) / 100, 0, 1);
        const surfaceY = Array.from(
          { length: WATER_COLUMN_COUNT },
          () => dimensionsRef.current.height * (1 - surfaceLevel),
        );

        ctx.clearRect(
          0,
          0,
          dimensionsRef.current.width,
          dimensionsRef.current.height,
        );
        drawPourStream(
          ctx,
          surfaceY,
          dimensionsRef.current,
          config,
          streamImpactReady,
          time / 1000,
          stream,
          paletteRef.current,
        );
        animationRef.current = requestAnimationFrame(tick);
        return;
      }

      stepOptions.config = config;
      stepOptions.dimensions = dimensionsRef.current;
      stepOptions.isLeaking = currentStatus === "leaking";
      stepOptions.isPouring = streamImpactReady;
      stepOptions.isReversePour = isReversePour;
      stepOptions.pourX = effectivePourX;

      if (currentStatus === "result") {
        accumulatorRef.current = 0;
      }

      while (
        currentStatus !== "result" &&
        accumulatorRef.current >= FIXED_TIMESTEP_SECONDS
      ) {
        stepWaterSimulation(state, FIXED_TIMESTEP_SECONDS, stepOptions);
        levelRef.current = getWaterLevelPercent(state);
        accumulatorRef.current -= FIXED_TIMESTEP_SECONDS;
      }

      writeSettledRef(
        settledTargetRef,
        state,
        currentStatus,
        dimensionsRef.current,
      );

      renderWater(
        ctx,
        state,
        dimensionsRef.current,
        config,
        currentStatus === "filling" && currentPourActive && !isReversePour,
        currentStatus === "leaking",
        time / 1000,
        stream,
        currentTilt,
        paletteRef.current,
        currentStatus === "result"
          ? 0
          : currentStatus === "settling"
            ? 0
            : currentStatus === "leaking"
              ? 0.52
            : currentStatus === "filling" && currentPourActive && !isReversePour
              ? 1
              : 0.28,
        renderStream,
        surfaceLevelTargetRef,
        effectivePourX,
      );

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
      animationRef.current = null;
      lastTimeRef.current = null;
    };
  }, [externalLevelRef, initialLevel, isReversePour, levelRef, pourXRef, renderStream, streamOnly, tiltRef]);

  return (
    <canvas
      aria-hidden="true"
      className={className}
      ref={canvasRef}
    />
  );
}
