"use client";

import { useEffect } from "react";
import {
  FULLSCREEN_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "@/lib/constants";

function getStoredTheme() {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyStoredPreferences() {
  const root = document.documentElement;
  const theme = getStoredTheme();
  const language =
    window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "tr" ? "tr" : "en";
  const fullscreen = window.localStorage.getItem(FULLSCREEN_STORAGE_KEY);

  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.dataset.locale = language;
  root.dataset.fullscreenMode =
    fullscreen === "on" || fullscreen === "true" ? "on" : "off";
  root.lang = language;
  root.style.colorScheme = theme;
}

export default function PreferenceBootstrap() {
  useEffect(() => {
    applyStoredPreferences();
  }, []);

  return null;
}
