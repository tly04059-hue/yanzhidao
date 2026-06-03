<template>
  <view class="shell">
    <!-- 入口页 -->
    <view v-if="stage === 'entry'">
      <view class="v6-nav">
        <view class="v6-nav-side"></view>
        <text class="v6-nav-title">测一测</text>
        <view class="v6-nav-side"></view>
      </view>

      <view class="v6-page has-tabbar">
        <view class="brand-row">已服务 1,000+ 川渝同学 · 不骗人 · 真服务</view>

        <view class="hero-card">
          <text class="kicker-cn">测一测</text>
          <text class="hero-title">川渝体制内选校诊断</text>
          <text class="hero-copy">8-9 道题，3-5 分钟获得：</text>

          <view class="promise-list">
            <view class="promise-item" v-for="p in promises" :key="p">
              <text class="promise-dot">·</text>
              <text>{{ p }}</text>
            </view>
          </view>

          <view class="btn-primary" @click="startTest">开始测试</view>
        </view>
      </view>
    </view>

    <!-- 答题页 -->
    <view v-else-if="stage === 'quiz'">
      <view class="v6-nav">
        <view class="v6-nav-side" @click="prevStep">
          <image v-if="currentQ > 1 || dpActive" class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
        </view>
        <text class="v6-nav-title">测一测 · {{ dpActive ? 'DP 追问' : currentQ + ' / ' + TOTAL_Q }}</text>
        <view class="v6-nav-side"></view>
      </view>

      <view class="v6-page has-tabbar quiz-page">
        <view class="brand-row">已服务 1,000+ 川渝同学 · 不骗人 · 真服务</view>

        <!-- 进度卡 -->
        <view class="hero-card quiz-progress-card">
          <view class="quiz-progress-meta">
            <text>第 <text class="quiz-progress-accent">{{ dpActive ? TOTAL_Q : currentQ }}</text> 题 / 共 {{ TOTAL_Q }} 题</text>
            <text>{{ progressPct }}%</text>
          </view>
          <view class="progress" style="margin-top: 6px;">
            <view class="progress-fill" :style="{ width: progressPct + '%' }"></view>
          </view>
        </view>

        <!-- 常规题目 -->
        <view v-if="!dpActive">
          <view class="quiz-question" v-for="q in questions" :key="q.id" v-show="currentQ === q.id">
            <text class="quiz-question-title">{{ q.title }}</text>
            <text class="quiz-hint">{{ q.id === 7 ? q7Hint : q.hint }}</text>
          </view>

          <view class="q-options" :data-multi="isCurrentMulti">
            <view
              v-for="opt in currentOptions"
              :key="opt.value"
              class="q-option"
              :class="{ selected: isSelected(opt.value), multi: isCurrentMulti }"
              @click="selectOption(opt.value)"
            >
              <view class="q-radio">
                <view class="q-radio-dot" v-if="!isCurrentMulti"></view>
                <text class="check-icon" v-if="isCurrentMulti && isSelected(opt.value)">✓</text>
              </view>
              <text class="q-option-text">{{ opt.label }}</text>
            </view>
          </view>
        </view>

        <!-- DP 追问 -->
        <view v-if="dpActive">
          <view class="quiz-question">
            <text class="quiz-question-title dp">{{ currentDpQ.title }}</text>
            <text class="quiz-hint">{{ currentDpQ.hint }}</text>
          </view>
          <view class="alert-card" v-if="currentDpQ.banner">
            <text class="alert-kicker">{{ currentDpQ.banner.kicker }}</text>
            <text class="alert-text">{{ currentDpQ.banner.text }}</text>
          </view>
          <view class="q-options">
            <view
              v-for="opt in currentDpQ.options"
              :key="opt.value"
              class="q-option"
              :class="{ selected: dpAnswers[dpLayer] === opt.value }"
              @click="selectDpOption(opt.value)"
            >
              <view class="q-radio">
                <view class="q-radio-dot"></view>
              </view>
              <text class="q-option-text">{{ opt.label }}</text>
            </view>
          </view>
        </view>

        <!-- 逃生通道 -->
        <view class="q-escape">
          <text class="q-escape-link" @click="goLearn">先去了解相关规则 →</text>
        </view>

        <!-- 底部导航 -->
        <view class="quiz-nav">
          <view v-if="canGoPrev" class="btn-secondary" style="flex: 1; margin-bottom: 0;" @click="prevStep">← 上一题</view>
          <view v-if="canSkip" class="btn-ghost-link" @click="skipCurrent">跳过本题</view>
          <view
            class="btn-primary"
            style="flex: 1; margin-bottom: 0;"
            :class="{ disabled: !canNext }"
            @click="nextStep"
          >{{ nextBtnText }}</view>
        </view>
      </view>
    </view>
  <BottomTabBar />
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { v5QuizContent } from '@/data/v5/quiz'
import BottomTabBar from '@/components/BottomTabBar.vue'
import { trackPageView, trackNavClick } from '@/api/tracking'


const TOTAL_Q = 9
const stage = ref<'entry' | 'quiz'>('entry')
const currentQ = ref(1)
const answers = reactive<Record<number, string | string[]>>({})

const dpActive = ref(false)
const dpLayer = ref<string>('')
const dpAnswers = reactive<Record<string, string>>({})
const DP_LAYERS = ['L1', 'L2', 'L3', 'L3b']

const promises = [
  '适合你的读研路径',
  '推荐的具体学校和专业',
  '和你情况相似的学员选择',
  '针对性的下一步动作',
]

const questions = v5QuizContent.questions
const q7BySystem = v5QuizContent.q7BySystem
const dpQuestions = Object.fromEntries(v5QuizContent.dp.map(item => [item.id, item])) as Record<string, (typeof v5QuizContent.dp)[number]>
type QuizQuestion = (typeof questions)[number]

const getQuestionLabel = (questionId: number, value: string) => {
  const question = questions.find(item => item.id === questionId)
  return question?.options.find(option => option.value === value)?.label || value
}

const q7Hint = computed(() => {
  const system = String(answers[1] || '')
  if (system) return `可跳过 · 候选按你 Q1 选的「${getQuestionLabel(1, system)}」展开`
  return '可跳过 · 候选按第 1 题选择展开'
})

const currentQuestion = computed<QuizQuestion | undefined>(() => questions.find(q => q.id === currentQ.value))
const isCurrentMulti = computed(() => currentQuestion.value?.multi ?? false)
const currentDpQ = computed(() => dpQuestions[dpLayer.value] || { title: '', hint: '', options: [], banner: undefined })

const currentOptions = computed(() => {
  if (currentQ.value === 7) {
    const system = String(answers[1] || '')
    return (q7BySystem[system] || []).map(value => ({ value, label: value }))
  }
  return currentQuestion.value?.options || []
})

const progressPct = computed(() => Math.round((dpActive.value ? TOTAL_Q : currentQ.value) / TOTAL_Q * 100))

const canGoPrev = computed(() => {
  if (dpActive.value) return true
  return currentQ.value > 1
})

const canSkip = computed(() => {
  if (dpActive.value) return false
  return !(currentQuestion.value?.required ?? false)
})

const canNext = computed(() => {
  if (dpActive.value) {
    return !!dpAnswers[dpLayer.value]
  }
  const currentQuestionId = currentQ.value
  const required = currentQuestion.value?.required ?? false
  const multi = currentQuestion.value?.multi ?? false
  if (required) {
    if (multi) return ((answers[currentQuestionId] as string[]) || []).length > 0
    return !!answers[currentQuestionId]
  }
  return true
})

const nextBtnText = computed(() => {
  if (dpActive.value) {
    const isLast = dpLayer.value === 'L3b' || (dpLayer.value === 'L3' && dpAnswers.L3 !== 'unsure')
    return isLast ? '提交 → 看你的方向建议' : '下一步 →'
  }
  return currentQ.value === TOTAL_Q ? '提交 → 看你的方向建议' : '下一题 →'
})

const isSelected = (opt: string) => {
  const ans = answers[currentQ.value]
  if (isCurrentMulti.value) return (ans as string[] || []).includes(opt)
  return ans === opt
}

const selectOption = (opt: string) => {
  if (isCurrentMulti.value) {
    const current = (answers[currentQ.value] as string[]) || []
    if (current.includes(opt)) answers[currentQ.value] = current.filter(o => o !== opt)
    else answers[currentQ.value] = [...current, opt]
  } else {
    answers[currentQ.value] = opt
  }
}

const selectDpOption = (opt: string) => {
  dpAnswers[dpLayer.value] = opt
}

const startTest = () => {
  stage.value = 'quiz'
  currentQ.value = 1
  trackNavClick('test', 'start')
}

const prevStep = () => {
  if (dpActive.value) {
    const idx = DP_LAYERS.indexOf(dpLayer.value)
    if (idx === 0) {
      dpActive.value = false
      dpLayer.value = ''
      currentQ.value = TOTAL_Q
    } else {
      dpLayer.value = DP_LAYERS[idx - 1]
    }
  } else if (currentQ.value > 1) {
    currentQ.value--
  } else {
    stage.value = 'entry'
  }
}

const skipCurrent = () => {
  if (currentQ.value < TOTAL_Q) currentQ.value++
  else submitQuiz()
}

const nextStep = () => {
  if (!canNext.value) return
  if (dpActive.value) {
    nextDP()
    return
  }
  if (currentQ.value === TOTAL_Q) {
    const q9 = answers[9] as string[] || []
    if (q9.includes('english_concern') || q9.includes('math_concern')) {
      dpActive.value = true
      dpLayer.value = 'L1'
    } else {
      submitQuiz()
    }
  } else {
    currentQ.value++
  }
}

const nextDP = () => {
  const layer = dpLayer.value
  if (layer === 'L3b') { submitQuiz(); return }
  if (layer === 'L3') {
    if (dpAnswers.L3 !== 'unsure') { submitQuiz(); return }
    dpLayer.value = 'L3b'
    return
  }
  if (layer === 'L2') { dpLayer.value = 'L3'; return }
  if (layer === 'L1') { dpLayer.value = 'L2'; return }
  submitQuiz()
}

const submitQuiz = () => {
  uni.setStorageSync('yz_quiz_submission', {
    answers: JSON.parse(JSON.stringify(answers)),
    dpAnswers: { ...dpAnswers }
  })
  uni.navigateTo({ url: '/pages/loading/index' })
  trackNavClick('test', 'submit')
}

const goLearn = () => {
  trackNavClick('test', 'learn-escape')
  uni.switchTab({ url: '/pages/learn/index' })
}

onMounted(() => {
  trackPageView('test')
})

// onShow(() => {
//   const pages = getCurrentPages()
//   const page = pages[pages.length - 1] as any
//   if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
//     page.getTabBar().setData({ selected: '/pages/test/index' })
//   }
// })
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }
.quiz-page { padding-bottom: 12px; }

.quiz-progress-card {
  padding: 10px 14px;
  margin-bottom: 10px;
}

.promise-list { margin: 14px 0 22px; }
.promise-item { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; font-size: 13px; line-height: 1.7; }
.promise-dot { color: #5F8C6E; font-weight: 700; flex-shrink: 0; }

.check-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  color: #fff;
}

.quiz-question { margin: 8px 0 8px; }

.q-options {
  gap: 6px;
}

.q-option {
  padding: 6px 12px;
  border-radius: 10px;
  min-height: 28px;
  gap: 8px;
}

.q-radio {
  width: 14px;
  height: 14px;
}

.q-radio-dot {
  width: 6px;
  height: 6px;
}

.q-option-text {
  font-size: 12px;
  line-height: 1.3;
}

.q-escape {
  margin-top: 10px;
  padding-top: 10px;
}

.quiz-nav {
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
}

.btn-ghost-link {
  padding: 4px 8px;
}

.q-option.selected.multi .q-radio {
  background: #CF7140;
  border-color: #CF7140;
  position: relative;
}

.btn-primary.disabled {
  opacity: 0.4;
  box-shadow: none;
}
</style>
