# SANQI Artist Website v0.0.3 管理与维护指南

这份指南按“不会写代码也能维护”的方式写。你日常更新网站，绝大多数情况下只需要修改 `site/content/`，不需要碰 JavaScript，也不需要安装 Node.js、npm 或任何构建工具。

---

# 1. 先记住 4 条规则

1. **网站真正发布的文件全部在 `site/` 里。**
2. **日常内容主要修改 `site/content/`。**
3. **不要随便修改 `site/assets/js/`。** 那里是功能代码。
4. **每次新增作品，需要同时做两件事：创建作品自己的资料文件 + 在对应年份的 `index.json` 加一条目录记录。**

你可以把它理解成：

- `work.json / series.json` = 作品自己的完整档案
- `某一年/index.json` = 作品页面用来快速浏览的“目录卡片”

这样即使未来几千件作品，Works 页面也不需要一次打开几千个完整作品文件。

---

# 2. Cloudflare 部署时怎么填

GitHub 仓库连接 Cloudflare Pages 后：

- Production branch：`main`
- Framework preset：`None / 无`
- Build command：**留空**
- Build output directory：`site`
- Root directory：留空
- Environment variables：不需要

这版没有构建过程。Cloudflare 直接发布 `site/`。

---

# 3. 整个文件结构

```text
你的 GitHub 仓库/
│
├── site/                         ← Cloudflare 实际发布这里
│   ├── index.html                ← 首页
│   ├── works.html                ← 作品总页
│   ├── work.html                 ← 单件作品通用详情页
│   ├── series.html               ← 系列通用详情页
│   ├── about.html                ← 关于
│   ├── cv.html                   ← CV
│   ├── contact.html              ← 联系
│   ├── diagnostics.html          ← 网站检查工具，不在公开导航里
│   │
│   ├── assets/
│   │   ├── css/site.css          ← 所有视觉样式
│   │   └── js/                   ← 所有功能代码
│   │
│   └── content/                  ← 你最常修改
│       ├── site.json             ← 名字、导航、媒介名称、默认语言
│       ├── pages/
│       │   ├── home.json         ← 首页放哪些作品
│       │   ├── about.json        ← 关于页面
│       │   ├── cv.json           ← CV
│       │   ├── contact.json      ← 联系方式
│       │   └── media/            ← About 照片、CV PDF 等
│       │
│       └── works/
│           ├── index.json        ← 网站有哪些年份
│           ├── 2026/
│           │   ├── index.json    ← 2026 年作品目录
│           │   ├── 某件作品/
│           │   │   ├── work.json
│           │   │   └── 图片...
│           │   └── 某个系列/
│           │       ├── series.json
│           │       └── 图片...
│           └── 2025/
│               └── ...
│
├── MANAGEMENT_GUIDE_ZH.md
└── README.md
```

---

# 4. JSON 最重要的基础规则

你以后会经常编辑 `.json` 文件。只需要记住：

### 文字必须放在英文双引号里

正确：

```json
"title": "Sans titre"
```

错误：

```text
'title': 'Sans titre'
```

### 每一项之间要有逗号，但最后一项不要逗号

正确：

```json
{
  "title": "Sans titre",
  "years": 2026,
  "published": true
}
```

### `true` / `false` 不加引号

```json
"published": true
```

### 数字可以不加引号

```json
"years": 2026
```

### 数组使用方括号

```json
"medium": [
  "sound",
  "installation"
]
```

如果保存后网站突然不加载，首先检查是不是少了逗号、多了逗号、漏了双引号。

部署后也可以打开：

```text
https://你的域名/diagnostics.html
```

检查作品目录。

---

# 5. 修改网站左上角名字

打开：

```text
site/content/site.json
```

找到：

```json
"name": "SANQI"
```

例如改成：

```json
"name": "XUANYU LIU"
```

整个网站左上角和 footer 会一起改变。

---

# 6. 修改导航文字

还是在：

```text
site/content/site.json
```

例如：

```json
"works": {
  "fr": "Œuvres",
  "en": "Works",
  "zh": "作品"
}
```

你可以把中文“作品”改成“作品档案”，或者把法语改成其他正式表达。

目前导航结构固定为：

- 首页
- 作品
- CV
- 关于
- 联系

只修改名称不用碰代码。真正新增一个全新的一级页面，才需要修改 HTML / JavaScript。

---

# 7. 默认语言改在哪里

`site/content/site.json`：

```json
"defaultLanguage": "fr"
```

支持：

```text
fr
en
zh
```

你现在默认是法语。

浏览器会记住访客上次选择的语言，所以你自己已经切到中文后，即使默认语言是法语，也可能继续看到中文。这是正常的。

---

# 8. 修改媒介分类

还是在 `site/content/site.json` 的：

```json
"mediums"
```

例如：

```json
"painting": {
  "fr": "Peinture",
  "en": "Painting",
  "zh": "绘画"
}
```

`painting` 是内部代码，最好不要随意改变。

你可以增加：

```json
"ceramics": {
  "fr": "Céramique",
  "en": "Ceramics",
  "zh": "陶艺"
}
```

之后作品可以写：

```json
"medium": ["ceramics"]
```

如果一件作品同时是声音 + 装置：

```json
"medium": [
  "sound",
  "installation"
]
```

它会同时出现在 Sound 和 Installation 筛选里。

---

# 9. About 页面怎么修改

打开：

```text
site/content/pages/about.json
```

结构：

```json
{
  "photo": "content/pages/media/about.webp",
  "photoAspect": "portrait",
  "photoAlt": {
    "fr": "Portrait de l’artiste",
    "en": "Artist portrait",
    "zh": "艺术家照片"
  },
  "biography": {
    "fr": "法语 Biography",
    "en": "English biography",
    "zh": "中文个人简介"
  },
  "statement": {
    "fr": "法语创作陈述",
    "en": "English artist statement",
    "zh": "中文创作陈述"
  }
}
```

### About 照片放哪里

建议：

```text
site/content/pages/media/about.webp
```

如果是竖图：

```json
"photoAspect": "portrait"
```

如果是横图：

```json
"photoAspect": "landscape"
```

如果暂时不想放照片：

```json
"photo": ""
```

页面会自动变成纯文字布局，不会出现空白占位框。

---

# 10. About 文字很长怎么办

可以直接写一段。

如果要分成几段，最方便的方式是使用数组：

```json
"statement": {
  "fr": [
    "第一段法语。",
    "第二段法语。",
    "第三段法语。"
  ],
  "en": [
    "First paragraph.",
    "Second paragraph."
  ],
  "zh": [
    "第一段中文。",
    "第二段中文。"
  ]
}
```

网页会自动在段落之间留空行。

作品说明也支持这种写法。

---

# 11. Contact 页面怎么改

打开：

```text
site/content/pages/contact.json
```

例如：

```json
{
  "intro": {
    "fr": "Pour toute demande :",
    "en": "For enquiries:",
    "zh": "如需联系："
  },
  "email": "your@email.com",
  "instagram": "https://instagram.com/你的账号",
  "links": []
}
```

如果不要 Instagram：

```json
"instagram": ""
```

如果想增加其他链接：

```json
"links": [
  {
    "label": {
      "fr": "Galerie",
      "en": "Gallery",
      "zh": "画廊"
    },
    "url": "https://example.com"
  }
]
```

---

# 12. CV 页面怎么改

打开：

```text
site/content/pages/cv.json
```

例如：

```json
{
  "pdf": "content/pages/media/cv.pdf",
  "sections": [
    {
      "title": {
        "fr": "Formation",
        "en": "Education",
        "zh": "教育"
      },
      "items": [
        {
          "year": "2026",
          "text": {
            "fr": "École ...",
            "en": "School ...",
            "zh": "学校 ..."
          }
        }
      ]
    }
  ]
}
```

PDF 文件建议放：

```text
site/content/pages/media/cv.pdf
```

如果暂时没有 PDF：

```json
"pdf": ""
```

PDF 按钮会自动消失。

### 增加新的 CV 分类

直接复制整个 section：

```json
{
  "title": {
    "fr": "Expositions collectives",
    "en": "Group Exhibitions",
    "zh": "群展"
  },
  "items": []
}
```

---

# 13. 作品文件夹的基本原则

你希望按时间整理，所以建议：

```text
site/content/works/
├── 2026/
├── 2025/
├── 2024/
└── ...
```

每件作品自己一个文件夹：

```text
2026/
└── sans-titre/
    ├── work.json
    ├── cover.webp
    ├── 01.webp
    └── 02.webp
```

系列也是一个文件夹：

```text
2025/
└── fragments/
    ├── series.json
    ├── cover.webp
    ├── 01.webp
    ├── 02.webp
    └── 03.webp
```

推荐文件夹名称：

```text
小写英文 + 数字 + 连字符
```

例如：

```text
sans-titre-2026
echo-room
fragments
room-no-2
```

尽量避免：

- 空格
- `#`
- `?`
- 很长的中文文件名
- 同一个年份出现两个完全相同的文件夹名

作品正式标题本身当然可以使用中文、法语、特殊字符。

---

# 14. 新增一个全新年份

假设第一次添加 2027。

## 第一步：创建文件夹

```text
site/content/works/2027/
```

## 第二步：创建

```text
site/content/works/2027/index.json
```

内容：

```json
{
  "items": []
}
```

## 第三步：修改总年份目录

打开：

```text
site/content/works/index.json
```

原来：

```json
{
  "years": [2026, 2025, 2024]
}
```

改成：

```json
{
  "years": [2027, 2026, 2025, 2024]
}
```

推荐始终从新到旧。

---

# 15. 新增一件最普通的单图作品

假设作品：

```text
标题：Sans titre
年份：2026
媒介：绘画
```

## 第一步：创建目录

```text
site/content/works/2026/sans-titre/
```

## 第二步：放作品图片

例如：

```text
cover.webp
```

## 第三步：创建 `work.json`

```json
{
  "type": "work",
  "title": "Sans titre",
  "years": 2026,
  "medium": ["painting"],
  "mediumText": {
    "fr": "Huile sur toile",
    "en": "Oil on canvas",
    "zh": "布面油画"
  },
  "cover": "cover.webp",
  "images": [
    {
      "src": "cover.webp",
      "alt": {
        "fr": "",
        "en": "",
        "zh": ""
      }
    }
  ],
  "dimensions": "120 × 160 cm",
  "description": {
    "fr": "",
    "en": "",
    "zh": ""
  },
  "published": true
}
```

## 第四步：把它加入 2026 目录

打开：

```text
site/content/works/2026/index.json
```

加入：

```json
{
  "path": "2026/sans-titre",
  "type": "work",
  "title": "Sans titre",
  "years": 2026,
  "medium": ["painting"],
  "series": null,
  "cover": "cover.webp",
  "aspect": "landscape",
  "published": true
}
```

这里的 `aspect` 可以是：

```text
landscape   横图
portrait    竖图
square      方图
```

它只影响 Works 缩略图框的比例。

---

# 16. 为什么 work.json 和 index.json 有一些重复？

这是没有构建工具情况下，为了让网站快而做的取舍。

Works 页面只读取每个年份的 `index.json`，所以可以很快知道：

- 标题
- 年份
- 媒介
- 系列
- 封面

只有用户点进某件作品时，浏览器才读取完整的 `work.json`。

因此未来几千件作品时，不会一打开 Works 就发出几千个详情请求。

如果你修改了作品标题、年份、媒介或封面，记得：

**work.json 和对应年份 index.json 两边都同步修改。**

---

# 17. 多张图片的作品

文件：

```text
work.json
cover.webp
01.webp
02.webp
03.webp
```

`work.json`：

```json
"cover": "cover.webp",
"images": [
  "cover.webp",
  "01.webp",
  "02.webp",
  "03.webp"
]
```

如果图片需要自己的说明文字：

```json
"images": [
  {
    "src": "01.webp",
    "caption": {
      "fr": "Vue d’installation",
      "en": "Installation view",
      "zh": "装置现场"
    }
  }
]
```

---

# 18. 带很长文字说明的作品

```json
"description": {
  "fr": [
    "第一段法语。",
    "第二段法语。"
  ],
  "en": [
    "First paragraph.",
    "Second paragraph."
  ],
  "zh": [
    "第一段中文。",
    "第二段中文。"
  ]
}
```

如果没有说明：

```json
"description": {
  "fr": "",
  "en": "",
  "zh": ""
}
```

页面不会显示空文字区域。

---

# 19. 视频作品

推荐目录：

```text
2026/passage/
├── work.json
├── cover.webp
├── poster.webp
└── passage.mp4
```

`work.json` 增加：

```json
"medium": ["video"],
"video": {
  "src": "passage.mp4",
  "poster": "poster.webp",
  "caption": {
    "fr": "",
    "en": "",
    "zh": ""
  }
},
"duration": "08:42"
```

视频不会自动播放。

封面仍然通过 `cover` 决定 Works 页显示什么。

大视频文件会明显增加 Git 仓库和加载体积。特别大的完整影片最好以后根据实际情况使用专业视频平台；网站本身可以继续放静帧、短预览或外部链接。

---

# 20. 声音作品

目录：

```text
2026/echo-room/
├── work.json
├── cover.webp
└── echo-room.mp3
```

`work.json`：

```json
"medium": ["sound", "installation"],
"audio": {
  "src": "echo-room.mp3",
  "caption": {
    "fr": "",
    "en": "",
    "zh": ""
  }
},
"duration": "11:24"
```

同一件作品同时写 `sound` 和 `installation` 后，两种筛选都能找到它。

---

# 21. 视频 + 声音 + 装置的混合媒介作品

直接同时写：

```json
"medium": [
  "video",
  "sound",
  "installation"
]
```

并且可以同时存在：

```json
"video": { ... },
"audio": { ... },
"images": [ ... ]
```

网站不会要求一件作品只能有一种媒介。

---

# 22. 创建一个系列

比如：

```text
Fragments
2025–2026
```

建议系列文件夹放在**开始年份或者你认为最主要的年份**。例如：

```text
site/content/works/2025/fragments/
```

里面：

```text
series.json
cover.webp
01.webp
02.webp
03.webp
```

`series.json`：

```json
{
  "type": "series",
  "title": "Fragments",
  "years": {
    "from": 2025,
    "to": 2026
  },
  "medium": [
    "photography",
    "installation"
  ],
  "mediumText": {
    "fr": "Photographie et installation",
    "en": "Photography and installation",
    "zh": "摄影与装置"
  },
  "cover": "cover.webp",
  "images": [
    "01.webp",
    "02.webp",
    "03.webp"
  ],
  "description": {
    "fr": "",
    "en": "",
    "zh": ""
  },
  "published": true
}
```

然后只在：

```text
site/content/works/2025/index.json
```

添加一次：

```json
{
  "path": "2025/fragments",
  "type": "series",
  "title": "Fragments",
  "years": {
    "from": 2025,
    "to": 2026
  },
  "medium": [
    "photography",
    "installation"
  ],
  "series": {
    "id": "fragments",
    "title": "Fragments"
  },
  "cover": "cover.webp",
  "aspect": "landscape",
  "published": true
}
```

注意：

它只需要出现在一个 `index.json` 里。

但是因为 `years` 是 2025–2026，所以网站筛选 2025 和 2026 都能找到它。

不要同时复制到 2025/index.json 和 2026/index.json，否则会显示两遍。

---

# 23. 系列里的某一件又是独立作品

例如：

```text
Fragments
└── Fragment I
```

你可以单独建立：

```text
2026/fragment-i/
└── work.json
```

或者物理上放进系列目录内部也可以，只要 `path` 写对。

`work.json` 增加：

```json
"series": {
  "id": "fragments",
  "title": "Fragments",
  "path": "2025/fragments"
}
```

对应年份 `index.json` 里的作品目录也写：

```json
"series": {
  "id": "fragments",
  "title": "Fragments"
}
```

这样：

- Works → Série → Fragments 能找到它
- 作品详情页底部会出现进入 Fragments 系列的链接

---

# 24. 一件作品跨年份怎么办

单件作品也可以：

```json
"years": {
  "from": 2024,
  "to": 2026
}
```

或者：

```json
"years": [2024, 2026]
```

第一种表示连续的 2024、2025、2026。

第二种只表示 2024 和 2026。

通常长期项目建议使用 `from/to`。

---

# 25. 作品标题需不需要三语？

默认推荐：**保持作品正式原始标题。**

```json
"title": "Entre deux silences"
```

无论网站切换法语、英语还是中文，标题都保持不变。

如果某件作品确实拥有正式的多语标题，也支持：

```json
"title": {
  "fr": "Titre français",
  "en": "English Title",
  "zh": "中文标题"
}
```

年份、尺寸、时间不需要翻译。

---

# 26. 首页放哪些作品

打开：

```text
site/content/pages/home.json
```

例如：

```json
{
  "feature": [
    {
      "type": "series",
      "path": "2025/fragments"
    },
    {
      "type": "work",
      "path": "2026/sans-titre"
    }
  ],
  "secondary": [
    {
      "type": "work",
      "path": "2026/echo-room"
    },
    {
      "type": "work",
      "path": "2025/passage"
    }
  ]
}
```

`feature`：首页大轮播。

`secondary`：下面较小的作品。

推荐：

- 大轮播 1–6 个
- 下方 3 个左右

如果暂时不想显示任何作品：

```json
{
  "feature": [],
  "secondary": []
}
```

不会报错。

---

# 27. 草稿作品，不想马上发布

作品详情：

```json
"published": false
```

年份 `index.json` 中对应目录也写：

```json
"published": false
```

网站不会在 Works 显示它。

准备好之后两边都改为：

```json
"published": true
```

---

# 28. 删除一件作品

建议顺序：

1. 从首页 `home.json` 删除对它的引用（如果有）
2. 从对应年份 `index.json` 删除这条目录记录
3. 删除作品文件夹
4. 打开 `/diagnostics.html` 检查

---

# 29. 改作品文件夹名字 / 移动年份

例如：

```text
2026/old-name
```

变成：

```text
2026/new-name
```

必须同步检查所有 `path`：

- 对应年份 `index.json`
- 首页 `home.json`
- 如果其他作品通过 `series.path` 指向它，也要修改

网站不会自动猜测文件夹移动。

---

# 30. 图片怎么准备

推荐：

- WebP：优先
- JPEG/JPG：也可以
- PNG：适合真正需要透明背景的图片
- AVIF：可以，但编辑和兼容管理上 WebP 更方便

建议原则：

- 保存自己的原始高清文件，不要覆盖
- 网站用的版本单独导出
- 一般长边约 1600–2400px 已经够网页观看
- 尽量不要一张图几十 MB
- Works 封面不需要使用相机原始超大图

网站不会裁作品图，使用 `object-fit: contain` 保持原比例。

---

# 31. 图片显示顺序怎么改

详情页顺序完全按照 `images` 数组：

```json
"images": [
  "03.webp",
  "01.webp",
  "02.webp"
]
```

页面就按：03 → 01 → 02。

系列也是一样。

---

# 32. 修改夜间模式颜色

日常不需要修改代码。

如果未来你确实要调整颜色，打开：

```text
site/assets/css/site.css
```

最上面：

```css
:root {
  --bg: #fff;
  --text: #111;
  ...
}
```

这是日间模式。

下面：

```css
html.dark {
  --bg: #111;
  --text: #f2f2ef;
  ...
}
```

是夜间模式。

只改这些变量，比在整个 CSS 里到处找颜色安全得多。

---

# 33. 修改左上角名字大小 / 粗细

打开：

```text
site/assets/css/site.css
```

搜索：

```css
.brand
```

当前类似：

```css
.brand {
  font-size: 18px;
  font-weight: 700;
}
```

`font-size` 越大，名字越大。

`font-weight`：

```text
400 正常
600 半粗
700 粗
```

---

# 34. 修改整个网站字体

`site/assets/css/site.css` 搜索：

```css
body {
```

里面有：

```css
font-family: Arial, Helvetica, ...;
```

不懂字体加载时，建议不要随意添加网上字体。现在使用系统字体，不需要下载额外字体文件，加载最快，也最稳定。

---

# 35. 修改 Works 一行多少张

CSS 搜索：

```css
.works-grid
```

桌面当前：

```css
grid-template-columns: repeat(5, minmax(0,1fr));
```

表示 5 列。

后面媒体查询里：

- 普通笔记本：4 列
- 平板：3 列
- 手机：2 列

如果以后要改列数，只改这些数字。

---

# 36. Works 为什么只先显示 48 件？

这是为了未来作品很多时不卡。

在：

```text
site/assets/js/works.js
```

有：

```js
const batch = 48;
```

意味着：

```text
先 48
继续滚动 → 96
继续滚动 → 144
```

图片本身还使用浏览器 lazy loading。

不建议随意改成几百。

---

# 37. 年份 / 媒介 / 系列筛选从哪里来？

它们不是手动写死在页面上的。

Works 会读取年份 `index.json`：

```text
years
medium
series
```

然后自动生成筛选。

所以：

- 新年份会自动出现
- 新媒介会自动出现
- 新系列会自动出现

前提是你的年份总目录和作品索引写对。

---

# 38. 筛选的 `＋` 是什么？

如果年份、媒介、系列一行放不下，右边才自动出现 `＋`。

点击后显示剩余选项。

不需要手动配置。

---

# 39. 三种语言到底哪些东西会翻译？

会切换：

- 导航
- About
- CV
- Contact
- 作品说明
- 图片 caption
- 媒介显示名称
- 系列说明
- 夜间模式文字
- 筛选界面

默认不会强行翻译：

- 正式作品标题（除非你把 title 写成三语对象）
- 年份
- 尺寸
- 时长

---

# 40. 网站检查工具怎么用

部署完成以后访问：

```text
https://你的域名/diagnostics.html
```

它不会显示在导航里。

有三个检查：

### 检查索引

检查：

- 年份目录能不能打开
- path 有没有重复
- 目录记录是否缺 title / cover / type
- medium 是否在 `site.json` 定义

### 检查详情文件

检查每个目录对应的：

```text
work.json
或
series.json
```

是否存在。

### 检查封面

检查 Works 目录里写的 cover 是否真的存在。

建议每次大量更新以后跑一次。

---

# 41. GitHub 网页版更新的基本流程

你完全可以不用终端。

大致流程：

1. 打开 GitHub 仓库
2. 找到要修改的 JSON
3. 点击编辑
4. 修改
5. Commit changes
6. Cloudflare 自动重新部署静态文件

新增图片 / 文件夹时可以使用 GitHub 的 Upload files。

如果一次上传很多作品，使用 GitHub Desktop 会更舒服，但不是网站必须依赖。

---

# 42. 为什么双击本地 index.html 可能看不到内容？

这个网站的内容使用 JSON 文件读取。

有些浏览器出于安全规则，会禁止 `file://` 页面读取旁边的 JSON。

所以：

**直接双击 HTML 不一定能完整预览。**

这不是网站坏了。

你不想安装任何开发环境的话，最简单的测试方式就是：

1. GitHub 提交
2. 等 Cloudflare Preview / Production 部署
3. 在线打开测试

网站上线后通过正常 `https://` 访问不会有这个问题。

---

# 43. 常见问题：作品不显示

依次检查：

### A. 对应年份是否写进

```text
content/works/index.json
```

### B. 作品是否写进

```text
content/works/2026/index.json
```

### C. 是否：

```json
"published": true
```

### D. `path` 是否和真实文件夹完全一样

```json
"path": "2026/sans-titre"
```

实际必须：

```text
content/works/2026/sans-titre/
```

---

# 44. 常见问题：作品列表有了，但点击进不去

说明年份 index 基本正确，但详情文件可能错误。

检查：

```text
work 类型 → work.json
series 类型 → series.json
```

以及 JSON 有没有语法问题。

运行 `/diagnostics.html` 的“检查详情文件”。

---

# 45. 常见问题：图片不显示

检查三件事：

1. 文件名大小写是否一致
2. JSON 里的文件名是否一致
3. 图片是否真的在该作品自己的文件夹

例如：

```json
"cover": "cover.webp"
```

必须真的存在：

```text
2026/作品文件夹/cover.webp
```

Linux / Cloudflare 对大小写敏感：

```text
Cover.webp
```

和：

```text
cover.webp
```

不是同一个文件名。

---

# 46. 常见问题：新媒介没有出现在筛选

如果作品写：

```json
"medium": ["ceramics"]
```

还需要在：

```text
site/content/site.json
```

`mediums` 中定义 `ceramics` 的法英中名称。

---

# 47. 常见问题：系列筛选没有出现

年份 `index.json` 中必须有：

```json
"series": {
  "id": "fragments",
  "title": "Fragments"
}
```

无论是系列本身还是系列里的独立作品，都使用同一个 `id`。

不要有时候写：

```text
fragments
```

有时候写：

```text
fragment
```

否则网站会认为是两个系列。

---

# 48. 常见问题：修改后 Cloudflare 还是旧内容

先确认 GitHub 最新 commit 已经完成 Cloudflare 部署。

然后：

- 强制刷新浏览器
- 或使用无痕窗口

JSON 请求已经设置为不使用浏览器长期缓存，但图片文件如果名字完全不变，浏览器仍可能缓存一段时间。

如果你替换了图片但浏览器一直显示旧图，一个非常稳的方法是改文件名：

```text
cover-v2.webp
```

然后同步修改 JSON。

---

# 49. 更新作品时的推荐检查清单

每次新增作品：

```text
□ 创建作品文件夹
□ 放图片 / 视频 / 音频
□ 创建 work.json 或 series.json
□ 检查 published
□ 更新对应年份 index.json
□ 如果是新年份，更新 works/index.json
□ 如果首页要展示，更新 home.json
□ 如果新媒介，检查 site.json mediums
□ GitHub Commit
□ Cloudflare 部署完成
□ 打开 Works 看筛选
□ 打开作品详情
□ /diagnostics.html 检查
□ 手机打开一次
```

---

# 50. 哪些文件你平时不要碰

除非你明确要修改网站功能或视觉：

```text
site/assets/js/site.js
site/assets/js/home.js
site/assets/js/works.js
site/assets/js/detail.js
site/assets/js/pages.js
```

它们是功能代码。

真正长期维护应该集中在：

```text
site/content/
```

这是 v0.0.3 的核心目标。

---

# 51. 我想改某样东西，应该找哪个文件？

| 你想修改 | 文件 |
|---|---|
| 左上角艺术家名字 | `site/content/site.json` |
| 默认语言 | `site/content/site.json` |
| 导航文字 | `site/content/site.json` |
| 媒介名称 | `site/content/site.json` |
| 首页展示作品 | `site/content/pages/home.json` |
| About 照片 | `site/content/pages/about.json` + `pages/media/` |
| Biography | `site/content/pages/about.json` |
| Artist Statement | `site/content/pages/about.json` |
| CV | `site/content/pages/cv.json` |
| CV PDF | `site/content/pages/media/` + `cv.json` |
| 邮箱 | `site/content/pages/contact.json` |
| Instagram | `site/content/pages/contact.json` |
| 新增作品 | `site/content/works/年份/作品文件夹/` |
| Works 作品目录 | `site/content/works/年份/index.json` |
| 新年份 | `site/content/works/index.json` |
| 日/夜颜色 | `site/assets/css/site.css` |
| 名字字号/粗细 | `site/assets/css/site.css` |
| Works 列数 | `site/assets/css/site.css` |
| 每批加载数量 | `site/assets/js/works.js`（一般不要改） |

---

# 52. 最后一个维护建议

不要等到几十件作品以后才整理命名。

从第一天就保持：

```text
年份清楚
文件夹名称唯一
图片文件名简单
作品 path 稳定
series id 稳定
medium key 稳定
```

网站以后扩展到几千件作品时，真正决定是否容易维护的不是代码，而是这些数据习惯。
