<template>
  <view class="loading-page">
    <view class="loading-content">
      <text class="loading-kicker">研知道 · 诊断中</text>
      <text class="loading-title">正在把你的岗位背景、预算和目标拼成一条可执行路径。</text>

      <view class="steps">
        <view v-for="(step, i) in steps" :key="i" class="step-row">
          <text class="step-text">{{ step.text }}</text>
          <text class="step-status">{{ step.done ? '✓' : (step.loading ? '...' : '') }}</text>
        </view>
      </view>

      <text class="loading-note">当前为前端体验版，后续可直接替换为真实推荐数据</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      steps: [
        { text: '分析你所在的系统与岗位语境', done: false, loading: false },
        { text: '判断党校、MPA 还是管理类路径', done: false, loading: false },
        { text: '补上预算、年龄与风险提示', done: false, loading: false },
        { text: '生成可展示的结果结构', done: false, loading: false }
      ]
    }
  },
  onLoad() {
    this.animateSteps()
  },
  methods: {
    animateSteps() {
      let delay = 400
      this.steps.forEach(step => {
        setTimeout(() => {
          step.loading = true
        }, delay)
        delay += 500
        setTimeout(() => {
          step.loading = false
          step.done = true
        }, delay)
        delay += 300
      })

      setTimeout(() => {
        uni.redirectTo({ url: '/pages/result/index' })
      }, delay + 400)
    }
  }
}
</script>

<style scoped>
.loading-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a3a6b 0%, #2a5298 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  padding: 80rpx 60rpx;
  text-align: center;
}

.loading-kicker {
  display: inline-block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba(255, 255, 255, 0.16);
  border-radius: 999rpx;
  padding: 10rpx 18rpx;
  margin-bottom: 24rpx;
}

.loading-title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 60rpx;
  line-height: 1.45;
}

.steps {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 20rpx;
  padding: 36rpx 40rpx;
  margin-bottom: 48rpx;
}

.step-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
}

.step-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
  text-align: left;
  padding-right: 20rpx;
}

.step-status {
  font-size: 28rpx;
  color: #d4af37;
  font-weight: 600;
  min-width: 40rpx;
  text-align: right;
}

.loading-note {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.56);
  line-height: 1.7;
}
</style>
