"use client";

import { useEffect, useRef } from "react";
import PageUtilitySwitches from "@/components/layout/PageUtilitySwitches";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useLanguage";
import { useScreenReveal } from "@/hooks/useScreenReveal";
import {
  GAME_MODE_OPTIONS,
  GAME_RULE_MODES,
  PERFECT_ZONE_RADIUS,
  WATER_COLORS,
} from "@/lib/constants";
import { getRoundScore } from "@/lib/scoring";
import { playFinalScore } from "@/lib/sound";

function formatRoundNumber(value) {
  return String(value).padStart(2, "0");
}

function formatScore(value) {
  if (value === null || value === undefined) {
    return "--";
  }

  return Number(value).toFixed(2);
}

function getRoundModeTag(ruleMode) {
  const tags = {
    [GAME_RULE_MODES.REVERSE_POUR]: "DRAIN",
    [GAME_RULE_MODES.LEAKY]: "LEAK",
    [GAME_RULE_MODES.INVERT]: "INV",
    [GAME_RULE_MODES.TILT]: "TILT",
    [GAME_RULE_MODES.FAKE_TARGET]: "FAKE",
    [GAME_RULE_MODES.SPLIT_FILL]: "SPLIT",
    [GAME_RULE_MODES.PERFECT_OR_NOTHING]: "ALL/0",
    [GAME_RULE_MODES.BAND_RUN]: "BAND",
    [GAME_RULE_MODES.CHARGE_POUR]: "PRESS",
    [GAME_RULE_MODES.BURST_CLICK]: "BURST",
    [GAME_RULE_MODES.COLORBLIND]: "BLIND",
    [GAME_RULE_MODES.FLASH]: "FLASH",
    [GAME_RULE_MODES.BLIND]: "BLIND",
  };

  return tags[ruleMode] ?? "";
}

function getLeaderboardPlayers(leaderboard) {
  if (!leaderboard) return [];
  if (Array.isArray(leaderboard.players)) return leaderboard.players;
  if (Array.isArray(leaderboard.leaderboard)) return leaderboard.leaderboard;
  if (Array.isArray(leaderboard.leaderboard?.players)) {
    return leaderboard.leaderboard.players;
  }

  return [];
}

function normalizeRounds(results = []) {
  return results.map((result) => ({
    ...result,
    round:
      result.round ??
      (Number.isFinite(result.roundIndex) ? result.roundIndex + 1 : 1),
    score:
      result.score !== undefined && result.score <= 10
        ? result.score
        : getRoundScore(result.diff),
  }));
}

function getWaterColorById(waterColorId, fallback) {
  return (
    WATER_COLORS.find((color) => color.id === waterColorId) ||
    fallback ||
    WATER_COLORS[0]
  );
}

function hexToRgb(hex) {
  const cleanHex = String(hex || "").replace("#", "");
  if (cleanHex.length !== 6) return null;

  const value = Number.parseInt(cleanHex, 16);
  if (!Number.isFinite(value)) return null;

  return {
    b: value & 255,
    g: (value >> 8) & 255,
    r: (value >> 16) & 255,
  };
}

function getReadableInkColor(colorValue) {
  const rgb = hexToRgb(colorValue);
  if (!rgb) return "#0d0d0c";

  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;

  return luminance > 0.54 ? "#0d0d0c" : "#f7f7f2";
}

function clampPercent(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(0, Math.min(100, parsed));
}

function clampTilt(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(-1, Math.min(1, parsed));
}

function getResultRuleMode(result, fallbackRuleMode) {
  return (
    result?.ruleMode ||
    result?.gameMode ||
    result?.mode ||
    fallbackRuleMode ||
    GAME_RULE_MODES.CLASSIC
  );
}

function getPercentPair(values, fallback) {
  if (!Array.isArray(values) || values.length < 2) {
    return [fallback, fallback];
  }

  return [clampPercent(values[0], fallback), clampPercent(values[1], fallback)];
}

function getPercentList(values) {
  if (!Array.isArray(values)) return [];

  return values.map((value) => clampPercent(value));
}

function ResultsTitleBand({ onMenu }) {
  const { t } = useTranslation();
  const titleText = t("results.title");

  return (
    <section
      className="pc-title-band relative min-w-0 overflow-hidden px-6 py-6 pr-16 [--results-pad:1.5rem] [--reverse-width:min(54vw,26rem)] md:px-8 md:py-8 md:pr-20 md:[--results-pad:2rem] lg:px-10 lg:py-10 lg:pr-10 lg:[--results-pad:2.5rem] lg:[--reverse-width:var(--results-split-x)]"
      data-results-title="true"
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[var(--reverse-width)] bg-[#0d0d0c] dark:bg-[#161616]"
        data-results-title-fill="true"
      />

      <div
        className="pc-title-stack relative z-10 min-w-0"
        data-screen-reveal="title"
        style={{ "--pc-title-length": titleText.length }}
      >
        <h1
          className="pc-page-title pc-page-title-fit text-[#0d0d0c] dark:text-[#f7f7f2]"
        >
          {titleText}
        </h1>
        <h1
          aria-hidden="true"
          className="pc-page-title pc-page-title-fit pointer-events-none absolute inset-x-0 top-0 overflow-hidden text-[#f7f7f2] [clip-path:inset(0_calc(100%_-_(var(--reverse-width)_-_var(--results-pad)))_0_0)] dark:text-[#f7f7f2]"
        >
          {titleText}
        </h1>
      </div>
      <button
        aria-label={t("common.mainMenu")}
        className="pc-icon-button fixed right-3 top-3 z-[60] grid place-items-center text-[#0d0d0c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] md:right-4 md:top-4 dark:text-[#f7f7f2] dark:focus-visible:outline-[#f7f7f2]"
        onClick={onMenu}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="pc-icon"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </section>
  );
}

function ScoreBlock({
  compact = false,
  dark = false,
  fitMobile = false,
  score,
}) {
  return (
    <div className={dark ? "min-w-0 text-[#f7f7f2]" : "min-w-0 text-[#0d0d0c] dark:text-[#f7f7f2]"}>
      <p
        className={[
          "pc-result-score",
          compact ? "pc-result-score-compact" : "",
          fitMobile ? "pc-result-score-fit-mobile" : "",
        ].join(" ")}
      >
        {formatScore(score)}
        <span
          className={[
            "pc-score-denominator ml-2",
            dark ? "text-[#f7f7f2]/52" : "text-[#0d0d0c]/48",
          ].join(" ")}
        >
          / 50
        </span>
      </p>
    </div>
  );
}

function PlayerResultHeader({
  dark = false,
  index,
  player,
  waterColor,
}) {
  const inkColor = getReadableInkColor(waterColor?.value);

  return (
    <div
      className={[
        "pc-player-row grid min-h-12 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3",
        "border transition-[box-shadow,transform] duration-200",
      ].join(" ")}
      style={{
        backgroundColor: waterColor?.value || "#f7f7f2",
        borderColor: dark ? "rgba(247,247,242,0.18)" : "rgba(13,13,12,0.16)",
        boxShadow: dark
          ? "0 14px 30px rgba(0,0,0,0.24)"
          : "0 14px 30px rgba(13,13,12,0.08)",
        color: inkColor,
      }}
    >
      <span className="pc-round-value">{player.rank ?? index + 1}.</span>
      <span className="min-w-0 truncate">{player.name || player.playerName}</span>
      <span className="pc-round-value">
        {formatScore(player.score ?? player.totalScore)}
      </span>
    </div>
  );
}

function RoundCard({
  compact = false,
  leaderboardDense = false,
  mobileShort = false,
  ruleMode = GAME_RULE_MODES.CLASSIC,
  result,
  waterColor,
}) {
  const effectiveRuleMode = getResultRuleMode(result, ruleMode);
  const isBandRun = effectiveRuleMode === GAME_RULE_MODES.BAND_RUN;
  const isBlind = effectiveRuleMode === GAME_RULE_MODES.BLIND;
  const isBurstClick = effectiveRuleMode === GAME_RULE_MODES.BURST_CLICK;
  const isChargePour = effectiveRuleMode === GAME_RULE_MODES.CHARGE_POUR;
  const isFakeTarget = effectiveRuleMode === GAME_RULE_MODES.FAKE_TARGET;
  const isFlash = effectiveRuleMode === GAME_RULE_MODES.FLASH;
  const isInvert = effectiveRuleMode === GAME_RULE_MODES.INVERT;
  const isLeaky = effectiveRuleMode === GAME_RULE_MODES.LEAKY;
  const isPerfectZone =
    effectiveRuleMode === GAME_RULE_MODES.PERFECT_OR_NOTHING;
  const isReversePour = effectiveRuleMode === GAME_RULE_MODES.REVERSE_POUR;
  const isSplitFill = effectiveRuleMode === GAME_RULE_MODES.SPLIT_FILL;
  const isTilt = effectiveRuleMode === GAME_RULE_MODES.TILT;
  const cardWaterColor = waterColor || WATER_COLORS[0];
  const fillPercent = clampPercent(result.level);
  const targetPercent = clampPercent(result.target);
  const fakeTargetPercent = clampPercent(result.fakeTarget, targetPercent);
  const bandTargets = getPercentList(result.bandTargets);
  const bandLevels = getPercentList(result.bandLevels);
  const splitLevels = getPercentPair(result.splitLevels, fillPercent);
  const splitTargets = getPercentPair(result.splitTargets, targetPercent);
  const zoneStart = clampPercent(targetPercent - PERFECT_ZONE_RADIUS);
  const zoneEnd = clampPercent(targetPercent + PERFECT_ZONE_RADIUS);
  const zoneHeight = Math.max(5, zoneEnd - zoneStart);
  const tiltValue = isTilt ? clampTilt(result.tilt, -0.5) : 0;
  const tiltDegrees = Math.max(-7, Math.min(7, tiltValue * 7));
  const tiltSpread = tiltValue * 8;
  const tiltSurfaceY = 100 - fillPercent;
  const tiltSurfaceLeft = clampPercent(tiltSurfaceY - tiltSpread);
  const tiltSurfaceRight = clampPercent(tiltSurfaceY + tiltSpread);
  const drainDipY = 100 - fillPercent;
  const waterPosition = isInvert
    ? { height: `${fillPercent}%`, top: 0 }
    : isReversePour
      ? {
          inset: 0,
          clipPath: `polygon(0 ${100 - fillPercent}%, 37% ${100 - fillPercent}%, 50% ${Math.min(100, drainDipY + 12)}%, 63% ${100 - fillPercent}%, 100% ${100 - fillPercent}%, 100% 100%, 0 100%)`,
        }
    : isTilt
      ? {
          inset: 0,
          clipPath: `polygon(0 ${tiltSurfaceLeft}%, 100% ${tiltSurfaceRight}%, 100% 100%, 0 100%)`,
        }
    : { bottom: 0, height: `${fillPercent}%` };
  const targetPosition = isInvert
    ? { top: `${targetPercent}%` }
    : { bottom: `${targetPercent}%` };
  const targetTiltStyle = isTilt
    ? { transform: `rotate(${tiltDegrees}deg)` }
    : {};
  const guideBaseClass = [
    "absolute z-[4] border-t-2 border-dashed",
    "border-[#0d0d0c]/45 dark:border-[#f7f7f2]/46",
    isTilt ? "left-[-10%] w-[120%] origin-center" : "inset-x-0",
  ].join(" ");
  const waterTexture = {};
  const showStandardTarget =
    !isBandRun &&
    !isBlind &&
    !isFlash &&
    !isPerfectZone &&
    !isSplitFill;

  return (
    <div
      className={[
        "relative overflow-hidden bg-[#f7f7f2]/96 shadow-[0_18px_38px_rgba(0,0,0,0.18)] dark:bg-[#f7f7f2]/10 dark:shadow-[0_20px_46px_rgba(0,0,0,0.3)]",
        leaderboardDense
          ? "aspect-square min-h-[4.4rem] md:min-h-[5rem] lg:min-h-[5.4rem]"
          : mobileShort
            ? "h-[4.6rem] min-h-0 sm:h-[4.9rem] md:aspect-square md:h-auto md:min-h-[5.5rem]"
            : [
                "aspect-square",
                compact ? "min-h-[4.4rem]" : "min-h-[5.5rem]",
              ].join(" "),
      ].join(" ")}
    >
      {isSplitFill ? (
        <>
          {splitLevels.map((level, index) => (
            <span
              aria-hidden="true"
              className={[
                "absolute bottom-0 z-[1] w-1/2",
                index === 0 ? "left-0" : "right-0",
              ].join(" ")}
              key={`split-water-${index}`}
              style={{
                backgroundColor: cardWaterColor.value,
                height: `${level}%`,
              }}
            />
          ))}
          {splitTargets.map((splitTarget, index) => (
            <span
              aria-hidden="true"
              className={[
                "absolute z-[4] w-1/2 border-t-2 border-dashed border-[#0d0d0c]/45 dark:border-[#f7f7f2]/46",
                index === 0 ? "left-0" : "right-0",
              ].join(" ")}
              key={`split-target-${index}`}
              style={{ bottom: `${splitTarget}%` }}
            />
          ))}
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-1/2 z-[5] border-l border-[#0d0d0c]/22 dark:border-[#f7f7f2]/24"
          />
        </>
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 z-[1]"
          style={{
            backgroundColor: cardWaterColor.value,
            ...waterPosition,
            ...waterTexture,
          }}
        />
      )}
      {showStandardTarget ? (
        <span
          aria-hidden="true"
          className={guideBaseClass}
          style={{ ...targetPosition, ...targetTiltStyle }}
        />
      ) : null}
      {isBandRun
        ? bandTargets.map((bandTarget, index) => (
            <span
              aria-hidden="true"
              className="absolute inset-x-0 z-[4] border-t-2 border-dashed border-[#0d0d0c]/42 dark:border-[#f7f7f2]/44"
              key={`${bandTarget}-${index}`}
              style={{ bottom: `${bandTarget}%` }}
            />
          ))
        : null}
      {isFakeTarget && result.fakeTarget !== null ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 z-[4] border-t-2 border-dashed border-[#ef2f25]/54 dark:border-[#f7f7f2]/30"
          style={{ bottom: `${fakeTargetPercent}%` }}
        />
      ) : null}
      {isPerfectZone ? (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-x-0 z-[4] border-y border-[#0d0d0c]/58 bg-[#0d0d0c]/[0.055] dark:border-[#f7f7f2]/58 dark:bg-[#f7f7f2]/[0.08]"
            style={{
              bottom: `${zoneStart}%`,
              height: `${zoneHeight}%`,
            }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-0 z-[5] border-t border-dashed border-[#0d0d0c]/38 dark:border-[#f7f7f2]/40"
            style={{ bottom: `${targetPercent}%` }}
          />
        </>
      ) : null}
      {isChargePour ? (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-0 z-[4] h-[48%] w-2.5 -translate-x-1/2 sm:w-3"
          style={{ backgroundColor: cardWaterColor.value, opacity: 0.72 }}
        />
      ) : null}
      {effectiveRuleMode !== GAME_RULE_MODES.CLASSIC ? (
        <span className="pc-round-label absolute right-2 top-2 z-10 text-[#0d0d0c]/42 dark:text-[#f7f7f2]/42">
          {getRoundModeTag(effectiveRuleMode)}
        </span>
      ) : null}
      <div className="relative z-10 flex h-full flex-col justify-between p-2 sm:p-3">
        <span className="pc-round-label text-[#0d0d0c]/52 dark:text-[#f7f7f2]/58">
          {formatRoundNumber(result.round)}
        </span>
        <span
          className="pc-round-value text-[#0d0d0c] dark:text-[#f7f7f2]"
        >
          {formatScore(result.score)}
        </span>
      </div>
    </div>
  );
}

function LeaderboardResultsList({
  dark = false,
  players = [],
  ruleMode = GAME_RULE_MODES.CLASSIC,
  waterColor,
}) {
  if (!players.length) return null;

  return (
    <div
      className="grid h-full min-h-0 min-w-0 content-start gap-4 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:none] md:gap-5 [&::-webkit-scrollbar]:hidden"
      data-screen-reveal-row="true"
      data-screen-reveal-target="children"
    >
      {players.map((player, index) => {
        const playerRounds = normalizeRounds(player.results || player.roundResults);
        const playerWaterColor = getWaterColorById(player.waterColorId, waterColor);

        return (
          <section
            className="grid min-w-0 gap-2"
            key={player.id || `${player.name}-${index}`}
          >
            <PlayerResultHeader
              dark={dark}
              index={index}
              player={player}
              waterColor={playerWaterColor}
            />
            {playerRounds.length ? (
              <div className="grid min-w-0 grid-cols-5 gap-1.5 sm:gap-2">
                {playerRounds.map((result) => (
                  <RoundCard
                    compact
                    key={`${player.id || player.name}-${result.round}`}
                    leaderboardDense
                    result={result}
                    ruleMode={ruleMode}
                    waterColor={playerWaterColor}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function ResultsPanel({
  dark = false,
  error = "",
  isPlayAgainDisabled = false,
  leaderboardPlayers = [],
  onMenu,
  onPlayAgain,
  playAgainLabel = null,
  ruleMode = GAME_RULE_MODES.CLASSIC,
  rounds,
  totalScore,
  waterColor,
}) {
  const { t } = useTranslation();
  const hasLeaderboard = leaderboardPlayers.length > 0;
  const isSingleResult = !hasLeaderboard;
  const modeOption =
    GAME_MODE_OPTIONS.find((option) => option.id === ruleMode) ||
    GAME_MODE_OPTIONS[0];
  const displayWaterColor = waterColor;

  return (
    <div
      className={[
        "grid min-w-0",
        hasLeaderboard
          ? "gap-5 max-lg:h-full max-lg:min-h-0 max-lg:grid-rows-[auto_minmax(0,1fr)_auto]"
          : "gap-5 max-lg:h-full max-lg:min-h-0 max-lg:content-end max-lg:gap-3 max-lg:overflow-y-auto max-lg:overscroll-contain max-lg:pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      ].join(" ")}
    >
      <ScoreBlock
        compact={hasLeaderboard}
        dark={dark}
        fitMobile={isSingleResult}
        score={totalScore}
      />
      <div className="pc-label -mt-2 text-[#f7f7f2]/48">
        {t(`modes.${modeOption.id}.label`)}
      </div>

      {hasLeaderboard ? (
        <LeaderboardResultsList
          dark={dark}
          players={leaderboardPlayers}
          ruleMode={ruleMode}
          waterColor={waterColor}
        />
      ) : (
        <div className="min-h-0 min-w-0 overflow-hidden">
          <div className="grid min-h-0 grid-cols-5 gap-1.5 pb-0 sm:gap-2 lg:gap-3">
            {rounds.map((result) => (
              <RoundCard
                key={result.round}
                mobileShort
                result={result}
                ruleMode={ruleMode}
                waterColor={displayWaterColor}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Button
          className={[
            "rounded-none px-3 lg:px-6",
            dark
              ? "border-0 !bg-[#f7f7f2] !text-[#0d0d0c] shadow-[0_18px_42px_rgba(247,247,242,0.08)] hover:!bg-white dark:!bg-[#f7f7f2] dark:!text-[#0d0d0c]"
              : "shadow-[0_18px_42px_rgba(13,13,12,0.12)]",
          ].join(" ")}
          onClick={onPlayAgain}
          variant={dark ? "secondary" : "primary"}
          disabled={isPlayAgainDisabled}
        >
          {playAgainLabel || t("common.playAgain")}
        </Button>
        <Button
          className={[
            "rounded-none px-3 lg:px-6",
            dark
              ? "border-0 bg-[#f7f7f2] text-[#0d0d0c] shadow-[0_18px_42px_rgba(247,247,242,0.08)] hover:bg-white dark:bg-[#f7f7f2]/10 dark:text-[#f7f7f2]"
              : "shadow-[0_18px_42px_rgba(13,13,12,0.08)]",
          ].join(" ")}
          onClick={onMenu}
          variant="secondary"
        >
          {t("common.mainMenu")}
        </Button>
      </div>
      {error ? (
        <p
          className={[
            "pc-copy-strong",
            dark ? "text-[#f7f7f2]/72" : "text-[#ef2f25]",
          ].join(" ")}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function UniversalResultsScreen({
  error = "",
  isReturningLobby = false,
  leaderboardPlayers = [],
  onMenu,
  onPlayAgain,
  playAgainLabel = null,
  ruleMode = GAME_RULE_MODES.CLASSIC,
  rounds = [],
  scoreMessage,
  totalScore,
  waterColor,
}) {
  const { t } = useTranslation();
  const hasLeaderboard = leaderboardPlayers.length > 0;
  const displayWaterColor = waterColor;

  return (
    <div
      className="relative h-dvh min-h-dvh overflow-hidden bg-[#0d0d0c] text-[#f7f7f2]"
      data-results-screen="true"
    >
      <PageUtilitySwitches placement="rail" tone="cream" />
      <button
        aria-label={t("common.mainMenu")}
        className="pc-icon-button fixed right-3 top-3 z-[60] grid place-items-center text-[#f7f7f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f7f2] md:right-4 md:top-4"
        onClick={onMenu}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="pc-icon"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      <main className="flex h-full min-h-0 w-full flex-col px-6 pb-6 pt-8 md:px-8 md:pb-8 md:pt-10 lg:px-10 lg:pb-10 lg:pt-10">
        <div className="grid min-w-0 content-start gap-6 md:max-w-[46rem] md:gap-7 lg:max-w-[54rem]">
          <div
            className="min-w-0 overflow-hidden"
            data-screen-reveal="title"
          >
            <h1 className="pc-page-title text-[#f7f7f2]">
              {t("results.title")}
            </h1>
          </div>

          <div
            className="grid min-w-0 gap-8 md:gap-10"
            data-screen-reveal="cream"
          >
            <p
              className="pc-copy max-w-[calc(100vw-7rem)] overflow-hidden text-[#f7f7f2]/68 md:max-w-[40rem]"
              data-screen-reveal-row="true"
            >
              <span className="block">{scoreMessage}</span>
            </p>
            <div
              data-screen-reveal-row="true"
              data-screen-reveal-target="self"
            >
              <ScoreBlock dark score={totalScore} />
            </div>
          </div>
        </div>

        <div
          className={[
            "mt-3 min-h-0 min-w-0 md:mt-4",
            hasLeaderboard
              ? "flex-1 overflow-hidden md:max-w-[60rem] lg:max-w-[68rem]"
              : "overflow-visible md:max-w-[46rem] lg:max-w-[54rem]",
          ].join(" ")}
          data-screen-reveal="cream"
        >
          {hasLeaderboard ? (
            <LeaderboardResultsList
              dark
              players={leaderboardPlayers}
              ruleMode={ruleMode}
              waterColor={waterColor}
            />
          ) : (
            <div
              className="grid min-h-0 min-w-0 grid-cols-5 gap-1.5 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden"
              data-screen-reveal-row="true"
              data-screen-reveal-target="children"
            >
              {rounds.map((result) => (
                <RoundCard
                  key={result.round}
                  mobileShort
                  result={result}
                  ruleMode={ruleMode}
                  waterColor={displayWaterColor}
                />
              ))}
            </div>
          )}
        </div>

        <div
          className={[
            "mt-auto grid grid-cols-2 gap-3 pt-5 md:gap-4 md:pt-6",
            hasLeaderboard
              ? "md:max-w-[60rem] lg:max-w-[68rem]"
              : "md:max-w-[46rem] lg:max-w-[54rem]",
          ].join(" ")}
          data-screen-reveal="cream"
          data-screen-reveal-row="true"
          data-screen-reveal-target="children"
        >
          <Button
            className="rounded-none border-0 !bg-[#f7f7f2] px-3 !text-[#0d0d0c] shadow-[0_18px_42px_rgba(247,247,242,0.08)] hover:!bg-white"
            disabled={isReturningLobby}
            onClick={onPlayAgain}
            variant="secondary"
          >
            {isReturningLobby
              ? t("room.returningLobby")
              : playAgainLabel || t("common.playAgain")}
          </Button>
          <Button
            className="rounded-none border-0 bg-[#f7f7f2]/44 px-3 text-[#0d0d0c] shadow-[0_18px_42px_rgba(247,247,242,0.08)] hover:bg-[#f7f7f2]/58"
            onClick={onMenu}
            variant="secondary"
          >
            {t("common.mainMenu")}
          </Button>
        </div>

        {error ? (
          <div data-screen-reveal="cream">
            <p
              className="pc-copy-strong text-[#f7f7f2]/72"
              data-screen-reveal-row="true"
            >
              {error}
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default function ScoreboardScreen({
  currentPlayerId = null,
  error = "",
  isReturningLobby = false,
  leaderboard = null,
  onMenu,
  onPlayAgain,
  playAgainLabel = null,
  results,
  settings,
}) {
  const { locale, t } = useTranslation();
  const leaderboardPlayers = getLeaderboardPlayers(leaderboard);
  const currentLeaderboardPlayer =
    leaderboardPlayers.find((player) => player.id === currentPlayerId) ||
    leaderboardPlayers[0] ||
    null;
  const topLeaderboardPlayer = leaderboardPlayers[0] || null;
  const waterColor =
    WATER_COLORS.find(
      (color) =>
        color.id ===
        (currentLeaderboardPlayer?.waterColorId || settings?.waterColorId),
    ) ??
    WATER_COLORS[0];
  const sourceResults = currentLeaderboardPlayer?.results || results || [];
  const rounds = normalizeRounds(sourceResults);
  const totalScore =
    currentLeaderboardPlayer?.score ??
    currentLeaderboardPlayer?.totalScore ??
    rounds.reduce((total, result) => total + result.score, 0);
  const topTotalScore =
    topLeaderboardPlayer?.score ??
    topLeaderboardPlayer?.totalScore ??
    totalScore;
  const getScoreMessage = (score) =>
    score >= 42
      ? t("results.assessment.excellent")
      : score >= 30
        ? t("results.assessment.good")
        : score >= 18
          ? t("results.assessment.learning")
          : t("results.assessment.retry");
  const displayTotalScore = topLeaderboardPlayer ? topTotalScore : totalScore;
  const scoreMessage = getScoreMessage(displayTotalScore);
  const resultsRevealRef = useRef(null);
  const playResultsExit = useScreenReveal(resultsRevealRef, [
    leaderboardPlayers.length,
    locale,
    rounds.length,
    scoreMessage,
    settings?.ruleMode,
    totalScore,
  ]);

  const handleMenu = async () => {
    await playResultsExit();
    onMenu?.();
  };

  const handlePlayAgain = async () => {
    await playResultsExit();
    onPlayAgain?.();
  };

  useEffect(() => {
    playFinalScore(displayTotalScore, 50);
  }, [displayTotalScore]);

  return (
    <div ref={resultsRevealRef}>
      <UniversalResultsScreen
        error={error}
        isReturningLobby={isReturningLobby}
        leaderboardPlayers={leaderboardPlayers}
        onMenu={handleMenu}
        onPlayAgain={handlePlayAgain}
        playAgainLabel={isReturningLobby ? t("room.returningLobby") : playAgainLabel}
        rounds={rounds}
        ruleMode={settings?.ruleMode || GAME_RULE_MODES.CLASSIC}
        scoreMessage={scoreMessage}
        totalScore={displayTotalScore}
        waterColor={waterColor}
      />
    </div>
  );
}
