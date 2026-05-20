<template>
  <view class="page-v3">
    <!-- 微信顶栏 -->
    <view class="wx-nav">
      <view class="wx-nav-r"></view>
      <text class="wx-nav-title">了解</text>
      <view class="wx-nav-r"></view>
    </view>

    <!-- 顶部介绍 -->
    <view class="intro">
      <text class="kicker">Explore</text>
      <text class="intro-title">学历提升</text>
      <text class="intro-subtitle">四个维度<text class="accent">看清楚</text></text>
      <text class="intro-desc">不催你做决定。先看政策、看案例、看院校——再决定要不要测。</text>
    </view>

    <!-- 4 维度浏览 -->
    <view class="dim-section">
      <view class="section-head">
        <text class="section-title">按维度浏览</text>
        <text class="section-meta">04 个角度</text>
      </view>
      <view class="dim-grid">
        <view
          v-for="item in dimCards"
          :key="item.name"
          class="dim-card"
          :class="{ active: activeDim === item.name }"
          @click="toggleDim(item.name)"
        >
          <view class="dim-card-head">
            <view class="dim-icon"><image class="icon-img" :src="item.icon" mode="aspectFit" /></view>
            <text class="dim-label">{{ item.label }}</text>
          </view>
          <text class="dim-name">{{ item.name }}</text>
          <text class="dim-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>

    <!-- 按系统了解 -->
    <view class="system-section" v-if="activeDim === '按系统'">
      <view class="section-head system-head">
        <view class="system-head-center">
          <text class="section-title">三系对比</text>
          <text class="section-sub">核心差异：免不免联考 / 是否双证 / 含金量</text>
        </view>
      </view>

      <view
        v-for="item in systemPaths"
        :key="item.name"
        class="sys-card"
      >
        <view class="sys-row1">
          <view class="sys-icon" :class="{ green: item.highlight }"><image class="icon-img" :src="item.icon" mode="aspectFit" /></view>
          <view class="sys-info">
            <text class="sys-name">{{ item.name }}</text>
            <view class="sys-tag-row">
              <text
                v-for="tag in item.tags"
                :key="tag"
                class="sys-tag"
                :class="{ green: tag.includes('双证') || tag.includes('免联考') }"
              >{{ tag }}</text>
            </view>
          </view>
        </view>
        <view class="sys-row2">
          <view class="sys-fact">
            <text class="sys-fact-v">{{ item.tuition }}</text>
            <text class="sys-fact-l">学费</text>
          </view>
          <view class="sys-fact">
            <text class="sys-fact-v">{{ item.duration }}</text>
            <text class="sys-fact-l">学制</text>
          </view>
          <view class="sys-fact">
            <text class="sys-fact-v">{{ item.mode }}</text>
            <text class="sys-fact-l">模式</text>
          </view>
        </view>
        <text class="sys-desc">{{ item.desc }}</text>
        <view class="sys-actions">
          <view class="sys-btn ghost" @click="goPathSchools(item.filter)">看院校</view>
          <view class="sys-btn" @click="goTestWithPath(item.name)">测一测</view>
        </view>
      </view>
    </view>

    <!-- 怎么选 -->
    <view class="advice-section" v-if="activeDim === '按系统'">
      <view class="section-head">
        <text class="section-title">怎么选？</text>
      </view>
      <view
        v-for="item in adviceCards"
        :key="item.title"
        class="advice-card"
      >
        <view class="advice-icon"><image class="icon-img sm" :src="item.icon" mode="aspectFit" /></view>
        <view class="advice-content">
          <text class="advice-title">{{ item.title }}</text>
          <text class="advice-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>

    <!-- 路径对比 -->
    <view class="compare-section">
      <view class="compare-card" @click="goComparison">
        <view class="compare-head">
          <view class="compare-icon"><image class="icon-img" src="/static/icons/tab-learn-active.svg" mode="aspectFit" /></view>
          <view class="compare-text-wrap">
            <text class="compare-title">路径对比</text>
            <text class="compare-sub">两条路并排看，哪个更适合你</text>
          </view>
          <text class="compare-arrow">›</text>
        </view>
        <view class="compare-paths">
          <view class="compare-path">
            <text class="path-name">党校在职研</text>
            <text class="path-tag">免联考</text>
          </view>
          <text class="vs">VS</text>
          <view class="compare-path">
            <text class="path-name">非全日制 MPA</text>
            <text class="path-tag">联考双证</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 院校库 + 案例库 -->
    <view class="lib-row">
      <view class="lib-card" @click="goSchools">
        <view class="lib-icon"><image class="icon-img" src="/static/icons/tab-learn.svg" mode="aspectFit" /></view>
        <text class="lib-name">院校库</text>
        <text class="lib-desc">{{ schoolLibraryDesc }}</text>
        <view class="lib-meta"><text>查院校</text><text class="lib-arrow">›</text></view>
      </view>
      <view class="lib-card green" @click="goCases">
        <view class="lib-icon green-icon"><image class="icon-img" src="/static/icons/tab-test.svg" mode="aspectFit" /></view>
        <text class="lib-name">案例库</text>
        <text class="lib-desc">60 条已脱敏上岸案例</text>
        <view class="lib-meta green-meta"><text>看案例</text><text class="lib-arrow">›</text></view>
      </view>
    </view>

    <!-- CTA: 引导测一测 -->
    <view class="cta-bar">
      <view class="cta-btn" @click="goTest">
        <text class="cta-text">看了想测？· 3 分钟测一测</text>
        <text class="cta-arrow">→</text>
      </view>
    </view>

    <!-- Tab Bar -->
    <view class="tab-bar">
      <view class="tab-item" @click="goHome">
        <image class="tab-icon-img" src="/static/icons/tab-home.svg" mode="aspectFit" />
        <text class="tab-label">首页</text>
      </view>
      <view class="tab-item active">
        <image class="tab-icon-img" src="/static/icons/tab-learn-active.svg" mode="aspectFit" />
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
import { computed, ref } from 'vue'
import { getAllSchools } from '@/data/school-data'

const activeDim = ref('按系统')

const dimCards = [
  { name: '按系统', icon: '/static/icons/tab-learn-active.svg', label: 'SYSTEM', desc: '党校 / 管综 / 同等学力\n不同制度的取舍' },
  { name: '按目标', icon: '/static/icons/tab-home-active.svg', label: 'GOAL', desc: '晋升 / 遴选 / 转岗\n每个目标对应的路径' },
  { name: '按学历', icon: '/static/icons/tab-learn-active.svg', label: 'LEVEL', desc: '本科 / 大专 / 研究生\n不同起点的合适路径' },
  { name: '按年龄', icon: '/static/icons/tab-test-active.svg', label: 'AGE', desc: '25-30 / 30-35 / 35+\n不同年龄的策略差异' }
]

const systemPaths = [
  {
    name: '党校系',
    icon: '/static/icons/school-party-sc.svg',
    highlight: true,
    filter: '党校系',
    tags: ['免联考', '单证', '体制内友好'],
    tuition: '3-5万',
    duration: '2-3年',
    mode: '非全',
    desc: '党校系更适合已经在体制内、希望用学历作为长期发展硬条件的人。党校数据正在整理中，当前入口先保留。'
  },
  {
    name: '管综系（MPA / MBA / MEM）',
    icon: '/static/icons/school-mpa.svg',
    highlight: false,
    filter: '管综系',
    tags: ['联考', '双证', '全国统招'],
    tuition: '3.6-21.8万',
    duration: '2-3年',
    mode: '全/非全',
    desc: '管综系需要参加 199 管理类联考，认可度和通用性更强。当前已接入 MPA / MEM / MBA 一期可发布院校数据。'
  },
  {
    name: '同等学力申硕',
    icon: '/static/icons/school-mem.svg',
    highlight: false,
    filter: '同等学力',
    tags: ['免联考', '单证', '先入学'],
    tuition: '2-4万',
    duration: '2年',
    mode: '非全',
    desc: '同等学力适合更看重硕士学位、暂时不追求学历证的人。院校数据尚未接入，当前先进入测评判断适配度。'
  }
]

const adviceCards = [
  { no: '①', icon: '/static/icons/tab-home-active.svg', title: '要硬要求 + 不想考', desc: '优先看党校系，性价比高，但要确认单位认可口径。' },
  { no: '②', icon: '/static/icons/tab-learn-active.svg', title: '要双证 + 含金量', desc: '优先看管综系 MPA/MBA/MEM，投入更大，但适用面更宽。' },
  { no: '③', icon: '/static/icons/tab-test-active.svg', title: '不在意学历证', desc: '可以了解同等学力，路径更轻，但证书结果不同。' }
]

const schoolLibraryDesc = computed(() => {
  const schools = getAllSchools()
  const schoolCount = new Set(schools.map(school => school.code)).size
  return `${schoolCount} 所院校 · MPA/MEM/MBA`
})

const toggleDim = (name: string) => {
  activeDim.value = name
}

const goHome = () => uni.redirectTo({ url: '/pages/index/index' })
const goTest = () => uni.redirectTo({ url: '/pages/test/index' })
const goContact = () => uni.redirectTo({ url: '/pages/contact/index' })
const goSchools = () => uni.navigateTo({ url: '/pages/schools/index' })
const goCases = () => uni.navigateTo({ url: '/pages/cases/index' })
const goComparison = () => uni.navigateTo({ url: '/pages/comparison/index' })
const goPathSchools = (filter: string) => {
  uni.navigateTo({ url: `/pages/schools/index?filter=${encodeURIComponent(filter)}` })
}
const goTestWithPath = (pathName: string) => {
  uni.navigateTo({ url: `/pages/test/index?path=${encodeURIComponent(pathName)}` })
}
</script>

<style lang="scss" scoped>
/* 按 UI 样本 02_了解Tab.html 规范编写 */
.page-v3 {
  width: 100%;
  background: #F5EFE7;
  min-height: 100vh;
  padding: 0 0 160px;
  box-sizing: border-box;
}

.wx-nav {
  width: 100%;
  background: #FFFFFF;
  padding: 16px 20px 12px;
  border-bottom: 0.5px solid #ECE5D8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.wx-nav-title {
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 36px;
  color: #2A251E;
}

.wx-nav-r {
  width: 56px;
  height: 56px;
}

.intro {
  padding: 28px 20px 22px;
}

.kicker {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 500;
  font-size: 16px;
  color: #CF7140;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.intro-title {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 36px;
  line-height: 1.3;
  margin-bottom: 4px;
}

.intro-subtitle {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 36px;
  line-height: 1.3;
  margin-bottom: 14px;
}

.accent {
  color: #CF7140;
  font-size: 36px;
}

.intro-desc {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 16px;
  line-height: 1.7;
  color: #6B6258;
}

/* 4 维度浏览 */
.dim-section {
  padding: 20px 20px;
}

.section-head {
  margin-bottom: 20px;
  padding: 0 4px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.section-title {
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 24px;
  color: #2A251E;
}

.section-meta {
  font-family: "Songti SC", serif;
  font-size: 16px;
  color: #8A8175;
}

.dim-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.dim-card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 0.5px solid #ECE5D8;
  padding: 24px 24px;
}

.dim-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.dim-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #F1E0D3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 24px;
  color: #CF7140;
}

.icon-img {
  width: 26px;
  height: 26px;
  display: block;
}

.icon-img.sm {
  width: 20px;
  height: 20px;
}

.dim-label {
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 16px;
  color: #CF7140;
  letter-spacing: 0.16em;
}

.dim-name {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 18px;
  color: #2A251E;
  margin-bottom: 6px;
}

.dim-desc {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 14px;
  line-height: 1.6;
  color: #6B6258;
  white-space: pre-line;
}

.dim-card.active {
  border-color: #CF7140;
  box-shadow: 0 4px 12px rgba(207, 113, 64, 0.14);
}

/* 按系统了解 */
.system-section {
  padding: 16px 20px 22px;
}

.system-head {
  justify-content: center;
  align-items: center;
}

.system-head-center {
  text-align: center;
}

.section-sub {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 16px;
  line-height: 1.55;
  color: #8A8175;
  margin-top: 4px;
}

.sys-card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 0.5px solid #ECE5D8;
  padding: 24px 24px;
  margin-bottom: 18px;
}

.sys-row1 {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
}

.sys-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #F1E0D3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 24px;
  color: #CF7140;
  flex-shrink: 0;
}

.sys-icon.green {
  background: #DAE5DC;
  color: #5F8C6E;
}

.sys-info {
  flex: 1;
}

.sys-name {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 16px;
  color: #2A251E;
  margin-bottom: 6px;
}

.sys-tag-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.sys-tag {
  font-family: "Songti SC", serif;
  font-size: 14px;
  color: #CF7140;
  background: #F1E0D3;
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.04em;
}

.sys-tag.green {
  color: #5F8C6E;
  background: #DAE5DC;
}

.sys-row2 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 0;
  border-top: 0.5px solid #E8E1D5;
}

.sys-fact {
  text-align: center;
}

.sys-fact-v {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 1.25;
  color: #2A251E;
}

.sys-fact-l {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 14px;
  color: #8A8175;
  margin-top: 2px;
  letter-spacing: 0.04em;
}

.sys-desc {
  display: block;
  padding-top: 14px;
  border-top: 0.5px solid #E8E1D5;
  font-family: "Songti SC", serif;
  font-size: 16px;
  line-height: 1.65;
  color: #6B6258;
}

.sys-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 10px;
}

.sys-btn {
  height: 46px;
  border-radius: 999px;
  background: #CF7140;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Songti SC", serif;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.06em;
}

.sys-btn.ghost {
  background: #F1E0D3;
  color: #CF7140;
}

/* 怎么选 */
.advice-section {
  background: #FFFFFF;
  padding: 28px 20px;
  border-top: 16px solid #F5EFE7;
}

.advice-card {
  background: #F5EFE7;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 18px;
  align-items: center;
}

.advice-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: #FFFFFF;
  border: 0.5px solid #ECE5D8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 24px;
  color: #CF7140;
}

.advice-title {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 18px;
  color: #2A251E;
  margin-bottom: 4px;
}

.advice-desc {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 16px;
  line-height: 1.6;
  color: #6B6258;
}

/* 路径对比 */
.compare-section {
  padding: 12px 20px 20px;
}

.compare-card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 0.5px solid #ECE5D8;
  padding: 20px 16px;
}

.compare-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  justify-content: space-between;
}

.compare-text-wrap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
}

.compare-arrow {
  font-size: 24px;
  color: #8A8175;
}

.compare-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #DAE5DC;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 24px;
  color: #5F8C6E;
}

.compare-title {
  display: block;
  color: #2A251E;
  padding: 0;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 24px;
}

.compare-sub {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 14px;
  color: #6B6258;
  letter-spacing: 0.06em;
}

.compare-paths {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 18px 0;
  border-top: 0.5px solid #E8E1D5;
}

.compare-path {
  flex: 1;
  text-align: center;
  padding: 10px;
  background: #F0E9DD;
  border-radius: 12px;
}

.path-name {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 18px;
  color: #2A251E;
}

.path-tag {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 13px;
  color: #8A8175;
  margin-top: 4px;
  letter-spacing: 0.06em;
}

.vs {
  font-family: "Songti SC", serif;
  font-weight: 700;
  font-size: 18px;
  color: #CF7140;
}

/* 院校库 + 案例库 */
.lib-row {
  padding: 12px 20px 22px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.lib-card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 0.5px solid #ECE5D8;
  padding: 22px 20px;
}

.lib-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #F1E0D3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 24px;
  color: #CF7140;
  margin-bottom: 16px;
}

.green-icon {
  background: #DAE5DC;
  color: #5F8C6E;
}

.lib-name {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 18px;
  color: #2A251E;
  margin-bottom: 6px;
}

.lib-desc {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 14px;
  color: #6B6258;
  line-height: 1.6;
  margin-bottom: 12px;
}

.lib-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: "Songti SC", serif;
  font-weight: 500;
  font-size: 14px;
  color: #CF7140;
  letter-spacing: 0.06em;
}

.lib-arrow {
  font-size: 24px;
  color: #CF7140;
}

.green-meta {
  color: #5F8C6E;
}

.green-meta .lib-arrow {
  color: #5F8C6E;
}



/* CTA */
.cta-bar {
  height: 42px;
  padding: 0 12px;
  background: #FFFFFF;
  border-top: 0.5px solid #ECE5D8;
  position: fixed;
  bottom: 72px;
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
  height: 40px;
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
  font-size: 14px;
  letter-spacing: 0.1em;
  color: white;
}

.cta-arrow {
  font-size: 24px;
  color: white;
}

</style>
