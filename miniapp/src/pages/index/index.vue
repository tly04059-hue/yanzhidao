<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side"></view>
      <text class="v6-nav-title">研知道</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page home-page has-tabbar">
      <view class="brand-row">已服务1000+川渝同学 · 不骗人 · 真服务</view>

      <!-- Hero 大白卡：6月考/12月考 双路径 -->
      <view class="hero-card">
        <view class="hero-card-top-fade"></view>
        <view class="hero-card-heading">
          <text class="hero-title">研知道，川渝在职考研</text>
          <text class="hero-copy">已服务川渝1000+同学，两大主流在职考研路径</text>
        </view>

        <view class="path-stats">
          <view class="path-stat-card">
            <view class="ps-link-top" @click="goPage('prep')">
              <text class="ps-headline">6月考</text>
              <view class="ps-desc">
                <text class="ps-desc-strong">川渝党校在职研究生</text>
                <text class="ps-desc-line">四川3个专业 / 重庆5个专业</text>
                <text class="ps-desc-line">单证 / 体制内认可</text>
                <text class="ps-desc-line">体制人专属的读研路径</text>
              </view>
            </view>
            <view class="ps-divider"></view>
            <view class="ps-link-bottom" @click="goPage('pass-rate')">
              <text class="ps-rate-title">辅导过考率</text>
              <view class="ps-rate-row">
                <text class="ps-rate-line">四川党校 2025年 <text class="text-accent">40.4%</text></text>
                <text class="ps-rate-line">重庆党校 2025年 <text class="text-accent">44%</text></text>
              </view>
              <text class="ps-arrow">→</text>
            </view>
          </view>
          <view class="path-stat-card">
            <view class="ps-link-top" @click="goPage('prep')">
              <text class="ps-headline">12月考</text>
              <view class="ps-desc">
                <text class="ps-desc-strong">统考非全日制研究生</text>
                <text class="ps-desc-line">MPA / MBA / MEM</text>
                <text class="ps-desc-line">双证 / 学信网可查</text>
                <text class="ps-desc-line">国民教育在职读研路径</text>
              </view>
            </view>
            <view class="ps-divider"></view>
            <view class="ps-link-bottom" @click="goPage('pass-rate')">
              <text class="ps-rate-title">辅导过考率</text>
              <view class="ps-rate-row">
                <text class="ps-rate-line">26年初试辅导 <text class="text-accent">55.6%</text></text>
                <text class="ps-rate-line">26年复试辅导 <text class="text-accent">87.5%</text></text>
              </view>
              <text class="ps-arrow">→</text>
            </view>
          </view>
        </view>
        <text class="metric-hint" @click="goPage('pass-rate')">点数字看「过考率怎么算的」</text>
      </view>

      <!-- §1 三类用户分流 -->
        <view class="section">
          <view class="section-head section-head-inline">
          <view class="entry-head-shell" @click="toggleEntrySection">
            <view class="section-head-top">
              <text class="section-head-title">你现在更像哪种状态</text>
              <text class="entry-head-meta">3 个入口</text>
            </view>
            <view class="entry-toggle">
              <view class="entry-toggle-arrow" :class="{ open: entrySectionOpen, drift: arrowDriftDown && !entrySectionOpen }"></view>
            </view>
          </view>
        </view>
        <view class="collapse-panel" :class="{ open: entrySectionOpen }">
          <view class="collapse-panel-inner entry-grid">
            <view class="entry-btn" @click="goTab('learn')">
              <text class="entry-btn-title">先了解</text>
              <text class="entry-btn-desc">还没决定，看看学历有什么用，了解院校和真实案例。</text>
              <text class="entry-btn-action">浏览政策、案例、院校信息 →</text>
            </view>
            <view class="entry-btn" @click="goTab('test')">
              <text class="entry-btn-title">测一测</text>
              <text class="entry-btn-desc">有想法，快速判断适合党校单证还是统考非全双证。</text>
              <text class="entry-btn-action">3 分钟得到第一轮建议 →</text>
            </view>
            <view class="entry-btn" @click="goPage('prep')">
              <text class="entry-btn-title">看看备考时间节奏</text>
              <text class="entry-btn-desc">了解不同考研路径的区别、报考条件和时间安排。</text>
              <text class="entry-btn-action">党校在职研究生 vs 统考非全研究生 →</text>
            </view>
          </view>
        </view>
      </view>

      <!-- §2 院校/案例/咨询 -->
        <view class="section">
          <view class="section-head section-head-inline">
          <view class="entry-head-shell" @click="toggleResourceSection">
            <view class="section-head-top">
              <text class="section-head-title">院校/案例/咨询/资料下载</text>
            </view>
            <view class="entry-toggle">
              <view class="entry-toggle-arrow" :class="{ open: resourceSectionOpen, drift: arrowDriftDown && !resourceSectionOpen }"></view>
            </view>
          </view>
        </view>
        <view class="collapse-panel" :class="{ open: resourceSectionOpen }">
          <view class="collapse-panel-inner list-card home-list">
            <view class="list-item" @click="goPage('schools')">
              <text class="list-item-label">院校库查询</text>
              <text class="list-item-arrow">→</text>
            </view>
            <view class="list-item" @click="goPage('cases')">
              <text class="list-item-label">1,000+ 同学真实案例</text>
              <text class="list-item-arrow">→</text>
            </view>
            <view class="list-item" @click="goPage('map')">
              <text class="list-item-label">1,000+ 同学的川渝分布</text>
              <text class="list-item-arrow">→</text>
            </view>
            <view class="list-item emphasis" @click="goPage('wechat')">
              <text class="list-item-label">加企业微信1对1咨询</text>
              <text class="list-item-arrow">→</text>
            </view>
            <view class="list-item" @click="goPage('downloads')">
              <text class="list-item-label">资料下载</text>
              <text class="list-item-arrow">→</text>
            </view>
            <view class="list-item" @click="goPage('data-source')">
              <text class="list-item-label">数据来源与说明</text>
              <text class="list-item-arrow">→</text>
            </view>
            <view class="list-item" @click="goPage('usage')">
              <text class="list-item-label">使用说明</text>
              <text class="list-item-arrow">→</text>
            </view>
            <view class="list-item" @click="goPage('about')">
              <text class="list-item-label">关于研知道</text>
              <text class="list-item-arrow">→</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 刊尾 -->
      <view class="footer-sign">
        <text class="footer-sign-title">不骗人 · 真服务</text>
        <text class="footer-sign-sub">研知道 · 成立于 2021 年</text>
      </view>

    </view>
  <BottomTabBar />
  </view>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BottomTabBar from '@/components/BottomTabBar.vue'
import { trackPageView, trackTabClick, trackNavClick } from '@/api/tracking'
const routeMap: Record<string, string> = {
  schools: '/pages/schools/index',
  cases: '/pages/cases/index',
  map: '/pages/map/index',
  downloads: '/pages/downloads/index',
  wechat: '/pages/contact/index',
  'data-source': '/pages/data-source/index',
  usage: '/pages/usage/index',
  about: '/pages/about/index',
  prep: '/pages/prep/index',
  'pass-rate': '/pages/pass-rate/index',
  result: '/pages/result/index',
  zexiao: '/pages/zexiao/index',
}

const entrySectionOpen = ref(false)
const resourceSectionOpen = ref(false)
const arrowDriftDown = ref(false)
let arrowDriftTimer: ReturnType<typeof setInterval> | null = null
const goPage = (key: string) => {
  trackNavClick('home', key)
  const url = routeMap[key]
  if (url) uni.navigateTo({ url })
}

const goTab = (tab: string) => {
  const tabMap: Record<string, string> = {
    home: '/pages/index/index',
    learn: '/pages/learn/index',
    test: '/pages/test/index',
  }
  trackTabClick('home', tab, tabMap[tab] || '')
  uni.switchTab({ url: tabMap[tab] || '/pages/index/index' })
}

const toggleEntrySection = () => {
  entrySectionOpen.value = !entrySectionOpen.value
}

const toggleResourceSection = () => {
  resourceSectionOpen.value = !resourceSectionOpen.value
}

onMounted(() => {
  trackPageView('home')
  arrowDriftTimer = setInterval(() => {
    arrowDriftDown.value = !arrowDriftDown.value
  }, 1400)
})

// onShow(() => {
//   const pages = getCurrentPages()
//   const page = pages[pages.length - 1] as any
//   if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
//     page.getTabBar().setData({ selected: '/pages/index/index' })
//   }
// })

onUnmounted(() => {
  if (arrowDriftTimer) {
    clearInterval(arrowDriftTimer)
    arrowDriftTimer = null
  }
})
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }

.home-page {
  padding-top: 18px;
}

.home-page.has-tabbar {
  padding-bottom: calc(50px + env(safe-area-inset-bottom, 0px));
}

.home-list .list-item.emphasis .list-item-label {
  color: #CF7140;
  font-weight: 700;
}

.hero-card {
  padding-top: 0;
}

.hero-card-top-fade {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 182px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.18) 28%, rgba(255, 255, 255, 0.56) 68%, rgba(255, 255, 255, 0.94) 100%);
}

.hero-card-heading,
.path-stats,
.metric-hint {
  position: relative;
  z-index: 1;
}

.hero-card-heading {
  min-height: 76px;
  padding: 10px 12px 6px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  transform: translateY(5px);
}

.hero-title,
.hero-copy {
  position: relative;
  z-index: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-title {
  width: 100%;
  font-size: 25px;
  line-height: 1.2;
}

.hero-copy {
  width: 100%;
  font-size: 12px;
  line-height: 1.2;
}

.section-head-inline {
  width: 100%;
  align-items: flex-start;
  flex-direction: column;
  gap: 6px;
}

.section {
  margin-bottom: 9px;
}

.entry-head-shell {
  width: 100%;
  padding: 14px 10px 4px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(207, 113, 64, 0.04) 0%, rgba(207, 113, 64, 0.015) 68%, rgba(207, 113, 64, 0) 100%);
  cursor: pointer;
}

.section-head-top {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-head-title {
  flex: 1;
  display: block;
  text-align: left;
  padding: 0;
}

.entry-head-meta {
  flex-shrink: 0;
  max-width: 120px;
  padding-right: 10px;
  color: #8A8175;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.08em;
  text-align: right;
}

.path-stats {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.entry-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 24px;
  margin-top: 8px;
  border-radius: 10px;
  background: transparent;
}

.entry-toggle-text {
  display: none;
}

.entry-toggle-arrow {
  width: 29px;
  height: 29px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: transparent;
  flex-shrink: 0;
  transform: translateY(0);
  opacity: 0.49;
  animation: arrowBreath 2.2s ease-in-out infinite;
  transition: transform 1.2s ease, opacity 0.8s ease;
}

.entry-toggle-arrow::before {
  content: '';
  width: 10px;
  height: 10px;
  border-right: 1.76px solid #CF7140;
  border-bottom: 1.76px solid #CF7140;
  transform: rotate(45deg) translateY(-1px);
  transform-origin: center;
}

.entry-toggle-arrow.open {
  transform: translateY(0) rotate(180deg);
}

.entry-toggle-arrow.drift {
  transform: translateY(4px);
  opacity: 0.49;
}

@keyframes arrowBreath {
  0%, 100% {
    opacity: 0.49;
    box-shadow: 0 0 0 rgba(207, 113, 64, 0);
  }
  50% {
    opacity: 0.49;
    box-shadow: 0 0 4px rgba(207, 113, 64, 0.08);
  }
}

.collapse-panel {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transition: max-height 1s ease, opacity 1s ease, margin-top 1s ease;
  margin-top: 0;
}

.collapse-panel.open {
  max-height: 1200px;
  opacity: 1;
  pointer-events: auto;
  margin-top: 8px;
}

.collapse-panel-inner {
  transform: translateY(-10px);
  transition: transform 1s ease, opacity 1s ease;
  opacity: 0;
}

.collapse-panel.open .collapse-panel-inner {
  transform: translateY(0);
  opacity: 1;
}

.collapse-panel:not(.open) .collapse-panel-inner {
  overflow: hidden;
  opacity: 0;
}


.footer-sign {
  padding: 18px 0 8px;
  margin-top: 10px;
}

.ps-rate-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-start;
  row-gap: 6px;
}

.ps-link-top,
.ps-link-bottom {
  display: flex;
  flex-direction: column;
  text-align: left;
  align-items: flex-start;
}

.ps-desc {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.ps-arrow {
  position: static;
  align-self: center;
  margin-top: 10px;
  display: block;
}
</style>
