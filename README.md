# Raga Delusion 阅读站

一个使用 Astro 构建的静态小说 / 漫画阅读站。首页直接显示书架，作品页直接显示章节目录。

## 本地预览

需要 Node.js 22.12 或更高版本。

```bash
npm install
npm run dev
```

提交前运行完整检查：

```bash
npm run check
npm run build
```

## 添加作品

1. 复制 `content-templates/work.md` 到 `src/content/works/<作品英文名>.md`。
2. 填写作品元数据；`slug` 发布后不要修改，它是永久链接的一部分。
3. 准备公开时，将 `draft` 改为 `false`。

作品 `type` 只能是：

- `novel`：小说。
- `comic`：漫画。

作品 `status` 可以是 `upcoming`、`serializing`、`completed` 或 `paused`。

## 添加小说章节

复制 `content-templates/novel-chapter.md` 到：

```text
src/content/novel-chapters/<作品 slug>/<章节编号>.md
```

`chapterId` 使用至少三位数字，例如 `001`。链接会固定为：

```text
/works/<作品 slug>/chapters/<chapterId>/
```

章节改名不会改变链接。`order` 决定目录、上一章和下一章的顺序。

## 添加漫画章节

复制 `content-templates/comic-chapter.md` 到：

```text
src/content/comic-chapters/<作品 slug>/<章节编号>.md
```

压缩后的阅读图片建议放在：

```text
public/images/<作品 slug>/<章节编号>/
```

页面顺序只由章节文件中的 `pages` 清单决定，不根据文件名猜测。每一页必须填写有意义的 `alt` 文本。

## 图片与 Discord 分享

- 书架不展示封面；如需为分享卡片指定图片，可填写 `shareImage`。
- 分享图推荐使用 JPG 或 PNG，尺寸为 1200 × 630。
- 网站默认分享图位于 `public/share/default-og.png`。
- 作品和章节都可以通过 `shareImage` 覆盖默认分享图。
- Discord 可能缓存旧预览；修改图片后，可临时给分享链接增加查询参数重新测试。

## 发布到 GitHub Pages

推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会自动校验和发布。第一次使用时，需要在仓库设置中选择：

1. 打开 **Settings → Pages**。
2. 将 **Build and deployment → Source** 设置为 **GitHub Actions**。
3. 重新运行 `Deploy to GitHub Pages` 工作流。

默认地址为：

```text
https://hzsen.github.io/RagaDelusion/
```

站点会在 GitHub Actions 中自动识别仓库子路径。将来使用自定义域名时，可在构建环境中设置 `SITE_URL` 和 `BASE_PATH=/`。

## 发布安全

`draft: true` 只会阻止页面生成，不能为公开仓库里的文件保密。未公开剧情、提示词、高清原图和其他敏感素材必须保存在仓库之外。

构建会检查：作品 slug 重复、章节编号格式、章节顺序重复、作品类型不匹配、已发布章节引用草稿作品，以及漫画图片和分享图是否真实存在。
