<template>
  <view class="page-v3">
    <!-- 顶部导航 -->
    <view class="topbar">
      <view class="topbar-row">
        <view class="tb-btn" @click="goBack">‹</view>
        <text class="tb-title">案例库</text>
        <view class="tb-btn"></view>
      </view>
    </view>

    <view class="v3-card hero-card">
      <text class="hero-title">真实案例库</text>
      <text class="hero-desc">按管综系和党校系整理真实学员路径。这里展示的是匿名案例，重点看相似背景、目标选择、备考风险和下一步动作。</text>
      <view class="case-stats">
        <view class="case-stat">
          <text class="case-stat-value">{{ totalCases }}</text>
          <text class="case-stat-label">匿名案例</text>
        </view>
        <view class="case-stat">
          <text class="case-stat-value">{{ managementCount }}</text>
          <text class="case-stat-label">管综系</text>
        </view>
        <view class="case-stat">
          <text class="case-stat-value">{{ partySchoolCount }}</text>
          <text class="case-stat-label">党校系</text>
        </view>
      </view>
    </view>

    <view class="section-title">筛选</view>
    <view class="chips">
      <text
        v-for="filter in filters"
        :key="filter"
        class="chip"
        :class="{ active: activeFilter === filter }"
        @click="activeFilter = filter"
      >
        {{ filter }}
      </text>
    </view>

    <view class="case-list">
      <view
        v-for="item in filteredCases"
        :key="item.id"
        class="v3-card tappable"
        @click="openCase(item)"
      >
        <view class="case-head">
          <text class="case-system">{{ item.system }}</text>
          <text class="case-program">{{ item.program_type === '党校' ? item.party_school : item.program_type }}</text>
        </view>
        <text class="case-title">{{ item.title }}</text>
        <text class="case-meta">{{ item.profile }}</text>
        <text class="case-choice">目标：{{ item.target }}</text>
        <text class="case-choice">基础：{{ item.baseline }}</text>
        <text class="case-score">{{ item.score }}</text>
        <text class="case-risk">风险：{{ item.risk }}</text>
        <text class="quote">建议：{{ item.advice }}</text>
        <view class="tag-row">
          <text v-for="tag in item.tags.slice(0, 5)" :key="tag" class="mini-tag">{{ tag }}</text>
        </view>
      </view>
    </view>

    <view class="empty-state" v-if="filteredCases.length === 0">
      <text class="empty-title">{{ activeFilter }}案例整理中</text>
      <text class="empty-desc">当前发布层没有该筛选项的匿名案例，后续补充源表后会自动进入案例库。</text>
    </view>

    <view class="v3-card cta">
      <text class="cta-title">不知道自己属于哪类？</text>
      <text class="cta-desc">用 8 道题先生成个人画像，再看院校筛选、风险和本周计划。</text>
      <button class="btn-primary" @click="goTest">测一测我的路径</button>
      <button class="btn-secondary" @click="showConsult">联系顾问看案例</button>
    </view>

    <!-- 案例详情弹窗 -->
    <view v-if="showDetail && selectedCase" class="case-modal-mask" @click="closeDetail">
      <view class="case-modal" @click.stop>
        <!-- 头部 -->
        <view class="case-modal-head">
          <text class="case-modal-title">{{ selectedCase.title }}</text>
          <view class="case-modal-tags">
            <text v-for="tag in selectedCase.tags.slice(0, 4)" :key="tag" class="case-modal-tag">{{ tag }}</text>
          </view>
        </view>

        <!-- 内容区 -->
        <scroll-view class="case-modal-body" scroll-y>
          <view class="case-modal-section">
            <text class="case-modal-label">目标</text>
            <text class="case-modal-value">{{ selectedCase.target }}</text>
          </view>

          <view class="case-modal-divider" />

          <view class="case-modal-section">
            <text class="case-modal-label">基础</text>
            <text class="case-modal-value">{{ selectedCase.baseline }}</text>
          </view>

          <view class="case-modal-divider" />

          <view class="case-modal-section highlight">
            <text class="case-modal-label">测评与投入</text>
            <text class="case-modal-value">{{ selectedCase.score }}</text>
            <text class="case-modal-sub">{{ selectedCase.study_time }}</text>
          </view>

          <view class="case-modal-divider" />

          <view class="case-modal-section warn">
            <text class="case-modal-label">风险</text>
            <text class="case-modal-value">{{ selectedCase.risk }}</text>
          </view>

          <view class="case-modal-divider" />

          <view class="case-modal-section advice">
            <text class="case-modal-label">建议</text>
            <text class="case-modal-value">{{ selectedCase.advice }}</text>
          </view>
        </scroll-view>

        <!-- 底部按钮 -->
        <view class="case-modal-foot">
          <button class="case-modal-btn" @click="closeDetail">确定</button>
        </view>
      </view>
    </view>

    <!-- 联系顾问弹窗 -->
    <view v-if="showConsultModal" class="case-modal-mask consult-mask" @click="closeConsult">
      <view class="consult-modal" @click.stop>
        <view class="consult-modal-head">
          <text class="consult-modal-title">联系顾问</text>
        </view>
        <view class="consult-modal-body">
          <view class="consult-qrcode-item">
            <image class="consult-qrcode-img" src="/static/contact/wechat-official-qrcode.jpg" mode="aspectFit" />
            <text class="consult-qrcode-label">微信公众号</text>
          </view>
          <view class="consult-qrcode-item">
            <image class="consult-qrcode-img" src="/static/contact/wechat-miniapp-qrcode.png" mode="aspectFit" />
            <text class="consult-qrcode-label">企业微信号</text>
          </view>
        </view>
        <view class="consult-modal-foot">
          <button class="case-modal-btn" @click="closeConsult">确定</button>
        </view>
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
import { computed, ref } from 'vue'
import studentCasePayload from '@/data/student-cases-publish.json'

type CaseItem = {
  id: string
  system: string
  program_type: string
  party_school: string
  title: string
  profile: string
  target: string
  baseline: string
  score: string
  study_time: string
  result: string
  risk: string
  advice: string
  tags: string[]
}

const filters = ['全部', '管综系', '党校系', 'MPA', 'MEM', 'MBA', '四川党校', '重庆党校', '25-30', '30-35', '35+']
const activeFilter = ref('全部')
const cases = ref<CaseItem[]>(((studentCasePayload as any).cases || []) as CaseItem[])

const totalCases = computed(() => cases.value.length)
const managementCount = computed(() => cases.value.filter(item => item.system === '管综系').length)
const partySchoolCount = computed(() => cases.value.filter(item => item.system === '党校系').length)

const filteredCases = computed(() => {
  if (activeFilter.value === '全部') return cases.value
  return cases.value.filter(item =>
    item.system === activeFilter.value ||
    item.program_type === activeFilter.value ||
    item.party_school === activeFilter.value ||
    item.tags.includes(activeFilter.value)
  )
})

const selectedCase = ref<CaseItem | null>(null)
const showDetail = ref(false)

const openCase = (item: CaseItem) => {
  selectedCase.value = item
  showDetail.value = true
}

const closeDetail = () => {
  showDetail.value = false
  selectedCase.value = null
}

const showConsultModal = ref(false)

const showConsult = () => {
  showConsultModal.value = true
}

const closeConsult = () => {
  showConsultModal.value = false
}

const goBack = () => uni.navigateBack()
const goHome = () => uni.redirectTo({ url: '/pages/index/index' })
const goLearn = () => uni.redirectTo({ url: '/pages/learn/index' })
const goTest = () => uni.redirectTo({ url: '/pages/test/index' })
const goContact = () => uni.redirectTo({ url: '/pages/contact/index' })
</script>

<style lang="scss" scoped>
.page-v3 {
  padding: 0 20px;
  padding-bottom: 92px;
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
  margin: 0 -20px;
}

.topbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.tb-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Songti SC", serif;
  font-size: 28px;
  color: #2A251E;
}

.hero-title {
  display: block;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}

.hero-desc {
  display: block;
  font-size: 14px;
  line-height: 1.6;
  color: #5F8F96;
}

.case-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 16px;
}

.case-stat {
  background: #F7FBFA;
  border: 1px solid #D7ECE8;
  border-radius: 8px;
  padding: 10px 8px;
  text-align: center;
}

.case-stat-value {
  display: block;
  color: #079B83;
  font-size: 18px;
  font-weight: 700;
}

.case-stat-label {
  display: block;
  color: #5F8F96;
  font-size: 11px;
  margin-top: 2px;
}

.case-list {
  margin-top: 12px;
}

.case-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.case-system,
.case-program,
.mini-tag {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 1;
}

.case-system {
  color: #079B83;
  background: #DFF3EF;
}

.case-program {
  color: #C06636;
  background: #F4E6DC;
}

.case-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 10px;
}

.case-meta,
.case-tags,
.cta-desc {
  display: block;
  color: #999999;
  font-size: 13px;
  line-height: 1.7;
  margin-bottom: 14px;
}

.case-choice {
  display: block;
  margin-top: 10px;
  margin-bottom: 10px;
  color: #1269E8;
  font-size: 14px;
}

.case-score {
  display: block;
  color: #C06636;
  font-size: 13px;
  line-height: 1.6;
  margin-top: 10px;
  margin-bottom: 10px;
}

.case-risk {
  display: block;
  color: #8AB500;
  font-size: 13px;
  line-height: 1.6;
  margin-top: 10px;
  margin-bottom: 10px;
}

.quote {
  display: block;
  color: #333333;
  font-size: 14px;
  line-height: 1.65;
  margin: 14px 0;
  padding: 12px 16px;
  background: #FAF7F2;
  border-radius: 10px;
  border-left: 3px solid #C06636;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.mini-tag {
  color: #6B6258;
  background: #F0E9DD;
}

.cta-title {
  display: block;
  color: #079B83;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 6px;
}

.cta-desc {
  margin-bottom: 16px;
}

.cta button {
  margin-bottom: 10px;
}

.cta button:last-child {
  margin-bottom: 0;
}

/* 案例详情弹窗 */
.case-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}

.case-modal {
  width: 100%;
  max-height: 80vh;
  background: #FFFFFF;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.case-modal-head {
  background: #F5EFE7;
  padding: 28px 24px 20px;
  text-align: center;
  flex-shrink: 0;
}

.case-modal-title {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 20px;
  font-weight: 700;
  color: #2A251E;
  line-height: 1.4;
  margin-bottom: 12px;
}

.case-modal-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.case-modal-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  color: #6B6258;
  background: #ECE5D8;
}

.case-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.case-modal-section {
  padding: 12px 0;
}

.case-modal-section.highlight {
  background: #F7FBFA;
  border-radius: 12px;
  padding: 16px;
  margin: 4px 0;
}

.case-modal-section.warn {
  background: #FFF5F0;
  border-radius: 12px;
  padding: 16px;
  margin: 4px 0;
}

.case-modal-section.warn .case-modal-label {
  color: #CF7140;
}

.case-modal-section.warn .case-modal-value {
  color: #A05030;
}

.case-modal-section.advice {
  background: #F0F6F3;
  border-radius: 12px;
  padding: 16px;
  margin: 4px 0;
}

.case-modal-section.advice .case-modal-label {
  color: #5F8C6E;
}

.case-modal-section.advice .case-modal-value {
  color: #3D5A48;
}

.case-modal-label {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 12px;
  font-weight: 600;
  color: #8A8175;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.case-modal-value {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 15px;
  color: #2A251E;
  line-height: 1.65;
  word-wrap: break-word;
  white-space: normal;
  overflow-wrap: break-word;
}

.case-modal-sub {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 13px;
  color: #8A8175;
  margin-top: 4px;
}

.case-modal-divider {
  height: 1px;
  background: #ECE5D8;
  margin: 4px 0;
}

.case-modal-foot {
  padding: 16px 24px 24px;
  border-top: 1px solid #ECE5D8;
  flex-shrink: 0;
}

.case-modal-btn {
  width: 100%;
  height: 48px;
  background: #CF7140;
  color: #FFFFFF;
  border: none;
  border-radius: 999px;
  font-family: "Songti SC", serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(207, 113, 64, 0.22);
}

/* 联系顾问弹窗 */
.consult-mask {
  padding: 24px 16px;
}

.consult-modal {
  width: 100%;
  max-width: 340px;
  background: #FFFFFF;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.consult-modal-head {
  background: #F5EFE7;
  padding: 24px 20px 16px;
  text-align: center;
  flex-shrink: 0;
}

.consult-modal-title {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 20px;
  font-weight: 700;
  color: #2A251E;
  line-height: 1.4;
}

.consult-modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.consult-qrcode-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #F8F8FF;
  border: 1px solid #D5D8F8;
  border-radius: 12px;
  padding: 12px 16px;
  width: 100%;
}

.consult-qrcode-img {
  width: 200px;
  height: 200px;
  display: block;
}

.consult-qrcode-label {
  display: block;
  margin-top: 8px;
  font-family: "Songti SC", serif;
  font-size: 14px;
  color: #2A251E;
  font-weight: 600;
}

.consult-modal-foot {
  padding: 12px 24px 24px;
  border-top: 1px solid #ECE5D8;
  flex-shrink: 0;
}
</style>
