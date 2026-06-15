# Pourcision

Water-fill timing game built with Next.js.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and fill the deployment values.

```bash
NEXT_PUBLIC_SITE_URL=https://www.pourcision.com
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

`NEXT_PUBLIC_SITE_URL` drives canonical URLs, Open Graph URLs, `robots.txt`,
and `sitemap.xml`.

`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` renders the Google Search Console
verification meta tag when the value is present.

`NEXT_PUBLIC_GA_MEASUREMENT_ID` enables the GA4 Google tag and client-side
route tracking. Leave it empty in local development if you do not want test
traffic in Analytics.

## SEO

The app uses the Next.js App Router metadata API:

- `src/lib/seo.js` owns titles, descriptions, canonical URLs, Open Graph data,
  Twitter card data, keywords, and JSON-LD.
- `src/app/sitemap.js` lists the public canonical pages.
- `src/app/robots.js` allows crawling and points crawlers to the sitemap.
- `src/app/[roomCode]/page.jsx` marks private lobby URLs as `noindex`.

Public Search Console sitemap URL:

```text
https://www.pourcision.com/sitemap.xml
```

## Analytics Events

GA4 is enabled by `src/components/analytics/GoogleAnalytics.jsx`. Game actions
are tracked through `src/lib/analytics.js`.

Tracked events:

- `level_start`: singleplayer and multiplayer match starts.
- `level_end`: match completion.
- `post_score`: final score submission.
- `lobby_create`: multiplayer lobby creation.
- `lobby_join`: multiplayer lobby join.
- `multiplayer_game_start`: host starts a multiplayer match.
