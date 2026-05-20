# 研知道 - 阿里云部署指南

## 部署概览

本项目包含两部分部署：
1. **后端 API 服务** (Node.js + Express，端口 8010)
2. **H5 前端** (uni-app 构建的静态网站，端口 8080)

## 部署前准备

### 1. 阿里云服务器要求
- 系统：CentOS 7.x / 8.x 或 Ubuntu 20.04+
- 配置：最低 1核1G（推荐 2核2G）
- 开放端口：8080, 8010, 80, 443

### 2. 获取服务器信息
需要准备以下信息：
- 服务器公网 IP
- SSH 登录凭证（用户名 + 密码 或 SSH 密钥）
- 登录方式（密码登录 或 密钥登录）

## 部署步骤

### 方式一：自动化部署（推荐）

1. **上传项目文件到服务器**
   ```bash
   # 在本地打包项目
   cd /Users/march/yanzhidao
   tar -czvf yanzhidao.tar.gz miniapp schooltool schooldata

   # 上传到服务器（替换为你的服务器IP）
   scp yanzhidao.tar.gz root@你的服务器IP:/tmp/
   ```

2. **SSH 登录服务器并解压**
   ```bash
   ssh root@你的服务器IP
   mkdir -p /tmp/yanzhidao-deploy
   tar -xzvf /tmp/yanzhidao.tar.gz -C /tmp/yanzhidao-deploy
   ```

3. **构建 H5 前端**
   ```bash
   cd /tmp/yanzhidao-deploy/miniapp
   npm install
   npm run build:h5
   ```

4. **运行部署脚本**
   ```bash
   chmod +x /tmp/yanzhidao-deploy/schooltool/deploy/deploy-aliyun.sh
   sudo /tmp/yanzhidao-deploy/schooltool/deploy/deploy-aliyun.sh
   ```

### 方式二：手动分步部署

#### 步骤 1：安装基础软件
```bash
# CentOS
yum update -y
yum install -y nodejs npm nginx

# Ubuntu
apt update -y
apt install -y nodejs npm nginx
```

#### 步骤 2：配置后端服务

```bash
# 创建工作目录
mkdir -p /var/www/yanzhidao/{api,h5,logs,runtime}

# 复制后端代码
cp -r /tmp/yanzhidao-deploy/schooltool/apps/api/* /var/www/yanzhidao/api/
cp -r /tmp/yanzhidao-deploy/schooldata /var/www/yanzhidao/api/

# 安装依赖
cd /var/www/yanzhidao/api
npm install --production

# 使用 PM2 启动（推荐）
npm install -g pm2
pm2 start /path/to/ecosystem.config.js
pm2 save
pm2 startup
```

#### 步骤 3：构建并部署 H5 前端

```bash
# 在本地构建
cd /Users/march/yanzhidao/miniapp
npm install
npm run build:h5

# 将 dist/build/h5 目录内容上传到服务器
scp -r dist/build/h5/* root@你的服务器IP:/var/www/yanzhidao/h5/
```

#### 步骤 4：配置 Nginx

```bash
# 复制 Nginx 配置
cp /path/to/nginx.conf /etc/nginx/conf.d/yanzhidao.conf

# 检查配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

#### 步骤 5：开放防火墙端口

```bash
# CentOS 7
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --permanent --add-port=8010/tcp
firewall-cmd --reload

# 或者直接关闭防火墙（测试环境）
systemctl stop firewalld
systemctl disable firewalld
```

## 部署验证

### 1. 检查服务状态
```bash
# 检查 API 服务
curl http://127.0.0.1:8010/api/health

# 检查 H5 页面
curl http://127.0.0.1:8080/index.html
```

### 2. 外部访问测试
在浏览器中访问：
- H5 网页：`http://你的服务器IP:8080`
- API 接口：`http://你的服务器IP:8010/api/health`

## 服务管理

### 使用 PM2 管理 API
```bash
pm2 status                    # 查看状态
pm2 logs yanzhidao-api       # 查看日志
pm2 restart yanzhidao-api    # 重启服务
pm2 stop yanzhidao-api       # 停止服务
```

### 使用 Systemd 管理 API（备选）
```bash
systemctl enable yanzhidao-api    # 开机自启
systemctl restart yanzhidao-api   # 重启
systemctl status yanzhidao-api    # 状态
journalctl -u yanzhidao-api -f    # 实时日志
```

### Nginx 管理
```bash
systemctl restart nginx       # 重启
systemctl status nginx       # 状态
nginx -t                      # 检查配置
```

## 目录结构

部署后的目录结构：
```
/var/www/yanzhidao/
├── api/                    # 后端 API
│   ├── server.js
│   ├── schooldata/         # 院校数据
│   ├── runtime/            # 运行数据（留资记录等）
│   └── node_modules/
├── h5/                     # H5 前端
│   ├── index.html
│   ├── js/
│   ├── css/
│   └── static/
└── logs/                   # 日志目录
    ├── api-out.log
    ├── api-error.log
    └── h5-access.log
```

## 后续配置

### 1. 配置 HTTPS（重要！）
```bash
# 安装 Certbot
yum install -y certbot python3-certbot-nginx

# 申请证书（需要域名）
certbot --nginx -d yourdomain.com

# 自动续期
certbot renew --dry-run
```

### 2. 配置域名解析
在阿里云 DNS 控制台添加记录：
- A 记录：`@` → 服务器IP
- A 记录：`www` → 服务器IP

### 3. 修改 API 地址
在 H5 代码中更新 API 地址：
```javascript
// 在 miniapp 项目中修改
// vite.config.js 或 manifest.json
VITE_API_BASE_URL: 'https://yourdomain.com/api'
```

## 常见问题

### Q1: API 服务启动失败
```bash
# 检查端口占用
netstat -tlnp | grep 8010

# 查看错误日志
pm2 logs yanzhidao-api
```

### Q2: H5 页面显示空白
- 检查 Nginx 配置中的 root 路径
- 确认文件已正确复制到 h5 目录
- 检查浏览器控制台错误

### Q3: CORS 跨域问题
确保后端配置了正确的 CORS 源：
```javascript
// server.js 中
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
```

## 联系方式

如有问题，请检查日志或联系技术支持。
