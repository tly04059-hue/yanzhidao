#!/usr/bin/env bash
#
# 验证脚本：检查用户行为追踪相关部署状态
# 在服务器上执行：bash schooltool/scripts/verify-deployment.sh
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass()  { echo -e "${GREEN}[PASS]${NC} $1"; PASS=$((PASS + 1)); }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; FAIL=$((FAIL + 1)); }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; WARN=$((WARN + 1)); }

echo "============================================"
echo "  用户行为追踪部署验证"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# ── 0. 自动定位项目根目录 ──────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
echo "项目根目录: $PROJECT_ROOT"
echo ""

# ── 1. API 服务状态 ────────────────────────────────────────
echo "── 1. 检查 /api/miniapp/events 端点 ──"

API_PORT="${API_PORT:-8010}"

# 1a. Node 进程是否运行
if pgrep -f "server-prod.js\|server.js" > /dev/null 2>&1; then
  pass "Node API 进程正在运行"
  pgrep -af "server-prod.js\|server.js" | head -5
else
  # 尝试 systemd
  if systemctl is-active --quiet yanzhidao-api 2>/dev/null; then
    pass "systemd yanzhidao-api 服务运行中"
  else
    warn "未检测到 Node API 进程（可能用了 pm2 / docker / supervisor）"
    echo "  请手动确认: curl -s http://127.0.0.1:${API_PORT}/api/health"
  fi
fi

# 1b. 端口监听
if ss -tlnp 2>/dev/null | grep -q ":${API_PORT} " || netstat -tlnp 2>/dev/null | grep -q ":${API_PORT} "; then
  pass "端口 ${API_PORT} 正在监听"
else
  warn "端口 ${API_PORT} 未检测到监听"
fi

# 1c. 端点可达性
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${API_PORT}/api/health" 2>/dev/null || echo "000")
if [ "$HEALTH" = "200" ]; then
  pass "GET /api/health 返回 200"
else
  fail "GET /api/health 返回 ${HEALTH}（预期 200）"
fi

# 1d. POST /api/miniapp/events 接收能力
TEST_EVENT='{"event_id":"verify-test-001","event_type":"page_view","page":"verify","page_path":"/pages/verify/index","anonymous_user_id":"verify-user","session_id":"verify-session","env":"trial","app_version":"1.0.0","tracking_plan_version":"v1","created_at":"'"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"'"}'
EVENT_RESP=$(curl -s -X POST "http://127.0.0.1:${API_PORT}/api/miniapp/events" \
  -H "Content-Type: application/json" \
  -d "$TEST_EVENT" 2>/dev/null || echo '{"ok":false}')
if echo "$EVENT_RESP" | grep -q '"ok":true'; then
  pass "POST /api/miniapp/events 成功写入测试事件"
else
  fail "POST /api/miniapp/events 失败: $(echo "$EVENT_RESP" | head -c 150)"
fi

echo ""

# ── 2. 运行时目录写权限 ────────────────────────────────────
echo "── 2. 检查 schooltool/data/runtime/ 写权限 ──"

RUNTIME_DIR="$PROJECT_ROOT/schooltool/data/runtime"

if [ -d "$RUNTIME_DIR" ]; then
  pass "目录存在: $RUNTIME_DIR"
else
  fail "目录不存在: $RUNTIME_DIR"
  echo "  创建命令: mkdir -p $RUNTIME_DIR"
fi

# 检测 miniapp-events.jsonl
EVENTS_FILE="$RUNTIME_DIR/miniapp-events.jsonl"
if [ -f "$EVENTS_FILE" ]; then
  EVENTS_LINES=$(wc -l < "$EVENTS_FILE" 2>/dev/null || echo 0)
  pass "miniapp-events.jsonl 存在，共 ${EVENTS_LINES} 行"
else
  warn "miniapp-events.jsonl 不存在（首次部署后由 API 自动创建）"
fi

# 写权限测试
TEST_WRITE="$RUNTIME_DIR/.write-test-$$"
if touch "$TEST_WRITE" 2>/dev/null; then
  rm -f "$TEST_WRITE"
  pass "目录有写权限"
else
  fail "目录无写权限！请执行: chmod 755 $RUNTIME_DIR"
fi

# 检测进程用户
API_USER=$(ps aux 2>/dev/null | grep -E "server-prod\.js|server\.js" | grep -v grep | head -1 | awk '{print $1}')
if [ -n "$API_USER" ]; then
  DIR_OWNER=$(stat -c '%U' "$RUNTIME_DIR" 2>/dev/null || stat -f '%Su' "$RUNTIME_DIR" 2>/dev/null || echo "unknown")
  echo "  API 进程用户: $API_USER, 目录所有者: $DIR_OWNER"
  if [ "$API_USER" = "$DIR_OWNER" ] || [ "$DIR_OWNER" = "root" ]; then
    :
  else
    warn "进程用户($API_USER) 与目录所有者($DIR_OWNER) 不一致"
  fi
fi

echo ""

# ── 3. 微信小程序合法域名（需人工确认）──────────────────────
echo "── 3. 微信小程序 request 合法域名 ──"

echo "  此项目需要人工登录微信公众平台确认："
echo "  1. 打开 https://mp.weixin.qq.com"
echo "  2. 进入 开发管理 → 开发设置 → 服务器域名"
echo "  3. 确认 request 合法域名中包含: https://yanzhidao.com"
echo ""

# 验证 HTTPS 证书是否正常
HTTPS_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "https://yanzhidao.com/api/health" 2>/dev/null || echo "000")
if [ "$HTTPS_CHECK" = "200" ]; then
  pass "https://yanzhidao.com/api/health 可公网访问（SSL 正常）"
else
  warn "https://yanzhidao.com/api/health 返回 ${HTTPS_CHECK}（检查 SSL 证书 / Nginx / 防火墙）"
fi

echo ""

# ── 4. 聚合脚本可用性 ──────────────────────────────────────
echo "── 4. 检查聚合脚本 ──"

AGGREGATE_SCRIPT="$PROJECT_ROOT/analytics/scripts/aggregate-jsonl.mjs"
OUTPUT_FILE="$PROJECT_ROOT/analytics/reports/latest-summary.json"

if [ -f "$AGGREGATE_SCRIPT" ]; then
  pass "聚合脚本存在: $AGGREGATE_SCRIPT"
else
  fail "聚合脚本不存在: $AGGREGATE_SCRIPT"
fi

# 检查 Node 版本
NODE_VERSION=$(node -v 2>/dev/null || echo "not found")
echo "  Node 版本: $NODE_VERSION"
if command -v node > /dev/null 2>&1; then
  pass "Node.js 已安装"
else
  fail "Node.js 未安装"
fi

# 测试运行聚合
if [ -f "$AGGREGATE_SCRIPT" ] && command -v node > /dev/null 2>&1; then
  if [ -f "$EVENTS_FILE" ] && [ -s "$EVENTS_FILE" ]; then
    AGG_OUTPUT=$(node "$AGGREGATE_SCRIPT" \
      --events "$EVENTS_FILE" \
      --leads "$RUNTIME_DIR/miniapp-leads.jsonl" \
      --output "$OUTPUT_FILE" \
      --env production 2>&1) || true
    if echo "$AGG_OUTPUT" | grep -q '"ok":true'; then
      pass "聚合脚本执行成功 → $OUTPUT_FILE"
      # 显示摘要
      TOTALS=$(echo "$AGG_OUTPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'events={d[\"totals\"][\"events\"]}, leads={d[\"totals\"][\"leads\"]}, pv={d[\"totals\"][\"pv\"]}, uv={d[\"totals\"][\"uv\"]}, sessions={d[\"totals\"][\"sessions\"]}')" 2>/dev/null || echo "")
      if [ -n "$TOTALS" ]; then
        echo "  统计: $TOTALS"
      fi
    else
      warn "聚合脚本执行输出: $(echo "$AGG_OUTPUT" | tail -3)"
    fi
  else
    warn "没有事件数据源，跳过聚合测试"
  fi
fi

echo ""

# ── 5. Nginx 反向代理 + Basic Auth ─────────────────────────
echo "── 5. 检查 Nginx 反向代理 /analytics/ ──"

# 5a. Nginx 是否运行
if command -v nginx > /dev/null 2>&1; then
  if pgrep nginx > /dev/null 2>&1; then
    pass "Nginx 正在运行"
  else
    warn "Nginx 已安装但未运行"
  fi
else
  warn "Nginx 未安装"
fi

# 5b. 检查 /analytics/ 代理
if command -v nginx > /dev/null 2>&1; then
  ANALYTICS_PROXY=$(nginx -T 2>/dev/null | grep -A5 "location /analytics/" | head -10 || echo "")
  if echo "$ANALYTICS_PROXY" | grep -q "proxy_pass.*8010"; then
    pass "Nginx 已配置 /analytics/ → 127.0.0.1:8010"
    echo "$ANALYTICS_PROXY" | sed 's/^/  /'
  elif echo "$ANALYTICS_PROXY" | grep -q "analytics"; then
    warn "Nginx 已配置 /analytics/ 但未确认指向 8010 端口"
    echo "$ANALYTICS_PROXY" | sed 's/^/  /'
  else
    warn "Nginx 未检测到 /analytics/ location 配置"
  fi
fi

# 5c. HTTPS 访问 Basic Auth 验证
echo ""
echo "  测试 Basic Auth（公网 HTTPS）:"
AUTH_NO_CRED=$(curl -s -o /dev/null -w "%{http_code}" "https://yanzhidao.com/analytics/user-behavior-dashboard.html" 2>/dev/null || echo "000")
AUTH_WITH_CRED=$(curl -s -o /dev/null -w "%{http_code}" -u "${ANALYTICS_AUTH_USER:-analytics_admin}:${ANALYTICS_AUTH_PASSWORD:-yanzhidao-dashboard}" "https://yanzhidao.com/analytics/user-behavior-dashboard.html" 2>/dev/null || echo "000")

case "$AUTH_NO_CRED" in
  401)
    pass "无凭据访问 /analytics/ 正确返回 401（已受保护）"
    ;;
  200)
    fail "无凭据访问 /analytics/ 返回 200（看板裸露！需要配置 Basic Auth）"
    ;;
  503)
    warn "无凭据访问 /analytics/ 返回 503（可能 Auth 环境变量未配置）"
    ;;
  000)
    warn "无法连接到 https://yanzhidao.com（检查 DNS / 防火墙 / Nginx）"
    ;;
  *)
    warn "无凭据访问 /analytics/ 返回 ${AUTH_NO_CRED}（非预期的 401）"
    ;;
esac

case "$AUTH_WITH_CRED" in
  200)
    pass "带凭据访问 /analytics/ 正确返回 200"
    ;;
  401)
    warn "带凭据访问 /analytics/ 返回 401（口令可能不匹配，检查 ANALYTICS_AUTH_USER/PASSWORD）"
    ;;
  *)
    warn "带凭据访问 /analytics/ 返回 ${AUTH_WITH_CRED}"
    ;;
esac

# 5d. latest-summary.json 同样受保护
SUMMARY_NO_CRED=$(curl -s -o /dev/null -w "%{http_code}" "https://yanzhidao.com/analytics/latest-summary.json" 2>/dev/null || echo "000")
if [ "$SUMMARY_NO_CRED" = "401" ]; then
  pass "latest-summary.json 同样受 Basic Auth 保护 (401)"
else
  warn "latest-summary.json 未受保护 (返回 ${SUMMARY_NO_CRED})，存在数据泄露风险"
fi

echo ""
echo "============================================"
echo "  验证结果汇总"
echo "============================================"
echo -e "  ${GREEN}PASS: ${PASS}${NC}"
echo -e "  ${YELLOW}WARN: ${WARN}${NC}"
echo -e "  ${RED}FAIL: ${FAIL}${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "存在 FAIL 项，请检查后重新验证。"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo "所有关键项通过，有 ${WARN} 项需人工确认。"
  exit 0
else
  echo "全部通过！"
  exit 0
fi
