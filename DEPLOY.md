# GitHub + Cloudflare Pages 部署 — v0.0.2

## 1. 发布前检查

在项目根目录运行：

```bash
npm run check
```

只有检查通过后再提交。

## 2. GitHub

第一次：

```bash
git init
git add .
git commit -m "SANQI artist website v0.0.2"
git branch -M main
git remote add origin <你的 GitHub 仓库地址>
git push -u origin main
```

以后更新：

```bash
git add .
git commit -m "Update works"
git push
```

## 3. Cloudflare Pages

Cloudflare Dashboard 中：

1. Workers & Pages
2. Create application
3. Pages
4. Import an existing Git repository
5. 连接 GitHub 仓库
6. Production branch：`main`
7. Build command：`npm run build`
8. Build output directory：`dist`
9. Root directory：留空
10. Deploy

项目要求 Node.js 20+；仓库中的 `.node-version` 已用于固定 Node 主版本。

之后每次向 `main` push，Cloudflare Pages 会自动重新构建并部署。

## 4. 自定义域名

部署成功后，在 Cloudflare Pages 项目的 Custom domains 添加你的域名。

确认正式域名后，可以再为网站补充 canonical URL 和正式 sitemap 域名。

## 5. dist/

不要手动维护或提交 `dist/`。

`.gitignore` 已忽略它。Cloudflare 会在每次部署时通过：

```bash
npm run build
```

重新生成。
