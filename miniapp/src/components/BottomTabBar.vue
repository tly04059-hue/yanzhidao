<template>
  <view class="btb-wrap">
    <view
      v-for="item in tabs"
      :key="item.path"
      class="btb-item"
      :class="{ active: item.path === activePath }"
      @click="go(item.path)"
    >
      <image
        class="btb-icon"
        :src="item.path === activePath ? item.activeIcon : item.icon"
        mode="aspectFit"
      />
      <text class="btb-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 注意：此处与 custom-tab-bar/index.js 和 pages.json tabBar.list 保持同步
const tabs = [
  { text: '首页', path: '/pages/index/index', icon: '/static/tab-home.png', activeIcon: '/static/tab-home-active.png' },
  { text: '了解', path: '/pages/learn/index', icon: '/static/tab-learn.png', activeIcon: '/static/tab-learn-active.png' },
  { text: '测一测', path: '/pages/test/index', icon: '/static/tab-test.png', activeIcon: '/static/tab-test-active.png' },
]

const activePath = computed(() => {
  const pages = getCurrentPages()
  if (!pages.length) return ''
  const route = pages[pages.length - 1].route
  return route ? `/${route}` : ''
})

const go = (path: string) => uni.switchTab({ url: path })
</script>

<style lang="scss" scoped>
.btb-wrap {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 99;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: calc(50px + env(safe-area-inset-bottom, 0px));
  background: #FFFFFF;
  border-top: 1px solid rgba(138, 129, 117, 0.1);
  box-sizing: border-box;
}

.btb-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  min-width: 72px;
  cursor: pointer;
  &:active { opacity: 0.7; }
}

.btb-icon {
  width: 23px;
  height: 23px;
}

.btb-text {
  font-size: 10px;
  font-weight: 400;
  color: #8A8175;
  line-height: 1.2;
}

.btb-item.active .btb-text {
  color: #CF7140;
}
</style>
