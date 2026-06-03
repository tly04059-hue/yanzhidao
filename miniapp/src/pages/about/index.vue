<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">关于研知道</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="brand-row">研知道 · 川渝在职考研 · 不骗人 · 真服务</view>

      <view class="hero-card">
        <text class="kicker-cn">关于研知道</text>
        <text class="hero-title">聚焦川渝在职考研{{'\n'}}服务1000+，上岸400+</text>
        <text class="hero-copy">研知道于2021年成立，有考研授课10年、带班辅导5年、川大MBA、北大MPA等标签，感恩每一位同学。</text>
      </view>

      <!-- 我们做的事 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">我们做的事</text>
        </view>
        <view class="note-card">
          <text class="note-card-text">聚焦川渝，结合真实的职业和个人发展需要，为在职人士提供在职考研路径咨询、过考辅导。</text>
          <text class="note-card-text" style="margin-top: 12px;">提供两类服务：<text class="text-bold">党校在职研究生备考辅导</text>（四川党校及重庆党校）和<text class="text-bold">统考非全研究生辅导</text>（MPA / MBA / MEM三个专业）</text>
        </view>
      </view>

      <!-- 服务过的人 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">服务过的人</text>
        </view>
        <view class="about-stats">
          <view class="about-stat">
            <text class="about-stat-num accent">1,000+</text>
            <text class="about-stat-lbl">川渝同学</text>
          </view>
          <view class="about-stat">
            <text class="about-stat-num accent">25 个</text>
            <text class="about-stat-lbl">地市覆盖</text>
          </view>
          <view class="about-stat">
            <text class="about-stat-num success">5 年</text>
            <text class="about-stat-lbl">连续服务</text>
          </view>
        </view>
        <view class="note-card">
          <text class="note-card-text">我们服务过川渝地区大量的公务员、事业编、国企央企、教师医护、公检法等不同岗位的同学，提供择校和备考服务，提供真实有效的在职考研上岸路径。</text>
        </view>
        <view class="btn-secondary" @click="goPage('map')">看 1,000+ 服务过的同学分布地图 →</view>
      </view>

      <!-- 在这里你能拿到什么 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">在这里你能拿到什么</text>
        </view>
        <view class="note-card">
          <text class="note-card-text"><text class="text-bold">结果方面，真实过考率：</text></text>
          <text class="note-card-text" style="margin-top: 6px;">四川党校 40.4% · 重庆党校 44%（2025 年）；</text>
          <text class="note-card-text" style="margin-top: 6px;">管综 2026 届初试 55.6% → 复试 87.5%（含单招的复试辅导，含调剂）。</text>
          <text class="note-card-text" style="margin-top: 16px;"><text class="text-bold">考研方面，不骗人、真服务：</text></text>
          <text class="note-card-text" style="margin-top: 6px;">与交付一致的真实经验分享，可实操的在职考研路径及备考过程服务。</text>
        </view>
      </view>

      <!-- 在这里你不会遇到什么 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">在这里你不会遇到什么</text>
        </view>
        <view class="note-card">
          <text class="note-card-text" style="margin-bottom: 12px;"><text class="text-bold">不会被反复推销课程</text>，咨询不收费</text>
          <text class="note-card-text"><text class="text-bold">不会被承诺"保过 / 100% / 升职加薪"</text>，因为这些不是辅导能保证的</text>
        </view>
      </view>

      <!-- 公司办公地址 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">公司办公地址：成都市高新区天府五街</text>
        </view>
        <view class="office-gallery">
          <image class="office-image" :src="remoteAssets.about.build" mode="aspectFill" />
          <image class="office-image" :src="remoteAssets.about.door" mode="aspectFill" />
        </view>
      </view>

      <view class="btn-primary" @click="goPage('wechat')">加企微 1 对 1 咨询</view>
      <view class="btn-secondary" @click="goHome">先回首页</view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { trackPageView, trackNavClick } from '@/api/tracking'
import { remoteAssets } from '@/data/remote-assets'

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const goHome = () => uni.switchTab({ url: '/pages/index/index' })

const goPage = (key: string) => {
  trackNavClick('about', key)
  const map: Record<string, string> = {
    wechat: '/pages/contact/index',
    map: '/pages/map/index',
  }
  if (map[key]) uni.navigateTo({ url: map[key] })
}

onMounted(() => trackPageView('about'))
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";
.shell { background: #FAF7F2; min-height: 100vh; }

.note-card-text .text-bold {
  color: inherit;
  font-weight: 600;
}

.office-gallery {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.office-image {
  width: 100%;
  height: 188px;
  border-radius: 16px;
  display: block;
  overflow: hidden;
  background: #F4EEE6;
}
</style>
