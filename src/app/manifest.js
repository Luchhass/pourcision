import { APP_NAME } from "@/lib/constants";
import {
  SITE_DESCRIPTION,
  SITE_IMAGE_HEIGHT,
  SITE_IMAGE_WIDTH,
} from "@/lib/seo";

const ICON_VERSION = "20260610-square-p";

export default function manifest() {
  return {
    name: `${APP_NAME} - Precision Fill Game`,
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
        src: `/favicon-48x48.png?v=${ICON_VERSION}`,
        sizes: "48x48",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/icon-192.png?v=${ICON_VERSION}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: `/icon-512.png?v=${ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: `/icon.svg?v=${ICON_VERSION}`,
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
    screenshots: [
      {
        form_factor: "wide",
        label: `${APP_NAME} precision fill game preview`,
        sizes: `${SITE_IMAGE_WIDTH}x${SITE_IMAGE_HEIGHT}`,
        src: "/og-image.png",
        type: "image/png",
      },
    ],
  };
}
