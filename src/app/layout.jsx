import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import InteractionAudio from "@/components/layout/InteractionAudio";
import PageIntro from "@/components/layout/PageIntro";
import PreferenceBootstrap from "@/components/layout/PreferenceBootstrap";
import StructuredData from "@/components/seo/StructuredData";
import { APP_NAME } from "@/lib/constants";
import { GOOGLE_SITE_VERIFICATION } from "@/lib/analytics";
import {
  ROUTE_SEO,
  SEO_KEYWORDS,
  SITE_DESCRIPTION,
  SITE_IMAGE_HEIGHT,
  SITE_IMAGE_URL,
  SITE_IMAGE_WIDTH,
  SITE_URL,
} from "@/lib/seo";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const PAGE_INTRO_SCRIPT = `(() => {
  try {
    const path = window.location.pathname;
    const segments = path.split("/").filter(Boolean);
    const isEntryPath = path === "/" || (segments.length === 1 && /^\\d{6}$/.test(segments[0]));
    if (!isEntryPath) return;

    document.documentElement.dataset.pageIntroPending = "true";
    window.setTimeout(() => {
      if (document.documentElement.dataset.pageIntroPending === "true") {
        delete document.documentElement.dataset.pageIntroPending;
      }
    }, 5200);
  } catch {}
})();`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: APP_NAME,
  title: {
    default: ROUTE_SEO.home.title,
    template: `%s | ${APP_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  authors: [{ name: "furkancosar", url: "https://furkancosar.com" }],
  creator: "furkancosar",
  publisher: "furkancosar",
  generator: "Next.js",
  category: "game",
  classification: "Browser game",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: ROUTE_SEO.home.title,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: APP_NAME,
    images: [
      {
        alt: `${APP_NAME} free online precision fill game preview`,
        height: SITE_IMAGE_HEIGHT,
        type: "image/png",
        url: SITE_IMAGE_URL,
        width: SITE_IMAGE_WIDTH,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: ROUTE_SEO.home.title,
    description: SITE_DESCRIPTION,
    images: [
      {
        alt: `${APP_NAME} free online precision fill game preview`,
        url: SITE_IMAGE_URL,
      },
    ],
    creator: "@furkancosar",
  },
  ...(GOOGLE_SITE_VERIFICATION
    ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
    : {}),
  robots: {
    follow: true,
    index: true,
    nocache: false,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
      noimageindex: false,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#000000",
    "msapplication-TileImage": "/icon-512.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0c" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col overflow-hidden" suppressHydrationWarning>
        <Script
          id="pourcision-page-intro-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: PAGE_INTRO_SCRIPT }}
        />
        <PreferenceBootstrap />
        <GoogleAnalytics />
        <StructuredData />
        <InteractionAudio />
        <PageIntro />
        {children}
      </body>
    </html>
  );
}
