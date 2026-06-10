import { ROUTES } from "@/lib/constants";
import { absoluteUrl, SITE_LAST_MODIFIED } from "@/lib/seo";

export default function sitemap() {
  const lastModified = new Date(SITE_LAST_MODIFIED);

  return [ROUTES.HOME, ROUTES.SINGLEPLAYER, ROUTES.MULTIPLAYER].map((path) => ({
    changeFrequency: "weekly",
    lastModified,
    priority: path === ROUTES.HOME ? 1 : path === ROUTES.SINGLEPLAYER ? 0.9 : 0.82,
    url: absoluteUrl(path),
  }));
}
