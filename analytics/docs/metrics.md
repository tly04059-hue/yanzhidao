# 指标口径

> 版本：`2026-05-v1`

## 1. 流量指标

| 指标 | 口径 |
| --- | --- |
| PV | `page_view` 事件总数。 |
| UV | 按 `anonymous_user_id` 去重的访问用户数。 |
| 新用户 | 当天 `is_new_user=true`，或 `first_seen_at` 在当天的用户。 |
| 老用户 | 当天访问且 `first_seen_at` 早于当天的用户。 |
| 会话数 | 按 `session_id` 去重。 |
| 人均页面数 | PV / UV。 |

## 2. 停留时长

| 指标 | 口径 |
| --- | --- |
| 页面停留时长 | `page_leave.duration_ms`。 |
| 会话停留时长 | 同一 `session_id` 下页面停留时长合计。 |
| 平均页面停留 | 页面 `duration_ms` 合计 / 页面离开次数。 |
| 异常停留 | 小于 500ms 或大于 30min 的停留时长默认不进入平均值，可单独记录。 |

## 3. 转化漏斗

一期漏斗：

```text
page_view 首页
→ assessment_start
→ assessment_finish
→ recommendation_view
→ lead_modal_open
→ lead_submit
```

| 指标 | 口径 |
| --- | --- |
| 测一测开始率 | `assessment_start` UV / 首页 UV。 |
| 测一测完成率 | `assessment_finish` UV / `assessment_start` UV。 |
| 结果页到达率 | `recommendation_view` UV / `assessment_finish` UV。 |
| 留资打开率 | `lead_modal_open` UV / `recommendation_view` UV。 |
| 留资提交率 | `lead_submit` UV / `recommendation_view` UV。 |

## 4. 内容热度

| 指标 | 口径 |
| --- | --- |
| 热门院校 | `school_card_click`、`school_detail_view` 按 `target_id` 汇总。 |
| 热门案例 | `case_card_click` 按 `target_id` 汇总。 |
| 热门路径 | `recommendation_view.payload.primary_path` 汇总。 |
| 热门策略 | `recommendation_view.target_id` 汇总。 |

## 5. 渠道指标

| 指标 | 口径 |
| --- | --- |
| 渠道 UV | 按 `source_channel + anonymous_user_id` 去重。 |
| 渠道留资 | `lead_submit` 按 `source_channel` 汇总。 |
| 渠道转化率 | 渠道留资 UV / 渠道访问 UV。 |

## 6. 测试数据隔离

看板默认只展示：

```text
env = production
is_test_user != true
```

开发者工具、体验版、内部测试人员数据进入测试看板，不进入老板默认经营看板。
