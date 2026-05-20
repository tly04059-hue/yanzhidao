<template>
  <view class="page-v3 no-bottom">
    <view v-if="stage === 'landing'" class="landing">
      <view class="v3-card landing-card">
        <text class="landing-title">川渝体制内选校诊断</text>
        <text class="landing-desc">8 道题，3 分钟得到：</text>
        <view class="landing-list">
          <text>· 最适合你的读研路径</text>
          <text>· 按地区、学费、分数、授课方式筛过的院校建议</text>
          <text>· 基于真实学员数据的备考风险提示</text>
          <text>· 你的本周最小可执行学习计划</text>
        </view>
        <text class="landing-note">真实花名册显示：多数在职学员每天只有 1-2h，数学基础偏弱是最大风险</text>
        <button class="btn-primary" @click="startTest">开始测试</button>
      </view>

      <view class="bottom-tabs">
        <view class="tab" @click="goHome">
          <image class="icon-img" src="/static/icons/tab-home.svg" mode="aspectFit" />
          <text>首页</text>
        </view>
        <view class="tab" @click="goLearn">
          <image class="icon-img" src="/static/icons/tab-learn.svg" mode="aspectFit" />
          <text>了解</text>
        </view>
        <view class="tab active">
          <image class="icon-img" src="/static/icons/tab-test-active.svg" mode="aspectFit" />
          <text>测一测</text>
        </view>
        <view class="tab" @click="goContact">
          <image class="icon-img" src="/static/icons/tab-contact.svg" mode="aspectFit" />
          <text>咨询</text>
        </view>
      </view>
    </view>

    <view v-else-if="stage === 'question'">
      <!-- 顶部导航 -->
      <view class="question-top">
        <view class="back-btn" @click="prevQuestion">
          <text class="back-arrow">‹</text>
        </view>
        <text class="progress-label">{{ currentIndex + 1 }} <text class="sep">/</text> {{ questions.length }}</text>
        <view class="nav-spacer"></view>
      </view>
      <view class="progress-bar">
        <view class="fill" :style="{ width: progressPercent + '%' }"></view>
      </view>

      <!-- 题目区域 -->
      <view class="question-body">
        <text class="question-title">{{ currentQuestion.question }}</text>
        <text v-if="currentQuestion.sub" class="question-sub">{{ currentQuestion.sub }}</text>

        <!-- 网格布局选项 (6选项系统选择等) -->
        <view v-if="currentQuestion.layout === 'grid'" class="grid-options">
          <view
            v-for="option in currentQuestion.options"
            :key="String(option.value)"
            class="option-card"
            :class="{ selected: selectedAnswer === option.value }"
            @click="selectAndNext(option.value)"
          >
            <text class="option-icon">{{ option.icon || '○' }}</text>
            <text class="option-label">{{ option.label }}</text>
            <text v-if="option.sub" class="option-hint">{{ option.sub }}</text>
          </view>
        </view>

        <!-- 列表布局选项 -->
        <view v-else class="list-options">
          <view
            v-for="option in currentQuestion.options"
            :key="String(option.value)"
            class="list-option"
            :class="{ selected: selectedAnswer === option.value }"
            @click="selectAndNext(option.value)"
          >
            <view class="radio">
              <view v-if="selectedAnswer === option.value" class="radio-dot"></view>
            </view>
            <view class="option-content">
              <text class="option-label">{{ option.label }}</text>
              <text v-if="option.sub" class="option-hint">{{ option.sub }}</text>
            </view>
          </view>
        </view>

        <!-- 洞察提示 -->
        <view v-if="insightHint" class="hint-card">
          <text>{{ insightHint }}</text>
        </view>
      </view>

      <!-- 底部CTA区域 -->
      <view class="cta-area">
        <view class="cta-row">
          <view class="cta-skip" @click="prevQuestion">
            <text>上一题</text>
          </view>
          <view class="cta-next" :class="{ disabled: !selectedAnswer }" @click="nextQuestion">
            <text>{{ currentIndex >= questions.length - 1 ? '生成方案' : '下一题' }}</text>
            <text class="next-arrow">›</text>
          </view>
        </view>
        <!-- 隐私说明 -->
        <view class="privacy">
          <text class="lock-icon">🔒</text>
          <text class="privacy-text">仅用于生成你的专属方案，严格保密</text>
        </view>
      </view>
    </view>

    <view v-else class="loading-wrap">
      <view class="loading-card">
        <text class="loading-title">正在匹配最适合你的方案...</text>
        <view class="load-item">
          <text class="check">✓</text>
          <text>分析你的系统背景</text>
        </view>
        <view class="load-item">
          <text class="check">✓</text>
          <text>匹配院校和专业</text>
        </view>
        <view class="load-item">
          <text class="check">✓</text>
          <text>查找相似案例</text>
        </view>
        <view class="load-item pending">
          <text class="check">○</text>
          <text>生成个性化建议</text>
        </view>
        <text class="loading-note">基于 1,123 位学员数据</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { answerOptionHints } from '@/data/real-insights'
import { getAnalyticsSessionId, trackEvent } from '@/api/request'

type Question = {
  id: number
  field: string
  question: string
  sub?: string
  layout?: 'grid' | 'list'
  options: Array<{
    value: any
    label: string
    sub?: string
    icon?: string
  }>
}

const stage = ref<'landing' | 'question' | 'loading'>('landing')
const currentIndex = ref(0)
const selectedAnswer = ref<any>(undefined)
const answers = ref<Record<string, any>>({})
const insightHint = ref('')
let autoNextTimer: ReturnType<typeof setTimeout> | undefined

const questions = ref<Question[]>([
  {
    id: 1,
    field: 'system',
    question: '你现在在哪个系统？',
    sub: '点击即开始诊断',
    layout: 'grid',
    options: [
      { value: '党政机关', label: '党政机关', sub: '组织 / 宣传 / 纪委', icon: '政' },
      { value: '公检法纪检', label: '公检法纪检', sub: '公安 / 法院 / 检察院', icon: '法' },
      { value: '乡镇街道', label: '乡镇街道', sub: '基层 / 社区 / 村镇', icon: '镇' },
      { value: '教育医疗', label: '教育医疗', sub: '学校 / 医院', icon: '教' },
      { value: '国有企业', label: '国企银行', sub: '城投 / 金融', icon: '企' },
      { value: '民族地区', label: '民族地区', sub: '甘孜 / 阿坝', icon: '民' }
    ]
  },
  {
    id: 2,
    field: 'province',
    question: '你主要在哪个地区发展？',
    options: [
      { value: '四川', label: '四川' },
      { value: '重庆', label: '重庆' },
      { value: '云南', label: '云南' },
      { value: '贵州', label: '贵州' }
    ]
  },
  {
    id: 3,
    field: 'education',
    question: '你的当前学历是？',
    options: [
      { value: '本科', label: '全日制本科' },
      { value: '本科', label: '非全日制本科（自考 / 成教 / 函授 / 国开）' },
      { value: '专科', label: '大专' },
      { value: '硕士', label: '硕士及以上' }
    ]
  },
  {
    id: 4,
    field: 'age',
    question: '你的年龄是？',
    options: [
      { value: '25-30', label: '25-30 岁' },
      { value: '30-35', label: '31-35 岁' },
      { value: '35-40', label: '36-40 岁' },
      { value: '40+', label: '41 岁以上' }
    ]
  },
  {
    id: 5,
    field: 'goal',
    question: '你读研最想解决什么？',
    sub: '选项会根据前面的系统动态调整',
    options: [
      { value: '晋升', label: '本单位晋升 / 竞争上岗' },
      { value: '遴选', label: '想遴选到上级机关' },
      { value: '防御', label: '防御性学历 / 不被比下去' },
      { value: '职称', label: '评职称' },
      { value: '转行', label: '转行 / 跳槽' }
    ]
  },
  {
    id: 6,
    field: 'budget',
    question: '你能接受的预算是？',
    options: [
      { value: 30000, label: '2-3 万（性价比优先）' },
      { value: 80000, label: '5-8 万（可以投入）' },
      { value: 120000, label: '8 万以上（不是主要考虑）' },
      { value: 20000, label: '2 万以内' }
    ]
  },
  {
    id: 7,
    field: 'studyTime',
    question: '你每天能稳定学习多久？',
    sub: '真实学员里，1h-2h 是最常见情况',
    options: [
      { value: '小于等于1h', label: '小于等于 1h' },
      { value: '1h-2h', label: '1h-2h' },
      { value: '2h及以上', label: '2h 及以上' },
      { value: '时间不固定', label: '时间不固定，但能背单词' }
    ]
  },
  {
    id: 8,
    field: 'mathBase',
    question: '你的数学基础更接近哪种？',
    sub: '花名册里 12/19 位学员数学基础在未及格或初中水平',
    options: [
      { value: 'weak', label: '高考未及格 / 初中水平' },
      { value: 'normal', label: '高考中下（90-110）' },
      { value: 'good', label: '高考良好（110+）' },
      { value: 'unknown', label: '不确定，很多年没碰数学' }
    ]
  }
])

const currentQuestion = computed(() => questions.value[currentIndex.value])
const progressPercent = computed(() => ((currentIndex.value + 1) / questions.value.length) * 100)

const startTest = () => {
  stage.value = 'question'
  currentIndex.value = 0
  selectedAnswer.value = undefined
  trackEvent('start_assessment', {
    target_type: 'assessment',
    source: 'test_page'
  })
}

const selectAndNext = (value: any) => {
  selectedAnswer.value = value
  answers.value[currentQuestion.value.field] = value
  insightHint.value = getInsightHint(currentQuestion.value.field, value)
  if (autoNextTimer) clearTimeout(autoNextTimer)
  autoNextTimer = setTimeout(() => {
    nextQuestion()
  }, insightHint.value ? 420 : 180)
}

const nextQuestion = () => {
  if (!selectedAnswer.value) return
  if (currentIndex.value >= questions.value.length - 1) {
    submit()
    return
  }
  currentIndex.value++
  selectedAnswer.value = answers.value[currentQuestion.value.field]
  insightHint.value = ''
}

const prevQuestion = () => {
  insightHint.value = ''
  if (currentIndex.value === 0) {
    stage.value = 'landing'
    return
  }
  currentIndex.value--
  selectedAnswer.value = answers.value[currentQuestion.value.field]
}

const submit = () => {
  stage.value = 'loading'
  const apiAnswers = {
    session_id: getAnalyticsSessionId(),
    province: answers.value.province,
    system: answers.value.system,
    goal: answers.value.goal,
    age: answers.value.age,
    education: answers.value.education,
    budget: answers.value.budget,
    work_years: inferWorkYears(answers.value.age),
    study_time: answers.value.studyTime,
    math_base: answers.value.mathBase
  }
  trackEvent('finish_assessment', {
    target_type: 'assessment',
    answers: apiAnswers
  })
  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/result/index?answers=' + encodeURIComponent(JSON.stringify(apiAnswers))
    })
  }, 1200)
}

const inferWorkYears = (age: string) => {
  if (age === '25-30') return 3
  if (age === '30-35') return 5
  if (age === '35-40') return 8
  return 10
}

const getInsightHint = (field: string, value: any) => {
  if (field === 'studyTime') {
    return answerOptionHints.studyTime[value as keyof typeof answerOptionHints.studyTime] || ''
  }
  if (field === 'mathBase') {
    if (value === 'unknown') return '长期没碰数学的用户，建议先按弱基础处理，择校不要只看名气。'
    return answerOptionHints.mathBase[value as keyof typeof answerOptionHints.mathBase] || ''
  }
  return ''
}

const goHome = () => uni.redirectTo({ url: '/pages/index/index' })
const goLearn = () => uni.redirectTo({ url: '/pages/learn/index' })
const goContact = () => uni.redirectTo({ url: '/pages/contact/index' })
</script>

<style lang="scss" scoped>
// 设计系统变量
.page-v3 {
  --bg-base: #F5EFE7;
  --bg-card: #FFFFFF;
  --text-1: #2A251E;
  --text-2: #6B6258;
  --text-3: #8A8175;
  --accent: #CF7140;
  --accent-soft: #F1E0D3;
  --success: #5F8C6E;
  --divider: #E8E1D5;
  --border: #ECE5D8;
  --serif: "Songti SC", "Noto Serif SC", serif;
  --sans: "Songti SC", serif;
  --shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  --shadow-lg: 0 4px 16px rgba(60, 50, 40, 0.06);
  --shadow-cta: 0 6px 20px rgba(207, 113, 64, 0.22);
}

.landing {
  min-height: calc(100vh - 90px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.landing-card {
  padding: 24px 18px;
  text-align: center;
  border-radius: 24px;
}

.landing-title {
  display: block;
  font-family: var(--serif);
  font-size: 16px;
  font-weight: 700;
  color: var(--text-1);
  margin-bottom: 12px;
}

.landing-desc {
  display: block;
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.6;
  margin-bottom: 14px;
}

.landing-list {
  text-align: left;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-1);
  margin-bottom: 24px;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
}

.landing-note {
  display: block;
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 16px;
}

/* 顶部导航 */
.question-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.back-btn {
  width: 48px;
  height: 48px;
  background: var(--bg-card);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow);
}

.back-arrow {
  font-size: 28px;
  color: var(--text-1);
  line-height: 1;
  font-weight: 400;
}

.progress-label {
  font-family: var(--sans);
  font-weight: 700;
  font-size: 16px;
  color: var(--text-1);
  letter-spacing: 0.02em;
}

.progress-label .sep {
  color: var(--text-3);
  margin: 0 4px;
}

.nav-spacer {
  width: 48px;
}

/* 进度条 */
.progress-bar {
  height: 8px;
  background: var(--divider);
  border-radius: 999px;
  overflow: hidden;
  margin: 0 20px 36px;
}

.progress-bar .fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.3s ease;
}

/* 题目区域 */
.question-body {
  padding: 0 20px 180px;
}

.question-title {
  display: block;
  font-family: var(--serif);
  font-weight: 700;
  font-size: 20px;
  line-height: 1.4;
  color: var(--text-1);
  margin-bottom: 12px;
  letter-spacing: 0.01em;
}

.question-sub {
  display: block;
  font-family: var(--sans);
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.6;
  margin-bottom: 24px;
}

/* 网格布局选项 (系统选择等) */
.grid-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.option-card {
  background: var(--bg-card);
  border-radius: 18px;
  box-shadow: var(--shadow);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}

.option-card.selected {
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--accent);
}

.option-icon {
  font-size: 20px;
  margin-bottom: 6px;
  font-weight: 700;
}

.option-label {
  font-family: var(--serif);
  font-weight: 700;
  font-size: 14px;
  color: var(--text-1);
  letter-spacing: 0.01em;
  line-height: 1.4;
}

.option-hint {
  font-family: var(--sans);
  font-size: 12px;
  color: var(--text-3);
  margin-top: 4px;
  line-height: 1.4;
}

/* 列表布局选项 */
.list-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.list-option {
  background: var(--bg-card);
  border-radius: 18px;
  box-shadow: var(--shadow);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}

.list-option.selected {
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--accent);
}

.radio {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--accent-soft);
  background: var(--bg-card);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-option.selected .radio {
  border-color: var(--accent);
}

.radio-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
}

.option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 洞察提示卡片 */
.hint-card {
  background: var(--accent-soft);
  border-radius: 14px;
  padding: 12px 16px;
  margin-top: 12px;
  font-family: var(--sans);
  font-size: 12px;
  color: var(--accent);
  line-height: 1.6;
}

/* 底部CTA区域 */
.cta-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 20px 28px;
  background: linear-gradient(to top, var(--bg-base) 80%, transparent);
  z-index: 10;
}

.cta-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 14px;
  margin-bottom: 16px;
}

.cta-skip {
  height: 56px;
  background: var(--bg-card);
  border: 0.5px solid var(--border);
  color: var(--text-2);
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--serif);
  font-weight: 700;
  font-size: 14px;
}

.cta-next {
  height: 56px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 999px;
  box-shadow: var(--shadow-cta);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: var(--serif);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.05em;
}

.cta-next.disabled {
  background: var(--accent-soft);
  color: rgba(255, 255, 255, 0.7);
  box-shadow: none;
}

.next-arrow {
  font-size: 24px;
  font-weight: 400;
}

/* 隐私说明 */
.privacy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.icon-img {
  width: 18px;
  height: 18px;
  display: block;
}

.lock-icon {
  font-size: 14px;
}

.privacy-text {
  font-family: var(--sans);
  font-size: 14px;
  color: var(--text-3);
  letter-spacing: 0.02em;
}

/* Loading状态 */
.loading-wrap {
  min-height: calc(100vh - 32px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-card {
  width: 100%;
  border-radius: 24px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  text-align: left;
  padding: 24px 20px;
}

.loading-title {
  display: block;
  text-align: center;
  font-family: var(--sans);
  font-size: 16px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 24px;
}

.load-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  font-family: var(--sans);
  font-size: 14px;
}

.check {
  color: var(--success);
  margin-right: 12px;
  font-weight: 700;
  font-size: 14px;
}

.pending .check {
  color: var(--text-3);
}

.loading-note {
  display: block;
  text-align: center;
  font-family: var(--sans);
  font-size: 12px;
  color: var(--text-3);
  margin-top: 24px;
}
</style>
