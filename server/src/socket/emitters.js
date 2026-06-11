import { DEFAULT_SETTINGS } from "../constants.js";
import { getRoomSnapshot, listJoinableRooms } from "../rooms/roomService.js";

export function createEmitters(io) {
  return {
    emitPlayerKicked(room, player) {
      if (!player.socketId) return;

      io.to(player.socketId).emit("room:playerKicked", {
        message: "You were removed from the lobby.",
        playerId: player.id,
        roomCode: room.code,
      });
    },

    emitRoomClosed(room, reason) {
      io.to(room.code).emit("room:closed", {
        message: "This lobby has closed.",
        reason,
        roomCode: room.code,
      });
    },

    emitRoomList() {
      const result = listJoinableRooms();
      io.emit("room:listUpdated", result.data);
    },

    emitRoomState(room) {
      if (!room) return;
      io.to(room.code).emit("room:state", getRoomSnapshot(room));
    },

    emitScoreboard(room, leaderboard) {
      io.to(room.code).emit("game:scoreboard", leaderboard);
      io.to(room.code).emit("game:leaderboard", leaderboard);
    },

    emitSubmission(room, player, result) {
      io.to(room.code).emit("game:submissionReceived", {
        player: {
          id: player.id,
          name: player.name,
          waterColorId: player.waterColorId || DEFAULT_SETTINGS.waterColorId,
        },
        result,
        roomCode: room.code,
      });
    },

    emitWaterState(room, player, waterState, senderSocketId) {
      io.to(room.code).except(senderSocketId).emit("game:waterState", {
        ...waterState,
        player: {
          id: player.id,
          name: player.name,
          waterColorId: player.waterColorId || DEFAULT_SETTINGS.waterColorId,
        },
        roomCode: room.code,
      });
    },

    leaveSocketRoom(roomCode, socketId) {
      const socket = io.sockets.sockets.get(socketId);
      socket?.leave(roomCode);
    },
  };
}
