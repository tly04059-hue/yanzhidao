# 用户行为看板权限控制说明

## 目标

用户行为看板包含匿名用户轨迹、会话路径、设备型号、分享链路和行为时间线。即使没有手机号、openid，也属于可持续识别同一用户的行为数据，上线后不能裸露在公开路径。

## 当前本地验收

`analytics/reports/user-behavior-dashboard.html` 内置了前端访问门禁，默认口令：

```text
yanzhidao-dashboard
```

这个门禁只用于本地或内网验收，不能作为正式权限控制。因为静态 HTML 的口令可以被查看源码看到，且 `latest-summary.json` 如果公开访问，仍然可能被绕过页面直接下载。

## 正式上线要求

正式部署时必须同时保护：

```text
/analytics/user-behavior-dashboard.html
/analytics/latest-summary.json
```

推荐至少使用以下一种方式：

1. Nginx Basic Auth。
2. 公司内网 IP 白名单。
3. 登录态鉴权后由后端返回看板页面和 JSON。
4. VPN 后访问。

## Nginx Basic Auth 示例

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
