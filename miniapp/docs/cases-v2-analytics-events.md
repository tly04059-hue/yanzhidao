# 案例 V2 页面埋点事件字典

更新时间：2026-06-04  
适用页面：`/pages/cases-v2/index`  
代码入口：`src/pages/cases-v2/index.vue`、`src/api/tracking.ts`

## 1. 目标

案例 V2 作为当前主案例页，需要能回答三个问题：

1. 用户是否进入并停留在 V2 案例页。
2. 用户更关注党校还是管综、是否继续加载更多案例、是否打开案例详情。
3. 用户是否从案例页走向咨询页、测评页等转化路径。

当前主入口已指向 `/pages/cases-v2/index`。老页面 `/pages/cases/index` 仅保留兼容，不作为主入口。

## 2. 公共字段

所有 V2 案例页事件建议带以下 payload 字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `page` | string | 固定 `cases_v2` |
| `page_version` | string | 固定 `v2` |
| `source` | string | 默认 `cases_v2`，页面曝光可为 `direct` |
| `route` | string | 当前路由或目标路由 |
| `scene` | string | 微信进入场景 |
| `active_tab` | string | 当前方向，`party_school` / `management_exam` |
| `party_count` | number | V2 党校案例总数 |
| `management_exam_count` | number | V2 管综案例总数 |
| `current_total_count` | number | 当前 Tab 案例总数 |
| `current_visible_count` | number | 当前已展示案例数 |
| `current_rich_count` | number | 当前 Tab 高丰富案例数 |

案例对象相关事件额外带：

| 字段 | 类型 | 说明 |
|---|---|---|
| `target_type` | string | 固定 `case` |
| `target_id` | string | V2 展示层案例 ID |
| `target_name` | string | 页面展示标题，如 `陈同学 · 约31岁 · 成都` |
| `case_type` | string | `party_school` / `management_exam` |
| `case_quality` | string | `rich` / `standard` / `compact` |
| `target_precision` | string | `precise` / `broad` / `unknown` |
| `source_dataset` | string | 原始数据来源 |
| `source_id` | string | 原始数据 ID |
| `chosen_target` | string | 展示层“选了”字段 |
| `outcome` | string | 展示层结果 |
| `program` | string | 党校 / MPA / MBA / MEM 等 |

## 3. 事件字典

| event_type | 触发时机 | target_type | 关键 payload |
|---|---|---|---|
| `page_view` | V2 页面加载 | `page` | `page=cases_v2`、`page_version`、案例数量、当前 Tab |
| `nav_click` | 点击顶部返回 | `page` | `position=back`、当前 Tab、案例数量 |
| `filter_case_list` | 切换党校/管综 Tab | `case` | `filter_key=case_type`、`filter_value`、`from_tab`、`position=case_type_tab` |
| `case_list_load_more` | 点击“继续加载更多案例” | `case` | `previous_visible_count`、`next_visible_count`、`total_count` |
| `case_card_click` | 点击案例卡片 | `case` | `target_id`、`target_name`、`case_type`、`case_quality`、`chosen_target` |
| `modal_open` | 案例详情弹窗打开 | `case` | `modal_type=case_detail`、案例对象字段 |
| `modal_close` | 案例详情弹窗关闭 | `case` | `modal_type=case_detail`、`close_method=mask/acknowledge/programmatic` |
| `cta_click` | 点击详情“知道了”或案例页 CTA | `page/case` | `position`、`label`、`route`、案例对象字段可选 |
| `contact_click` | 点击案例页咨询入口 | `contact` | `position=contact_entry`、`route=/pages/contact/index`、当前 Tab 和案例数量 |

## 4. 当前预留交互点

| 页面动作 | 当前上报 |
|---|---|
| 打开 V2 案例页 | `page_view` |
| 点击返回 | `nav_click(position=back)` |
| 切换党校 / 管综 | `filter_case_list(filter_key=case_type)` |
| 点击案例卡片 | `case_card_click` + `modal_open` |
| 点击遮罩关闭详情 | `modal_close(close_method=mask)` |
| 点击“知道了”关闭详情 | `modal_close(close_method=acknowledge)` + `cta_click(position=case_detail_acknowledge)` |
| 点击继续加载更多 | `case_list_load_more` |
| 点击联系顾问 | `cta_click(position=contact_entry)` + `contact_click(position=contact_entry)` |

## 5. 看板建议指标

| 指标 | 计算口径 |
|---|---|
| V2 页面 UV/PV | `page_view where page=cases_v2` |
| 党校/管综关注占比 | `filter_case_list.filter_value` + 首屏 `active_tab` |
| 案例卡片点击率 | `case_card_click / page_view` |
| 详情打开率 | `modal_open(modal_type=case_detail) / case_card_click` |
| 详情确认关闭率 | `modal_close(close_method=acknowledge) / modal_open` |
| 加载更多率 | `case_list_load_more / page_view` |
| 案例页咨询点击率 | `contact_click(position=contact_entry) / page_view` |

## 6. 上线前验收

1. 微信开发者工具 Network 中能看到 `POST /miniapp/events`。
2. 每个事件的 `event_type`、`session_id`、`target_type`、`payload.page` 不为空。
3. V2 案例对象事件必须带 `target_id`、`target_name`、`case_type`。
4. 本地若未开启本地埋点开关，`trackEvent()` 会按现有逻辑跳过网络请求，这是预期行为。
5. 老案例页 `/pages/cases/index` 仅保留兼容，不作为主案例页口径统计入口。
