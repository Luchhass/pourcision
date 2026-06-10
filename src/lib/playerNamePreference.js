const PLAYER_NAME_SESSION_KEY = "pourcision-player-name";
const PLAYER_NAME_MAX_LENGTH = 24;

export function readSessionPlayerName() {
  if (typeof window === "undefined") return "";

  try {
    return window.sessionStorage.getItem(PLAYER_NAME_SESSION_KEY) || "";
  } catch {
    return "";
  }
}

export function saveSessionPlayerName(playerName) {
  if (typeof window === "undefined") return;

  const nextPlayerName = String(playerName || "").slice(0, PLAYER_NAME_MAX_LENGTH);
  if (!nextPlayerName.trim()) return;

  try {
    window.sessionStorage.setItem(PLAYER_NAME_SESSION_KEY, nextPlayerName);
  } catch {
    // Session storage is only a convenience; gameplay should not depend on it.
  }
}
