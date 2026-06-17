"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  BatteryCharging,
  CircleDot,
  Columns2,
  Droplet,
  Eye,
  EyeOff,
  Flag,
  Gauge,
  Globe2,
  Lock,
  MousePointerClick,
  Palette,
  RotateCcw,
  Shuffle,
  Timer,
  Zap,
} from "lucide-react";
import AppFooter from "@/components/layout/AppFooter";
import PageUtilitySwitches from "@/components/layout/PageUtilitySwitches";
import SectionWord from "@/components/layout/SectionWord";
import AnimatedSettingsModal from "@/components/ui/AnimatedSettingsModal";
import Button from "@/components/ui/Button";
import WaterColorWipe from "@/components/ui/WaterColorWipe";
import LobbyListPanel from "@/components/sections/setup/LobbyListPanel";
import { useTranslation } from "@/hooks/useLanguage";
import { useLoopingSlider } from "@/hooks/useLoopingSlider";
import { useRedeemCodes } from "@/hooks/useRedeemCodes";
import { useScreenReveal } from "@/hooks/useScreenReveal";
import {
  DEFAULT_DIFFICULTY_ID,
  GAME_DIFFICULTIES,
  GAME_RULE_MODES,
  GAME_ROUND_COUNT,
  MENU_MODES,
  MODE_GRID_ORDER,
  ROUND_COUNT_OPTIONS,
  ROUTES,
  WATER_COLORS,
} from "@/lib/constants";
import {
  readSessionPlayerName,
  saveSessionPlayerName,
} from "@/lib/playerNamePreference";
import {
  playDifficultySelect,
  playGameModeSelect,
  playWaterColorSelect,
} from "@/lib/sound";

const setupCopy = {
  [MENU_MODES.SINGLEPLAYER]: {
    title: "Singleplayer",
    description:
      "Choose the rule, tune the water feel, and start a timing run built around touch instead of luck.",
    startLabel: "Start Singleplayer",
    route: ROUTES.SINGLEPLAYER,
  },
  [MENU_MODES.MULTIPLAYER]: {
    title: "Multiplayer",
    description:
      "Shape the match rules before the lobby opens, then carry the same clean flow into a shared run.",
    startLabel: "Start Multiplayer",
    route: ROUTES.MULTIPLAYER,
  },
};

const MULTIPLAYER_ACTIONS = {
  CREATE: "create",
  JOIN: "join",
};

const MULTIPLAYER_SETUP_STEPS = {
  ACTION: "action",
  CREATE_DETAILS: "create-details",
  JOIN_LIST: "join-list",
};

const LOBBY_VISIBILITIES = {
  PRIVATE: "private",
  PUBLIC: "public",
};

function getDefaultLobbyName(playerName, t) {
  const cleanPlayerName = String(playerName || "").trim();
  return cleanPlayerName
    ? t("setup.playerLobbyName", { name: cleanPlayerName })
    : t("setup.defaultLobbyName");
}

function getSetupSectionWords({ isMultiplayer, multiplayerStep, title, t }) {
  if (!isMultiplayer) {
    return {
      primary: title.toUpperCase(),
      secondary: t("setup.sectionSetup").toUpperCase(),
    };
  }

  if (multiplayerStep === MULTIPLAYER_SETUP_STEPS.CREATE_DETAILS) {
    return {
      primary: t("setup.sectionLobby").toUpperCase(),
      secondary: t("setup.sectionCreate").toUpperCase(),
    };
  }

  if (multiplayerStep === MULTIPLAYER_SETUP_STEPS.JOIN_LIST) {
    return {
      primary: t("setup.sectionLobbies").toUpperCase(),
      secondary: t("setup.sectionBrowse").toUpperCase(),
    };
  }

  return {
    primary: t("setup.sectionName").toUpperCase(),
    secondary: t("setup.sectionPlayer").toUpperCase(),
  };
}

function orderModeOptions(options) {
  const order = new Map(MODE_GRID_ORDER.map((id, index) => [id, index]));

  return [...options].sort(
    (first, second) =>
      (order.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(second.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

const ruleModeOptions = [
  {
    id: GAME_RULE_MODES.CLASSIC,
    icon: CircleDot,
    title: "Classic",
    description: "One hold. Release locks the level.",
  },
  {
    id: GAME_RULE_MODES.BLIND,
    icon: Eye,
    title: "No Guide",
    description: "No target line. Trust the goal percentage.",
  },
  {
    id: GAME_RULE_MODES.FLASH,
    icon: Zap,
    title: "Flash",
    description: "The line flashes briefly. Five seconds to chase it.",
  },
  {
    id: GAME_RULE_MODES.FAKE_TARGET,
    icon: Flag,
    title: "Fake Target",
    description: "Two target lines. One is a trap.",
  },
  {
    id: GAME_RULE_MODES.INVERT,
    icon: ArrowUpDown,
    title: "Invert",
    description: "Classic timing with the water flipped upside down.",
  },
  {
    id: GAME_RULE_MODES.REVERSE_POUR,
    icon: RotateCcw,
    title: "Draining",
    description: "Start full. Hold to drain down.",
  },
  {
    id: GAME_RULE_MODES.LEAKY,
    icon: Droplet,
    title: "Leaky",
    description: "Release leaks. Short clock, then lock.",
  },
  {
    id: GAME_RULE_MODES.TILT,
    icon: Gauge,
    title: "Tilt",
    description: "Gravity leans. Read the slanted water line.",
  },
  {
    id: GAME_RULE_MODES.CHAOS_QUEUE,
    icon: Shuffle,
    title: "Chaos Queue",
    description: "A random rule appears before every round.",
  },
  {
    id: GAME_RULE_MODES.SPLIT_FILL,
    icon: Columns2,
    title: "Split Fill",
    description: "Two tanks. Two targets. One release.",
  },
  {
    id: GAME_RULE_MODES.PERFECT_OR_NOTHING,
    icon: CircleDot,
    title: "All or Nothing",
    description: "Hit the narrow zone for everything, miss it for nothing.",
  },
  {
    id: GAME_RULE_MODES.BAND_RUN,
    icon: CircleDot,
    title: "Band Run",
    description: "Two to five target bands. One touch for each.",
  },
  {
    id: GAME_RULE_MODES.CHARGE_POUR,
    icon: BatteryCharging,
    title: "Pressure Charge",
    description: "Hold to charge. Release a stronger pour from above.",
  },
  {
    id: GAME_RULE_MODES.BURST_CLICK,
    icon: MousePointerClick,
    title: "Burst Click",
    description: "Spam quick taps to build a steady timed flow.",
  },
  {
    id: GAME_RULE_MODES.COLORBLIND,
    icon: EyeOff,
    title: "Blind",
    description: "The screen fades out after the round begins.",
  },
  {
    id: GAME_RULE_MODES.AUTO_RISE,
    icon: ArrowUp,
    title: "Auto Rise",
    description: "Water rises from center. Touch once to stop it.",
  },
];

const difficultyOptions = [
  {
    id: GAME_DIFFICULTIES.EASY,
    title: "Easy",
    description: "Gentler flow. Small surface movement.",
  },
  {
    id: GAME_DIFFICULTIES.NORMAL,
    title: "Normal",
    description: "Balanced speed with clear wave motion.",
  },
  {
    id: GAME_DIFFICULTIES.HARD,
    title: "Hard",
    description: "Fast fill. Heavy waves and sharper timing.",
  },
];

function isRuleModeAvailable(option, isMultiplayer) {
  return !isMultiplayer || option.id !== GAME_RULE_MODES.ENDLESS;
}

function SetupTitleBand({ onBack, title }) {
  const { t } = useTranslation();
  const titleText = title.toUpperCase();

  return (
    <section
      className="pc-title-band relative min-w-0 overflow-hidden px-6 py-6 pr-16 [--setup-pad:1.5rem] [--reverse-width:min(54vw,26rem)] md:px-8 md:py-8 md:pr-20 md:[--setup-pad:2rem] lg:px-10 lg:py-10 lg:pr-10 lg:[--setup-pad:2.5rem] lg:[--reverse-width:var(--setup-split-x)]"
      data-setup-title="true"
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[var(--reverse-width)] bg-[#0d0d0c] dark:bg-[#161616]"
        data-setup-title-fill="true"
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
          className="pc-page-title pc-page-title-fit pointer-events-none absolute inset-x-0 top-0 overflow-hidden text-[#f7f7f2] [clip-path:inset(0_calc(100%_-_(var(--reverse-width)_-_var(--setup-pad)))_0_0)] dark:text-[#f7f7f2]"
        >
          {titleText}
        </h1>
      </div>

      <button
        aria-label={t("common.backHome")}
        className="pc-icon-button fixed right-3 top-3 z-[60] grid place-items-center text-[#0d0d0c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] md:right-4 md:top-4 dark:text-[#f7f7f2] dark:focus-visible:outline-[#f7f7f2]"
        onClick={onBack}
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

function SetupIntro({ description, setupDescription }) {
  const paragraphs = Array.isArray(setupDescription)
    ? setupDescription
    : [setupDescription || description];

  return (
    <div
      className="pc-copy grid max-w-[40rem] gap-3 text-[#0d0d0c]/66 lg:max-w-[calc(50vw-5rem)] dark:text-[#f7f7f2]/68"
      data-setup-intro="true"
      data-screen-reveal="cream"
    >
      {paragraphs.map((paragraph) => (
        <p
          className="overflow-hidden"
          data-screen-reveal-row="true"
          key={paragraph}
        >
          <span className="block">{paragraph}</span>
        </p>
      ))}
    </div>
  );
}

function ChoiceGrid({
  label,
  options,
  value,
  onChange,
  modalGrid = false,
  showLabel = true,
}) {
  const { t } = useTranslation();
  const {
    handleClickCapture,
    handlePointerCancel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleScroll,
    handleWheel,
    sliderRef,
  } = useLoopingSlider(options.length, { loop: "never" });
  const visibleOptions = options;

  return (
    <div
      className="min-w-0 space-y-3"
      data-screen-reveal-atomic="true"
      data-sound-group="game-mode"
    >
      {showLabel ? (
        <p className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58">
          {label}
        </p>
      ) : null}
      <div
        className={[
          "grid min-w-0 select-none bg-[#0d0d0c]/[0.035] shadow-[0_22px_48px_rgba(13,13,12,0.08)] touch-pan-y dark:bg-[#f7f7f2]/6 dark:shadow-[0_24px_60px_rgba(0,0,0,0.32)]",
          modalGrid
            ? "grid-cols-3 overflow-visible"
            : "grid-flow-col grid-rows-1 auto-cols-[8.75rem] overflow-x-auto overflow-y-hidden overscroll-contain [scrollbar-width:none] min-[420px]:auto-cols-[9.25rem] md:grid-rows-2 md:auto-cols-[9.75rem] [&::-webkit-scrollbar]:hidden",
        ].join(" ")}
        onClickCapture={handleClickCapture}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onScroll={handleScroll}
        onWheel={handleWheel}
        ref={sliderRef}
      >
        {visibleOptions.map((option, loopIndex) => {
          const optionIndex = loopIndex;
          const isDesktopCopy = true;
          const selected = value === option.id;
          const Icon = option.icon ?? Timer;
          const title = t(`modes.${option.id}.label`);
          const description = t(`modes.${option.id}.description`);

          return (
            <button
              aria-label={`${title}. ${description}`}
              aria-pressed={selected}
              className={[
                "pc-choice flex min-w-0 items-center justify-center px-3 py-2 text-center transition-colors duration-200 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] min-[420px]:px-4 lg:px-4 lg:py-3 dark:focus-visible:outline-[#f7f7f2]",
                isDesktopCopy ? "" : "lg:hidden",
                selected
                  ? "bg-[#0d0d0c] text-white dark:bg-[#f7f7f2] dark:text-[#0d0d0c]"
                  : "bg-[#f7f7f2]/96 text-[#0d0d0c] hover:bg-[#f7f7f2] dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2] dark:hover:bg-[#f7f7f2]/14",
              ].join(" ")}
              data-sound-index={optionIndex}
              data-sound-kind="game-mode"
              key={option.id}
              onClick={() => {
                playGameModeSelect(option.id, optionIndex);
                onChange(option.id);
              }}
              type="button"
            >
              <span className="flex min-w-0 items-center justify-center gap-[var(--pc-choice-gap)]">
                <Icon
                  aria-hidden="true"
                  className="pc-icon shrink-0"
                  strokeWidth={2.65}
                />
                <span className="pc-choice-text block min-w-0 break-normal text-center">
                  {title}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DifficultyControl({ label, value, onChange }) {
  const { t } = useTranslation();

  return (
    <div className="min-w-0 space-y-3" data-screen-reveal-atomic="true">
      <p className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58">
        {label}
      </p>
      <div className="w-full">
        <div className="grid grid-cols-3 bg-[#0d0d0c]/[0.035] shadow-[0_18px_38px_rgba(13,13,12,0.07)] dark:bg-[#f7f7f2]/6 dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
          {difficultyOptions.map((option, optionIndex) => {
            const selected = value === option.id;

            return (
              <button
                aria-pressed={selected}
                className={[
                  "pc-choice pc-difficulty-choice transition-colors duration-200 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]",
                  selected
                    ? "bg-[#0d0d0c] text-white dark:bg-[#f7f7f2] dark:text-[#0d0d0c]"
                    : "bg-[#f7f7f2]/96 text-[#0d0d0c]/72 hover:bg-[#f7f7f2] dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2]/70 dark:hover:bg-[#f7f7f2]/14",
                ].join(" ")}
                key={option.id}
                data-sound-index={optionIndex}
                data-sound-kind="difficulty"
                onClick={() => {
                  playDifficultySelect(option.id, optionIndex);
                  onChange(option.id);
                }}
                type="button"
              >
                {t(`difficulties.${option.id}.label`)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RoundCountControl({ label, value, onChange }) {
  return (
    <div className="min-w-0 space-y-3" data-screen-reveal-atomic="true">
      <p className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58">
        {label}
      </p>
      <div className="w-full">
        <div className="grid grid-cols-4 bg-[#0d0d0c]/[0.035] shadow-[0_18px_38px_rgba(13,13,12,0.07)] dark:bg-[#f7f7f2]/6 dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
          {ROUND_COUNT_OPTIONS.map((option) => {
            const selected = value === option;

            return (
              <button
                aria-pressed={selected}
                className={[
                  "pc-choice pc-difficulty-choice transition-colors duration-200 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]",
                  selected
                    ? "bg-[#0d0d0c] text-white dark:bg-[#f7f7f2] dark:text-[#0d0d0c]"
                    : "bg-[#f7f7f2]/96 text-[#0d0d0c]/72 hover:bg-[#f7f7f2] dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2]/70 dark:hover:bg-[#f7f7f2]/14",
                ].join(" ")}
                key={option}
                onClick={() => onChange(option)}
                type="button"
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getWaterColorWheelStep(slider, compact = false) {
  if (!slider) return compact ? 58 : 68;

  const colorButtons = slider.querySelectorAll("[data-color-id]");
  const firstRect = colorButtons[0]?.getBoundingClientRect();
  const secondRect = colorButtons[1]?.getBoundingClientRect();
  if (firstRect && secondRect) {
    return Math.abs(secondRect.left - firstRect.left);
  }

  const buttonWidth = firstRect?.width ?? (compact ? 48 : 56);
  return buttonWidth + (compact ? 10 : 12);
}

function WaterColorSelect({
  colors = WATER_COLORS,
  label,
  value,
  onChange,
  compact = false,
  showLabel = true,
}) {
  const { t } = useTranslation();
  const safeColors = colors.length ? colors : WATER_COLORS;
  const colorCount = safeColors.length;
  const {
    handleClickCapture,
    handlePointerCancel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleScroll,
    handleWheel,
    sliderRef,
  } = useLoopingSlider(colorCount, {
    getWheelStep: (slider) => getWaterColorWheelStep(slider, compact),
    loop: "always",
    wheelDuration: 0.78,
  });
  const selectedColor =
    safeColors.find((color) => color.id === value) ??
    WATER_COLORS.find((color) => color.id === value) ??
    safeColors[0] ??
    WATER_COLORS[0];
  const visibleColors = [...safeColors, ...safeColors, ...safeColors];

  const handleColorSelect = (colorId, colorIndex) => {
    playWaterColorSelect(colorIndex);
    onChange(colorId);
  };

  return (
    <div className="min-w-0 space-y-3" data-screen-reveal-atomic="true">
      {showLabel ? (
        <p className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58">
          {label}{" "}
          <span
            data-water-color-name="true"
            style={{ color: selectedColor.labelColor || selectedColor.value }}
          >
            {t(`colors.${selectedColor.id}`)}
          </span>
        </p>
      ) : null}
      <div
        ref={sliderRef}
        data-water-color-slider="true"
        className={[
          "grid min-w-0 items-center overflow-x-auto overflow-y-hidden",
          "[&::-webkit-scrollbar]:hidden",
          "cursor-grab select-none active:cursor-grabbing",
          "touch-pan-y",
          "overscroll-contain",
          "h-[var(--pc-swatch-size)]",
          compact
            ? "w-full max-w-full lg:max-w-[18rem] xl:max-w-[22rem] 2xl:max-w-[28rem]"
            : "w-full max-w-full sm:max-w-[34rem]",
        ].join(" ")}
        onClickCapture={handleClickCapture}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerCancel={handlePointerCancel}
        onPointerUp={handlePointerUp}
        onScroll={handleScroll}
        onWheel={handleWheel}
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%)",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          touchAction: "pan-y",
        }}
      >
        <div
          className={[
            "flex w-max flex-nowrap",
            compact ? "gap-2.5" : "gap-2.5 sm:gap-3",
          ].join(" ")}
        >
          {visibleColors.map((color, index) => {
            const selected = value === color.id;
            const RandomIcon = color.isRandom ? Shuffle : null;

            return (
              <button
                aria-label={`${t(`colors.${color.id}`)} ${label}`}
                aria-pressed={selected}
                className={[
                  "pc-swatch shrink-0",
                  "relative grid place-items-center overflow-hidden",
                  "transition-[box-shadow] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c]",
                ].join(" ")}
                data-color-id={color.id}
                data-static-premium-water={color.animated ? "true" : undefined}
                data-sound-index={index % colorCount}
                data-sound-kind="water-color"
                key={`${color.id}-${index}`}
                onClick={() =>
                  handleColorSelect(color.id, index % colorCount)
                }
                style={{
                  background: color.background || color.value,
                  boxShadow: selected
                    ? "inset 0 -8px 0 #0d0d0c, 0 14px 28px rgba(13,13,12,0.14)"
                    : "none",
                }}
                type="button"
              >
                {RandomIcon ? (
                  <RandomIcon
                    aria-hidden="true"
                    className="pc-icon text-[#0d0d0c]"
                    strokeWidth={3}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MobileSetupModal({ children, onClose, title }) {
  return (
    <AnimatedSettingsModal onClose={onClose} title={title}>
      {children}
    </AnimatedSettingsModal>
  );
}

function MobileSetupButton({
  buttonSizeClassName = "h-[var(--pc-choice-height)]",
  icon: Icon,
  label,
  onClick,
  showLabel = true,
  value = "",
  wide = false,
  wrapperSizeClassName = "w-[var(--pc-choice-height)]",
}) {
  return (
    <div
      className={[
        "grid min-w-0",
        showLabel ? "grid-rows-[auto_var(--pc-choice-height)] gap-3" : "",
        wide ? "w-full" : wrapperSizeClassName,
      ].join(" ")}
      data-screen-reveal-atomic="true"
    >
      {showLabel ? (
        <p className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58">
          {label}
        </p>
      ) : null}
      <button
        aria-label={label}
        className={[
          "grid min-w-0 place-items-center bg-[#f7f7f2]/96 text-[#0d0d0c] shadow-[0_18px_38px_rgba(13,13,12,0.08)] transition-colors duration-200 hover:bg-white focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2] dark:hover:bg-[#f7f7f2]/14 dark:focus-visible:outline-[#f7f7f2]",
          buttonSizeClassName,
          wide ? "px-3" : "",
        ].join(" ")}
        onClick={onClick}
        type="button"
      >
        <span
          className={[
            "flex min-w-0 items-center gap-2",
            wide ? "w-full" : "",
            wide ? "justify-start" : "justify-center",
          ].join(" ")}
        >
          <Icon aria-hidden="true" className="pc-icon shrink-0" strokeWidth={2.7} />
          {value ? (
            <span className="pc-choice-text min-w-0 truncate">{value}</span>
          ) : null}
        </span>
      </button>
    </div>
  );
}

function MultiplayerActionButtons({ onCreate, onJoin, tall = false }) {
  const { t } = useTranslation();
  const options = [
    {
      id: MULTIPLAYER_ACTIONS.CREATE,
      label: t("setup.createLobby"),
      onClick: onCreate,
      variant: "light",
    },
    {
      id: MULTIPLAYER_ACTIONS.JOIN,
      label: t("setup.joinLobbyAction"),
      onClick: onJoin,
      variant: "dark",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((option) => (
        <button
          className={[
            tall
              ? "pc-action px-4 lg:px-5"
              : "pc-action px-4",
            "transition-colors duration-200 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c]",
            option.variant === "dark"
              ? "bg-[#0d0d0c] text-[#f7f7f2] shadow-[0_18px_42px_rgba(13,13,12,0.22)] hover:bg-black dark:bg-[#f7f7f2] dark:text-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]"
              : "bg-[#f7f7f2]/96 text-[#0d0d0c] shadow-[0_18px_38px_rgba(13,13,12,0.08)] hover:bg-white dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2] dark:shadow-[0_24px_60px_rgba(0,0,0,0.26)] dark:hover:bg-[#f7f7f2]/14 dark:focus-visible:outline-[#f7f7f2]",
          ].join(" ")}
          key={option.id}
          onClick={option.onClick}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SetupTextField({
  error = "",
  label,
  maxLength = 24,
  onChange,
  placeholder = "",
  prominent = false,
  trailingAction = null,
  type = "text",
  value,
}) {
  return (
    <div
      className="w-full max-w-none space-y-2.5"
      data-screen-reveal-atomic="true"
    >
      <p
        className={[
          "pc-label",
          error ? "text-[#0d0d0c] dark:text-[#f7f7f2]" : "text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58",
        ].join(" ")}
      >
        {label}
      </p>
      <div className="relative">
        <input
          aria-invalid={Boolean(error)}
          className={[
            "pc-field w-full px-4 text-[#0d0d0c] outline-none transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:text-[#f7f7f2] dark:focus-visible:outline-[#f7f7f2]",
            trailingAction ? "pr-[var(--pc-choice-height)]" : "",
            prominent
              ? "bg-[#0d0d0c]/[0.12] placeholder:text-[#0d0d0c]/58 focus-visible:bg-[#0d0d0c]/[0.16] dark:bg-[#f7f7f2]/10 dark:placeholder:text-[#f7f7f2]/42 dark:focus-visible:bg-[#f7f7f2]/14"
              : "bg-[#0d0d0c]/[0.09] placeholder:text-[#0d0d0c]/50 focus-visible:bg-[#0d0d0c]/[0.12] dark:bg-[#f7f7f2]/10 dark:placeholder:text-[#f7f7f2]/42 dark:focus-visible:bg-[#f7f7f2]/14",
            error ? "shadow-[inset_0_-4px_0_#0d0d0c]" : "",
          ].join(" ")}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          type={type}
          value={value}
        />
        {trailingAction ? (
          <div className="absolute inset-y-0 right-0 grid w-[var(--pc-choice-height)] place-items-center">
            {trailingAction}
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="pc-label text-[#0d0d0c] dark:text-[#f7f7f2]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function LobbyVisibilityControl({ onChange, value }) {
  const { t } = useTranslation();
  const options = [
    {
      id: LOBBY_VISIBILITIES.PUBLIC,
      icon: Globe2,
      label: t("setup.publicLobby"),
    },
    {
      id: LOBBY_VISIBILITIES.PRIVATE,
      icon: Lock,
      label: t("setup.privateLobby"),
    },
  ];

  return (
    <div className="min-w-0 space-y-3" data-screen-reveal-atomic="true">
      <div className="grid grid-cols-2 bg-[#0d0d0c]/[0.035] shadow-[0_18px_38px_rgba(13,13,12,0.07)] dark:bg-[#f7f7f2]/6 dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        {options.map((option) => {
          const selected = value === option.id;
          const Icon = option.icon;

          return (
            <button
              aria-label={option.label}
              aria-pressed={selected}
              className={[
                "grid h-[var(--pc-action-height)] w-[var(--pc-action-height)] place-items-center transition-colors duration-200 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]",
                selected
                  ? "bg-[#0d0d0c] text-white dark:bg-[#f7f7f2] dark:text-[#0d0d0c]"
                  : "bg-[#f7f7f2]/96 text-[#0d0d0c]/72 hover:bg-[#f7f7f2] dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2]/70 dark:hover:bg-[#f7f7f2]/14",
              ].join(" ")}
              key={option.id}
              onClick={() => onChange(option.id)}
              type="button"
            >
              <Icon aria-hidden="true" className="pc-icon" strokeWidth={2.7} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CreateLobbyDetailsStep({
  isCreating,
  lobbyName,
  lobbyNameError,
  lobbyPassword,
  lobbyPasswordError,
  lobbyVisibility,
  onCreate,
  onLobbyNameChange,
  onLobbyPasswordChange,
  onLobbyVisibilityChange,
}) {
  const { t } = useTranslation();
  const isPrivateLobby = lobbyVisibility === LOBBY_VISIBILITIES.PRIVATE;
  const [showLobbyPassword, setShowLobbyPassword] = useState(false);
  const PasswordIcon = showLobbyPassword ? EyeOff : Eye;

  return (
    <div className="grid min-w-0 gap-5">
      <div
        className={[
          "grid min-w-0 gap-5",
          isPrivateLobby ? "grid-cols-2" : "",
        ].join(" ")}
        data-screen-reveal-row="true"
        data-screen-reveal-target="children"
      >
        <SetupTextField
          error={lobbyNameError}
          label={t("setup.lobbyName")}
          onChange={onLobbyNameChange}
          placeholder={t("setup.defaultLobbyName")}
          value={lobbyName}
        />

        {isPrivateLobby ? (
          <SetupTextField
            error={lobbyPasswordError}
            label={t("setup.lobbyPassword")}
            maxLength={32}
            onChange={onLobbyPasswordChange}
            placeholder={t("setup.lobbyPassword")}
            trailingAction={
              <button
                aria-label={
                  showLobbyPassword
                    ? t("setup.hidePassword")
                    : t("setup.showPassword")
                }
                className="grid h-full w-full place-items-center text-[#0d0d0c]/70 transition-colors duration-200 hover:text-[#0d0d0c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-[#0d0d0c] dark:text-[#f7f7f2]/70 dark:hover:text-[#f7f7f2] dark:focus-visible:outline-[#f7f7f2]"
                onClick={() => setShowLobbyPassword((current) => !current)}
                type="button"
              >
                <PasswordIcon aria-hidden="true" className="pc-icon" strokeWidth={3} />
              </button>
            }
            type={showLobbyPassword ? "text" : "password"}
            value={lobbyPassword}
          />
        ) : null}
      </div>

      <div
        className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-4"
        data-screen-reveal-row="true"
        data-screen-reveal-target="children"
      >
        <Button
          className="rounded-none shadow-[0_18px_42px_rgba(13,13,12,0.12)]"
          disabled={isCreating}
          onClick={onCreate}
        >
          {isCreating ? t("setup.creatingLobby") : t("setup.createLobby")}
        </Button>
        <div data-screen-reveal-atomic="true">
          <LobbyVisibilityControl
            onChange={onLobbyVisibilityChange}
            value={lobbyVisibility}
          />
        </div>
      </div>
    </div>
  );
}

export default function GameSetupScreen({
  initialWaterColorId = WATER_COLORS[0].id,
  isStarting = false,
  mode,
  onBack,
  onStart,
  onWaterColorChange,
}) {
  const { locale, t } = useTranslation();
  const { visibleWaterColors } = useRedeemCodes();
  const fallbackCopy = setupCopy[mode] ?? setupCopy[MENU_MODES.SINGLEPLAYER];
  const copy =
    mode === MENU_MODES.MULTIPLAYER
      ? {
          ...fallbackCopy,
          description: t("setup.multiplayerDescription"),
          startLabel: t("setup.multiplayerStart"),
          title: t("setup.multiplayerTitle"),
        }
      : {
          ...fallbackCopy,
          description: t("setup.singleplayerDescription"),
          startLabel: t("setup.singleplayerStart"),
          title: t("setup.singleplayerTitle"),
        };
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY_ID);
  const [lobbyName, setLobbyName] = useState("");
  const [lobbyNameError, setLobbyNameError] = useState(false);
  const [lobbyPassword, setLobbyPassword] = useState("");
  const [lobbyPasswordError, setLobbyPasswordError] = useState(false);
  const [lobbyVisibility, setLobbyVisibility] = useState(
    LOBBY_VISIBILITIES.PUBLIC,
  );
  const [multiplayerStep, setMultiplayerStep] = useState(
    MULTIPLAYER_SETUP_STEPS.ACTION,
  );
  const [mobileSetupModal, setMobileSetupModal] = useState(null);
  const [playerName, setPlayerName] = useState(readSessionPlayerName);
  const [playerNameError, setPlayerNameError] = useState(false);
  const [roundCount, setRoundCount] = useState(GAME_ROUND_COUNT);
  const [ruleMode, setRuleMode] = useState(GAME_RULE_MODES.CLASSIC);
  const setupRevealRef = useRef(null);
  const waterColorId = initialWaterColorId;
  const isMultiplayer = mode === MENU_MODES.MULTIPLAYER;
  const isActionStep =
    isMultiplayer && multiplayerStep === MULTIPLAYER_SETUP_STEPS.ACTION;
  const isCreateDetailsStep =
    isMultiplayer &&
    multiplayerStep === MULTIPLAYER_SETUP_STEPS.CREATE_DETAILS;
  const isJoiningLobby =
    isMultiplayer && multiplayerStep === MULTIPLAYER_SETUP_STEPS.JOIN_LIST;
  const availableRuleModeOptions = orderModeOptions(
    ruleModeOptions.filter((option) => isRuleModeAvailable(option, isMultiplayer)),
  );
  const selectedWaterColor =
    WATER_COLORS.find((color) => color.id === waterColorId) ?? WATER_COLORS[0];
  const selectedRuleModeOption =
    availableRuleModeOptions.find((option) => option.id === ruleMode) ||
    availableRuleModeOptions[0] ||
    ruleModeOptions[0];
  const SelectedRuleModeIcon = selectedRuleModeOption?.icon || Shuffle;
  const selectedRuleModeLabel = selectedRuleModeOption
    ? t(`modes.${selectedRuleModeOption.id}.label`)
    : t("setup.mode");
  const setupDescription = !isMultiplayer
    ? [
        t("setup.singleplayerModeDescription", {
          mode: t(`modes.${ruleMode}.label`),
          modeDescription: t(`modes.${ruleMode}.description`),
        }),
        t("setup.singleplayerDifficultyDescription", {
          difficulty: t(`difficulties.${difficulty}.label`),
          difficultyDescription: t(`difficulties.${difficulty}.description`),
        }),
      ]
    : copy.description;
  const sectionWords = getSetupSectionWords({
    isMultiplayer,
    multiplayerStep,
    t,
    title: copy.title,
  });
  const playSetupExit = useScreenReveal(
    setupRevealRef,
    [mode, multiplayerStep, locale],
  );

  const handleBack = async () => {
    await playSetupExit();
    onBack?.();
  };

  const handleWaterColorChange = (nextWaterColorId) => {
    onWaterColorChange?.(nextWaterColorId);
  };

  const handlePlayerNameChange = (nextPlayerName) => {
    setPlayerName(nextPlayerName);
    saveSessionPlayerName(nextPlayerName);
    if (nextPlayerName.trim()) {
      setPlayerNameError(false);
    }
  };

  const handleLobbyNameChange = (nextLobbyName) => {
    setLobbyName(nextLobbyName);
    if (nextLobbyName.trim()) {
      setLobbyNameError(false);
    }
  };

  const handleLobbyPasswordChange = (nextLobbyPassword) => {
    setLobbyPassword(nextLobbyPassword);
    if (nextLobbyPassword.trim()) {
      setLobbyPasswordError(false);
    }
  };

  const validatePlayerName = () => {
    const hasPlayerName = playerName.trim().length > 0;
    setPlayerNameError(!hasPlayerName);
    return hasPlayerName;
  };

  const handleStart = async () => {
    await playSetupExit();

    onStart({
      difficulty,
      mode,
      route: copy.route,
      ruleMode,
      roundCount,
      waterColorId,
    });
  };

  const handleLobbyVisibilityChange = (nextVisibility) => {
    setLobbyVisibility(nextVisibility);
    if (nextVisibility === LOBBY_VISIBILITIES.PUBLIC) {
      setLobbyPassword("");
      setLobbyPasswordError(false);
    }
  };

  const handleCreateLobbyStep = async () => {
    if (!validatePlayerName()) return;

    await playSetupExit();
    setLobbyName((currentLobbyName) =>
      currentLobbyName.trim()
        ? currentLobbyName
        : getDefaultLobbyName(playerName, t),
    );
    setLobbyNameError(false);
    setMultiplayerStep(MULTIPLAYER_SETUP_STEPS.CREATE_DETAILS);
  };

  const handleJoinLobbyStep = async () => {
    if (!validatePlayerName()) return;
    await playSetupExit();
    setMultiplayerStep(MULTIPLAYER_SETUP_STEPS.JOIN_LIST);
  };

  const handleCreateLobby = async () => {
    if (!validatePlayerName()) {
      await playSetupExit();
      setMultiplayerStep(MULTIPLAYER_SETUP_STEPS.ACTION);
      return;
    }

    const cleanPlayerName = playerName.trim();
    const cleanLobbyName = lobbyName.trim();
    const cleanLobbyPassword = lobbyPassword.trim();
    const hasLobbyName = cleanLobbyName.length > 0;
    const hasPassword =
      lobbyVisibility !== LOBBY_VISIBILITIES.PRIVATE ||
      cleanLobbyPassword.length > 0;

    setLobbyNameError(!hasLobbyName);
    setLobbyPasswordError(!hasPassword);
    if (!hasLobbyName || !hasPassword) return;

    await playSetupExit();
    onStart({
      action: MULTIPLAYER_ACTIONS.CREATE,
      difficulty,
      mode,
      password:
        lobbyVisibility === LOBBY_VISIBILITIES.PRIVATE
          ? cleanLobbyPassword
          : "",
      playerName: cleanPlayerName,
      roomName: cleanLobbyName,
      route: copy.route,
      ruleMode,
      roundCount,
      visibility: lobbyVisibility,
      waterColorId,
    });
  };

  const handleJoinLobby = async ({ password, roomCode }) => {
    if (!validatePlayerName()) {
      await playSetupExit();
      setMultiplayerStep(MULTIPLAYER_SETUP_STEPS.ACTION);
      return;
    }

    await playSetupExit();
    onStart({
      action: MULTIPLAYER_ACTIONS.JOIN,
      mode,
      password,
      playerName: playerName.trim(),
      roomCode,
      route: copy.route,
      waterColorId,
    });
  };

  return (
    <div
      className="relative h-dvh min-h-dvh overflow-hidden bg-[#f7f7f2] text-[#0d0d0c] dark:bg-[#0d0d0c] dark:text-[#f7f7f2]"
      data-setup-screen="true"
      ref={setupRevealRef}
      style={{
        "--setup-split-x": "50vw",
        "--setup-water-color": selectedWaterColor.value,
        "--setup-water-background":
          selectedWaterColor.background || selectedWaterColor.value,
      }}
    >
      <PageUtilitySwitches placement="rail" />
      <main className="relative z-10 grid h-full min-h-0 w-full min-w-0 grid-rows-[auto_1fr]">
        <SetupTitleBand onBack={handleBack} title={copy.title} />

        <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-none lg:min-h-0 lg:grid-cols-[var(--setup-split-x)_minmax(0,1fr)]">
          <section className="mx-auto grid w-full max-w-[44rem] content-start min-w-0 px-6 pb-8 pt-8 md:px-8 md:pb-10 md:pt-10 lg:mx-0 lg:max-w-none lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)] lg:content-stretch lg:px-10 lg:pb-10 lg:pt-16">
            <SetupIntro
              description={copy.description}
              setupDescription={setupDescription}
            />

            {!isMultiplayer ? (
              <div
                className="hidden"
                data-screen-reveal="cream"
                data-setup-color-panel="true"
              >
                <div className="overflow-hidden" data-screen-reveal-row="true">
                  <WaterColorSelect
                    colors={visibleWaterColors}
                    label={t("setup.waterColor")}
                    onChange={handleWaterColorChange}
                    value={waterColorId}
                  />
                </div>
              </div>
            ) : null}

            <div
              className="hidden"
              data-setup-mobile-controls="true"
            >
              {isActionStep ? (
                <SetupTextField
                  error={playerNameError ? t("setup.playerNameRequired") : ""}
                  label={t("setup.playerName")}
                  onChange={handlePlayerNameChange}
                  placeholder={t("room.namePlaceholder")}
                  prominent
                  value={playerName}
                />
              ) : null}

              {isActionStep ? (
                <MultiplayerActionButtons
                  onCreate={handleCreateLobbyStep}
                  onJoin={handleJoinLobbyStep}
                  tall
                />
              ) : null}

              {!isMultiplayer ? (
                <div className="grid min-w-0 gap-6 md:grid-cols-2 md:items-start md:gap-7">
                  <WaterColorSelect
                    colors={visibleWaterColors}
                    label={t("setup.waterColor")}
                    onChange={handleWaterColorChange}
                    value={waterColorId}
                  />
                  <DifficultyControl
                    label={t("setup.difficulty")}
                    onChange={setDifficulty}
                    value={difficulty}
                  />
                </div>
              ) : null}

              {isJoiningLobby ? (
                <LobbyListPanel isJoining={isStarting} onJoin={handleJoinLobby} />
              ) : isCreateDetailsStep ? (
                <CreateLobbyDetailsStep
                  isCreating={isStarting}
                  lobbyName={lobbyName}
                  lobbyNameError={
                    lobbyNameError ? t("setup.lobbyNameRequired") : ""
                  }
                  lobbyPassword={lobbyPassword}
                  lobbyPasswordError={
                    lobbyPasswordError ? t("setup.lobbyPasswordRequired") : ""
                  }
                  lobbyVisibility={lobbyVisibility}
                  onCreate={handleCreateLobby}
                  onLobbyNameChange={handleLobbyNameChange}
                  onLobbyPasswordChange={handleLobbyPasswordChange}
                  onLobbyVisibilityChange={handleLobbyVisibilityChange}
                />
              ) : !isMultiplayer ? (
                <div className="grid min-w-0 gap-4 sm:gap-5">
                  <ChoiceGrid
                    label={t("setup.mode")}
                    onChange={setRuleMode}
                    options={availableRuleModeOptions}
                    value={ruleMode}
                  />
                  <Button
                    className="rounded-none shadow-[0_18px_42px_rgba(13,13,12,0.12)]"
                    disabled={isStarting}
                    onClick={handleStart}
                  >
                    {isStarting ? t("setup.creatingLobby") : copy.startLabel}
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="hidden min-h-0 grid-cols-[auto_minmax(0,1fr)] items-end gap-8 lg:grid">
              <div className="shrink-0">
                <div data-screen-reveal="cream">
                  <div className="overflow-hidden" data-screen-reveal-row="true">
                    <AppFooter />
                  </div>
                </div>
              </div>
              <div className="grid min-w-0 justify-items-center gap-7">
                <div data-screen-reveal="cream">
                  {!isMultiplayer ? (
                    <div
                      className="overflow-hidden"
                      data-screen-reveal-row="true"
                    >
                      <WaterColorSelect
                        colors={visibleWaterColors}
                        compact
                        label={t("setup.waterColor")}
                        onChange={handleWaterColorChange}
                        value={waterColorId}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section
            className="relative mx-auto grid w-full max-w-[44rem] min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-8 [background:var(--setup-water-background)] px-6 pb-8 pt-8 md:grid-cols-[auto_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] md:gap-10 md:px-8 md:pb-10 md:pt-10 lg:mx-0 lg:max-w-none lg:gap-8 lg:p-10 dark:[background:#161616]"
            data-setup-water="true"
            data-premium-water={selectedWaterColor.animated ? "true" : undefined}
            data-screen-reveal="water-bg"
          >
            <WaterColorWipe
              animated={selectedWaterColor.animated}
              color={selectedWaterColor.background || selectedWaterColor.value}
              property="--setup-water-background"
            />
            <SectionWord
              primary={sectionWords.primary}
              secondary={sectionWords.secondary}
            />
            <div
              className={[
                "grid h-full min-h-0 min-w-0 justify-items-stretch lg:min-h-0 lg:justify-items-end",
                isJoiningLobby
                  ? "grid-rows-[minmax(0,1fr)] content-stretch items-stretch lg:h-full"
                  : "content-end",
              ].join(" ")}
            >
              <div
                className={[
                  "grid w-full min-w-0 gap-5 lg:max-w-full xl:w-[82%] xl:min-w-[28rem] xl:max-w-[52rem]",
                  isJoiningLobby ? "h-full" : "",
                ].join(" ")}
                data-setup-controls-panel="true"
                data-screen-reveal="water-content"
                data-screen-reveal-direction="down"
              >
                {isActionStep ? (
                  <SetupTextField
                    error={playerNameError ? t("setup.playerNameRequired") : ""}
                    label={t("setup.playerName")}
                    onChange={handlePlayerNameChange}
                    placeholder={t("room.namePlaceholder")}
                    prominent
                    value={playerName}
                  />
                ) : null}

                {isActionStep ? (
                  <MultiplayerActionButtons
                    onCreate={handleCreateLobbyStep}
                    onJoin={handleJoinLobbyStep}
                    tall
                  />
                ) : null}

                {isJoiningLobby ? (
                  <LobbyListPanel isJoining={isStarting} onJoin={handleJoinLobby} />
                ) : isCreateDetailsStep ? (
                  <CreateLobbyDetailsStep
                    isCreating={isStarting}
                    lobbyName={lobbyName}
                    lobbyNameError={
                      lobbyNameError ? t("setup.lobbyNameRequired") : ""
                    }
                    lobbyPassword={lobbyPassword}
                    lobbyPasswordError={
                      lobbyPasswordError ? t("setup.lobbyPasswordRequired") : ""
                    }
                    lobbyVisibility={lobbyVisibility}
                    onCreate={handleCreateLobby}
                    onLobbyNameChange={handleLobbyNameChange}
                    onLobbyPasswordChange={handleLobbyPasswordChange}
                    onLobbyVisibilityChange={handleLobbyVisibilityChange}
                  />
                ) : !isMultiplayer ? (
                  <>
                    <div className="w-full min-w-0 justify-self-stretch lg:hidden">
                      <div className="grid w-full min-w-0 justify-self-stretch gap-4">
                        <div className="grid w-full min-w-0 grid-cols-2 items-start gap-3">
                          <div
                            className="min-w-0"
                            data-screen-reveal-row="true"
                            data-screen-reveal-target="self"
                          >
                            <DifficultyControl
                              label={t("setup.difficulty")}
                              onChange={setDifficulty}
                              value={difficulty}
                            />
                          </div>
                          <div
                            className="min-w-0"
                            data-screen-reveal-row="true"
                            data-screen-reveal-target="self"
                          >
                            <RoundCountControl
                              label={t("setup.levels")}
                              onChange={setRoundCount}
                              value={roundCount}
                            />
                          </div>
                        </div>
                        <div
                          className="min-w-0"
                          data-screen-reveal-row="true"
                          data-screen-reveal-target="self"
                        >
                          <MobileSetupButton
                            icon={SelectedRuleModeIcon}
                            label={t("setup.mode")}
                            onClick={() => setMobileSetupModal("mode")}
                            value={selectedRuleModeLabel}
                            wide
                          />
                        </div>
                        <div
                          className="grid w-full min-w-0 grid-cols-[60px_minmax(0,1fr)] items-center gap-3"
                          data-screen-reveal-row="true"
                          data-screen-reveal-target="self"
                        >
                          <MobileSetupButton
                            buttonSizeClassName="h-[60px]"
                            icon={Palette}
                            label={t("setup.waterColor")}
                            onClick={() => setMobileSetupModal("color")}
                            showLabel={false}
                            wrapperSizeClassName="w-[60px]"
                          />
                          <Button
                            className="h-[var(--pc-choice-height)] rounded-none px-3 shadow-[0_18px_42px_rgba(13,13,12,0.12)]"
                            disabled={isStarting}
                            onClick={handleStart}
                          >
                            {isStarting
                              ? t("setup.creatingLobby")
                              : copy.startLabel}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="hidden min-w-0 grid-cols-2 gap-4 lg:grid lg:gap-5">
                      <div
                        className="min-w-0"
                        data-screen-reveal-row="true"
                        data-screen-reveal-target="self"
                      >
                        <DifficultyControl
                          label={t("setup.difficulty")}
                          onChange={setDifficulty}
                          value={difficulty}
                        />
                      </div>
                      <div
                        className="min-w-0"
                        data-screen-reveal-row="true"
                        data-screen-reveal-target="self"
                      >
                        <RoundCountControl
                          label={t("setup.levels")}
                          onChange={setRoundCount}
                          value={roundCount}
                        />
                      </div>
                      <div
                        className="min-w-0 lg:col-span-2"
                        data-screen-reveal-row="true"
                        data-screen-reveal-target="self"
                      >
                        <ChoiceGrid
                          label={t("setup.mode")}
                          onChange={setRuleMode}
                          options={availableRuleModeOptions}
                          value={ruleMode}
                        />
                      </div>
                    </div>
                    <div
                      className="hidden lg:block"
                      data-screen-reveal-row="true"
                      data-screen-reveal-target="self"
                    >
                      <Button
                        className="rounded-none shadow-[0_18px_42px_rgba(13,13,12,0.12)]"
                        disabled={isStarting}
                        onClick={handleStart}
                      >
                        {isStarting ? t("setup.creatingLobby") : copy.startLabel}
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </section>
        </section>
      </main>
      {!isMultiplayer && mobileSetupModal === "color" ? (
        <MobileSetupModal
          onClose={() => setMobileSetupModal(null)}
          title={t("setup.waterColor")}
        >
          <WaterColorSelect
            colors={visibleWaterColors}
            label={t("setup.waterColor")}
            onChange={handleWaterColorChange}
            showLabel={false}
            value={waterColorId}
          />
        </MobileSetupModal>
      ) : null}
      {!isMultiplayer && mobileSetupModal === "mode" ? (
        <MobileSetupModal
          onClose={() => setMobileSetupModal(null)}
          title={t("setup.mode")}
        >
          <ChoiceGrid
            label={t("setup.mode")}
            modalGrid
            onChange={setRuleMode}
            options={availableRuleModeOptions}
            showLabel={false}
            value={ruleMode}
          />
        </MobileSetupModal>
      ) : null}
    </div>
  );
}
