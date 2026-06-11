"use client";

import { useEffect, useRef } from "react";
import AppFooter from "@/components/layout/AppFooter";
import PageUtilitySwitches from "@/components/layout/PageUtilitySwitches";
import SectionWord from "@/components/layout/SectionWord";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useLanguage";
import { useScreenReveal } from "@/hooks/useScreenReveal";
import { GAME_MODE_OPTIONS, GAME_RULE_MODES, WATER_COLORS } from "@/lib/constants";
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
  mobileShort = false,
  ruleMode = GAME_RULE_MODES.CLASSIC,
  result,
  waterColor,
}) {
  const fillPercent = Math.max(0, Math.min(100, result.level));
  const targetPercent = Math.max(0, Math.min(100, result.target));

  return (
    <div
      className={[
        "relative overflow-hidden bg-[#f7f7f2]/96 shadow-[0_18px_38px_rgba(0,0,0,0.18)] dark:bg-[#f7f7f2]/10 dark:shadow-[0_20px_46px_rgba(0,0,0,0.3)]",
        mobileShort
          ? "h-[4.6rem] min-h-0 sm:h-[4.9rem] lg:aspect-square lg:h-auto lg:min-h-[5.5rem]"
          : [
              "aspect-square",
              compact ? "min-h-[4.4rem]" : "min-h-[5.5rem]",
            ].join(" "),
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0"
        style={{
          backgroundColor: waterColor.value,
          height: `${fillPercent}%`,
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 border-t-2 border-dashed border-[#0d0d0c]/45 dark:border-[#f7f7f2]/46"
        style={{ bottom: `${targetPercent}%` }}
      />
      {ruleMode === GAME_RULE_MODES.FAKE_TARGET && result.fakeTarget !== null ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 border-t-2 border-dashed border-[#ef2f25]/54 dark:border-[#f7f7f2]/30"
          style={{ bottom: `${Math.max(0, Math.min(100, result.fakeTarget))}%` }}
        />
      ) : null}
      {ruleMode === GAME_RULE_MODES.SPLIT_FILL ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-1/2 border-l border-[#0d0d0c]/22 dark:border-[#f7f7f2]/24"
        />
      ) : null}
      {ruleMode !== GAME_RULE_MODES.CLASSIC ? (
        <span className="pc-round-label absolute right-2 top-2 z-10 text-[#0d0d0c]/42 dark:text-[#f7f7f2]/42">
          {ruleMode === GAME_RULE_MODES.REVERSE_POUR
            ? "REV"
            : ruleMode === GAME_RULE_MODES.LEAKY
              ? "LEAK"
              : ruleMode === GAME_RULE_MODES.TILT
                ? "TILT"
                : ruleMode === GAME_RULE_MODES.FAKE_TARGET
                  ? "FAKE"
                  : ruleMode === GAME_RULE_MODES.SPLIT_FILL
                    ? "SPLIT"
                    : ruleMode === GAME_RULE_MODES.PERFECT_OR_NOTHING
                      ? "10/0"
                      : ruleMode === GAME_RULE_MODES.BLIND
                        ? "BLIND"
                        : ""}
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
    <div className="grid min-h-0 min-w-0 gap-5 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:none] lg:max-h-[16rem] [&::-webkit-scrollbar]:hidden">
      {players.map((player, index) => {
        const playerRounds = normalizeRounds(player.results || player.roundResults);
        const playerWaterColor = getWaterColorById(
          player.waterColorId,
          waterColor,
        );

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
                waterColor={waterColor}
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
  const { t } = useTranslation();
  const leaderboardPlayers = getLeaderboardPlayers(leaderboard);
  const currentLeaderboardPlayer =
    leaderboardPlayers.find((player) => player.id === currentPlayerId) ||
    leaderboardPlayers[0] ||
    null;
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
  const scoreMessage =
    totalScore >= 42
      ? t("results.assessment.excellent")
      : totalScore >= 30
        ? t("results.assessment.good")
        : totalScore >= 18
          ? t("results.assessment.learning")
          : t("results.assessment.retry");
  const resultsRevealRef = useRef(null);
  const playResultsExit = useScreenReveal(resultsRevealRef, [
    leaderboardPlayers.length,
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
    playFinalScore(totalScore, 50);
  }, [totalScore]);

  return (
    <div
      className="relative h-dvh min-h-dvh overflow-hidden bg-[#f7f7f2] text-[#0d0d0c] dark:bg-[#0d0d0c] dark:text-[#f7f7f2]"
      data-results-screen="true"
      ref={resultsRevealRef}
      style={{
        "--results-split-x": "50vw",
      }}
    >
      <PageUtilitySwitches placement="rail" />
      <main className="relative z-10 grid h-full min-h-0 w-full min-w-0 grid-rows-[auto_1fr]">
        <ResultsTitleBand onMenu={handleMenu} />

        <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-none lg:min-h-0 lg:grid-cols-[var(--results-split-x)_minmax(0,1fr)]">
          <section className="mx-auto grid w-full max-w-[44rem] content-start min-w-0 px-6 pb-8 pt-8 md:px-8 md:pb-10 md:pt-10 lg:mx-0 lg:max-w-none lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)] lg:content-stretch lg:px-10 lg:pb-10 lg:pt-16">
            <div data-screen-reveal="cream">
              <p
                className="pc-copy max-w-[40rem] overflow-hidden text-[#0d0d0c]/66 lg:max-w-[calc(50vw-5rem)] dark:text-[#f7f7f2]/68"
                data-screen-reveal-row="true"
              >
                <span className="block">{scoreMessage}</span>
              </p>
            </div>

            <div className="hidden">
              <ResultsPanel
                dark
                error={error}
                isPlayAgainDisabled={isReturningLobby}
                leaderboardPlayers={leaderboardPlayers}
                onMenu={onMenu}
                onPlayAgain={onPlayAgain}
                playAgainLabel={
                  isReturningLobby ? t("room.returningLobby") : playAgainLabel
                }
                rounds={rounds}
                ruleMode={settings?.ruleMode || GAME_RULE_MODES.CLASSIC}
                totalScore={totalScore}
                waterColor={waterColor}
              />
            </div>

            <div className="hidden min-h-0 grid-cols-[auto_minmax(0,1fr)] items-end gap-8 lg:grid">
              <div className="shrink-0">
                <div data-screen-reveal="cream">
                  <div className="overflow-hidden" data-screen-reveal-row="true">
                    <AppFooter />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="relative mx-auto grid w-full max-w-[44rem] min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-[#0d0d0c] px-6 pb-6 pt-6 md:px-8 md:pb-7 md:pt-7 lg:mx-0 lg:max-w-none lg:p-10 dark:bg-[#161616]"
            data-results-water="true"
            data-screen-reveal="water-bg"
          >
            <SectionWord
              desktopColorClass="text-[#f7f7f2] dark:text-[#f7f7f2]"
              mobileColorClass="text-[#f7f7f2] dark:text-[#f7f7f2]"
              primary={t("results.title")}
              secondary={t("results.run")}
            />
            <div className="grid h-full min-h-0 min-w-0 content-end justify-items-stretch pt-8 md:pt-10 lg:min-h-0 lg:justify-items-end lg:pt-0">
              <div
                className="w-full max-lg:h-full max-lg:min-h-0 lg:w-[82%] lg:min-w-[28rem] lg:max-w-[52rem]"
                data-results-panel="true"
                data-screen-reveal="water-content"
                data-screen-reveal-direction="down"
              >
                <ResultsPanel
                  dark
                  error={error}
                  isPlayAgainDisabled={isReturningLobby}
                  leaderboardPlayers={leaderboardPlayers}
                  onMenu={handleMenu}
                  onPlayAgain={handlePlayAgain}
                  playAgainLabel={
                    isReturningLobby ? t("room.returningLobby") : playAgainLabel
                  }
                  rounds={rounds}
                  ruleMode={settings?.ruleMode || GAME_RULE_MODES.CLASSIC}
                  totalScore={totalScore}
                  waterColor={waterColor}
                />
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
