<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">党校备考方案</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="brand-row">已服务 1,000+ 川渝同学 · 不骗人 · 真服务</view>

      <view class="hero-card">
        <text class="kicker-cn">党校在职研究生 · 备考</text>
        <text class="hero-title">党校备考 + 可选专业</text>
        <text class="hero-copy">川渝党校是两套独立体系：先考虑报哪个，再选具体专业。根据基础不同，备考累计时长建议 100-150 小时。</text>
      </view>

      <!-- §1 关键门槛对比 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">关键门槛对比</text>
          <text class="section-head-meta">先看你能报哪个</text>
        </view>
        <view class="compare-table">
          <view class="compare-table-head">
            <text class="compare-table-th" style="flex: 0 0 76px; max-width: 76px;">维度</text>
            <text class="compare-table-th">四川党校</text>
            <text class="compare-table-th">重庆党校</text>
          </view>
          <view class="compare-table-row" v-for="row in thresholdRows" :key="row.dim">
            <text class="compare-table-td" style="flex: 0 0 76px; max-width: 76px; color: #6B6258; font-weight: 500;">{{ row.dim }}</text>
            <text class="compare-table-td"
              :style="row.sc_bold ? 'font-weight: 600; color: #2A251E;' : row.sc_accent ? 'font-weight: 600; color: #CF7140;' : ''">{{ row.sc }}</text>
            <text class="compare-table-td"
              :style="row.cq_bold ? 'font-weight: 600; color: #2A251E;' : row.cq_accent ? 'font-weight: 600; color: #CF7140;' : ''">{{ row.cq }}</text>
          </view>
        </view>
        <text class="note-after">党员要求是第一道分水岭 — 非党员只能走重庆党校或转统考非全。</text>
      </view>

      <!-- §2 考试时间线 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">2026 年考试时间线</text>
        </view>
        <view class="list-card">
          <view class="list-item">
            <text class="list-item-label">3 月</text>
            <text class="list-item-val">报名</text>
          </view>
          <view class="list-item">
            <text class="list-item-label">5-6 月</text>
            <text class="list-item-val">考试</text>
          </view>
        </view>
      </view>

      <!-- §3 考试及授课形式 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">考试及授课形式</text>
          <text class="section-head-meta">笔试 / 无复试 + 集中授课</text>
        </view>
        <view class="note-card">
          <text class="note-card-text">· 笔试满分 300 分，按排名录取，主观题为主{{'\n'}}· 科目：政治理论 + 专业课</text>
        </view>
        <view class="result-grid" style="margin-top: 12px;">
          <view class="result-card">
            <text class="result-card-title">四川党校授课形式</text>
            <text class="result-card-item">每年 <text class="text-bold">4 次 × 每次5天住校（含周末）</text>，集中在 1 / 2 / 7 / 8 月（寒暑假期）</text>
            <text class="result-card-item">住校期间脱离工作，整段时间投入</text>
            <text class="result-card-item">上课地点：成都市青羊区光华村街</text>
          </view>
          <view class="result-card">
            <text class="result-card-title">重庆党校授课形式</text>
            <text class="result-card-item">每月 <text class="text-bold">1 次 × 3 天通勤线下授课（含周末）</text>，全年滚动</text>
            <text class="result-card-item">不脱产 — 对在职友好</text>
            <text class="result-card-item">上课地点：重庆市九龙坡区渝州路</text>
            <text class="result-card-item">上课时间是周五到周日</text>
          </view>
        </view>
      </view>

      <!-- §4 专业选择 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">川渝党校专业选择</text>
          <text class="section-head-meta">按系统对口选</text>
        </view>
        <view class="result-grid">
          <view class="result-card">
            <text class="result-card-title">四川党校</text>
            <text class="result-card-item"><text class="text-bold">政治学</text>（招生 300 人）· 党政机关综合岗，最广覆盖</text>
            <text class="result-card-item"><text class="text-bold">经济学</text>（招生 200 人）· 财政 / 金融 / 产业经济对口</text>
            <text class="result-card-item"><text class="text-bold">法学</text>（招生 100 人）· 纪检 / 法务 / 合规 · 比较难考</text>
          </view>
          <view class="result-card">
            <text class="result-card-title">重庆党校</text>
            <text class="result-card-item"><text class="text-bold">经济管理</text>（招生 200 人）· 财政 / 金融 / 产业经济</text>
            <text class="result-card-item"><text class="text-bold">法律</text>（招生 200 人）· 纪检 / 法务 / 合规</text>
            <text class="result-card-item"><text class="text-bold">公共管理</text>（招生 170 人）· 民政 / 人社 / 应急 / 街道</text>
            <text class="result-card-item"><text class="text-bold">党政管理</text>（招生 170 人）· 组织 / 宣传 / 纪委 / 统战</text>
            <text class="result-card-item"><text class="text-bold">战略管理</text>（招生 160 人）· 发改 / 政研 / 外事 / 国企战略</text>
          </view>
        </view>
        <text class="note-after">以上数据取自2026年招生简章。</text>
      </view>

      <view class="btn-primary" @click="goPage('wechat')">1对1沟通更多细节</view>
      <view class="btn-secondary" @click="goPage('wechat')">进 备 考 群</view>
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
  trackNavClick('prep-dx', key)
  if (key === 'wechat') uni.navigateTo({ url: '/pages/contact/index' })
}

const thresholdRows = [
  { dim: '党员要求', sc: '必须党员 / 预备党员', cq: '不限', sc_bold: true, cq_bold: false, cq_accent: false, sc_accent: false },
  { dim: '工作年限', sc: '≥ 3 年', cq: '≥ 2 年', sc_bold: true, cq_bold: true, cq_accent: false, sc_accent: false },
  { dim: '25年自然过考率', sc: '8.9%', cq: '13.5%', sc_bold: false, cq_bold: false, cq_accent: false, sc_accent: false },
  { dim: '25年辅导过考率', sc: '40.4%', cq: '44%', sc_bold: false, cq_bold: false, sc_accent: true, cq_accent: true },
]

onMounted(() => trackPageView('prep-dx'))
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";
.shell { background: #FAF7F2; min-height: 100vh; }
</style>
