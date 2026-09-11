import { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://clavis.lundstromslogiska.se");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup"],
      disallow: ["/api/", "/dashboard/", "/admin/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
