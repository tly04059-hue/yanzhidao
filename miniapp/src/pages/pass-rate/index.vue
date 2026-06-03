<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">过考率说明</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="brand-row">已服务 1,000+ 川渝同学 · 不骗人 · 真服务</view>

      <view class="hero-card">
        <text class="kicker-cn">数据真实可信</text>
        <text class="hero-title">这 4 个过考率，是怎么算出来的</text>
        <text class="hero-copy">公布数据来自研知道辅导同学和上岸情况的实际统计。有关数据信息经过脱敏后计算得出。</text>
      </view>

      <!-- §1 4个数 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">4 个数 · 分子分母都列清楚</text>
          <text class="section-head-meta">权威口径</text>
        </view>
        <view class="result-grid">
          <view class="result-card" v-for="item in rates" :key="item.title">
            <text class="result-card-title">{{ item.title }}</text>
            <text class="result-card-item" v-for="li in item.items" :key="li.text">
              <text v-if="li.label" class="text-bold">{{ li.label }}</text>
              <text v-if="li.label">：</text>{{ li.text }}
            </text>
          </view>
        </view>
      </view>

      <!-- §2 历年趋势 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">四川党校辅导过考率 · 历年趋势</text>
          <text class="section-head-meta">3 年可对照</text>
        </view>
        <view class="list-card">
          <view class="list-item">
            <text class="list-item-label">2023 年辅导上岸率</text>
            <text class="text-accent">26.7%</text>
          </view>
          <view class="list-item">
            <text class="list-item-label">2024 年辅导上岸率</text>
            <text class="text-accent">39.6%</text>
          </view>
          <view class="list-item">
            <text class="list-item-label">2025 年辅导上岸率</text>
            <text class="text-accent">40.4%</text>
          </view>
        </view>
        <text class="note-after">2025 年招生人数从1,200人缩小到 600人，按成绩排名录取规则下，人数缩小意味着上岸成绩要求提升，上岸难度相比往年有提升。</text>
      </view>

      <!-- §3 市场自然过考率 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">市场自然过考率对照</text>
          <text class="section-head-meta">不是辅导口径</text>
        </view>
        <view class="list-card">
          <view class="list-item">
            <text class="list-item-label">四川党校自然过考率</text>
            <text class="text-accent">约 9.8%</text>
          </view>
          <view class="list-item">
            <text class="list-item-label">重庆党校自然过考率</text>
            <text class="text-accent">约 13.5%</text>
          </view>
          <view class="list-item">
            <text class="list-item-label">管综初试 + 复试综合过考率</text>
            <text class="text-accent">约 20%</text>
          </view>
        </view>
        <text class="note-after">以上的辅导过考率指的是研知道辅导班口径；3个自然过考率是全体考生整体过考率。其中管综是综合过考率，因具体院校、是否调剂等差异较大，20%为综合乐观评估数据，非具体院校准确数值。</text>
      </view>

      <!-- §4 数据参考价值 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">数据参考价值</text>
        </view>
        <view class="note-card">
          <text class="note-card-text">计算过考率数据来自研知道辅导班上岸情况统计，仅为研知道一家之言，请谨慎参考。</text>
          <text class="note-card-text" style="margin-top: 12px;">数据可追溯：</text>
          <text class="note-card-text">· 报名期（年份 + 院校 + 专业）{{'\n'}}· 具体考试（初试 / 复试 / 调剂阶段）{{'\n'}}· 具体上岸名单（数据信息已脱敏）</text>
        </view>
      </view>

      <!-- §5 更新机制 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">更新机制</text>
        </view>
        <view class="note-card">
          <text class="note-card-text">每年考试录取结束后 3 个月内更新当年数据，历年数据保留可对照。{{'\n'}}当前数据更新于 <text class="text-bold">2026-05</text>。</text>
        </view>
      </view>

      <view class="btn-primary" @click="goPage('learn')">看看在职考研的政策和选择</view>
      <view class="btn-row-2">
        <view class="btn-secondary" @click="goPage('schools')">看 院 校 库</view>
        <view class="btn-secondary" @click="goPage('estimate')">估 算 分 数</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { trackPageView, trackNavClick } from '@/api/tracking'

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const goPage = (key: string) => {
  trackNavClick('pass-rate', key)
  const map: Record<string, string> = {
    schools: '/pages/schools/index',
    cases: '/pages/cases/index',
    estimate: '/pages/estimate/index',
  }
  if (key === 'learn') uni.switchTab({ url: '/pages/learn/index' })
  else if (map[key]) uni.navigateTo({ url: map[key] })
}

type RateItem = { label?: string; text: string }

const rates: { title: string; items: RateItem[] }[] = [
  {
    title: '四川党校在职研 · 40.4%',
    items: [
      { label: '统计范围', text: '研知道 2025 年辅导学员' },
      { label: '计算', text: '辅导学员中过线人数 ÷ 辅导学员参考总人数' },
      { text: '四川同年招生600人，完成报名约9300余人' },
    ],
  },
  {
    title: '重庆党校在职研 · 44%',
    items: [
      { label: '统计范围', text: '研知道 2025 年辅导学员' },
      { label: '计算', text: '辅导学员中过线人数 ÷ 辅导学员总人数' },
      { text: '重庆同年招生900人，实际报名约6600余人' },
    ],
  },
  {
    title: '统考非全管综初试 · 55.6%',
    items: [
      { label: '统计范围', text: '研知道2026年辅导初试学员' },
      { label: '计算', text: '初试进复试人数 ÷ 管综初试辅导总人数' },
      { text: '进复试人数中含调剂进复试的同学' },
    ],
  },
  {
    title: '统考非全管综复试 · 87.5%',
    items: [
      { label: '统计范围', text: '研知道2026年辅导复试学员' },
      { label: '计算', text: '复试上岸人数 ÷ 管综复试辅导人数' },
      { text: '含单招的复试辅导同学，含调剂上岸的同学' },
      { text: '若初试是研知道辅导的同学，26复试通过率是100%' },
    ],
  },
]

onMounted(() => trackPageView('pass-rate'))
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";
.shell { background: #FAF7F2; min-height: 100vh; }
</style>
