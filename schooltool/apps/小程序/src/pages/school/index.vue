<template>
  <scroll-view scroll-y class="school-tab">
    <view class="page-hero">
      <text class="page-kicker">择校结构</text>
      <text class="page-title">先分三条路径，再做院校比较。</text>
      <text class="page-desc">这里先把用户理解成本降下来。不是上来就扔一堆学校，而是先告诉他自己属于哪条路线。</text>
    </view>

    <view class="track-list">
      <view v-for="track in schoolTracks" :key="track.id" class="track-card">
        <text class="track-tag">{{ track.tag }}</text>
        <text class="track-title">{{ track.title }}</text>
        <text class="track-subtitle">{{ track.subtitle }}</text>
        <view class="track-bullets">
          <text v-for="item in track.bullets" :key="item" class="track-bullet">{{ item }}</text>
        </view>
      </view>
    </view>

    <view class="entry-card primary-card" @click="goDiagnosis">
      <view class="entry-copy">
        <text class="entry-title">先做一次院校匹配建议</text>
        <text class="entry-desc">诊断流负责把党校、MPA、MBA 和顾问沟通分层处理。</text>
      </view>
      <text class="entry-arrow">→</text>
    </view>

    <view class="section-head">
      <text class="section-title">川渝院校库展示方式</text>
      <text class="section-subtitle">现在先做静态体验卡片，以后直接接真实数据。</text>
    </view>

    <view class="school-list">
      <view v-for="item in schoolLibrary" :key="item.name" class="school-card">
        <view class="school-top">
          <text class="school-name">{{ item.name }}</text>
          <text class="school-badge">{{ item.badge }}</text>
        </view>
        <text class="school-meta">{{ item.category }} · {{ item.region }} · {{ item.fee }}</text>
        <text class="school-summary">{{ item.summary }}</text>
      </view>
    </view>
  </scroll-view>
</template>

<script>
import { schoolLibrary, schoolTracks } from '@/data/content.js'

export default {
  data() {
    return {
      schoolLibrary,
      schoolTracks
    }
  },
  methods: {
    goDiagnosis() {
      uni.navigateTo({ url: '/pages/quiz/index' })
    }
  }
}
</script>

<style scoped>
.school-tab {
  min-height: 100vh;
  background: linear-gradient(180deg, #f4eee4 0%, #f7f3ed 100%);
  padding: 28rpx;
}

.page-kicker,
.track-tag {
  display: inline-block;
  font-size: 22rpx;
  color: #8b4028;
  background: rgba(177, 77, 50, 0.1);
  border-radius: 999rpx;
  padding: 10rpx 16rpx;
}

.page-title {
  display: block;
  margin-top: 18rpx;
  font-size: 50rpx;
  line-height: 1.2;
  font-weight: 700;
  color: #1b2938;
}

.page-desc,
.track-subtitle,
.section-subtitle,
.school-summary,
.entry-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  line-height: 1.75;
  color: #68717d;
}

.track-list,
.school-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.track-card,
.entry-card,
.school-card {
  background: rgba(255, 253, 248, 0.92);
  border-radius: 26rpx;
  padding: 26rpx;
  box-shadow: 0 16rpx 40rpx rgba(31, 63, 99, 0.06);
}

.track-title,
.entry-title,
.section-title,
.school-name {
  display: block;
  margin-top: 14rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2d3c;
}

.track-bullets {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.track-bullet {
  font-size: 22rpx;
  color: #1f3f63;
  background: rgba(31, 63, 99, 0.08);
  border-radius: 999rpx;
  padding: 10rpx 16rpx;
}

.primary-card {
  margin: 22rpx 0 28rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #1f3f63 0%, #315275 100%);
}

.entry-copy {
  flex: 1;
  padding-right: 16rpx;
}

.primary-card .entry-title,
.primary-card .entry-desc,
.entry-arrow {
  color: #fff;
}

.entry-arrow {
  font-size: 36rpx;
}

.section-head {
  margin-bottom: 18rpx;
}

.school-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12rpx;
}

.school-badge {
  font-size: 22rpx;
  color: #1f3f63;
  background: rgba(31, 63, 99, 0.08);
  border-radius: 999rpx;
  padding: 10rpx 14rpx;
}

.school-meta {
  display: block;
  margin-top: 10rpx;
  font-size: 23rpx;
  color: #8a919c;
}
</style>
