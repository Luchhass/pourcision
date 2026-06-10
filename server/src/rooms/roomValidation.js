import {
  DEFAULT_SETTINGS,
  GAME_DIFFICULTIES,
  GAME_RULE_MODES,
  PLAYER_NAME_MAX_LENGTH,
  PLAYER_NAME_MIN_LENGTH,
  ROOM_NAME_MAX_LENGTH,
  ROOM_NAME_MIN_LENGTH,
  ROOM_PASSWORD_MAX_LENGTH,
  ROOM_PASSWORD_MIN_LENGTH,
  ROOM_VISIBILITIES,
  WATER_COLOR_IDS,
} from "../constants.js";

export function fail(error) {
  return { error, ok: false };
}

export function ok(data = {}) {
  return { data, ok: true };
}

export function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateRoomCode(roomCode) {
  const cleanCode = cleanString(roomCode).toUpperCase();
  if (!/^\d{6}$/.test(cleanCode)) {
    return fail("Room code must be exactly 6 digits.");
  }

  return ok({ roomCode: cleanCode });
}

export function validatePlayerId(playerId) {
  const cleanId = cleanString(playerId);
  if (!cleanId || cleanId.length > 96) return fail("Invalid player session.");

  return ok({ playerId: cleanId });
}

export function validatePlayerName(playerName) {
  const cleanName = cleanString(playerName).replace(/\s+/g, " ");

  if (cleanName.length < PLAYER_NAME_MIN_LENGTH) {
    return fail(`Name must be at least ${PLAYER_NAME_MIN_LENGTH} characters.`);
  }

  if (cleanName.length > PLAYER_NAME_MAX_LENGTH) {
    return fail(`Name must be ${PLAYER_NAME_MAX_LENGTH} characters or fewer.`);
  }

  return ok({ playerName: cleanName });
}

export function validateDifficulty(difficulty) {
  const cleanDifficulty = cleanString(difficulty) || DEFAULT_SETTINGS.difficulty;

  if (!Object.values(GAME_DIFFICULTIES).includes(cleanDifficulty)) {
    return fail("Invalid difficulty.");
  }

  return ok({ difficulty: cleanDifficulty });
}

export function validateRuleMode(ruleMode) {
  const cleanMode = cleanString(ruleMode) || DEFAULT_SETTINGS.ruleMode;

  if (!Object.values(GAME_RULE_MODES).includes(cleanMode)) {
    return fail("Invalid game mode.");
  }

  return ok({ ruleMode: cleanMode });
}

export function validateRoomName(roomName, fallback = "Pourcision lobby") {
  const cleanName = (cleanString(roomName) || fallback).replace(/\s+/g, " ");

  if (cleanName.length < ROOM_NAME_MIN_LENGTH) {
    return fail(`Lobby name must be at least ${ROOM_NAME_MIN_LENGTH} characters.`);
  }

  if (cleanName.length > ROOM_NAME_MAX_LENGTH) {
    return fail(`Lobby name must be ${ROOM_NAME_MAX_LENGTH} characters or fewer.`);
  }

  return ok({ roomName: cleanName });
}

export function validateRoomVisibility(visibility) {
  const cleanVisibility = cleanString(visibility) || ROOM_VISIBILITIES.PUBLIC;

  if (!Object.values(ROOM_VISIBILITIES).includes(cleanVisibility)) {
    return fail("Invalid lobby visibility.");
  }

  return ok({ visibility: cleanVisibility });
}

export function validateRoomPassword(password, { required = false } = {}) {
  const cleanPassword = cleanString(password);

  if (!cleanPassword) {
    return required
      ? fail(`Password must be at least ${ROOM_PASSWORD_MIN_LENGTH} characters.`)
      : ok({ password: "" });
  }

  if (cleanPassword.length < ROOM_PASSWORD_MIN_LENGTH) {
    return fail(`Password must be at least ${ROOM_PASSWORD_MIN_LENGTH} characters.`);
  }

  if (cleanPassword.length > ROOM_PASSWORD_MAX_LENGTH) {
    return fail(`Password must be ${ROOM_PASSWORD_MAX_LENGTH} characters or fewer.`);
  }

  return ok({ password: cleanPassword });
}

export function validateWaterColor(waterColorId) {
  const cleanWaterColor = cleanString(waterColorId) || DEFAULT_SETTINGS.waterColorId;

  if (!WATER_COLOR_IDS.has(cleanWaterColor)) {
    return fail("Invalid water color.");
  }

  return ok({ waterColorId: cleanWaterColor });
}

export function validateRoundIndex(roundIndex, roundCount) {
  const value = Number(roundIndex);
  if (!Number.isInteger(value) || value < 0 || value >= roundCount) {
    return fail("Invalid round.");
  }

  return ok({ roundIndex: value });
}

export function validateLevel(level) {
  const value = Number(level);
  if (!Number.isFinite(value)) return fail("Invalid water level.");

  return ok({ level: Math.max(0, Math.min(100, value)) });
}

export function validateSplitLevels(splitLevels) {
  if (!Array.isArray(splitLevels) || splitLevels.length !== 2) {
    return fail("Invalid split water levels.");
  }

  const levels = splitLevels.map((level) => Number(level));
  if (levels.some((level) => !Number.isFinite(level))) {
    return fail("Invalid split water levels.");
  }

  return ok({
    splitLevels: levels.map((level) => Math.max(0, Math.min(100, level))),
  });
}
