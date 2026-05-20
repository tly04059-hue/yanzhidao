<template>
  <!-- 微信顶栏 -->
  <view class="wx-nav">
    <text class="wx-nav-title">研知道选校</text>
    <text class="nav-dots">●●●</text>
  </view>

  <view class="page-v3">
    <!-- Hero Banner -->
    <view class="hero">
      <view class="hero-card">
        <view class="hero-mast">
          <image class="hero-mast-dot" src="/static/logo-white.png" mode="aspectFit"></image>
        </view>
        <text class="hero-title">川渝体制内</text>
        <text class="hero-subtitle">考研决策指南</text>
        <view>
          <text class="hero-sub">只需 3 分钟，看见适合你的学历提升路径</text>
        </view>
      </view>
    </view>

    <!-- 三类用户入口 -->
    <view class="entry-section">
      <view class="entry-head">
        <text class="kicker">Quick Start</text>
        <view class="entry-head-title-wrap">
          <text class="entry-head-icon">✦</text>
          <text class="entry-head-title">你现在的状态？</text>
        </view>
      </view>
      <view class="entry-list">
        <view class="entry-card" @click="goLearn">
          <view class="entry-icon"><image class="entry-icon-img" src="/static/icons/tab-home-active.svg" mode="aspectFit" /></view>
          <view class="entry-content">
            <text class="entry-label">犹豫期</text>
            <text class="entry-title">我还在想要不要读研</text>
            <text class="entry-desc">看政策、看案例，理解学历作用</text>
          </view>
          <text class="entry-arrow">›</text>
        </view>
        <view class="entry-card" @click="goTest">
          <view class="entry-icon"><image class="entry-icon-img" src="/static/icons/tab-test-active.svg" mode="aspectFit" /></view>
          <view class="entry-content">
            <text class="entry-label">决策期</text>
            <text class="entry-title">我想知道适合考什么</text>
            <text class="entry-desc">3 分钟测评 → 个性化方案</text>
          </view>
          <text class="entry-arrow">›</text>
        </view>
        <view class="entry-card" @click="goTimeline">
          <view class="entry-icon"><image class="entry-icon-img" src="/static/icons/tab-learn-active.svg" mode="aspectFit" /></view>
          <view class="entry-content">
            <text class="entry-label">行动期</text>
            <text class="entry-title">我决定了，要开始备考</text>
            <text class="entry-desc">备考方案、资料、顾问</text>
          </view>
          <text class="entry-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 院校查询入口 -->
    <view class="tool-row">
      <view class="tool-card">
        <view class="tool-item" @click="goSchools">
          <view class="tool-ico"><image class="tool-ico-img" src="/static/icons/tab-learn.svg" mode="aspectFit" /></view>
          <text class="tool-name">院校查询</text>
        </view>

      </view>
  </view>

  <!-- 信任锚 -->
  <view class="trust">
    <view class="trust-row">
      <view class="trust-item">
        <text class="trust-num green">1,100+</text>
        <text class="trust-lbl">川渝同行</text>
      </view>
      <view class="trust-item">
        <text class="trust-num">04</text>
        <text class="trust-lbl">届数据</text>
      </view>
      <view class="trust-item">
        <text class="trust-num">42</text>
        <text class="trust-lbl">所院校</text>
      </view>
    </view>
  </view>

  <!-- 备考方案预览 -->
  <view class="plan-section">
    <view class="entry-head">
      <text class="kicker">Programs</text>
      <view class="entry-head-title-wrap">
        <text class="entry-head-icon">✦</text>
        <text class="entry-head-title">备考方案</text>
      </view>
    </view>
    <view class="plan-list">
      <view class="plan-card" @click="goTimeline">
        <view class="plan-card-l">
          <text class="plan-tag">党校系</text>
          <text class="plan-name">党校在职研究生</text>
          <text class="plan-meta">免联考 · 适合体制内 35+</text>
        </view>
        <text class="plan-card-r">›</text>
      </view>
      <view class="plan-card" @click="goTimeline">
        <view class="plan-card-l">
          <text class="plan-tag">管综系</text>
          <text class="plan-name">非全日制 MPA / MBA</text>
          <text class="plan-meta">双证 · 适合体制内 28-40</text>
        </view>
        <text class="plan-card-r">›</text>
      </view>
    </view>
  </view>

  <view class="brand-foot">不骗人 · 真服务</view>

  <!-- Tab Bar -->
  <view class="tab-bar">
    <view class="tab-item active">
      <image class="tab-icon-img" src="/static/icons/tab-home-active.svg" mode="aspectFit" />
      <text class="tab-label">首页</text>
    </view>
    <view class="tab-item" @click="goLearn">
      <image class="tab-icon-img" src="/static/icons/tab-learn.svg" mode="aspectFit" />
      <text class="tab-label">了解</text>
    </view>
    <view class="tab-item" @click="goTest">
      <image class="tab-icon-img" src="/static/icons/tab-test.svg" mode="aspectFit" />
      <text class="tab-label">测一测</text>
    </view>
    <view class="tab-item" @click="goContact">
      <image class="tab-icon-img" src="/static/icons/tab-contact.svg" mode="aspectFit" />
      <text class="tab-label">咨询</text>
    </view>
  </view>
  </view>
</template>

<script setup lang="ts">
const goLearn = () => uni.redirectTo({ url: '/pages/learn/index' })
const goTest = () => uni.redirectTo({ url: '/pages/test/index' })
const goContact = () => uni.redirectTo({ url: '/pages/contact/index' })
const goSchools = () => uni.navigateTo({ url: '/pages/schools/index' })
const goTimeline = () => uni.navigateTo({ url: '/pages/timeline/index' })

const showInfo = (title: string, content: string) => {
  uni.showModal({ title, content, showCancel: false })
}

</script>

<style lang="scss" scoped>
/* 按 UI 样本 01_首页.html 规范编写 */
.page-v3 {
  width: 100%;
  background: #F5EFE7;
  min-height: 100vh;
  padding-bottom: 130px;
  box-sizing: border-box;
}

/* 微信顶栏 */
.wx-nav {
  width: 100%;
  background: #FFFFFF;
  padding: 16px 20px;
  border-bottom: 0.5px solid #ECE5D8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.wx-nav-title {
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 28px;
  color: #2A251E;
}

.nav-dots {
  font-size: 8px;
  color: #2A251E;
  letter-spacing: -1px;
}

/* Hero Banner */
.hero {
  padding: 18px 20px 0;
}

.hero-card {
  background: #CF7140;
  color: white;
  border-radius: 16px;
  padding: 28px 24px;
  position: relative;
  overflow: hidden;
}

.hero-card::before {
  content: '';
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%);
}

.hero-mast {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.hero-mast-dot {
  width: 150px;
  height: 150px;
}

.hero-mast-name {
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 18px;
  letter-spacing: 0.32em;
}

.hero-title {
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 24px;
  line-height: 1.2;
  margin-bottom: 2px;
  white-space: nowrap;
}

.hero-subtitle {
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 36px;
  line-height: 1.2;
  margin-bottom: 6px;
  white-space: nowrap;
}

.hero-sub {
  font-family: "Songti SC", serif;
  font-size: 14px;
  color: rgba(255,255,255,0.85);
  line-height: 1.4;
}

/* 三类用户入口 */
.entry-section {
  padding: 22px 20px 16px;
}

.entry-head {
  margin-bottom: 14px;
  padding: 0 2px;
}

.kicker {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 500;
  font-size: 12px;
  color: #CF7140;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.entry-head-title-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.entry-head-icon {
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 14px;
  color: #CF7140;
}

.entry-head-title {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 18px;
  color: #2A251E;
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.entry-card {
  background: #FFFFFF;
  border-radius: 14px;
  border: 0.5px solid #ECE5D8;
  padding: 18px 22px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.entry-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #F1E0D3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 18px;
  color: #CF7140;
  flex-shrink: 0;
}

.entry-icon-img {
  width: 20px;
  height: 20px;
  display: block;
}

.entry-content {
  flex: 1;
}

.entry-label {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 500;
  font-size: 12px;
  color: #8A8175;
  letter-spacing: 0.08em;
  margin-bottom: 1px;
}

.entry-title {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 16px;
  color: #2A251E;
  margin-bottom: 1px;
}

.entry-desc {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 12px;
  color: #6B6258;
}

.entry-arrow {
  font-family: "Songti SC", serif;
  font-size: 24px;
  color: #8A8175;
}

/* 院校查询入口 */
.tool-row {
  padding: 12px 20px 18px;
}

.tool-card {
  background: #FFFFFF;
  border-radius: 14px;
  border: 0.5px solid #ECE5D8;
  padding: 18px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}

.tool-ico {
  width: 32px;
  height: 32px;
  background: #F0E9DD;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 14px;
  color: #CF7140;
}

.tool-ico-img {
  width: 16px;
  height: 16px;
  display: block;
}

.tool-name {
  font-family: "Songti SC", serif;
  font-weight: 500;
  font-size: 14px;
  color: #2A251E;
}

/* 信任锚 */
.trust {
  width: 100%;
  background: #FFFFFF;
  padding: 16px 0;
  border-top: 4px solid #F5EFE7;
  box-sizing: border-box;
}

.trust-row {
  display: flex;
  justify-content: space-around;
}

.trust-item {
  text-align: center;
}

.trust-num {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 24px;
  color: #CF7140;
  line-height: 1;
}

.trust-num.green {
  color: #5F8C6E;
}

.trust-lbl {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 12px;
  color: #8A8175;
  margin-top: 2px;
  letter-spacing: 0.06em;
}

/* 备考方案预览 */
.plan-section {
  padding: 20px 20px;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.plan-card {
  background: #FFFFFF;
  border-radius: 14px;
  border: 0.5px solid #ECE5D8;
  padding: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-card-l {
  flex: 1;
}

.plan-tag {
  display: inline-block;
  font-family: "Songti SC", serif;
  font-size: 11px;
  color: #CF7140;
  background: #F1E0D3;
  padding: 2px 6px;
  border-radius: 999px;
  margin-bottom: 2px;
  letter-spacing: 0.04em;
}

.plan-name {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 16px;
  color: #2A251E;
}

.plan-meta {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 12px;
  color: #6B6258;
}

.plan-card-r {
  color: #8A8175;
  font-size: 24px;
}

/* 底部信息组 */
.foot-row {
  background: #FFFFFF;
  padding: 18px 20px;
  border-top: 14px solid #F5EFE7;
}

.foot-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 0.5px solid #E8E1D5;
}

.foot-link:last-child {
  border-bottom: none;
}

.foot-link-left {
  font-family: "Songti SC", serif;
  font-size: 14px;
  color: #2A251E;
}

.foot-link-right-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.foot-link-right {
  font-family: "Songti SC", serif;
  font-size: 14px;
  color: #8A8175;
}

.foot-arrow {
  font-size: 24px;
  color: #8A8175;
}

/* 刊尾品牌 */
.brand-foot {
  text-align: center;
  padding: 14px 0 18px;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.32em;
  color: #8A8175;
}

</style>
