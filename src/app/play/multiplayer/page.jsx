import HomeScreen from "@/components/sections/home/HomeScreen";
import { MENU_MODES } from "@/lib/constants";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata("multiplayer");

export default function MultiplayerSetupPage() {
  return (
    <HomeScreen
      initialMode={MENU_MODES.MULTIPLAYER}
      initialStep="setup"
    />
  );
}
