"use client";

import { useEffect, useRef, useState } from "react";
import {
  CircleDot,
  Clipboard,
  Columns2,
  Droplet,
  EyeOff,
  Flag,
  Gauge,
  Lock,
  Palette,
  Pencil,
  RotateCcw,
  Shuffle,
  Timer,
  UserMinus,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useLanguage";
import { useLoopingSlider } from "@/hooks/useLoopingSlider";
import {
  DIFFICULTY_OPTIONS,
  GAME_RULE_MODES,
  GAME_MODE_OPTIONS,
  MODE_GRID_ORDER,
  WATER_COLORS,
} from "@/lib/constants";
import {
  playDifficultySelect,
  playGameModeSelect,
  playWaterColorSelect,
} from "@/lib/sound";

const modeIcons = {
  [GAME_RULE_MODES.BLIND]: EyeOff,
  [GAME_RULE_MODES.CLASSIC]: CircleDot,
  [GAME_RULE_MODES.CHAOS_QUEUE]: Shuffle,
  [GAME_RULE_MODES.FAKE_TARGET]: Flag,
  [GAME_RULE_MODES.LEAKY]: Droplet,
  [GAME_RULE_MODES.PERFECT_OR_NOTHING]: CircleDot,
  [GAME_RULE_MODES.REVERSE_POUR]: RotateCcw,
  [GAME_RULE_MODES.SPLIT_FILL]: Columns2,
  [GAME_RULE_MODES.TILT]: Gauge,
};

function orderModeOptions(options) {
  const order = new Map(MODE_GRID_ORDER.map((id, index) => [id, index]));

  return [...options].sort(
    (first, second) =>
      (order.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(second.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

function LobbyDifficultyControl({
  disabled,
  label,
  onChange,
  value,
}) {
  const { t } = useTranslation();

  return (
    <div className="min-w-0 space-y-3">
      <p className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58">
        {label}
      </p>
      <div className="w-full">
        <div className="grid grid-cols-3 bg-[#0d0d0c]/[0.035] shadow-[0_18px_38px_rgba(13,13,12,0.07)] dark:bg-[#f7f7f2]/6 dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
          {DIFFICULTY_OPTIONS.map((option, optionIndex) => {
            const selected = value === option.id;

            return (
              <button
                aria-pressed={selected}
                className={[
                  "pc-choice pc-difficulty-choice transition-colors duration-200 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]",
                  selected
                    ? "bg-[#0d0d0c] text-white dark:bg-[#f7f7f2] dark:text-[#0d0d0c]"
                    : "bg-[#f7f7f2]/96 text-[#0d0d0c]/72 hover:bg-[#f7f7f2] dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2]/70 dark:hover:bg-[#f7f7f2]/14",
                  disabled && !selected ? "opacity-70" : "",
                ].join(" ")}
                disabled={disabled}
                key={option.id}
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

function LobbyModeGrid({
  disabled,
  label,
  onChange,
  value,
  modalGrid = false,
  showLabel = true,
}) {
  const { t } = useTranslation();
  const options = orderModeOptions(
    GAME_MODE_OPTIONS.filter(
      (option) => option.id !== GAME_RULE_MODES.ENDLESS,
    ),
  );
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
          const Icon = modeIcons[option.id] ?? Timer;
          const optionLabel = t(`modes.${option.id}.label`);
          const optionDescription = t(`modes.${option.id}.description`);

          return (
            <button
              aria-label={`${optionLabel}. ${optionDescription}`}
              aria-pressed={selected}
              className={[
                "pc-choice flex min-w-0 items-center justify-center px-3 py-2 text-center transition-colors duration-200 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] min-[420px]:px-4 lg:px-4 lg:py-3 dark:focus-visible:outline-[#f7f7f2]",
                isDesktopCopy ? "" : "lg:hidden",
                selected
                  ? "bg-[#0d0d0c] text-white dark:bg-[#f7f7f2] dark:text-[#0d0d0c]"
                  : "bg-[#f7f7f2]/96 text-[#0d0d0c] hover:bg-[#f7f7f2] dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2] dark:hover:bg-[#f7f7f2]/14",
                disabled && !selected ? "opacity-70" : "",
              ].join(" ")}
              disabled={disabled}
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
                  {optionLabel}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LobbyPlayersPanel({
  currentPlayerId,
  isHost,
  onKickPlayer,
  players,
}) {
  const { t } = useTranslation();
  const lobbyPlayers = players || [];

  return (
    <div
      className="grid h-full min-h-0 w-full min-w-0"
      data-screen-reveal-row="true"
      data-screen-reveal-target="self"
    >
      <div className="grid min-h-0 content-start overflow-y-auto bg-[#f7f7f2]/92 p-3 shadow-[0_22px_48px_rgba(13,13,12,0.08)] overscroll-contain [scrollbar-width:none] dark:bg-[#f7f7f2]/8 dark:shadow-[0_24px_60px_rgba(0,0,0,0.24)] [&::-webkit-scrollbar]:hidden">
        {lobbyPlayers.map((player, playerIndex) => {
          const canKick =
            isHost && !player.isHost && player.id !== currentPlayerId;
          const isCurrentPlayer = player.id === currentPlayerId;
          const isPlayerHost = Boolean(player.isHost);
          const playerColor =
            WATER_COLORS.find((color) => color.id === player.waterColorId)
              ?.value || "#0d0d0c";

          return (
            <div
              className="grid min-h-11 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#0d0d0c]/8 px-1 py-2.5 text-[#0d0d0c] last:border-b-0 dark:border-[#f7f7f2]/10 dark:text-[#f7f7f2]"
              key={player.id}
            >
              <span className="pc-round-label w-7 shrink-0 tabular-nums text-[#0d0d0c]/38 dark:text-[#f7f7f2]/42">
                {String(playerIndex + 1).padStart(2, "0")}
              </span>
              <span
                aria-hidden="true"
                className="h-7 w-1 shrink-0"
                style={{ backgroundColor: playerColor }}
              />
              <span className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 truncate text-sm font-semibold leading-none text-[#0d0d0c]/88 dark:text-[#f7f7f2]/88">
                  {player.name}
                </span>
                {isCurrentPlayer ? (
                  <span className="pc-round-label shrink-0 text-[#0d0d0c]/42 dark:text-[#f7f7f2]/46">
                    {t("room.you")}
                  </span>
                ) : null}
              </span>
              <span
                className={[
                  "inline-flex items-center gap-2 pl-2",
                ].join(" ")}
              >
                {isPlayerHost ? (
                  <span className="pc-round-label text-[#0d0d0c]/46 dark:text-[#f7f7f2]/42">
                    {t("room.host")}
                  </span>
                ) : null}
                {canKick ? (
                  <button
                    aria-label={t("room.kickPlayer", { name: player.name })}
                    className="grid h-7 w-7 place-items-center text-[#0d0d0c]/54 transition-colors hover:text-[#0d0d0c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:text-[#f7f7f2]/54 dark:hover:text-[#f7f7f2] dark:focus-visible:outline-[#f7f7f2]"
                    onClick={() => onKickPlayer(player.id)}
                    type="button"
                  >
                    <UserMinus className="pc-inline-icon" strokeWidth={2.3} />
                  </button>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LobbyWaterColorPanel({
  disabled = false,
  label,
  onChange,
  showLabel = true,
  takenColorIds = [],
  value,
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
  const takenColorSet = new Set(takenColorIds);
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
    if (!slider) return 58;

    const colorButtons = slider.querySelectorAll("[data-color-id]");
    const firstRect = colorButtons[0]?.getBoundingClientRect();
    const secondRect = colorButtons[1]?.getBoundingClientRect();
    if (firstRect && secondRect) {
      return Math.abs(secondRect.left - firstRect.left);
    }

    return (firstRect?.width ?? 48) + 10;
  };

  const handleScroll = () => {
    if (dragRef.current.active || scrollMotionRef.current.frame) return;

    normalizeScrollPosition();
  };

  const handlePointerDown = (event) => {
    if (disabled) return;

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
    const isTaken =
      drag.targetColorId &&
      takenColorSet.has(drag.targetColorId) &&
      drag.targetColorId !== value;

    if (!disabled && !drag.moved && drag.targetColorId && !isTaken) {
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
    const isTaken = takenColorSet.has(colorId) && colorId !== value;
    if (disabled || isTaken || dragRef.current.suppressClick) {
      event.preventDefault();
      return;
    }
    playWaterColorSelect(colorIndex);
    onChange(colorId);
  };

  const handleWheel = (event) => {
    const slider = sliderRef.current;
    if (!slider || disabled) return;

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
        className={[
          "grid min-w-0 items-center overflow-x-auto overflow-y-hidden",
          "[&::-webkit-scrollbar]:hidden",
          "cursor-grab active:cursor-grabbing",
          "overscroll-contain",
          "h-[var(--pc-swatch-size)]",
          "w-full max-w-full lg:max-w-[18rem] xl:max-w-[22rem] 2xl:max-w-[28rem]",
          disabled ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
        data-water-color-slider="true"
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
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
        <div className="flex w-max flex-nowrap gap-2.5">
          {visibleColors.map((color, index) => {
            const selected = value === color.id;
            const isTaken = takenColorSet.has(color.id) && !selected;

            return (
              <button
                aria-disabled={isTaken}
                aria-label={
                  isTaken
                    ? `${t(`colors.${color.id}`)} kullanılıyor`
                    : `${t(`colors.${color.id}`)} ${label}`
                }
                aria-pressed={selected}
                className={[
                  "pc-swatch relative grid shrink-0 place-items-center overflow-hidden transition-[box-shadow,filter] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]",
                  isTaken ? "cursor-not-allowed" : "",
                ].join(" ")}
                data-color-id={color.id}
                key={`${color.id}-${index}`}
                onClick={(event) =>
                  handleColorSelect(
                    event,
                    color.id,
                    index % WATER_COLORS.length,
                  )
                }
                style={{
                  backgroundColor: color.value,
                  boxShadow: selected
                    ? "inset 0 -8px 0 #0d0d0c, 0 14px 28px rgba(13,13,12,0.14)"
                    : "none",
                }}
                type="button"
              >
                {isTaken ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-[#0d0d0c]/20 dark:bg-[#0d0d0c]/30"
                    />
                    <Lock
                      aria-hidden="true"
                      className="pc-icon relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
                      strokeWidth={3}
                    />
                  </>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LobbySettingsModal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-[#0d0d0c]/45 p-4 backdrop-blur-[2px] md:hidden">
      <button
        aria-label="Close lobby settings"
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
            aria-label="Close lobby settings"
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

function LobbySettingsButton({ icon: Icon, label, onClick }) {
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

export default function LobbyCard({
  canStartGame = true,
  currentPlayer,
  error,
  isStarting,
  isUpdatingPlayerColor,
  isUpdatingSettings,
  onCopyInvite,
  onDifficultyChange,
  onKickPlayer,
  onSettingsOpenChange,
  onWaterColorChange,
  onRuleModeChange,
  onStart,
  room,
  takenColorIds = [],
}) {
  const { t } = useTranslation();
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [mobileSettingsModal, setMobileSettingsModal] = useState(null);
  const isHost = Boolean(currentPlayer?.isHost);
  const canEditSettings = isHost;
  const canOpenColorSettings = !canEditSettings;
  const isSettingsOpen = canEditSettings && isEditingSettings;
  const settingsDisabled = isUpdatingSettings;

  const handleEditToggle = () => {
    const next = !isEditingSettings;
    setIsEditingSettings(next);
    onSettingsOpenChange?.(next);
    if (!next) setMobileSettingsModal(null);
  };

  return (
    <section
      className={[
        "h-full min-h-0 w-full min-w-0 gap-5 lg:w-[82%] lg:min-w-[28rem] lg:max-w-[52rem]",
        isSettingsOpen
          ? "flex flex-col justify-end"
          : "grid content-end",
      ].join(" ")}
    >
      <div
        className={[
          "grid min-w-0 gap-5",
          !isSettingsOpen
            ? "min-h-0"
            : "",
        ].join(" ")}
      >
        {isSettingsOpen ? (
          <>
            <div
              className="w-full min-w-0 justify-self-stretch md:hidden"
              data-screen-reveal-row="true"
              data-screen-reveal-target="self"
            >
              <div className="grid w-full min-w-0 justify-self-stretch grid-cols-[minmax(0,1fr)_var(--pc-choice-height)_var(--pc-choice-height)] items-start gap-3">
                <LobbyDifficultyControl
                  disabled={settingsDisabled}
                  label={t("setup.difficulty")}
                  onChange={onDifficultyChange}
                  value={room.difficulty}
                />
                <LobbySettingsButton
                  icon={Palette}
                  label="Color"
                  onClick={() => setMobileSettingsModal("color")}
                />
                <LobbySettingsButton
                  icon={Shuffle}
                  label="Mode"
                  onClick={() => setMobileSettingsModal("mode")}
                />
              </div>
            </div>

            <div className="hidden min-w-0 grid-cols-2 gap-4 md:grid lg:grid-cols-1 lg:gap-5">
              <div className="min-w-0">
                <LobbyDifficultyControl
                  disabled={settingsDisabled}
                  label={t("setup.difficulty")}
                  onChange={onDifficultyChange}
                  value={room.difficulty}
                />
              </div>

              <div className="min-w-0 md:col-span-2 lg:col-span-1">
                <LobbyModeGrid
                  disabled={settingsDisabled}
                  label={t("setup.mode")}
                  onChange={onRuleModeChange}
                  value={room.ruleMode}
                />
              </div>
            </div>
          </>
        ) : (
          <LobbyPlayersPanel
            currentPlayerId={currentPlayer?.id}
            isHost={isHost}
            onKickPlayer={onKickPlayer}
            players={room.players}
          />
        )}

        {error ? (
          <p
            className="pc-copy-strong text-[#0d0d0c] dark:text-[#f7f7f2]"
            data-screen-reveal-row="true"
            data-screen-reveal-target="self"
          >
            {error}
          </p>
        ) : null}
      </div>

      <div
        className={[
          "grid gap-4 lg:gap-5",
          canEditSettings
            ? "grid-cols-[var(--pc-action-height)_var(--pc-action-height)_minmax(0,1fr)] sm:grid-cols-[var(--pc-action-height)_minmax(0,1fr)_minmax(0,1fr)]"
            : canOpenColorSettings
              ? "grid-cols-[var(--pc-action-height)_minmax(0,1fr)_minmax(0,1fr)] md:grid-cols-2"
            : "grid-cols-2",
        ].join(" ")}
      >
        {canEditSettings ? (
          <button
            aria-label="Edit game settings"
            aria-pressed={isSettingsOpen}
            data-screen-reveal-row="true"
            data-screen-reveal-target="self"
            className={[
              "pc-action grid aspect-square place-items-center p-0 shadow-[0_18px_38px_rgba(13,13,12,0.08)] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] dark:focus-visible:outline-[#f7f7f2]",
              isSettingsOpen
                ? "bg-[#0d0d0c] text-white dark:bg-[#f7f7f2] dark:text-[#0d0d0c]"
                : "bg-[#f7f7f2]/96 text-[#0d0d0c] hover:bg-white dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2] dark:hover:bg-[#f7f7f2]/14",
            ].join(" ")}
            onClick={handleEditToggle}
            type="button"
          >
            <Pencil aria-hidden="true" className="pc-icon" strokeWidth={2.5} />
          </button>
        ) : null}

        {canOpenColorSettings ? (
          <button
            aria-label={t("setup.waterColor")}
            data-screen-reveal-row="true"
            data-screen-reveal-target="self"
            className="pc-action grid aspect-square place-items-center bg-[#f7f7f2]/96 p-0 text-[#0d0d0c] shadow-[0_18px_38px_rgba(13,13,12,0.08)] transition-colors duration-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] md:hidden dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2] dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] dark:hover:bg-[#f7f7f2]/14 dark:focus-visible:outline-[#f7f7f2]"
            onClick={() => setMobileSettingsModal("color")}
            type="button"
          >
            <Palette aria-hidden="true" className="pc-icon" strokeWidth={2.5} />
          </button>
        ) : null}

        <button
          aria-label={t("room.copyInvite")}
          data-screen-reveal-row="true"
          data-screen-reveal-target="self"
          className="pc-action grid w-full place-items-center bg-[#f7f7f2]/96 text-[#0d0d0c] shadow-[0_18px_38px_rgba(13,13,12,0.08)] transition-colors duration-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2] dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] dark:hover:bg-[#f7f7f2]/14 dark:focus-visible:outline-[#f7f7f2]"
          onClick={onCopyInvite}
          type="button"
        >
          <span className="inline-flex items-center gap-3">
            <Clipboard aria-hidden="true" className="pc-icon" />
            <span className="hidden sm:inline">{t("room.copyInvite")}</span>
          </span>
        </button>

        <Button
          className="rounded-none shadow-[0_18px_42px_rgba(13,13,12,0.12)]"
          data-screen-reveal-row="true"
          data-screen-reveal-target="self"
          disabled={!isHost || isStarting || !canStartGame}
          onClick={onStart}
        >
          {isHost
            ? isStarting
              ? t("common.loading")
              : t("room.startGame")
            : t("room.waiting")}
        </Button>
      </div>

      {mobileSettingsModal === "color" ? (
        <LobbySettingsModal
          onClose={() => setMobileSettingsModal(null)}
          title={t("setup.waterColor")}
        >
          <LobbyWaterColorPanel
            disabled={isUpdatingPlayerColor || settingsDisabled}
            label={t("setup.waterColor")}
            onChange={onWaterColorChange}
            showLabel={false}
            takenColorIds={takenColorIds}
            value={currentPlayer?.waterColorId}
          />
        </LobbySettingsModal>
      ) : null}

      {isSettingsOpen && mobileSettingsModal === "mode" ? (
        <LobbySettingsModal
          onClose={() => setMobileSettingsModal(null)}
          title={t("setup.mode")}
        >
          <LobbyModeGrid
            disabled={settingsDisabled}
            label={t("setup.mode")}
            modalGrid
            onChange={onRuleModeChange}
            showLabel={false}
            value={room.ruleMode}
          />
        </LobbySettingsModal>
      ) : null}
    </section>
  );
}
