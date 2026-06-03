# 埋点现状盘点与缺口清单（2026-05-26）

## 1) 当前状态（已具备）

- 基础事件封装已存在：`page_view / nav_click / tab_click`
  - 文件：`src/api/tracking.ts`
- 通用上报入口已存在：
  - 文件：`src/api/request.ts` -> `trackEvent()`
- 多个核心页已接入基础层：
  - `index / learn / test / loading / result / schools / school-detail / cases / map / contact / timeline / about / usage / data-source / pass-rate / estimate / zexiao`
- 已有文档：
  - `docs/analytics-tracking-spec-v1.md`
  - `docs/analytics-wechat-qa-checklist-v1.md`

## 2) 关键问题（当前最影响看板）

### P0-1 本地环境埋点被静默跳过

- `request.ts` 中 `IS_LOCAL_API` 为真时，`trackEvent()` 直接 `skipped: true`，不会真正发埋点。
- 影响：微信开发者工具本地联调时无法通过 Network 看到真实事件，难以做字段完整率验收。

### P0-2 事件字段结构还不完全统一

- 基础层虽包含 `source / position / route / scene / from_route`，但业务事件（如 `filter_school_list`、`click_school_card`、`finish_assessment`）字段口径不完全一致。
- 影响：看板按维度切分时需要大量清洗，容易出现“同义不同名”。

### P0-3 事件字典与代码未建立“可核对映射”

- 目前是“有文档 + 有代码”，但缺一份“事件 -> 页面 -> 触发点 -> 必填字段”一一对应表。
- 影响：后续改页面容易漏报、错报，回归成本高。

## 3) 首轮建议看板（先能用，再精细）

### 看板 A：流量与页面健康（按日）

- 指标：
  - `page_view` UV/PV（按 `page`）
  - 页面进入来源（`source`）
  - 微信场景分布（`scene`）

### 看板 B：导航与漏斗（按路径）

- 指标：
  - `tab_click`（首页/了解/测一测）
  - `nav_click`（back、cta）
  - 漏斗：`test(start)` -> `loading` -> `result(view)`

### 看板 C：业务行为（首批）

- 指标：
  - `start_assessment`
  - `finish_assessment`
  - `view_result`
  - `click_school_card`
  - `view_school_detail`
  - `contact_click` / `consult_click`

## 4) 下一步执行顺序（建议）

1. **先解除本地静默上报（仅开发开关可控）**
   - 保留“避免超时刷屏”的能力，但可切换到“本地可观测”模式。
2. **补一份“事件映射总表 v1”**
   - 字段统一：`source / position / route / from_route / scene / target_type / target_id / target_name`
3. **跑一轮微信开发者工具真机点测**
   - 按 `analytics-wechat-qa-checklist-v1.md` 逐条核对
4. **输出漏报/错报清单 v1**
   - 标记 P0/P1，按优先级修复

## 5) 立即可落地的小改动（本周）

- 给 `trackEvent` 增加 `event_id`（时间戳+随机串）用于排查重放/丢包。
- 给 `trackPageView` 自动补 `page` 与当前 `route` 的一致性检查（开发态 console warn）。
- 给 `finish_assessment` 补 `answer_completeness`（完成率），用于后续结果质量分析。

