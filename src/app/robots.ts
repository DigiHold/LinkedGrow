import { MetadataRoute } from "next";

const BASE_URL = "https://linkedgrow.ai";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/onboarding/",
          "/checkout/",
          "/maintenance/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
