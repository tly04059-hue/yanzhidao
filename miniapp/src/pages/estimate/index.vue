<template>
  <view class="page-v3">
    <view class="v3-card hero-card">
      <text class="hero-title">估分工具</text>
      <text class="hero-desc">这个模块老板还在进一步确认，提测版先作为占位入口保留，暂不提供正式估分结论。</text>
    </view>

    <view class="v3-card">
      <text class="block-title">规划中</text>
      <text class="block-desc">后续这里会用于输入管综和英语预估分数，结合院校库里的分数线、招生人数和录取率，给出院校风险分层。</text>
    </view>

    <view class="v3-card list-card">
      <view class="list-item">
        <text>数学、逻辑、写作、英语估分</text>
        <text class="status">待确认</text>
      </view>
      <view class="list-item">
        <text>按分数推荐院校档位</text>
        <text class="status">待确认</text>
      </view>
      <view class="list-item">
        <text>结合地区和预算做风险提示</text>
        <text class="status">待确认</text>
      </view>
    </view>

    <view class="v3-card cta">
      <button class="btn-primary" @click="goTest">先测一测适合哪条路径</button>
      <button class="btn-secondary" @click="goLearn">返回了解页</button>
    </view>

    <view class="bottom-tabs">
      <view class="tab" @click="goHome">
        <image class="icon-img" src="/static/icons/tab-home.svg" mode="aspectFit" />
        <text>首页</text>
      </view>
      <view class="tab active" @click="goLearn">
        <image class="icon-img" src="/static/icons/tab-learn-active.svg" mode="aspectFit" />
        <text>了解</text>
      </view>
      <view class="tab" @click="goTest">
        <image class="icon-img" src="/static/icons/tab-test.svg" mode="aspectFit" />
        <text>测一测</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const goHome = () => uni.redirectTo({ url: '/pages/index/index' })
const goLearn = () => uni.redirectTo({ url: '/pages/learn/index' })
const goTest = () => uni.redirectTo({ url: '/pages/test/index' })
</script>

<style lang="scss" scoped>
.hero-title,
.hero-desc,
.block-title,
.block-desc {
  display: block;
}

.hero-title {
  color: #173B3A;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.hero-desc,
.block-desc {
  color: #5F8F96;
  font-size: 14px;
  line-height: 1.6;
}

.block-title {
  color: #079B83;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.status {
  margin-left: auto;
  color: #999999;
  font-size: 12px;
}

.cta button {
  margin-bottom: 10px;
}

.cta button:last-child {
  margin-bottom: 0;
}

.icon-img {
  width: 18px;
  height: 18px;
  display: block;
}
</style>
