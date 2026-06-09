# Schooltool API

轻量本地/生产 API 服务，当前用于微信小程序行为事件接收。

## 启动

```bash
PORT=8010 node schooltool/apps/api/server.js
```

生产环境建议显式配置看板访问口令：

```bash
ANALYTICS_AUTH_USER=analytics_admin \
ANALYTICS_AUTH_PASSWORD=请换成公司内部口令 \
PORT=8010 \
NODE_ENV=production \
node schooltool/apps/api/server-prod.js
```

## 已实现接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 健康检查。 |
| `POST` | `/api/miniapp/events` | 接收小程序埋点事件，校验字段后写入 JSONL。 |
| `GET` | `/analytics/*` | 受 Basic Auth 保护的用户行为看板和汇总 JSON。 |

## 落盘位置

```text
schooltool/data/runtime/miniapp-events.jsonl
```

每行一条 JSON，append-only。

## 必填字段

```text
event_id
event_type
page
page_path
anonymous_user_id
session_id
env
app_version
tracking_plan_version
created_at
```

案例点击、案例详情弹窗等 `target_type=case` 事件还必须带 `target_id`。

## 用户行为看板保护

通过 API 服务访问以下地址时，会要求 Basic Auth：

```text
/analytics/user-behavior-dashboard.html
/analytics/latest-summary.json
```

本地默认账号仅用于验收：

```text
analytics_admin / yanzhidao-dashboard
```

生产环境不配置 `ANALYTICS_AUTH_USER` 和 `ANALYTICS_AUTH_PASSWORD` 时，`/analytics/*` 会返回 `503`，避免数据裸露。
