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
      <view class="hero-card">
        <text class="kicker-cn">{{ content.hero.kicker }}</text>
        <text class="hero-title">{{ content.hero.title }}</text>
        <text class="hero-copy">{{ content.hero.copy }}</text>
      </view>

      <!-- 11维对比表（横向滚动） -->
      <scroll-view class="table-scroll" scroll-x>
        <view class="cmp-table">
          <view class="cmp-head">
            <text class="cmp-th cmp-dim">{{ content.table.columns.dimension }}</text>
            <text class="cmp-th">{{ content.table.columns.pathA }}</text>
            <text class="cmp-th">{{ content.table.columns.pathB }}</text>
          </view>
          <view class="cmp-row" v-for="row in content.table.rows" :key="row.dimension">
            <text class="cmp-td cmp-dim" style="color: #6B6258; font-weight: 500;">{{ row.dimension }}</text>
            <view class="cmp-td-cell">
              <text class="cmp-val">{{ row.pathA }}</text>
              <text class="cmp-note" v-if="row.pathANote">{{ row.pathANote }}</text>
            </view>
            <view class="cmp-td-cell">
              <text class="cmp-val">{{ row.pathB }}</text>
              <text class="cmp-note" v-if="row.pathBNote">{{ row.pathBNote }}</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <text class="data-cutoff">{{ content.note }}</text>

      <view class="btn-primary" @click="goTest">{{ content.actions[0].label }}</view>
      <view class="btn-secondary" @click="goPrep">{{ content.actions[1].label }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { v5PathContent } from '@/data/v5'
import { trackNavClick, trackPageView, trackTabClick } from '@/api/tracking'

const content = v5PathContent

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const goTest = () => {
  trackTabClick('comparison', 'test', '/pages/test/index')
  uni.switchTab({ url: '/pages/test/index' })
}

const goPrep = () => {
  trackNavClick('comparison', 'prep', '/pages/prep/index')
  uni.navigateTo({ url: '/pages/prep/index' })
}

onMounted(() => trackPageView('comparison'))
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }

.table-scroll {
  margin-bottom: 12px;
}

.cmp-table {
  min-width: 480px;
  background: $card;
  border-radius: 16px;
  border: 0.5px solid $border;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  overflow: hidden;
}

.cmp-head {
  background: $bg-warm;
  display: flex;
}

.cmp-th {
  flex: 1;
  padding: 10px 10px;
  font-size: 12px;
  font-weight: 600;
  color: $text-2;
  letter-spacing: 0.04em;
}

.cmp-th.cmp-dim {
  flex: 0 0 72px;
  max-width: 72px;
}

.cmp-row {
  display: flex;
  border-top: 0.5px dashed $divider;
}

.cmp-td {
  flex: 1;
  padding: 10px 10px;
  font-size: 12px;
  line-height: 1.6;
  color: $text-1;
}

.cmp-td.cmp-dim {
  flex: 0 0 72px;
  max-width: 72px;
}

.cmp-td-cell {
  flex: 1;
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cmp-val {
  font-size: 12px;
  line-height: 1.6;
  color: $text-1;
  display: block;
}

.cmp-note {
  font-size: 11px;
  color: $text-3;
  display: block;
  line-height: 1.5;
}
</style>
