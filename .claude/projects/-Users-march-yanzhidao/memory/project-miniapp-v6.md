---
name: project-miniapp-v6
description: 研知道微信小程序 V6 重建状态，技术栈与页面结构
metadata:
  type: project
---

V6 小程序重建基于 `newminiapp/6.0-实现稿-claude.html`（6481行）。在原 `miniapp/` 项目内操作，只改页面文件，不动配置。

**Why:** 老板改了太多版，V5 积累大量历史包袱，V6 有结构性变化（prep 合并了旧 comparison，新增 prep-dx/prep-gz），重新按 HTML 翻译更快。

**How to apply:** 继续开发时只改 `miniapp/src/pages/` 下的 .vue 文件，共享样式在 `miniapp/src/styles/v6.scss`，构建命令 `npm run build:mp-weixin`（在 miniapp/ 目录）。

**页面结构（V6 最终）:**
- Tab 页: index（首页）, learn（了解）, test（测一测）
- 子页: loading, contact（加企微）
- 子包: schools（院校库）, school-detail, cases, result, zexiao（择校建议）
- 新增子包: prep（选择备考路径，合并旧comparison）, prep-dx（党校备考）, prep-gz（管综备考）
- 其他: map, pass-rate, about, data-source, usage

**已删除:** downloads, comparison, timeline, estimate（V6 不再有这些页面）

**技术细节:**
- 框架: uni-app + Vue 3 + TypeScript + Vite + SCSS
- 共享样式: `@/styles/v6.scss`（对应 HTML 设计 token）
- CSS 变量定义在 App.vue 的 `page` 选择器（非 :root，兼容微信小程序）
- 院校数据: `@/data/school-data.ts` → `getAllSchools()`, `getSchoolById()`
- 埋点: `@/api/tracking.ts` → `trackPageView`, `trackNavClick`, `trackTabClick`
- 导航: tab 页用 `uni.switchTab`，其他用 `uni.navigateTo`/`uni.navigateBack`
