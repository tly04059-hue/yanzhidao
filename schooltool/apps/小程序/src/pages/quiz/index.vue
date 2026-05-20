<template>
  <view class="quiz-page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-inner">
        <text class="nav-back" @click="goBack">← 返回</text>
        <text class="nav-progress">{{ showStep }} / {{ totalSteps }}</text>
      </view>
    </view>

    <!-- 进度条 -->
    <view class="progress-bar">
      <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
    </view>

    <!-- 步骤0：系统选择（六宫格） -->
    <view v-if="currentStep === 0" class="question-container">
      <text class="question-kicker">第一个判断</text>
      <text class="question-title">你在哪个系统工作？</text>
      <text class="question-guide">先分工作语境，再决定后面的问题怎么问。</text>
      <view class="system-grid">
        <view
          v-for="item in systemOptions"
          :key="item.id"
          class="system-item"
          :class="{ 'system-selected': answers.system === item.id }"
          @click="selectSystem(item.id)"
        >
          <text class="system-icon">{{ item.icon }}</text>
          <text class="system-label">{{ item.label }}</text>
          <text class="system-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>

    <!-- 后续问题 -->
    <view v-else class="question-container">
      <text class="question-kicker">继续判断</text>
      <text class="question-title">{{ currentQuestion.title }}</text>
      <text v-if="currentQuestion.subtitle" class="question-subtitle">{{ currentQuestion.subtitle }}</text>
      <text v-else class="question-guide">选了就自动进入下一题，不需要手动点下一步。</text>
      <view class="options">
        <view
          v-for="opt in currentOptions"
          :key="opt.value"
          class="option-item"
          :class="{ 'option-selected': selectedValue === opt.value }"
          @click="selectOption(opt.value)"
        >
          <view class="option-radio" :class="{ 'radio-active': selectedValue === opt.value }"></view>
          <text class="option-label">{{ opt.label }}</text>
        </view>
      </view>
    </view>

    <!-- 条件提示 -->
    <view v-if="currentWarning" class="warning-toast">
      <text class="warning-icon">⚠️</text>
      <text class="warning-title">温馨提示</text>
      <text class="warning-text">{{ currentWarning }}</text>
      <text class="warning-btn" @click="currentWarning = ''">知道了</text>
    </view>
  </view>
</template>

<script>
import { systemOptions, questions } from '@/data/questions.js'

export default {
  data() {
    return {
      statusBarHeight: 44,
      systemOptions,
      questions,
      currentStep: 0, // 0=系统选择，1-7=后续问题
      answers: {},
      selectedValue: '',
      currentWarning: '',
      fromHome: false // 是否从首页六宫格进来（已选系统）
    }
  },
  computed: {
    totalSteps() {
      return this.questions.length + 1 // +1 for system selection
    },
    showStep() {
      return this.currentStep + 1
    },
    progressPercent() {
      return Math.round(((this.currentStep + 1) / this.totalSteps) * 100)
    },
    currentQuestion() {
      if (this.currentStep === 0) return null
      return this.questions[this.currentStep - 1]
    },
    currentOptions() {
      if (!this.currentQuestion) return []
      if (this.currentQuestion.dynamicOptions) {
        return this.currentQuestion.dynamicOptions[this.answers.system] || []
      }
      return this.currentQuestion.options || []
    }
  },
  onLoad(options) {
    const sysInfo = uni.getSystemInfoSync()
    this.statusBarHeight = sysInfo.statusBarHeight || 44

    // 从首页六宫格跳转时可能带系统参数
    if (options && options.system) {
      this.answers.system = options.system
      this.fromHome = true
      this.currentStep = 1
    }
  },
  methods: {
    selectSystem(id) {
      this.answers.system = id
      setTimeout(() => {
        this.currentStep = 1
        this.selectedValue = ''
      }, 300)
    },

    selectOption(value) {
      this.selectedValue = value
      const q = this.currentQuestion

      // 保存答案
      this.answers[q.key] = value

      // 检查条件提示
      const warning = this.checkWarning(q.key, value)
      if (warning) {
        this.currentWarning = warning
      }

      // 0.3秒后自动下一题
      setTimeout(() => {
        if (this.currentStep < this.questions.length) {
          this.currentStep++
          this.selectedValue = ''
        } else {
          // 所有题目完成，跳转加载页
          this.goToLoading()
        }
      }, 300)
    },

    checkWarning(key, value) {
      if (key === 'party_member' && value === 'no' && this.answers.region !== 'chongqing') {
        return '四川党校要求中共党员身份。你可以报考重庆党校（不要求党员）或选择MPA院校。系统已自动调整推荐方案。'
      }
      if (key === 'education' && value === 'college') {
        return '大专学历暂不满足在职研究生报考条件。建议先通过成人本科提升学历。'
      }
      if (key === 'age' && value === '25-30' && this.answers.system === 'township') {
        return '乡镇岗位可能有5年最低服务期限制，建议确认服务期是否已满再报考。'
      }
      return ''
    },

    goBack() {
      if (this.currentStep > 0) {
        this.currentStep--
        this.selectedValue = ''
        this.currentWarning = ''
      } else {
        uni.navigateBack()
      }
    },

    goToLoading() {
      // 存到全局，loading页和result页使用
      getApp().globalData = getApp().globalData || {}
      getApp().globalData.quizAnswers = { ...this.answers }
      uni.redirectTo({ url: '/pages/loading/index' })
    }
  }
}
</script>

<style scoped>
.quiz-page {
  min-height: 100vh;
  background: #FFFFFF;
}

/* 导航栏 */
.nav-bar {
  background: #FFFFFF;
}
.nav-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 32rpx;
}
.nav-back {
  font-size: 28rpx;
  color: #666666;
}
.nav-back:active {
  color: #1A3A6B;
}
.nav-progress {
  font-size: 26rpx;
  color: #999999;
}

/* 进度条 */
.progress-bar {
  height: 4rpx;
  background: #EBEEF5;
}
.progress-fill {
  height: 100%;
  background: #1A3A6B;
  transition: width 0.3s ease;
  border-radius: 2rpx;
}

/* 题目区 */
.question-container {
  padding: 60rpx 40rpx;
}
.question-kicker {
  display: inline-block;
  font-size: 22rpx;
  color: #8b4028;
  background: rgba(177, 77, 50, 0.08);
  border-radius: 999rpx;
  padding: 10rpx 16rpx;
  margin-bottom: 24rpx;
}
.question-title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 16rpx;
  line-height: 1.4;
}
.question-subtitle {
  display: block;
  font-size: 26rpx;
  color: #999999;
  margin-bottom: 20rpx;
}
.question-guide {
  display: block;
  font-size: 24rpx;
  color: #7d8691;
  margin-bottom: 20rpx;
}

/* 六宫格 */
.system-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 40rpx;
}
.system-item {
  width: calc(50% - 10rpx);
  background: #F7F8FA;
  border-radius: 16rpx;
  padding: 32rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 3rpx solid transparent;
  transition: all 0.2s;
}
.system-item:active, .system-selected {
  border-color: #1A3A6B;
  background: #F0F4FA;
}
.system-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}
.system-label {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}
.system-desc {
  font-size: 24rpx;
  color: #999999;
  margin-top: 4rpx;
}

/* 选项列表 */
.options {
  margin-top: 40rpx;
}
.option-item {
  display: flex;
  align-items: center;
  padding: 32rpx 28rpx;
  background: #F7F8FA;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  border: 3rpx solid transparent;
  transition: all 0.2s;
}
.option-item:active, .option-selected {
  border-color: #1A3A6B;
  background: #F0F4FA;
}
.option-radio {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 3rpx solid #CCCCCC;
  margin-right: 20rpx;
  flex-shrink: 0;
}
.radio-active {
  border-color: #1A3A6B;
  background: #1A3A6B;
}
.option-label {
  font-size: 30rpx;
  color: #333333;
}

/* 条件提示 */
.warning-toast {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border-top: 1rpx solid #EBEEF5;
  padding: 32rpx;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
  z-index: 100;
}
.warning-icon {
  font-size: 32rpx;
}
.warning-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  margin-left: 8rpx;
}
.warning-text {
  display: block;
  font-size: 26rpx;
  color: #666666;
  margin-top: 16rpx;
  line-height: 1.6;
}
.warning-btn {
  display: block;
  text-align: right;
  font-size: 28rpx;
  color: #1A3A6B;
  font-weight: 500;
  margin-top: 20rpx;
  padding: 8rpx 0;
}
</style>
