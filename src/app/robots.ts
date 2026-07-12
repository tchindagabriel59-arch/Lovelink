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
        "/premium",
        "/verification",
      ],
    },
    sitemap: "https://lovelink237.com/sitemap.xml",
  };
}
