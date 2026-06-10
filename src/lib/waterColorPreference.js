import { WATER_COLORS, WATER_COLOR_STORAGE_KEY } from "@/lib/constants";

const WATER_COLOR_CHANGE_EVENT = "pourcision-water-color-change";

export function isWaterColorId(value) {
  return WATER_COLORS.some((color) => color.id === value);
}

export function getFallbackWaterColorId() {
  return WATER_COLORS[2]?.id || WATER_COLORS[0]?.id || "red";
}

export function readStoredWaterColorId() {
  if (typeof window === "undefined") return null;

  try {
    const storedWaterColorId = window.localStorage.getItem(WATER_COLOR_STORAGE_KEY);
    return isWaterColorId(storedWaterColorId) ? storedWaterColorId : null;
  } catch {
    return null;
  }
}

export function getWaterColorPreferenceSnapshot() {
  return readStoredWaterColorId() || getFallbackWaterColorId();
}

export function subscribeToWaterColorPreference(callback) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event) => {
    if (event.key !== WATER_COLOR_STORAGE_KEY) return;
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(WATER_COLOR_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(WATER_COLOR_CHANGE_EVENT, callback);
  };
}

export function saveStoredWaterColorId(waterColorId) {
  if (typeof window === "undefined" || !isWaterColorId(waterColorId)) return;

  try {
    window.localStorage.setItem(WATER_COLOR_STORAGE_KEY, waterColorId);
    window.dispatchEvent(new Event(WATER_COLOR_CHANGE_EVENT));
  } catch {
    // Ignore storage failures; the selected in-memory color should still work.
  }
}
