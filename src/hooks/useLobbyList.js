"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { emitWithAck, getSocket } from "@/lib/socket";

function responseData(response) {
  return response?.data || response || {};
}

function roomMatchesSearch(room, query) {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return true;

  return [
    room.code,
    room.name,
    room.lobbyName,
    room.hostName,
    room.ruleMode,
    room.difficulty,
    room.visibility,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(cleanQuery);
}

export function useLobbyList(enabled = true) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoomCode, setSelectedRoomCode] = useState("");

  const syncRooms = useCallback((nextRooms) => {
    setRooms(nextRooms);
    setSelectedRoomCode((currentCode) => {
      if (currentCode && nextRooms.some((room) => room.code === currentCode)) {
        return currentCode;
      }

      return "";
    });
  }, []);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const response = await emitWithAck("room:list");
    setIsLoading(false);

    if (!response.ok) {
      setError(response.error || "Could not load lobbies.");
      return;
    }

    syncRooms(responseData(response).rooms || []);
  }, [syncRooms]);

  useEffect(() => {
    if (!enabled) return undefined;

    const loadTimerId = window.setTimeout(() => {
      void loadRooms();
    }, 0);
    const socket = getSocket();

    if (!socket) {
      return () => window.clearTimeout(loadTimerId);
    }

    const handleListUpdated = (payload = {}) => {
      syncRooms(payload.rooms || []);
    };

    socket.on("room:listUpdated", handleListUpdated);

    return () => {
      window.clearTimeout(loadTimerId);
      socket.off("room:listUpdated", handleListUpdated);
    };
  }, [enabled, loadRooms, syncRooms]);

  const visibleRooms = useMemo(
    () => rooms.filter((room) => roomMatchesSearch(room, searchQuery)),
    [rooms, searchQuery],
  );
  const selectedRoom = useMemo(
    () => rooms.find((room) => room.code === selectedRoomCode) || null,
    [rooms, selectedRoomCode],
  );

  return {
    error,
    isLoading,
    loadRooms,
    rooms,
    searchQuery,
    selectedRoom,
    selectedRoomCode,
    setSearchQuery,
    setSelectedRoomCode,
    visibleRooms,
  };
}
