export const APP_NAME = "Pourcision";

export const ROUTES = {
  HOME: "/",
  SINGLEPLAYER: "/play/singleplayer",
  MULTIPLAYER: "/play/multiplayer",
};

export const MENU_MODES = {
  SINGLEPLAYER: "singleplayer",
  MULTIPLAYER: "multiplayer",
};

export const GAME_RULE_MODES = {
  CLASSIC: "classic",
  BLIND: "blind",
  FLASH: "flash",
  FAKE_TARGET: "fake-target",
  INVERT: "invert",
  REVERSE_POUR: "reverse-pour",
  LEAKY: "leaky",
  TILT: "tilt",
  CHAOS_QUEUE: "chaos-queue",
  ENDLESS: "endless",
  SPLIT_FILL: "split-fill",
  PERFECT_OR_NOTHING: "perfect-or-nothing",
  BAND_RUN: "band-run",
  CHARGE_POUR: "charge-pour",
  BURST_CLICK: "burst-click",
  COLORBLIND: "colorblind",
};

export const GAME_DIFFICULTIES = {
  EASY: "easy",
  NORMAL: "normal",
  HARD: "hard",
};

export const GAME_ROUND_COUNT = 5;
export const ROUND_COUNT = GAME_ROUND_COUNT;
export const MAX_ROUND_SCORE = 10;
export const MIN_TARGET = 24;
export const MAX_TARGET = 86;
export const FAKE_TARGET_MIN_DISTANCE = 12;
export const TIMED_ROUND_MS = 5000;
export const LEAKY_ROUND_MS = TIMED_ROUND_MS;
export const PERFECT_ZONE_RADIUS = 2.2;
export const CHAOS_BRIEFING_MS = 3000;
export const CHAOS_QUEUE_MODE_POOL = [
  GAME_RULE_MODES.CLASSIC,
  GAME_RULE_MODES.BLIND,
  GAME_RULE_MODES.FLASH,
  GAME_RULE_MODES.FAKE_TARGET,
  GAME_RULE_MODES.INVERT,
  GAME_RULE_MODES.REVERSE_POUR,
  GAME_RULE_MODES.LEAKY,
  GAME_RULE_MODES.TILT,
  GAME_RULE_MODES.SPLIT_FILL,
  GAME_RULE_MODES.PERFECT_OR_NOTHING,
  GAME_RULE_MODES.BAND_RUN,
  GAME_RULE_MODES.CHARGE_POUR,
  GAME_RULE_MODES.BURST_CLICK,
  GAME_RULE_MODES.COLORBLIND,
];

export const MODE_GRID_ORDER = [
  GAME_RULE_MODES.CLASSIC,
  GAME_RULE_MODES.INVERT,
  GAME_RULE_MODES.FLASH,
  GAME_RULE_MODES.BLIND,
  GAME_RULE_MODES.REVERSE_POUR,
  GAME_RULE_MODES.LEAKY,
  GAME_RULE_MODES.FAKE_TARGET,
  GAME_RULE_MODES.SPLIT_FILL,
  GAME_RULE_MODES.PERFECT_OR_NOTHING,
  GAME_RULE_MODES.BAND_RUN,
  GAME_RULE_MODES.CHARGE_POUR,
  GAME_RULE_MODES.BURST_CLICK,
  GAME_RULE_MODES.COLORBLIND,
  GAME_RULE_MODES.TILT,
  GAME_RULE_MODES.CHAOS_QUEUE,
];

export const WATER_COLORS = [
  {
    id: "blue",
    name: "Blue",
    value: "#8abfec",
    text: "#2f4a61",
  },
  {
    id: "aqua",
    name: "Aqua",
    value: "#55d7ef",
    text: "#235460",
  },
  {
    id: "red",
    name: "Red",
    value: "#ef2f25",
    text: "#3a2726",
  },
  {
    id: "mint",
    name: "Mint",
    value: "#78d9c2",
    text: "#284f47",
  },
  {
    id: "lime",
    name: "Lime",
    value: "#a5dd65",
    text: "#3d5228",
  },
  {
    id: "lemon",
    name: "Lemon",
    value: "#f4d95c",
    text: "#5a4d21",
  },
  {
    id: "amber",
    name: "Amber",
    value: "#f0b34f",
    text: "#5a421f",
  },
  {
    id: "coral",
    name: "Coral",
    value: "#ff786d",
    text: "#5c3230",
  },
  {
    id: "rose",
    name: "Rose",
    value: "#ea6aa3",
    text: "#573041",
  },
  {
    id: "violet",
    name: "Violet",
    value: "#a99af4",
    text: "#393253",
  },
  {
    id: "plum",
    name: "Plum",
    value: "#7d5bd6",
    text: "#32264e",
  },
  {
    id: "slate",
    name: "Slate",
    value: "#7f9db8",
    text: "#2f3f4c",
  },
  {
    id: "graphite",
    name: "Graphite",
    value: "#5d6773",
    text: "#252b31",
  },
];

export const DIFFICULTY_OPTIONS = [
  {
    id: GAME_DIFFICULTIES.EASY,
    label: "Easy",
    description: "Gentler flow. Small surface movement.",
  },
  {
    id: GAME_DIFFICULTIES.NORMAL,
    label: "Normal",
    description: "Balanced speed with clear wave motion.",
  },
  {
    id: GAME_DIFFICULTIES.HARD,
    label: "Hard",
    description: "Fast fill. Heavy waves and sharper timing.",
  },
];

export const DEFAULT_DIFFICULTY_ID = GAME_DIFFICULTIES.NORMAL;

export const GAME_MODE_OPTIONS = [
  {
    id: GAME_RULE_MODES.CLASSIC,
    label: "Classic",
    description: "One hold. Release locks the level.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.BLIND,
    label: "Blind",
    description: "No target line. Trust the goal percentage.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.FLASH,
    label: "Flash",
    description: "The line flashes briefly. Five seconds to chase it.",
    roundDurationMs: TIMED_ROUND_MS,
  },
  {
    id: GAME_RULE_MODES.FAKE_TARGET,
    label: "Fake Target",
    description: "Two target lines. One is a trap.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.INVERT,
    label: "Invert",
    description: "Classic timing with the water flipped upside down.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.REVERSE_POUR,
    label: "Draining",
    description: "Start full. Hold to drain down.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.LEAKY,
    label: "Leaky",
    description: "Release leaks. Hold the level for five seconds.",
    roundDurationMs: LEAKY_ROUND_MS,
  },
  {
    id: GAME_RULE_MODES.TILT,
    label: "Tilt",
    description: "Gravity leans. Read the slanted water line.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.CHAOS_QUEUE,
    label: "Chaos Queue",
    description: "A random rule appears before every round.",
  },
  {
    id: GAME_RULE_MODES.SPLIT_FILL,
    label: "Split Fill",
    description: "Two tanks. Two targets. One release.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.PERFECT_OR_NOTHING,
    label: "All or Nothing",
    description: "Hit the narrow zone for everything, miss it for nothing.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.BAND_RUN,
    label: "Band Run",
    description: "Two to five target bands. One touch for each.",
  },
  {
    id: GAME_RULE_MODES.CHARGE_POUR,
    label: "Pressure Charge",
    description: "Hold to charge. Release a stronger pour from above.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.BURST_CLICK,
    label: "Burst Click",
    description: "Spam quick taps to build a steady timed flow.",
    roundDurationMs: TIMED_ROUND_MS,
  },
  {
    id: GAME_RULE_MODES.COLORBLIND,
    label: "Colorblind",
    description: "Classic timing in strict black and white.",
    oneHold: true,
  },
];

export const DEFAULT_GAME_MODE_ID = GAME_RULE_MODES.CLASSIC;

export const WATER_COLOR_STORAGE_KEY = "pourcision-water-color";
export const THEME_STORAGE_KEY = "pourcision-theme";
export const SOUND_STORAGE_KEY = "pourcision-sound";
export const FULLSCREEN_STORAGE_KEY = "pourcision-fullscreen-mode";
export { LANGUAGE_STORAGE_KEY } from "@/lib/i18n";
