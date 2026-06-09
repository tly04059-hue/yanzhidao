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
      <view class="hero">
        <text class="kicker">真实样本</text>
        <text class="hero-h1">1,000+ 川渝学员怎么选</text>
        <text class="hero-sub">以下数据均来自我们的真实学员，全部已做脱敏处理。</text>
      </view>

      <!-- 系统筛选 -->
      <view class="filter-row">
        <scroll-view scroll-x class="filter-scroll">
          <view class="chip-group">
            <text
              v-for="f in systemFilters" :key="f"
              class="chip" :class="{ 'chip-active': activeSystem === f }"
              @click="activeSystem = f"
            >{{ f }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 路径筛选 -->
      <view class="filter-row">
        <scroll-view scroll-x class="filter-scroll">
          <view class="chip-group">
            <text
              v-for="f in pathFilters" :key="f"
              class="chip" :class="{ 'chip-active': activePath === f }"
              @click="activePath = f"
            >{{ f }}</text>
          </view>
        </scroll-view>
      </view>

      <text class="filter-meta">当前筛到 {{ filteredCountLabel }} 条</text>

      <!-- 案例卡（点击整卡弹详情） -->
      <view
        v-for="item in visibleCases" :key="item.id"
        class="case-card"
        @click="openDetail(item)"
      >
        <view class="case-header-row">
          <text class="case-card-title">{{ cardTitle(item) }}</text>
          <text class="outcome-badge" :class="outcomeBadgeClass(item.outcome)">
            {{ item.outcome }}
          </text>
        </view>

        <text class="case-meta">{{ item.system_tag }}{{ item.position_tag ? ' · ' + item.position_tag : '' }}</text>

        <view class="case-choice-row">
          <text class="case-choice-label">选了：</text>
          <text class="case-choice-val">{{ item.chosen_school }}</text>
        </view>

        <text class="case-quote" v-if="item.key_quote">"{{ item.key_quote }}"</text>
        <text class="case-score" v-if="item.score">{{ item.score }}</text>

        <view class="case-footer-row">
          <view class="case-tags">
            <text class="chip chip-accent">{{ item.system_tag }}</text>
            <text class="chip chip-path">{{ pathLabel(item) }}</text>
          </view>
          <view class="case-more-hint">
            <text class="case-more-label">详情</text>
            <view class="chevron-right"></view>
          </view>
        </view>
      </view>

      <!-- 空态 -->
      <view v-if="filteredCases.length === 0" class="empty-state">
        <text class="empty-title">这一组画像暂时没有匹配案例</text>
        <text class="empty-desc">换一个系统或路径继续看，或联系顾问 1 对 1 了解</text>
      </view>

      <view v-if="hasMore" class="btn-secondary load-more-btn" @click="loadMore">
        继续加载更多案例（还有 {{ filteredCases.length - visibleCount }} 条）
      </view>
      <text v-else class="load-more-hint">↓ 已展示全部 {{ filteredCases.length }} 条 · 脱敏处理</text>

      <view class="btn-secondary" @click="goTab('test')" style="margin-top: 16px;">测一测，看看适合什么路径</view>
    </view>

    <!-- 详情弹窗遮罩 -->
    <view v-if="activeCase" class="modal-mask" @click="closeDetail" @touchmove.stop.prevent></view>

    <!-- 详情底部抽屉 -->
    <view class="modal-sheet" :class="{ 'modal-sheet-open': activeCase }" @touchmove.stop>
      <view v-if="activeCase" class="modal-inner">

        <!-- 拖动条 -->
        <view class="modal-handle"></view>

        <!-- 标题区 -->
        <view class="modal-header">
          <text class="modal-title">{{ cardTitle(activeCase) }}</text>
          <text class="outcome-badge" :class="outcomeBadgeClass(activeCase.outcome)">
            {{ activeCase.outcome }}
          </text>
        </view>
        <text class="modal-subtitle">{{ activeCase.system_tag }}{{ activeCase.position_tag ? ' · ' + activeCase.position_tag : '' }}</text>

        <view class="modal-divider"></view>

        <!-- 选校 -->
        <view class="modal-row">
          <text class="modal-row-label">选了</text>
          <text class="modal-row-val modal-val-accent">{{ activeCase.chosen_school }}</text>
        </view>

        <!-- key_quote -->
        <view v-if="activeCase.key_quote" class="modal-quote-block">
          <text class="modal-quote">"{{ activeCase.key_quote }}"</text>
        </view>

        <!-- 备考信息（score + study_time） -->
        <view v-if="activeCase.score || activeCase.study_time" class="modal-row-group">
          <view v-if="activeCase.score" class="modal-row">
            <text class="modal-row-label">测评/目标</text>
            <text class="modal-row-val">{{ activeCase.score }}</text>
          </view>
          <view v-if="activeCase.study_time" class="modal-row">
            <text class="modal-row-label">备考投入</text>
            <text class="modal-row-val">{{ activeCase.study_time }}</text>
          </view>
        </view>

        <!-- 风险 -->
        <view v-if="activeCase.risk" class="modal-risk-block">
          <text class="modal-risk-label">风险提示</text>
          <text class="modal-risk-text">{{ activeCase.risk }}</text>
        </view>

        <!-- 建议 -->
        <view v-if="activeCase.advice" class="modal-advice-block">
          <text class="modal-advice-label">建议</text>
          <text class="modal-advice-text">{{ activeCase.advice }}</text>
        </view>

        <!-- 目标 tags -->
        <view v-if="activeCase.goal_tag && activeCase.goal_tag.length" class="modal-tags-row">
          <text
            v-for="tag in activeCase.goal_tag" :key="tag"
            class="chip chip-goal"
          >{{ tag }}</text>
        </view>

        <text class="modal-footnote">以上内容来自该同学的真实分享</text>

        <view class="modal-cta" @click="closeDetail">
          <text class="modal-cta-text">知道了</text>
        </view>

      </view>
    </view>

    <BottomTabBar />
  </view>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { trackPageView, trackTabClick } from '@/api/tracking'
import BottomTabBar from '@/components/BottomTabBar.vue'
import { casesV2, type CaseV2 } from '@/data/cases-v2'
import { usePageShare } from '@/utils/share'

usePageShare({
  title: '1000+ 川渝学员真实选择｜研知道',
  path: '/pages/cases/index'
})

interface UnifiedCase {
  id: string
  source: 'sc' | 'm8'
  display_alias: string
  age_band: string
  region: string
  system_tag: string
  position_tag: string
  goal_tag: string[]
  path: 'A' | 'B'
  program_type: string
  party_school: string
  chosen_school: string
  outcome: string
  key_quote: string
  score: string
  study_time: string
  risk: string
  advice: string
  tags: string[]
}

const toLegacyCase = (item: CaseV2): UnifiedCase => ({
  id: item.id,
  source: item.caseType === 'party_school' ? 'sc' : 'm8',
  display_alias: item.displayAlias,
  age_band: item.ageLabel,
  region: item.regionLabel,
  system_tag: item.systemLabel || item.pathLabel,
  position_tag: item.positionLabel,
  goal_tag: item.goalTags,
  path: item.caseType === 'party_school' ? 'A' : 'B',
  program_type: item.caseType === 'party_school' ? item.programLabel || '党校在职研究生' : item.programLabel || '统考非全',
  party_school: item.caseType === 'party_school' ? item.chosenTarget : '',
  chosen_school: item.caseType === 'management_exam'
    ? item.admittedSchool || item.intentSchool || item.chosenTarget
    : item.chosenTarget,
  outcome: item.outcomeLabel,
  key_quote: item.cardQuote || item.reflection || item.examExperience || item.motivation,
  score: item.score,
  study_time: item.studyTime,
  risk: item.risk,
  advice: item.advice,
  tags: [
    item.systemLabel,
    item.pathLabel,
    item.programLabel,
    item.outcomeLabel,
    ...item.tags,
    ...item.goalTags
  ].filter(Boolean)
})

const allCases = casesV2.map(toLegacyCase)

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}
const goTab = (tab: string) => {
  trackTabClick('cases', tab, '/pages/test/index')
  uni.switchTab({ url: '/pages/test/index' })
}

// ─── 筛选 ───────────────────────────────────────────────
const activeSystem = ref('全部系统')
const activePath   = ref('全部路径')

const systemFilters = ['全部系统', '党政机关', '其他', '国央企', '教育系统', '医疗系统', '公检法纪检', '乡镇街道', '银行金融']
const pathFilters   = ['全部路径', '党校在职研究生', '统考非全']

const isTongkaoCase = (item: UnifiedCase): boolean =>
  item.path === 'B' ||
  ['统考非全', '统考MPA', '统考MBA', '统考MEM'].some(tag => item.tags.includes(tag)) ||
  ['MPA', 'MBA', 'MEM'].includes(item.program_type)

const matchesPathFilter = (item: UnifiedCase, filter: string): boolean => {
  if (filter === '全部路径') return true
  if (filter === '党校在职研究生') return item.path === 'A' || item.tags.includes(filter)
  if (filter === '统考非全') return isTongkaoCase(item)
  return item.tags.includes(filter)
}

const impreciseChoicePattern = /(及附近|名校|好上岸|第一优先|川渝院校|重庆院校|医科类院校|医学类院校|成都985|重庆985|新疆|学费低|离雅安|不详)/

const hasPreciseChoice = (item: UnifiedCase): boolean => {
  const choice = String(item.chosen_school || '').trim()
  if (!choice || impreciseChoicePattern.test(choice)) return false
  return item.path === 'A' || choice.includes('·')
}

const PAGE_SIZE = 10
const MAX_DISPLAY_CASES = 100
const MAX_PARTY_DISPLAY_CASES = 50
const MAX_TONGKAO_DISPLAY_CASES = 20
const visibleCount = ref(PAGE_SIZE)

const hasCaseValue = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.filter(Boolean).length > 0
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
}

const caseCompletenessScore = (item: UnifiedCase): number => {
  const coreFields = [
    item.display_alias,
    item.age_band,
    item.region,
    item.system_tag,
    item.position_tag,
    item.program_type,
    item.chosen_school,
    item.outcome,
    item.key_quote,
    item.score,
    item.study_time,
    item.risk,
    item.advice,
    item.goal_tag,
    item.tags
  ]
  const fieldScore = coreFields.reduce((score, value) => score + (hasCaseValue(value) ? 1 : 0), 0)
  const contentScore = [item.key_quote, item.risk, item.advice, item.score, item.study_time]
    .reduce((score, value) => score + Math.min(String(value || '').trim().length, 120), 0)
  return fieldScore * 1000 + contentScore
}

const matchedCases = computed(() => {
  return allCases.filter(c => {
    const sysOk  = activeSystem.value === '全部系统' || c.tags.includes(activeSystem.value)
    const pathOk = matchesPathFilter(c, activePath.value)
    return sysOk && pathOk && hasPreciseChoice(c)
  }).sort((a, b) => caseCompletenessScore(b) - caseCompletenessScore(a))
})

const isPartyRelatedFilter = computed(() =>
  activeSystem.value === '党政机关' || activePath.value === '党校在职研究生'
)
const displayLimit = computed(() => {
  if (activePath.value === '统考非全') return MAX_TONGKAO_DISPLAY_CASES
  if (isPartyRelatedFilter.value) return MAX_PARTY_DISPLAY_CASES
  return MAX_DISPLAY_CASES
})
const filteredCases = computed(() => matchedCases.value.slice(0, displayLimit.value))
const filteredCountLabel = computed(() => matchedCases.value.length > displayLimit.value ? `${displayLimit.value}+` : String(matchedCases.value.length))
const visibleCases = computed(() => filteredCases.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < filteredCases.value.length)
const loadMore = () => { visibleCount.value += PAGE_SIZE }

watch([activeSystem, activePath], () => {
  visibleCount.value = PAGE_SIZE
})

// ─── 详情弹窗 ─────────────────────────────────────────
const activeCase = ref<UnifiedCase | null>(null)
const openDetail = (item: UnifiedCase) => {
  activeCase.value = item
  if (typeof document !== 'undefined') document.body.style.overflow = 'hidden'
}
const closeDetail = () => {
  activeCase.value = null
  if (typeof document !== 'undefined') document.body.style.overflow = ''
}
onUnmounted(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})

// ─── 展示辅助 ─────────────────────────────────────────
const cardTitle = (item: UnifiedCase): string => {
  const parts = [item.display_alias, item.age_band]
  if (item.region && item.region !== '未知') parts.push(item.region)
  return parts.join(' · ')
}

const pathLabel = (item: UnifiedCase): string => {
  if (item.path === 'A') return '党校在职研究生'
  if (isTongkaoCase(item)) return '统考非全'
  return item.program_type
}

const outcomeBadgeClass = (outcome: string): string => {
  if (outcome === '上岸' || outcome === '已录取') return 'badge-success'
  return 'badge-neutral'
}

onMounted(() => trackPageView('cases'))
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }
.shell.modal-open { height: 100vh; overflow: hidden; }

.filter-row { margin-bottom: 10px; }
.filter-scroll { white-space: nowrap; }
.chip-group { display: flex; gap: 8px; padding-bottom: 4px; }

.filter-meta {
  display: block;
  font-size: 12px;
  color: #8A8175;
  margin-bottom: 12px;
}

/* ── 卡片 ── */
.case-card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 0.5px solid #ECE5D8;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  padding: 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: box-shadow 0.15s;
  &:active { box-shadow: 0 4px 16px rgba(60, 50, 40, 0.10); }
}

.case-header-row {
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
.badge-neutral  { background: #F2EDE6; color: #8A8175; }

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
.case-choice-val   { font-size: 13px; color: #CF7140; font-weight: 600; flex: 1; }

.case-quote {
  display: block;
  font-size: 12px;
  color: #6B6258;
  font-style: italic;
  line-height: 1.7;
  margin-bottom: 10px;
}
.case-score {
  display: block;
  font-size: 12px;
  color: #6B6258;
  line-height: 1.5;
  margin-bottom: 10px;
}

.case-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}
.case-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.chip-path { background: #F0EAE0; color: #5C4F3A; }

.case-more-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.case-more-label { font-size: 12px; color: #8A8175; }

/* CSS chevron 向右 */
.chevron-right {
  width: 7px;
  height: 7px;
  border-right: 1.5px solid #8A8175;
  border-bottom: 1.5px solid #8A8175;
  transform: rotate(-45deg);
  margin-bottom: 1px;
}

/* 空态 */
.empty-state { padding: 40px 20px; text-align: center; }
.empty-title { display: block; font-size: 15px; font-weight: 600; color: #2A251E; margin-bottom: 8px; }
.empty-desc  { display: block; font-size: 13px; color: #8A8175; line-height: 1.6; }

.load-more-btn { margin-top: 4px; margin-bottom: 4px; }
.load-more-hint {
  display: block;
  text-align: center;
  font-size: 12px;
  color: #8A8175;
  margin-top: 12px;
}

/* ── 弹窗遮罩 ── */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
}

/* ── 居中弹窗 ── */
.modal-sheet {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 88%;
  max-width: 400px;
  max-height: 82vh;
  overflow-y: auto;
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

.modal-inner {
  padding: 12px 20px 40px;
  position: relative;
}

.modal-handle { display: none; }

.modal-close {
  position: absolute;
  top: 12px;
  right: 16px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
/* CSS × 关闭图标 */
.close-icon {
  position: relative;
  width: 14px;
  height: 14px;
  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1.5px;
    background: #8A8175;
    border-radius: 1px;
  }
  &::before { transform: translateY(-50%) rotate(45deg); }
  &::after  { transform: translateY(-50%) rotate(-45deg); }
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
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
.modal-row-val { font-size: 14px; color: #2A251E; flex: 1; line-height: 1.5; }
.modal-val-accent { color: #CF7140; font-weight: 600; }

.modal-row-group {
  background: #FAF7F2;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}

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
.modal-risk-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #CF7140;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}
.modal-risk-text {
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
.modal-advice-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #2D7A3A;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}
.modal-advice-text {
  display: block;
  font-size: 13px;
  color: #4A453E;
  line-height: 1.6;
}

.modal-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}
.chip-goal { background: #EEE8FF; color: #5A3FBF; }

.modal-footnote {
  display: block;
  font-size: 11px;
  color: #A39A8D;
  line-height: 1.5;
  margin: -4px 0 12px;
  text-align: center;
}

.modal-cta {
  background: #CF7140;
  border-radius: 999px;
  padding: 14px 20px;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(207, 113, 64, 0.22);
  &:active { opacity: 0.9; }
}
.modal-cta-text { font-size: 15px; font-weight: 600; color: #FFFFFF; }
</style>
