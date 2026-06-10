import MultiplayerRoomClient from "@/components/sections/room/MultiplayerRoomClient";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: {
    absolute: `Multiplayer Lobby | ${APP_NAME}`,
  },
  robots: {
    follow: false,
    index: false,
  },
};

export default async function RoomPage({ params }) {
  const resolvedParams = await params;
  const roomCode = String(resolvedParams?.roomCode || "").toUpperCase();

  return <MultiplayerRoomClient roomCode={roomCode} />;
}
