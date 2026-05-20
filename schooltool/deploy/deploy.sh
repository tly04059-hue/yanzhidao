#!/bin/bash
# ==========================================
# 研知道 - 阿里云一键部署脚本
# ==========================================

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo_info "开始部署研知道应用..."
echo_info "系统: Alibaba Cloud Linux 3"
echo ""

# 1. 安装 Node.js 18
echo_info "步骤 1/5: 安装 Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
fi
echo_info "Node.js 版本: $(node -v)"
echo_info "npm 版本: $(npm -v)"

# 2. 安装 Nginx
echo_info "步骤 2/5: 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    yum install -y nginx
fi
systemctl enable nginx
systemctl start nginx
echo_info "Nginx 已启动"

# 3. 创建工作目录
echo_info "步骤 3/5: 创建工作目录..."
WORKSPACE="/var/www/yanzhidao"
mkdir -p $WORKSPACE/{api,h5,logs,runtime}
echo_info "工作目录: $WORKSPACE"

# 4. 解压部署文件
echo_info "步骤 4/5: 解压部署文件..."
if [ -f /tmp/yanzhidao-deploy.tar.gz ]; then
    tar -xzvf /tmp/yanzhidao-deploy.tar.gz -C $WORKSPACE/
    
    # 移动文件到正确位置
    mv $WORKSPACE/miniapp/dist/build/h5/* $WORKSPACE/h5/
    mv $WORKSPACE/schooltool/apps/api/* $WORKSPACE/api/
    
    # 清理临时目录
    rm -rf $WORKSPACE/miniapp $WORKSPACE/schooltool
    
    echo_info "文件解压完成"
else
    echo_error "未找到部署文件: /tmp/yanzhidao-deploy.tar.gz"
    exit 1
fi

# 5. 安装后端依赖并启动
echo_info "步骤 5/5: 配置后端服务..."
cd $WORKSPACE/api
npm install --production

# 使用 PM2 管理进程
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

pm2 delete yanzhidao-api 2>/dev/null
pm2 start --name yanzhidao-api server.js
pm2 save
pm2 startup

# 配置 Nginx
cat > /etc/nginx/conf.d/yanzhidao.conf << 'EOF'
# H5 前端 (端口 8080)
server {
    listen 8080;
    server_name _;
    root /var/www/yanzhidao/h5;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# API 代理 (端口 8010)
server {
    listen 8010;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 重启 Nginx
nginx -t && systemctl restart nginx

# 开放防火墙端口
echo_info "开放防火墙端口..."
firewall-cmd --permanent --add-port=8080/tcp 2>/dev/null || true
firewall-cmd --permanent --add-port=8010/tcp 2>/dev/null || true
firewall-cmd --reload 2>/dev/null || true

# 等待服务启动
sleep 3

# 验证部署
echo ""
echo_info "验证部署..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8010/api/health 2>/dev/null)
H5_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/index.html 2>/dev/null)

echo ""
echo "=========================================="
echo -e "${GREEN}  部署完成！${NC}"
echo "=========================================="
echo ""
echo -e "API 服务: ${API_STATUS} (http://你的IP:8010/api/health)"
echo -e "H5 页面: ${H5_STATUS} (http://你的IP:8080)"
echo ""
echo "查看日志: pm2 logs yanzhidao-api"
echo "重启服务: pm2 restart yanzhidao-api"
echo ""
