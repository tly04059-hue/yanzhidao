#!/bin/bash
# ==========================================
# 研知道 - 阿里云部署脚本
# ==========================================

# 配置
APP_NAME="yanzhidao"
API_PORT=8010
H5_PORT=8080
WORKSPACE="/var/www/yanzhidao"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    echo_error "请使用 sudo 运行此脚本"
    exit 1
fi

# 1. 安装 Node.js (如果未安装)
install_nodejs() {
    if ! command -v node &> /dev/null; then
        echo_info "安装 Node.js 18.x..."
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
    fi
    echo_info "Node.js 版本: $(node -v)"
    echo_info "npm 版本: $(npm -v)"
}

# 2. 安装 Nginx
install_nginx() {
    if ! command -v nginx &> /dev/null; then
        echo_info "安装 Nginx..."
        yum install -y nginx
    fi
    systemctl enable nginx
    systemctl start nginx
    echo_info "Nginx 已启动"
}

# 3. 创建工作目录
create_workspace() {
    mkdir -p $WORKSPACE/{api,h5,logs}
    echo_info "工作目录已创建: $WORKSPACE"
}

# 4. 部署后端 API
deploy_api() {
    echo_info "部署后端 API..."

    # 复制后端代码
    cp -r /tmp/yanzhidao-deploy/schooltool/apps/api/* $WORKSPACE/api/
    cp -r /tmp/yanzhidao-deploy/schooldata $WORKSPACE/api/

    # 安装依赖
    cd $WORKSPACE/api
    npm install --production

    # 创建 systemd 服务
    cat > /etc/systemd/system/yanzhidao-api.service << EOF
[Unit]
Description=研知道 API Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$WORKSPACE/api
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=PORT=$API_PORT
Environment=NODE_ENV=production
Environment=SCHOOL_DATA_PATH=$WORKSPACE/api/schooldata/data.json
Environment=RUNTIME_DIR=$WORKSPACE/api/runtime
Environment=CORS_ORIGIN=*

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable yanzhidao-api
    systemctl restart yanzhidao-api

    echo_info "API 服务已启动，监听端口 $API_PORT"
}

# 5. 部署 H5 前端
deploy_h5() {
    echo_info "部署 H5 前端..."

    # 复制 H5 构建文件
    rm -rf $WORKSPACE/h5/*
    cp -r /tmp/yanzhidao-deploy/miniapp/dist/build/h5/* $WORKSPACE/h5/

    echo_info "H5 文件已部署到 $WORKSPACE/h5"
}

# 6. 配置 Nginx
configure_nginx() {
    echo_info "配置 Nginx..."

    cat > /etc/nginx/conf.d/yanzhidao.conf << EOF
# 后端 API 服务
server {
    listen 80;
    server_name _;

    location /api/ {
        proxy_pass http://127.0.0.1:$API_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# H5 前端
server {
    listen $H5_PORT;
    server_name _;
    root $WORKSPACE/h5;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # 检查 Nginx 配置
    nginx -t

    # 重启 Nginx
    systemctl restart nginx
    echo_info "Nginx 配置已更新，重启完成"
}

# 7. 开放防火墙端口
开放防火墙端口() {
    echo_info "开放防火墙端口..."
    firewall-cmd --permanent --add-port=$API_PORT/tcp 2>/dev/null || true
    firewall-cmd --permanent --add-port=$H5_PORT/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    echo_info "端口 $H5_PORT (H5) 已开放"
}

# 8. 验证部署
verify_deployment() {
    echo_info "验证部署..."

    # 检查 API
    sleep 2
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$API_PORT/api/health 2>/dev/null)
    if [ "$API_STATUS" = "200" ]; then
        echo_info "✅ API 服务正常 (HTTP $API_STATUS)"
    else
        echo_error "❌ API 服务异常 (HTTP $API_STATUS)"
    fi

    # 检查 H5
    H5_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$H5_PORT/index.html 2>/dev/null)
    if [ "$H5_STATUS" = "200" ]; then
        echo_info "✅ H5 前端正常 (HTTP $H5_STATUS)"
    else
        echo_error "❌ H5 前端异常 (HTTP $H5_STATUS)"
    fi
}

# 9. 显示访问信息
show_info() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}  部署完成！${NC}"
    echo "=========================================="
    echo ""
    echo "访问地址："
    echo "  H5 网页: http://<服务器IP>:$H5_PORT"
    echo "  API 接口: http://<服务器IP>:$API_PORT/api/health"
    echo ""
    echo "服务管理命令："
    echo "  重启 API:  systemctl restart yanzhidao-api"
    echo "  查看日志:  journalctl -u yanzhidao-api -f"
    echo "  重启 Nginx: systemctl restart nginx"
    echo ""
}

# 执行部署
main() {
    echo_info "开始部署研知道应用..."
    echo_info "工作目录: $WORKSPACE"
    echo ""

    install_nodejs
    install_nginx
    create_workspace
    deploy_api
    deploy_h5
    configure_nginx
    开放防火墙端口
    verify_deployment
    show_info
}

main "$@"
