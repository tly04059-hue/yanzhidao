<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">数据来源与说明</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="brand-row">已服务 1,000+ 川渝同学 · 不骗人 · 真服务</view>

      <view class="hero-card">
        <text class="kicker-cn">数据透明</text>
        <text class="hero-title">服务数据可核实</text>
        <text class="hero-copy">研知道公开数据的来源、口径说明。</text>
      </view>

      <!-- 政策依据 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">政策依据</text>
          <text class="section-head-meta">可追溯文件</text>
        </view>
        <view class="list-card">
          <view class="list-item" v-for="item in policyItems" :key="item.label">
            <text class="list-item-label">{{ item.label }}</text>
            <text class="list-item-val">{{ item.val }}</text>
          </view>
        </view>
      </view>

      <!-- 同学画像数据 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">同学画像数据</text>
          <text class="section-head-meta">脱敏到地级市</text>
        </view>
        <view class="note-card">
          <text class="note-card-text">数据来自研知道辅导班服务同学，已服务超过 <text class="text-bold">1,000</text> 名同学。</text>
          <text class="note-card-text" style="margin-top: 12px;">展示数据严格脱敏到地级市层级，不显示区县/单位/个人。</text>
        </view>
      </view>

      <!-- 过考率口径 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">过考率口径</text>
          <text class="section-head-meta">辅导口径</text>
        </view>
        <view class="list-card">
          <view class="list-item" v-for="item in rateItems" :key="item.label">
            <text class="list-item-label">{{ item.label }}</text>
            <text class="text-accent">{{ item.val }}</text>
          </view>
        </view>
        <text class="note-after">过考率 = 辅导过线人数 ÷ 辅导参考人数 · 已排除弃考者 · 包含其他所有进入辅导班学员 · 新一年录取结束后更新。</text>
      </view>

      <!-- 免责声明 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">免责声明</text>
        </view>
        <view class="note-card">
          <text class="note-card-text">小程序的推荐、建议及信息，基于公开政策和学员历史数据，<text class="text-bold">与各地情况有出入的，以所在地评审细则为准，推荐及建议不构成报考承诺。</text>每个人的情况、目标、需求差异较大，请以官方招生信息和实际执行政策为准。</text>
          <text class="note-card-text" style="margin-top: 12px;">对数据、信息有异议，可点击下方反馈，感谢理解。</text>
        </view>
      </view>

      <view class="btn-primary" @click="goPage('wechat')">加企微反馈</view>
      <view class="btn-secondary" @click="goHome">先回首页</view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { trackPageView, trackNavClick } from '@/api/tracking'
import { usePageShare } from '@/utils/share'

usePageShare({
  title: '研知道数据来源与说明',
  path: '/pages/data-source/index'
})

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const goHome = () => uni.switchTab({ url: '/pages/index/index' })
const goPage = (key: string) => {
  trackNavClick('data-source', key)
  if (key === 'wechat') uni.navigateTo({ url: '/pages/contact/index' })
}

const policyItems = [
  { label: '中办职级并行规定', val: '2019' },
  { label: '四川 / 重庆党校招生简章', val: '每年更新' },
  { label: '各省直 / 市直遴选公告', val: '—' },
  { label: '国企改办 7 号文件', val: '2021' },
]

const rateItems = [
  { label: '四川党校 2025 年辅导过考率', val: '40.4%' },
  { label: '重庆党校 2025 年辅导过考率', val: '44%' },
  { label: '管综 2026 届初试辅导上岸', val: '55.6%' },
  { label: '管综 2026 届复试辅导上岸（含调剂）', val: '87.5%' },
]

onMounted(() => trackPageView('data-source'))
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";
.shell { background: #FAF7F2; min-height: 100vh; }
</style>
