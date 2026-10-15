# SANQI 艺术网站管理指南（零基础版）

适用版本：**v0.0.2**

这份指南的目标是：即使你不懂代码，也能长期自己添加作品、改文字、更新首页、检查网站并发布。

---

# 1. 先记住最重要的原则

你日常维护网站时，**90% 的时间只需要碰两个地方**：

```text
content/
public/
```

尽量不要随便修改：

```text
src/
scripts/
dist/
```

它们分别是网站样式、程序逻辑和自动生成结果。

尤其是：

> **不要手动修改 `dist/`。**

每次构建网站时，`dist/` 都会重新生成，你手工改的内容会消失。

---

# 2. 网站文件夹是怎么工作的

最重要的结构：

```text
content/
├─ site.json
├─ pages/
│  ├─ home.json
│  ├─ about.json
│  ├─ cv.json
│  └─ contact.json
└─ works/
   ├─ 2026/
   ├─ 2025/
   ├─ 2024/
   └─ ...
```

你的作品全部在：

```text
content/works/
```

第一层按照年份整理。

例如：

```text
content/works/2027/
```

里面可以放很多具体作品文件夹。

每一件作品有自己的文件夹：

```text
content/works/2027/作品文件夹/
├─ work.json
├─ cover.webp
├─ 01.webp
└─ 02.webp
```

每一个系列也有自己的文件夹：

```text
content/works/2027/系列文件夹/
├─ series.json
├─ 01.webp
├─ 02.webp
└─ 03.webp
```

网站不会根据文件夹名字猜作品是什么。

网站真正读取的是：

```text
work.json
series.json
```

所以：

- 文件夹 = 方便你自己整理
- JSON = 告诉网站如何展示和分类

---

# 3. JSON 是什么？你只需要知道这几条

JSON 看起来像这样：

```json
{
  "title": "作品标题",
  "year": 2027,
  "published": false
}
```

你只需要记住：

1. 文字必须放在英文双引号 `" "` 中。
2. 每一项后面通常有逗号 `,`，但最后一项不能多逗号。
3. `true` / `false` 不加引号。
4. 数字不需要引号。
5. `null` 表示“没有这个内容”。
6. 中括号 `[ ]` 表示一组东西。

例如多个媒介：

```json
"medium": [
  "installation",
  "sound"
]
```

如果你不确定 JSON 是否写错，运行：

```bash
npm run check
```

只要 JSON 少逗号、少引号或结构错误，它会告诉你。

---

# 4. 第一次在电脑上打开项目

你的电脑需要安装 Node.js 20 或更高版本。

在项目文件夹打开终端，然后运行：

```bash
npm run check
```

如果最后看到：

```text
Check passed
```

说明项目结构正常。

想在本地看网站：

```bash
npm run build
npm run preview
```

终端会显示本地地址，在浏览器打开即可。

---

# 5. 添加一件普通作品

最简单的方法不是自己创建文件，而是让网站帮你创建。

假设作品年份是 2027：

```bash
npm run new:work -- 2027/你的作品文件夹名
```

建议文件夹名使用：

```text
小写英文字母
数字
-
```

例如：

```text
sans-titre-2027
room-study-01
installation-03
```

不要使用：

```text
空格
/
中文标点
特殊符号
```

命令会创建：

```text
content/works/2027/你的作品文件夹名/work.json
```

然后把你的图片放进同一个文件夹。

---

# 6. 一件作品的 work.json 怎么填

基本结构：

```json
{
  "type": "work",
  "slug": "作品网址名称",
  "title": "作品正式标题",
  "year": 2027,
  "medium": ["painting"],
  "series": null,
  "aspect": "landscape",
  "cover": "cover.webp",
  "images": ["cover.webp"],
  "published": false,
  "showInWorks": true,
  "dimensions": "100 × 80 cm",
  "duration": null,
  "description": {
    "fr": "",
    "en": "",
    "zh": ""
  }
}
```

下面逐项解释。

## `slug`

这是作品网址里使用的名字。

必须是：

```text
小写英文 / 数字 / 横线
```

例如：

```json
"slug": "sans-titre-2027"
```

生成的网址类似：

```text
/works/sans-titre-2027/
```

同一个网站不能有两个完全一样的 slug。

## `title`

正式作品标题。

```json
"title": "Sans titre"
```

作品标题默认不会因为网站切换语言而自动翻译。

## `year`

作品实际年份：

```json
"year": 2027
```

## `medium`

媒介永远写成数组，即使只有一个。

绘画：

```json
"medium": ["painting"]
```

声音装置：

```json
"medium": ["sound", "installation"]
```

视频 + 声音 + 装置：

```json
"medium": ["video", "sound", "installation"]
```

这样一件作品可以同时在多个媒介筛选中出现。

## `series`

不属于任何系列：

```json
"series": null
```

属于某个系列：

```json
"series": "系列的-slug"
```

这里填写的是系列 `series.json` 里的 `slug`，不是系列标题。

## `aspect`

用于 Works 缩略图的大致比例：

```text
landscape   横图
portrait    竖图
square      方形
```

例如：

```json
"aspect": "portrait"
```

它不会裁掉你的作品，只是控制缩略图区块比例。

## `cover`

Works 页面和首页使用的封面：

```json
"cover": "cover.webp"
```

## `images`

详情页要显示的图片：

```json
"images": [
  "cover.webp",
  "detail-01.webp",
  "detail-02.webp"
]
```

如果只有一张：

```json
"images": ["cover.webp"]
```

## `published`

草稿：

```json
"published": false
```

正式上线：

```json
"published": true
```

建议你添加新作品时永远先保持 `false`。

全部检查完再改成 `true`。

## `showInWorks`

正常出现在 Works 总档案：

```json
"showInWorks": true
```

如果你想保留独立网址，但不想让它出现在 Works：

```json
"showInWorks": false
```

## `dimensions`

简单写法：

```json
"dimensions": "120 × 160 cm"
```

如果不同语言需要不同文字，可以写：

```json
"dimensions": {
  "fr": "Dimensions variables",
  "en": "Variable dimensions",
  "zh": "尺寸可变"
}
```

## `duration`

视频 / 声音时长：

```json
"duration": "08:42"
```

普通绘画可以：

```json
"duration": null
```

## `description`

作品简介：

```json
"description": {
  "fr": "法语说明",
  "en": "English description",
  "zh": "中文说明"
}
```

不需要作品介绍时全部留空即可。

---

# 7. 图片可以加独立说明和 alt

简单图片列表：

```json
"images": [
  "01.webp",
  "02.webp"
]
```

如果需要给一张图片加说明，可以写成：

```json
"images": [
  {
    "src": "01.webp",
    "caption": {
      "fr": "Vue d’installation",
      "en": "Installation view",
      "zh": "装置现场"
    },
    "alt": {
      "fr": "Vue de l’œuvre dans l’espace",
      "en": "View of the work in the space",
      "zh": "作品在空间中的现场图"
    }
  }
]
```

`caption` 会显示在图片下面。

`alt` 主要给无障碍工具和搜索引擎理解图片使用。

---

# 8. 添加视频作品

在 `work.json` 中增加：

```json
"video": "video.mp4",
"poster": "cover.webp",
"duration": "08:42"
```

完整视频文件放在同一个作品文件夹里。

建议：

- 网页视频优先 MP4 / H.264。
- 不要直接上传超大原始母版。
- 网站使用压缩后的展示版本。
- 原始母版单独备份，不放网站仓库。

如果视频很大，不适合 GitHub / 静态网站仓库，可以以后改用外部视频托管或 Cloudflare 的视频方案；网站结构不需要因此重做。

---

# 9. 添加声音作品

增加：

```json
"audio": "audio.mp3",
"duration": "11:24"
```

声音文件放作品文件夹。

如果声音作品也是装置：

```json
"medium": ["sound", "installation"]
```

详情页可以同时有：

- 音频播放器
- 装置现场图片
- 作品说明

---

# 10. 多媒介作品怎么办

直接同时写多个媒介：

```json
"medium": [
  "installation",
  "video",
  "sound"
]
```

然后同一件作品可以同时拥有：

```json
"video": "video.mp4",
"audio": "audio.mp3",
"images": [
  "01.webp",
  "02.webp"
]
```

网站会把它当成同一件作品，而不是三件作品。

---

# 11. 添加一个系列

运行：

```bash
npm run new:series -- 2027/系列文件夹名
```

生成：

```text
content/works/2027/系列文件夹名/series.json
```

基本结构：

```json
{
  "type": "series",
  "slug": "系列-slug",
  "title": "系列标题",
  "years": [2027],
  "mediums": ["photography"],
  "aspect": "landscape",
  "cover": "01.webp",
  "images": [
    "01.webp",
    "02.webp"
  ],
  "published": false,
  "showInWorks": true,
  "description": {
    "fr": "",
    "en": "",
    "zh": ""
  }
}
```

---

# 12. 跨年份系列

例如一个系列持续 2025、2026、2027：

```json
"years": [2025, 2026, 2027]
```

这样筛选：

```text
2025
2026
2027
```

都可以找到这个系列。

注意：

如果系列真的跨三年，建议把每个年份都写进去，而不是只写：

```json
[2025, 2027]
```

否则网站只会认为它属于 2025 和 2027，不会自动猜 2026。

系列文件夹可以放在你认为最适合整理的年份里，通常推荐开始年份。

---

# 13. 系列里的单件作品还需要独立页面

你有两种方法。

## 方法 A：作品放自己的真实年份目录

例如某件作品实际是 2027：

```text
content/works/2027/作品文件夹/work.json
```

然后：

```json
"series": "系列-slug"
```

这是最清楚、最推荐的长期方法。

## 方法 B：嵌套在系列文件夹里

如果你自己整理文件时更喜欢把系列东西放在一起，也支持嵌套。

运行：

```bash
npm run new:work -- 2027/系列文件夹/作品文件夹
```

如果父目录有 `series.json`，新建工具会自动填写系列 slug。

---

# 14. 更新首页

文件：

```text
content/pages/home.json
```

它有两个部分：

```json
{
  "feature": [],
  "secondary": []
}
```

`feature` 是首页最大的主轮播。

`secondary` 是下面较小的作品。

引用单件作品：

```text
work:作品-slug
```

引用系列：

```text
series:系列-slug
```

例如你想放自己的内容时，把相应引用填进数组。

注意：被首页引用的作品必须：

```json
"published": true
```

否则构建会直接报错，避免首页出现坏链接。

首页完全为空也是合法的，所以你可以慢慢添加。

---

# 15. 修改 About

文件：

```text
content/pages/about.json
```

基本结构：

```json
{
  "photo": "/images/about.webp",
  "orientation": "portrait",
  "photoAlt": {
    "fr": "",
    "en": "",
    "zh": ""
  },
  "biography": {
    "fr": "",
    "en": "",
    "zh": ""
  },
  "statement": {
    "fr": "",
    "en": "",
    "zh": ""
  }
}
```

About 照片放到：

```text
public/images/
```

例如：

```text
public/images/about.webp
```

然后：

```json
"photo": "/images/about.webp"
```

竖图：

```json
"orientation": "portrait"
```

横图：

```json
"orientation": "landscape"
```

暂时不想放照片：

```json
"photo": null
```

网站仍然正常。

---

# 16. 修改 CV

文件：

```text
content/pages/cv.json
```

一个分类大概这样：

```json
{
  "title": {
    "fr": "Formation",
    "en": "Education",
    "zh": "教育"
  },
  "entries": [
    {
      "year": "2027",
      "text": {
        "fr": "法语内容",
        "en": "English content",
        "zh": "中文内容"
      }
    }
  ]
}
```

如果需要 CV PDF：

把 PDF 放：

```text
public/files/cv.pdf
```

然后：

```json
"pdf": "/files/cv.pdf"
```

不需要 PDF：

```json
"pdf": null
```

---

# 17. 修改 Contact

全站联系方式在：

```text
content/site.json
```

例如：

```json
"email": "你的邮箱",
"instagram": "你的 Instagram 完整链接"
```

不想显示某项，留空：

```json
"email": "",
"instagram": ""
```

Contact 页说明文字在：

```text
content/pages/contact.json
```

---

# 18. 新增一种媒介

网站目前已经有常用媒介。

如果以后需要新增，例如 Sculpture，先打开：

```text
content/site.json
```

在 `mediums` 中加入：

```json
"sculpture": {
  "fr": "Sculpture",
  "en": "Sculpture",
  "zh": "雕塑"
}
```

然后作品才能写：

```json
"medium": ["sculpture"]
```

如果你直接写一个 site.json 没定义的媒介，`npm run check` 会报错。

这是故意的，防止以后出现：

```text
Photography
photography
Photo
photo
```

四种不同拼法导致分类混乱。

---

# 19. 三种语言如何管理

网站默认：

```text
法语
```

英语路径：

```text
/en/
```

中文路径：

```text
/zh/
```

需要翻译的内容通常写成：

```json
{
  "fr": "法语",
  "en": "英语",
  "zh": "中文"
}
```

作品正式标题 `title` 默认只有一个，不强制翻译。

年份、尺寸数字、时长也不需要因为语言改变。

---

# 20. 图片怎么准备比较好

建议：

## 原始图片

保存在你自己的硬盘 / 云盘档案中。

不要为了网站覆盖原始文件。

## 网站图片

单独导出一份展示版本。

优先：

```text
.webp
.jpg
.avif
```

通常不需要上传几十 MB 的原图。

Works 缩略图和浏览器本身会 lazy load，但文件越轻，手机访问体验越好。

文件名建议：

```text
cover.webp
01.webp
02.webp
detail-01.webp
installation-view-01.webp
```

避免：

```text
最终版真的最终2 拷贝!!.jpg
```

---

# 21. 每次更新网站的安全流程

建议永远按照下面顺序。

## 第一步：修改内容

添加作品、图片、文字。

## 第二步：保持草稿

新作品先：

```json
"published": false
```

## 第三步：检查

```bash
npm run check
```

## 第四步：本地看一下

```bash
npm run preview
```

浏览器检查：

- 图片顺序
- 标题
- 年份
- 媒介
- 法语 / 英语 / 中文
- 手机窗口

## 第五步：正式发布

改成：

```json
"published": true
```

再次：

```bash
npm run check
```

## 第六步：Git

```bash
git add .
git commit -m "Add new work"
git push
```

Cloudflare Pages 会自动重新构建网站。

---

# 22. npm run check 报错怎么办

不要慌，也不要直接 push。

看错误最后几行。

常见情况：

## `Unexpected token`

通常是 JSON 少逗号、多逗号或双引号错误。

## `Missing cover`

JSON 写了：

```json
"cover": "cover.webp"
```

但文件夹里没有 `cover.webp`。

## `Unknown medium`

作品使用了一个 `site.json` 没定义的媒介。

## `Duplicate work slug`

两件作品用了同一个 slug。

## `Unknown home reference`

`home.json` 引用了一件不存在、拼错 slug、或仍然 `published:false` 的作品。

## `Content is outside a year folder`

你的 `work.json` 或 `series.json` 没有放在：

```text
content/works/YYYY/
```

之下。

---

# 23. 如果网站突然出问题，最安全的处理

如果刚刚 push 后发现网站出问题：

1. 不要继续乱改很多文件。
2. 看 GitHub 最近一次正常的 commit。
3. 恢复到最近正常版本，或者撤销刚才的修改。
4. 本地先运行 `npm run check`。
5. 确认以后再 push。

Git 的价值就是：你不是在直接修改唯一一份网站，而是每次都有历史版本。

---

# 24. 哪些文件不要碰

如果只是更新作品和资料，通常不要修改：

```text
src/assets/site.js
src/assets/home.js
src/assets/works.js
src/assets/site.css
scripts/build.mjs
scripts/check.mjs
```

这些是网站底层逻辑。

你可以阅读“代码注释版”理解它们，但日常添加作品不需要动它们。

---

# 25. 作品很多以后怎么办

当前 Works 的设计已经考虑大量作品：

- 完整作品数据先以轻量 JSON 读取。
- 页面开始只显示 48 件。
- 向下滚动再追加下一批。
- 图片接近屏幕才 lazy load。
- 年份 / 媒介 / 系列筛选针对完整数据，而不是只筛前 48 件。
- 卡片使用浏览器离屏渲染优化。

实际压力测试已经测试过 5000 件单件作品。

但如果未来真的达到非常夸张的数量，例如数万件作品，届时可以进一步把 Works 升级成数据库 / API 或虚拟列表；现有每件作品独立 JSON 的内容结构仍然可以继续使用。

---

# 26. 最简单的日常记忆版

你只要记住：

```text
新作品
↓
npm run new:work
↓
放图片
↓
填写 work.json
↓
published: false
↓
npm run check
↓
本地确认
↓
published: true
↓
npm run check
↓
git push
```

系列也是一样，只是使用：

```bash
npm run new:series
```

如果每次都遵守这个流程，你不需要会写网站代码，也可以长期自己维护。
