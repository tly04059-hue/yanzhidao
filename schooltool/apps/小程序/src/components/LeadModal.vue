<template>
  <view class="modal-mask" @click.self="$emit('close')">
    <view class="modal-body">
      <text class="modal-title">获取你的完整选校报告</text>
      <text class="modal-desc">顾问将在3分钟内联系你，为你提供：</text>
      <view class="modal-list">
        <text class="modal-list-item">✓ 详细备考时间线</text>
        <text class="modal-list-item">✓ 往年真题分析</text>
        <text class="modal-list-item">✓ 同系统学员群</text>
      </view>

      <view class="input-box">
        <input
          class="modal-input"
          v-model="wechatId"
          placeholder="你的微信号"
          maxlength="30"
        />
      </view>

      <view class="submit-btn" :class="{ 'btn-disabled': !wechatId.trim() }" @click="submit">
        <text class="submit-text">立即获取</text>
      </view>

      <text class="modal-privacy">🔒 信息仅用于顾问联系，不会外泄</text>

      <text class="modal-close" @click="$emit('close')">×</text>
    </view>
  </view>
</template>

<script>
export default {
  emits: ['close'],
  data() {
    return {
      wechatId: ''
    }
  },
  methods: {
    submit() {
      if (!this.wechatId.trim()) return
      // MVP 阶段仅提示成功，后续接 API
      uni.showToast({ title: '提交成功！顾问将尽快联系你', icon: 'none', duration: 3000 })
      setTimeout(() => {
        this.$emit('close')
      }, 1500)
    }
  }
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-body {
  width: 600rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 48rpx 36rpx;
  position: relative;
}

.modal-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #333333;
  text-align: center;
  margin-bottom: 16rpx;
}

.modal-desc {
  display: block;
  font-size: 26rpx;
  color: #666666;
  text-align: center;
  margin-bottom: 24rpx;
}

.modal-list {
  margin-bottom: 32rpx;
}
.modal-list-item {
  display: block;
  font-size: 26rpx;
  color: #333333;
  line-height: 2;
  padding-left: 20rpx;
}

.input-box {
  margin-bottom: 24rpx;
}
.modal-input {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #EBEEF5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

.submit-btn {
  background: #C41E3A;
  border-radius: 16rpx;
  padding: 28rpx;
  text-align: center;
  margin-bottom: 20rpx;
}
.submit-btn:active {
  background: #A8182F;
}
.btn-disabled {
  background: #CCCCCC;
}
.submit-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #FFFFFF;
}

.modal-privacy {
  display: block;
  font-size: 22rpx;
  color: #999999;
  text-align: center;
}

.modal-close {
  position: absolute;
  top: 20rpx;
  right: 28rpx;
  font-size: 40rpx;
  color: #CCCCCC;
  padding: 10rpx;
}
</style>
