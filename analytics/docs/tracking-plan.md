# 埋点方案与事件字典

> 版本：`2026-05-v1`  
> 适用范围：微信小程序、后续 H5、API 行为事件  
> 原则：页面可以大改，但事件命名和业务对象尽量稳定。

## 1. 接入原则

1. 不强制微信登录，先使用匿名用户 ID 采集行为。
2. 埋点分为自动埋点和业务埋点。
3. 自动埋点绑定小程序生命周期和页面生命周期，不依赖页面 UI。
4. 业务埋点绑定稳定业务动作，不绑定按钮颜色、卡片位置、视觉模块编号。
5. 所有事件必须带 `env`、`app_version`、`tracking_plan_version`。
6. 测试版、体验版、正式版数据必须区分。
7. 埋点失败不能阻塞页面功能和留资流程。

## 2. 用户与会话字段

| 字段 | 说明 |
| --- | --- |
| `anonymous_user_id` | 匿名用户 ID，首次进入生成并保存在本地 storage。 |
| `session_id` | 会话 ID，每次小程序冷启动或长时间回到前台时生成。 |
| `is_new_user` | 当前用户是否首次访问。 |
| `first_seen_at` | 首次访问时间。 |
| `last_seen_at` | 最近访问时间。 |
| `visit_count` | 累计访问次数。 |
| `wechat_openid` | 后续微信登录后再补，不作为一期必需字段。 |

## 3. 通用事件字段

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `event_id` | string | 是 | 前端生成的唯一事件 ID，用于去重。 |
| `event_type` | string | 是 | 事件类型，见事件字典。 |
| `anonymous_user_id` | string | 是 | 匿名用户 ID。 |
| `session_id` | string | 是 | 会话 ID。 |
| `page_path` | string | 否 | 当前页面路径。 |
| `page_title` | string | 否 | 当前页面标题。 |
| `target_type` | string | 否 | 行为对象类型，如 `school`、`case`、`strategy`、`button`。 |
| `target_id` | string | 否 | 行为对象 ID。 |
| `target_name` | string | 否 | 行为对象名称。 |
| `source_channel` | string | 否 | 分享、二维码、公众号、顾问等来源。 |
| `scene_category` | string | 否 | 根据微信 `scene` 归类后的来源，如 `wechat_search`、`share`、`qr_code`。 |
| `keyword` | string | 否 | 搜索关键词。 |
| `result_count` | number | 否 | 搜索结果数量。 |
| `has_result` | boolean | 否 | 搜索是否有结果。 |
| `error_type` | string | 否 | 技术异常类型。 |
| `err_msg` | string | 否 | 技术异常描述。 |
| `status_code` | number | 否 | 接口状态码。 |
| `url` | string | 否 | 异常接口或资源路径。 |
| `share_trace_id` | string | 否 | 用户发起分享时生成的分享链路 ID。 |
| `referrer_share_trace_id` | string | 否 | 用户通过别人分享进入时携带的分享链路 ID。 |
| `section_id` | string | 否 | 页面关键区块 ID。 |
| `section_name` | string | 否 | 页面关键区块名称。 |
| `scroll_threshold` | number | 否 | 页面已达到的滚动深度阈值。 |
| `device_model` | string | 否 | 设备型号，用于看板按机型排查兼容和行为差异。 |
| `platform` | string | 否 | 运行平台，如 ios、android、devtools。 |
| `os_name` | string | 否 | 操作系统名称。 |
| `payload` | object | 否 | 业务扩展字段。 |
| `duration_ms` | number | 否 | 停留时长，主要用于 `page_leave`、`app_hide`。 |
| `env` | string | 是 | `development`、`trial`、`production`。 |
| `app_version` | string | 是 | 小程序版本。 |
| `tracking_plan_version` | string | 是 | 埋点方案版本。 |
| `created_at` | string | 是 | 客户端事件发生时间。 |

## 4. 自动埋点事件

| 事件 | 触发时机 | 关键字段 |
| --- | --- | --- |
| `app_launch` | 小程序冷启动 | `source_channel`、`scene`、`query` |
| `app_show` | 小程序进入前台 | `session_id` |
| `app_hide` | 小程序进入后台或关闭 | `duration_ms` |
| `page_view` | 页面加载或展示 | `page_path`、`page_title` |
| `page_leave` | 页面卸载或隐藏 | `page_path`、`duration_ms` |
| `section_view_start` | 页面关键区块进入可视区域 | `section_id`、`section_name` |
| `section_view_end` | 页面关键区块离开可视区域或页面关闭 | `section_id`、`duration_ms` |
| `scroll_depth` | 页面滚动达到 25% / 50% / 75% / 90% / 100% 阈值 | `scroll_threshold` |

## 5. 业务埋点事件

| 事件 | 说明 | target |
| --- | --- | --- |
| `nav_click` | 底部 Tab、页面入口、功能入口点击 | `target_type=nav` |
| `assessment_start` | 开始测一测 | `target_type=assessment` |
| `assessment_answer` | 回答单题 | `target_type=question` |
| `assessment_finish` | 完成测一测 | `target_type=assessment` |
| `recommendation_view` | 查看推荐结果 | `target_type=strategy` |
| `school_list_view` | 查看院校列表 | `target_type=school_list` |
| `school_filter_change` | 修改院校筛选条件 | `target_type=filter` |
| `school_card_click` | 点击院校卡片 | `target_type=school` |
| `school_detail_view` | 浏览院校详情 | `target_type=school` |
| `case_card_click` | 点击案例卡片 | `target_type=case` |
| `strategy_view` | 查看推荐策略说明 | `target_type=strategy` |
| `lead_modal_open` | 打开留资弹窗 | `target_type=lead` |
| `lead_submit` | 提交留资 | `target_type=lead` |
| `share_attempt` | 发起分享给好友或朋友圈 | `target_type=share` |
| `share_open` | 通过分享链路打开小程序 | `target_type=share` |
| `contact_click` | 点击咨询/联系方式 | `target_type=contact` |
| `search_submit` | 提交搜索 | `target_type=search` |
| `search_result_click` | 点击搜索结果 | `target_type=search_result` |
| `content_interaction` | 收藏、点赞、展开、复制等非交易互动 | `target_type=content` |
| `technical_error` | 页面、资源、图片等技术异常 | `target_type=technical` |
| `api_request_fail` | 业务接口非 200 或请求失败 | `target_type=technical` |

## 6. 用户轨迹看板口径

| 模块 | 数据来源 | 说明 |
| --- | --- | --- |
| 高意向匿名用户 | `anonymous_user_id` 聚合 | 按留资、咨询、案例详情、分享、PV 加权排序。 |
| 最近会话路径 | `session_id` 聚合 | 展示进入页、退出页、停留时长、关键动作和设备。 |
| 分享传播 | `share_attempt` / `share_open` | 统计分享发起、分享打开、分享页面和分享链路打开 UV。 |
| 设备分布 | 事件根字段设备快照 | 按设备型号、平台、系统汇总。 |
| 用户来源 | `source_channel` / `scene_category` | 统计搜索、分享、扫码、公众号、视频号、广告等入口表现。 |
| 搜索分析 | `search_submit` / `search_result_click` | 统计搜索词、无结果词和搜索后点击。 |
| 技术监控 | `technical_error` / `api_request_fail` | 统计接口失败、页面错误和异常 URL。 |

## 7. 稳定业务对象

| 对象 | ID 来源 |
| --- | --- |
| 院校 | `school_id` 或发布层 `id` |
| 案例 | 案例发布层 `id` |
| 推荐策略 | 策略发布层 `strategy_id` |
| 测一测问题 | 问题配置 ID 或题号 |
| 留资 | 后端生成的 lead ID，前端可先传 `event_id` |

## 8. 页面改版时的检查清单

1. 页面是否仍触发 `page_view` 和 `page_leave`。
2. 核心业务动作是否仍触发旧事件名。
3. 新增功能是否需要新增事件。
4. 旧事件字段是否仍能填充稳定对象 ID。
5. 看板指标是否仍能从事件中计算。
