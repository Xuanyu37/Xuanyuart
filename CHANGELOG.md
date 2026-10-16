# Changelog

## v0.0.3

- 移除 Node.js / npm / 构建流程。
- 改为 Cloudflare 直接发布 `site/` 的纯静态架构。
- 内容改为 JSON 驱动，作品完整信息与年份轻量目录分离。
- 保留年份 / 媒介 / 系列交叉筛选。
- 保留渐进加载、三语、夜间模式、移动端抽屉、Lightbox。
- 增加部署后的 `diagnostics.html` 检查工具。
- 加强本地存储不可用时的容错、HTML 转义、筛选溢出状态与返回 Works 状态恢复。
