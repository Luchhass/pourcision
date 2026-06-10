"use client";

import { useCallback, useState } from "react";

const SESSION_PREFIX = "pourcision-room-session";

function sessionKey(roomCode) {
  return `${SESSION_PREFIX}:${String(roomCode || "").toUpperCase()}`;
}

export function createPlayerId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `player-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

export function saveRoomSession(roomCode, nextSession) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    sessionKey(roomCode),
    JSON.stringify(nextSession),
  );
}

function readRoomSession(roomCode) {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.sessionStorage.getItem(sessionKey(roomCode));
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function useRoomSession(roomCode) {
  const [session, setSession] = useState(() => readRoomSession(roomCode));

  const saveSession = useCallback(
    (nextSession) => {
      setSession(nextSession);
      saveRoomSession(roomCode, nextSession);
    },
    [roomCode],
  );

  const clearSession = useCallback(() => {
    setSession(null);
    window.sessionStorage.removeItem(sessionKey(roomCode));
  }, [roomCode]);

  return {
    clearSession,
    isLoaded: true,
    saveSession,
    session,
  };
}
