# 服务器连接、部署、提测、上线准备 Runbook

> 更新时间：2026-05-15  
> 目标：只做连接和发版准备，不自动连接远程服务器。用户后续可按本文档自行执行。

## 1. 当前已知信息

微信小程序 AppID：

```text
wx72386d5026c9782a
```

生产 API：

```text
https://yanzhidao.com/api
```

服务器公网 IP：

```text
47.108.212.185
```

本地生产构建检查：

```bash
python3 projectOps/scripts/check-all.py
python3 projectOps/scripts/check-production-readiness.py
python3 projectOps/scripts/build-miniapp.py --target h5
python3 projectOps/scripts/build-miniapp.py --target mp-weixin
```

## 2. 本地发版前检查

在本地项目根目录执行：

```bash
cd /Users/march/yanzhidao
python3 projectOps/scripts/check-all.py
python3 projectOps/scripts/check-production-readiness.py
python3 projectOps/scripts/release.py --target h5
python3 projectOps/scripts/release.py --target mp-weixin
```

通过后重点确认：

- `miniapp/dist/build/h5/` 已生成。
- `miniapp/dist/build/mp-weixin/` 已生成。
- `miniapp/.env.production` 指向 `https://yanzhidao.com/api`。
- `miniapp/src/manifest.json` 已填写 AppID。
- `projectOps/reports/latest-production-readiness-report.json` 无本地错误。

## 3. 服务器连接准备

连接命令模板：

```bash
ssh root@47.108.212.185
```

如果不是 root 用户：

```bash
ssh <用户名>@47.108.212.185
```

登录后先只检查，不改配置：

```bash
pwd
whoami
hostname
node -v
npm -v
nginx -v
pm2 -v
```

检查 Nginx：

```bash
sudo nginx -t
sudo nginx -T | grep -n "server_name\\|ssl_certificate\\|proxy_pass"
```

检查服务：

```bash
curl -k https://127.0.0.1/api/health
curl -k https://47.108.212.185/api/health
```

## 4. 域名和 HTTPS 检查

在服务器上检查：

```bash
curl -I http://yanzhidao.com
curl -I https://yanzhidao.com
curl https://yanzhidao.com/api/health
```

期望：

```json
{"ok":true,"service":"yanzhidao-miniapp-api"}
```

如果 IP 可访问、域名不可访问，优先检查：

- 域名备案状态。
- 域名解析是否指向 `47.108.212.185`。
- Nginx 是否有 `server_name yanzhidao.com`。
- SSL 证书是否绑定 `yanzhidao.com`。
- 微信后台 request 合法域名是否配置 `https://yanzhidao.com`。

## 5. H5 部署准备

本地构建：

```bash
cd /Users/march/yanzhidao
python3 projectOps/scripts/build-miniapp.py --target h5
```

上传目录：

```text
miniapp/dist/build/h5/
```

服务器建议静态目录：

```text
/var/www/yanzhidao/h5/
```

上传方式示例：

```bash
scp -r miniapp/dist/build/h5/* root@47.108.212.185:/var/www/yanzhidao/h5/
```

上传后检查：

```bash
curl -k https://47.108.212.185/
curl https://yanzhidao.com/
```

## 6. API 部署准备

当前 API 已能通过服务器 IP 返回健康检查，后续如需更新 API 代码，建议按下面顺序：

1. 上传 API 代码和数据。
2. 安装依赖。
3. 重启 Node 服务。
4. 检查健康接口。
5. 检查留资写入目录。

建议保留运行数据目录：

```text
/var/www/yanzhidao/runtime/
```

建议环境变量：

```bash
NODE_ENV=production
HOST=0.0.0.0
PORT=8010
SCHOOL_DATA_PATH=/var/www/yanzhidao/schooldata/data.json
RUNTIME_DIR=/var/www/yanzhidao/runtime
CORS_ORIGIN=https://yanzhidao.com
```

## 7. 微信小程序提测准备

本地构建：

```bash
cd /Users/march/yanzhidao
python3 projectOps/scripts/build-miniapp.py --target mp-weixin
```

微信开发者工具导入目录：

```text
miniapp/dist/build/mp-weixin
```

提测前确认：

- AppID 是 `wx72386d5026c9782a`。
- 微信后台 request 合法域名包含 `https://yanzhidao.com`。
- 体验版可打开首页。
- 院校库可浏览。
- 测一测能完成 8 题并进入结果页。
- 结果页能提交手机号/微信。
- 服务器能看到留资记录。

## 8. 留资接收方式解释

当前最小闭环推荐：

```text
用户提交手机号/微信
→ 后端写入服务器 JSONL 文件
→ 销售或运营每天查看/导出
```

后续增强方式：

- 在线表格：提交后自动写入飞书/腾讯文档/金山表格。
- 企业微信/飞书：提交后自动推送到销售群。
- CRM：正式客户管理系统，记录客户来源、电话、微信、意向、跟进状态。

一期建议先用 JSONL 文件，不阻塞上线。

## 9. 本版不处理

- 估分工具正式化。
- 案例库筛选增强。
- MEM 字段补齐。

以上放到第二版或第三版。
