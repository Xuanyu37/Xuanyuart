# content/ — 日常内容工作区

v0.0.2 当前只使用三个 Works 检索维度：

- 年份
- 媒介
- 系列

不使用 Theme / 主题字段。

## 目录规则

所有作品和系列都统一放在：

```text
content/works/YYYY/
```

其中：

- 单件作品文件夹包含 `work.json`
- 系列文件夹包含 `series.json`
- 构建器会递归扫描年份目录，因此允许更深层的个人整理目录

文件夹用于你自己的档案整理；网站分类以 JSON 中的 `year`、`medium` / `mediums`、`series` 为准。

一件作品可以有多个媒介：

```json
"medium": ["sound", "installation"]
```

其他页面内容在 `content/pages/`，全站设置在 `content/site.json`。
