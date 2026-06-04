# 埋点落库方案与真实看板数据结构

> 版本：`2026-06-v1`  
> 状态：第一阶段方案确认  
> 适用范围：微信小程序行为事件、案例 V2、测评转化、咨询转化、后续用户行为看板

## 1. 结论

小程序前端已经统一通过 `miniapp/src/api/request.ts` 上报：

```text
POST {VITE_ANALYTICS_BASE_URL || VITE_API_BASE_URL}/miniapp/events
```

本仓库已新增轻量后端入口：

```text
schooltool/apps/api/server.js
```

第一阶段不引入第三方分析工具，采用以下落库路径：

```text
微信小程序 tracking.ts
→ request.ts trackEvent()
→ POST /api/miniapp/events
→ 后端写 JSONL：schooltool/data/runtime/miniapp-events.jsonl
→ analytics/scripts/aggregate-jsonl.mjs 聚合
→ analytics/reports/latest-summary.json
→ 真实看板 HTML 读取 summary JSON
```

数据库作为正式化预留：

```text
analytics/schemas/analytics_events.sql
```

上线初期先保证 JSONL 可落盘、可追溯、可聚合；等事件量稳定后，再把同一份事件同步写入 MySQL/PostgreSQL。

## 2. 落库文件约定

| 数据 | 路径 | 用途 |
| --- | --- | --- |
| 行为事件 | `schooltool/data/runtime/miniapp-events.jsonl` | 每行一条事件，append-only。 |
| 留资数据 | `schooltool/data/runtime/miniapp-leads.jsonl` | 留资与行为链路关联。 |
| 聚合结果 | `analytics/reports/latest-summary.json` | 看板读取的数据源。 |

JSONL 每行必须是完整 JSON，不允许跨行。

## 3. 单条事件最小结构

后端收到事件后，至少需要保留以下字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `event_id` | 是 | 前端生成；用于去重。 |
| `event_type` | 是 | 事件名，如 `page_view`、`case_card_click`。 |
| `page` | 是 | 业务页面名，如 `cases_v2`、`learn`、`result`。 |
| `page_path` | 是 | 实际路由，如 `/pages/cases-v2/index`。 |
| `anonymous_user_id` | 是 | 匿名用户 ID。 |
| `session_id` | 是 | 会话 ID。 |
| `target_type` | 否 | 行为对象类型，如 `case`、`page`、`lead`。 |
| `target_id` | 条件必填 | 案例、院校、策略等对象必须传。 |
| `target_name` | 否 | 页面展示名称。 |
| `case_type` | 案例事件必填 | `party_school` 或 `management_exam`。 |
| `env` | 是 | `development`、`trial`、`production`。 |
| `app_version` | 是 | 小程序版本。 |
| `tracking_plan_version` | 是 | 当前为 `2026-06-v1`。 |
| `created_at` | 是 | 客户端事件时间。 |
| `received_at` | 是 | 服务端接收时间。 |
| `payload` | 是 | 扩展字段；不能包含手机号、微信号等敏感信息。 |

后端可以兼容当前前端结构：

```json
{
  "event_type": "case_card_click",
  "session_id": "yz_...",
  "target_type": "case",
  "target_id": "party-C001",
  "target_name": "李同学 · 约 29 岁 · 成都",
  "payload": {
    "page": "cases_v2",
    "route": "/pages/cases-v2/index",
    "case_type": "party_school"
  }
}
```

但落盘前需要补齐：

```text
event_id、anonymous_user_id、env、app_version、tracking_plan_version、created_at、received_at、page_path
```

前端当前已在 `miniapp/src/api/request.ts` 统一补齐：

```text
event_id、anonymous_user_id、session_id、page、page_path、env、app_version、tracking_plan_version、created_at
```

并将校验结果写入：

```text
payload._validation
```

## 4. 环境隔离

看板必须按 `env` 分区：

| env | 来源 |
| --- | --- |
| `development` | 本地 H5、微信开发者工具、本地 API。 |
| `trial` | 微信体验版、公司内测。 |
| `production` | 正式版小程序。 |

老板默认看板只展示：

```text
env = production
AND is_test_user != true
```

测试看板可展示 `development` 和 `trial`，但不能混进经营指标。

## 5. 真实看板 summary 结构

真实看板 HTML 不直接遍历原始事件，先读取聚合后的 summary：

```json
{
  "generated_at": "2026-06-04T05:00:00.000Z",
  "filters": {
    "env": "production",
    "date_from": "2026-06-01",
    "date_to": "2026-06-04"
  },
  "totals": {
    "events": 0,
    "pv": 0,
    "uv": 0,
    "sessions": 0,
    "leads": 0
  },
  "cases": {
    "page_pv": 0,
    "page_uv": 0,
    "card_clicks": 0,
    "detail_opens": 0,
    "load_more_clicks": 0,
    "party_clicks": 0,
    "management_exam_clicks": 0,
    "card_click_rate": 0,
    "detail_open_rate": 0,
    "top_cases": []
  },
  "funnels": {
    "assessment_to_result": [],
    "case_to_contact": [],
    "result_to_contact": []
  },
  "pages": [],
  "events_quality": {
    "missing_required_count": 0,
    "invalid_event_count": 0,
    "missing_fields": []
  }
}
```

字段定义见：

```text
analytics/schemas/dashboard_summary.schema.json
```

## 6. 看板核心指标

| 模块 | 指标 | 计算来源 |
| --- | --- | --- |
| 总览 | PV / UV / Sessions / Leads | `page_view`、`lead_submit`。 |
| 案例页 | 案例页 PV / UV | `page_view where page=cases_v2`。 |
| 案例页 | 案例卡片点击率 | `case_card_click / cases_v2 page_view`。 |
| 案例页 | 详情打开率 | `modal_open(case_detail) / case_card_click`。 |
| 案例页 | 党校/管综关注占比 | `case_card_click.payload.case_type` 或 `filter_case_list.filter_value`。 |
| 测评链路 | 测评开始 / 完成 / 结果页到达 | `assessment_start`、`assessment_finish`、`page_view(result)`。 |
| 转化 | 案例到咨询 | `cta_click(route=/pages/contact/index)` from cases pages。 |
| 转化 | 结果到咨询 | `cta_click` 或 `nav_click` from result to contact。 |
| 数据质量 | 缺字段率 | 校验 `page/event_type/target_id/session_id/env`。 |

## 7. 当前需要后端确认的点

1. 新增的 `schooltool/apps/api/server.js` 需要部署到生产 API 服务所在机器。
2. 生产事件应写入 `schooltool/data/runtime/miniapp-events.jsonl`，并确认该目录有写权限。
3. 当前后端会补齐 `received_at`，并在缺字段时返回 `400 invalid_analytics_event`。
4. 生产环境是否能区分体验版和正式版；如果不能，需要前端通过环境变量传 `env`。
5. 看板 HTML 后续放在公司局域网静态目录，还是由 API 服务返回。

## 8. 下一步实施顺序

1. 补齐前端事件字段：`event_id`、`anonymous_user_id`、`env`、`app_version`、`tracking_plan_version`、`created_at`。
2. 扩展 `aggregate-jsonl.mjs` 输出 `dashboard_summary.schema.json` 对应结构。
3. 做真实看板 HTML，读取 `analytics/reports/latest-summary.json`。
4. 补齐关键链路埋点：`learn -> cases-v2`、`result -> cases-v2/contact/zexiao`、`test -> loading -> result`。
