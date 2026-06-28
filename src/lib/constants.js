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
  AUTO_RISE: "auto-rise",
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
export const CHAOS_BRIEFING_MS = 5000;
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
  GAME_RULE_MODES.COLORBLIND,
  GAME_RULE_MODES.AUTO_RISE,
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
  GAME_RULE_MODES.COLORBLIND,
  GAME_RULE_MODES.AUTO_RISE,
  GAME_RULE_MODES.TILT,
  GAME_RULE_MODES.CHAOS_QUEUE,
];

export const RANDOM_WATER_COLOR_ID = "random";

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
    id: RANDOM_WATER_COLOR_ID,
    name: "Random",
    value: "#d8d8d2",
    text: "#34342f",
    labelColor: "#5e5e57",
    isRandom: true,
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
  {
    id: "rgb",
    name: "RGB",
    value: "#7ce3ef",
    animated: true,
    background:
      "linear-gradient(120deg, #ff4f6d 0%, #ffca3a 16%, #8ac926 32%, #3ddcff 50%, #5271ff 68%, #b44cff 84%, #ff4f6d 100%)",
    stops: ["#ff4f6d", "#ffca3a", "#8ac926", "#3ddcff", "#5271ff", "#b44cff"],
    text: "#203042",
  },
  {
    id: "dream-pop",
    name: "Dream Pop",
    value: "#c9f3f7",
    animated: true,
    background:
      "linear-gradient(125deg, #f8fff6 0%, #c9f3f7 18%, #d9d2ff 38%, #ffd3ea 58%, #fff1c8 78%, #d8ffd7 100%)",
    stops: ["#f8fff6", "#c9f3f7", "#d9d2ff", "#ffd3ea", "#fff1c8", "#d8ffd7"],
    text: "#566073",
  },
  {
    id: "pink-violet",
    name: "Pink Violet",
    value: "#a64cf4",
    animated: true,
    background:
      "linear-gradient(115deg, #7257ff 0%, #854fff 20%, #9d48f4 40%, #b841e7 62%, #cb3dcc 80%, #d63d96 100%)",
    stops: ["#7257ff", "#854fff", "#9d48f4", "#b841e7", "#cb3dcc", "#d63d96"],
    text: "#20122f",
  },
  {
    id: "peach-glow",
    name: "Peach Glow",
    value: "#ffc2a6",
    animated: true,
    background:
      "linear-gradient(125deg, #ffe8dc 0%, #ffd1bd 20%, #ffad9f 42%, #ffc46f 64%, #ff8fb3 84%, #fff0cf 100%)",
    stops: ["#ffe8dc", "#ffd1bd", "#ffad9f", "#ffc46f", "#ff8fb3", "#fff0cf"],
    text: "#704333",
  },
  {
    id: "mermaid",
    name: "Mermaid",
    value: "#72eadf",
    animated: true,
    background:
      "linear-gradient(120deg, #92f6d6 0%, #57d9ef 24%, #4aa2ff 52%, #7cecf4 78%, #92f6d6 100%)",
    stops: ["#92f6d6", "#57d9ef", "#4aa2ff", "#7cecf4", "#92f6d6"],
    text: "#164c5c",
  },
  {
    id: "candy-luxe",
    name: "Candy Luxe",
    value: "#ff9bd8",
    animated: true,
    background:
      "linear-gradient(120deg, #ffc4ef 0%, #ff8ccf 24%, #a977ff 50%, #74e5ff 76%, #ffc4ef 100%)",
    stops: ["#ffc4ef", "#ff8ccf", "#a977ff", "#74e5ff", "#ffc4ef"],
    text: "#54365f",
  },
];

export const PLAYABLE_WATER_COLORS = WATER_COLORS.filter(
  (color) => !color.isRandom,
);

export const PREMIUM_WATER_COLOR_IDS = [
  "rgb",
  "dream-pop",
  "pink-violet",
  "peach-glow",
  "mermaid",
  "candy-luxe",
];

export const DEFAULT_WATER_COLORS = WATER_COLORS.filter(
  (color) => !PREMIUM_WATER_COLOR_IDS.includes(color.id),
);

export const DEFAULT_PLAYABLE_WATER_COLORS = DEFAULT_WATER_COLORS.filter(
  (color) => !color.isRandom,
);

export function getVisibleWaterColors(includePremium = false) {
  return includePremium ? WATER_COLORS : DEFAULT_WATER_COLORS;
}

export function getPlayableWaterColors(includePremium = false) {
  return includePremium ? PLAYABLE_WATER_COLORS : DEFAULT_PLAYABLE_WATER_COLORS;
}

export function resolveWaterColorId(value, options = {}) {
  if (value !== RANDOM_WATER_COLOR_ID) {
    return PLAYABLE_WATER_COLORS.some((color) => color.id === value)
      ? value
      : DEFAULT_PLAYABLE_WATER_COLORS[2]?.id ||
          DEFAULT_PLAYABLE_WATER_COLORS[0]?.id ||
          PLAYABLE_WATER_COLORS[0]?.id ||
          "red";
  }

  const excluded = new Set(options.excludeIds || []);
  const playableColors = getPlayableWaterColors(options.includePremiumColors);
  const availableColors = playableColors.filter(
    (color) => !excluded.has(color.id),
  );
  const colorPool = availableColors.length ? availableColors : playableColors;
  const randomIndex = Math.floor(Math.random() * colorPool.length);

  return (
    colorPool[randomIndex]?.id ||
    DEFAULT_PLAYABLE_WATER_COLORS[0]?.id ||
    PLAYABLE_WATER_COLORS[0]?.id ||
    "red"
  );
}

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
    label: "No Line",
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
    label: "Trap Line",
    description: "Two target lines. One is a trap.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.INVERT,
    label: "Upside Down",
    description: "Classic timing with the water flipped upside down.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.REVERSE_POUR,
    label: "Drain",
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
    label: "Rule Shuffle",
    description: "A random rule appears before every round.",
  },
  {
    id: GAME_RULE_MODES.SPLIT_FILL,
    label: "Dual Tank",
    description: "Two tanks. Two targets. One release.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.PERFECT_OR_NOTHING,
    label: "Strike Zone",
    description: "Hit the narrow zone for everything, miss it for nothing.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.BAND_RUN,
    label: "Band Chase",
    description: "Two to five target bands. One touch for each.",
  },
  {
    id: GAME_RULE_MODES.CHARGE_POUR,
    label: "Charged Pour",
    description: "Hold to charge. Release a stronger pour from above.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.COLORBLIND,
    label: "Blackout",
    description: "The screen fades to black one second after the round starts.",
    oneHold: true,
  },
  {
    id: GAME_RULE_MODES.AUTO_RISE,
    label: "Auto Rise",
    description: "Water rises from center. Touch once to stop it.",
    oneHold: true,
  },
];

export const DEFAULT_GAME_MODE_ID = GAME_RULE_MODES.CLASSIC;

export const WATER_COLOR_STORAGE_KEY = "pourcision-water-color";
export const THEME_STORAGE_KEY = "pourcision-theme";
export const SOUND_STORAGE_KEY = "pourcision-sound";
export const MUSIC_STORAGE_KEY = "pourcision-music";
export const FULLSCREEN_STORAGE_KEY = "pourcision-fullscreen-mode";
export { LANGUAGE_STORAGE_KEY } from "@/lib/i18n";
