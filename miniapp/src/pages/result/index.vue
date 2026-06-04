<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="retryTest">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">选校方向建议</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page has-tabbar">
      <view class="brand-row">已服务 1,000+ 川渝同学 · 不骗人 · 真服务</view>

      <view class="hero-card">
        <text class="kicker-cn">选校诊断结果</text>
        <text class="hero-title">选校方向建议</text>
        <text class="hero-copy">{{ profile }}</text>
      </view>

      <view class="recommend-card">
        <text class="recommend-crown">⭐ 首选推荐</text>
        <text class="recommend-title">{{ recommendation.title }}</text>
        <view class="recommend-meta">
          <text class="recommend-meta-item">学费 {{ recommendation.tuition }}</text>
          <text class="recommend-meta-item">学制 {{ recommendation.duration }}</text>
          <text class="recommend-meta-item">{{ recommendation.city }}</text>
        </view>
        <text class="recommend-reason">{{ recommendation.reason }}</text>
        <view class="match-line">
          <text>匹配度</text>
          <view class="match-bar">
            <view class="match-bar-fill" :style="{ width: recommendation.match + '%' }"></view>
          </view>
          <text class="match-pct">{{ recommendation.match }}%</text>
        </view>


      </view>

      <view class="section">
        <view class="section-head section-head-inline">
          <view class="reason-head-shell" @click="toggleReasonSection">
            <view class="section-head-top">
              <text class="section-head-title">推荐理由</text>
              <text class="reason-head-meta">政策 + 真实作用</text>
            </view>
            <view class="reason-toggle">
              <view class="reason-toggle-arrow" :class="{ open: reasonSectionOpen, drift: arrowDriftDown && !reasonSectionOpen }"></view>
            </view>
          </view>
        </view>
        <view class="collapse-panel" :class="{ open: reasonSectionOpen }">
          <view class="collapse-panel-inner">
          <text v-if="systemName" class="text-sm section-intro">在{{ systemName }}里，研究生学历的实际作用：</text>

          <view class="result-card">
            <text class="result-card-title">政策层面</text>
            <text v-for="item in policyItems" :key="item.pre" class="result-card-item">
              <text class="text-bold">{{ item.pre }}</text>{{ item.text }}
            </text>
          </view>

          <view v-if="realityItems.length" class="result-card">
            <text class="result-card-title">真实作用 · 相似案例反馈</text>
            <view v-for="item in realityItems" :key="item.sourceCaseId || item.text" class="result-card-item-wrap">
              <text class="result-card-item">{{ item.text }}</text>
            </view>
          </view>

          <view class="result-card">
            <view class="window-toggle" @click="toggleWindowSection">
              <text class="result-card-title">为什么现在是窗口期</text>
              <view class="window-toggle-right">
                <text class="window-toggle-text">3-5 年窗口期</text>
                <view class="reason-toggle-arrow" :class="{ open: windowSectionOpen, drift: arrowDriftDown && !windowSectionOpen }"></view>
              </view>
            </view>
            <view v-if="windowSectionOpen">
              <text class="result-card-item">延迟退休改革已落地，体制内职业生涯可能延长 3-5 年，学历投资回收期也随之放大。</text>
              <text class="result-card-item">2022 → 2025 国考研岗占比从 7% 上升到 12.95%，部分岗位从本科可报转向仅限研究生。</text>
              <text class="result-card-item">末等调整和绩效约束持续强化，学历是少数可主动准备、长期有效的显性条件之一。</text>
              <text class="result-card-item">这些政策叠加后，现在更像提前布局的窗口期；具体执行仍要看个人单位和岗位要求。</text>
            </view>
          </view>

          <view class="result-card">
            <text class="result-card-title">接下来 1 周可以做的</text>
            <text v-for="item in weeklyPlan" :key="item" class="result-card-item">{{ item }}</text>
          </view>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-head section-head-inline">
          <view class="reason-head-shell" @click="toggleBackupSection">
            <view class="section-head-top">
              <text class="section-head-title">备选方案</text>
              <text class="reason-head-meta">统考非全研究生</text>
            </view>
            <view class="reason-toggle">
              <view class="reason-toggle-arrow" :class="{ open: backupSectionOpen, drift: arrowDriftDown && !backupSectionOpen }"></view>
            </view>
          </view>
        </view>
        <view class="collapse-panel" :class="{ open: backupSectionOpen }">
          <view class="collapse-panel-inner note-card">
            <text class="backup-title">{{ backup.title }}</text>
            <text class="note-card-text">{{ backup.reason }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-head section-head-inline">
          <view class="reason-head-shell" @click="togglePeerSection">
            <view class="section-head-top">
              <text class="section-head-title">类似同学实际怎么选</text>
              <text class="reason-head-meta">V2 个案 + 样本聚合</text>
            </view>
            <view class="reason-toggle">
              <view class="reason-toggle-arrow" :class="{ open: peerSectionOpen, drift: arrowDriftDown && !peerSectionOpen }"></view>
            </view>
          </view>
        </view>
        <view class="collapse-panel" :class="{ open: peerSectionOpen }">
          <view class="collapse-panel-inner">
          <view class="result-card">
            <text class="result-card-title">相似个案 · {{ similarCase.name }}</text>
            <text class="source-note case-source-note">{{ similarCase.sourceLabel }} · {{ similarCase.sourceNote }}</text>
            <text class="result-card-item">{{ similarCase.who }}</text>
            <view class="choice-row">
              <text class="choice-bullet">·</text>
              <text class="choice-prefix">选了：</text>
              <text class="choice-value">{{ similarCase.choice }}</text>
            </view>
            <text class="result-card-item quote-line">“{{ similarCase.quote }}”</text>
            <text class="result-card-item">结果：{{ similarCase.result }}</text>
          </view>

          <view class="result-card">
            <text class="result-card-title">同样画像的同学怎么选 <text class="kicker-mini">K-NN 5 维</text></text>
            <text class="text-sm knn-summary">和你 5 维画像相似的 <text class="text-accent">{{ knn.total }} 位</text>同学怎么选：</text>
            <view class="knn-pair">
              <view class="knn-card A">
                <text class="knn-num">{{ knn.aText }}</text>
                <text class="knn-lbl">{{ knn.aLabel }}</text>
              </view>
              <view class="knn-card B">
                <text class="knn-num">{{ knn.bText }}</text>
                <text class="knn-lbl">{{ knn.bLabel }}</text>
              </view>
            </view>
            <view class="knn-reasons">
              <text><text class="knn-reason-strong">{{ knn.reasonATitle }}</text>{{ knn.reasonA }}{{ '\n' }}<text class="knn-reason-strong">{{ knn.reasonBTitle }}</text>{{ knn.reasonB }}</text>
            </view>
            <!-- <text class="knn-footnote"></text> -->
          </view>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-head">
          <text class="section-head-title">你能做的下一步</text>
          <text class="section-head-meta">研知道不催不诱</text>
        </view>
        <view class="entry-grid">
          <view class="entry-btn highlight-entry" @click="goPage('zexiao')">
            <text class="entry-btn-title">⭐ 保存择校方向建议到手机</text>
            <text class="entry-btn-desc">1 张完整长图 · 含路径建议 + 参考政策 + 相似故事 + 行动清单</text>
            <text class="entry-btn-action">跳长图 →</text>
          </view>
          <view class="entry-btn" @click="goPage('pass-rate')">
            <text class="entry-btn-title">这 4 个过考率怎么算的？</text>
            <text class="entry-btn-desc">验证我们数据真实性的最直接路径。</text>
            <text class="entry-btn-action">看过考率说明 →</text>
          </view>
          <view class="entry-btn" @click="goPage('wechat')">
            <text class="entry-btn-title">把你的情况和咨询人员聊聊</text>
            <text class="entry-btn-desc">不会打扰你，不骗人真服务，可以放心聊。</text>
            <text class="entry-btn-action">加企微 →</text>
          </view>
        </view>
      </view>

      <view class="btn-row-2">
        <view class="btn-primary" @click="goPage('schools')">看看院校库</view>
        <view class="btn-primary" @click="goPage('cases')">看看同学案例</view>
      </view>
    </view>

    <BottomTabBar />
  </view>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { trackContactClick, trackNavClick, trackPageView, trackRecommendationView } from '@/api/tracking'
import BottomTabBar from '@/components/BottomTabBar.vue'
import type { QuizRuntime } from '@/data/quiz-runtime'
import { casesV2, casesV2Stats, managementExamCasesV2, partySchoolCasesV2 } from '@/data/cases-v2'

type RichItem = { pre: string; text: string }
type RealityItem = { text: string; sourceCaseId?: string; sourceLabel?: string }

const fallbackCase = partySchoolCasesV2[0] || casesV2[0]
const fallbackChoice = fallbackCase
  ? fallbackCase.caseType === 'management_exam'
    ? fallbackCase.admittedSchool || fallbackCase.intentSchool || fallbackCase.chosenTarget
    : fallbackCase.chosenTarget
  : 'V2 案例'
const fallbackQuote = fallbackCase
  ? fallbackCase.reflection || fallbackCase.cardQuote || fallbackCase.examExperience || fallbackCase.motivation || '这条路更适合我当前阶段。'
  : '这条路更适合我当前阶段。'

const profile = ref('正在加载...')
const systemName = ref('')
const reasonSectionOpen = ref(false)
const backupSectionOpen = ref(false)
const peerSectionOpen = ref(false)
const windowSectionOpen = ref(false)
const arrowDriftDown = ref(false)
let arrowDriftTimer: ReturnType<typeof setInterval> | null = null

const recommendation = ref({
  title: '党校在职研究生路径',
  tuition: '待确认',
  duration: '3 年',
  city: '川渝',
  reason: '正在根据你的情况生成建议...',
  match: 88
})

const backup = ref({
  title: 'MPA 双证路径',
  reason: '如果未来有遴选或跨系统需求，MPA 是学信网可查的双证路径。',
  source: ''
})

const policyItems = ref<RichItem[]>([
  { pre: '双证通用性', text: '：国民教育序列双证学信网可查，在遴选、调任、职称和跨系统使用中适用范围更广。' },
  { pre: '职级与岗位', text: '：研究生学历在新录用起点定级和职级晋升综合评价中是重要维度，具体执行视个人单位情况。' },
  { pre: '使用边界', text: '：学历能提高资格条件和路径弹性，但不替代业绩、岗位要求和单位实际审核。' }
])
const realityItems = ref<RealityItem[]>([])

const weeklyPlan = ref<string[]>([
  '整理目标院校清单，确认报名资格条件',
  '对比党校和统考路径的证书、成本、考试压力',
  '联系顾问 1 对 1 确认适合自己的方案'
])

const similarCase = ref({
  name: fallbackCase?.displayAlias || '同学',
  who: [
    fallbackCase?.ageLabel,
    fallbackCase?.regionLabel || fallbackCase?.systemLabel,
    fallbackCase?.caseType === 'management_exam' ? fallbackCase?.programLabel : fallbackCase?.systemLabel
  ].filter(Boolean).join(' · ') || '已脱敏案例',
  choice: fallbackChoice,
  quote: fallbackQuote,
  result: fallbackCase?.outcomeLabel || '结果待确认',
  sourceLabel: 'V2 脱敏公开案例',
  sourceNote: '来自 V2 脱敏公开案例，按路径、系统、地区和目标相似度选取。',
  sourceCaseId: fallbackCase?.id || ''
})

const knn = ref({
  total: casesV2Stats.total,
  a: partySchoolCasesV2.length,
  b: managementExamCasesV2.length,
  aText: String(partySchoolCasesV2.length),
  bText: String(managementExamCasesV2.length),
  aLabel: '位选党校',
  bLabel: '位选 MPA',
  reasonATitle: '选党校的核心理由：',
  reasonA: '不考英数 · 本系统晋升 · 学费低',
  reasonBTitle: '选 MPA 的核心理由：',
  reasonB: '遴选硬门槛 · 双证'
})

const loadFromStorage = () => {
  try {
    const runtime = uni.getStorageSync('yz_quiz_runtime') as QuizRuntime | undefined
    if (!runtime) return

    const presentation = runtime.presentation

    profile.value = presentation.profile
    systemName.value = presentation.systemName
    recommendation.value = presentation.recommendation
    backup.value = { ...presentation.backup, source: presentation.backup.source || '' }
    policyItems.value = presentation.policyItems
    realityItems.value = presentation.realityItems.filter(item => item.sourceLabel !== '近似案例参考')
    weeklyPlan.value = presentation.weeklyPlan
    similarCase.value = presentation.similarCase
    knn.value = presentation.knn
  } catch (error) {
    // ignore storage fallback
  }
}

const retryTest = () => uni.switchTab({ url: '/pages/test/index' })

const goPage = (key: string) => {
  const pageMap: Record<string, string> = {
    schools: '/pages/schools/index',
    cases: '/pages/cases-v2/index',
    'pass-rate': '/pages/pass-rate/index',
    wechat: '/pages/contact/index',
    zexiao: '/pages/zexiao/index'
  }
  const url = pageMap[key] || ''
  trackNavClick('result', key, url)
  if (key === 'wechat') {
    trackContactClick('result', 'wechat', '加企微', url, {
      recommendation_title: recommendation.value.title,
      match: recommendation.value.match
    })
  }
  if (url) uni.navigateTo({ url })
}

const toggleReasonSection = () => {
  reasonSectionOpen.value = !reasonSectionOpen.value
}

const toggleBackupSection = () => {
  backupSectionOpen.value = !backupSectionOpen.value
}

const togglePeerSection = () => {
  peerSectionOpen.value = !peerSectionOpen.value
}

const toggleWindowSection = () => {
  windowSectionOpen.value = !windowSectionOpen.value
}

onMounted(() => {
  trackPageView('result')
  loadFromStorage()
  trackRecommendationView('result', {
    target_id: recommendation.value.title,
    target_name: recommendation.value.title,
    recommendation_title: recommendation.value.title,
    match: recommendation.value.match,
    similar_case_id: similarCase.value.sourceCaseId
  })
  arrowDriftTimer = setInterval(() => {
    arrowDriftDown.value = !arrowDriftDown.value
  }, 1400)
})

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

.section-intro {
  margin-bottom: 12px;
  display: block;
}

.section-head-inline {
  width: 100%;
  align-items: flex-start;
  flex-direction: column;
  gap: 6px;
}

.reason-head-shell {
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

.reason-head-meta {
  flex-shrink: 0;
  max-width: 120px;
  padding-right: 10px;
  color: #8A8175;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.08em;
  text-align: right;
}

.reason-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 24px;
  border-radius: 10px;
  background: transparent;
}

.reason-toggle-text {
  display: none;
}

.reason-toggle-arrow {
  width: 29px;
  height: 29px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: transparent;
  flex-shrink: 0;
  transform: translateY(-10px);
  opacity: 0.49;
  animation: arrowBreath 2.2s ease-in-out infinite;
  transition: transform 1.2s ease, opacity 0.8s ease;
}

.reason-toggle-arrow::before {
  content: '';
  width: 10px;
  height: 10px;
  border-right: 1.76px solid #CF7140;
  border-bottom: 1.76px solid #CF7140;
  transform: rotate(45deg) translateY(-1px);
  transform-origin: center;
}

.reason-toggle-arrow.open {
  transform: translateY(-10px) rotate(180deg);
}

.reason-toggle-arrow.drift {
  transform: translateY(-2px);
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
  max-height: 2200px;
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

.window-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.window-toggle-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.window-toggle-text {
  color: #8A8175;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.backup-title {
  font-family: var(--f-serif);
  font-size: 15px;
  font-weight: 600;
  color: #2A251E;
  margin-bottom: 6px;
  display: block;
}

.choice-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
  padding: 2px 0 2px 16px;
  position: relative;
}

.choice-bullet {
  position: absolute;
  left: 4px;
  color: #CF7140;
  font-weight: 700;
}

.choice-prefix,
.choice-value {
  font-size: 12px;
  line-height: 1.85;
}

.choice-prefix {
  color: #2A251E;
  flex-shrink: 0;
}

.choice-value {
  color: #CF7140;
  font-weight: 600;
}

.quote-line { font-style: italic; }

.result-card-item-wrap {
  display: block;
  margin-bottom: 8px;
}

.source-note {
  display: block;
  margin-top: 3px;
  color: #9A9186;
  font-size: 10px;
  line-height: 1.5;
  letter-spacing: 0.04em;
}

.case-source-note {
  margin: 2px 0 8px;
}

.kicker-mini {
  display: inline-block;
  margin-left: 6px;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: #CF7140;
  font-weight: 500;
}

.knn-summary {
  margin: 8px 0 12px;
  display: block;
}

.knn-reason-strong {
  color: #2A251E;
  font-weight: 500;
}

.knn-footnote {
  font-size: 11px;
  margin-top: 10px;
  display: block;
  color: #8A8175;
}

.highlight-entry {
  background: #F1E0D3;
  border-color: rgba(207, 113, 64, 0.22);
}

.dp-fold {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 0.5px dashed #E8E1D5;
}

.dp-fold-summary {
  font-size: 12px;
  color: #CF7140;
  line-height: 1.6;
}

.dp-fold-body { margin-top: 10px; }

.dp-fold-line {
  display: block;
  font-size: 12px;
  color: #6B6258;
  line-height: 1.75;
  margin-bottom: 8px;
}

</style>
