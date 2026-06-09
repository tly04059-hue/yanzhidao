#!/usr/bin/env bash
#
# 配置定时聚合任务
# 在服务器上执行：bash schooltool/scripts/crontab-setup.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

CRON_MARKER="# yanzhidao-analytics-aggregate"
AGGREGATE_CMD="cd $PROJECT_ROOT && node analytics/scripts/aggregate-jsonl.mjs --events schooltool/data/runtime/miniapp-events.jsonl --leads schooltool/data/runtime/miniapp-leads.jsonl --output analytics/reports/latest-summary.json --env production >> /tmp/yanzhidao-aggregate.log 2>&1"

echo "============================================"
echo "  配置 analytics 定时聚合"
echo "============================================"
echo ""
echo "项目根目录: $PROJECT_ROOT"
echo "聚合命令:"
echo "  $AGGREGATE_CMD"
echo ""

# 检查是否已存在
EXISTING=$(crontab -l 2>/dev/null | grep "$CRON_MARKER" || true)

if [ -n "$EXISTING" ]; then
  echo "已存在定时任务:"
  echo "$EXISTING"
  echo ""
  read -p "是否替换现有任务? (y/N): " CONFIRM
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "已取消。"
    exit 0
  fi
  # 删除旧任务
  crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | crontab -
  echo "已删除旧任务。"
fi

echo "选择执行频率:"
echo "  1) 每 30 分钟"
echo "  2) 每小时"
echo "  3) 每 2 小时"
echo "  4) 每天 0 点和 12 点"
echo "  5) 自定义"
echo ""
read -p "请选择 (1-5, 默认 2): " CHOICE

case "${CHOICE:-2}" in
  1) SCHEDULE="*/30 * * * *" ;;
  2) SCHEDULE="0 * * * *" ;;
  3) SCHEDULE="0 */2 * * *" ;;
  4) SCHEDULE="0 0,12 * * *" ;;
  5)
    read -p "请输入 cron 表达式: " SCHEDULE
    ;;
  *) SCHEDULE="0 * * * *" ;;
esac

CRON_LINE="$SCHEDULE $AGGREGATE_CMD $CRON_MARKER"

# 追加到 crontab
(crontab -l 2>/dev/null || true; echo "$CRON_LINE") | crontab -

echo ""
echo "已添加定时任务:"
echo "  $CRON_LINE"
echo ""

# 立即手动执行一次
read -p "是否立即执行一次聚合? (Y/n): " RUN_NOW
if [ "$RUN_NOW" != "n" ] && [ "$RUN_NOW" != "N" ]; then
  echo "执行中..."
  cd "$PROJECT_ROOT"
  node analytics/scripts/aggregate-jsonl.mjs \
    --events schooltool/data/runtime/miniapp-events.jsonl \
    --leads schooltool/data/runtime/miniapp-leads.jsonl \
    --output analytics/reports/latest-summary.json \
    --env production
  echo ""
  echo "聚合完成！"
fi

echo ""
echo "查看当前定时任务:  crontab -l"
echo "查看执行日志:      tail -f /tmp/yanzhidao-aggregate.log"
echo "手动执行一次:      cd $PROJECT_ROOT && node analytics/scripts/aggregate-jsonl.mjs --events schooltool/data/runtime/miniapp-events.jsonl --leads schooltool/data/runtime/miniapp-leads.jsonl --output analytics/reports/latest-summary.json --env production"
