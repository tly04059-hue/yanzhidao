<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">管综备考方案</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="brand-row">已服务 1,000+ 川渝同学 · 不骗人 · 真服务</view>

      <view class="hero-card">
        <text class="kicker-cn">统考非全研究生 · 备考</text>
        <text class="hero-title">管综备考 + 可选专业</text>
        <text class="hero-copy">MPA / MBA / MEM 专业不同但初试完全一样，根据目标和基础不同，备考累计时长建议300-400个小时。</text>
      </view>

      <!-- §1 考试时间线 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">非全统考时间线</text>
        </view>
        <view class="list-card">
          <view class="list-item">
            <text class="list-item-label">10 月</text>
            <text class="list-item-val">网上报名</text>
          </view>
          <view class="list-item">
            <text class="list-item-label">12 月</text>
            <text class="list-item-val">联考（管综 + 英二）</text>
          </view>
          <view class="list-item">
            <text class="list-item-label">次年 3-4 月</text>
            <text class="list-item-val">复试</text>
          </view>
        </view>
      </view>

      <!-- §2 考试科目 + 目标分数 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">考试总分 300 分 · 两个科目</text>
        </view>
        <view class="note-card">
          <text class="note-card-text">· <text class="text-bold">管理类综合</text>（总分 200 分：数学 + 逻辑 + 写作）{{'\n'}}· <text class="text-bold">英语二</text>（总分 100 分 · 底线要求 34 分）</text>
        </view>

        <view class="section-head" style="margin-top: 16px;">
          <text class="section-head-title">目标分数</text>
          <text class="section-head-meta">因校而异</text>
        </view>
        <view class="note-card">
          <text class="note-card-text">根据院校、专业不同：{{'\n'}}· 所服务同学多数上岸总分范围：<text class="text-accent">160-200</text>{{'\n'}}· 党校 MPA / 清北等 TOP 院校上岸分数：<text class="text-accent">210-230</text></text>
        </view>
      </view>

      <!-- §3 A/B区分数线说明 -->
      <view class="section">
        <view class="alert-card">
          <text class="alert-kicker">📍 A 区 vs B 区分数线</text>
          <text class="alert-text">教育部按地域划分录取分数线 A/B 两个区。<text class="text-bold">川渝属于 A 区</text>（高分数线区），<text class="text-bold">云贵属于 B 区</text>（低分数线区，比 A 区低 10 分）。对踩A区线的考生，B区院校是重要退路，川渝院校属于A区。因此择校策略中需要结合读研目标、得分预期、学费预算、在职读研可实操性等综合填报志愿。</text>
        </view>
      </view>

      <!-- §4 选你的专业 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">选你的专业</text>
          <text class="section-head-meta">结合岗位和课程特色选择</text>
        </view>
        <view class="result-grid">
          <view class="result-card">
            <text class="result-card-title">MPA · 公共管理硕士</text>
            <text class="result-card-item"><text class="text-bold">适合</text>：体制内人群（公务员 / 事业单位 / 参公），遴选 / 调任 / 职称等需求</text>
            <text class="result-card-item"><text class="text-bold">院校</text>：重大 9.6 万 / 西南交大 8.4 万 / 重庆党校 MPA 2.4 万</text>
          </view>
          <view class="result-card">
            <text class="result-card-title">MBA · 工商管理硕士</text>
            <text class="result-card-item"><text class="text-bold">适合</text>：企业 / 国央企管理岗经营岗，面向市场化竞争</text>
            <text class="result-card-item"><text class="text-bold">院校</text>：重大 15.6 万 / 西南交大 10-13 万 / 西南财经 11-16 万</text>
          </view>
          <view class="result-card">
            <text class="result-card-title">MEM · 工程管理硕士</text>
            <text class="result-card-item"><text class="text-bold">适合</text>：技术管理交叉岗，项目管理提升（城建 / 制造 / 工程类）</text>
            <text class="result-card-item"><text class="text-bold">院校</text>：川大 / 重大 / 西南交大等</text>
          </view>
        </view>
      </view>

      <view class="btn-primary" @click="goPage('test')">测一测适合什么院校</view>
      <view class="btn-row-2">
        <view class="btn-secondary" @click="goPage('estimate')">先估算一下分数</view>
        <view class="btn-secondary" @click="goPage('wechat')">进 备 考 群</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { trackPageView, trackNavClick } from '@/api/tracking'
import { usePageShare } from '@/utils/share'

usePageShare({
  title: '管综非全研究生备考方案｜研知道',
  path: '/pages/prep-gz/index'
})

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const goPage = (key: string) => {
  trackNavClick('prep-gz', key)
  const map: Record<string, string> = {
    test: '/pages/test/index',
    wechat: '/pages/contact/index',
    estimate: '/pages/estimate/index',
  }
  if (map[key]) uni.navigateTo({ url: map[key] })
}

onMounted(() => trackPageView('prep-gz'))
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";
.shell { background: #FAF7F2; min-height: 100vh; }
</style>
