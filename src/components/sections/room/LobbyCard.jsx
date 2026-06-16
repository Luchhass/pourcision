"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  BatteryCharging,
  CircleDot,
  Clipboard,
  Columns2,
  Droplet,
  Eye,
  EyeOff,
  Flag,
  Gauge,
  Lock,
  MousePointerClick,
  Palette,
  Pencil,
  RotateCcw,
  Shuffle,
  Timer,
  UserMinus,
  Zap,
} from "lucide-react";
import Button from "@/components/ui/Button";
import AnimatedSettingsModal from "@/components/ui/AnimatedSettingsModal";
import { useRedeemCodes } from "@/hooks/useRedeemCodes";
import { useTranslation } from "@/hooks/useLanguage";
import { useLoopingSlider } from "@/hooks/useLoopingSlider";
import {
  DIFFICULTY_OPTIONS,
  GAME_ROUND_COUNT,
  GAME_RULE_MODES,
  GAME_MODE_OPTIONS,
  MODE_GRID_ORDER,
  ROUND_COUNT_OPTIONS,
  WATER_COLORS,
} from "@/lib/constants";
import {
  playDifficultySelect,
  playGameModeSelect,
  playWaterColorSelect,
} from "@/lib/sound";

const modeIcons = {
  [GAME_RULE_MODES.BLIND]: Eye,
  [GAME_RULE_MODES.FLASH]: Zap,
  [GAME_RULE_MODES.CLASSIC]: CircleDot,
  [GAME_RULE_MODES.CHAOS_QUEUE]: Shuffle,
  [GAME_RULE_MODES.FAKE_TARGET]: Flag,
  [GAME_RULE_MODES.INVERT]: ArrowUpDown,
  [GAME_RULE_MODES.LEAKY]: Droplet,
  [GAME_RULE_MODES.PERFECT_OR_NOTHING]: CircleDot,
  [GAME_RULE_MODES.BAND_RUN]: CircleDot,
  [GAME_RULE_MODES.CHARGE_POUR]: BatteryCharging,
  [GAME_RULE_MODES.BURST_CLICK]: MousePointerClick,
  [GAME_RULE_MODES.COLORBLIND]: EyeOff,
  [GAME_RULE_MODES.AUTO_RISE]: ArrowUp,
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
    <div className="min-w-0 space-y-3" data-screen-reveal-atomic="true">
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
      className="grid h-full min-h-0 w-full min-w-0 self-stretch"
      data-screen-reveal-row="true"
      data-screen-reveal-target="self"
    >
      <div className="grid h-full min-h-0 content-start overflow-y-auto bg-[#f7f7f2]/92 p-3 shadow-[0_22px_48px_rgba(13,13,12,0.08)] overscroll-contain [scrollbar-width:none] dark:bg-[#f7f7f2]/8 dark:shadow-[0_24px_60px_rgba(0,0,0,0.24)] [&::-webkit-scrollbar]:hidden">
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

function LobbyRoundCountControl({ disabled, label, onChange, value }) {
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
                  disabled && !selected ? "opacity-70" : "",
                ].join(" ")}
                disabled={disabled}
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

function getWaterColorWheelStep(slider) {
  if (!slider) return 58;

  const colorButtons = slider.querySelectorAll("[data-color-id]");
  const firstRect = colorButtons[0]?.getBoundingClientRect();
  const secondRect = colorButtons[1]?.getBoundingClientRect();
  if (firstRect && secondRect) {
    return Math.abs(secondRect.left - firstRect.left);
  }

  return (firstRect?.width ?? 48) + 10;
}

export function LobbyWaterColorPanel({
  colors = WATER_COLORS,
  disabled = false,
  label,
  onChange,
  showLabel = true,
  takenColorIds = [],
  value,
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
    disabled,
    getWheelStep: getWaterColorWheelStep,
    loop: "always",
    wheelDuration: 0.78,
  });
  const selectedColor =
    safeColors.find((color) => color.id === value) ??
    WATER_COLORS.find((color) => color.id === value) ??
    safeColors[0] ??
    WATER_COLORS[0];
  const takenColorSet = new Set(takenColorIds);
  const visibleColors = [...safeColors, ...safeColors, ...safeColors];

  const handleColorSelect = (event, colorId, colorIndex) => {
    const isTaken = takenColorSet.has(colorId) && colorId !== value;
    if (disabled || isTaken) {
      event.preventDefault();
      return;
    }
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
        className={[
          "grid min-w-0 items-center overflow-x-auto overflow-y-hidden",
          "[&::-webkit-scrollbar]:hidden",
          "cursor-grab select-none active:cursor-grabbing",
          "touch-pan-y",
          "overscroll-contain",
          "h-[var(--pc-swatch-size)]",
          "w-full max-w-full lg:max-w-[18rem] xl:max-w-[22rem] 2xl:max-w-[28rem]",
          disabled ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
        data-water-color-slider="true"
        onClickCapture={handleClickCapture}
        onPointerCancel={handlePointerCancel}
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
            const RandomIcon = color.isRandom ? Shuffle : null;

            return (
              <button
                aria-disabled={isTaken}
                aria-label={
                  isTaken
                    ? t("setup.colorTaken", {
                        color: t(`colors.${color.id}`),
                      })
                    : `${t(`colors.${color.id}`)} ${label}`
                }
                aria-pressed={selected}
                className={[
                  "pc-swatch relative grid shrink-0 place-items-center overflow-hidden transition-[box-shadow,filter] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:focus-visible:outline-[#f7f7f2]",
                  isTaken ? "cursor-not-allowed" : "",
                ].join(" ")}
                data-color-id={color.id}
                data-static-premium-water={
                  color.animated && !isTaken ? "true" : undefined
                }
                key={`${color.id}-${index}`}
                onClick={(event) =>
                  handleColorSelect(
                    event,
                    color.id,
                    index % colorCount,
                  )
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
                    className="pc-icon relative z-10 text-[#0d0d0c]"
                    strokeWidth={3}
                  />
                ) : null}
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
    <AnimatedSettingsModal onClose={onClose} title={title}>
      {children}
    </AnimatedSettingsModal>
  );
}

function LobbySettingsButton({ icon: Icon, label, onClick, wide = false }) {
  return (
    <div
      className={[
        "grid grid-rows-[auto_var(--pc-choice-height)] gap-3",
        wide ? "w-full" : "w-[var(--pc-choice-height)]",
      ].join(" ")}
      data-screen-reveal-atomic="true"
    >
      <p className="pc-label text-[#0d0d0c]/62 dark:text-[#f7f7f2]/58">
        {label}
      </p>
      <button
        aria-label={label}
        className={[
          "grid h-[var(--pc-choice-height)] min-w-0 place-items-center bg-[#f7f7f2]/96 text-[#0d0d0c] shadow-[0_18px_38px_rgba(13,13,12,0.08)] transition-colors duration-200 hover:bg-white focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2] dark:hover:bg-[#f7f7f2]/14 dark:focus-visible:outline-[#f7f7f2]",
          wide ? "px-3" : "",
        ].join(" ")}
        onClick={onClick}
        type="button"
      >
        <span
          className={[
            "flex min-w-0 items-center gap-2",
            wide ? "w-full justify-start" : "justify-center",
          ].join(" ")}
        >
          <Icon aria-hidden="true" className="pc-icon shrink-0" strokeWidth={2.7} />
          {wide ? <span className="pc-choice-text truncate">{label}</span> : null}
        </span>
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
  onRoundCountChange,
  onSettingsOpenChange,
  onWaterColorChange,
  onRuleModeChange,
  onStart,
  room,
  takenColorIds = [],
}) {
  const { t } = useTranslation();
  const { visibleWaterColors } = useRedeemCodes();
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [mobileSettingsModal, setMobileSettingsModal] = useState(null);
  const isHost = Boolean(currentPlayer?.isHost);
  const canEditSettings = isHost;
  const canOpenColorSettings = Boolean(currentPlayer);
  const isSettingsOpen = canEditSettings && isEditingSettings;
  const settingsDisabled = isUpdatingSettings;
  const roomRoundCount = room.roundCount || GAME_ROUND_COUNT;

  const handleEditToggle = () => {
    const next = !isEditingSettings;
    setIsEditingSettings(next);
    onSettingsOpenChange?.(next);
    if (!next) setMobileSettingsModal(null);
  };

  return (
    <section
      className={[
        "h-full min-h-0 w-full min-w-0 gap-5 lg:max-w-full xl:w-[82%] xl:min-w-[28rem] xl:max-w-[52rem]",
        isSettingsOpen
          ? "flex flex-col justify-end"
          : "grid grid-rows-[minmax(0,1fr)_auto] content-stretch",
      ].join(" ")}
    >
      <div
        className={[
          "grid min-w-0 gap-5",
          !isSettingsOpen
            ? "h-full min-h-0"
            : "",
        ].join(" ")}
      >
        {isSettingsOpen ? (
          <>
            <div
              className="w-full min-w-0 justify-self-stretch lg:hidden"
              data-screen-reveal-row="true"
              data-screen-reveal-target="children"
            >
              <div className="grid w-full min-w-0 justify-self-stretch grid-cols-2 items-start gap-3">
                <div className="min-w-0">
                  <LobbyDifficultyControl
                    disabled={settingsDisabled}
                    label={t("setup.difficulty")}
                    onChange={onDifficultyChange}
                    value={room.difficulty}
                  />
                </div>
                <div className="min-w-0">
                  <LobbyRoundCountControl
                    disabled={settingsDisabled}
                    label={t("setup.levels")}
                    onChange={onRoundCountChange}
                    value={roomRoundCount}
                  />
                </div>
              </div>
              <div
                className="mt-4 min-w-0"
                data-screen-reveal-row="true"
                data-screen-reveal-target="self"
              >
                <LobbySettingsButton
                  icon={Shuffle}
                  label={t("setup.mode")}
                  onClick={() => setMobileSettingsModal("mode")}
                  wide
                />
              </div>
            </div>

            <div
              className="hidden min-w-0 grid-cols-2 gap-4 lg:grid lg:gap-5"
              data-screen-reveal-row="true"
              data-screen-reveal-target="children"
            >
              <div className="min-w-0">
                <LobbyDifficultyControl
                  disabled={settingsDisabled}
                  label={t("setup.difficulty")}
                  onChange={onDifficultyChange}
                  value={room.difficulty}
                />
              </div>
              <div className="min-w-0">
                <LobbyRoundCountControl
                  disabled={settingsDisabled}
                  label={t("setup.levels")}
                  onChange={onRoundCountChange}
                  value={roomRoundCount}
                />
              </div>

              <div className="min-w-0 lg:col-span-2">
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
            ? "grid-cols-[var(--pc-action-height)_var(--pc-action-height)_var(--pc-action-height)_minmax(0,1fr)] lg:grid-cols-[var(--pc-action-height)_var(--pc-action-height)_minmax(0,1fr)]"
            : canOpenColorSettings
              ? "grid-cols-[var(--pc-action-height)_var(--pc-action-height)_minmax(0,1fr)] lg:grid-cols-[var(--pc-action-height)_minmax(0,1fr)]"
            : "grid-cols-2",
        ].join(" ")}
      >
        {canOpenColorSettings ? (
          <button
            aria-label={t("setup.waterColor")}
            data-screen-reveal-row="true"
            data-screen-reveal-target="self"
            className="pc-action grid aspect-square place-items-center bg-[#f7f7f2]/96 p-0 text-[#0d0d0c] shadow-[0_18px_38px_rgba(13,13,12,0.08)] transition-colors duration-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] lg:hidden dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2] dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] dark:hover:bg-[#f7f7f2]/14 dark:focus-visible:outline-[#f7f7f2]"
            onClick={() => setMobileSettingsModal("color")}
            type="button"
          >
            <Palette aria-hidden="true" className="pc-icon" strokeWidth={2.5} />
          </button>
        ) : null}

        {canEditSettings ? (
          <button
            aria-label={t("room.editSettings")}
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

        <button
          aria-label={t("room.copyInvite")}
          data-screen-reveal-row="true"
          data-screen-reveal-target="self"
          className={[
            "pc-action grid place-items-center bg-[#f7f7f2]/96 text-[#0d0d0c] shadow-[0_18px_38px_rgba(13,13,12,0.08)] transition-colors duration-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0d0d0c] dark:bg-[#f7f7f2]/8 dark:text-[#f7f7f2] dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] dark:hover:bg-[#f7f7f2]/14 dark:focus-visible:outline-[#f7f7f2]",
            canOpenColorSettings ? "aspect-square p-0" : "w-full",
          ].join(" ")}
          onClick={onCopyInvite}
          type="button"
        >
          <span className="inline-flex items-center gap-3">
            <Clipboard aria-hidden="true" className="pc-icon" />
            {canOpenColorSettings ? null : (
              <span className="hidden sm:inline">{t("room.copyInvite")}</span>
            )}
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
            colors={visibleWaterColors}
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
