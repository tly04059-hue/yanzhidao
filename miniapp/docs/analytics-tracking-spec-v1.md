# Miniapp 埋点规范 V1

更新时间：2026-05-25  
适用项目：`miniapp`

## 1. 目标

本规范用于统一：

1. 事件命名与语义（事件字典）
2. 上报字段结构（字段规范）
3. 页面到事件的映射关系（页面映射表）

后续埋点补充以此文档为唯一依据，避免各页自由发挥。

---

## 2. 字段规范

## 2.1 公共字段（所有事件必带）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `event_type` | string | 是 | 事件名，使用 snake_case |
| `session_id` | string | 是 | 会话 ID，来自 `getAnalyticsSessionId()` |
| `target_type` | string | 建议 | 事件对象类型，如 `page` / `assessment` / `school` / `case` / `result` |
| `target_id` | string/number | 可选 | 对象 ID（如 school id, case id） |
| `target_name` | string | 可选 | 对象展示名 |
| `payload` | object | 是 | 业务字段扩展，见事件字典 |

## 2.2 payload 通用建议字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `page` | string | 建议 | 页面标识，如 `schools`, `result` |
| `source` | string | 建议 | 来源页或模块，如 `home_entry`, `result_cta` |
| `route` | string | 可选 | 目标跳转路由 |
| `from_route` | string | 可选 | 当前触发页路由（点击前） |
| `position` | string | 可选 | 位置信息，如 `hero_cta`, `tabbar` |
| `scene` | string/number | 建议 | 微信场景值，如 `1001`、`1047` |
| `version` | string | 可选 | 页面版本，如 `v6` |

---

## 3. 事件字典（V1）

> 状态：`已实现` / `待补`

| event_type | 状态 | 触发时机 | target_type | 关键 payload |
|---|---|---|---|---|
| `view_school_list` | 已实现 | 进入院校列表页 | `school` | `source` |
| `filter_school_list` | 已实现 | 院校筛选条件变更 | `school` | `level`, `filter` |
| `click_school_card` | 已实现 | 点击院校卡片 | `school` | `program_type`, `school_name` |
| `view_school_detail` | 已实现 | 进入院校详情 | `school` | `source` |
| `favorite_school` | 已实现 | 收藏院校 | `school` | `source` |
| `consult_click` | 已实现 | 院校详情咨询点击 | `school` | `source` |
| `view_case_list` | 已实现 | 进入案例页 | `case` | `source` |
| `filter_case_list` | 已实现 | 案例筛选变更 | `case` | `system`, `age`, `path` |
| `start_assessment` | 已实现 | 测一测开始 | `assessment` | `source` |
| `finish_assessment` | 已实现 | 9题/DP001提交 | `assessment` | `answers` |
| `view_result` | 已实现 | 结果页曝光 | `result` | `source`, `answers` |
| `favorite_recommendation` | 已实现 | 结果页收藏建议 | `result` | `recommendation_type` |
| `share_result` | 已实现 | 结果页点击分享 | `result` | `source` |
| `follow_account_click` | 已实现 | 结果页关注入口点击 | `result` | `source` |
| `view_pass_rate_detail` | 已实现 | 结果页查看过考率说明 | `result` | `source` |
| `contact_click` | 已实现 | 结果页联系顾问点击 | `result` | `source` |
| `page_view` | 已实现 | 通用页面曝光（全页） | `page` | `page`, `source`, `route`, `scene`, `version` |
| `nav_click` | 已实现 | 顶部返回/菜单/路由点击 | `page` | `page`, `position`, `route`, `from_route`, `scene` |
| `tab_click` | 已实现 | 底部 Tab 点击 | `page` | `page`, `tab`, `route`, `from_route`, `scene` |
| `cta_click` | 待补 | 主要按钮点击（非结果页） | `page` | `page`, `position`, `label`, `route` |
| `modal_open` | 待补 | 弹窗打开（案例详情/咨询） | `case` | `modal_type`, `source` |
| `modal_close` | 待补 | 弹窗关闭 | `case` | `modal_type`, `source` |

---

## 4. 页面映射表（V1）

| 页面 | route | 当前状态 | 已有事件 | 待补事件 |
|---|---|---|---|---|
| 首页 | `/pages/index/index` | 有 Tab | `page_view`, `tab_click` | `cta_click`, `nav_click` |
| 了解页 | `/pages/learn/index` | 有 Tab | `page_view`, `tab_click`, `nav_click` | `cta_click` |
| 路径对比 | `/pages/comparison/index` | 有 Tab | `page_view`, `tab_click`, `nav_click` | `cta_click` |
| 测一测 | `/pages/test/index` | 有 Tab | `start_assessment`, `finish_assessment`, `page_view`, `tab_click`, `nav_click` | 关键答题步骤事件 |
| 加载页 | `/pages/loading/index` | 无 Tab | `page_view`, `nav_click` | `cta_click` |
| 结果页 | `/pages/result/index` | 底部 CTA | `view_result`, `favorite_recommendation`, `share_result`, `follow_account_click`, `view_pass_rate_detail`, `contact_click`, `page_view`, `tab_click`, `nav_click` | 无 |
| 院校查询 | `/pages/schools/index` | 有 Tab | `view_school_list`, `filter_school_list`, `click_school_card`, `page_view`, `tab_click`, `nav_click` | 选校树交互事件 |
| 院校详情 | `/pages/school-detail/index` | 无 Tab | `view_school_detail`, `favorite_school`, `consult_click`, `page_view`, `nav_click` | `cta_click` |
| 案例页 | `/pages/cases/index` | 有 Tab | `view_case_list`, `filter_case_list`, `page_view`, `tab_click`, `nav_click` | `modal_open`, `modal_close`, `cta_click` |
| 服务分布 | `/pages/map/index` | 有 Tab | `page_view`, `tab_click`, `nav_click` | 地图点位点击事件 |
| 联系顾问 | `/pages/contact/index` | 有 Tab | `page_view`, `tab_click`, `nav_click` | `cta_click` |
| 备考方案 | `/pages/timeline/index` | 有 Tab | `page_view`, `tab_click`, `nav_click` | 切换路径事件 |
| 关于研知道 | `/pages/about/index` | 无 Tab | `page_view`, `nav_click` | `cta_click` |
| 数据来源 | `/pages/data-source/index` | 无 Tab | `page_view`, `nav_click` | `cta_click` |
| 使用说明 | `/pages/usage/index` | 无 Tab | `page_view`, `nav_click` | `cta_click` |
| 择校长图 | `/pages/zexiao/index` | 无 Tab | `page_view`, `nav_click` | `cta_click` |
| 估分工具 | `/pages/estimate/index` | 无 Tab | `page_view`, `nav_click` | `cta_click`, 分数输入事件 |
| 过考率说明 | `/pages/pass-rate/index` | 无 Tab | `page_view`, `nav_click` | `cta_click` |

---

## 5. 命名与治理规则

1. 事件名统一 snake_case，不使用中英文混合。
2. 同一语义只保留一个事件名，不做同义词重复。
3. 新增事件前，必须先更新本文件（字典 + 页面映射）。
4. 所有按钮埋点默认归一到 `cta_click`，只有业务关键动作才使用专名事件。
5. 上报失败不能影响主流程；仅记录 warning。

---

## 6. 下一步补点顺序（执行清单）

1. 全页补 `page_view` + `nav_click` + `tab_click` 基础层。
2. 补转化关键链路：`首页 -> 测一测 -> 结果 -> 联系顾问`。
3. 补复杂交互：案例弹窗、院校树、地图点位。
4. 对接看板：先跑漏斗，再跑页面热力和 CTA 点击率。
