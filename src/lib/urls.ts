function normalizeBase(base: string): string {
  return base.endsWith("/") ? base : `${base}/`;
}

export function sitePath(path = ""): string {
  const base = normalizeBase(import.meta.env.BASE_URL);
  const cleanPath = path.replace(/^\/+/, "");
  return cleanPath ? `${base}${cleanPath}` : base;
}

export function workPath(workSlug: string): string {
  return sitePath(`works/${workSlug}/`);
}

export function chapterPath(workSlug: string, chapterId: string): string {
  return sitePath(`works/${workSlug}/chapters/${chapterId}/`);
}

export function assetPath(path: string): string {
  if (/^(?:https?:)?\/\//.test(path) || path.startsWith("data:")) {
    return path;
  }

  return sitePath(path);
}

