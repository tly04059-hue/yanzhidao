<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">{{ school ? school.name : '院校详情' }}</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page" v-if="school">
      <!-- hero -->
      <view class="hero-card">
        <view class="hero-logo-row">
          <image class="hero-school-logo" :src="school.logoUrl" mode="aspectFit" />
          <view class="hero-logo-info">
            <text class="kicker-cn" style="margin-top: 0;">{{ school.type }}</text>
            <text class="hero-title" style="font-size: 22px; margin-bottom: 6px;">{{ school.name }}</text>
          </view>
        </view>
        <view class="tag-row">
          <text v-if="school.levelText === '985'" class="tag tag-985">985</text>
          <text v-if="school.levelText === '211'" class="tag tag-211">211</text>
          <text class="tag">{{ school.province }}</text>
          <text v-if="school.city && school.city !== school.province" class="tag">{{ school.city }}</text>
          <text v-if="hasMeaningfulValue(school.degreeType)" class="tag tag-success">{{ school.degreeType }}</text>
        </view>
      </view>

      <!-- 基本信息 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">基本信息</text>
        </view>
        <view class="list-card">
          <view class="list-item" v-for="info in basicInfoRows" :key="info.label">
            <text class="list-item-label">{{ info.label }}</text>
            <text class="list-item-val" :class="{ 'text-accent': info.accent }">{{ info.val }}</text>
          </view>
        </view>
      </view>

      <!-- 招生项目 -->
      <view class="section" v-if="school.programs && school.programs.length">
        <view class="section-head">
          <text class="section-head-title">招生项目</text>
          <text class="section-head-meta">{{ school.programs.length }} 个方向</text>
        </view>
        <view class="result-grid">
          <view class="result-card" v-for="(prog, i) in school.programs" :key="i">
            <text class="result-card-title">{{ prog.major || prog.examType }}</text>
            <text class="result-card-item" v-if="hasMeaningfulValue(prog.studyMode)">学习方式：{{ prog.studyMode }}</text>
            <text class="result-card-item" v-if="hasMeaningfulValue(prog.tuition)">学费：{{ prog.tuition }}</text>
            <text class="result-card-item" v-if="hasMeaningfulValue(prog.duration)">学制：{{ prog.duration }}</text>
            <text class="result-card-item" v-if="hasMeaningfulValue(prog.enrollment)">计划招生：{{ prog.enrollment }}</text>
            <text class="result-card-item" v-if="hasMeaningfulValue(prog.thisYearScore)">
              2025 分数线：<text class="text-accent">{{ prog.thisYearScore }}</text>
            </text>
            <text class="result-card-item" v-if="hasMeaningfulValue(prog.classTime)">上课方式：{{ prog.classTime }}</text>
            <text class="result-card-item" v-if="hasMeaningfulValue(prog.direction) && prog.direction !== '不区分研究方向'">研究方向：{{ prog.direction }}</text>
          </view>
        </view>
      </view>

      <!-- 录取分析 -->
      <view class="section" v-if="school.admissionAnalysis">
        <view class="section-head">
          <text class="section-head-title">录取情况</text>
        </view>
        <view class="note-card">
          <text class="note-card-text">{{ school.admissionAnalysis }}</text>
        </view>
      </view>

      <!-- 学校简介 -->
      <view class="section" v-if="school.description">
        <view class="section-head">
          <text class="section-head-title">学校简介</text>
        </view>
        <view class="note-card">
          <text class="note-card-text">{{ school.description }}</text>
        </view>
      </view>

      <view class="btn-primary" @click="goPage('wechat')">加企微咨询这所院校</view>
      <view class="btn-secondary" @click="goPage('schools')">返回院校库</view>
    </view>

    <!-- 无数据 -->
    <view class="v6-page" v-else>
      <view class="placeholder">
        <text class="placeholder-icon">🏫</text>
        <text class="placeholder-title">院校详情</text>
        <text class="placeholder-desc">从院校库选择具体院校后查看详情。</text>
      </view>
      <view class="btn-secondary" @click="goPage('schools')">返回院校库</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { trackPageView, trackNavClick } from '@/api/tracking'
import { getSchoolById, type SchoolDetail } from '@/data/school-data'

const school = ref<SchoolDetail | null>(null)

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.navigateTo({ url: '/pages/schools/index' })
}

const goPage = (key: string) => {
  trackNavClick('school-detail', key)
  const map: Record<string, string> = {
    wechat: '/pages/contact/index',
    schools: '/pages/schools/index',
  }
  if (map[key]) uni.navigateTo({ url: map[key] })
}

const hasMeaningfulValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return false
  const text = String(value).trim()
  if (!text) return false
  return !['待定', '待确认', '无', '暂无', '——'].includes(text)
}

const basicInfoRows = computed(() => {
  if (!school.value) return []
  const s = school.value
  const rows: { label: string; val: string; accent?: boolean }[] = []
  if (hasMeaningfulValue(s.province)) rows.push({ label: '省份', val: hasMeaningfulValue(s.city) ? `${s.province} · ${s.city}` : String(s.province ?? '') })
  if (hasMeaningfulValue(s.type)) rows.push({ label: '项目类型', val: String(s.type ?? '') })
  if (hasMeaningfulValue(s.degreeType)) rows.push({ label: '证书类型', val: String(s.degreeType ?? '') })
  if (hasMeaningfulValue(s.examType)) rows.push({ label: '考试类型', val: String(s.examType ?? '') })
  if (hasMeaningfulValue(s.tuition)) rows.push({ label: '学费', val: String(s.tuition ?? ''), accent: true })
  if (hasMeaningfulValue(s.duration)) rows.push({ label: '学制', val: String(s.duration ?? '') })
  if (hasMeaningfulValue(s.studyMode)) rows.push({ label: '学习方式', val: String(s.studyMode ?? '') })
  if (hasMeaningfulValue(s.enrollment)) rows.push({ label: '计划招生', val: String(s.enrollment ?? '') })
  if (hasMeaningfulValue(s.latestScore)) rows.push({ label: '2025 分数线', val: String(s.latestScore ?? ''), accent: true })
  if (hasMeaningfulValue(s.classLocation)) rows.push({ label: '上课地点', val: String(s.classLocation ?? '') })
  if (hasMeaningfulValue(s.adjustment)) rows.push({ label: '调剂', val: String(s.adjustment ?? '') })
  if (hasMeaningfulValue(s.retiredSoldierPlan)) rows.push({ label: '退役士兵计划', val: String(s.retiredSoldierPlan ?? '') })
  if (hasMeaningfulValue(s.minorityBackbonePlan)) rows.push({ label: '少数民族骨干', val: String(s.minorityBackbonePlan ?? '') })
  return rows
})

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const id = (currentPage as any)?.options?.id
  if (id) {
    const found = getSchoolById(String(id))
    if (found) school.value = found
  }
  trackPageView('school-detail')
})
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }

/* ── 此页专属间距压缩（全局 −10px）── */
.hero-card {
  padding: 12px 16px;
  margin-bottom: 8px;
}

.hero-logo-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.hero-school-logo {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  flex-shrink: 0;
  background: #F8F4EE;
  border: 0.5px solid #ECE5D8;
}

.hero-logo-info {
  flex: 1;
  min-width: 0;
}

.tag-row { margin-top: 2px; }

.section { margin-bottom: 14px; }

.section-head {
  min-height: 36px;
  margin-bottom: 4px;
}

.list-card { margin-bottom: 6px; }

.list-item {
  align-items: flex-start;
  gap: 12px;
  padding: 9px 14px;
}

.list-item-label {
  flex: 0 0 auto;
  min-width: 68px;
  white-space: nowrap;
}

.list-item-val {
  flex: 0 1 60%;
  max-width: 60%;
  text-align: left;
  white-space: normal;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.note-card {
  padding: 16px;
  margin-bottom: 4px;
}

.result-grid {
  gap: 4px;
  margin-bottom: 4px;
}

.result-card { padding: 16px; }

.result-card-title { margin-bottom: 2px; }
</style>
