# Analytics 数据飞轮项目

`analytics/` 是独立的数据分析与埋点治理项目，用来管理微信小程序行为数据的采集规范、指标口径、数据库结构和后续看板逻辑。

它不直接承载小程序页面代码，也不直接承载院校库、案例库、推荐方案库业务数据。页面和 API 后续只需要按这里定义的事件字典上报数据。

## 目录结构

| 路径 | 用途 |
| --- | --- |
| `docs/tracking-plan.md` | 埋点事件字典、字段规范、接入原则 |
| `docs/metrics.md` | PV、UV、新老用户、停留时长、漏斗等指标口径 |
| `docs/privacy-and-governance.md` | 隐私、权限、数据保留、测试数据隔离规则 |
| `docs/implementation-plan-and-dashboard-structure.md` | 埋点落库方案、真实看板读取结构、实施顺序 |
| `schemas/analytics_events.sql` | 正式数据库表结构建议 |
| `schemas/analytics_event.schema.json` | 单条事件 JSON Schema |
| `schemas/dashboard_summary.schema.json` | 用户行为看板汇总数据 JSON Schema |
| `scripts/aggregate-jsonl.mjs` | 从现有 JSONL 事件文件生成汇总报告的离线脚本 |
| `reports/user-behavior-dashboard.html` | 读取 `latest-summary.json` 的用户行为看板 HTML |
| `reports/` | 本地生成的分析报告目录，不提交具体报告 JSON |

## 一期目标

1. 不强制微信登录，先做匿名用户行为采集。
2. 统一 `anonymous_user_id`、`session_id`、`event_type`、`page_path` 等字段。
3. 自动采集页面浏览、页面离开、停留时长。
4. 手动采集核心业务动作：测一测、院校浏览、案例点击、推荐结果、留资、分享、咨询。
5. 先支持 JSONL 离线聚合，再逐步迁移到 MySQL/PostgreSQL。

## 推荐接入顺序

1. 先确认 `docs/tracking-plan.md` 中事件字典。
2. 在小程序中接入匿名用户 ID、session ID、页面生命周期埋点。
3. 在关键业务动作上接入手动事件。
4. 后端继续写 JSONL，同时预留数据库写入。
5. 用 `scripts/aggregate-jsonl.mjs` 生成每日概览。
6. 再建设管理看板或迁移 RDS 数据库。

## 离线聚合示例

```bash
node analytics/scripts/aggregate-jsonl.mjs \
  --events schooltool/data/runtime/miniapp-events.jsonl \
  --leads schooltool/data/runtime/miniapp-leads.jsonl \
  --output analytics/reports/latest-summary.json
```

生成结果用于验证口径，不替代正式数据库和看板。

## 用户行为看板 HTML

看板读取同目录的 `latest-summary.json`：

```bash
node analytics/scripts/aggregate-jsonl.mjs \
  --events schooltool/data/runtime/miniapp-events.jsonl \
  --leads schooltool/data/runtime/miniapp-leads.jsonl \
  --output analytics/reports/latest-summary.json \
  --env production

python3 -m http.server 8787 --bind 0.0.0.0 --directory analytics/reports
```

局域网访问：

```text
http://本机局域网IP:8787/user-behavior-dashboard.html
```
