<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">院校数据预览</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="hero-card">
        <text class="preview-kicker">school-data.ts</text>
        <text class="preview-title">院校库聚合数据</text>
        <text class="preview-copy">
          当前读取 199exam 与党校发布层，列表预览按“学校 + 项目类型”聚合，当前共 {{ schools.length }} 条。
        </text>
      </view>

      <view class="stats-grid">
        <view class="stat-card">
          <text class="stat-label">MPA</text>
          <text class="stat-value">{{ typeCounts.MPA || 0 }}</text>
        </view>
        <view class="stat-card">
          <text class="stat-label">MBA</text>
          <text class="stat-value">{{ typeCounts.MBA || 0 }}</text>
        </view>
        <view class="stat-card">
          <text class="stat-label">MEM</text>
          <text class="stat-value">{{ typeCounts.MEM || 0 }}</text>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">地区分布</text>
        <view class="chip-wrap">
          <text v-for="item in provinceSummary" :key="item.label" class="chip">{{ item.label }} {{ item.count }}</text>
        </view>
      </view>

      <view class="section-card">
        <view class="section-head-row">
          <text class="section-title">院校样本</text>
          <text class="section-sub">当前预览前 {{ previewSchools.length }} 条</text>
        </view>

        <view v-for="item in previewSchools" :key="item.id" class="data-card">
          <view class="school-row">
            <image class="school-logo" :src="item.logoUrl" mode="aspectFit" />
            <view class="school-main">
              <view class="data-card-head">
                <text class="data-card-title">{{ item.name }}</text>
                <text class="data-card-badge">{{ item.levelText === '双非' ? '普通' : item.levelText }}</text>
              </view>
              <text class="data-card-line">{{ item.province }} · {{ item.city }} · {{ item.type }}</text>
              <text class="data-card-line">学费 {{ item.tuition }} · 学制 {{ item.duration }} · 招生 {{ item.enrollment }}</text>
              <text class="data-card-line">学习方式 {{ item.studyMode }}</text>
              <text class="data-card-line" v-if="item.latestScore">最近分数 {{ item.latestScore }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { getAllSchools } from '@/data/school-data'

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const schools = getAllSchools()
const previewSchools = schools.slice(0, 20)

const typeCounts = schools.reduce<Record<string, number>>((acc, item) => {
  acc[item.type] = (acc[item.type] || 0) + 1
  return acc
}, {})

const provinceCounts = schools.reduce<Record<string, number>>((acc, item) => {
  acc[item.province] = (acc[item.province] || 0) + 1
  return acc
}, {})

const provinceSummary = Object.entries(provinceCounts).map(([label, count]) => ({ label, count }))
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

.data-card {
  border-radius: 16px;
  padding: 14px;
}

.data-card + .data-card {
  margin-top: 12px;
}

.school-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.school-logo {
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  border-radius: 14px;
  background: #fff;
}

.school-main {
  flex: 1;
  min-width: 0;
}

.data-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.data-card-title {
  flex: 1;
  font-size: 16px;
  line-height: 1.45;
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
</style>
