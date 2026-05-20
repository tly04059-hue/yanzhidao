<template>
  <view class="result-page">
    <!-- 诊断头部 -->
    <view class="result-header">
      <text class="header-title">你的选校诊断结果</text>
      <view class="header-profile">
        <text class="profile-item">👤 {{ profileText }}</text>
        <text class="profile-item">🎓 {{ educationText }} · {{ partyText }}</text>
        <text class="profile-item">🎯 目标：{{ goalText }}</text>
      </view>
    </view>

    <!-- 区块2：首选推荐 -->
    <view v-if="!result.blocked" class="card primary-card">
      <text class="card-badge">⭐ 首选推荐</text>
      <text class="primary-school">{{ result.primary.school }}</text>
      <text class="primary-major">{{ result.primary.major }}</text>
      <view class="primary-info">
        <text class="info-row">学费 {{ result.primary.fee }}</text>
        <text class="info-row">学制 {{ result.primary.duration }}</text>
      </view>
      <view class="reason-block">
        <text class="reason-label">📝 为什么适合你：</text>
        <text class="reason-text">"{{ result.primary.reason }}"</text>
      </view>
      <view class="fit-bar">
        <text class="fit-label">匹配度 {{ result.fitScore }}%</text>
        <view class="fit-track">
          <view class="fit-fill" :style="{ width: result.fitScore + '%' }"></view>
        </view>
      </view>
    </view>

    <!-- 区块3：备选方案 -->
    <view v-else class="card blocked-card">
      <text class="blocked-title">当前更适合先补学历基础</text>
      <text class="blocked-text">{{ result.message }}</text>
      <view class="action-btn primary-btn" @click="showLeadModal">
        <text class="btn-text">获取提升路径建议</text>
      </view>
    </view>

    <view v-if="!result.blocked" class="card alt-card">
      <text class="alt-badge">备选方案</text>
      <text class="alt-school">{{ result.alternative.school }}</text>
      <text class="alt-major">{{ result.alternative.major }}</text>
      <text class="alt-fee">学费 {{ result.alternative.fee }}</text>
      <text class="alt-reason">"{{ result.alternative.reason }}"</text>
    </view>

    <!-- 区块4：相似案例 -->
    <view v-if="!result.blocked && result.matchedCase" class="card case-card">
      <text class="card-section-title">👥 和你情况相似的人</text>
      <view class="case-box">
        <text class="case-name">{{ result.matchedCase.name }} · {{ result.matchedCase.age }}岁</text>
        <text class="case-info">{{ result.matchedCase.city }} · {{ result.matchedCase.position }}</text>
        <text class="case-choice">选了：{{ result.matchedCase.choice }}</text>
        <text class="case-quote">"{{ result.matchedCase.quote }}"</text>
        <text class="case-outcome">结果：{{ result.matchedCase.outcome }}</text>
      </view>
    </view>

    <!-- 区块5：同行对比 -->
    <view v-if="!result.blocked" class="card peer-card">
      <text class="card-section-title">👥 和你相似的学员怎么选的</text>
      <text class="peer-desc">在与你情况相似的 {{ result.peerData.total }} 位学员中：</text>
      <view class="peer-bar-row">
        <view class="peer-bar-fill" :style="{ width: result.peerData.dangxiao + '%' }"></view>
        <text class="peer-bar-label">{{ result.peerData.dangxiao }}% 选党校</text>
      </view>
      <view class="peer-bar-row">
        <view class="peer-bar-fill mpa-fill" :style="{ width: result.peerData.mpa + '%' }"></view>
        <text class="peer-bar-label">{{ result.peerData.mpa }}% 选MPA</text>
      </view>
      <text class="peer-rate">已上岸学员过考率：党校 {{ result.peerData.dangxiaoPassRate }} ｜ 管综 {{ result.peerData.mpaPassRate }}</text>
    </view>

    <!-- 区块6：信任徽章 -->
    <view class="card trust-card">
      <text class="trust-title">📊 研知道过考率（公开透明，行业唯一）</text>
      <view class="trust-numbers">
        <view class="trust-number-box">
          <text class="trust-big-num">40.4%</text>
          <text class="trust-num-label">党校过考率</text>
          <text class="trust-num-year">2025级</text>
        </view>
        <view class="trust-number-box">
          <text class="trust-big-num">87.5%</text>
          <text class="trust-num-label">管综复试辅导上岸率</text>
          <text class="trust-num-year">2026届·含调剂</text>
        </view>
      </view>
      <text class="trust-baseline">全国管综自然过线率约 25%</text>
      <view class="trust-detail" v-if="showTrustDetail">
        <text class="trust-detail-title">怎么算的？</text>
        <text class="trust-detail-text">过考率 = 过线人数 ÷ 总报名人数</text>
        <text class="trust-detail-text">· 不排除弃考者</text>
        <text class="trust-detail-text">· 不只算VIP班</text>
        <text class="trust-detail-text">· 不挑选出勤率高的学员</text>
        <text class="trust-detail-text">· 包含所有报名学员</text>
        <text class="trust-detail-text">数据周期：每年录取结束后更新</text>
        <text class="trust-detail-text">最近更新：2025年8月</text>
      </view>
      <text class="trust-toggle" @click="showTrustDetail = !showTrustDetail">
        {{ showTrustDetail ? '收起' : '怎么算的？点击查看' }}
      </text>
    </view>

    <!-- 提醒信息 -->
    <view v-if="result.warnings && result.warnings.length" class="card warning-card">
      <text class="warning-title-text">⚠️ 注意事项</text>
      <text v-for="(w, i) in result.warnings" :key="i" class="warning-item">{{ w }}</text>
    </view>

    <!-- 区块7：行动区 -->
    <view class="action-section">
      <text class="action-title">想了解更多？</text>
      <view class="action-btn primary-btn" @click="showLeadModal">
        <text class="btn-text">获取完整报告 + 1对1诊断</text>
        <text class="btn-sub">（免费，顾问3分钟内回复）</text>
      </view>
      <view class="action-btn secondary-btn" @click="shareResult">
        <text class="btn-text-secondary">分享给同事测一测</text>
      </view>
      <view class="action-btn secondary-btn" @click="retest">
        <text class="btn-text-secondary">重新测试</text>
      </view>
    </view>

    <!-- 底部 -->
    <view class="footer">
      <text class="footer-text">研知道 © 2026 · 本结果仅供参考</text>
    </view>

    <!-- 留资弹窗 -->
    <lead-modal v-if="showLead" @close="showLead = false" />
  </view>
</template>

<script>
import { getRecommendation } from '@/data/recommend.js'
import LeadModal from '@/components/LeadModal.vue'

const systemLabels = {
  gov: '党政机关', law: '公检法', township: '乡镇街道',
  public: '教育医疗', soe: '国企', ethnic: '民族地区'
}
const educationLabels = {
  fulltime_bachelor: '全日制本科', parttime_bachelor: '非全日制本科', college: '大专'
}
const goalLabels = {
  promotion: '本单位晋升', transfer: '遴选到上级单位',
  defense: '防御性储备', title: '职称评定', switch: '考虑转公务员'
}
const regionLabels = { sichuan: '四川', chongqing: '重庆' }

export default {
  components: { LeadModal },
  data() {
    return {
      result: {
        primary: {}, alternative: {}, matchedCase: null,
        fitScore: 0, peerData: { total: 0, dangxiao: 0, mpa: 0, dangxiaoPassRate: '', mpaPassRate: '' },
        warnings: [], answers: {}
      },
      showTrustDetail: false,
      showLead: false
    }
  },
  computed: {
    profileText() {
      const a = this.result.answers || {}
      const age = a.age || ''
      const region = regionLabels[a.region] || ''
      const system = systemLabels[a.system] || ''
      return `${age} · ${region} · ${system}`
    },
    educationText() {
      return educationLabels[this.result.answers?.education] || ''
    },
    partyText() {
      return this.result.answers?.party_member === 'yes' ? '党员' : '非党员'
    },
    goalText() {
      return goalLabels[this.result.answers?.goal] || ''
    }
  },
  onLoad() {
    const app = getApp()
    const answers = app.globalData?.quizAnswers
    if (answers) {
      this.result = getRecommendation(answers)
    }
  },
  methods: {
    showLeadModal() {
      this.showLead = true
    },
    shareResult() {
      // 微信分享
      uni.showToast({ title: '分享功能即将上线', icon: 'none' })
    },
    retest() {
      uni.redirectTo({ url: '/pages/quiz/index' })
    }
  }
}
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  background: #F7F8FA;
  padding-bottom: 40rpx;
}

/* 诊断头部 */
.result-header {
  background: linear-gradient(135deg, #1A3A6B 0%, #2A5298 100%);
  padding: 48rpx 32rpx;
}
.header-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 24rpx;
}
.header-profile {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
}
.profile-item {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.8;
}

/* 通用卡片 */
.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  margin: 20rpx 24rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.blocked-card {
  background: linear-gradient(180deg, #fff8ef 0%, #ffffff 100%);
}
.blocked-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #8b4028;
}
.blocked-text {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  line-height: 1.75;
  color: #555f6b;
}

/* 首选推荐 */
.card-badge {
  display: inline-block;
  font-size: 24rpx;
  font-weight: 600;
  color: #D4AF37;
  background: #FFF8E6;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}
.primary-school {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #1A3A6B;
  margin-bottom: 4rpx;
}
.primary-major {
  display: block;
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 20rpx;
}
.primary-info {
  margin-bottom: 20rpx;
}
.info-row {
  display: block;
  font-size: 26rpx;
  color: #666666;
  line-height: 1.8;
}
.reason-block {
  background: #F7F8FA;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}
.reason-label {
  display: block;
  font-size: 26rpx;
  color: #999999;
  margin-bottom: 8rpx;
}
.reason-text {
  display: block;
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
  font-style: italic;
}
.fit-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.fit-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #D4AF37;
  white-space: nowrap;
}
.fit-track {
  flex: 1;
  height: 12rpx;
  background: #EBEEF5;
  border-radius: 6rpx;
  overflow: hidden;
}
.fit-fill {
  height: 100%;
  background: linear-gradient(90deg, #D4AF37, #E8C84A);
  border-radius: 6rpx;
}

/* 备选方案 */
.alt-badge {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #666666;
  margin-bottom: 12rpx;
}
.alt-school {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}
.alt-major, .alt-fee {
  display: block;
  font-size: 26rpx;
  color: #666666;
  margin-top: 4rpx;
}
.alt-reason {
  display: block;
  font-size: 26rpx;
  color: #666666;
  margin-top: 16rpx;
  line-height: 1.6;
  font-style: italic;
}

/* 相似案例 */
.card-section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 20rpx;
}
.case-box {
  background: #F7F8FA;
  border-radius: 12rpx;
  padding: 24rpx;
}
.case-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}
.case-info {
  display: block;
  font-size: 24rpx;
  color: #999999;
  margin-top: 4rpx;
}
.case-choice {
  display: block;
  font-size: 26rpx;
  color: #1A3A6B;
  font-weight: 500;
  margin-top: 16rpx;
}
.case-quote {
  display: block;
  font-size: 26rpx;
  color: #666666;
  margin-top: 12rpx;
  line-height: 1.6;
  font-style: italic;
}
.case-outcome {
  display: block;
  font-size: 24rpx;
  color: #999999;
  margin-top: 12rpx;
}

/* 同行对比 */
.peer-desc {
  display: block;
  font-size: 26rpx;
  color: #666666;
  margin-bottom: 20rpx;
}
.peer-bar-row {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
  gap: 16rpx;
}
.peer-bar-fill {
  height: 24rpx;
  background: #1A3A6B;
  border-radius: 12rpx;
  min-width: 20rpx;
}
.mpa-fill {
  background: #D4AF37;
}
.peer-bar-label {
  font-size: 24rpx;
  color: #666666;
  white-space: nowrap;
}
.peer-rate {
  display: block;
  font-size: 24rpx;
  color: #999999;
  margin-top: 12rpx;
}

/* 信任徽章 */
.trust-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 24rpx;
}
.trust-numbers {
  display: flex;
  gap: 24rpx;
  margin-bottom: 16rpx;
}
.trust-number-box {
  flex: 1;
  text-align: center;
  background: #F7F8FA;
  border-radius: 12rpx;
  padding: 20rpx;
}
.trust-big-num {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #C41E3A;
}
.trust-num-label {
  display: block;
  font-size: 24rpx;
  color: #666666;
  margin-top: 4rpx;
}
.trust-num-year {
  display: block;
  font-size: 22rpx;
  color: #999999;
}
.trust-baseline {
  display: block;
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 16rpx;
}
.trust-detail {
  background: #F7F8FA;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 12rpx;
}
.trust-detail-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 12rpx;
}
.trust-detail-text {
  display: block;
  font-size: 24rpx;
  color: #666666;
  line-height: 1.8;
}
.trust-toggle {
  display: block;
  font-size: 26rpx;
  color: #1A3A6B;
  text-align: center;
  padding: 8rpx;
}

/* 提醒信息 */
.warning-card {
  background: #FFF8E6;
}
.warning-title-text {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 12rpx;
}
.warning-item {
  display: block;
  font-size: 26rpx;
  color: #666666;
  line-height: 1.6;
  margin-bottom: 8rpx;
}

/* 行动区 */
.action-section {
  margin: 20rpx 24rpx;
  padding: 32rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
}
.action-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 24rpx;
  text-align: center;
}
.action-btn {
  margin-bottom: 16rpx;
  border-radius: 16rpx;
  text-align: center;
  padding: 28rpx;
}
.primary-btn {
  background: #C41E3A;
}
.primary-btn:active {
  background: #A8182F;
}
.btn-text {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #FFFFFF;
}
.btn-sub {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4rpx;
}
.secondary-btn {
  background: #F7F8FA;
  border: 1rpx solid #EBEEF5;
}
.secondary-btn:active {
  background: #EBEEF5;
}
.btn-text-secondary {
  font-size: 28rpx;
  color: #666666;
}

/* 底部 */
.footer {
  text-align: center;
  padding: 32rpx;
}
.footer-text {
  font-size: 22rpx;
  color: #CCCCCC;
}
</style>
