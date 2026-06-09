<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">{{ content.title }}</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="brand-row">{{ content.brandLine }}</view>

      <view class="hero-card">
        <text class="kicker-cn">{{ content.hero.kicker }}</text>
        <text class="hero-title">{{ content.hero.title }}</text>
        <text class="hero-copy">{{ content.hero.subtitle }}</text>
      </view>

      <!-- 边界说明 -->
      <view class="alert-card">
        <text class="alert-kicker">{{ content.notice.title }}</text>
        <text class="alert-text" v-for="item in content.notice.items" :key="item">· {{ item }}{{'\n'}}</text>
      </view>

      <!-- 输入表单 -->
      <view class="card">
        <text class="form-title">{{ content.form.title }}</text>
        <view class="field-stack">
          <view class="field-row" v-for="field in content.form.fields" :key="field.key">
            <text class="field-label">{{ field.label }}</text>
            <input
              class="field-input"
              type="number"
              :placeholder="field.placeholder"
              :value="String(scores[field.key] ?? '')"
              @input="updateScore(field.key, $event)"
            />
          </view>
        </view>
        <view class="total-row">
          <text class="total-label">合计</text>
          <text class="total-val">{{ totalScore }}</text>
        </view>
        <view class="btn-primary" style="margin-top: 16px; margin-bottom: 0;" @click="calculate">计算分数带</view>
      </view>

      <!-- 结果 -->
      <view class="result-band-wrap" v-if="activeBand">
        <text class="result-band-title">{{ content.result.title }}</text>
        <view
          class="result-band"
          v-for="band in content.result.bands"
          :key="band.id"
          :class="{ active: activeBand === band.id }"
        >
          <view class="band-head">
            <text class="band-range">{{ band.range }}</text>
            <text class="band-label">{{ band.label }}</text>
          </view>
          <text class="band-desc" v-if="activeBand === band.id">{{ band.desc }}</text>
        </view>
      </view>

      <!-- 参考建议 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">{{ content.tips.title }}</text>
        </view>
        <view class="note-card">
          <text class="note-card-text" v-for="tip in content.tips.items" :key="tip">· {{ tip }}{{'\n\n'}}</text>
        </view>
      </view>

      <view class="btn-primary" @click="goSchools">{{ content.cta.primary }}</view>
      <view class="btn-secondary" @click="goTest">{{ content.cta.secondary }}</view>
      <view class="btn-secondary" @click="goPassRate">{{ content.cta.tertiary }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, reactive } from 'vue'
import { v6EstimateContent } from '@/data/v5'
import { trackNavClick, trackPageView, trackTabClick } from '@/api/tracking'
import { usePageShare } from '@/utils/share'

usePageShare({
  title: '在职考研估分工具｜研知道',
  path: '/pages/estimate/index'
})

const content = v6EstimateContent
const scores = reactive<Record<string, number | null>>({
  math: null, logic: null, writing: null, english: null,
})
const activeBand = ref('')

const totalScore = computed(() => {
  const vals = Object.values(scores).map(v => v ?? 0)
  return vals.reduce((a, b) => a + b, 0)
})

const updateScore = (key: string, e: any) => {
  const val = parseFloat(e.detail?.value ?? e.target?.value ?? '')
  scores[key] = isNaN(val) ? null : val
  activeBand.value = ''
}

const calculate = () => {
  const total = totalScore.value
  if (total < 140) activeBand.value = 'low'
  else if (total < 180) activeBand.value = 'mid'
  else activeBand.value = 'high'
  trackNavClick('estimate', 'calculate')
}

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const goSchools = () => {
  trackNavClick('estimate', 'schools', '/pages/schools/index')
  uni.navigateTo({ url: '/pages/schools/index' })
}

const goTest = () => {
  trackTabClick('estimate', 'test', '/pages/test/index')
  uni.switchTab({ url: '/pages/test/index' })
}

const goPassRate = () => {
  trackNavClick('estimate', 'pass-rate', '/pages/pass-rate/index')
  uni.navigateTo({ url: '/pages/pass-rate/index' })
}

onMounted(() => trackPageView('estimate'))
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }

.form-title {
  display: block;
  @include serif;
  font-size: 16px;
  font-weight: 600;
  color: $text-1;
  margin-bottom: 16px;
}

.field-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 0.5px dashed $divider;

  &:last-child { border-bottom: none; }
}

.field-label {
  font-size: 14px;
  color: $text-1;
  font-weight: 500;
  flex: 0 0 60px;
}

.field-input {
  flex: 1;
  font-size: 16px;
  color: $accent;
  background: transparent;
  border: none;
  text-align: right;
  padding: 0;
  @include serif;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid $border;
}

.total-label {
  font-size: 14px;
  font-weight: 600;
  color: $text-1;
}

.total-val {
  @include serif;
  font-size: 28px;
  font-weight: 600;
  color: $accent;
}

.result-band-wrap {
  margin-bottom: 24px;
}

.result-band-title {
  display: block;
  @include serif;
  font-size: 16px;
  font-weight: 600;
  color: $text-1;
  margin-bottom: 10px;
}

.result-band {
  background: $card;
  border: 0.5px solid $border;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 8px;
  transition: all 0.2s;

  &.active {
    border-color: $accent;
    background: $accent-soft;
  }
}

.band-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.band-range {
  @include serif;
  font-size: 16px;
  font-weight: 600;
  color: $text-1;

  .result-band.active & { color: $accent; }
}

.band-label {
  font-size: 13px;
  color: $text-2;
  font-weight: 500;

  .result-band.active & { color: $accent-deep; font-weight: 600; }
}

.band-desc {
  display: block;
  font-size: 13px;
  color: $text-2;
  line-height: 1.75;
  margin-top: 10px;

  .result-band.active & { color: $accent-deep; }
}
</style>
