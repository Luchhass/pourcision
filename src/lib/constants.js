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

export const GAME_ROUND_COUNT = 3;
export const ROUND_COUNT = GAME_ROUND_COUNT;
export const ROUND_COUNT_OPTIONS = [1, 3, 5, 10];
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
    value: "#9fd4f5",
    text: "#2e5368",
  },
  {
    id: "aqua",
    name: "Aqua",
    value: "#7ce3ef",
    text: "#255b64",
  },
  {
    id: "red",
    name: "Red",
    value: "#ff746d",
    text: "#61322f",
  },
  {
    id: "mint",
    name: "Mint",
    value: "#8fe4d1",
    text: "#2f5a51",
  },
  {
    id: "lime",
    name: "Lime",
    value: "#b8e978",
    text: "#465a2c",
  },
  {
    id: "lemon",
    name: "Lemon",
    value: "#f8e16d",
    text: "#5e5125",
  },
  {
    id: "amber",
    name: "Amber",
    value: "#f7c469",
    text: "#634a25",
  },
  {
    id: "coral",
    name: "Coral",
    value: "#ff9187",
    text: "#633936",
  },
  {
    id: "rose",
    name: "Rose",
    value: "#f27fb2",
    text: "#61344a",
  },
  {
    id: "violet",
    name: "Violet",
    value: "#b8a8f7",
    text: "#40375c",
  },
  {
    id: "plum",
    name: "Plum",
    value: "#aa86ea",
    text: "#44335d",
  },
  {
    id: "peach",
    name: "Peach",
    value: "#ffb199",
    text: "#684334",
  },
  {
    id: "apricot",
    name: "Apricot",
    value: "#ffc96f",
    text: "#684d25",
  },
  {
    id: "butter",
    name: "Butter",
    value: "#f6ed91",
    text: "#5c562d",
  },
  {
    id: "sage",
    name: "Sage",
    value: "#b9dea3",
    text: "#435637",
  },
  {
    id: "seafoam",
    name: "Seafoam",
    value: "#a7eadc",
    text: "#365d55",
  },
  {
    id: "lagoon",
    name: "Lagoon",
    value: "#8fddea",
    text: "#315862",
  },
  {
    id: "lilac",
    name: "Lilac",
    value: "#c7b7f5",
    text: "#4d4165",
  },
  {
    id: "orchid",
    name: "Orchid",
    value: "#dfa2ee",
    text: "#5d3d65",
  },
  {
    id: "bubblegum",
    name: "Bubblegum",
    value: "#f7a4c9",
    text: "#663d50",
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

export const DEFAULT_DIFFICULTY_ID = GAME_DIFFICULTIES.EASY;

export const GAME_MODE_OPTIONS = [
  {
    id: GAME_RULE_MODES.CLASSIC,
    label: "Classic",
    description: "One hold. Release locks the level.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.BLIND,
    label: "No Guide",
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
    label: "Blind",
    description: "The screen fades to black one second after the round starts.",
    oneHold: true,
  },
];

export const DEFAULT_GAME_MODE_ID = GAME_RULE_MODES.CLASSIC;

export const WATER_COLOR_STORAGE_KEY = "pourcision-water-color";
export const THEME_STORAGE_KEY = "pourcision-theme";
export const SOUND_STORAGE_KEY = "pourcision-sound";
export const FULLSCREEN_STORAGE_KEY = "pourcision-fullscreen-mode";
export { LANGUAGE_STORAGE_KEY } from "@/lib/i18n";
