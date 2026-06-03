# 事件映射总表 v1（事件 -> 页面 -> 触发点 -> 必填字段）

更新时间：2026-05-26  
代码基线：`src/api/tracking.ts` + `src/pages/**`

## 1. 基础层事件（统一封装）

### 1.1 `page_view`
- 触发方式：`trackPageView(page, source?, extra?)`
- 必填字段（payload）：
  - `target_type`（固定 `page`）
  - `target_name`（页面标识）
  - `page`
  - `source`
  - `route`
  - `scene`
  - `version`（当前固定 `v6`）

### 1.2 `nav_click`
- 触发方式：`trackNavClick(page, position, route?, extra?)`
- 必填字段（payload）：
  - `target_type`（固定 `page`）
  - `target_name`
  - `page`
  - `source`
  - `position`
  - `route`
  - `from_route`
  - `scene`

### 1.3 `tab_click`
- 触发方式：`trackTabClick(page, tab, route?, extra?)`
- 必填字段（payload）：
  - `target_type`（固定 `page`）
  - `target_name`
  - `page`
  - `source`
  - `tab`
  - `position`（固定 `tabbar`）
  - `route`
  - `from_route`
  - `scene`

---

## 2. 页面映射表（基础层）

| 页面 | `page_view` | `nav_click` | `tab_click` | 代码位置 |
|---|---|---|---|---|
| `index` | ✅ | - | ✅ | `src/pages/index/index.vue` |
| `learn` | ✅ | back / route | ✅ | `src/pages/learn/index.vue` |
| `comparison` | ✅ | back / route | ✅ | `src/pages/comparison/index.vue` |
| `test` | ✅ | cta_start | ✅（首页/了解） | `src/pages/test/index.vue` |
| `loading` | ✅ | back | - | `src/pages/loading/index.vue` |
| `result` | ✅ | cta_share / cta_retry / cta_schools | ✅ | `src/pages/result/index.vue` |
| `schools` | ✅ | menu / back | ✅ | `src/pages/schools/index.vue` |
| `school_detail` | ✅ | back / cta_consult | - | `src/pages/school-detail/index.vue` |
| `cases` | ✅ | back / cta_map | ✅ | `src/pages/cases/index.vue` |
| `map` | ✅ | back | ✅ | `src/pages/map/index.vue` |
| `contact` | ✅ | back / cta_timeline / cta_result | ✅ | `src/pages/contact/index.vue` |
| `timeline` | ✅ | back / cta_contact | ✅ | `src/pages/timeline/index.vue` |
| `about` | ✅ | back | - | `src/pages/about/index.vue` |
| `usage` | ✅ | back | - | `src/pages/usage/index.vue` |
| `data_source` | ✅ | back | - | `src/pages/data-source/index.vue` |
| `pass_rate` | ✅ | back | - | `src/pages/pass-rate/index.vue` |
| `estimate` | ✅ | back / cta_schools / cta_test / cta_pass_rate / cta_home | - | `src/pages/estimate/index.vue` |
| `zexiao` | ✅ | back | - | `src/pages/zexiao/index.vue` |

---

## 3. 业务事件映射表（trackEvent）

> 以下事件通过 `trackEvent(event_type, payload)` 直接上报。

| 事件名 | 页面 | 触发点 | 当前 payload 关键字段（代码中） | 建议必填字段（v1） |
|---|---|---|---|---|
| `start_assessment` | `test` | 点击“开始测试” | `target_type`, `source` | `source`, `position`, `route`, `scene` |
| `finish_assessment` | `test` | 提交问卷 | `target_type`, `answers` | `source`, `position`, `route`, `scene`, `answer_completeness` |
| `view_result` | `result` | 结果页加载（query/cache/fallback） | `target_type`, `source`, `answers?`, `primary_path`, `recommended_schools` | `source`, `route`, `scene`, `primary_path` |
| `favorite_recommendation` | `result` | 收藏/保存建议 | `target_type`, `primary_path`, `recommended_schools` | `source`, `position`, `route`, `scene`, `target_name` |
| `share_result` | `result` | 点击分享 | `target_type`, `primary_path`, `recommended_schools` | `source`, `position`, `route`, `scene` |
| `follow_account_click` | `result` | 去联系顾问入口 | `target_type`, `source` | `source`, `position`, `route`, `scene` |
| `view_pass_rate_detail` | `result` | 查看过考率说明 | `target_type`, `source` | `source`, `position`, `route`, `scene` |
| `contact_click` | `result` | 下一步联系顾问 | `target_type`, `source` | `source`, `position`, `route`, `scene` |
| `view_school_list` | `schools` | 院校库页面打开 | `target_type`, `source` | `source`, `route`, `scene` |
| `filter_school_list` | `schools` | 切换筛选条件 | `target_type`, `level`, `filter` | `source`, `position`, `route`, `scene`, `filter_key`, `filter_value` |
| `click_school_card` | `schools` | 点击院校卡片 | `target_type`, `target_id`, `target_name`, `school_name`, `program_type` | `source`, `position`, `route`, `scene`, `target_id` |
| `view_school_detail` | `school_detail` | 详情页打开 | `target_type`, `target_id`, `target_name`（按代码） | `source`, `route`, `scene`, `target_id` |
| `favorite_school` | `school_detail` | 收藏院校 | `target_type`, `target_id`, `target_name` | `source`, `position`, `route`, `scene`, `target_id` |
| `consult_click` | `school_detail` | 咨询按钮点击 | `target_type`, `target_id`, `target_name` | `source`, `position`, `route`, `scene` |
| `view_case_list` | `cases` | 案例页打开 | `target_type`, `source` | `source`, `route`, `scene` |
| `filter_case_list` | `cases` | 切换案例筛选 | `target_type`, `level`, `filter` | `source`, `position`, `route`, `scene`, `filter_key`, `filter_value` |

---

## 4. 埋点主键与通用外层字段（非 payload）

由 `trackEvent()` 统一拼装：
- `event_type`
- `session_id`
- `target_type`
- `target_id`
- `target_name`
- `payload`

建议后续补充：
- `event_id`（客户端生成，便于去重排查）
- `client_ts`（毫秒时间戳）

---

## 5. 首轮验收口径（对应本总表）

1. 基础层：
   - `page_view/nav_click/tab_click` 在“页面映射表”中的 ✅ 项必须全量命中。
2. 业务层：
   - “业务事件映射表”中每个事件至少触发一次并可在 Network 中看到。
3. 字段完整率：
   - 基础字段 `source/position/route/scene` 完整率 >= 95%。

