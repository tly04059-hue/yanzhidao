<template>
  <view class="page-v3">
    <!-- 顶部导航 -->
    <view class="topbar">
      <view class="tb-btn" @click="goBack">‹</view>
      <text class="tb-title">路径对比</text>
      <view class="tb-btn"></view>
    </view>

    <!-- Hero -->
    <view class="hero">
      <text class="kicker">Compare</text>
      <text class="hero-title"><text class="accent">两条路</text>并排看清楚</text>
      <text class="hero-desc">党校在职研 vs 非全日制 MPA——9 个维度直接对照，不绕弯子。</text>
    </view>

    <!-- 切换器 -->
    <view class="switcher-row">
      <view class="switcher">
        <view
          class="sw-chip"
          :class="{ active: switchType === 'party_mpa' }"
          @click="switchType = 'party_mpa'"
        >党校 vs MPA</view>
        <view
          class="sw-chip"
          :class="{ active: switchType === 'sc_cq_party' }"
          @click="switchType = 'sc_cq_party'"
        >川渝党校</view>
        <view
          class="sw-chip"
          :class="{ active: switchType === 'mpa_tong' }"
          @click="switchType = 'mpa_tong'"
        >MPA vs 同等学力</view>
      </view>
    </view>

    <!-- 对比表 -->
    <view class="compare-section">
      <view class="compare-card">
        <!-- 表头 -->
        <view class="compare-head">
          <text class="col col-label">维度</text>
          <text class="col col-a">{{ compareConfig.pathA }}</text>
          <text class="col col-b">{{ compareConfig.pathB }}</text>
        </view>
        <!-- 数据行 -->
        <view
          v-for="row in currentCompareData"
          :key="row.label"
          class="compare-row"
        >
          <text class="cell label">{{ row.label }}</text>
          <text class="cell v" :class="row.tagA">{{ row.valueA }}</text>
          <text class="cell v" :class="row.tagB">{{ row.valueB }}</text>
        </view>
      </view>
    </view>

    <!-- 适合谁 -->
    <view class="fit-section">
      <view class="section-head">
        <text class="section-title">哪种适合你？</text>
      </view>
      <view class="fit-grid">
        <view class="fit-card green">
          <text class="fit-label">党校系适合</text>
          <text class="fit-name">"我要硬条件"</text>
          <view class="fit-list">
            <text>已在体制内</text>
            <text>不想考联考</text>
            <text>不在意有无学历证</text>
            <text>预算有限</text>
            <text>35 岁以上</text>
          </view>
        </view>
        <view class="fit-card warm">
          <text class="fit-label">MPA 适合</text>
          <text class="fit-name">"我要全套"</text>
          <view class="fit-list">
            <text>体制内 + 想转岗</text>
            <text>愿意花时间备考</text>
            <text>要双证含金量</text>
            <text>预算 6-12 万</text>
            <text>28-35 岁主力</text>
          </view>
        </view>
      </view>
    </view>

    <!-- CTA -->
    <view class="cta-bar">
      <view class="cta-btn" @click="goTest">
        <text class="cta-text">对比完想测？· 3 分钟测一测</text>
        <text class="cta-arrow">→</text>
      </view>
    </view>

    <!-- Tab Bar -->
    <view class="tab-bar">
      <view class="tab-item" @click="goHome">
        <image class="tab-icon-img" src="/static/icons/tab-home.svg" mode="aspectFit" />
        <text class="tab-label">首页</text>
      </view>
      <view class="tab-item" @click="goLearn">
        <image class="tab-icon-img" src="/static/icons/tab-learn.svg" mode="aspectFit" />
        <text class="tab-label">了解</text>
      </view>
      <view class="tab-item" @click="goTest">
        <image class="tab-icon-img" src="/static/icons/tab-test.svg" mode="aspectFit" />
        <text class="tab-label">测一测</text>
      </view>
      <view class="tab-item" @click="goContact">
        <image class="tab-icon-img" src="/static/icons/tab-contact.svg" mode="aspectFit" />
        <text class="tab-label">咨询</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const switchType = ref<'party_mpa' | 'sc_cq_party' | 'mpa_tong'>('party_mpa')

const compareConfig = computed(() => {
  if (switchType.value === 'party_mpa') {
    return {
      pathA: '党校在职研',
      pathB: '非全日制 MPA',
      data: [
        { label: '是否双证', valueA: '单证', tagA: '', valueB: '双证', tagB: 'good' },
        { label: '是否联考', valueA: '免联考', tagA: 'good', valueB: '需联考', tagB: 'warn' },
        { label: '学费', valueA: '¥ 2.16-2.4 万', tagA: 'good', valueB: '¥ 6-12 万', tagB: '' },
        { label: '学制', valueA: '3 年', tagA: '', valueB: '2.5-3 年', tagB: '' },
        { label: '上课时间', valueA: '集中 / 每月集中', tagA: '', valueB: '周末 / 集中', tagB: '' },
        { label: '体制内认可', valueA: '高', tagA: 'good', valueB: '高', tagB: 'good' },
        { label: '社会认可', valueA: '中', tagA: '', valueB: '高', tagB: 'good' },
        { label: '考试难度', valueA: '中低', tagA: 'good', valueB: '中-高', tagB: 'warn' },
        { label: '综合性价比', valueA: '很高', tagA: 'good', valueB: '较高', tagB: '' }
      ]
    }
  }
  if (switchType.value === 'sc_cq_party') {
    return {
      pathA: '重庆党校',
      pathB: '四川党校',
      data: [
        { label: '是否要党员', valueA: '否', tagA: 'good', valueB: '是', tagB: 'warn' },
        { label: '工作年限', valueA: '2 年', tagA: 'good', valueB: '3 年', tagB: '' },
        { label: '招生范围', valueA: '川渝两地', tagA: 'good', valueB: '四川为主', tagB: '' },
        { label: '招生数量', valueA: '900 人', tagA: 'good', valueB: '600 人', tagB: '' },
        { label: '专业数量', valueA: '5 个专业', tagA: 'good', valueB: '3 个专业', tagB: '' },
        { label: '考试题型', valueA: '全主观题', tagA: '', valueB: '政治含选择题', tagB: '' },
        { label: '上课节奏', valueA: '每月 1 次 3 天', tagA: 'good', valueB: '每年 4 次 5 天', tagB: '' },
        { label: '学费', valueA: '¥ 2.4 万', tagA: 'good', valueB: '¥ 2.16 万', tagB: 'good' },
        { label: '最新过考率', valueA: '13.5% / 22.5%', tagA: 'good', valueB: '9.8% / 15%', tagB: '' }
      ]
    }
  }
  return {
    pathA: '非全日制 MPA',
    pathB: '同等学力',
    data: [
      { label: '是否双证', valueA: '双证', tagA: 'good', valueB: '单证', tagB: '' },
      { label: '是否联考', valueA: '需联考', tagA: 'warn', valueB: '免联考', tagB: 'good' },
      { label: '学费', valueA: '¥ 6-12 万', tagA: '', valueB: '¥ 2-4 万', tagB: 'good' },
      { label: '学制', valueA: '2.5-3 年', tagA: '', valueB: '2 年', tagB: '' },
      { label: '上课时间', valueA: '周末 / 集中', tagA: '', valueB: '周末', tagB: '' },
      { label: '体制内认可', valueA: '高', tagA: 'good', valueB: '高', tagB: 'good' },
      { label: '社会认可', valueA: '高', tagA: 'good', valueB: '中', tagB: '' },
      { label: '考试难度', valueA: '中-高', tagA: 'warn', valueB: '低', tagB: 'good' },
      { label: '综合性价比', valueA: '较高', tagA: '', valueB: '高', tagB: 'good' }
    ]
  }
})

const currentCompareData = computed(() => compareConfig.value.data)

const goBack = () => uni.navigateBack()
const goHome = () => uni.redirectTo({ url: '/pages/index/index' })
const goLearn = () => uni.redirectTo({ url: '/pages/learn/index' })
const goTest = () => uni.redirectTo({ url: '/pages/test/index' })
const goContact = () => uni.redirectTo({ url: '/pages/contact/index' })
</script>

<style lang="scss" scoped>
/* 按 UI 样本 07_路径对比页.html 规范编写 */
.page-v3 {
  width: 100%;
  background: #F5EFE7;
  min-height: 100vh;
  padding-bottom: 220px;
  box-sizing: border-box;
}

.topbar {
  background: #FFFFFF;
  padding: 16px 16px 12px;
  border-bottom: 0.5px solid #ECE5D8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tb-btn {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #2A251E;
  font-weight: 300;
}

.tb-title {
  font-family: "Songti SC", serif;
  font-weight: 500;
  font-size: 28px;
  color: #2A251E;
}

.hero {
  padding: 32px 32px 12px;
}

.kicker {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 500;
  font-size: 18px;
  color: #CF7140;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.hero-title {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 26px;
  line-height: 1.3;
  margin-bottom: 14px;
  color: #2A251E;
}

.accent {
  color: #CF7140;
}

.hero-desc {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 18px;
  line-height: 1.7;
  color: #6B6258;
}

/* 切换器 */
.switcher-row {
  padding: 16px 32px;
}

.switcher {
  background: #FFFFFF;
  border: 0.5px solid #ECE5D8;
  border-radius: 14px;
  padding: 6px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px;
}

.sw-chip {
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 19px;
  border-radius: 10px;
  color: #6B6258;
  background: transparent;
}

.sw-chip.active {
  background: #CF7140;
  color: white;
}

/* 对比表 */
.compare-section {
  padding: 16px 32px;
}

.compare-card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 0.5px solid #ECE5D8;
  overflow: hidden;
}

.compare-head {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  background: #F0E9DD;
  border-bottom: 0.5px solid #ECE5D8;
}

.col {
  padding: 16px 14px;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 17px;
  text-align: center;
  color: #6B6258;
}

.col-label {
  text-align: left !important;
  padding-left: 24px !important;
}

.col-a {
  color: #5F8C6E !important;
}

.col-b {
  color: #CF7140 !important;
}

.compare-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  border-bottom: 0.5px solid #E8E1D5;
}

.compare-row:last-child {
  border-bottom: none;
}

.cell {
  padding: 18px 14px;
  font-family: "Songti SC", serif;
  font-size: 17px;
  text-align: center;
  color: #6B6258;
}

.cell.label {
  text-align: left !important;
  padding-left: 24px !important;
}

.cell.v {
  color: #2A251E;
  font-weight: 500;
}

.cell.good {
  color: #5F8C6E;
  font-weight: 600;
}

.cell.warn {
  color: #CF7140;
  font-weight: 600;
}

/* 适合谁 */
.fit-section {
  padding: 24px 32px;
}

.section-head {
  margin-bottom: 16px;
  padding: 0 4px;
}

.section-title {
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 26px;
  color: #2A251E;
}

.fit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.fit-card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 0.5px solid #ECE5D8;
  padding: 24px 22px;
}

.fit-card.green {
  border-top: 4px solid #5F8C6E;
}

.fit-card.warm {
  border-top: 4px solid #CF7140;
}

.fit-label {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 14px;
  letter-spacing: 0.18em;
  margin-bottom: 8px;
}

.fit-card.green .fit-label {
  color: #5F8C6E;
}

.fit-card.warm .fit-label {
  color: #CF7140;
}

.fit-name {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 22px;
  color: #2A251E;
  margin-bottom: 14px;
}

.fit-list {
  display: flex;
  flex-direction: column;
}

.fit-list text {
  font-family: "Songti SC", serif;
  font-size: 16px;
  line-height: 1.7;
  color: #6B6258;
  padding-left: 16px;
  position: relative;
  margin-bottom: 4px;

  &::before {
    content: '·';
    position: absolute;
    left: 4px;
    color: #2A251E;
    font-weight: 700;
  }
}

/* CTA */
.cta-bar {
  height: 46px;
  padding: 0 20px;
  background: #FFFFFF;
  border-top: 0.5px solid #ECE5D8;
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 0;
  z-index: 50;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.cta-btn {
  width: 100%;
  background: #CF7140;
  color: white;
  height: 46px;
  border-radius: 999px;
  box-shadow: 0 6px 20px rgba(207,113,64,0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.cta-text {
  font-family: "Songti SC", serif;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.1em;
  color: white;
}

.cta-arrow {
  font-size: 24px;
  color: white;
}

</style>
