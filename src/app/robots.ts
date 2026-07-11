import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/gabriel-boss/",
        "/dashboard",
        "/profile",
        "/messages",
        "/matches",
        "/discover",
        "/preferences",
        "/likes-recus",
        "/bloques",
        "/boost",
      ],
    },
    sitemap: "https://lovelink-omega.vercel.app/sitemap.xml",
  };
}
