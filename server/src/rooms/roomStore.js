export const rooms = new Map();

export function getRoom(roomCode) {
  return rooms.get(String(roomCode || "").toUpperCase()) || null;
}

export function setRoom(room) {
  rooms.set(room.code, room);
  return room;
}

export function deleteRoom(roomCode) {
  return rooms.delete(String(roomCode || "").toUpperCase());
}

export function listRooms() {
  return Array.from(rooms.values());
}

export function countRooms() {
  return rooms.size;
}
