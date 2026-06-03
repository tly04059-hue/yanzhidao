<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">数据预览入口</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="hero-card">
        <text class="preview-kicker">preview hub</text>
        <text class="preview-title">数据预览已转入开发侧</text>
        <text class="preview-copy">这个入口只保留为开发提示页，正式小程序不再跳转到本地地址或未注册页面，避免上线后出现无效链接。</text>
      </view>

      <view class="entry-card">
        <view class="entry-head">
          <text class="entry-title">如何继续看数据</text>
        </view>
        <text class="entry-desc">请在项目文档、数据源文件或本地开发脚本中查看案例库、院校库和推荐逻辑，不再通过小程序页面暴露预览入口。</text>
        <text class="entry-url">这样可以避免生产包里出现本地开发地址或未注册路由。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}
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

.entry-card {
  background: $card;
  border: 0.5px solid $border;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  border-radius: 18px;
  padding: 16px;
  cursor: pointer;
}

.entry-card + .entry-card {
  margin-top: 14px;
}

.entry-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.entry-title {
  @include serif;
  font-size: 20px;
  line-height: 1.4;
  color: $text-1;
}

.entry-arrow {
  color: $accent;
  font-size: 18px;
  line-height: 1;
}

.entry-desc {
  display: block;
  font-size: 13px;
  line-height: 1.75;
  color: $text-2;
  margin-bottom: 10px;
}

.entry-url {
  display: block;
  font-size: 12px;
  line-height: 1.6;
  color: $text-3;
  word-break: break-all;
}
</style>
