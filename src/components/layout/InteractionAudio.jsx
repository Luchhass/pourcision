"use client";

import { useEffect } from "react";
import {
  playButtonClick,
  playButtonHover,
  playCloseClick,
  playCloseHover,
  playDifficultyHover,
  playGameModeHover,
  playWaterColorHover,
  prepareAudio,
  resumeAudioIfAllowed,
  stopPourAudio,
  unlockAudio,
} from "@/lib/sound";

const INTERACTIVE_SELECTOR = "button, a[href], [role='button']";

function getInteractiveElement(event) {
  if (!(event.target instanceof Element)) return null;
  if (event.target.closest("[data-sound='off']")) return null;

  const element = event.target.closest(INTERACTIVE_SELECTOR);
  if (!element) return null;
  if (element.getAttribute("aria-disabled") === "true") return null;
  if ("disabled" in element && element.disabled) return null;

  return element;
}

function getSoundKind(element) {
  const explicit = element.closest("[data-sound-kind]");
  if (explicit) return explicit.getAttribute("data-sound-kind");
  if (element.closest(".solo-close-button")) return "close";
  return "default";
}

function getSoundIndex(element) {
  const explicit = Number(element.getAttribute("data-sound-index"));
  if (Number.isInteger(explicit)) return Math.max(0, explicit);

  const group = element.closest("[data-sound-group]");
  if (!group) return 0;

  const items = Array.from(group.querySelectorAll("[data-sound-index]"));
  return Math.max(0, items.indexOf(element));
}

export default function InteractionAudio() {
  useEffect(() => {
    prepareAudio();

    const handlePointerOver = (event) => {
      const element = getInteractiveElement(event);
      if (!element) return;
      if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) {
        return;
      }

      const soundKind = getSoundKind(element);
      const soundIndex = getSoundIndex(element);

      if (soundKind === "close") {
        playCloseHover();
        return;
      }
      if (soundKind === "difficulty") {
        playDifficultyHover(soundIndex);
        return;
      }
      if (soundKind === "game-mode") {
        playGameModeHover(soundIndex);
        return;
      }
      if (soundKind === "water-color") {
        playWaterColorHover(soundIndex);
        return;
      }

      playButtonHover();
    };

    const handlePointerDown = (event) => {
      unlockAudio();

      const element = getInteractiveElement(event);
      if (!element) return;

      const soundKind = getSoundKind(element);
      if (soundKind === "difficulty" || soundKind === "game-mode" || soundKind === "water-color") {
        return;
      }
      if (soundKind === "close") {
        playCloseClick();
        return;
      }

      playButtonClick();
    };

    const handleKeyDown = (event) => {
      unlockAudio();

      if (event.key !== "Enter" && event.key !== " ") return;

      const element = getInteractiveElement(event);
      if (!element) return;

      const soundKind = getSoundKind(element);
      if (soundKind === "difficulty" || soundKind === "game-mode" || soundKind === "water-color") {
        return;
      }
      if (soundKind === "close") {
        playCloseClick();
        return;
      }

      playButtonClick();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopPourAudio({ release: false });
        return;
      }

      if (document.visibilityState === "visible") {
        resumeAudioIfAllowed();
      }
    };

    const handlePageHide = () => {
      stopPourAudio({ release: false });
    };

    document.addEventListener("pointerover", handlePointerOver, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("pointerdown", unlockAudio, true);
    window.addEventListener("mousedown", unlockAudio, true);
    window.addEventListener("touchstart", unlockAudio, { capture: true, passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", resumeAudioIfAllowed);

    return () => {
      document.removeEventListener("pointerover", handlePointerOver, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("pointerdown", unlockAudio, true);
      window.removeEventListener("mousedown", unlockAudio, true);
      window.removeEventListener("touchstart", unlockAudio, { capture: true });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", resumeAudioIfAllowed);
      stopPourAudio({ release: false });
    };
  }, []);

  return null;
}
