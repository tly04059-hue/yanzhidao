# projectOps 中控台

`projectOps/` 是研知道大项目的最小总控层。它不承载业务数据，也不写页面逻辑，只负责把院校库、案例库、推荐方案库和小程序串成稳定流程。

## 职责

1. 调度数据更新：调用 `AIAgent/scripts/` 里的清洗和发布脚本。
2. 同步发布数据：把各数据域的 L2 发布文件同步到 `miniapp/src/data/`。
3. 统一校验：检查 JSON、核心数量、隐私字段、发布数据是否存在。
4. 构建小程序：统一执行类型检查和 H5/微信小程序构建。
5. 生成报告：所有中控脚本输出到 `projectOps/reports/`。

## 常用命令

```bash
python3 projectOps/scripts/update-all.py
python3 projectOps/scripts/sync-miniapp-data.py
python3 projectOps/scripts/check-all.py
python3 projectOps/scripts/build-miniapp.py --target h5
```

一键流水线：

```bash
python3 projectOps/scripts/release.py --target h5
```

微信小程序构建：

```bash
python3 projectOps/scripts/release.py --target mp-weixin
```

生产/API/微信真机就绪检查：

```bash
python3 projectOps/scripts/check-production-readiness.py
```

该脚本只检查本地能确定的 P0 项：生产 API 是否 HTTPS、是否仍指向本地、微信 AppID 是否填写、微信 URL 合法域名校验是否开启、微信小程序构建目录是否存在。DNS、SSL 证书、微信后台合法域名、真机 iOS/Android 测试和销售承接需要人工确认。

## 边界

- `projectOps/` 不直接清洗 Excel，不直接改页面。
- 院校库源数据、标准化数据和发布数据仍归 `schoolData/`。
- 案例库源数据、匿名标准化数据和发布数据仍归 `studentCases/`。
- 推荐方案库仍归 `courseRecommendationStrategy/`。
- 小程序只负责读取已同步的发布数据并展示。
