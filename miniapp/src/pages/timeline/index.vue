<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">{{ content.title }}</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="brand-row">{{ content.brandLine }}</view>

      <view class="hero-card">
        <text class="kicker-cn">{{ content.hero.kicker }}</text>
        <text class="hero-title">{{ content.hero.title }}</text>
        <text class="hero-copy">{{ content.hero.copy }}</text>
      </view>

      <view class="section">
        <view class="section-head">
          <text class="section-head-title">{{ content.pathsSection.title }}</text>
          <text class="section-head-meta">{{ content.pathsSection.meta }}</text>
        </view>

        <view class="entry-grid">
          <view
            v-for="(path, idx) in content.paths"
            :key="idx"
            class="path-card"
            @click="goContact"
          >
            <text class="path-card-title">{{ path.title }}</text>
            <view class="bullet-list">
              <view class="bullet-row" v-for="(bullet, bi) in path.bullets" :key="bi">
                <text class="bullet-dot">·</text>
                <text class="bullet-body">
                  <text
                    v-for="(part, pi) in bullet"
                    :key="pi"
                    :class="{ 'text-accent': part.accent }"
                  >{{ part.text }}</text>
                </text>
              </view>
            </view>
            <text class="path-card-action">{{ path.actionLabel }}</text>
          </view>
        </view>
      </view>

      <view class="btn-primary" @click="goTest">{{ content.ctas.primary }}</view>
      <view class="btn-row-2">
        <view class="btn-secondary" @click="goSchools">{{ content.ctas.secondary1 }}</view>
        <view class="btn-secondary" @click="goCases">{{ content.ctas.secondary2 }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { v6TimelineContent } from '@/data/v5/timeline'
import { trackNavClick, trackPageView, trackTabClick } from '@/api/tracking'

const content = v6TimelineContent

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const goContact = () => {
  trackNavClick('timeline', 'contact', '/pages/contact/index')
  uni.navigateTo({ url: '/pages/contact/index' })
}

const goTest = () => {
  trackTabClick('timeline', 'test', '/pages/test/index')
  uni.switchTab({ url: '/pages/test/index' })
}

const goSchools = () => {
  trackNavClick('timeline', 'schools', '/pages/schools/index')
  uni.navigateTo({ url: '/pages/schools/index' })
}

const goCases = () => {
  trackNavClick('timeline', 'cases', '/pages/cases/index')
  uni.navigateTo({ url: '/pages/cases/index' })
}

onMounted(() => trackPageView('timeline'))
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }

.path-card {
  background: $card;
  border: 0.5px solid $border;
  border-radius: 18px;
  padding: 18px 16px 14px;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  margin-bottom: 0;

  &:active { opacity: 0.78; }
}

.path-card-title {
  display: block;
  @include serif;
  font-size: 17px;
  font-weight: 600;
  color: $text-1;
  line-height: 1.4;
  margin-bottom: 14px;
}

.bullet-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.bullet-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.bullet-dot {
  flex: 0 0 auto;
  color: $text-3;
  font-size: 13px;
  line-height: 1.7;
}

.bullet-body {
  flex: 1;
  font-size: 13px;
  color: $text-2;
  line-height: 1.7;
}

.path-card-action {
  display: block;
  color: $accent;
  font-size: 13px;
  line-height: 1.4;
}
</style>
