import { APP_NAME, ROUTES } from "@/lib/constants";

const CANONICAL_SITE_URL = "https://www.pourcision.com";

function normalizeSiteUrl(value) {
  const urlValue = value?.replace(/\/$/, "") || CANONICAL_SITE_URL;

  try {
    const url = new URL(urlValue);

    if (
      url.host === "pourcision.com" ||
      url.host === "pourcision.app" ||
      url.host === "www.pourcision.app"
    ) {
      return CANONICAL_SITE_URL;
    }

    return urlValue;
  } catch {
    return CANONICAL_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const SITE_IMAGE_PATH = "/og-image.png";
export const SITE_IMAGE_URL = absoluteUrl(SITE_IMAGE_PATH);
export const SITE_IMAGE_WIDTH = 1366;
export const SITE_IMAGE_HEIGHT = 768;
export const SITE_LAST_MODIFIED = "2026-06-15T00:00:00.000Z";

export const SITE_DESCRIPTION =
  "Pourcision is a free browser game about water-fill timing. Hold to raise the water, read the moving surface, release near the target line, and chase clean scores solo or with friends.";

export const SEO_KEYWORDS = [
  "Pourcision",
  "Pourcision game",
  "Pourcision browser game",
  "Pourcision water game",
  "Pourcision timing game",
  "Pourcision multiplayer",
  "Pourcision singleplayer",
  "pourcision.com",
  "water fill game",
  "water timing game",
  "fill timing game",
  "water physics game",
  "target line game",
  "target line timing game",
  "pouring game",
  "one hold game",
  "release timing game",
  "reaction timing game",
  "browser game",
  "free online game",
  "online timing game",
  "free online water game",
  "multiplayer browser game",
  "private lobby game",
  "online timing challenge",
  "frontend game",
  "minimal browser game",
  "skill game",
  "arcade timing game",
];

export const ROUTE_SEO = {
  home: {
    description: SITE_DESCRIPTION,
    path: ROUTES.HOME,
    title: "Pourcision - Water Fill Timing Game",
  },
  singleplayer: {
    description:
      "Play Pourcision singleplayer with 1, 3, 5, or 10 target-line rounds. Choose Easy, Normal, or Hard, pick a rule mode, and release the water closest to the mark.",
    path: ROUTES.SINGLEPLAYER,
    title: "Pourcision Singleplayer - Water Timing Game",
  },
  multiplayer: {
    description:
      "Create a Pourcision lobby, invite friends, and race the same water-fill timing challenge with shared target lines and visible opponent water levels.",
    path: ROUTES.MULTIPLAYER,
    title: "Pourcision Multiplayer Lobby Game",
  },
};

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function createPageMetadata(route, options = {}) {
  const seo = ROUTE_SEO[route] ?? ROUTE_SEO.home;
  const url = absoluteUrl(seo.path);
  const images = [
    {
      alt: `${APP_NAME} water-fill timing game preview`,
      height: SITE_IMAGE_HEIGHT,
      type: "image/png",
      url: SITE_IMAGE_URL,
      width: SITE_IMAGE_WIDTH,
    },
  ];

  return {
    title: {
      absolute: seo.title,
    },
    description: seo.description,
    keywords: SEO_KEYWORDS,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url,
      siteName: APP_NAME,
      images,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images,
    },
    robots: options.robots,
  };
}

export function createJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": `${SITE_URL}/#website`,
        "@type": "WebSite",
        alternateName: [
          "Pourcision Water Fill Game",
          "Pourcision Timing Game",
          "Pourcision Water Game",
          "Pourcision Browser Game",
        ],
        description: SITE_DESCRIPTION,
        inLanguage: "en",
        name: APP_NAME,
        publisher: {
          "@id": `${SITE_URL}/#creator`,
        },
        url: SITE_URL,
      },
      {
        "@id": `${SITE_URL}/#creator`,
        "@type": "Person",
        name: "furkancosar",
        url: "https://furkancosar.com",
      },
      {
        "@id": `${SITE_URL}/#game`,
        "@type": ["SoftwareApplication", "VideoGame"],
        alternateName: [
          "Pourcision Water Fill Game",
          "Pourcision Water Timing Game",
          "Pourcision Target Line Game",
          "Pourcision Multiplayer Game",
          "Pourcision Singleplayer Game",
        ],
        applicationCategory: "GameApplication",
        browserRequirements: "Requires JavaScript and a modern web browser.",
        creator: {
          "@id": `${SITE_URL}/#creator`,
        },
        description: SITE_DESCRIPTION,
        featureList: [
          "Singleplayer target-line timing runs",
          "Public and private multiplayer lobbies",
          "Selectable 1, 3, 5, or 10 round matches",
          "Easy, Normal, and Hard difficulty",
          "Classic, Invert, Flash, No Guide, Draining, Leaky, Fake Target, Split Fill, All or Nothing, Band Run, Pressure Charge, Burst Click, Blind, Auto Rise, Tilt, and Chaos Queue rule modes",
          "Shared multiplayer lobbies with the same rule set as singleplayer",
        ],
        gamePlatform: "Web browser",
        genre: ["Water timing game", "Arcade timing game", "Browser game"],
        image: SITE_IMAGE_URL,
        isAccessibleForFree: true,
        keywords: SEO_KEYWORDS.join(", "),
        mainEntityOfPage: {
          "@id": `${SITE_URL}/#website`,
        },
        name: APP_NAME,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        operatingSystem: "Web browser",
        playMode: ["SinglePlayer", "MultiPlayer"],
        potentialAction: {
          "@type": "PlayAction",
          name: "Play Pourcision",
          target: SITE_URL,
        },
        url: SITE_URL,
      },
    ],
  };
}
