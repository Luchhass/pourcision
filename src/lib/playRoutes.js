import {
  DEFAULT_DIFFICULTY_ID,
  GAME_DIFFICULTIES,
  GAME_ROUND_COUNT,
  GAME_RULE_MODES,
  MENU_MODES,
  resolveWaterColorId,
  ROUND_COUNT_OPTIONS,
  ROUTES,
} from "@/lib/constants";
import { createGameResumeKey } from "@/lib/gameResume";

const MODE_PATH_SEGMENTS = {
  [MENU_MODES.SINGLEPLAYER]: "solo",
  [MENU_MODES.MULTIPLAYER]: "multiplayer",
};

const MODE_ALIASES = {
  multi: MENU_MODES.MULTIPLAYER,
  multiplayer: MENU_MODES.MULTIPLAYER,
  singleplayer: MENU_MODES.SINGLEPLAYER,
  solo: MENU_MODES.SINGLEPLAYER,
};

const RULE_PATH_SEGMENTS = {
  [GAME_RULE_MODES.AUTO_RISE]: "auto",
  [GAME_RULE_MODES.BAND_RUN]: "band",
  [GAME_RULE_MODES.BLIND]: "blind",
  [GAME_RULE_MODES.CHARGE_POUR]: "charge",
  [GAME_RULE_MODES.CHAOS_QUEUE]: "chaos",
  [GAME_RULE_MODES.CLASSIC]: "classic",
  [GAME_RULE_MODES.COLORBLIND]: "blackout",
  [GAME_RULE_MODES.ENDLESS]: "endless",
  [GAME_RULE_MODES.FAKE_TARGET]: "fake",
  [GAME_RULE_MODES.FLASH]: "flash",
  [GAME_RULE_MODES.INVERT]: "invert",
  [GAME_RULE_MODES.LEAKY]: "leaky",
  [GAME_RULE_MODES.PERFECT_OR_NOTHING]: "perfect",
  [GAME_RULE_MODES.REVERSE_POUR]: "reverse",
  [GAME_RULE_MODES.SIPHON]: "siphon",
  [GAME_RULE_MODES.SPLIT_FILL]: "split",
  [GAME_RULE_MODES.TIME_ATTACK]: "time",
  [GAME_RULE_MODES.TILT]: "tilt",
};

const RULE_ALIASES = Object.entries(RULE_PATH_SEGMENTS).reduce(
  (aliases, [ruleMode, segment]) => ({
    ...aliases,
    [ruleMode]: ruleMode,
    [segment]: ruleMode,
  }),
  {},
);

function pickFirst(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function pickValid(value, fallback, source) {
  return Object.values(source).includes(value) ? value : fallback;
}

function safeDecodeSegment(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function pickDifficulty(value) {
  return pickValid(value, DEFAULT_DIFFICULTY_ID, GAME_DIFFICULTIES);
}

function pickRoundCount(value) {
  const roundCount = Number(value);

  return Number.isInteger(roundCount) && ROUND_COUNT_OPTIONS.includes(roundCount)
    ? roundCount
    : GAME_ROUND_COUNT;
}

function pickSeed(value, fallbackParts) {
  const seed = Array.isArray(value) ? value.join("-") : value;

  if (typeof seed === "string" && seed.trim()) {
    return safeDecodeSegment(seed.trim()).slice(0, 96);
  }

  return fallbackParts.join(":");
}

export function normalizePlayMode(value) {
  return (
    MODE_ALIASES[String(value || "").toLowerCase()] ||
    MENU_MODES.SINGLEPLAYER
  );
}

export function normalizeRuleMode(value) {
  return (
    RULE_ALIASES[String(value || "").toLowerCase()] || GAME_RULE_MODES.CLASSIC
  );
}

export function createShortPlaySeed() {
  return `${Date.now().toString(36).slice(-4)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function buildSingleplayerPlayPath(settings) {
  const modeSegment = MODE_PATH_SEGMENTS[MENU_MODES.SINGLEPLAYER];
  const difficulty = pickDifficulty(settings?.difficulty);
  const ruleMode = normalizeRuleMode(settings?.ruleMode);
  const ruleSegment = RULE_PATH_SEGMENTS[ruleMode] || ruleMode;
  const roundCount = pickRoundCount(settings?.roundCount);
  const waterColorId = resolveWaterColorId(settings?.waterColorId);
  const seed = encodeURIComponent(settings?.targetSeed || createShortPlaySeed());

  return `/play/${modeSegment}/${difficulty}/${ruleSegment}/${roundCount}/${waterColorId}/${seed}`;
}

export function resolvePlayRouteSettings({ params = {}, searchParams = {} } = {}) {
  const mode = normalizePlayMode(params?.mode);
  const route =
    mode === MENU_MODES.MULTIPLAYER ? ROUTES.MULTIPLAYER : ROUTES.SINGLEPLAYER;
  const difficulty = pickDifficulty(
    pickFirst(params?.difficulty) || pickFirst(searchParams?.difficulty),
  );
  const ruleMode = normalizeRuleMode(
    pickFirst(params?.ruleMode) || pickFirst(searchParams?.gameMode),
  );
  const waterColorId = resolveWaterColorId(
    pickFirst(params?.waterColor) || pickFirst(searchParams?.waterColor),
  );
  const roundCount = pickRoundCount(
    pickFirst(params?.roundCount) ||
      pickFirst(searchParams?.roundCount) ||
      pickFirst(searchParams?.levels),
  );
  const targetSeed = pickSeed(
    params?.seed || pickFirst(searchParams?.seed),
    [mode, difficulty, ruleMode, roundCount, waterColorId],
  );
  const resumeKey = createGameResumeKey([
    mode,
    route,
    difficulty,
    ruleMode,
    roundCount,
    waterColorId,
    targetSeed,
  ]);

  return {
    mode,
    settings: {
      difficulty,
      mode,
      resumeKey,
      route,
      roundCount,
      ruleMode,
      targetSeed,
      waterColorId,
    },
  };
}
