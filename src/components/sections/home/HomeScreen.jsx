"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AppFooter from "@/components/layout/AppFooter";
import PageUtilitySwitches from "@/components/layout/PageUtilitySwitches";
import SectionWord from "@/components/layout/SectionWord";
import Button from "@/components/ui/Button";
import WaterColorWipe from "@/components/ui/WaterColorWipe";
import ModeSelectCard from "@/components/sections/home/ModeSelectCard";
import GameplayScreen from "@/components/sections/gameplay/GameplayScreen";
import ScoreboardScreen from "@/components/sections/scoreboard/ScoreboardScreen";
import GameSetupScreen from "@/components/sections/setup/GameSetupScreen";
import { useTranslation } from "@/hooks/useLanguage";
import { createPlayerId, saveRoomSession } from "@/hooks/useRoomSession";
import { useScreenReveal } from "@/hooks/useScreenReveal";
import { trackEvent, trackMatchEnd, trackMatchStart } from "@/lib/analytics";
import {
  APP_NAME,
  GAME_ROUND_COUNT,
  MENU_MODES,
  resolveWaterColorId,
  ROUTES,
  WATER_COLORS,
} from "@/lib/constants";
import { emitWithAck } from "@/lib/socket";
import {
  getFallbackWaterColorId,
  getWaterColorPreferenceSnapshot,
  isWaterColorId,
  saveStoredWaterColorId,
  subscribeToWaterColorPreference,
} from "@/lib/waterColorPreference";

function subscribeToHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

function HomeTitleBand({ title }) {
  const titleText = title.toUpperCase();

  return (
    <section
      className="pc-title-band relative min-w-0 overflow-hidden px-6 py-6 pr-16 [--home-pad:1.5rem] [--reverse-width:min(54vw,26rem)] md:px-8 md:py-8 md:pr-20 md:[--home-pad:2rem] lg:px-10 lg:py-10 lg:pr-10 lg:[--home-pad:2.5rem] lg:[--reverse-width:var(--home-split-x)]"
      data-home-title="true"
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[var(--reverse-width)] bg-[#0d0d0c] dark:bg-[#161616]"
        data-home-title-fill="true"
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
          className="pc-page-title pc-page-title-fit pointer-events-none absolute inset-x-0 top-0 overflow-hidden text-[#f7f7f2] [clip-path:inset(0_calc(100%_-_(var(--reverse-width)_-_var(--home-pad)))_0_0)] dark:text-[#f7f7f2]"
        >
          {titleText}
        </h1>
      </div>
    </section>
  );
}

function HomeStats() {
  const { t } = useTranslation();
  const rotatedStyle = {
    transform: "rotate(-90deg)",
    transformOrigin: "top left",
  };
  const stats = [
    {
      label: t("game.rounds"),
      value: "5",
    },
    {
      label: t("game.target"),
      value: t("game.line"),
    },
    {
      label: t("game.lowestWins"),
      value: t("game.diff"),
    },
  ];

  return (
    <section
      className="flex w-full max-w-[16rem] items-end justify-between text-[#0d0d0c]/82 dark:text-[#f7f7f2]/72"
      data-home-stats="true"
      data-screen-reveal="cream"
    >
      {stats.map((stat) => (
        <div
          className="relative h-[7.5rem] w-9"
          data-screen-reveal-direction="up"
          data-screen-reveal-group="stats"
          data-screen-reveal-row="true"
          key={`${stat.value}-${stat.label}`}
        >
          <div
            className="absolute left-0 top-full whitespace-nowrap text-left"
            style={rotatedStyle}
          >
            <p className="pc-round-value uppercase">{stat.value}</p>
            <p className="pc-round-label mt-1">{stat.label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function HomeModePanel({
  className = "",
  continueLabel,
  menuError,
  modeOptions,
  onContinue,
  onModeSelect,
  reveal = false,
  selectedMode,
}) {
  return (
    <div
      className={["grid min-w-0 gap-5", className].join(" ")}
      data-home-mode-panel="true"
      data-screen-reveal-direction={reveal ? "down" : undefined}
      data-screen-reveal={reveal ? "water-content" : undefined}
    >
      <div className="overflow-hidden" data-screen-reveal-row="true">
        <div className="grid grid-cols-2">
          {modeOptions.map((mode) => (
            <ModeSelectCard
              description={mode.description}
              disabled={mode.disabled}
              key={mode.id}
              onClick={() => onModeSelect(mode.id)}
              selected={selectedMode === mode.id}
              title={mode.title}
            />
          ))}
        </div>
      </div>

      <div className="overflow-hidden" data-screen-reveal-row="true">
        <Button
          className="rounded-none !shadow-none"
          onClick={onContinue}
        >
          {continueLabel}
        </Button>
      </div>
      {menuError ? (
        <div className="overflow-hidden" data-screen-reveal-row="true">
          <p className="pc-copy-strong text-[#ef2f25]">{menuError}</p>
        </div>
      ) : null}
    </div>
  );
}

function setBrowserPath(path) {
  if (typeof window === "undefined") {
    return;
  }

  window.history.pushState({}, "", path);
}

function getPlayPath(settings) {
  const params = new URLSearchParams({
    difficulty: settings.difficulty,
    gameMode: settings.ruleMode,
    roundCount: String(settings.roundCount || GAME_ROUND_COUNT),
    waterColor: settings.waterColorId,
  });

  if (settings.targetSeed) {
    params.set("seed", settings.targetSeed);
  }

  return `${settings.route}?${params.toString()}`;
}

function getRunSummary(results = []) {
  const totalScore = results.reduce(
    (total, result) => total + Number(result.score || 0),
    0,
  );

  return {
    averageScore: results.length ? totalScore / results.length : 0,
    rounds: results.length,
    totalScore,
  };
}

function createTargetSeed(settings) {
  return [
    settings.mode,
    settings.difficulty,
    settings.ruleMode,
    settings.roundCount || GAME_ROUND_COUNT,
    settings.waterColorId,
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 10),
  ].join(":");
}

function responseData(response) {
  return response?.data || response || {};
}

export default function HomeScreen({
  initialMode = MENU_MODES.SINGLEPLAYER,
  initialSettings = null,
  initialStep = "menu",
} = {}) {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const explicitWaterColorId = isWaterColorId(initialSettings?.waterColorId)
    ? initialSettings.waterColorId
    : null;
  const storedPreferredWaterColorId = useSyncExternalStore(
    subscribeToWaterColorPreference,
    getWaterColorPreferenceSnapshot,
    getFallbackWaterColorId,
  );
  const hasHydratedClient = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const [selectedMode, setSelectedMode] = useState(initialMode);
  const [sessionWaterColorId, setSessionWaterColorId] =
    useState(explicitWaterColorId);
  const [step, setStep] = useState(initialStep);
  const [gameSettings, setGameSettings] = useState(initialSettings);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [menuError, setMenuError] = useState("");
  const [roundResults, setRoundResults] = useState([]);
  const trackedGameStartRef = useRef("");
  const homeRevealRef = useRef(null);
  const modeOptions = [
    {
      description: t("home.singleplayerDescription"),
      disabled: false,
      id: MENU_MODES.SINGLEPLAYER,
      title: t("home.singleplayerTitle"),
    },
    {
      description: t("home.multiplayerDescription"),
      disabled: false,
      id: MENU_MODES.MULTIPLAYER,
      title: t("home.multiplayerTitle"),
    },
  ];
  const preferredWaterColorId = hasHydratedClient
    ? storedPreferredWaterColorId
    : getFallbackWaterColorId();
  const selectedWaterColorId = sessionWaterColorId || preferredWaterColorId;
  const selectedWaterColor =
    WATER_COLORS.find((color) => color.id === selectedWaterColorId) ??
    WATER_COLORS[0];

  const playHomeExit = useScreenReveal(homeRevealRef, [step, locale], {
    delay: step === "menu" ? 120 : 0,
  });

  useEffect(() => {
    if (
      step !== "gameplay" ||
      !gameSettings ||
      gameSettings.mode === MENU_MODES.MULTIPLAYER
    ) {
      return;
    }

    const gameStartKey = [
      gameSettings.targetSeed,
      gameSettings.difficulty,
      gameSettings.ruleMode,
      gameSettings.roundCount || GAME_ROUND_COUNT,
    ].join(":");

    if (trackedGameStartRef.current === gameStartKey) return;
    trackedGameStartRef.current = gameStartKey;

    trackMatchStart({
      difficulty: gameSettings.difficulty,
      gameMode: gameSettings.ruleMode,
      gameType: "singleplayer",
      levelCount: gameSettings.roundCount || GAME_ROUND_COUNT,
    });
  }, [gameSettings, step]);

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
  };

  const handleContinue = async () => {
    await playHomeExit();
    setStep("setup");
  };

  const handleStartGame = async (settings) => {
    setMenuError("");
    saveStoredWaterColorId(settings.waterColorId);
    const resolvedWaterColorId = resolveWaterColorId(settings.waterColorId);
    const resolvedSettings = {
      ...settings,
      waterColorId: resolvedWaterColorId,
    };

    if (resolvedSettings.mode === MENU_MODES.MULTIPLAYER) {
      setIsCreatingRoom(true);

      const playerId = createPlayerId();
      const playerName =
        resolvedSettings.playerName?.trim() || t("room.defaultPlayer");
      const isJoiningLobby = resolvedSettings.action === "join";
      const lobbyVisibility = resolvedSettings.visibility || "public";
      const response = isJoiningLobby
        ? await emitWithAck("room:join", {
            password: resolvedSettings.password || "",
            playerId,
            playerName,
            roomCode: resolvedSettings.roomCode,
            waterColorId: resolvedWaterColorId,
          })
        : await emitWithAck("room:create", {
            difficulty: resolvedSettings.difficulty,
            hostName: playerName,
            hostPlayerId: playerId,
            playerName,
            playerId,
            password:
              lobbyVisibility === "private" ? resolvedSettings.password || "" : "",
            roomName:
              resolvedSettings.roomName?.trim() ||
              t("setup.playerLobbyName", { name: playerName }),
            roundCount: resolvedSettings.roundCount || GAME_ROUND_COUNT,
            ruleMode: resolvedSettings.ruleMode,
            visibility: lobbyVisibility,
            waterColorId: resolvedWaterColorId,
          });

      setIsCreatingRoom(false);

      if (!response.ok) {
        setMenuError(
          response.error ||
            (isJoiningLobby ? t("room.joinFailed") : t("room.createFailed")),
        );
        return;
      }

      const data = responseData(response);
      const nextRoomCode =
        data.roomCode || data.room?.code || resolvedSettings.roomCode;
      trackEvent(isJoiningLobby ? "lobby_join" : "lobby_create", {
        difficulty: resolvedSettings.difficulty,
        game_mode: resolvedSettings.ruleMode,
        game_type: "multiplayer",
        lobby_visibility: lobbyVisibility,
      });
      saveRoomSession(nextRoomCode, {
        isHost: !isJoiningLobby,
        playerId,
        playerName,
        roomCode: nextRoomCode,
        waterColorId: resolvedWaterColorId,
      });
      router.push(`/${nextRoomCode}`);
      return;
    }

    const nextSettings = {
      ...resolvedSettings,
      targetSeed:
        resolvedSettings.targetSeed || createTargetSeed(resolvedSettings),
    };

    setGameSettings(nextSettings);
    setRoundResults([]);
    setStep("gameplay");
    setBrowserPath(getPlayPath(nextSettings));
  };

  const handleWaterColorChange = (nextWaterColorId) => {
    if (!isWaterColorId(nextWaterColorId)) return;

    setSessionWaterColorId(nextWaterColorId);
    saveStoredWaterColorId(nextWaterColorId);
  };

  const handleGameComplete = (results) => {
    const summary = getRunSummary(results);

    trackMatchEnd({
      averageScore: summary.averageScore,
      difficulty: gameSettings?.difficulty,
      gameMode: gameSettings?.ruleMode,
      gameType: "singleplayer",
      rounds: summary.rounds,
      totalScore: summary.totalScore,
    });
    setRoundResults(results);
    setStep("scoreboard");
  };

  const handleBackToMenu = () => {
    setBrowserPath(ROUTES.HOME);
    setStep("menu");
  };

  if (step === "setup") {
    return (
      <GameSetupScreen
        initialWaterColorId={selectedWaterColorId}
        isStarting={isCreatingRoom}
        mode={selectedMode}
        onBack={handleBackToMenu}
        onStart={handleStartGame}
        onWaterColorChange={handleWaterColorChange}
      />
    );
  }

  if (step === "gameplay") {
    return (
      <GameplayScreen
        onComplete={handleGameComplete}
        onExit={handleBackToMenu}
        settings={gameSettings}
      />
    );
  }

  if (step === "scoreboard") {
    return (
      <ScoreboardScreen
        onMenu={handleBackToMenu}
        onPlayAgain={() => {
          const nextSettings = {
            ...gameSettings,
            targetSeed: createTargetSeed(gameSettings),
          };

          setRoundResults([]);
          setGameSettings(nextSettings);
          setBrowserPath(getPlayPath(nextSettings));
          setStep("gameplay");
        }}
        results={roundResults}
        settings={gameSettings}
      />
    );
  }

  return (
    <div
      className="relative h-dvh min-h-dvh overflow-hidden bg-[#f7f7f2] text-[#0d0d0c] dark:bg-[#0d0d0c] dark:text-[#f7f7f2]"
      data-home-screen="true"
      ref={homeRevealRef}
      style={{
        "--home-split-x": "50vw",
        "--home-water-color": selectedWaterColor.value,
        "--home-water-background":
          selectedWaterColor.background || selectedWaterColor.value,
      }}
    >
      <PageUtilitySwitches placement="rail" />
      <main className="relative z-10 grid h-full min-h-0 w-full min-w-0 grid-rows-[auto_1fr]">
        <HomeTitleBand title={APP_NAME} />

        <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-none lg:min-h-0 lg:grid-cols-[var(--home-split-x)_minmax(0,1fr)]">
          <section className="mx-auto grid w-full max-w-[44rem] content-start min-w-0 px-6 pb-8 pt-8 md:px-8 md:pb-10 md:pt-10 lg:mx-0 lg:max-w-none lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)] lg:content-stretch lg:px-10 lg:pb-10 lg:pt-16">
            <div
              className="max-w-[40rem] space-y-4 lg:max-w-[calc(50vw-5rem)]"
              data-home-intro="true"
              data-screen-reveal="cream"
            >
              <span
                className="inline-flex overflow-hidden"
                data-screen-reveal-row="true"
              >
                <span className="pc-label inline-flex bg-[#0d0d0c] px-3 py-2 text-[#f7f7f2] dark:bg-[#f7f7f2] dark:text-[#0d0d0c]">
                  {t("home.howToPlay")}
                </span>
              </span>
              <div className="pc-copy space-y-3 text-[#0d0d0c]/66 md:space-y-2 lg:space-y-3 dark:text-[#f7f7f2]/68">
                <p
                  className="overflow-hidden"
                  data-screen-reveal-row="true"
                  key={`intro-one-${locale}`}
                >
                  <span className="block">{t("home.introOne")}</span>
                </p>
                <p
                  className="overflow-hidden"
                  data-screen-reveal-row="true"
                  key={`intro-two-${locale}`}
                >
                  <span className="block">{t("home.introTwo")}</span>
                </p>
              </div>
            </div>

            <HomeModePanel
              className="hidden"
              continueLabel={t("common.continue")}
              menuError={menuError}
              modeOptions={modeOptions}
              onContinue={handleContinue}
              onModeSelect={handleModeSelect}
              selectedMode={selectedMode}
            />

            <div className="hidden min-h-0 grid-cols-[auto_minmax(0,1fr)] items-end gap-8 lg:grid">
              <div className="shrink-0">
                <div data-screen-reveal="cream">
                  <div className="overflow-hidden" data-screen-reveal-row="true">
                    <AppFooter />
                  </div>
                </div>
              </div>
              <div className="grid min-w-0 justify-items-center">
                <HomeStats />
              </div>
            </div>
          </section>

          <section
            className="relative mx-auto grid w-full max-w-[44rem] min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-8 [background:var(--home-water-background)] px-6 pb-8 pt-8 md:grid-cols-[auto_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] md:gap-10 md:px-8 md:pb-10 md:pt-10 lg:mx-0 lg:max-w-none lg:gap-8 lg:p-10 dark:[background:#161616]"
            data-home-water="true"
            data-premium-water={selectedWaterColor.animated ? "true" : undefined}
            data-screen-reveal="water-bg"
          >
            <WaterColorWipe
              animated={selectedWaterColor.animated}
              color={selectedWaterColor.background || selectedWaterColor.value}
              property="--home-water-background"
            />
            <SectionWord
              primary={t("game.timing")}
              secondary={t("game.actionPour")}
            />
            <div className="grid h-full min-h-0 min-w-0 content-end justify-items-stretch lg:min-h-0 lg:justify-items-end">
              <HomeModePanel
                className="w-full lg:max-w-full xl:w-[82%] xl:min-w-[28rem] xl:max-w-[52rem]"
                continueLabel={t("common.continue")}
                menuError={menuError}
                modeOptions={modeOptions}
                onContinue={handleContinue}
                onModeSelect={handleModeSelect}
                reveal
                selectedMode={selectedMode}
              />
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
