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
| 人均访问次数 | 会话数 / UV。 |
| 人均页面数 | PV / UV。 |
| 人均停留时长 | 会话停留总时长 / 会话数；看板同时展示按用户平均的累计停留。 |
| 跳出率 | 只有 1 次 `page_view` 的会话数 / 总会话数。 |
| 回访天数 | 同一 `anonymous_user_id` 出现过行为事件的自然日数量。 |

## 2. 停留时长

| 指标 | 口径 |
| --- | --- |
| 页面停留时长 | `page_leave.duration_ms`。 |
| 会话停留时长 | 同一 `session_id` 下页面停留时长合计。 |
| 进入页 / 退出页 | 同一 `session_id` 下最早 / 最晚事件对应的 `page_path`。 |
| 平均页面停留 | 页面 `duration_ms` 合计 / 页面离开次数。 |
| 页面退出率 | 以该页面为退出页的会话数 / 该页面 PV。 |
| 区块停留时长 | `section_view_end.duration_ms`，用于近似判断用户在哪些内容模块停留更久。 |
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
| 微信来源分类 | 前端按 `scene` 和分享参数归类为 `wechat_search`、`share`、`official_account`、`qr_code`、`channels`、`ads`、`direct` 等。 |

## 6. 搜索、互动与技术监控

| 指标 | 口径 |
| --- | --- |
| 搜索次数 | `search_submit` 事件数。 |
| 搜索关键词 | `search_submit.keyword` 汇总。 |
| 无结果搜索词 | `search_submit.has_result=false` 的关键词。 |
| 搜索后点击率 | `search_result_click` / `search_submit`。 |
| 点击咨询 | `contact_click` 事件数。 |
| 留言/留资 | `lead_submit` 事件数。 |
| 技术异常 | `technical_error` + `api_request_fail`。 |
| 接口失败率 | 当前看板先展示失败次数；如需失败率，需要同时记录接口成功次数。 |

## 7. 分享与用户轨迹

| 指标 | 口径 |
| --- | --- |
| 分享发起 | `share_attempt` 事件总数。 |
| 分享打开 | `share_open` 事件总数。 |
| 分享打开 UV | 同一 `referrer_share_trace_id` 下按 `anonymous_user_id` 去重。 |
| 高意向用户 | 按留资、咨询、案例详情、分享、PV 加权排序的匿名用户。 |
| 设备分布 | 按事件根字段 `device_model`、`platform`、`os_name` 汇总。 |
| 滚动深度 | `scroll_depth.scroll_threshold`，按页面统计到达 25% / 50% / 75% / 90% / 100% 的次数和 UV。 |

## 8. 留存

| 指标 | 口径 |
| --- | --- |
| 次日留存 | 用户首次访问日后的第 1 天仍有会话。 |
| 7 日留存 | 用户首次访问日后 1-7 天内仍有会话。 |
| 30 日留存 | 用户首次访问日后 1-30 天内仍有会话。 |
| 复访次数 | 同一 `anonymous_user_id` 的 `session_id` 数。 |

## 9. 测试数据隔离

看板默认只展示：

```text
env = production
is_test_user != true
```

开发者工具、体验版、内部测试人员数据进入测试看板，不进入老板默认经营看板。
