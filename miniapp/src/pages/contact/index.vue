<template>
  <view class="page-v3 contact-page">
    <view class="topbar">
      <text class="back" @click="goBack">‹</text>
      <text class="title">咨询</text>
      <view class="placeholder"></view>
    </view>

    <view class="section hero">
      <text class="hero-kicker">研知道专业带学班</text>
      <text class="hero-main">不骗人，真服务</text>
      <text class="hero-main">稳定提高过考率</text>
    </view>

    <view class="section card data-card">
      <text class="data-line">2025年四川辅导过考率是 <text class="num">40.4%</text></text>
      <text class="data-line">过考率就是四川自然过考率的 <text class="num">4倍+</text></text>
      <text class="data-line">2025年入班学员整体过考率是自然过考率的 <text class="num">4.1倍</text></text>
    </view>

    <view class="section card service-card">
      <text class="service-title">聚焦川渝党校和管综考研辅导</text>
      <text class="service-line">专门服务在职考研的考生</text>
      <text class="service-line">提供资料和辅导班带学服务</text>
      <text class="service-line">基于自研的33法过考体系</text>
      <text class="values">重结果，重教研，重服务</text>
    </view>

    <view class="section card founder-card">
      <text class="founder-title">杨老师｜研知道创始人之一、教研教学负责人</text>
      <view class="founder-list">
        <text class="founder-item">• 管综逻辑、写作老师第8年</text>
        <text class="founder-item">• 2017年上岸川大MBA，2022年上岸北大MPA</text>
        <text class="founder-item">• 公共管理案例大赛全国三等奖</text>
        <text class="founder-item">• 带过上市公司高管与专科学员上岸</text>
        <text class="founder-item">• 2021年创业形成"33法过考体系"</text>
      </view>
    </view>

    <view class="section trust-grid">
      <view class="trust-item"><text class="trust-title">以下全部来自学员反馈，100%真实</text></view>
      <image class="trust-feedback-image" src="/static/contact/trust-feedback.png" mode="widthFix" />
      <view class="trust-item"><text class="trust-title">全程接受监督询问</text></view>
      <view class="trust-item"><text class="trust-title">如实宣传且协议保障</text></view>
      <view class="trust-item"><text class="trust-title">对公支付 合规经营</text></view>
    </view>

    <view class="section card reviews-card">
      <text class="block-title">客户评语合集</text>
      <image class="reviews-img" src="/static/contact/contact-reviews.webp" mode="widthFix" />
    </view>

    <view class="section qrcode">
      <text class="qrcode-text">微信搜"研知道"关注公众号和视频号，获取更多党校在职研究生考前辅导资讯</text>
      <view class="qrcode-row">
        <view class="qrcode-item">
          <image class="qrcode-img" src="/static/contact/wechat-official-qrcode.jpg" mode="aspectFit" />
          <text class="qrcode-label">企业微信号</text>
        </view>
        <view class="qrcode-item">
          <image class="qrcode-img" src="/static/contact/wechat-miniapp-qrcode.png" mode="aspectFit" />
          <text class="qrcode-label">企业微信号</text>
        </view>
      </view>
    </view>

    <view class="tab-bar">
      <view class="tab-item" @click="goHome">
        <image class="tab-icon-img" src="/static/icons/tab-home.svg" mode="aspectFit" />
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
      <view class="tab-item active" @click="goContact">
        <image class="tab-icon-img" src="/static/icons/tab-contact-active.svg" mode="aspectFit" />
        <text class="tab-label">咨询</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 })
  } else {
    uni.redirectTo({ url: '/pages/index/index' })
  }
}
const goHome = () => uni.redirectTo({ url: '/pages/index/index' })
const goLearn = () => uni.redirectTo({ url: '/pages/learn/index' })
const goTest = () => uni.redirectTo({ url: '/pages/test/index' })
const goContact = () => uni.redirectTo({ url: '/pages/contact/index' })
</script>

<style scoped lang="scss">
.contact-page {
  min-height: 100vh;
  background: #f5efe7;
  padding-bottom: calc(108px + env(safe-area-inset-bottom));
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  height: 48px;
  background: #ffffff;
  border-bottom: 1px solid #ece5d8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.back,
.placeholder {
  width: 24px;
  color: #2a251e;
}

.back { font-size: 22px; }
.title { font-size: 16px; font-weight: 700; color: #2a251e; }

.section {
  margin: 16px 20px 0;
}

.card {
  background: #ffffff;
  border: 1px solid #ece5d8;
  border-radius: 14px;
  padding: 16px;
}

.hero {
  background: #cf7140;
  border-radius: 14px;
  padding: 18px 16px;
}

.hero-kicker {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 10px;
}

.hero-main {
  display: block;
  color: #fff;
  font-size: 34px;
  line-height: 1.2;
  font-weight: 800;
}

.data-card {
  background: #fff7e8;
}

.data-line {
  display: block;
  color: #2a251e;
  font-size: 18px;
  line-height: 1.65;
  font-weight: 700;
}

.data-line + .data-line { margin-top: 8px; }

.num {
  color: #cf7140;
  background: #f7e6b6;
  padding: 0 4px;
  border-radius: 4px;
}

.service-title {
  display: block;
  color: #2a251e;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.4;
  margin-bottom: 10px;
}

.service-line {
  display: block;
  color: #2a251e;
  font-size: 16px;
  line-height: 1.75;
}

.values {
  display: block;
  margin-top: 14px;
  color: #cf7140;
  font-size: 24px;
  font-weight: 800;
}

.founder-title {
  display: block;
  color: #2a251e;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.6;
  margin-bottom: 8px;
}

.founder-item {
  display: block;
  color: #6b6258;
  font-size: 14px;
  line-height: 1.75;
}

.trust-grid {
  display: grid;
  gap: 10px;
}

.trust-feedback-image {
  width: 100%;
  border-radius: 12px;
}

.trust-item {
  background: #fff;
  border: 1px solid #ece5d8;
  border-radius: 12px;
  padding: 12px 14px;
}

.trust-title {
  color: #2a251e;
  font-size: 15px;
  font-weight: 700;
}

.block-title {
  display: block;
  color: #2a251e;
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 4px;
}

.block-sub {
  display: block;
  color: #cf7140;
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 10px;
}

.office-main,
.office-proof,
.reviews-img {
  width: 100%;
  border-radius: 10px;
}

.address {
  display: block;
  margin: 10px 0;
  color: #2a251e;
  font-size: 14px;
  line-height: 1.75;
  border-left: 3px solid #cf7140;
  padding-left: 8px;
}

.reviews-card .block-title {
  margin-bottom: 10px;
}

.qrcode {
  margin: 16px 20px 0;
  background: #ffffff;
  border: 2px solid #cf7140;
  border-radius: 12px;
  padding: 12px;
}

.qrcode-text {
  display: block;
  font-size: 14px;
  line-height: 1.75;
  color: #2a251e;
}

.qrcode-row {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.qrcode-item {
  background: #faf7f2;
  border: 1px solid #ece5d8;
  border-radius: 10px;
  padding: 8px;
  text-align: center;
}

.qrcode-img {
  width: 100%;
  height: 130px;
}

.qrcode-label {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #2a251e;
}
</style>
