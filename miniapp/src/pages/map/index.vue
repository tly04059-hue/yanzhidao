<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">研知道服务同学分布</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page has-tabbar">
      <view class="page-header">
        <text class="page-eyebrow">FROM 1,000+</text>
        <text class="page-title-h2">在川渝的研知道同学</text>
        <text class="page-subtitle">数据来自辅导班报名表 · 四川 21 地市 + 重庆 5 片区</text>
      </view>

      <view class="map-card">
        <view class="map-card-header">
          <text class="map-card-title">分布概览</text>
          <text class="map-card-total"><text class="map-card-strong">1000+</text> 位同学</text>
        </view>
        <view class="map-rule"></view>

        <view class="map-stage" @click="resetSelection">
          <image class="map-base" :src="remoteAssets.map.serviceMap" mode="widthFix" />
          <view
            v-for="city in allCities"
            :key="city.name"
            class="map-hotspot"
            :class="[
              city.region,
              city.ethnic ? 'ethnic' : '',
              selectedCity?.name === city.name ? 'active' : ''
            ]"
            :style="{ left: city.left, top: city.top, width: city.hitSize, height: city.hitSize }"
            @click.stop="selectCity(city)"
          >
            <view class="map-hotspot-ring"></view>
          </view>
        </view>

        <view class="map-detail-panel" :class="{ minority: Boolean(selectedCity?.ethnic) }">
          <view class="map-detail-head">
            <text class="map-detail-name">{{ detailCard.name }}</text>
            <text v-if="detailCard.ethnic" class="map-detail-tag">民族地区</text>
          </view>
          <view class="map-detail-row">
            <text class="map-detail-count">{{ detailCard.countLabel }}</text>
            <text v-if="!detailCard.countLabel.includes('+')" class="map-detail-unit"> 位</text>
          </view>
          <text class="map-detail-systems">{{ detailCard.systems }}</text>
        </view>

        <view class="map-legend-row">
          <view class="legend-dots">
            <view class="legend-item"><view class="legend-dot s1"></view><text class="legend-label">≤20</text></view>
            <view class="legend-item"><view class="legend-dot s2"></view><text class="legend-label">20-50</text></view>
            <view class="legend-item"><view class="legend-dot s3"></view><text class="legend-label">50-150</text></view>
            <view class="legend-item"><view class="legend-dot s4"></view><text class="legend-label">150+</text></view>
            <text class="legend-unit">单位：人</text>
          </view>
        </view>
        <view class="map-color-legend">
          <view class="color-item"><view class="color-swatch sc"></view><text class="color-label">四川地市</text></view>
          <view class="color-item"><view class="color-swatch cq"></view><text class="color-label">重庆片区</text></view>
          <view class="color-item"><view class="color-swatch mn"></view><text class="color-label">民族地区</text></view>
        </view>
      </view>

      <view class="map-browse-card">
        <view class="map-browse-head">
          <text class="map-browse-title">按城市查看</text>
          <text class="map-browse-hint">点击查看分布</text>
        </view>

        <view class="map-tabs">
          <text
            v-for="tab in tabs"
            :key="tab.key"
            class="map-tab"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >{{ tab.label }}</text>
        </view>

        <view class="city-chips">
          <view
            v-for="city in filteredCities"
            :key="city.name"
            class="city-chip"
            :class="{
              active: selectedCity?.name === city.name,
              'city-chip-ethnic': city.ethnic
            }"
            @click="selectCity(city)"
          >
            <text class="city-chip-name">{{ city.name }}</text>
            <text class="city-chip-count">{{ city.countLabel }}</text>
          </view>
        </view>
      </view>

      <view class="map-note">
        <view class="map-note-summary" @click="noteOpen = !noteOpen">
          <view class="map-note-summary-left">
            <view class="map-note-caret" :class="{ open: noteOpen }"></view>
            <view class="map-note-summary-title-wrap">
              <text class="map-note-ic"></text>
              <text class="map-note-summary-title">数据说明</text>
            </view>
          </view>
          <text class="map-note-summary-close">{{ noteOpen ? '×' : '+' }}</text>
        </view>
        <view class="map-note-body collapse-panel" :class="{ open: noteOpen }">
          <text class="map-note-body-title">脱敏与归类规则：</text>
          <view class="map-note-list">
            <view class="map-note-item">
              <text class="map-note-item-bullet">·</text>
              <text class="map-note-item-text">所有数据严格脱敏到<text class="text-bold">地级市层级</text>，不显示区县 / 单位 / 个人</text>
            </view>
            <view class="map-note-item">
              <text class="map-note-item-bullet">·</text>
              <text class="map-note-item-text">四川按 21 个地级市统计（含 3 个民族州）</text>
            </view>
            <view class="map-note-item">
              <text class="map-note-item-bullet">·</text>
              <text class="map-note-item-text">重庆按 5 个地理片区合并（重庆主城 / 万州 / 涪陵 / 永川 / 黔江）</text>
            </view>
            <view class="map-note-item">
              <text class="map-note-item-bullet">·</text>
              <text class="map-note-item-text">样本量较小的合并到地级市层级展示</text>
            </view>
            <view class="map-note-item">
              <text class="map-note-item-bullet">·</text>
              <text class="map-note-item-text">以上数据更新截止 <text class="text-bold">2026年5月</text></text>
            </view>
          </view>
        </view>
      </view>

      <view class="btn-primary" @click="goPage('wechat')">加企微 1 对 1 咨询 ›</view>
      <view class="btn-secondary" @click="goHome">先回首页 ›</view>
    </view>

    <BottomTabBar />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BottomTabBar from '@/components/BottomTabBar.vue'
import { trackNavClick, trackPageView } from '@/api/tracking'
import { remoteAssets } from '@/data/remote-assets'

type TabKey = 'all' | 'sichuan' | 'chongqing'

type CityMapItem = {
  name: string
  count: number
  countLabel: string
  region: 'sichuan' | 'chongqing'
  ethnic: boolean
  left: string
  top: string
  hitSize: string
  systems: string
}

const TOTAL_COUNT = 1592
const SC_TOTAL = 1397
const CQ_TOTAL = 185

const TOTAL_COUNT_LABEL = '1000+'
const SC_TOTAL_LABEL = '1000+'
const CQ_TOTAL_LABEL = '100+'

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const goHome = () => uni.switchTab({ url: '/pages/index/index' })
const goPage = (key: string) => {
  trackNavClick('map', key)
  if (key === 'wechat') uni.navigateTo({ url: '/pages/contact/index' })
}

const activeTab = ref<TabKey>('all')
const noteOpen = ref(true)
const selectedCity = ref<CityMapItem | null>(null)

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'sichuan', label: '四川' },
  { key: 'chongqing', label: '重庆' }
]

const allCities: CityMapItem[] = [
  { name: '成都', count: 344, countLabel: '300+', region: 'sichuan', ethnic: false, left: '51.2%', top: '44.6%', hitSize: '44rpx', systems: '党政机关、教育医疗、国企银行、公检法' },
  { name: '甘孜', count: 142, countLabel: '100+', region: 'sichuan', ethnic: true, left: '21.7%', top: '40.9%', hitSize: '40rpx', systems: '民族地区专项、党政机关、乡镇' },
  { name: '宜宾', count: 118, countLabel: '100+', region: 'sichuan', ethnic: false, left: '56.5%', top: '68.5%', hitSize: '40rpx', systems: '党政机关、国企化工、教育医疗' },
  { name: '凉山', count: 117, countLabel: '100+', region: 'sichuan', ethnic: true, left: '37.3%', top: '76.3%', hitSize: '40rpx', systems: '民族地区专项、党政机关、乡镇' },
  { name: '重庆主城', count: 92, countLabel: '100+', region: 'chongqing', ethnic: false, left: '71.5%', top: '56.7%', hitSize: '34rpx', systems: '党政机关、国企、公检法、教育医疗' },
  { name: '泸州', count: 79, countLabel: '70+', region: 'sichuan', ethnic: false, left: '62.5%', top: '64.9%', hitSize: '34rpx', systems: '党政机关、教育医疗、国企化工' },
  { name: '阿坝', count: 62, countLabel: '60+', region: 'sichuan', ethnic: true, left: '41.3%', top: '24.5%', hitSize: '34rpx', systems: '民族地区专项、党政机关' },
  { name: '南充', count: 51, countLabel: '50+', region: 'sichuan', ethnic: false, left: '68.2%', top: '38.4%', hitSize: '34rpx', systems: '党政机关、乡镇街道' },
  { name: '达州', count: 51, countLabel: '50+', region: 'sichuan', ethnic: false, left: '79%', top: '36.4%', hitSize: '34rpx', systems: '党政机关、乡镇街道' },
  { name: '万州片区', count: 33, countLabel: '50+', region: 'chongqing', ethnic: false, left: '86.7%', top: '41.1%', hitSize: '28rpx', systems: '党政机关、乡镇街道' },
  { name: '永川片区', count: 31, countLabel: '50+', region: 'chongqing', ethnic: false, left: '66.8%', top: '56.8%', hitSize: '28rpx', systems: '党政机关、教育医疗' },
  { name: '乐山', count: 43, countLabel: '40+', region: 'sichuan', ethnic: false, left: '48.5%', top: '61.1%', hitSize: '28rpx', systems: '党政机关、教育医疗' },
  { name: '攀枝花', count: 41, countLabel: '40+', region: 'sichuan', ethnic: false, left: '33.9%', top: '89.2%', hitSize: '28rpx', systems: '国企钢铁、党政机关' },
  { name: '内江', count: 40, countLabel: '40+', region: 'sichuan', ethnic: false, left: '58.5%', top: '56.2%', hitSize: '28rpx', systems: '党政机关、教育医疗' },
  { name: '德阳', count: 38, countLabel: '30+', region: 'sichuan', ethnic: false, left: '55%', top: '39.2%', hitSize: '28rpx', systems: '党政机关、教育医疗' },
  { name: '巴中', count: 37, countLabel: '30+', region: 'sichuan', ethnic: false, left: '74.4%', top: '29%', hitSize: '28rpx', systems: '党政机关、乡镇街道' },
  { name: '广元', count: 36, countLabel: '30+', region: 'sichuan', ethnic: false, left: '65%', top: '26.2%', hitSize: '28rpx', systems: '党政机关、乡镇街道' },
  { name: '绵阳', count: 35, countLabel: '30+', region: 'sichuan', ethnic: false, left: '57%', top: '30.9%', hitSize: '28rpx', systems: '党政机关、科研院所、国企' },
  { name: '资阳', count: 35, countLabel: '30+', region: 'sichuan', ethnic: false, left: '60%', top: '51%', hitSize: '28rpx', systems: '党政机关、乡镇街道' },
  { name: '雅安', count: 34, countLabel: '30+', region: 'sichuan', ethnic: false, left: '41.7%', top: '53.1%', hitSize: '28rpx', systems: '党政机关、教育医疗' },
  { name: '眉山', count: 31, countLabel: '30+', region: 'sichuan', ethnic: false, left: '49.8%', top: '53%', hitSize: '28rpx', systems: '党政机关、乡镇街道' },
  { name: '广安', count: 25, countLabel: '20+', region: 'sichuan', ethnic: false, left: '71.6%', top: '47.3%', hitSize: '24rpx', systems: '党政机关、乡镇街道' },
  { name: '遂宁', count: 23, countLabel: '20+', region: 'sichuan', ethnic: false, left: '62.7%', top: '44.9%', hitSize: '24rpx', systems: '党政机关、乡镇街道' },
  { name: '黔江片区', count: 18, countLabel: '20+', region: 'chongqing', ethnic: false, left: '85.2%', top: '60.8%', hitSize: '22rpx', systems: '党政机关、民族地区延伸' },
  { name: '自贡', count: 15, countLabel: '20+', region: 'sichuan', ethnic: false, left: '56.8%', top: '60.2%', hitSize: '22rpx', systems: '党政机关、乡镇街道' },
  { name: '涪陵片区', count: 11, countLabel: '20+', region: 'chongqing', ethnic: false, left: '74.8%', top: '59.8%', hitSize: '22rpx', systems: '党政机关、国企化工' }
]

const detailCard = computed(() => {
  if (!selectedCity.value) {
    return {
      name: '川渝地区',
      ethnic: false,
      countLabel: TOTAL_COUNT_LABEL,
      percentText: `四川 ${SC_TOTAL_LABEL} · 重庆 ${CQ_TOTAL_LABEL}`,
      systems: '党政机关、教育医疗、国企银行、公检法'
    }
  }
  const percent = ((selectedCity.value.count / TOTAL_COUNT) * 100).toFixed(1)
  return {
    name: selectedCity.value.name,
    ethnic: selectedCity.value.ethnic,
    countLabel: selectedCity.value.countLabel,
    percentText: `占川渝样本 ${percent}%`,
    systems: selectedCity.value.systems
  }
})

const filteredCities = computed(() => {
  const sorted = [...allCities].sort((left, right) => right.count - left.count)
  if (activeTab.value === 'all') return sorted
  return sorted.filter(city => city.region === activeTab.value)
})

const selectCity = (city: CityMapItem) => {
  selectedCity.value = city
  trackNavClick('map', `city-${city.name}`)
}

const resetSelection = () => {
  selectedCity.value = null
}

onMounted(() => {
  trackPageView('map')
})
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }

.page-header { padding: 4px 4px 20px; }

.page-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 0.25em;
  color: $accent;
  font-weight: 500;
  margin-bottom: 6px;

  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    background: $accent;
    flex-shrink: 0;
  }
}

.page-title-h2 {
  @include serif;
  font-weight: 600;
  font-size: 26px;
  line-height: 1.4;
  color: $text-1;
  margin-bottom: 4px;
  display: block;
}

.page-subtitle {
  font-size: 13px;
  color: $text-3;
  letter-spacing: 0.02em;
  display: block;
}

.map-card {
  background: $card;
  border-radius: 20px;
  border: 0.5px solid $border;
  box-shadow: 0 4px 16px rgba(60, 50, 40, 0.06);
  padding: 20px 16px 16px;
  margin-bottom: 16px;
  overflow: hidden;
}

.map-card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 4px;
}

.map-card-title {
  @include serif;
  font-weight: 600;
  font-size: 16px;
  color: $text-1;
}

.map-card-total { font-size: 11px; color: $text-3; }

.map-card-strong {
  @include serif;
  font-weight: 600;
  font-size: 14px;
  color: $accent;
  margin-right: 2px;
}

.map-rule { width: 36px; height: 2px; background: $accent; margin: 8px 0 14px; }

.map-stage {
  position: relative;
  background: $bg-warm;
  border: 1px solid rgba(207, 113, 64, 0.12);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 12px;
}

.map-base {
  display: block;
  width: 100%;
}

.map-hotspot {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;

  &.active .map-hotspot-ring {
    opacity: 1;
    transform: scale(1.08);
  }
}

.map-hotspot-ring {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  border: 3px solid rgba(95, 140, 110, 0.6);
  background: rgba(95, 140, 110, 0.12);
  opacity: 0;
  transition: all 0.2s ease;
}

.map-hotspot.chongqing .map-hotspot-ring {
  border-color: rgba(184, 165, 134, 0.9);
  background: rgba(184, 165, 134, 0.16);
}

.map-hotspot.ethnic .map-hotspot-ring {
  border-color: rgba(95, 140, 110, 0.88);
  background: rgba(95, 140, 110, 0.2);
}

.map-detail-panel {
  background: $accent-soft;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 12px;

  &.minority {
    background: #E8F0E8;
  }
}

.map-detail-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.map-detail-name {
  display: block;
  @include serif;
  font-size: 14px;
  font-weight: 600;
  color: $text-1;
}

.map-detail-tag {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  color: $success;
  background: rgba(95, 140, 110, 0.12);
}

.map-detail-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: wrap;
}

.map-detail-count {
  @include serif;
  font-size: 22px;
  font-weight: 600;
  color: $accent;
}

.map-detail-unit,
.map-detail-percent {
  font-size: 13px;
  color: $accent;
}

.map-detail-percent {
  margin-left: auto;
  color: $text-2;
}

.map-detail-systems {
  display: block;
  font-size: 12px;
  color: $text-2;
  margin-top: 6px;
  line-height: 1.6;
}

.map-legend-row { margin-bottom: 6px; }

.legend-dots {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-dot {
  border-radius: 50%;
  background: #5F8C6E;
  opacity: 0.7;
}

.legend-dot.s1 { width: 8px; height: 8px; }
.legend-dot.s2 { width: 12px; height: 12px; }
.legend-dot.s3 { width: 16px; height: 16px; }
.legend-dot.s4 { width: 20px; height: 20px; }

.legend-label,
.legend-unit,
.color-label {
  font-size: 10px;
  color: $text-3;
}

.legend-unit { margin-left: auto; }

.map-color-legend {
  display: flex;
  gap: 14px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.map-browse-card {
  background: $card;
  border-radius: 18px;
  border: 0.5px solid $border;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  padding: 16px 16px 14px;
  margin-bottom: 14px;
}

.map-browse-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.map-browse-title {
  @include serif;
  font-size: 16px;
  font-weight: 600;
  color: $text-1;
}

.map-browse-hint {
  font-size: 12px;
  color: $text-3;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.color-swatch {
  width: 20px;
  height: 12px;
  border-radius: 3px;

  &.sc { background: #E8DCC8; }
  &.cq { background: #D9C9B0; }
  &.mn { background: #D8E8DB; }
}

.map-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.map-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  background: $card;
  color: $text-2;
  border: 0.5px solid $border;

  &.active {
    background: $text-1;
    color: #fff;
    border-color: $text-1;
    font-weight: 600;
  }
}

.city-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.city-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: #F4ECDD;
  border: 0.5px solid transparent;

  &.city-chip-ethnic {
    background: #DCE8DE;
  }

  &.active {
    background: #CF7140;
    border-color: #CF7140;

    .city-chip-name,
    .city-chip-count {
      color: #fff;
    }
  }
}

.city-chip-name {
  font-size: 12px;
  color: $text-1;
}

.city-chip-count {
  font-size: 11px;
  color: $text-2;
  font-weight: 500;
}

.city-chip-ethnic .city-chip-name,
.city-chip-ethnic .city-chip-count {
  color: #5F8C6E;
}

.map-bottom-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.map-bottom-stat {
  background: $card;
  border-radius: 14px;
  border: 0.5px solid $border;
  padding: 14px 12px;
}

.map-bottom-label {
  display: block;
  font-size: 11px;
  color: $text-3;
  margin-bottom: 4px;
}

.map-bottom-val-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
}

.map-bottom-big {
  @include serif;
  font-size: 20px;
  font-weight: 600;
  color: $accent;
}

.map-bottom-sub {
  font-size: 11px;
  color: $text-3;
}

.map-note {
  background: $card;
  border: 0.5px solid $border;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  overflow: hidden;
  margin-bottom: 16px;
}

.map-note-summary {
  position: relative;
  padding: 13px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.map-note-summary-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.map-note-caret {
  width: 29px;
  height: 29px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 29px;
  opacity: 0.49;
  transform: translateY(-10px);
  animation: arrowBreath 2.2s ease-in-out infinite;
  transition: transform 1.2s ease, opacity 0.8s ease;
}

.map-note-caret::before {
  content: '';
  width: 10px;
  height: 10px;
  border-right: 1.76px solid #CF7140;
  border-bottom: 1.76px solid #CF7140;
  transform: rotate(45deg) translateY(-1px);
  transform-origin: center;
}

.map-note-caret.open {
  transform: translateY(-10px) rotate(180deg);
}

@keyframes arrowBreath {
  0%, 100% {
    opacity: 0.49;
    transform: translateY(-10px);
  }
  50% {
    opacity: 0.49;
    transform: translateY(-2px);
  }
}

.map-note-summary-title-wrap {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
}

.map-note-ic {
  width: 4px;
  height: 4px;
  background: $accent;
  display: inline-block;
  flex: 0 0 4px;
}

.map-note-summary-title {
  font-size: 12px;
  color: $text-1;
  font-weight: 600;
}

.map-note-summary-close {
  font-size: 16px;
  color: $text-3;
  line-height: 1;
  font-weight: 300;
}

.map-note-body {
  padding: 4px 16px 16px;
  padding-top: 12px;
  border-top: 0.5px dashed $divider;
  font-size: 12px;
  color: $text-2;
  line-height: 1.85;
}

.collapse-panel {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 1s ease, opacity 1s ease;
}

.collapse-panel.open {
  max-height: 800px;
  opacity: 1;
}

.map-note-body-title {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: $text-1;
  margin-bottom: 8px;
}

.map-note-list {
  margin-top: 6px;
}

.map-note-item {
  display: flex;
  align-items: flex-start;
  gap: 2px;
  margin-bottom: 4px;
}

.map-note-item:last-child {
  margin-bottom: 0;
}

.map-note-item-bullet {
  color: $accent;
  font-size: 14px;
  line-height: 1.75;
  font-weight: 700;
  flex: 0 0 14px;
  text-align: center;
}

.map-note-item-text {
  flex: 1;
  font-size: 12px;
  line-height: 1.85;
  color: $text-2;
}

.map-note-item-text .text-bold {
  color: $text-1;
  font-weight: 600;
}


</style>
