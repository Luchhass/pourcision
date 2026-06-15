import MultiplayerRoomClient from "@/components/sections/room/MultiplayerRoomClient";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: {
    absolute: `${APP_NAME} Multiplayer Lobby`,
  },
  robots: {
    follow: false,
    index: false,
    googleBot: {
      follow: false,
      index: false,
    },
  },
};

export default async function RoomPage({ params }) {
  const resolvedParams = await params;
  const roomCode = String(resolvedParams?.roomCode || "").toUpperCase();

  return <MultiplayerRoomClient roomCode={roomCode} />;
}
