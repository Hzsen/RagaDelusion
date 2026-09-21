import type { APIRoute } from "astro";

import { getPublishedChapters, getPublishedWorks } from "../lib/content";
import { chapterPath, sitePath, workPath } from "../lib/urls";

function escapeXml(value: string): string {
  return value.replace(/[<>&'\"]/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? new URL("https://hzsen.github.io");
  const works = await getPublishedWorks();
  const locations = [sitePath()];

  for (const work of works) {
    locations.push(workPath(work.data.slug));
    const chapters = await getPublishedChapters(work.data.slug, work.data.type);
    for (const chapter of chapters) {
      locations.push(chapterPath(work.data.slug, chapter.data.chapterId));
    }
  }

  const urls = locations
    .map((location) => `<url><loc>${escapeXml(new URL(location, origin).toString())}</loc></url>`)
    .join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};

