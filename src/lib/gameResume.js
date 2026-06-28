const GAME_RESUME_STORAGE_PREFIX = "pourcision-game-resume:";
const GAME_RESUME_VERSION = 1;
const GAME_RESUME_TTL_MS = 12 * 60 * 60 * 1000;

function getStorage() {
  if (typeof window === "undefined") return null;

  try {
    const storage = window.localStorage;
    const testKey = `${GAME_RESUME_STORAGE_PREFIX}test`;

    storage.setItem(testKey, "1");
    storage.removeItem(testKey);

    return storage;
  } catch {
    return null;
  }
}

function getStorageKey(resumeKey) {
  const key = String(resumeKey || "").trim();
  if (!key) return "";

  return `${GAME_RESUME_STORAGE_PREFIX}${encodeURIComponent(key)}`;
}

export function createGameResumeKey(parts) {
  return parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join("|");
}

export function readGameResumeSnapshot(resumeKey) {
  const storage = getStorage();
  const storageKey = getStorageKey(resumeKey);

  if (!storage || !storageKey) return null;

  try {
    const stored = storage.getItem(storageKey);
    if (!stored) return null;

    const record = JSON.parse(stored);
    if (
      record?.version !== GAME_RESUME_VERSION ||
      !record?.snapshot ||
      record.expiresAt <= Date.now()
    ) {
      storage.removeItem(storageKey);
      return null;
    }

    return record.snapshot;
  } catch {
    storage.removeItem(storageKey);
    return null;
  }
}

export function writeGameResumeSnapshot(resumeKey, snapshot) {
  const storage = getStorage();
  const storageKey = getStorageKey(resumeKey);

  if (!storage || !storageKey || !snapshot) return;

  try {
    storage.setItem(
      storageKey,
      JSON.stringify({
        expiresAt: Date.now() + GAME_RESUME_TTL_MS,
        savedAt: Date.now(),
        snapshot,
        version: GAME_RESUME_VERSION,
      }),
    );
  } catch {
    // Storage can be full or disabled; gameplay should continue normally.
  }
}

export function clearGameResumeSnapshot(resumeKey) {
  const storage = getStorage();
  const storageKey = getStorageKey(resumeKey);

  if (!storage || !storageKey) return;

  try {
    storage.removeItem(storageKey);
  } catch {
    // Ignore storage failures.
  }
}
