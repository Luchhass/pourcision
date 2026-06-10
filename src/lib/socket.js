"use client";

import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

let socket;

export function getSocket() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 700,
      transports: ["websocket", "polling"],
    });
  }

  return socket;
}

export function emitWithAck(eventName, payload = {}) {
  const activeSocket = getSocket();

  if (!activeSocket) {
    return Promise.resolve({
      error: "Socket unavailable",
      ok: false,
    });
  }

  return new Promise((resolve) => {
    activeSocket.timeout(9000).emit(eventName, payload, (error, response) => {
      if (error) {
        resolve({
          error: "Could not reach multiplayer server",
          ok: false,
        });
        return;
      }

      resolve(response || { ok: false, error: "Empty server response" });
    });
  });
}
