<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">使用说明</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="hero">
        <text class="kicker">怎么用</text>
        <text class="hero-h1">在职考研</text>
        <text class="hero-h1" style="margin-top: -4px;">3 种状态 · 3 类信息</text>
      </view>

      <view class="entry-card" @click="goTab('learn')">
        <text class="entry-card-lbl">1. 我还不够坚定，先了解</text>
        <text class="entry-card-desc">· 从「了解」进入{{'\n'}}· 按系统 / 目标 / 学历 / 年龄四个维度看政策和案例{{'\n'}}· 看清学历对你的真实作用再决定</text>
        <text class="entry-card-arrow">点这里，进入了解 ›</text>
      </view>

      <view class="entry-card" @click="goTab('test')">
        <text class="entry-card-lbl">2. 我想知道适合考什么</text>
        <text class="entry-card-desc">· 从「测一测」进入{{'\n'}}· 8道题 · 3-5 分钟{{'\n'}}· 得到党校在职研究生 vs 统考非全研究生的个性化建议</text>
        <text class="entry-card-arrow">点这里，开始测一测 ›</text>
      </view>

      <view class="entry-card" @click="goPage('prep')">
        <text class="entry-card-lbl">3. 我要行动！尽快拿到学历</text>
        <text class="entry-card-desc">· 从「看备考时间节奏」入口进入{{'\n'}}· 选路径，党校在职研究生 or 统考非全研究生{{'\n'}}· 看具体院校 + 备考时间 + 报名节奏</text>
        <text class="entry-card-arrow">点这里，看备考时间节奏 ›</text>
      </view>

      <view class="btn-primary" @click="goPage('wechat')">加企微 1 对 1 咨询</view>
      <view class="btn-secondary" @click="goHome">先回首页</view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { trackPageView, trackNavClick, trackTabClick } from '@/api/tracking'
import { usePageShare } from '@/utils/share'

usePageShare({
  title: '研知道小程序使用说明',
  path: '/pages/usage/index'
})

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const goHome = () => uni.switchTab({ url: '/pages/index/index' })

const goTab = (tab: string) => {
  const tabMap: Record<string, string> = {
    learn: '/pages/learn/index',
    test: '/pages/test/index',
  }
  trackTabClick('usage', tab, tabMap[tab] || '')
  uni.switchTab({ url: tabMap[tab] || '/pages/index/index' })
}

const goPage = (key: string) => {
  trackNavClick('usage', key)
  const map: Record<string, string> = {
    prep: '/pages/prep/index',
    wechat: '/pages/contact/index',
  }
  if (map[key]) uni.navigateTo({ url: map[key] })
}

onMounted(() => trackPageView('usage'))
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";
.shell { background: #FAF7F2; min-height: 100vh; }

</style>
