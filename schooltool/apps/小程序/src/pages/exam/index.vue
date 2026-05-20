<template>
  <scroll-view scroll-y class="exam-tab">
    <view class="intro-card">
      <text class="intro-kicker">备考承接</text>
      <text class="intro-title">备考不是独立产品，它应该接在诊断之后。</text>
      <text class="intro-desc">这页先把用户从“知道自己适合什么”推进到“知道下一步怎么做”，适合作为微信小程序里的第三个 Tab。</text>
    </view>

    <view class="timeline-card">
      <text class="timeline-title">节奏先做简单，让用户一眼知道时间感</text>
      <view class="timeline-row">
        <text class="timeline-label">党校</text>
        <text class="timeline-value">3-4月报名，6月考试，适合低预算快速进入</text>
      </view>
      <view class="timeline-row">
        <text class="timeline-label">MPA</text>
        <text class="timeline-value">9-10月报名，12月统考，适合做更强学历资产</text>
      </view>
    </view>

    <text class="section-title">建议的产品承接链</text>
    <view class="stage-list">
      <view v-for="item in examStages" :key="item.phase" class="stage-card">
        <text class="stage-phase">{{ item.phase }}</text>
        <text class="stage-title">{{ item.title }}</text>
        <text class="stage-desc">{{ item.desc }}</text>
      </view>
    </view>

    <text class="section-title">这一版适合先放的服务入口</text>
    <view class="service-list">
      <view v-for="item in examServices" :key="item.title" class="service-card" @click="handleService(item.title)">
        <text class="service-title">{{ item.title }}</text>
        <text class="service-desc">{{ item.desc }}</text>
      </view>
    </view>
  </scroll-view>
</template>

<script>
import { examServices, examStages } from '@/data/content.js'

export default {
  data() {
    return {
      examServices,
      examStages
    }
  },
  methods: {
    handleService(title) {
      if (title.includes('顾问')) {
        uni.showToast({ title: '添加微信：yanzhidao01', icon: 'none', duration: 2600 })
        return
      }
      uni.showToast({ title: `${title} 已做为体验入口`, icon: 'none' })
    }
  }
}
</script>

<style scoped>
.exam-tab {
  min-height: 100vh;
  background: linear-gradient(180deg, #f4eee4 0%, #f8f4ee 100%);
  padding: 28rpx;
}

.intro-card,
.timeline-card,
.stage-card,
.service-card {
  background: rgba(255, 253, 248, 0.92);
  border-radius: 26rpx;
  padding: 26rpx;
  box-shadow: 0 16rpx 40rpx rgba(31, 63, 99, 0.06);
}

.intro-kicker,
.stage-phase {
  display: inline-block;
  font-size: 22rpx;
  color: #8b4028;
  background: rgba(177, 77, 50, 0.1);
  border-radius: 999rpx;
  padding: 10rpx 16rpx;
}

.intro-title,
.timeline-title,
.stage-title,
.service-title,
.section-title {
  display: block;
  margin-top: 16rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2d3c;
}

.intro-desc,
.stage-desc,
.service-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  line-height: 1.8;
  color: #68717d;
}

.timeline-card {
  margin-top: 18rpx;
}

.timeline-row {
  margin-top: 18rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid rgba(29, 42, 56, 0.08);
}

.timeline-label,
.timeline-value {
  display: block;
  font-size: 26rpx;
}

.timeline-label {
  color: #1f3f63;
  font-weight: 700;
}

.timeline-value {
  margin-top: 6rpx;
  line-height: 1.8;
  color: #68717d;
}

.section-title {
  margin: 26rpx 0 16rpx;
}

.stage-list,
.service-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
</style>
