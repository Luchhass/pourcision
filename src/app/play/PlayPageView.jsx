import HomeScreen from "@/components/sections/home/HomeScreen";
import { MENU_MODES } from "@/lib/constants";
import {
  normalizePlayMode,
  resolvePlayRouteSettings,
} from "@/lib/playRoutes";
import { createPageMetadata } from "@/lib/seo";

export async function generatePlayMetadata({ params }) {
  const resolvedParams = await params;
  const mode = normalizePlayMode(resolvedParams?.mode);

  return createPageMetadata(
    mode === MENU_MODES.MULTIPLAYER ? "multiplayer" : "singleplayer",
  );
}

export default async function PlayPageView({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { mode, settings } = resolvePlayRouteSettings({
    params: resolvedParams,
    searchParams: resolvedSearchParams,
  });

  return (
    <HomeScreen
      initialMode={mode}
      initialSettings={settings}
      initialStep="gameplay"
    />
  );
}
