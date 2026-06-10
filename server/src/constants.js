export const ROOM_STATUSES = {
  LOBBY: "lobby",
  STARTING: "starting",
  IN_GAME: "in_game",
  COMPLETED: "completed",
  CLOSED: "closed",
};

export const GAME_RULE_MODES = {
  CLASSIC: "classic",
  BLIND: "blind",
  FAKE_TARGET: "fake-target",
  REVERSE_POUR: "reverse-pour",
  LEAKY: "leaky",
  TILT: "tilt",
  CHAOS_QUEUE: "chaos-queue",
  SPLIT_FILL: "split-fill",
  PERFECT_OR_NOTHING: "perfect-or-nothing",
};

export const GAME_MODES = GAME_RULE_MODES;

export const GAME_DIFFICULTIES = {
  EASY: "easy",
  NORMAL: "normal",
  HARD: "hard",
};

export const WATER_COLOR_ID_LIST = [
  "blue",
  "aqua",
  "red",
  "mint",
  "lime",
  "lemon",
  "amber",
  "coral",
  "rose",
  "violet",
  "plum",
  "slate",
  "graphite",
];

export const WATER_COLOR_IDS = new Set(WATER_COLOR_ID_LIST);

export const GAME_ROUND_COUNT = 5;
export const ROUND_COUNT = GAME_ROUND_COUNT;
export const MAX_ROUND_SCORE = 10;
export const MIN_TARGET = 24;
export const MAX_TARGET = 86;
export const FAKE_TARGET_MIN_DISTANCE = 12;
export const PERFECT_ZONE_RADIUS = 2.2;
export const CHAOS_QUEUE_MODE_POOL = [
  GAME_RULE_MODES.CLASSIC,
  GAME_RULE_MODES.BLIND,
  GAME_RULE_MODES.FAKE_TARGET,
  GAME_RULE_MODES.REVERSE_POUR,
  GAME_RULE_MODES.LEAKY,
  GAME_RULE_MODES.TILT,
  GAME_RULE_MODES.SPLIT_FILL,
  GAME_RULE_MODES.PERFECT_OR_NOTHING,
];
export const ROOM_CODE_LENGTH = 6;
export const PLAYER_NAME_MIN_LENGTH = 2;
export const PLAYER_NAME_MAX_LENGTH = 24;
export const ROOM_NAME_MIN_LENGTH = 2;
export const ROOM_NAME_MAX_LENGTH = 28;
export const ROOM_PASSWORD_MIN_LENGTH = 3;
export const ROOM_PASSWORD_MAX_LENGTH = 32;

export const ROOM_VISIBILITIES = {
  PUBLIC: "public",
  PRIVATE: "private",
};

export const GAME_MODE_CONFIG = {
  [GAME_RULE_MODES.CLASSIC]: {},
  [GAME_RULE_MODES.BLIND]: {},
  [GAME_RULE_MODES.FAKE_TARGET]: {},
  [GAME_RULE_MODES.REVERSE_POUR]: {},
  [GAME_RULE_MODES.LEAKY]: {
    roundDurationMs: 7000,
  },
  [GAME_RULE_MODES.TILT]: {},
  [GAME_RULE_MODES.CHAOS_QUEUE]: {},
  [GAME_RULE_MODES.SPLIT_FILL]: {},
  [GAME_RULE_MODES.PERFECT_OR_NOTHING]: {},
};

export const DEFAULT_SETTINGS = {
  difficulty: GAME_DIFFICULTIES.NORMAL,
  ruleMode: GAME_RULE_MODES.CLASSIC,
  waterColorId: "blue",
};
