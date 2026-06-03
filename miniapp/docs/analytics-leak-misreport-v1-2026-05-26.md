# 埋点首轮漏报/错报清单 v1（2026-05-26）

说明：
- 本版基于**代码扫描**完成（当前线程未直连微信开发者工具 Network 面板）。
- 已按《事件映射总表 v1》逐项对照。
- 标记为「待 Network 复核」的项目，需要你在 DevTools 打开真实请求后再做最终确认。

---

## A. 总体结论（代码层）

- `page_view`：18/18 页面已接入（代码层无漏报）
- `tab_click`：有底部 tab 的页面均已接入（代码层无漏报）
- `nav_click`：大部分返回/CTA 已接入，但有字段一致性问题（见下）
- 业务事件：已接入，但字段规范未完全统一（主要是 `source/position/route/scene`）

---

## B. 漏报清单（第一版）

###[P0] 本地环境可能“看不到任何埋点请求”
- 文件：`src/api/request.ts`, `.env.development`
- 现象：若 `VITE_ENABLE_LOCAL_ANALYTICS=false`，本地会静音返回 `skipped`，Network 无真实埋点请求。
- 影响：会误判为“漏报”。
- 处理状态：已加开关；点测前需确认开关为 `true`。
- 复核方式：DevTools Network 里出现 `POST /miniapp/events`。

###[P1] `result` 页分享入口的 `nav_click` 无目标路由
- 文件：`src/pages/result/index.vue`
- 现象：`trackNavClick('result', 'cta_share')` 未带 `route`。
- 影响：看板上“去向路由”统计会出现空值。
- 建议：补 `route='action_sheet'` 或拆成二级事件（`share_sheet_open` + 具体选项点击）。

###[P1] 多个业务 `trackEvent` 未统一补 `source/position/route/scene`
- 文件：`src/pages/test/index.vue`, `src/pages/result/index.vue`, `src/pages/schools/index.vue`, `src/pages/cases/index.vue`, `src/pages/school-detail/index.vue`
- 现象：业务事件 payload 里多数只有业务字段，缺基础维度。
- 影响：看板切分（入口位、页面路径、场景）不稳定。
- 建议：业务事件统一补充 `source/position/route/scene/from_route`。

---

## C. 错报/口径冲突清单（第一版）

###[P1] `source` 口径不一致
- 现象：
  - 基础层默认 `source=page`
  - 部分业务事件用 `source='result_page'` 等模块口径
- 影响：同一看板维度会混入“页面名”和“模块名”两类值。
- 建议：`source` 固定为来源页；新增 `source_module` 表达模块。

###[P1] `target_type` 口径不一致（`page/recommendation/content/contact/school/...`）
- 影响：聚合指标需要多维映射，维护成本高。
- 建议：先约束枚举并在文档中固定（页面行为 vs 业务对象分层）。

###[P2] `route` 的语义存在混用
- 现象：
  - 基础点击事件的 `route` 多为目标路由
  - 部分事件 route 为空或非路由语义值
- 建议：`route` 严格为“目标路由”；非路由行为用 `action` 字段表达。

---

## D. 字段完整率预估（代码层）

- `page_view`：`source/route/scene` 预计接近 100%
- `tab_click`：`source/position/route/from_route/scene` 预计接近 100%
- `nav_click`：`position/from_route/scene` 高；`route` 存在少量空值（如分享入口）
- 业务 `trackEvent`：`source/position/route/scene` 完整率预计 < 60%（待补）

---

## E. 立即修复建议（按优先级）

1. `P0`：点测前确认 `VITE_ENABLE_LOCAL_ANALYTICS=true`（否则 Network 无法验收）。
2. `P1`：修 `result` 页 `cta_share` 的 `route` 空值问题。
3. `P1`：统一业务事件补齐 `source/position/route/scene`。
4. `P2`：补 `event_id/client_ts` 便于排查重复与延迟。

---

## F. DevTools 复核清单（你点测时我按图核对）

请按以下链路录制/截图 Network：
1. `首页 -> 测一测 -> loading -> 结果页`
2. `结果页: 重测 / 院校查询 / 分享弹层两个选项`
3. `院校库 -> 院校详情 -> 联系顾问`
4. `案例页 -> 服务分布(map)`

每条请求我会核对：
- `event_type`
- `session_id`
- `payload.source`
- `payload.position`
- `payload.route`
- `payload.from_route`
- `payload.scene`

