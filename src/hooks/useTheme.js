"use client";

import { useCallback, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/constants";

const THEME_CHANGE_EVENT = "pourcision-theme-change";
const THEME_TRANSITION_MS = 280;

let themeTransitionTimer = null;

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setThemeAttributes(theme) {
  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

function startFallbackThemeTransition() {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (prefersReducedMotion()) return;

  const root = document.documentElement;
  root.dataset.themeTransitioning = "true";
  window.clearTimeout(themeTransitionTimer);

  root.getBoundingClientRect();

  themeTransitionTimer = window.setTimeout(() => {
    delete root.dataset.themeTransitioning;
  }, THEME_TRANSITION_MS + 80);
}

function getStoredTheme() {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme, { animate = false } = {}) {
  if (typeof document === "undefined") return;

  if (!animate || prefersReducedMotion()) {
    setThemeAttributes(theme);
    return;
  }

  startFallbackThemeTransition();
  setThemeAttributes(theme);
}

function getThemeSnapshot() {
  if (typeof document === "undefined") return "light";

  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribeToTheme(callback) {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleStorage = (event) => {
    if (event.key !== THEME_STORAGE_KEY) return;

    const nextTheme = event.newValue === "dark" ? "dark" : "light";
    applyTheme(nextTheme, { animate: true });
    callback();
  };

  const handlePreferenceChange = () => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return;

    applyTheme(mediaQuery.matches ? "dark" : "light", { animate: true });
    callback();
  };

  const handleLocalChange = () => {
    applyTheme(getStoredTheme());
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, handleLocalChange);
  mediaQuery.addEventListener("change", handlePreferenceChange);
  handleLocalChange();

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, handleLocalChange);
    mediaQuery.removeEventListener("change", handlePreferenceChange);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => "light");

  const toggleTheme = useCallback(() => {
    const currentTheme = getStoredTheme();
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme, { animate: true });
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return {
    isDark: theme === "dark",
    theme,
    toggleTheme,
  };
}
