#!/usr/bin/env bash
#
# 用户行为看板上线操作手册
# 在服务器上按 Phase 顺序执行
# 用法: bash schooltool/scripts/go-live-runbook.sh
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

section()  { echo ""; echo -e "${BLUE}━━━ $1 ━━━${NC}"; }
info()     { echo -e "  $1"; }
confirm()  { echo ""; read -p "  确认完成? (按 Enter 继续)"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "============================================"
echo "  用户行为看板 - 上线操作手册"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""
echo "前置条件（请确认已满足，再继续）:"
echo "  [ ] 服务器已拉取最新代码（codex/user-behavior-trace-v1 分支）"
echo "  [ ] Node.js 已安装 (>=18)"
echo "  [ ] Nginx 已安装并运行"
echo "  [ ] API 服务（server-prod.js）可重启"
echo "  [ ] 有服务器 sudo 权限（修改 Nginx 配置）"
echo ""

read -p "已确认所有前置条件? (y/N): " READY
if [ "$READY" != "y" ] && [ "$READY" != "Y" ]; then
  echo "请先满足前置条件后再执行。"
  exit 1
fi

# ════════════════════════════════════════════════════
# Phase 1: 确认文件部署状态
# ════════════════════════════════════════════════════
section "Phase 1: 确认文件部署状态"

REQUIRED_FILES=(
  "analytics/reports/user-behavior-dashboard.html"
  "analytics/reports/visitor-detail.html"
  "analytics/scripts/aggregate-jsonl.mjs"
  "schooltool/apps/api/server-prod.js"
  "schooltool/data/runtime"
)

ALL_FOUND=true
for f in "${REQUIRED_FILES[@]}"; do
  if [ -e "$PROJECT_ROOT/$f" ]; then
    info "✅ $f"
  else
    info "❌ $f 不存在！请先 git pull 最新代码"
    ALL_FOUND=false
  fi
done

if [ "$ALL_FOUND" = false ]; then
  echo ""
  echo "请执行: cd $PROJECT_ROOT && git pull origin codex/user-behavior-trace-v1"
  exit 1
fi

# 检查是否存在旧版 demo 数据
DEMO_EVENTS="$PROJECT_ROOT/analytics/reports/demo-miniapp-events.jsonl"
DEMO_LEADS="$PROJECT_ROOT/analytics/reports/demo-miniapp-leads.jsonl"
DEMO_SUMMARY="$PROJECT_ROOT/analytics/reports/latest-summary.json"

if [ -f "$DEMO_EVENTS" ]; then
  echo ""
  echo -e "  ${YELLOW}⚠ 发现 demo 数据文件: analytics/reports/demo-miniapp-events.jsonl${NC}"
  echo "  Demo 数据仅用于本地开发，上线前建议从 analytics/reports/ 中移除，避免暴露。"
  read -p "  是否删除 demo JSONL 文件? (y/N): " DEL_DEMO
  if [ "$DEL_DEMO" = "y" ] || [ "$DEL_DEMO" = "Y" ]; then
    rm -f "$DEMO_EVENTS" "$DEMO_LEADS"
    info "已删除 demo JSONL 文件。"
  else
    info "保留 demo 文件（请确保 Nginx / API 不会对外暴露）"
  fi
fi

# 如果 latest-summary.json 是 demo 数据，清理它
if [ -f "$DEMO_SUMMARY" ]; then
  SOURCES_EVENTS=$(python3 -c "import json; d=json.load(open('$DEMO_SUMMARY')); print(d.get('sources',{}).get('events',''))" 2>/dev/null || echo "")
  if echo "$SOURCES_EVENTS" | grep -q "demo-miniapp"; then
    echo ""
    echo -e "  ${YELLOW}⚠ latest-summary.json 当前是 demo 数据来源${NC}"
    echo "  (sources.events = $SOURCES_EVENTS)"
    echo "  需要用真实数据重新聚合。"
    rm -f "$DEMO_SUMMARY"
    info "已删除 demo 版 latest-summary.json，将在 Phase 5 重新生成。"
  fi
fi

confirm

# ════════════════════════════════════════════════════
# Phase 2: 确认运行时数据目录
# ════════════════════════════════════════════════════
section "Phase 2: 确认运行时数据目录"

RUNTIME_DIR="$PROJECT_ROOT/schooltool/data/runtime"
EVENTS_FILE="$RUNTIME_DIR/miniapp-events.jsonl"
LEADS_FILE="$RUNTIME_DIR/miniapp-leads.jsonl"

mkdir -p "$RUNTIME_DIR"
chmod 755 "$RUNTIME_DIR"
info "runtime 目录: $RUNTIME_DIR"

if [ -f "$EVENTS_FILE" ]; then
  EVENTS_COUNT=$(wc -l < "$EVENTS_FILE" 2>/dev/null || echo 0)
  info "✅ miniapp-events.jsonl 存在，共 $EVENTS_COUNT 行"
else
  echo -e "  ${YELLOW}⚠ miniapp-events.jsonl 不存在${NC}"
  echo "  首次部署后，小程序上报事件会自动创建此文件。"
  echo "  如果需要在看板上线时就能看到数据，请先确保小程序真机测试已产生埋点事件。"
fi

if [ -f "$LEADS_FILE" ]; then
  LEADS_COUNT=$(wc -l < "$LEADS_FILE" 2>/dev/null || echo 0)
  info "✅ miniapp-leads.jsonl 存在，共 $LEADS_COUNT 行"
else
  info "miniapp-leads.jsonl 尚不存在（首次留资后会创建）"
fi

confirm

# ════════════════════════════════════════════════════
# Phase 3: 配置 API 环境变量 & 重启服务
# ════════════════════════════════════════════════════
section "Phase 3: 配置 API 环境变量"

echo "  需要为 API 服务设置以下环境变量，用于 Basic Auth 保护看板："
echo ""
echo "  ANALYTICS_AUTH_USER=analytics_admin"
echo "  ANALYTICS_AUTH_PASSWORD=<你设置的口令>"
echo ""

read -p "  请输入看板访问口令 (默认: yanzhidao-dashboard): " AUTH_PASSWORD
AUTH_PASSWORD=${AUTH_PASSWORD:-yanzhidao-dashboard}

echo ""
echo "  请根据你的 API 部署方式设置环境变量："
echo ""
echo "  ── 方式 A: systemd ──"
echo "  在 yanzhidao-api.service 的 [Service] 段添加："
echo "    Environment=\"ANALYTICS_AUTH_USER=analytics_admin\""
echo "    Environment=\"ANALYTICS_AUTH_PASSWORD=$AUTH_PASSWORD\""
echo "  然后执行: sudo systemctl daemon-reload && sudo systemctl restart yanzhidao-api"
echo ""
echo "  ── 方式 B: pm2 ──"
echo "  创建或更新 ecosystem.config.js："
echo "    module.exports = {"
echo "      apps: [{"
echo "        name: 'yanzhidao-api',"
echo "        script: 'schooltool/apps/api/server-prod.js',"
echo "        env: {"
echo "          NODE_ENV: 'production',"
echo "          PORT: 8010,"
echo "          ANALYTICS_AUTH_USER: 'analytics_admin',"
echo "          ANALYTICS_AUTH_PASSWORD: '$AUTH_PASSWORD'"
echo "        }"
echo "      }]"
echo "    }"
echo "  然后执行: pm2 restart yanzhidao-api"
echo ""
echo "  ── 方式 C: Docker ──"
echo "  docker run ... -e ANALYTICS_AUTH_USER=analytics_admin -e ANALYTICS_AUTH_PASSWORD=$AUTH_PASSWORD ..."
echo ""
echo "  ── 方式 D: 直接启动 ──"
echo "  export ANALYTICS_AUTH_USER=analytics_admin"
echo "  export ANALYTICS_AUTH_PASSWORD=$AUTH_PASSWORD"
echo "  NODE_ENV=production node schooltool/apps/api/server-prod.js"
echo ""

confirm "配置并重启 API 服务后，按 Enter 继续"

# ════════════════════════════════════════════════════
# Phase 4: 配置 Nginx 反向代理
# ════════════════════════════════════════════════════
section "Phase 4: 配置 Nginx 反向代理"

echo "  需要在 Nginx 的 server 块中添加 /analytics/ 的 location："
echo ""
echo "  location /analytics/ {"
echo "    proxy_pass http://127.0.0.1:8010/analytics/;"
echo "    proxy_set_header Host \$host;"
echo "    proxy_set_header X-Real-IP \$remote_addr;"
echo "    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
echo "    proxy_set_header X-Forwarded-Proto \$scheme;"
echo "  }"
echo ""
echo "  操作步骤:"
echo "  1. 找到 Nginx 配置文件（通常在 /etc/nginx/conf.d/ 或 /etc/nginx/sites-enabled/）"
echo "  2. 在 server { ... } 块内已有 location 之后添加上面这段"
echo "  3. sudo nginx -t（检查语法）"
echo "  4. sudo nginx -s reload（重载）"
echo ""

# 尝试自动检测 nginx 配置
if command -v nginx &> /dev/null; then
  info "检测到 Nginx，正在查找相关配置..."
  NGINX_CONF=$(nginx -T 2>/dev/null | grep -l "yanzhidao" 2>/dev/null || true)
  ANALYTICS_LOCATION=$(nginx -T 2>/dev/null | grep -A5 "location /analytics/" | head -10 || echo "")
  if echo "$ANALYTICS_LOCATION" | grep -q "proxy_pass.*8010"; then
    info "✅ /analytics/ 反向代理已配置"
    echo "$ANALYTICS_LOCATION" | sed 's/^/    /'
  elif echo "$ANALYTICS_LOCATION" | grep -q "analytics"; then
    info "⚠ /analytics/ 有配置但未指向 8010，请手动确认"
    echo "$ANALYTICS_LOCATION" | sed 's/^/    /'
  else
    info "⚠ 未检测到 /analytics/ 的 location 配置，需要手动添加"
  fi
fi

confirm "Nginx 配置完成后，按 Enter 继续"

# ════════════════════════════════════════════════════
# Phase 5: 首次生成 latest-summary.json
# ════════════════════════════════════════════════════
section "Phase 5: 首次聚合生成 latest-summary.json"

OUTPUT_FILE="$PROJECT_ROOT/analytics/reports/latest-summary.json"
AGGREGATE_SCRIPT="$PROJECT_ROOT/analytics/scripts/aggregate-jsonl.mjs"

if [ -f "$EVENTS_FILE" ] && [ -s "$EVENTS_FILE" ]; then
  info "使用真实运行时数据聚合..."
  node "$AGGREGATE_SCRIPT" \
    --events "$EVENTS_FILE" \
    --leads "$LEADS_FILE" \
    --output "$OUTPUT_FILE" \
    --env production

  if [ -f "$OUTPUT_FILE" ]; then
    SUMMARY_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    TOTALS=$(python3 -c "
import json
d = json.load(open('$OUTPUT_FILE'))
print(f\"events={d['totals']['events']}, uv={d['totals']['uv']}, pv={d['totals']['pv']}, sessions={d['totals']['sessions']}\")
" 2>/dev/null || echo "解析失败")
    info "✅ latest-summary.json 生成成功 ($SUMMARY_SIZE)"
    info "   统计: $TOTALS"
    # 确认 sources 指向运行时数据
    SOURCES_EVENTS=$(python3 -c "import json; d=json.load(open('$OUTPUT_FILE')); print(d.get('sources',{}).get('events',''))" 2>/dev/null || echo "")
    if echo "$SOURCES_EVENTS" | grep -q "demo"; then
      echo -e "  ${RED}❌ sources.events 仍指向 demo 数据！${NC}"
    else
      info "   sources.events = $SOURCES_EVENTS"
    fi
  else
    echo -e "  ${RED}❌ 聚合失败，请检查日志${NC}"
  fi
else
  echo -e "  ${YELLOW}⚠ 运行时还没有真实埋点事件数据${NC}"
  echo "  如果只是要验证看板渲染效果，可以用 demo 数据生成一次占位的 summary："
  echo ""
  echo "    node analytics/scripts/generate-demo-jsonl.mjs"
  echo "    node analytics/scripts/aggregate-jsonl.mjs \\"
  echo "      --events analytics/reports/demo-miniapp-events.jsonl \\"
  echo "      --leads analytics/reports/demo-miniapp-leads.jsonl \\"
  echo "      --output analytics/reports/latest-summary.json \\"
  echo "      --env production"
  echo ""
  read -p "  是否用 demo 数据生成占位 summary (仅用于首次渲染验证)? (y/N): " USE_DEMO
  if [ "$USE_DEMO" = "y" ] || [ "$USE_DEMO" = "Y" ]; then
    # 如果 demo 文件已删除，重新生成
    if [ ! -f "$DEMO_EVENTS" ]; then
      info "重新生成 demo 数据..."
      node analytics/scripts/generate-demo-jsonl.mjs
    fi
    node "$AGGREGATE_SCRIPT" \
      --events "$DEMO_EVENTS" \
      --leads "$DEMO_LEADS" \
      --output "$OUTPUT_FILE" \
      --env production
    info "✅ 已用 demo 数据生成 latest-summary.json"
    echo -e "  ${YELLOW}⚠ 注意：请在有真实数据后重新执行聚合${NC}"
  fi
fi

confirm

# ════════════════════════════════════════════════════
# Phase 6: 配置 Cron 定时聚合
# ════════════════════════════════════════════════════
section "Phase 6: 配置 Cron 定时聚合"

echo "  执行定时任务配置脚本..."
bash "$SCRIPT_DIR/crontab-setup.sh"

confirm

# ════════════════════════════════════════════════════
# Phase 7: 验证
# ════════════════════════════════════════════════════
section "Phase 7: 线上验证"

echo "  1. 无凭据访问（应返回 401）:"
HTTP_NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" "https://yanzhidao.com/analytics/" 2>/dev/null || echo "000")
case "$HTTP_NOAUTH" in
  401) info "✅ 无凭据 → 401（已保护）" ;;
  200) echo -e "  ${RED}❌ 无凭据 → 200（未保护！）${NC}" ;;
  503) echo -e "  ${YELLOW}⚠ 无凭据 → 503（Auth 环境变量未配置？）${NC}" ;;
  *)   echo -e "  ${YELLOW}⚠ 无凭据 → $HTTP_NOAUTH${NC}" ;;
esac

echo ""
echo "  2. 带凭据访问（应返回 200）:"
HTTP_AUTH=$(curl -s -o /dev/null -w "%{http_code}" \
  -u "analytics_admin:${AUTH_PASSWORD:-yanzhidao-dashboard}" \
  "https://yanzhidao.com/analytics/" 2>/dev/null || echo "000")
case "$HTTP_AUTH" in
  200) info "✅ 带凭据 → 200（看板可访问）" ;;
  401) echo -e "  ${YELLOW}⚠ 带凭据 → 401（口令不匹配，检查环境变量）${NC}" ;;
  *)   echo -e "  ${YELLOW}⚠ 带凭据 → $HTTP_AUTH${NC}" ;;
esac

echo ""
echo "  3. latest-summary.json 受保护检查："
SUMMARY_NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" "https://yanzhidao.com/analytics/latest-summary.json" 2>/dev/null || echo "000")
case "$SUMMARY_NOAUTH" in
  401) info "✅ latest-summary.json 受 Basic Auth 保护" ;;
  200) echo -e "  ${RED}❌ latest-summary.json 裸奔（数据泄露风险！）${NC}" ;;
  *)   echo -e "  ${YELLOW}⚠ latest-summary.json → $SUMMARY_NOAUTH${NC}" ;;
esac

echo ""
echo "  4. 在浏览器中访问验证："
echo "     https://yanzhidao.com/analytics/"
echo ""
echo "     - 首次访问应弹出浏览器 Basic Auth 对话框"
echo "     - 输入 用户名: analytics_admin  口令: ${AUTH_PASSWORD:-yanzhidao-dashboard}"
echo "     - 应正常渲染看板页面"
echo "     - 确认页面数据展示正常"

echo ""
echo "========== 上线操作完成 =========="
echo ""
echo "后续维护命令:"
echo "  查看聚合日志:    tail -f /tmp/yanzhidao-aggregate.log"
echo "  手动触发聚合:    cd $PROJECT_ROOT && node analytics/scripts/aggregate-jsonl.mjs --events schooltool/data/runtime/miniapp-events.jsonl --leads schooltool/data/runtime/miniapp-leads.jsonl --output analytics/reports/latest-summary.json --env production"
echo "  查看事件数量:    wc -l schooltool/data/runtime/miniapp-events.jsonl"
echo "  重新验证部署:    bash schooltool/scripts/verify-deployment.sh"
echo "  查看定时任务:    crontab -l"
echo ""
echo "看板地址: https://yanzhidao.com/analytics/"
