import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env, isAllowedOrigin } from "../config/env.js";
import { countRooms } from "../rooms/roomStore.js";
import { isoNow } from "../utils/time.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin not allowed by CORS."));
      },
    }),
  );
  app.use(express.json({ limit: "48kb" }));

  app.get("/", (_request, response) => {
    response.json({
      environment: env.nodeEnv,
      name: "pourcision-multiplayer-backend",
      ok: true,
    });
  });

  app.get("/health", (_request, response) => {
    response.json({
      ok: true,
      rooms: countRooms(),
      timestamp: isoNow(),
      uptime: process.uptime(),
    });
  });

  return app;
}
