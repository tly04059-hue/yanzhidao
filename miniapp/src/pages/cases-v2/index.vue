<template>
  <page-meta :page-style="activeCase ? 'overflow: hidden;' : ''" />
  <view class="shell" :class="{ 'modal-open': activeCase }">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">1000+学员真实选择</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page has-tabbar">
      <view id="cases-v2-hero" class="hero js-track-section">
        <text class="kicker">真实样本</text>
        <text class="hero-h1">1,000+ 川渝学员怎么选</text>
        <text class="hero-sub">以下数据均来自我们的真实学员，全部已做脱敏处理。</text>
      </view>

      <view id="cases-v2-tabs" class="tab-row js-track-section">
        <text
          class="tab-chip"
          :class="{ active: activeTab === 'party_school' }"
          @click="switchTab('party_school')"
        >党校在职研究生</text>
        <text
          class="tab-chip"
          :class="{ active: activeTab === 'management_exam' }"
          @click="switchTab('management_exam')"
        >管综统考非全</text>
      </view>

      <view
        v-for="item in visibleCases"
        :key="item.id"
        :id="`case-card-${item.id}`"
        class="case-card"
        :class="'js-track-section'"
        @click="openDetail(item)"
      >
        <view class="case-header-row">
          <text class="case-card-title">{{ cardTitle(item) }}</text>
          <text class="outcome-badge" :class="outcomeBadgeClass(item.outcomeLabel)">
            {{ item.outcomeLabel }}
          </text>
        </view>

        <text class="case-meta" v-if="caseMeta(item)">{{ caseMeta(item) }}</text>

        <view v-if="shouldShowChosenTarget(item)" class="case-choice-row">
          <text class="case-choice-label">{{ targetLabel(item) }}：</text>
          <text class="case-choice-val">{{ item.chosenTarget }}</text>
        </view>

        <text class="case-quote" v-if="cardNarrative(item)">"{{ cardNarrative(item) }}"</text>
        <text class="case-score" v-if="item.score">{{ item.score }}</text>

        <view class="case-footer-row">
          <view class="case-tags">
            <text v-if="item.systemLabel" class="chip chip-accent">{{ item.systemLabel }}</text>
          </view>
          <view class="case-more-hint">
            <text class="case-more-label">详情</text>
            <view class="chevron-right"></view>
          </view>
        </view>
      </view>

      <view v-if="!visibleCases.length" class="empty-state">
        <text class="empty-title">这一组暂时没有可展示案例</text>
        <text class="empty-desc">可以先切换另一个方向继续看。</text>
      </view>

      <view v-if="hasMore" class="btn-secondary load-more-btn" @click="loadMore">
        继续加载更多案例
      </view>
      <text v-else class="load-more-hint">↓ 已展示当前 V2 数据全部 {{ currentCases.length }} 条</text>

      <view id="cases-v2-conversion" class="conversion-card js-track-section">
        <text class="conversion-title">还不确定自己更像哪一类？</text>
        <text class="conversion-text">先做测一测，再结合案例看路径、院校和备考方式。</text>
        <view class="conversion-actions">
          <view class="btn-primary conversion-btn" @click="goTest">测一测我的路径</view>
          <view class="btn-secondary conversion-btn" @click="goContact">联系顾问看更多案例</view>
        </view>
      </view>
    </view>

    <view v-if="activeCase" class="modal-mask" @click="closeDetail('mask')" @touchmove.stop.prevent></view>

    <view class="modal-sheet" :class="{ 'modal-sheet-open': activeCase }">
      <scroll-view
        v-if="activeCase"
        class="modal-scroll"
        scroll-y
        :show-scrollbar="true"
        @touchmove.stop
      >
      <view class="modal-inner">
        <view class="modal-header">
          <text class="modal-title">{{ cardTitle(activeCase) }}</text>
          <text class="outcome-badge" :class="outcomeBadgeClass(activeCase.outcomeLabel)">
            {{ activeCase.outcomeLabel }}
          </text>
        </view>
        <text v-if="caseMeta(activeCase)" class="modal-subtitle">{{ caseMeta(activeCase) }}</text>

        <view class="modal-divider"></view>

        <view v-if="activeCase.caseType === 'party_school' && shouldShowChosenTarget(activeCase)" class="modal-row">
          <text class="modal-row-label">选了</text>
          <text class="modal-row-val modal-val-accent">{{ activeCase.chosenTarget }}</text>
        </view>

        <view v-else class="modal-row-group">
          <view v-if="shouldShowIntentSchool(activeCase)" class="modal-row">
            <text class="modal-row-label">意向院校</text>
            <text class="modal-row-val modal-val-accent">{{ activeCase.intentSchool }}</text>
          </view>
          <view v-if="activeCase.admittedSchool" class="modal-row">
            <text class="modal-row-label">上岸院校</text>
            <text class="modal-row-val modal-val-accent">{{ activeCase.admittedSchool }}</text>
          </view>
        </view>

        <view v-if="activeCase.caseType === 'party_school' && activeCase.cardQuote" class="modal-section modal-section-motivation">
          <text class="modal-section-label">报考动机</text>
          <text class="modal-section-text">{{ activeCase.cardQuote }}</text>
        </view>

        <view v-if="activeCase.caseType === 'party_school' && activeCase.reflection" class="modal-section modal-section-reflection">
          <text class="modal-section-label">真实反馈</text>
          <text class="modal-section-text">{{ activeCase.reflection }}</text>
        </view>

        <view v-if="activeCase.caseType === 'party_school' && activeCase.studyMethod" class="modal-section modal-section-study">
          <text class="modal-section-label">备考方法</text>
          <text class="modal-section-text">{{ activeCase.studyMethod }}</text>
        </view>

        <view v-if="activeCase.caseType === 'management_exam' && activeCase.examExperience" class="modal-section">
          <text class="modal-section-label">备考经验</text>
          <text class="modal-section-text">{{ activeCase.examExperience }}</text>
        </view>

        <view v-if="activeCase.caseType === 'management_exam' && activeCase.motivation" class="modal-section">
          <text class="modal-section-label">考研动机</text>
          <text class="modal-section-text">{{ activeCase.motivation }}</text>
        </view>

        <view v-if="activeCase.caseType === 'management_exam' && (activeCase.score || activeCase.studyTime || activeCase.baseline)" class="modal-row-group">
          <view v-if="activeCase.baseline" class="modal-row">
            <text class="modal-row-label">基础</text>
            <text class="modal-row-val">{{ activeCase.baseline }}</text>
          </view>
          <view v-if="activeCase.score" class="modal-row">
            <text class="modal-row-label">测评/目标</text>
            <text class="modal-row-val">{{ activeCase.score }}</text>
          </view>
          <view v-if="activeCase.studyTime" class="modal-row">
            <text class="modal-row-label">备考投入</text>
            <text class="modal-row-val">{{ activeCase.studyTime }}</text>
          </view>
        </view>

        <view v-if="activeCase.risk" class="modal-risk-block">
          <text class="modal-risk-label">阻力评估</text>
          <text class="modal-risk-text">{{ activeCase.risk }}</text>
        </view>

        <view v-if="activeCase.advice" class="modal-advice-block">
          <text class="modal-advice-label">备考建议</text>
          <text class="modal-advice-text">{{ activeCase.advice }}</text>
        </view>

        <view v-if="activeCase.goalTags.length" class="modal-tags-row">
          <text
            v-for="tag in activeCase.goalTags"
            :key="tag"
            class="chip chip-goal"
          >{{ tag }}</text>
        </view>

        <view class="modal-cta" @click="closeDetail('acknowledge')">
          <text class="modal-cta-text">知道了</text>
        </view>
      </view>
      </scroll-view>
    </view>

    <BottomTabBar />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  trackCaseCardClick,
  trackCaseFilterChange,
  trackCaseListLoadMore,
  trackContactClick,
  trackCtaClick,
  trackModalClose,
  trackModalOpen,
  trackNavClick,
  trackPageView,
  trackSectionViewEnd,
  trackSectionViewStart
} from '@/api/tracking'
import BottomTabBar from '@/components/BottomTabBar.vue'
import { useBehaviorTrace } from '@/utils/behaviorTrace'
import { usePageShare } from '@/utils/share'
import {
  casesV2Stats,
  managementExamCasesV2,
  partySchoolCasesV2,
  type CaseV2,
  type CaseV2Type
} from '@/data/cases-v2'

const PAGE_SIZE = 10
const PAGE_NAME = 'cases_v2'
const PAGE_VERSION = 'v2'

usePageShare({
  title: '1000+ 川渝学员真实选择｜研知道',
  path: '/pages/cases-v2/index',
  page: PAGE_NAME
})

useBehaviorTrace(PAGE_NAME, {
  sections: [
    { id: 'cases-v2-hero', name: '案例页头图' },
    { id: 'cases-v2-tabs', name: '案例方向切换' },
    { id: 'cases-v2-conversion', name: '案例页转化入口' }
  ]
})

const activeTab = ref<CaseV2Type>('party_school')
const activeCase = ref<CaseV2 | null>(null)
const visibleCount = ref(PAGE_SIZE)
let detailOpenedAt = 0

const currentCases = computed(() =>
  activeTab.value === 'party_school' ? partySchoolCasesV2 : managementExamCasesV2
)

const visibleCases = computed(() => currentCases.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < currentCases.value.length)
const currentRichCount = computed(() => currentCases.value.filter(item => item.quality === 'rich').length)

const tabPayload = () => ({
  page_version: PAGE_VERSION,
  active_tab: activeTab.value,
  party_count: casesV2Stats.party,
  management_exam_count: casesV2Stats.managementExam,
  current_total_count: currentCases.value.length,
  current_visible_count: visibleCases.value.length,
  current_rich_count: currentRichCount.value
})

const casePayload = (item: CaseV2, position = 'case_card') => ({
  page_version: PAGE_VERSION,
  active_tab: activeTab.value,
  case_type: item.caseType,
  case_quality: item.quality,
  target_precision: item.targetPrecision,
  source_dataset: item.sourceDataset,
  source_id: item.sourceId,
  chosen_target: item.chosenTarget,
  outcome: item.outcomeLabel,
  program: item.programLabel,
  position
})

const goBack = () => {
  trackNavClick(PAGE_NAME, 'back', '', tabPayload())
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const goTest = () => {
  const route = '/pages/test/index'
  trackCtaClick(PAGE_NAME, 'test_entry', '测一测我的路径', route, tabPayload())
  uni.switchTab({ url: route })
}

const goContact = () => {
  const route = '/pages/contact/index'
  trackCtaClick(PAGE_NAME, 'contact_entry', '联系顾问看更多案例', route, tabPayload())
  trackContactClick(PAGE_NAME, 'contact_entry', '联系顾问看更多案例', route, tabPayload())
  uni.navigateTo({ url: route })
}

const switchTab = (tab: CaseV2Type) => {
  if (activeTab.value === tab) return
  const fromTab = activeTab.value
  activeTab.value = tab
  trackCaseFilterChange(PAGE_NAME, 'case_type', tab, {
    ...tabPayload(),
    from_tab: fromTab,
    position: 'case_type_tab'
  })
}

const loadMore = () => {
  const previousVisibleCount = visibleCount.value
  visibleCount.value += PAGE_SIZE
  trackCaseListLoadMore(PAGE_NAME, {
    ...tabPayload(),
    previous_visible_count: previousVisibleCount,
    next_visible_count: Math.min(visibleCount.value, currentCases.value.length),
    total_count: currentCases.value.length
  })
}

const openDetail = (item: CaseV2) => {
  const targetName = cardTitle(item)
  const payload = {
    ...casePayload(item),
    target_id: item.id,
    target_name: targetName
  }
  trackCaseCardClick(PAGE_NAME, item.id, targetName, payload)
  trackModalOpen(PAGE_NAME, 'case_detail', payload)
  detailOpenedAt = Date.now()
  trackSectionViewStart(PAGE_NAME, `case-detail-${item.id}`, `案例详情 · ${targetName}`, {
    ...payload,
    position: 'case_detail_modal'
  })
  activeCase.value = item
  if (typeof document !== 'undefined') document.body.style.overflow = 'hidden'
}

const closeDetail = (method: 'mask' | 'acknowledge' | 'programmatic' = 'programmatic') => {
  const item = activeCase.value
  if (item) {
    const targetName = cardTitle(item)
    const now = Date.now()
    const detailDurationMs = detailOpenedAt ? Math.max(0, now - detailOpenedAt) : 0
    trackModalClose(PAGE_NAME, 'case_detail', {
      ...casePayload(item, method === 'acknowledge' ? 'detail_acknowledge' : 'detail_close'),
      target_id: item.id,
      target_name: targetName,
      close_method: method,
      duration_ms: detailDurationMs
    })
    trackSectionViewEnd(PAGE_NAME, `case-detail-${item.id}`, `案例详情 · ${targetName}`, {
      ...casePayload(item, 'case_detail_modal'),
      target_id: item.id,
      target_name: targetName,
      close_method: method,
      duration_ms: detailDurationMs,
      started_at: detailOpenedAt ? new Date(detailOpenedAt).toISOString() : '',
      ended_at: new Date(now).toISOString()
    })
    if (method === 'acknowledge') {
      trackCtaClick(PAGE_NAME, 'case_detail_acknowledge', '知道了', '', {
        ...casePayload(item, 'case_detail_acknowledge'),
        target_id: item.id,
        target_name: targetName
      })
    }
  }
  detailOpenedAt = 0
  activeCase.value = null
  if (typeof document !== 'undefined') document.body.style.overflow = ''
}

const cardTitle = (item: CaseV2) => {
  const parts = [item.displayAlias, item.ageLabel]
  if (item.regionLabel && item.regionLabel !== '未知') parts.push(item.regionLabel)
  return parts.filter(Boolean).join(' · ')
}

const caseMeta = (item: CaseV2) => {
  if (item.regionLabel && item.regionLabel !== '未知') return item.systemLabel
  if (item.caseType === 'management_exam') return [item.systemLabel, item.programLabel].filter(Boolean).join(' · ')
  return [item.systemLabel, item.positionLabel].filter(Boolean).join(' · ')
}

const cardNarrative = (item: CaseV2) =>
  item.cardQuote || item.reflection || item.examExperience || item.detailSummary

const targetLabel = (item: CaseV2) =>
  item.caseType === 'management_exam' ? '上岸院校' : '选了'

const shouldShowChosenTarget = (item: CaseV2) =>
  Boolean(item.chosenTarget && !['未知', '不详'].includes(item.chosenTarget))

const normalizedSchoolName = (value: string) =>
  value.replace(/\s+/g, '').replace(/·/g, '').trim()

const shouldShowIntentSchool = (item: CaseV2) =>
  Boolean(item.intentSchool)
  && (!item.admittedSchool || normalizedSchoolName(item.intentSchool) !== normalizedSchoolName(item.admittedSchool))

const outcomeBadgeClass = (outcome: string) => {
  if (outcome.includes('上岸') || outcome.includes('录取')) return 'badge-success'
  return 'badge-neutral'
}

watch(activeTab, () => {
  visibleCount.value = PAGE_SIZE
})

onMounted(() => trackPageView(PAGE_NAME, 'direct', tabPayload()))

onUnmounted(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }
.shell.modal-open { height: 100vh; overflow: hidden; }

.hero-sub {
  display: block;
  font-size: 14px;
  color: #6B6258;
  line-height: 1.75;
  margin-top: 8px;
}

.tab-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.tab-chip {
  text-align: center;
  padding: 11px 10px;
  border-radius: 999px;
  background: #FFFFFF;
  border: 0.5px solid #ECE5D8;
  color: #6B6258;
  font-size: 13px;
  font-weight: 600;
}

.tab-chip.active {
  background: #CF7140;
  color: #FFFFFF;
  border-color: transparent;
}

.conversion-card {
  background: #FFF8F0;
  border-radius: 16px;
  border: 0.5px solid #F0D8C6;
  padding: 14px;
  margin-bottom: 12px;
}

.conversion-title {
  display: block;
  font-size: 14px;
  color: #2A251E;
  font-weight: 700;
  margin-bottom: 6px;
}

.conversion-text {
  display: block;
  font-size: 12px;
  color: #6B6258;
  line-height: 1.7;
}

.conversion-card {
  margin-top: 16px;
  background: #FFFFFF;
  border-color: #ECE5D8;
}

.conversion-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 12px;
}

.conversion-btn { margin-top: 0; }

.case-card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 0.5px solid #ECE5D8;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  padding: 20px;
  margin-bottom: 12px;
  cursor: pointer;
}

.case-header-row,
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.case-card-title {
  font-weight: 700;
  font-size: 17px;
  line-height: 1.5;
  color: #2A251E;
  flex: 1;
}

.outcome-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  flex-shrink: 0;
  margin-top: 3px;
}

.badge-success { background: #EAF5EC; color: #2D7A3A; }
.badge-neutral { background: #F2EDE6; color: #8A8175; }

.case-meta {
  display: block;
  font-size: 12px;
  color: #6B6258;
  margin-bottom: 10px;
  line-height: 1.5;
}

.case-choice-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-top: 12px;
  margin-bottom: 6px;
}

.case-choice-label { font-size: 13px; color: #2A251E; flex-shrink: 0; }
.case-choice-val { font-size: 13px; color: #CF7140; font-weight: 600; flex: 1; }

.case-quote,
.case-score {
  display: block;
  font-size: 12px;
  color: #6B6258;
  line-height: 1.7;
  margin-bottom: 10px;
}

.case-quote {
  font-style: italic;
  background: #FFF6EA;
  border-radius: 14px;
  padding: 10px 12px;
  border-left: 3px solid #E7A56E;
}

.case-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  gap: 10px;
}

.case-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.case-more-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.case-more-label { font-size: 12px; color: #8A8175; }

.chevron-right {
  width: 7px;
  height: 7px;
  border-right: 1.5px solid #8A8175;
  border-bottom: 1.5px solid #8A8175;
  transform: rotate(-45deg);
  margin-bottom: 1px;
}

.empty-state { padding: 40px 20px; text-align: center; }
.empty-title { display: block; font-size: 15px; font-weight: 600; color: #2A251E; margin-bottom: 8px; }
.empty-desc { display: block; font-size: 13px; color: #8A8175; line-height: 1.6; }

.load-more-btn { margin-top: 4px; margin-bottom: 4px; }
.load-more-hint {
  display: block;
  text-align: center;
  font-size: 12px;
  color: #8A8175;
  margin-top: 12px;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
}

.modal-sheet {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 88%;
  max-width: 400px;
  height: 82vh;
  overflow: hidden;
  background: #FFFFFF;
  border-radius: 20px;
  z-index: 101;
  transform: translate(-50%, -50%) scale(0.94);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-sheet-open {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
  pointer-events: auto;
}

.modal-scroll {
  height: 100%;
}

.modal-inner {
  padding: 20px 20px calc(28px + env(safe-area-inset-bottom));
  position: relative;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #2A251E;
  line-height: 1.4;
  flex: 1;
}

.modal-subtitle {
  display: block;
  font-size: 13px;
  color: #6B6258;
  margin-bottom: 16px;
}

.modal-divider {
  height: 0.5px;
  background: #ECE5D8;
  margin-bottom: 16px;
}

.modal-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}

.modal-row-label {
  font-size: 12px;
  color: #8A8175;
  flex-shrink: 0;
  white-space: nowrap;
}

.modal-row-val {
  font-size: 14px;
  color: #2A251E;
  flex: 1;
  line-height: 1.5;
}

.modal-val-accent { color: #CF7140; font-weight: 600; }

.modal-row-group,
.modal-section {
  background: #FAF7F2;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}

.modal-section {
  border-left: 3px solid #E6D8C8;
}

.modal-section-motivation {
  background: #FFF6EA;
  border-left-color: #E7A56E;
}

.modal-section-reflection {
  background: #F7F1E8;
  border-left-color: #D3A170;
}

.modal-section-study {
  background: #F4F6EE;
  border-left-color: #A6B77A;
}

.modal-section-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #8A8175;
  margin-bottom: 6px;
}

.modal-section-text {
  display: block;
  font-size: 13px;
  color: #4A453E;
  line-height: 1.7;
}

.modal-section-text + .modal-section-text { margin-top: 8px; }

.modal-quote-block {
  background: #FAF7F2;
  border-left: 3px solid #CF7140;
  border-radius: 0 10px 10px 0;
  padding: 10px 14px;
  margin-bottom: 14px;
}

.modal-quote {
  display: block;
  font-size: 13px;
  color: #4A453E;
  font-style: italic;
  line-height: 1.7;
}

.modal-risk-block {
  background: #FFF8F0;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}

.modal-risk-label,
.modal-advice-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.modal-risk-label { color: #CF7140; }
.modal-advice-label { color: #2D7A3A; }

.modal-risk-text,
.modal-advice-text {
  display: block;
  font-size: 13px;
  color: #4A453E;
  line-height: 1.6;
}

.modal-advice-block {
  background: #F0F7F1;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 14px;
}

.modal-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}

.chip-goal { background: #EEE8FF; color: #5A3FBF; }

.modal-cta {
  background: #CF7140;
  border-radius: 999px;
  padding: 14px 20px;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(207, 113, 64, 0.22);
}

.modal-cta-text {
  font-size: 15px;
  font-weight: 600;
  color: #FFFFFF;
}
</style>
