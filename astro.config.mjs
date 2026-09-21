import { defineConfig } from "astro/config";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const githubPagesBase =
  process.env.GITHUB_ACTIONS === "true" && repositoryName
    ? `/${repositoryName}`
    : "/";

export default defineConfig({
  site: process.env.SITE_URL ?? "https://hzsen.github.io",
  base: process.env.BASE_PATH ?? githubPagesBase,
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  markdown: {
    shikiConfig: {
      theme: "github-light",
    },
  },
});

