<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">案例数据预览</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="hero-card">
        <text class="preview-kicker">cases-v2-public.json</text>
        <text class="preview-title">案例 V2 公开展示层数据</text>
        <text class="preview-copy">
          当前公开案例 {{ casesV2Stats.total }} 条 · 党校 {{ casesV2Stats.party }} 条 · 管综 {{ casesV2Stats.managementExam }} 条
        </text>
      </view>

      <view class="stats-grid">
        <view class="stat-card">
          <text class="stat-label">系统</text>
          <text class="stat-value">{{ filters.systems.length }}</text>
        </view>
        <view class="stat-card">
          <text class="stat-label">项目类型</text>
          <text class="stat-value">{{ filters.program_types.length }}</text>
        </view>
        <view class="stat-card">
          <text class="stat-label">质量等级</text>
          <text class="stat-value">{{ filters.positions.length }}</text>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">筛选维度</text>
        <view class="chip-wrap">
          <text v-for="item in filters.systems" :key="`sys-${item}`" class="chip chip-accent">{{ item }}</text>
          <text v-for="item in filters.program_types" :key="`program-${item}`" class="chip">{{ item }}</text>
        </view>
      </view>

      <view class="section-card">
        <view class="section-head-row">
          <text class="section-title">案例样本</text>
          <text class="section-sub">当前预览前 {{ previewCases.length }} 条</text>
        </view>

        <view v-for="item in previewCases" :key="item.id" class="data-card">
          <view class="data-card-head">
            <text class="data-card-title">{{ item.displayAlias }} · {{ item.ageLabel }}</text>
            <text class="data-card-badge">{{ item.pathLabel }}</text>
          </view>
          <text class="data-card-line">{{ [item.regionLabel, item.systemLabel, item.programLabel].filter(Boolean).join(' · ') }}</text>
          <text class="data-card-line"><text class="label">目标：</text>{{ item.chosenTarget }}</text>
          <text v-if="shouldShowIntentSchool(item)" class="data-card-line"><text class="label">意向院校：</text>{{ item.intentSchool }}</text>
          <text v-if="item.admittedSchool" class="data-card-line"><text class="label">上岸院校：</text>{{ item.admittedSchool }}</text>
          <text v-if="item.baseline" class="data-card-line"><text class="label">基础：</text>{{ item.baseline }}</text>
          <text v-if="item.score" class="data-card-line"><text class="label">成绩：</text>{{ item.score }}</text>
          <text v-if="item.studyTime" class="data-card-line"><text class="label">时间：</text>{{ item.studyTime }}</text>
          <text class="data-card-line"><text class="label">结果：</text>{{ item.outcomeLabel }}</text>
          <text v-if="item.cardQuote" class="data-card-line"><text class="label">报考动机：</text>{{ item.cardQuote }}</text>
          <text v-if="item.reflection" class="data-card-line"><text class="label">真实反馈：</text>{{ item.reflection }}</text>
          <text v-if="item.studyMethod" class="data-card-line"><text class="label">备考方法：</text>{{ item.studyMethod }}</text>
          <text v-if="item.examExperience" class="data-card-line"><text class="label">备考经验：</text>{{ item.examExperience }}</text>
          <view v-if="item.tags.length" class="chip-wrap chip-wrap-tight">
            <text v-for="tag in item.tags.slice(0, 8)" :key="`${item.id}-${tag}`" class="chip">{{ tag }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { casesV2, casesV2Stats, type CaseV2 } from '@/data/cases-v2'

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)))
const normalizedSchoolName = (value: string) =>
  value.replace(/\s+/g, '').replace(/·/g, '').trim()

const shouldShowIntentSchool = (item: CaseV2) =>
  Boolean(item.intentSchool)
  && (!item.admittedSchool || normalizedSchoolName(item.intentSchool) !== normalizedSchoolName(item.admittedSchool))

const filters = {
  systems: unique(casesV2.map(item => item.systemLabel)),
  program_types: unique(casesV2.map(item => item.pathLabel || item.programLabel)),
  positions: unique(casesV2.map(item => item.quality))
}
const previewCases = casesV2.slice(0, 12)
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

.label {
  color: $text-1;
  font-weight: 600;
}
</style>
