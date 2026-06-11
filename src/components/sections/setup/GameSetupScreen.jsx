"use client";

import { useEffect, useRef, useState } from "react";
import {
  CircleDot,
  Columns2,
  Droplet,
  Eye,
  EyeOff,
  Flag,
  Gauge,
  Globe2,
  Infinity,
  Lock,
  Palette,
  RotateCcw,
  Shuffle,
  Timer,
} from "lucide-react";
import AppFooter from "@/components/layout/AppFooter";
import PageUtilitySwitches from "@/components/layout/PageUtilitySwitches";
import SectionWord from "@/components/layout/SectionWord";
import Button from "@/components/ui/Button";
import WaterColorWipe from "@/components/ui/WaterColorWipe";
import LobbyListPanel from "@/components/sections/setup/LobbyListPanel";
import { useTranslation } from "@/hooks/useLanguage";
import { useLoopingSlider } from "@/hooks/useLoopingSlider";
import { useScreenReveal } from "@/hooks/useScreenReveal";
import {
  GAME_DIFFICULTIES,
  GAME_RULE_MODES,
  MENU_MODES,
  MODE_GRID_ORDER,
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
      "Choose the rule, tune the water feel, and start a five-round run built around touch instead of luck.",
    startLabel: "Start Singleplayer",
    route: ROUTES.SINGLEPLAYER,
  },
  [MENU_MODES.MULTIPLAYER]: {
    title: "Multiplayer",
    description:
      "Shape the match rules before the lobby opens, then carry the same clean five-round flow into a shared run.",
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

function getDefaultLobbyName(playerName) {
  const cleanPlayerName = String(playerName || "").trim();
  return cleanPlayerName ? `${cleanPlayerName}'s lobby` : "Pourcision lobby";
}

function getSetupSectionWords({ isMultiplayer, multiplayerStep, title }) {
  if (!isMultiplayer) {
    return {
      primary: title.toUpperCase(),
      secondary: "SETUP",
    };
  }

  if (multiplayerStep === MULTIPLAYER_SETUP_STEPS.CREATE_DETAILS) {
    return {
      primary: "LOBBY",
      secondary: "CREATE",
    };
  }

  if (multiplayerStep === MULTIPLAYER_SETUP_STEPS.JOIN_LIST) {
    return {
      primary: "LOBBIES",
      secondary: "BROWSE",
    };
  }

  return {
    primary: "NAME",
    secondary: "PLAYER",
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
    icon: EyeOff,
    title: "Blind",
    description: "No guide line. Adjust freely, then lock.",
  },
  {
    id: GAME_RULE_MODES.FAKE_TARGET,
    icon: Flag,
    title: "Fake Target",
    description: "Two target lines. One is a trap.",
  },
  {
    id: GAME_RULE_MODES.REVERSE_POUR,
    icon: RotateCcw,
    title: "Reverse Pour",
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
    id: GAME_RULE_MODES.ENDLESS,
    icon: Infinity,
    title: "Endless",
    description: "No score. Pour freely until you leave.",
    singleplayerOnly: true,
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
    title: "Ten or Zero",
    description: "Hit the narrow zone for ten, miss it for zero.",
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
        aria-label="Geri gel"
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
  } = useLoopingSlider(options.length);
  const visibleOptions = modalGrid ? options : [...options, ...options, ...options];

  return (
    <div className="min-w-0 space-y-3" data-sound-group="game-mode">
      {showLabel ? (
        <p className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58">
          {label}
        </p>
      ) : null}
      <div
        className={[
          "grid min-w-0 bg-[#0d0d0c]/[0.035] shadow-[0_22px_48px_rgba(13,13,12,0.08)] dark:bg-[#f7f7f2]/6 dark:shadow-[0_24px_60px_rgba(0,0,0,0.32)]",
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
          const optionIndex = modalGrid ? loopIndex : loopIndex % options.length;
          const cycleIndex = modalGrid ? 1 : Math.floor(loopIndex / options.length);
          const isDesktopCopy = modalGrid || cycleIndex === 1;
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
              key={`${option.id}-${cycleIndex}`}
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
    <div className="min-w-0 space-y-3">
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

function WaterColorSelect({
  label,
  value,
  onChange,
  compact = false,
  showLabel = true,
}) {
  const { t } = useTranslation();
  const sliderRef = useRef(null);
  const dragRef = useRef({
    active: false,
    moved: false,
    suppressClick: false,
    scrollLeft: 0,
    targetColorId: null,
    x: 0,
  });
  const scrollMotionRef = useRef({
    frame: 0,
    targetLeft: 0,
  });
  const selectedColor =
    WATER_COLORS.find((color) => color.id === value) ?? WATER_COLORS[0];
  const visibleColors = [...WATER_COLORS, ...WATER_COLORS, ...WATER_COLORS];

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const segmentWidth = slider.scrollWidth / 3;
    slider.scrollLeft = segmentWidth;
  }, []);

  useEffect(() => {
    const motion = scrollMotionRef.current;

    return () => {
      if (motion.frame) {
        window.cancelAnimationFrame(motion.frame);
      }
    };
  }, []);

  const normalizeScrollPosition = (targetLeft = null) => {
    const slider = sliderRef.current;
    if (!slider) return targetLeft;

    const segmentWidth = slider.scrollWidth / 3;
    if (!segmentWidth) return targetLeft;

    let nextTargetLeft = targetLeft;
    if (slider.scrollLeft < segmentWidth * 0.45) {
      slider.scrollLeft += segmentWidth;
      if (nextTargetLeft !== null) {
        nextTargetLeft += segmentWidth;
      }
    }
    if (slider.scrollLeft > segmentWidth * 1.55) {
      slider.scrollLeft -= segmentWidth;
      if (nextTargetLeft !== null) {
        nextTargetLeft -= segmentWidth;
      }
    }
    return nextTargetLeft;
  };

  const stopScrollAnimation = () => {
    const motion = scrollMotionRef.current;
    if (!motion.frame) return;

    window.cancelAnimationFrame(motion.frame);
    motion.frame = 0;
  };

  const animateScrollTo = (targetLeft) => {
    const slider = sliderRef.current;
    if (!slider) return;

    const motion = scrollMotionRef.current;
    motion.targetLeft = normalizeScrollPosition(targetLeft) ?? targetLeft;
    if (motion.frame) return;

    const tick = () => {
      const activeSlider = sliderRef.current;
      if (!activeSlider) {
        motion.frame = 0;
        return;
      }

      motion.targetLeft =
        normalizeScrollPosition(motion.targetLeft) ?? motion.targetLeft;

      const distance = motion.targetLeft - activeSlider.scrollLeft;
      if (Math.abs(distance) < 0.35) {
        activeSlider.scrollLeft = motion.targetLeft;
        motion.frame = 0;
        normalizeScrollPosition();
        return;
      }

      activeSlider.scrollLeft += distance * 0.18;
      motion.frame = window.requestAnimationFrame(tick);
    };

    motion.frame = window.requestAnimationFrame(tick);
  };

  const getWheelStep = () => {
    const slider = sliderRef.current;
    if (!slider) return compact ? 58 : 68;

    const colorButtons = slider.querySelectorAll("[data-color-id]");
    const firstRect = colorButtons[0]?.getBoundingClientRect();
    const secondRect = colorButtons[1]?.getBoundingClientRect();
    if (firstRect && secondRect) {
      return Math.abs(secondRect.left - firstRect.left);
    }

    const buttonWidth = firstRect?.width ?? (compact ? 48 : 56);
    return buttonWidth + (compact ? 10 : 12);
  };

  const handleScroll = () => {
    if (dragRef.current.active || scrollMotionRef.current.frame) return;

    normalizeScrollPosition();
  };

  const handlePointerDown = (event) => {
    const slider = sliderRef.current;
    if (!slider) return;

    stopScrollAnimation();
    const colorButton = event.target.closest("[data-color-id]");

    dragRef.current = {
      active: true,
      moved: false,
      suppressClick: false,
      scrollLeft: slider.scrollLeft,
      targetColorId: colorButton?.dataset.colorId ?? null,
      x: event.clientX,
    };
    slider.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const slider = sliderRef.current;
    const drag = dragRef.current;
    if (!slider || !drag.active) return;

    const distance = event.clientX - drag.x;
    if (Math.abs(distance) > 4) {
      drag.moved = true;
    }
    if (drag.moved) {
      slider.scrollLeft = drag.scrollLeft - distance;
    }
  };

  const handlePointerUp = (event) => {
    const slider = sliderRef.current;
    const drag = dragRef.current;
    if (slider?.hasPointerCapture(event.pointerId)) {
      slider.releasePointerCapture(event.pointerId);
    }
    if (!drag.moved && drag.targetColorId) {
      const colorIndex = WATER_COLORS.findIndex(
        (color) => color.id === drag.targetColorId,
      );
      playWaterColorSelect(Math.max(0, colorIndex));
      onChange(drag.targetColorId);
    }
    dragRef.current.active = false;
    dragRef.current.suppressClick = true;
    window.setTimeout(() => {
      dragRef.current.suppressClick = false;
    }, 0);
    normalizeScrollPosition();
  };

  const handleColorSelect = (event, colorId, colorIndex) => {
    if (dragRef.current.suppressClick) {
      event.preventDefault();
      return;
    }
    playWaterColorSelect(colorIndex);
    onChange(colorId);
  };

  const handleWheel = (event) => {
    const slider = sliderRef.current;
    if (!slider) return;

    const delta =
      Math.abs(event.deltaY) > Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX;
    if (!delta) return;

    event.preventDefault();
    const motion = scrollMotionRef.current;
    const baseLeft = motion.frame ? motion.targetLeft : slider.scrollLeft;
    animateScrollTo(baseLeft + Math.sign(delta) * getWheelStep());
  };

  return (
    <div className="min-w-0 space-y-3">
      {showLabel ? (
        <p className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58">
          {label}{" "}
          <span data-water-color-name="true" style={{ color: selectedColor.value }}>
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
          "cursor-grab active:cursor-grabbing",
          "overscroll-contain",
          "h-[var(--pc-swatch-size)]",
          compact
            ? "w-full max-w-full lg:max-w-[18rem] xl:max-w-[22rem] 2xl:max-w-[28rem]"
            : "w-full max-w-full sm:max-w-[34rem]",
        ].join(" ")}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerCancel={handlePointerUp}
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
                data-sound-index={index % WATER_COLORS.length}
                data-sound-kind="water-color"
                key={`${color.id}-${index}`}
                onClick={(event) =>
                  handleColorSelect(event, color.id, index % WATER_COLORS.length)
                }
                style={{
                  backgroundColor: color.value,
                  boxShadow: selected
                    ? "inset 0 -8px 0 #0d0d0c, 0 14px 28px rgba(13,13,12,0.14)"
                    : "none",
                }}
                type="button"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MobileSetupModal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-[#0d0d0c]/45 p-4 backdrop-blur-[2px] md:hidden">
      <button
        aria-label="Close setup panel"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <section className="relative z-10 grid w-full max-w-[26rem] gap-6 bg-[#f7f7f2] p-5 text-[#0d0d0c] shadow-[0_28px_80px_rgba(13,13,12,0.34)] dark:bg-[#161616] dark:text-[#f7f7f2]">
        <div className="flex items-start justify-between gap-5">
          <h2 className="pc-label text-[#0d0d0c]/70 dark:text-[#f7f7f2]/70">
            {title}
          </h2>
          <button
            aria-label="Close setup panel"
            className="grid size-10 shrink-0 place-items-center bg-[#0d0d0c] text-[#f7f7f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2] dark:text-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]"
            onClick={onClose}
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
        </div>
        {children}
      </section>
    </div>
  );
}

function MobileSetupButton({ icon: Icon, label, onClick }) {
  return (
    <div className="grid w-[var(--pc-choice-height)] grid-rows-[auto_var(--pc-choice-height)] gap-3">
      <p className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58">
        {label}
      </p>
      <button
        aria-label={label}
        className="grid h-[var(--pc-choice-height)] min-w-0 place-items-center bg-[#f7f7f2]/96 text-[#0d0d0c] shadow-[0_18px_38px_rgba(13,13,12,0.08)] transition-colors duration-200 hover:bg-white focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2] dark:hover:bg-[#f7f7f2]/14 dark:focus-visible:outline-[#f7f7f2]"
        onClick={onClick}
        type="button"
      >
        <Icon aria-hidden="true" className="pc-icon" strokeWidth={2.7} />
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
  placeholder = "Player",
  prominent = false,
  trailingAction = null,
  type = "text",
  value,
}) {
  return (
    <div className="w-full max-w-none space-y-2.5">
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
    <div className="min-w-0 space-y-3">
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
        data-screen-reveal-target="self"
      >
        <SetupTextField
          error={lobbyNameError}
          label={t("setup.lobbyName")}
          onChange={onLobbyNameChange}
          placeholder="Pourcision lobby"
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
                  showLobbyPassword ? "Hide password" : "Show password"
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

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <Button
          className="rounded-none shadow-[0_18px_42px_rgba(13,13,12,0.12)]"
          data-screen-reveal-row="true"
          data-screen-reveal-target="self"
          disabled={isCreating}
          onClick={onCreate}
        >
          {isCreating ? t("setup.creatingLobby") : t("setup.createLobby")}
        </Button>

        <div
          data-screen-reveal-row="true"
          data-screen-reveal-target="self"
        >
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
  const { t } = useTranslation();
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
  const [difficulty, setDifficulty] = useState(GAME_DIFFICULTIES.NORMAL);
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
    title: copy.title,
  });
  const playSetupExit = useScreenReveal(
    setupRevealRef,
    [mode, multiplayerStep],
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
        : getDefaultLobbyName(playerName),
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
                className="mt-7 hidden min-w-0 md:block lg:hidden"
                data-screen-reveal="cream"
                data-setup-color-panel="true"
              >
                <div className="overflow-hidden" data-screen-reveal-row="true">
                  <WaterColorSelect
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
                  placeholder="Player"
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
            className="relative mx-auto grid w-full max-w-[44rem] min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-[var(--setup-water-color)] px-6 pb-8 pt-8 md:px-8 md:pb-10 md:pt-10 lg:mx-0 lg:max-w-none lg:p-10 dark:bg-[#161616]"
            data-setup-water="true"
            data-screen-reveal="water-bg"
          >
            <WaterColorWipe
              color={selectedWaterColor.value}
              property="--setup-water-color"
            />
            <SectionWord
              primary={sectionWords.primary}
              secondary={sectionWords.secondary}
            />
            <div
              className={[
                "grid h-full min-h-0 min-w-0 justify-items-stretch pt-8 md:pt-10 lg:min-h-0 lg:justify-items-end lg:pt-0",
                isJoiningLobby
                  ? "grid-rows-[minmax(0,1fr)] content-stretch items-stretch lg:h-full"
                  : "content-end",
              ].join(" ")}
            >
              <div
                className={[
                  "grid w-full min-w-0 gap-5 lg:w-[82%] lg:min-w-[28rem] lg:max-w-[52rem]",
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
                    placeholder="Player"
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
                    <div className="w-full min-w-0 justify-self-stretch md:hidden">
                      <div className="grid w-full min-w-0 justify-self-stretch grid-cols-[minmax(0,1fr)_var(--pc-choice-height)_var(--pc-choice-height)] items-start gap-3">
                        <DifficultyControl
                          label={t("setup.difficulty")}
                          onChange={setDifficulty}
                          value={difficulty}
                        />
                        <MobileSetupButton
                          icon={Palette}
                          label="Color"
                          onClick={() => setMobileSetupModal("color")}
                        />
                        <MobileSetupButton
                          icon={Shuffle}
                          label="Mode"
                          onClick={() => setMobileSetupModal("mode")}
                        />
                      </div>
                    </div>

                    <div className="hidden min-w-0 grid-cols-2 gap-4 md:grid lg:grid-cols-1 lg:gap-5">
                      <div className="min-w-0">
                        <DifficultyControl
                          label={t("setup.difficulty")}
                          onChange={setDifficulty}
                          value={difficulty}
                        />
                      </div>
                      <div className="min-w-0 md:col-span-2 lg:col-span-1">
                        <ChoiceGrid
                          label={t("setup.mode")}
                          onChange={setRuleMode}
                          options={availableRuleModeOptions}
                          value={ruleMode}
                        />
                      </div>
                    </div>
                    <Button
                      className="rounded-none shadow-[0_18px_42px_rgba(13,13,12,0.12)]"
                      disabled={isStarting}
                      onClick={handleStart}
                    >
                      {isStarting ? t("setup.creatingLobby") : copy.startLabel}
                    </Button>
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
