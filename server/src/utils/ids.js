import crypto from "node:crypto";
import { ROOM_CODE_LENGTH } from "../constants.js";
import { rooms } from "../rooms/roomStore.js";

export function generateRoomCode() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const code = String(crypto.randomInt(0, 10 ** ROOM_CODE_LENGTH)).padStart(
      ROOM_CODE_LENGTH,
      "0",
    );

    if (!rooms.has(code)) return code;
  }

  throw new Error("Could not generate a unique room code.");
}

export function createSeed() {
  return crypto.randomBytes(16).toString("hex");
}
