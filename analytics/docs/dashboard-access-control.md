# 用户行为看板权限控制说明

## 目标

用户行为看板包含匿名用户轨迹、会话路径、设备型号、分享链路和行为时间线。即使没有手机号、openid，也属于可持续识别同一用户的行为数据，上线后不能裸露在公开路径。

## 当前本地验收

`analytics/reports/user-behavior-dashboard.html` 内置了前端访问门禁，默认口令：

```text
yanzhidao-dashboard
```

这个门禁只用于本地或内网验收，不能作为正式权限控制。因为静态 HTML 的口令可以被查看源码看到，且 `latest-summary.json` 如果公开访问，仍然可能被绕过页面直接下载。

## 当前服务端保护

`schooltool/apps/api/server.js` 和 `schooltool/apps/api/server-prod.js` 已内置 `/analytics/*` 的 Basic Auth 保护。通过 API 服务访问时，以下两个地址会同时受保护：

```text
/analytics/user-behavior-dashboard.html
/analytics/latest-summary.json
```

生产环境必须配置环境变量：

```bash
ANALYTICS_AUTH_USER=analytics_admin
ANALYTICS_AUTH_PASSWORD=请换成公司内部口令
```

未配置时，生产环境访问 `/analytics/*` 会返回 `503`，避免看板裸露。

本地开发环境如果没有配置环境变量，会使用以下默认值：

```text
用户名：analytics_admin
口令：yanzhidao-dashboard
```

## 正式上线要求

正式部署时必须同时保护：

```text
/analytics/user-behavior-dashboard.html
/analytics/latest-summary.json
```

推荐至少使用以下一种方式：

1. API 服务内置 Basic Auth，并让 Nginx 反向代理 `/analytics/` 到 API 服务。
2. Nginx Basic Auth。
3. 公司内网 IP 白名单。
4. 登录态鉴权后由后端返回看板页面和 JSON。
5. VPN 后访问。

## 推荐 Nginx 反向代理

如果 API 服务运行在 `127.0.0.1:8010`，推荐这样转发，权限由 Node API 的 Basic Auth 处理：

```nginx
location /analytics/ {
  proxy_pass http://127.0.0.1:8010/analytics/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

验证方式：

```bash
curl -I https://yanzhidao.com/analytics/user-behavior-dashboard.html
curl -I -u analytics_admin:你的口令 https://yanzhidao.com/analytics/user-behavior-dashboard.html
curl -I -u analytics_admin:你的口令 https://yanzhidao.com/analytics/latest-summary.json
```

第一条应该返回 `401`，后两条应该返回 `200`。

## 备选 Nginx Basic Auth

如果不走 API 服务，也可以直接用 Nginx 保护静态目录：

1. Nginx Basic Auth。
2. 公司内网 IP 白名单。
3. 登录态鉴权后由后端返回看板页面和 JSON。
4. VPN 后访问。

示例：

```nginx
location /analytics/ {
  auth_basic "Yanzhidao Analytics";
  auth_basic_user_file /etc/nginx/.htpasswd-yanzhidao-analytics;

  alias /path/to/yanzhidao/analytics/reports/;
  try_files $uri =404;
}
```

生成密码文件示例：

```bash
htpasswd -c /etc/nginx/.htpasswd-yanzhidao-analytics analytics_admin
```

## 数据最小化原则

看板只应展示业务分析需要的匿名数据：

- `anonymous_user_id`
- `session_id`
- `event_type`
- `page_path`
- `section_id`
- `duration_ms`
- `device_model`
- `platform`
- `share_trace_id`

不要在看板里展示手机号、微信昵称、头像、真实姓名、完整 openid，除非后续明确完成隐私政策告知和内部权限分级。
