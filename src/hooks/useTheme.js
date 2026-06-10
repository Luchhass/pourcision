"use client";

import { useCallback, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/constants";

const THEME_CHANGE_EVENT = "pourcision-theme-change";

function getStoredTheme() {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
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
    applyTheme(nextTheme);
    callback();
  };

  const handlePreferenceChange = () => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return;

    applyTheme(mediaQuery.matches ? "dark" : "light");
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
    applyTheme(nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return {
    isDark: theme === "dark",
    theme,
    toggleTheme,
  };
}
