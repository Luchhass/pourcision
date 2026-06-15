import { APP_NAME } from "@/lib/constants";
import {
  SITE_DESCRIPTION,
  SITE_IMAGE_HEIGHT,
  SITE_IMAGE_WIDTH,
} from "@/lib/seo";

export default function manifest() {
  return {
    name: `${APP_NAME} - Water Fill Timing Game`,
    short_name: APP_NAME,
    description: SITE_DESCRIPTION,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f7f2",
    theme_color: "#0d0d0c",
    orientation: "portrait-primary",
    lang: "en",
    categories: ["games", "entertainment"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon-1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    screenshots: [
      {
        form_factor: "wide",
        label: `${APP_NAME} water-fill timing game preview`,
        sizes: `${SITE_IMAGE_WIDTH}x${SITE_IMAGE_HEIGHT}`,
        src: "/og-image.png",
        type: "image/png",
      },
    ],
  };
}
