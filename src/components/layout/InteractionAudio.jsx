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
import {
  pauseMusic,
  prepareMusic,
  resumeMusicIfAllowed,
  unlockMusic,
} from "@/lib/music";

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
    prepareMusic();

    const handleUnlock = () => {
      unlockAudio();
      unlockMusic();
    };

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
      handleUnlock();

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
      handleUnlock();

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
        pauseMusic();
        return;
      }

      if (document.visibilityState === "visible") {
        resumeAudioIfAllowed();
        resumeMusicIfAllowed();
      }
    };

    const handlePageHide = () => {
      stopPourAudio({ release: false });
      pauseMusic();
    };

    const handlePageShow = () => {
      resumeAudioIfAllowed();
      resumeMusicIfAllowed();
    };

    document.addEventListener("pointerover", handlePointerOver, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("pointerdown", handleUnlock, true);
    window.addEventListener("mousedown", handleUnlock, true);
    window.addEventListener("click", handleUnlock, true);
    window.addEventListener("touchstart", handleUnlock, { capture: true, passive: true });
    window.addEventListener("touchend", handleUnlock, { capture: true, passive: true });
    window.addEventListener("keydown", handleUnlock, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("pointerover", handlePointerOver, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("pointerdown", handleUnlock, true);
      window.removeEventListener("mousedown", handleUnlock, true);
      window.removeEventListener("click", handleUnlock, true);
      window.removeEventListener("touchstart", handleUnlock, { capture: true });
      window.removeEventListener("touchend", handleUnlock, { capture: true });
      window.removeEventListener("keydown", handleUnlock, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
      stopPourAudio({ release: false });
      pauseMusic();
    };
  }, []);

  return null;
}
