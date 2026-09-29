import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";

import matter from "gray-matter";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const PUBLIC_ROOT = join(PROJECT_ROOT, "public");
const CONTENT_ROOT = join(PROJECT_ROOT, "src", "content");
const CONTENT_EXTENSIONS = new Set([".md", ".mdx"]);
const CHAPTER_ID_PATTERN = /^\d{3,}$/;
const SECTION_ID_PATTERN = /^\d{2,}$/;

function listContentFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return listContentFiles(entryPath);
    return CONTENT_EXTENSIONS.has(extname(entry.name)) ? [entryPath] : [];
  });
}

function readEntries(collectionName) {
  return listContentFiles(join(CONTENT_ROOT, collectionName)).map((filePath) => ({
    filePath,
    data: matter(readFileSync(filePath, "utf8")).data,
  }));
}

function addError(errors, filePath, message) {
  errors.push(`${filePath.replace(`${PROJECT_ROOT}/`, "")}: ${message}`);
}

function validateWorks(works, errors) {
  const seenSlugs = new Set();
  for (const work of works) {
    if (!work.data.slug) addError(errors, work.filePath, "缺少 slug");
    if (seenSlugs.has(work.data.slug)) {
      addError(errors, work.filePath, `作品 slug 重复：${work.data.slug}`);
    }
    seenSlugs.add(work.data.slug);
  }
  return new Map(works.map((work) => [work.data.slug, work]));
}

function validateLocalAsset(entry, assetPath, errors) {
  if (!assetPath || /^(?:https?:)?\/\//.test(assetPath)) return;
  const normalizedPath = assetPath.replace(/^\/+/, "");
  if (!existsSync(join(PUBLIC_ROOT, normalizedPath))) {
    addError(errors, entry.filePath, `找不到图片：${assetPath}`);
  }
}

function validateChapter(entry, expectedType, worksBySlug, uniqueKeys, orders, errors) {
  const work = worksBySlug.get(entry.data.work);
  if (!work) {
    addError(errors, entry.filePath, `引用了不存在的作品：${entry.data.work}`);
    return;
  }
  if (work.data.type !== expectedType) {
    addError(errors, entry.filePath, `章节类型与作品 type: ${work.data.type} 不一致`);
  }
  if (!CHAPTER_ID_PATTERN.test(String(entry.data.chapterId ?? ""))) {
    addError(errors, entry.filePath, "chapterId 必须是至少三位数字，例如 001");
  }

  const uniqueKey = `${entry.data.work}:${entry.data.chapterId}`;
  if (uniqueKeys.has(uniqueKey)) addError(errors, entry.filePath, `章节编号重复：${uniqueKey}`);
  uniqueKeys.add(uniqueKey);

  const orderKey = `${entry.data.work}:${entry.data.order}`;
  if (orders.has(orderKey)) addError(errors, entry.filePath, `章节顺序重复：${orderKey}`);
  orders.add(orderKey);

  if (!entry.data.draft && work.data.draft) {
    addError(errors, entry.filePath, "已发布章节不能隶属于草稿作品");
  }
  if (!entry.data.draft) validateLocalAsset(entry, entry.data.shareImage, errors);
}

function validateChapters(entries, expectedType, worksBySlug, errors) {
  const uniqueKeys = new Set();
  const orders = new Set();
  for (const entry of entries) {
    validateChapter(entry, expectedType, worksBySlug, uniqueKeys, orders, errors);
    if (expectedType === "comic") {
      if (!Array.isArray(entry.data.pages) || entry.data.pages.length === 0) {
        addError(errors, entry.filePath, "漫画章节至少需要一页图片");
      } else {
        if (!entry.data.draft) {
          for (const page of entry.data.pages) validateLocalAsset(entry, page.src, errors);
        }
      }
    }
  }
}

function validateSections(sections, worksBySlug, chapters, errors) {
  const chapterKeys = new Set(
    chapters.map((chapter) => `${chapter.data.work}:${chapter.data.chapterId}`),
  );
  const sectionKeys = new Set();
  const sectionOrders = new Set();

  for (const section of sections) {
    const work = worksBySlug.get(section.data.work);
    if (!work || work.data.type !== "novel") {
      addError(errors, section.filePath, "小节必须隶属于已登记的小说作品");
      continue;
    }

    const chapterKey = `${section.data.work}:${section.data.chapterId}`;
    if (!CHAPTER_ID_PATTERN.test(String(section.data.chapterId ?? ""))) {
      addError(errors, section.filePath, "chapterId 必须是至少三位数字，例如 001");
    }
    if (!chapterKeys.has(chapterKey)) {
      addError(errors, section.filePath, `找不到所属章节：${chapterKey}`);
    }
    if (!SECTION_ID_PATTERN.test(String(section.data.sectionId ?? ""))) {
      addError(errors, section.filePath, "sectionId 必须是至少两位数字，例如 01");
    }

    const sectionKey = `${chapterKey}:${section.data.sectionId}`;
    if (sectionKeys.has(sectionKey)) {
      addError(errors, section.filePath, `小节编号重复：${sectionKey}`);
    }
    sectionKeys.add(sectionKey);

    const orderKey = `${chapterKey}:${section.data.order}`;
    if (sectionOrders.has(orderKey)) {
      addError(errors, section.filePath, `章节内小节顺序重复：${orderKey}`);
    }
    sectionOrders.add(orderKey);

    if (!section.data.draft && work.data.draft) {
      addError(errors, section.filePath, "已发布小节不能隶属于草稿作品");
    }
    if (!section.data.draft) validateLocalAsset(section, section.data.shareImage, errors);
  }
}

const errors = [];
const works = readEntries("works");
const worksBySlug = validateWorks(works, errors);
for (const work of works) {
  if (!work.data.draft) {
    validateLocalAsset(work, work.data.cover, errors);
    validateLocalAsset(work, work.data.shareImage, errors);
  }
}
const novelChapters = readEntries("novel-chapters");
validateChapters(novelChapters, "novel", worksBySlug, errors);
validateChapters(readEntries("comic-chapters"), "comic", worksBySlug, errors);
validateSections(
  readEntries("novel-sections"),
  worksBySlug,
  novelChapters,
  errors,
);

if (errors.length > 0) {
  console.error(`内容校验失败（${errors.length} 项）：\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`内容校验通过：${works.length} 部作品。`);
}
