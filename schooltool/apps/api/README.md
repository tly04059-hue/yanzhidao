# 研知道小程序 API（提测版）

这是 5 月 20 日提测用的最小 Node API 服务，目标是先打通小程序全流程。

## 本地启动

```bash
cd /Users/march/yanzhidao/schooltool
npm run start:miniapp
```

默认地址：

```text
http://127.0.0.1:8010/api
```

健康检查：

```bash
curl http://127.0.0.1:8010/api/health
```

## 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `NODE_ENV` | 运行环境 | `development` |
| `HOST` | 监听地址 | 本地 `127.0.0.1`，生产建议 `0.0.0.0` |
| `PORT` | 监听端口 | `8010` |
| `SCHOOL_DATA_PATH` | 院校库 JSON 路径 | `/Users/march/yanzhidao/schooldata/data.json` |
| `RUNTIME_DIR` | 留资 JSONL 目录 | `schooltool/data/runtime` |
| `CORS_ORIGIN` | H5 跨域白名单，逗号分隔 | 不限制 |

## Docker 构建

在仓库根目录 `/Users/march/yanzhidao` 执行：

```bash
docker build -f schooltool/apps/api/Dockerfile -t yanzhidao-miniapp-api:latest .
docker run -p 8010:8010 -v $(pwd)/schooltool/data/runtime:/app/runtime yanzhidao-miniapp-api:latest
```

## 当前接口

- `GET /api/health`
- `GET /api/miniapp/schools`
- `GET /api/miniapp/schools/:id`
- `POST /api/miniapp/recommend`
- `POST /api/miniapp/lead`
- `GET /api/miniapp/timeline/:pathType`
- `POST /api/miniapp/score-estimate`
