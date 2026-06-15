import { APP_NAME, ROUTES } from "@/lib/constants";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.pourcision.com";

export const SITE_IMAGE_PATH = "/og-image.png";
export const SITE_IMAGE_URL = absoluteUrl(SITE_IMAGE_PATH);
export const SITE_IMAGE_WIDTH = 1366;
export const SITE_IMAGE_HEIGHT = 768;
export const SITE_LAST_MODIFIED = "2026-06-10T00:00:00.000Z";

export const SITE_DESCRIPTION =
  "Pourcision is a free online precision fill game. Hold to raise the water, read the moving surface, release near the target line, and score your timing across singleplayer or multiplayer rounds.";

export const SEO_KEYWORDS = [
  "Pourcision",
  "Pourcision game",
  "Pourcision precision game",
  "Pourcision water game",
  "fill game",
  "precision game",
  "precision fill game",
  "water fill game",
  "water timing game",
  "water precision game",
  "water physics game",
  "target line game",
  "target line timing game",
  "pouring game",
  "pouring precision game",
  "one hold game",
  "release timing game",
  "reaction timing game",
  "browser game",
  "free online game",
  "online precision game",
  "free online precision game",
  "singleplayer precision game",
  "multiplayer browser game",
  "multiplayer precision game",
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
    title: "Pourcision - Precision Fill Game",
  },
  singleplayer: {
    description:
      "Play Pourcision singleplayer across five precision fill rounds. Choose Easy, Normal, or Hard, pick a rule mode, and release the water closest to the target line.",
    path: ROUTES.SINGLEPLAYER,
    title: "Precision Fill Singleplayer Game - Pourcision",
  },
  multiplayer: {
    description:
      "Create a Pourcision lobby, invite friends, and compete in a multiplayer precision fill game with shared target-line rounds and visible opponent water levels.",
    path: ROUTES.MULTIPLAYER,
    title: "Multiplayer Precision Fill Game - Pourcision",
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
      alt: `${APP_NAME} free online precision fill game preview`,
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
          "Pourcision Fill Game",
          "Pourcision Precision Game",
          "Pourcision Water Game",
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
          "Pourcision Precision Fill Game",
          "Pourcision Water Timing Game",
          "Pourcision Target Line Game",
        ],
        applicationCategory: "GameApplication",
        browserRequirements: "Requires JavaScript and a modern web browser.",
        creator: {
          "@id": `${SITE_URL}/#creator`,
        },
        description: SITE_DESCRIPTION,
        featureList: [
          "Singleplayer precision fill rounds",
          "Public and private multiplayer lobbies",
          "Easy, Normal, and Hard difficulty",
          "Classic, Invert, Flash, No Guide, Draining, Leaky, Fake Target, Split Fill, All or Nothing, Band Run, Pressure Charge, Burst Click, Blind, Tilt, and Chaos Queue rule modes",
          "Five-round target-line scoring",
          "Shared multiplayer lobbies with the same rule set as singleplayer",
        ],
        gamePlatform: "Web browser",
        genre: ["Precision game", "Timing game", "Browser game"],
        image: SITE_IMAGE_URL,
        isAccessibleForFree: true,
        keywords: SEO_KEYWORDS.join(", "),
        name: APP_NAME,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        operatingSystem: "Web browser",
        playMode: ["SinglePlayer", "MultiPlayer"],
        url: SITE_URL,
      },
    ],
  };
}
