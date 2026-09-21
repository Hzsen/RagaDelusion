import type { APIRoute } from "astro";

import { sitePath } from "../lib/urls";

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL("https://hzsen.github.io");
  const sitemapUrl = new URL(sitePath("sitemap.xml"), origin);
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

