import { Server } from "socket.io";
import { env, isAllowedOrigin } from "../config/env.js";
import { runRoomCleanup } from "../rooms/roomService.js";
import { registerSocketEvents } from "./events.js";

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      credentials: true,
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin not allowed by CORS."));
      },
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ["websocket", "polling"],
  });

  registerSocketEvents(io);

  const cleanupInterval = setInterval(runRoomCleanup, 60000);
  cleanupInterval.unref?.();

  if (!env.isProduction) {
    io.engine.on("connection_error", (error) => {
      console.warn("[pourcision:socket] connection error", error.message);
    });
  }

  return io;
}
