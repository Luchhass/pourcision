import {
  MAX_WATER_PARTICLES,
  WATER_BASE_MAX,
  WATER_BASE_MIN,
  WATER_COLUMN_COUNT,
  getWaveColumnScale,
  getWaveVisualScale,
  scaleWaveSigma,
} from "@/lib/waterPhysicsConfig";

const PARTICLE_MASS = 2.7;
const IMPACT_TO_WAVE = 0.000055;
const LEAK_PERCENT_TO_BASE = 0.01;
const MAX_WAVE_HEIGHT = 42;
const PARTICLE_TYPE_SPLASH = 1;
const CENTER_CRATER_RATIO = 1.28;
const DEFAULT_LEAK_RATE_PER_SECOND = 24;
const RIM_FORCE_RATIO = 0.72;
const MAX_SURFACE_CARRY_LEVEL = 0.08;
const RANDOM_MULTIPLIER = 1664525;
const RANDOM_INCREMENT = 1013904223;
const RANDOM_MODULUS = 4294967296;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function softLimitWave(value) {
  return Math.tanh(value / MAX_WAVE_HEIGHT) * MAX_WAVE_HEIGHT;
}

function nextRandom(state) {
  state.seed =
    (state.seed * RANDOM_MULTIPLIER + RANDOM_INCREMENT) % RANDOM_MODULUS;

  return state.seed / RANDOM_MODULUS;
}

function createParticleBuffer() {
  return {
    mass: new Float32Array(MAX_WATER_PARTICLES),
    radius: new Float32Array(MAX_WATER_PARTICLES),
    type: new Uint8Array(MAX_WATER_PARTICLES),
    vx: new Float32Array(MAX_WATER_PARTICLES),
    vy: new Float32Array(MAX_WATER_PARTICLES),
    x: new Float32Array(MAX_WATER_PARTICLES),
    y: new Float32Array(MAX_WATER_PARTICLES),
  };
}

export function createWaterSimulationState(seed = 918273) {
  return {
    activeCount: 0,
    emitAccumulator: 0,
    h: new Float32Array(WATER_COLUMN_COUNT),
    hPrev: new Float32Array(WATER_COLUMN_COUNT),
    particles: createParticleBuffer(),
    pourRippleTime: 0,
    seed,
    surfaceY: new Float32Array(WATER_COLUMN_COUNT),
    unsettledWater: 0,
    vel: new Float32Array(WATER_COLUMN_COUNT),
    waterBase: WATER_BASE_MIN,
  };
}

export function resetWaterSimulationState(state, waterBase = WATER_BASE_MIN) {
  state.activeCount = 0;
  state.emitAccumulator = 0;
  state.pourRippleTime = 0;
  state.unsettledWater = 0;
  state.waterBase = clamp(waterBase, WATER_BASE_MIN, WATER_BASE_MAX);
  state.h.fill(0);
  state.hPrev.fill(0);
  state.surfaceY.fill(0);
  state.vel.fill(0);
}

export function getWaterBaseLevel(state) {
  return clamp(state.waterBase, WATER_BASE_MIN, WATER_BASE_MAX);
}

export function getWaterLevelPercent(state) {
  return clamp(
    state.waterBase + state.unsettledWater,
    WATER_BASE_MIN,
    WATER_BASE_MAX,
  ) * 100;
}

export function syncWaterSimulationLevel(state, levelPercent, amount = 0.24) {
  const safeAmount = clamp(amount, 0, 1);
  const targetLevel = clamp(Number(levelPercent) / 100, WATER_BASE_MIN, WATER_BASE_MAX);

  if (!Number.isFinite(targetLevel)) {
    return;
  }

  const currentLevel = clamp(
    state.waterBase + state.unsettledWater,
    WATER_BASE_MIN,
    WATER_BASE_MAX,
  );
  const delta = targetLevel - currentLevel;

  if (Math.abs(delta) < 0.0001) {
    return;
  }

  state.waterBase = clamp(
    state.waterBase + delta * safeAmount,
    WATER_BASE_MIN,
    WATER_BASE_MAX,
  );
  state.unsettledWater = clamp(
    state.unsettledWater * (1 - safeAmount * 0.35),
    0,
    WATER_BASE_MAX,
  );
}

export function settleWaterSurface(state, amount = 0.16) {
  const safeAmount = clamp(amount, 0, 1);

  for (let i = 0; i < WATER_COLUMN_COUNT; i += 1) {
    state.h[i] *= safeAmount;
    state.vel[i] *= safeAmount;
  }
}

export function getColumnForX(x, width) {
  if (!Number.isFinite(width) || width <= 0) {
    return Math.floor(WATER_COLUMN_COUNT * 0.5);
  }

  const column = Math.floor((x / width) * WATER_COLUMN_COUNT);

  return clamp(column, 1, WATER_COLUMN_COUNT - 2);
}

export function getSurfaceYForColumn(state, column, dimensions) {
  const safeColumn = clamp(column, 0, WATER_COLUMN_COUNT - 1);
  const waveVisualScale = getWaveVisualScale(dimensions);

  return (
    dimensions.height -
    state.waterBase * dimensions.height -
    state.h[safeColumn] * waveVisualScale
  );
}

function removeParticleAt(state, index) {
  const particles = state.particles;
  const lastIndex = state.activeCount - 1;

  if (index !== lastIndex) {
    particles.x[index] = particles.x[lastIndex];
    particles.y[index] = particles.y[lastIndex];
    particles.vx[index] = particles.vx[lastIndex];
    particles.vy[index] = particles.vy[lastIndex];
    particles.mass[index] = particles.mass[lastIndex];
    particles.radius[index] = particles.radius[lastIndex];
    particles.type[index] = particles.type[lastIndex];
  }

  state.activeCount = Math.max(0, lastIndex);
}

function spawnSplashParticle(state, dimensions, config, x, surfaceY) {
  if (state.activeCount >= MAX_WATER_PARTICLES) {
    removeParticleAt(state, 0);
  }

  const particles = state.particles;
  const index = state.activeCount;
  const direction = nextRandom(state) < 0.5 ? -1 : 1;
  const spread = config.SPLASH_SPREAD ?? 120;
  const upwardForce = config.SPLASH_UP_FORCE ?? 420;
  const radius = 1.2 + nextRandom(state) * 1.5;

  particles.x[index] = clamp(x + (nextRandom(state) - 0.5) * 12, 0, dimensions.width);
  particles.y[index] = surfaceY - radius - 2;
  particles.vx[index] =
    direction * (spread * 0.35 + nextRandom(state) * spread * 0.75);
  particles.vy[index] =
    -(upwardForce * 0.55 + nextRandom(state) * upwardForce * 0.65);
  particles.mass[index] = PARTICLE_MASS * 0.34;
  particles.radius[index] = radius;
  particles.type[index] = PARTICLE_TYPE_SPLASH;
  state.activeCount += 1;
}

function spawnImpactSplash(state, dimensions, config, x, surfaceY, strength = 1) {
  const splashCount = config.SPLASH_COUNT ?? 3;
  const count = Math.max(1, Math.round(splashCount * clamp(strength, 0.35, 1.35)));

  for (let i = 0; i < count; i += 1) {
    spawnSplashParticle(state, dimensions, config, x, surfaceY);
  }
}

function emitImpactSplash(state, dt, dimensions, config, pourX) {
  const column = getColumnForX(dimensions.width * pourX, dimensions.width);
  const surfaceY = getSurfaceYForColumn(state, column, dimensions);

  state.emitAccumulator += config.EMISSION_RATE * 0.42 * dt;
  while (state.emitAccumulator >= 1) {
    const offset = (nextRandom(state) - 0.5) * config.STREAM_WIDTH * 2.2;
    const x = clamp(dimensions.width * pourX + offset, 0, dimensions.width);

    spawnImpactSplash(state, dimensions, config, x, surfaceY, 0.72);
    state.emitAccumulator -= 1;
  }
}

function addZeroSumCraterImpact(state, column, amount, sigma) {
  const safeColumn = clamp(column, 1, WATER_COLUMN_COUNT - 2);
  const safeSigma = Math.max(4, sigma);
  const rimOffset = Math.max(3, Math.sqrt(safeSigma) * 1.6);
  const rimSigma = Math.max(3, safeSigma * 0.38);
  let meanImpulse = 0;

  for (let i = 1; i < WATER_COLUMN_COUNT - 1; i += 1) {
    const distance = i - safeColumn;
    const centerCrater =
      -amount *
      CENTER_CRATER_RATIO *
      Math.exp(-(distance * distance) / safeSigma);
    const leftRim =
      amount *
      RIM_FORCE_RATIO *
      Math.exp(-((distance + rimOffset) * (distance + rimOffset)) / rimSigma);
    const rightRim =
      amount *
      RIM_FORCE_RATIO *
      Math.exp(-((distance - rimOffset) * (distance - rimOffset)) / rimSigma);
    const impulse = centerCrater + leftRim + rightRim;

    state.vel[i] += impulse;
    meanImpulse += impulse;
  }

  meanImpulse /= WATER_COLUMN_COUNT - 2;

  for (let i = 1; i < WATER_COLUMN_COUNT - 1; i += 1) {
    state.vel[i] -= meanImpulse;
  }
}

function addZeroSumWaveImpact(
  state,
  column,
  particleVy,
  particleMass,
  config,
  dimensions,
) {
  const impact =
    Math.max(0, particleVy) * particleMass * config.IMPACT_FORCE * IMPACT_TO_WAVE;
  const columnScale = getWaveColumnScale(dimensions);

  addZeroSumCraterImpact(
    state,
    column,
    impact,
    scaleWaveSigma(config.SPREAD_SIGMA, columnScale),
  );
}

function addPourVolume(state, dt, config, multiplier = 1) {
  const totalLevel = clamp(
    state.waterBase + state.unsettledWater,
    WATER_BASE_MIN,
    WATER_BASE_MAX,
  );
  const room = WATER_BASE_MAX - totalLevel;
  const incoming = Math.min(config.FILL_RATE * multiplier * dt, room);
  const unsettledRatio = clamp(config.UNSETTLED_RATIO ?? 0.08, 0, 0.28);
  const immediate = incoming * (1 - unsettledRatio);

  state.waterBase = clamp(
    state.waterBase + immediate,
    WATER_BASE_MIN,
    WATER_BASE_MAX,
  );
  state.unsettledWater = clamp(
    state.unsettledWater + incoming - immediate,
    0,
    WATER_BASE_MAX,
  );
}

function removePourVolume(state, dt, config) {
  state.unsettledWater = 0;
  state.waterBase = clamp(
    state.waterBase - config.FILL_RATE * dt,
    WATER_BASE_MIN,
    WATER_BASE_MAX,
  );
}

function settleUnsettledWater(state, dt, config) {
  if (state.unsettledWater <= 0) {
    return;
  }

  const settleRate = config.UNSETTLED_SETTLE_RATE ?? 3;
  const transfer = state.unsettledWater * clamp(settleRate * dt, 0, 1);
  const room = WATER_BASE_MAX - state.waterBase;
  const applied = Math.min(transfer, room);

  state.waterBase = clamp(
    state.waterBase + applied,
    WATER_BASE_MIN,
    WATER_BASE_MAX,
  );
  state.unsettledWater = clamp(
    state.unsettledWater - applied,
    0,
    WATER_BASE_MAX,
  );
}

function getPositiveWaveCoverageLevel(state, dimensions) {
  if (!dimensions?.height) {
    return 0;
  }

  const waveVisualScale = getWaveVisualScale(dimensions);
  let coveragePx = 0;

  for (let i = 0; i < WATER_COLUMN_COUNT; i += 1) {
    coveragePx += Math.max(0, state.h[i] * waveVisualScale);
  }

  return clamp(
    coveragePx / WATER_COLUMN_COUNT / dimensions.height,
    0,
    MAX_SURFACE_CARRY_LEVEL,
  );
}

function captureSurfaceCarryVolume(state, dimensions, config) {
  const carryRatio = clamp(config.SURFACE_CARRY_RATIO ?? 0.35, 0, 1);

  if (carryRatio <= 0) {
    return;
  }

  const targetCarry = getPositiveWaveCoverageLevel(state, dimensions) * carryRatio;
  const extraCarry = targetCarry - state.unsettledWater;

  if (extraCarry <= 0) {
    return;
  }

  const room = WATER_BASE_MAX - state.waterBase - state.unsettledWater;

  if (room <= 0) {
    return;
  }

  state.unsettledWater = clamp(
    state.unsettledWater + Math.min(extraCarry, room),
    0,
    WATER_BASE_MAX,
  );
}

function absorbParticle(state, column, particleVy, particleMass, config, dimensions) {
  addZeroSumWaveImpact(
    state,
    column,
    particleVy,
    particleMass,
    config,
    dimensions,
  );
}

function updateParticles(state, dt, dimensions, config) {
  const particles = state.particles;

  for (let index = 0; index < state.activeCount; index += 1) {
    particles.vy[index] += config.GRAVITY * dt;
    particles.vx[index] *= 0.995;
    particles.x[index] += particles.vx[index] * dt;
    particles.y[index] += particles.vy[index] * dt;

    if (
      particles.x[index] < -24 ||
      particles.x[index] > dimensions.width + 24
    ) {
      removeParticleAt(state, index);
      index -= 1;
      continue;
    }

    const column = getColumnForX(particles.x[index], dimensions.width);
    const surfaceY = getSurfaceYForColumn(state, column, dimensions);

    if (
      particles.y[index] + particles.radius[index] >= surfaceY ||
      particles.y[index] >= dimensions.height
    ) {
      const impactVy = particles.vy[index];
      const impactMass = particles.mass[index];

      absorbParticle(
        state,
        column,
        impactVy,
        impactMass,
        config,
        dimensions,
      );
      removeParticleAt(state, index);
      index -= 1;
    }
  }
}

function applyOutwardPourRipple(state, column, config, dimensions) {
  const reach = Math.floor(WATER_COLUMN_COUNT * 0.48);
  const columnScale = getWaveColumnScale(dimensions);
  let meanImpulse = 0;
  let count = 0;

  for (let distance = 1; distance <= reach; distance += 1) {
    const scaledDistance = distance / columnScale;
    const falloff = Math.pow(Math.max(0, 1 - distance / (reach + 1)), 0.58);
    const broadWave = Math.sin(scaledDistance * 0.44 - state.pourRippleTime);
    const tightWave = Math.sin(scaledDistance * 0.92 - state.pourRippleTime * 1.36);
    const irregularity = (nextRandom(state) - 0.5) * config.CONTINUOUS_FORCE;
    const wave =
      (broadWave * 0.7 + tightWave * 0.32 + irregularity * 0.55) *
      config.POUR_RIPPLE_FORCE *
      falloff;
    const left = column - distance;
    const right = column + distance;

    if (left > 0) {
      state.vel[left] += wave;
      meanImpulse += wave;
      count += 1;
    }

    if (right < WATER_COLUMN_COUNT - 1) {
      state.vel[right] += wave;
      meanImpulse += wave;
      count += 1;
    }
  }

  if (count === 0) {
    return;
  }

  meanImpulse /= count;

  for (let distance = 1; distance <= reach; distance += 1) {
    const left = column - distance;
    const right = column + distance;

    if (left > 0) {
      state.vel[left] -= meanImpulse;
    }

    if (right < WATER_COLUMN_COUNT - 1) {
      state.vel[right] -= meanImpulse;
    }
  }
}

function applyContinuousPourDisturbance(state, dt, dimensions, config, pourX) {
  const pourColumn = getColumnForX(dimensions.width * pourX, dimensions.width);
  const columnScale = getWaveColumnScale(dimensions);
  const spread = Math.max(10, Math.round(10 * columnScale));
  const surge =
    config.POUR_SURGE_FORCE * (0.72 + nextRandom(state) * 0.56);
  let meanImpulse = 0;
  let count = 0;

  addZeroSumCraterImpact(
    state,
    pourColumn,
    surge,
    scaleWaveSigma(config.POUR_SURGE_SIGMA, columnScale),
  );
  state.pourRippleTime += config.POUR_RIPPLE_SPEED * dt;
  applyOutwardPourRipple(state, pourColumn, config, dimensions);

  for (let i = pourColumn - spread; i <= pourColumn + spread; i += 1) {
    if (i <= 0 || i >= WATER_COLUMN_COUNT - 1) {
      continue;
    }

    const distance = Math.abs(i - pourColumn);
    const falloff = 1 - distance / (spread + 1);
    const impulse =
      (nextRandom(state) - 0.5) * config.CONTINUOUS_FORCE * falloff;

    state.vel[i] += impulse;
    meanImpulse += impulse;
    count += 1;
  }

  if (count === 0) {
    return;
  }

  meanImpulse /= count;

  for (let i = pourColumn - spread; i <= pourColumn + spread; i += 1) {
    if (i > 0 && i < WATER_COLUMN_COUNT - 1) {
      state.vel[i] -= meanImpulse;
    }
  }
}

function propagateWaves(state, config) {
  for (let i = 0; i < WATER_COLUMN_COUNT; i += 1) {
    state.hPrev[i] = state.h[i];
  }

  for (let i = 1; i < WATER_COLUMN_COUNT - 1; i += 1) {
    state.vel[i] +=
      config.TENSION * (state.h[i - 1] + state.h[i + 1] - 2 * state.h[i]);
  }

  let velocityMean = 0;

  for (let i = 0; i < WATER_COLUMN_COUNT; i += 1) {
    state.vel[i] *= config.DAMPING;
    velocityMean += state.vel[i];
  }

  velocityMean /= WATER_COLUMN_COUNT;

  for (let i = 1; i < WATER_COLUMN_COUNT - 1; i += 1) {
    state.vel[i] -= velocityMean;
    state.h[i] += state.vel[i];
  }

  const edgeRebound = config.EDGE_REBOUND ?? 0.2;
  const lastColumn = WATER_COLUMN_COUNT - 1;
  const leftEdgeEnergy = state.h[1] - state.h[2];
  const rightEdgeEnergy = state.h[lastColumn - 1] - state.h[lastColumn - 2];

  state.vel[2] += leftEdgeEnergy * edgeRebound;
  state.vel[lastColumn - 2] += rightEdgeEnergy * edgeRebound;
  state.h[0] = state.h[1];
  state.h[lastColumn] = state.h[lastColumn - 1];
  state.vel[0] = 0;
  state.vel[lastColumn] = 0;

  let heightMean = 0;

  for (let i = 0; i < WATER_COLUMN_COUNT; i += 1) {
    heightMean += state.h[i];
  }

  heightMean /= WATER_COLUMN_COUNT;

  for (let i = 0; i < WATER_COLUMN_COUNT; i += 1) {
    state.h[i] = softLimitWave(
      (state.h[i] - heightMean) * (config.HEIGHT_DAMPING ?? 0.985),
    );
  }
}

function applyLeak(state, dt, leakRatePerSecond = 0) {
  if (leakRatePerSecond <= 0) {
    return;
  }

  state.waterBase = clamp(
    state.waterBase - leakRatePerSecond * LEAK_PERCENT_TO_BASE * dt,
    WATER_BASE_MIN,
    WATER_BASE_MAX,
  );
}

function applyDrainDisturbance(
  state,
  dimensions,
  config,
  leakRatePerSecond = 0,
  drainX = 0.5,
) {
  const waterLevel = state.waterBase + state.unsettledWater;

  if (!dimensions?.width || !dimensions?.height || waterLevel <= 0.005) {
    return;
  }

  const safeDrainX = clamp(drainX, 0.02, 0.98);
  const drainColumn = getColumnForX(dimensions.width * safeDrainX, dimensions.width);
  const columnScale = getWaveColumnScale(dimensions);
  const rateScale = clamp(
    leakRatePerSecond / DEFAULT_LEAK_RATE_PER_SECOND,
    0.45,
    1.5,
  );
  const levelScale = clamp(waterLevel * 1.35, 0.24, 1);
  const pullForce =
    (config.DRAIN_PULL_FORCE ?? config.POUR_SURGE_FORCE * 0.42) *
    rateScale *
    levelScale;
  const drainSigma = scaleWaveSigma(
    config.DRAIN_SIGMA ?? config.POUR_SURGE_SIGMA * 1.7,
    columnScale,
  );

  addZeroSumCraterImpact(state, drainColumn, pullForce, drainSigma);
}

export function stepWaterSimulation(
  state,
  dt,
  {
    config,
    dimensions,
    isLeaking = false,
    isPouring = false,
    isReversePour = false,
    leakRatePerSecond = 0,
    pourX = 0.5,
    pourMultiplier = 1,
  },
) {
  const safePourX = clamp(pourX, 0.02, 0.98);

  if (isPouring) {
    if (isReversePour) {
      removePourVolume(state, dt, config);
      applyDrainDisturbance(
        state,
        dimensions,
        config,
        DEFAULT_LEAK_RATE_PER_SECOND,
        safePourX,
      );
      state.emitAccumulator = 0;
    } else {
      addPourVolume(state, dt, config, pourMultiplier);
      emitImpactSplash(state, dt, dimensions, config, safePourX);
      applyContinuousPourDisturbance(
        state,
        dt * Math.max(0.75, pourMultiplier),
        dimensions,
        config,
        safePourX,
      );
    }
  } else {
    state.emitAccumulator = 0;
  }

  if (isLeaking) {
    applyLeak(state, dt, leakRatePerSecond);
    applyDrainDisturbance(state, dimensions, config, leakRatePerSecond);
  }

  settleUnsettledWater(state, dt, config);
  updateParticles(state, dt, dimensions, config);
  propagateWaves(state, config);

  if (isPouring && !isReversePour) {
    captureSurfaceCarryVolume(state, dimensions, config);
  }

  return getWaterBaseLevel(state);
}

export function computeSurfaceY(state, dimensions) {
  const waveVisualScale = getWaveVisualScale(dimensions);

  for (let i = 0; i < WATER_COLUMN_COUNT; i += 1) {
    state.surfaceY[i] =
      dimensions.height -
      state.waterBase * dimensions.height -
      state.h[i] * waveVisualScale;
  }

  return state.surfaceY;
}
