import {
  FAKE_TARGET_MIN_DISTANCE,
  GAME_ROUND_COUNT,
  MAX_TARGET,
  MIN_TARGET,
} from "@/lib/constants";

function hashSeed(seed) {
  let hash = 2166136261;

  for (let index = 0; index < String(seed).length; index += 1) {
    hash ^= String(seed).charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function mulberry32(seed) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function roundTarget(value) {
  return Math.round(value * 10) / 10;
}

export function createSeededRandom(seed) {
  return mulberry32(hashSeed(seed));
}

export function createTarget(random = Math.random) {
  return roundTarget(MIN_TARGET + random() * (MAX_TARGET - MIN_TARGET));
}

export function createFakeTarget(realTarget, random = Math.random) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const candidate = createTarget(random);

    if (Math.abs(candidate - realTarget) >= FAKE_TARGET_MIN_DISTANCE) {
      return candidate;
    }
  }

  const direction = realTarget > (MIN_TARGET + MAX_TARGET) / 2 ? -1 : 1;
  const fallback = realTarget + direction * (FAKE_TARGET_MIN_DISTANCE + 8);

  return roundTarget(Math.max(MIN_TARGET, Math.min(MAX_TARGET, fallback)));
}

export function createSplitTargets(random = Math.random) {
  const firstTarget = createTarget(random);
  let secondTarget = createTarget(random);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (Math.abs(firstTarget - secondTarget) >= 10) {
      break;
    }
    secondTarget = createTarget(random);
  }

  return [firstTarget, secondTarget];
}

export function createRoundTargets(seed, roundCount = GAME_ROUND_COUNT) {
  const random = seed ? createSeededRandom(seed) : Math.random;

  return Array.from({ length: roundCount }, (_, roundIndex) => {
    const target = createTarget(random);

    return {
      fakeTarget: createFakeTarget(target, random),
      round: roundIndex + 1,
      roundIndex,
      splitTargets: createSplitTargets(random),
      target,
    };
  });
}
