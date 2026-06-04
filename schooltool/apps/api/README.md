# Schooltool API

轻量本地/生产 API 服务，当前用于微信小程序行为事件接收。

## 启动

```bash
PORT=8010 node schooltool/apps/api/server.js
```

## 已实现接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 健康检查。 |
| `POST` | `/api/miniapp/events` | 接收小程序埋点事件，校验字段后写入 JSONL。 |

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
