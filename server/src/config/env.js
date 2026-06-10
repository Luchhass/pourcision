import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function originsFromEnv(value) {
  if (!value) {
    return [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  clientOrigins: originsFromEnv(process.env.CLIENT_ORIGINS),
  disconnectGraceMs: numberFromEnv("DISCONNECT_GRACE_MS", 45000),
  emptyRoomTtlMs: numberFromEnv("EMPTY_ROOM_TTL_MS", 120000),
  hostDisconnectGraceMs: numberFromEnv("HOST_DISCONNECT_GRACE_MS", 60000),
  isProduction: nodeEnv === "production",
  maxPlayersPerRoom: numberFromEnv("MAX_PLAYERS_PER_ROOM", 5),
  nodeEnv,
  port: numberFromEnv("PORT", 4000),
  roomTtlMs: numberFromEnv("ROOM_TTL_MS", 3600000),
};

export function isAllowedOrigin(origin) {
  if (!origin) return true;
  return env.clientOrigins.includes(origin);
}
