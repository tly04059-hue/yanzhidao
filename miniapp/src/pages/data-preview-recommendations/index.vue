<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">推荐方案数据预览</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="hero-card">
        <text class="preview-kicker">recommendation-strategies-publish.json</text>
        <text class="preview-title">推荐方案库发布层数据</text>
        <text class="preview-copy">
          生成时间 {{ metadata.generated_at }} · 版本 {{ metadata.version }} · 策略 {{ metadata.strategy_count }} 条
        </text>
        <text class="preview-copy">{{ metadata.display_note }}</text>
      </view>

      <view class="section-card">
        <text class="section-title">匹配输入字段</text>
        <view class="chip-wrap">
          <text v-for="item in metadata.match_inputs || []" :key="item" class="chip chip-accent">{{ item }}</text>
        </view>
      </view>

      <view class="stats-grid">
        <view class="stat-card">
          <text class="stat-label">党校</text>
          <text class="stat-value">{{ programCounts['党校'] || 0 }}</text>
        </view>
        <view class="stat-card">
          <text class="stat-label">MPA</text>
          <text class="stat-value">{{ programCounts['MPA'] || 0 }}</text>
        </view>
        <view class="stat-card">
          <text class="stat-label">MBA/MEM</text>
          <text class="stat-value">{{ (programCounts['MBA'] || 0) + (programCounts['MEM'] || 0) }}</text>
        </view>
      </view>

      <view class="section-card">
        <view class="section-head-row">
          <text class="section-title">策略样本</text>
          <text class="section-sub">当前共 {{ strategies.length }} 条</text>
        </view>

        <view v-for="item in strategies" :key="item.strategy_id" class="data-card">
          <view class="data-card-head">
            <text class="data-card-title">{{ item.primary_path }}</text>
            <text class="data-card-badge">{{ item.program_type }}</text>
          </view>
          <text class="data-card-line"><text class="label">strategy_id：</text>{{ item.strategy_id }}</text>
          <text class="data-card-line"><text class="label">priority：</text>{{ item.priority }} · {{ item.status }}</text>
          <text class="data-card-line"><text class="label">reason：</text>{{ item.reason }}</text>
          <text class="data-card-line"><text class="label">school_query：</text>{{ formatSchoolQuery(item.school_query) }}</text>

          <view v-if="item.match" class="sub-block">
            <text class="sub-title">match 条件</text>
            <view class="chip-wrap chip-wrap-tight">
              <text v-for="token in formatMatchTokens(item.match)" :key="`${item.strategy_id}-${token}`" class="chip">{{ token }}</text>
            </view>
          </view>

          <view v-if="item.school_priorities?.length" class="sub-block">
            <text class="sub-title">院校筛选重点</text>
            <text v-for="line in item.school_priorities" :key="line" class="data-card-line">· {{ line }}</text>
          </view>

          <view v-if="item.risk_cards?.length" class="sub-block">
            <text class="sub-title">风险提示</text>
            <text v-for="line in item.risk_cards" :key="line" class="data-card-line">· {{ line }}</text>
          </view>

          <view v-if="item.weekly_plan?.length" class="sub-block">
            <text class="sub-title">本周计划</text>
            <text v-for="line in item.weekly_plan" :key="line" class="data-card-line">· {{ line }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import payload from '@/data/recommendation-strategies-publish.json'

type StrategyItem = {
  strategy_id: string
  priority: number
  status: string
  primary_path: string
  program_type: string
  reason: string
  match?: Record<string, any>
  school_query?: Record<string, any>
  school_priorities?: string[]
  risk_cards?: string[]
  weekly_plan?: string[]
}

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const metadata = (payload as any).metadata || {}
const strategies = (((payload as any).strategies || []) as StrategyItem[]).slice()

const programCounts = strategies.reduce<Record<string, number>>((acc, item) => {
  acc[item.program_type] = (acc[item.program_type] || 0) + 1
  return acc
}, {})

const formatMatchTokens = (match: Record<string, any>) => {
  const tokens: string[] = []
  Object.entries(match || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) tokens.push(`${key}: ${value.join(' / ')}`)
    else tokens.push(`${key}: ${value}`)
  })
  return tokens
}

const formatSchoolQuery = (query?: Record<string, any>) => {
  if (!query) return '无'
  return Object.entries(query).map(([key, value]) => `${key}=${value}`).join(' · ')
}
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell {
  min-height: 100vh;
  background: $bg;
}

.preview-kicker {
  display: block;
  font-size: 11px;
  color: $accent;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}

.preview-title {
  display: block;
  @include serif;
  font-size: 26px;
  line-height: 1.35;
  color: $text-1;
  margin-bottom: 8px;
}

.preview-copy {
  display: block;
  font-size: 13px;
  line-height: 1.75;
  color: $text-2;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.stat-card,
.section-card,
.data-card {
  background: $card;
  border: 0.5px solid $border;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
}

.stat-card {
  border-radius: 16px;
  padding: 14px 12px;
}

.stat-label,
.section-sub {
  display: block;
  font-size: 12px;
  color: $text-3;
}

.stat-value {
  display: block;
  margin-top: 8px;
  font-size: 24px;
  line-height: 1.1;
  color: $accent;
  font-weight: 600;
}

.section-card {
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-head-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.section-title {
  @include serif;
  font-size: 20px;
  line-height: 1.4;
  color: $text-1;
}

.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-wrap-tight {
  margin-top: 10px;
}

.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: #fff;
  border: 0.5px solid $border;
  font-size: 12px;
  color: $text-2;
}

.chip-accent {
  background: $accent-soft;
  color: $accent;
  border-color: transparent;
}

.data-card {
  border-radius: 16px;
  padding: 14px;
}

.data-card + .data-card {
  margin-top: 12px;
}

.data-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.data-card-title {
  flex: 1;
  font-size: 16px;
  line-height: 1.5;
  font-weight: 700;
  color: $text-1;
}

.data-card-badge {
  flex: 0 0 auto;
  padding: 4px 10px;
  border-radius: 999px;
  background: $accent-soft;
  color: $accent;
  font-size: 12px;
  font-weight: 600;
}

.data-card-line {
  display: block;
  font-size: 13px;
  line-height: 1.75;
  color: $text-2;
}

.label,
.sub-title {
  color: $text-1;
  font-weight: 600;
}

.sub-block {
  margin-top: 10px;
}
</style>
