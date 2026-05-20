<template>
  <scroll-view scroll-y class="home">
    <view class="hero">
      <view class="hero-safe" :style="{ paddingTop: statusBarHeight + 'px' }"></view>
      <view class="hero-topline">
        <text class="brand-chip">研知道</text>
        <text class="brand-note">微信首发版</text>
      </view>
      <text class="hero-title">先把路径判断清楚，再决定读哪所、怎么买课。</text>
      <text class="hero-desc">这版先做成可体验的小程序前端壳，适合微信传播，后面平滑迁到 App。</text>
      <view class="hero-entry" @click="goDiagnosis">
        <view class="hero-entry-copy">
          <text class="hero-entry-kicker">核心入口</text>
          <text class="hero-entry-title">{{ diagnosisEntry.title }}</text>
          <text class="hero-entry-desc">{{ diagnosisEntry.desc }}</text>
        </view>
        <view class="hero-entry-tags">
          <text v-for="item in diagnosisEntry.highlights" :key="item" class="hero-entry-tag">{{ item }}</text>
        </view>
      </view>
    </view>

    <view class="section section-tight">
      <view class="metric-list">
        <view v-for="item in trustMetrics" :key="item.label" class="metric-card">
          <text class="metric-value">{{ item.value }}</text>
          <text class="metric-label">{{ item.label }}</text>
          <text class="metric-note">{{ item.note }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-head">
        <text class="section-title">三个动作，先把结构立住</text>
        <text class="section-subtitle">首页负责分流，择校负责比较，备考负责后续承接。</text>
      </view>
      <view class="action-list">
        <view v-for="item in homepageActions" :key="item.key" class="action-card" @click="handleAction(item.key)">
          <view class="action-top">
            <text class="action-icon">{{ item.icon }}</text>
            <text class="action-arrow">↗</text>
          </view>
          <text class="action-title">{{ item.title }}</text>
          <text class="action-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-head">
        <text class="section-title">这不是资料堆砌，是一条判断链</text>
      </view>
      <view class="scene-list">
        <view v-for="item in serviceScenes" :key="item.title" class="scene-card">
          <text class="scene-title">{{ item.title }}</text>
          <text class="scene-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="studio-card">
        <text class="studio-kicker">产品方向</text>
        <text class="studio-title">先做小程序体验壳，再往 App 的信息架构靠。</text>
        <text class="studio-desc">现在先不碰数据系统，前端先把“用户怎么进来、怎么判断、怎么被收口”做稳。后面接真实数据时，页面结构和内容区块还能直接复用。</text>
      </view>
    </view>

    <lead-modal v-if="showLead" @close="showLead = false" />
  </scroll-view>
</template>

<script>
import LeadModal from '@/components/LeadModal.vue'
import { diagnosisEntry, homepageActions, serviceScenes, trustMetrics } from '@/data/content.js'

export default {
  components: { LeadModal },
  data() {
    return {
      statusBarHeight: 44,
      showLead: false,
      diagnosisEntry,
      homepageActions,
      serviceScenes,
      trustMetrics
    }
  },
  onLoad() {
    const sysInfo = uni.getSystemInfoSync()
    this.statusBarHeight = sysInfo.statusBarHeight || 44
  },
  methods: {
    goDiagnosis() {
      uni.navigateTo({ url: '/pages/quiz/index' })
    },
    goSchoolList() {
      uni.switchTab({ url: '/pages/school/index' })
    },
    contactAdvisor() {
      uni.showToast({ title: '添加微信：yanzhidao01', icon: 'none', duration: 2600 })
    },
    handleAction(key) {
      if (key === 'diagnosis') return this.goDiagnosis()
      if (key === 'school') return this.goSchoolList()
      if (key === 'material') {
        this.showLead = true
        return
      }
      this.contactAdvisor()
    }
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(196, 155, 84, 0.24), transparent 34%),
    linear-gradient(180deg, #f4eee5 0%, #f6f2eb 100%);
}

.hero {
  padding: 0 28rpx 22rpx;
}

.hero-topline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28rpx;
}

.brand-chip,
.brand-note {
  font-size: 22rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
}

.brand-chip {
  background: rgba(31, 63, 99, 0.1);
  color: #1f3f63;
  font-weight: 700;
}

.brand-note {
  background: rgba(177, 77, 50, 0.1);
  color: #8b4028;
}

.hero-title {
  display: block;
  font-size: 54rpx;
  line-height: 1.18;
  font-weight: 700;
  color: #1c2a38;
  letter-spacing: 1rpx;
}

.hero-desc {
  display: block;
  margin-top: 18rpx;
  font-size: 28rpx;
  color: #5f6874;
  line-height: 1.7;
}

.hero-entry {
  margin-top: 28rpx;
  padding: 30rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, rgba(31, 63, 99, 0.98) 0%, rgba(49, 82, 117, 0.94) 100%);
  box-shadow: 0 22rpx 52rpx rgba(31, 63, 99, 0.16);
}

.hero-entry-kicker {
  display: inline-block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.66);
  margin-bottom: 8rpx;
}

.hero-entry-title {
  display: block;
  font-size: 34rpx;
  color: #fff;
  font-weight: 700;
}

.hero-entry-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.82);
}

.hero-entry-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 22rpx;
}

.hero-entry-tag {
  font-size: 22rpx;
  color: #f2e6c9;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.09);
}

.section {
  padding: 0 28rpx 26rpx;
}

.section-tight {
  margin-top: -8rpx;
}

.section-head {
  margin-bottom: 18rpx;
}

.section-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #1c2a38;
}

.section-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #7b838f;
}

.metric-list {
  display: flex;
  gap: 18rpx;
}

.metric-card {
  flex: 1;
  min-width: 0;
  background: rgba(255, 253, 248, 0.92);
  border: 1rpx solid rgba(29, 42, 56, 0.06);
  border-radius: 24rpx;
  padding: 24rpx 20rpx;
  box-shadow: 0 14rpx 36rpx rgba(31, 63, 99, 0.06);
}

.metric-value {
  display: block;
  font-size: 34rpx;
  color: #1f3f63;
  font-weight: 700;
}

.metric-label {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #47505c;
}

.metric-note {
  display: block;
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #8a919b;
  line-height: 1.5;
}

.action-list {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.action-card {
  width: calc(50% - 9rpx);
  background: rgba(255, 253, 248, 0.92);
  border-radius: 26rpx;
  padding: 24rpx;
  min-height: 214rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 14rpx 36rpx rgba(31, 63, 99, 0.06);
}

.action-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-icon,
.action-arrow {
  font-size: 24rpx;
  color: #1f3f63;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(31, 63, 99, 0.08);
}

.action-title {
  display: block;
  margin-top: 26rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #223140;
}

.action-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #6f7783;
}

.scene-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.scene-card,
.studio-card {
  background: rgba(255, 253, 248, 0.92);
  border-radius: 24rpx;
  padding: 24rpx 26rpx;
  box-shadow: 0 14rpx 36rpx rgba(31, 63, 99, 0.06);
}

.scene-title,
.studio-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2e3d;
}

.scene-desc,
.studio-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  line-height: 1.8;
  color: #69717d;
}

.studio-kicker {
  display: inline-block;
  font-size: 22rpx;
  color: #8b4028;
  background: rgba(177, 77, 50, 0.1);
  border-radius: 999rpx;
  padding: 10rpx 16rpx;
  margin-bottom: 16rpx;
}
</style>
