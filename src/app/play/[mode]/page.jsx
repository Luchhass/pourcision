import HomeScreen from "@/components/sections/home/HomeScreen";
import {
  GAME_DIFFICULTIES,
  GAME_ROUND_COUNT,
  GAME_RULE_MODES,
  MENU_MODES,
  ROUND_COUNT_OPTIONS,
  ROUTES,
  WATER_COLORS,
} from "@/lib/constants";
import { createPageMetadata } from "@/lib/seo";

function pickValid(value, fallback, source) {
  return Object.values(source).includes(value) ? value : fallback;
}

function pickWaterColor(value) {
  return WATER_COLORS.some((color) => color.id === value)
    ? value
    : WATER_COLORS[0].id;
}

function pickRoundCount(value) {
  const roundCount = Number(value);
  return Number.isInteger(roundCount) && ROUND_COUNT_OPTIONS.includes(roundCount)
    ? roundCount
    : GAME_ROUND_COUNT;
}

function pickSeed(value, fallbackParts) {
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 96);
  }

  return fallbackParts.join(":");
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const mode = pickValid(
    resolvedParams?.mode,
    MENU_MODES.SINGLEPLAYER,
    MENU_MODES,
  );

  return createPageMetadata(
    mode === MENU_MODES.MULTIPLAYER ? "multiplayer" : "singleplayer",
  );
}

export default async function PlayPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const mode = pickValid(
    resolvedParams?.mode,
    MENU_MODES.SINGLEPLAYER,
    MENU_MODES,
  );
  const route =
    mode === MENU_MODES.MULTIPLAYER ? ROUTES.MULTIPLAYER : ROUTES.SINGLEPLAYER;
  const difficulty = pickValid(
    resolvedSearchParams?.difficulty,
    GAME_DIFFICULTIES.NORMAL,
    GAME_DIFFICULTIES,
  );
  const ruleMode = pickValid(
    resolvedSearchParams?.gameMode,
    GAME_RULE_MODES.CLASSIC,
    GAME_RULE_MODES,
  );
  const waterColorId = pickWaterColor(resolvedSearchParams?.waterColor);
  const roundCount = pickRoundCount(
    resolvedSearchParams?.roundCount || resolvedSearchParams?.levels,
  );

  return (
    <HomeScreen
      initialMode={mode}
      initialSettings={{
        difficulty,
        mode,
        route,
        ruleMode,
        targetSeed: pickSeed(resolvedSearchParams?.seed, [
          mode,
          difficulty,
          ruleMode,
          roundCount,
          waterColorId,
        ]),
        roundCount,
        waterColorId,
      }}
      initialStep="gameplay"
    />
  );
}
