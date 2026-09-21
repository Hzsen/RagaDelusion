import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const stableSlug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "请使用小写英文、数字和连字符");

const works = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/works" }),
  schema: z.object({
    slug: stableSlug,
    title: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(["novel", "comic"]),
    tags: z.array(z.string()).default([]),
    status: z.enum(["upcoming", "serializing", "completed", "paused"]),
    cover: z.string().optional(),
    shareImage: z.string().optional(),
    discordUrl: z.url().optional(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#9f5b44"),
    updatedAt: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

const chapterBase = {
  work: stableSlug,
  chapterId: z
    .string()
    .regex(/^\d{3,}$/, "章节编号至少三位，例如 001"),
  title: z.string().min(1),
  summary: z.string().min(1),
  order: z.number().int().positive(),
  publishedAt: z.coerce.date(),
  shareImage: z.string().optional(),
  draft: z.boolean().default(false),
};

const novelChapters = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/novel-chapters",
  }),
  schema: z.object(chapterBase),
});

const comicChapters = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/comic-chapters",
  }),
  schema: z.object({
    ...chapterBase,
    pages: z
      .array(
        z.object({
          src: z.string().min(1),
          alt: z.string().min(1),
        }),
      )
      .min(1),
  }),
});

export const collections = { works, novelChapters, comicChapters };
