# P0 正式 API、留资闭环与微信真机测试准备

> 更新时间：2026-05-15  
> 目标：把本版上线前必须处理的 API 域名、留资链路、微信真机提测拆成可检查、可执行、可交接的任务。

## 1. 本次已完成

1. 生产 API 地址统一为：

```text
https://yanzhidao.com/api
```

对应文件：

```text
miniapp/.env.production
```

2. 微信小程序 URL 合法域名校验已切换为提测口径：

```text
miniapp/src/manifest.json
mp-weixin.setting.urlCheck = true
```

微信小程序 AppID 已写入：

```text
mp-weixin.appid = wx72386d5026c9782a
```

3. 新增生产就绪检查脚本：

```bash
python3 projectOps/scripts/check-production-readiness.py
```

输出报告：

```text
projectOps/reports/latest-production-readiness-report.json
```

4. 微信小程序构建通过：

```bash
python3 projectOps/scripts/build-miniapp.py --target mp-weixin
```

## 2. 当前检查结果

本地可确认已通过：

- 生产 API 地址已配置。
- 生产 API 使用 HTTPS。
- 生产 API 不再指向本地地址。
- 微信 URL 合法域名校验已开启。
- 微信小程序 AppID 已填写。
- 微信小程序构建目录已生成。

当前线上检测异常：

- `https://yanzhidao.com/api/health` 在本机检测时 HTTPS 握手失败，错误为 `SSL_ERROR_SYSCALL`。
- `http://yanzhidao.com/api/health` 返回阿里云备案拦截页：`Non-compliance ICP Filing`。
- `https://47.108.212.185/api/health` 忽略证书校验后可返回健康检查，说明服务器上的 API 服务本身是活的。
- `http://47.108.212.185/api/health` 会 301 到 HTTPS，说明服务器已有 Nginx HTTPS 跳转。
- `https://47.108.212.185/` 忽略证书校验后可返回 H5 页面，说明 H5 静态站点也在服务器上。

人工仍需确认：

- `yanzhidao.com` 是否已解析到正式服务器。
- `yanzhidao.com` 是否已有有效 HTTPS 证书。
- 微信公众平台后台是否已配置 request 合法域名：`https://yanzhidao.com`。
- iOS 真机测试是否通过。
- Android 真机测试是否通过。
- 留资提交后，销售或运营是否能看到并处理记录。

## 3. 留资闭环当前状态

前端入口：

- 推荐结果页底部：`领取备考资料`。
- 用户填写手机号和微信号。
- 勾选信息收集说明。
- 调用 `POST /api/miniapp/lead`。

后端提测版能力：

- `POST /api/miniapp/lead` 已存在。
- 当前后端会把留资写入 JSONL。
- 同时写入 `submit_lead` 事件，供飞轮洞察统计。

本版上线前必须确认：

1. 正式服务器上的 `RUNTIME_DIR` 放在哪里。
2. 谁负责查看留资文件。
3. 是否需要同步推送到企业微信、飞书、表格或 CRM。
4. 用户提交失败时是否保留客服微信兜底。
5. 信息收集说明和隐私协议是否由公司确认。

## 4. 接下来需要用户或同事提供

1. 微信公众平台管理员权限，或能配置服务器域名的同事。
2. 正式域名确认使用 `https://yanzhidao.com`。
3. `yanzhidao.com` 是否正常解析到 `47.108.212.185`。
4. HTTPS 证书方案：已有证书，或使用阿里云免费证书。
5. 留资接收方式：
   - 先人工查看服务器 JSONL。
   - 写入在线表格。
   - 推送企业微信/飞书群。
   - 接 CRM。

## 5. 本版建议处理顺序

1. 确认 `yanzhidao.com`、服务器 IP 和 HTTPS。
2. 部署 API 服务，验证 `https://yanzhidao.com/api/health`。
3. 微信后台添加 request 合法域名。
4. 上传体验版。
5. 用真机走完整链路：打开首页、院校库、测一测、结果页、提交留资。
6. 在服务器或销售接收端确认留资记录。

## 6. 注意事项

- `schooltool/` 仍只读不改。本次只读取里面的 API 和部署说明作为参考。
- 小程序当前院校库和推荐结果主要读取本地发布 JSON，正式 API 在本版最关键的作用是留资、埋点、反馈和飞轮洞察。
- 估分工具、MEM 字段补齐、案例筛选增强不进入本版 P0。
