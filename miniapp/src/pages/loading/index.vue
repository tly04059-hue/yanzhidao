<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side"></view>
      <text class="v6-nav-title">正在生成你的方向建议</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page loading-page">
      <view class="loading-wrap">
        <view class="spinner"></view>
        <view class="loading-steps">
          <text
            v-for="(step, index) in steps"
            :key="step.key"
            class="loading-step"
            :class="{
              done: index < activeStep,
              active: index === activeStep,
              error: hasError && index === activeStep
            }"
          >
            {{ index < activeStep ? '✓' : index === activeStep ? '→' : '·' }} {{ step.label }}
          </text>
        </view>
        <text v-if="statusText" class="loading-status">{{ statusText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { trackPageView } from '@/api/tracking'
import { prepareQuizInput, buildQuizRuntimeFromPieces, type QuizSubmission } from '@/data/quiz-runtime'
import { getLocalRecommendation } from '@/data/recommendation-strategy'
import { getPeerInsights } from '@/data/cases-v2-peer-insights'
import { buildResultPresentation } from '@/data/result-presentation'

const steps = [
  { key: 'input', label: '读取画像' },
  { key: 'recommend', label: '规则判路' },
  { key: 'peer', label: '匹配相似案例' },
  { key: 'runtime', label: '生成展示结果' }
]

const activeStep = ref(0)
const statusText = ref('正在读取你的作答...')
const hasError = ref(false)

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const runStep = async (index: number, text: string, task?: () => void | Promise<void>) => {
  activeStep.value = index
  statusText.value = text
  await sleep(180)
  if (task) await task()
}

onMounted(() => {
  trackPageView('loading')

  ;(async () => {
    try {
      let submission: QuizSubmission | null = null
      let prepared = null as ReturnType<typeof prepareQuizInput> | null
      let recommendation = null as ReturnType<typeof getLocalRecommendation> | null
      let peer = null as ReturnType<typeof getPeerInsights> | null
      let presentation = null as ReturnType<typeof buildResultPresentation> | null

      await runStep(0, '正在读取你的作答...', () => {
        submission = uni.getStorageSync('yz_quiz_submission') || null
        if (!submission) throw new Error('missing submission')
        prepared = prepareQuizInput(submission)
      })

      await runStep(1, '正在按照规则判断首推与备选...', () => {
        recommendation = getLocalRecommendation(prepared!.normalized)
      })

      await runStep(2, '正在匹配相似案例和同行选择...', () => {
        peer = getPeerInsights(prepared!.normalized, recommendation!.primaryPath)
      })

      await runStep(3, '正在生成结果页和长图展示数据...', () => {
        presentation = buildResultPresentation(prepared!.normalized, recommendation!, peer!)
        const runtime = buildQuizRuntimeFromPieces(prepared!, recommendation!, peer!, presentation)
        uni.setStorageSync('yz_quiz_runtime', runtime)
        uni.removeStorageSync('yz_quiz_submission')
      })

      activeStep.value = steps.length
      statusText.value = '生成完成，正在跳转结果页...'
      await sleep(260)
      uni.redirectTo({ url: '/pages/result/index' })
    } catch (error) {
      hasError.value = true
      statusText.value = '生成建议失败，请重新提交一次。'
      await sleep(900)
      uni.redirectTo({ url: '/pages/test/index' })
    }
  })()
})
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }
.loading-page { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 54px); }

.spinner {
  width: 56px;
  height: 56px;
  border: 4px solid #ECE5D8;
  border-top-color: #CF7140;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin-bottom: 24px;
}

.loading-wrap {
  width: 100%;
  max-width: 320px;
}

.loading-status {
  margin-top: 14px;
  display: block;
  text-align: center;
  font-size: 12px;
  color: #6B6258;
  line-height: 1.8;
}

.loading-step.error {
  color: #B54F3E;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
