import { getCollection, type CollectionEntry } from "astro:content";

export type WorkEntry = CollectionEntry<"works">;
export type NovelChapterEntry = CollectionEntry<"novelChapters">;
export type ComicChapterEntry = CollectionEntry<"comicChapters">;
export type ChapterEntry = NovelChapterEntry | ComicChapterEntry;
export type NovelSectionEntry = CollectionEntry<"novelSections">;

export async function getPublishedWorks(): Promise<WorkEntry[]> {
  const works = await getCollection("works", ({ data }) => !data.draft);
  return works.sort(
    (left, right) => right.data.updatedAt.getTime() - left.data.updatedAt.getTime(),
  );
}

export async function getPublishedChapters(
  workSlug: string,
  workType: WorkEntry["data"]["type"],
): Promise<ChapterEntry[]> {
  const chapters =
    workType === "novel"
      ? await getCollection(
          "novelChapters",
          ({ data }) => !data.draft && data.work === workSlug,
        )
      : await getCollection(
          "comicChapters",
          ({ data }) => !data.draft && data.work === workSlug,
        );

  return chapters.sort((left, right) => left.data.order - right.data.order);
}

export async function getPublishedSections(
  workSlug: string,
  chapterId: string,
): Promise<NovelSectionEntry[]> {
  const sections = await getCollection(
    "novelSections",
    ({ data }) =>
      !data.draft && data.work === workSlug && data.chapterId === chapterId,
  );

  return sections.sort((left, right) => left.data.order - right.data.order);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function workTypeLabel(type: WorkEntry["data"]["type"]): string {
  return type === "novel" ? "小说" : "漫画";
}

export function workStatusLabel(status: WorkEntry["data"]["status"]): string {
  const labels: Record<WorkEntry["data"]["status"], string> = {
    upcoming: "即将开始",
    serializing: "连载中",
    completed: "已完结",
    paused: "暂停更新",
  };
  return labels[status];
}
