import { SITE_URL } from "@/lib/seo";

export default function robots() {
  const host = new URL(SITE_URL).host;

  return {
    rules: [
      {
        allow: "/",
        userAgent: "*",
      },
    ],
    host,
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
