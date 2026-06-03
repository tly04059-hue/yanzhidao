# 微信开发者工具埋点验收清单（首轮）

更新时间：2026-05-25  
范围：基础层 `page_view / nav_click / tab_click`

## 0. 验收准备

1. 导入目录：`/Users/march/yanzhidao/miniapp/dist/build/mp-weixin`
2. 打开调试器 Network，筛选 `/miniapp/events`
3. 清空日志后开始点测

---

## 1. 字段一致性检查（每条事件都看）

每条上报检查以下字段是否存在且有值：

1. `event_type`
2. `session_id`
3. `payload.page`
4. `payload.source`
5. `payload.position`（`tab_click` 固定 `tabbar`，`page_view` 可无）
6. `payload.route`（`page_view` 为当前页面路由；点击事件为目标路由）
7. `payload.scene`

点击事件额外检查：

1. `payload.from_route` 存在
2. `payload.from_route !== payload.route`（同页动作可相同）

---

## 2. 页面级验收动作

## 2.1 首页 / 了解 / 路径对比 / 测一测

1. 进入页面：应上报 `page_view`
2. 点击底部 Tab 三项：应上报 `tab_click`
3. 点击顶部返回（若有）：应上报 `nav_click`

## 2.2 结果链路

1. `test -> loading -> result`：各页面应有 `page_view`
2. 结果页点击：
   - 重测：`nav_click`（`position=cta_retry`）
   - 院校查询：`nav_click`（`position=cta_schools`）
   - 底部 Tab：`tab_click`

## 2.3 内容链路

1. `schools -> school-detail`：`schools` 与 `school_detail` 均有 `page_view`
2. `cases -> map`：`cases` 与 `map` 均有 `page_view`
3. 各页返回按钮：均应有 `nav_click`（`position=back`）

## 2.4 说明页

1. `about / usage / data-source / zexiao / pass-rate / estimate`
2. 进入页：`page_view`
3. 返回按钮：`nav_click`

---

## 3. 首轮通过标准

1. 核心页面 `page_view` 漏报率为 0
2. Tab 点击 `tab_click` 漏报率为 0
3. 顶部返回 `nav_click` 漏报率为 0
4. `source / position / route / scene` 字段完整率 ≥ 95%
5. 不出现因为埋点引起的页面卡顿、跳转失败、白屏

---

## 4. 已知说明

1. 本地 `127.0.0.1` API 场景下，项目可能启用“本地静音”策略，网络里不一定能看到真实入库回包。
2. 若需看真实上报，请切到可访问后端的环境后复测同一清单。
