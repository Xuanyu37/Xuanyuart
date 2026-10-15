# SANQI Artist Website — v0.0.2

这是可直接放到 GitHub 并由 Cloudflare Pages 构建的**纯净版**项目。

本项目不包含示例作品、示例系列、占位作品图片或示例 CV 内容。你可以从空白状态开始加入自己的内容。

## 你日常主要会修改的地方

```text
content/
├─ site.json          # 名字、联系方式、三语界面文字、媒介名称
├─ pages/
│  ├─ home.json       # 首页展示哪些作品 / 系列
│  ├─ about.json      # About 照片、Biography、Artist Statement
│  ├─ cv.json         # CV
│  └─ contact.json    # Contact 页面文字
└─ works/
   └─ YYYY/           # 按年份整理作品与系列

public/
├─ images/            # About 等全站公共图片
└─ files/             # CV PDF 等公共文件
```

## 作品档案规则

- 所有创作内容都放在 `content/works/YYYY/`。
- 单件作品文件夹内放 `work.json`。
- 系列文件夹内放 `series.json`。
- 当前网站检索只使用：**年份 / 媒介 / 系列**。
- 不使用 Theme / 主题字段。
- 单件作品的 `medium` 使用数组，因此一件作品可同时属于多个媒介。
- 文件夹负责你自己的整理；网站最终以 JSON metadata 为准。

## 常用命令

```bash
npm run new:work -- 2027/作品文件夹名
npm run new:series -- 2027/系列文件夹名
npm run check
npm run build
npm run preview
```

新建命令创建的内容默认 `published: false`。填好资料、放好媒体后，再改成 `true`。

## 发布前必须做

```bash
npm run check
```

看到 `Check passed` 后再 `git push`。

更详细、适合零基础维护的说明见随项目提供的 `MANAGEMENT_GUIDE_ZH.md`。
部署步骤见 `DEPLOY.md`。
