<template>
  <view class="page-v3">
    <!-- 顶部导航 -->
    <view class="topbar">
      <view class="tb-btn" @click="goBack">‹</view>
      <text class="tb-title">院校详情</text>
      <view class="tb-btn">⤴</view>
    </view>

    <!-- Hero · 学校信息 -->
    <view class="hero">
      <view class="hero-card">

        <view class="hero-mast">
          <view class="hero-avatar">{{ schoolAvatar }}</view>
          <view class="hero-info">
            <text class="hero-name">{{ school.name }}</text>
            <text class="hero-loc">{{ school.city }} · {{ school.levelText }}</text>
          </view>
        </view>
        <view class="hero-badges">
          <text class="hero-badge" v-if="school.type">{{ school.type }}</text>
          <text class="hero-badge green">{{ school.degreeType || '双证' }}</text>
          <text class="hero-badge green" v-if="school.examType">{{ school.examType }}</text>
          <text class="hero-badge green" v-if="hasInterview">提前面试</text>
        </view>
        <view class="hero-stats">
          <view class="hero-stat">
            <text class="stat-v">{{ school.tuition }}</text>
            <text class="stat-l">学费</text>
          </view>
          <view class="hero-stat">
            <text class="stat-v">{{ school.duration }}</text>
            <text class="stat-l">学制</text>
          </view>
          <view class="hero-stat">
            <text class="stat-v">{{ school.studyMode }}</text>
            <text class="stat-l">上课</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 招生信息 -->
    <view class="section-block">
      <view class="section-head">
        <text class="section-title">招生信息</text>
      </view>
      <view class="info-card">
        <view class="info-row">
          <text class="info-l">招生人数</text>
          <text class="info-r">{{ school.enrollment }}</text>
        </view>
        <view class="info-row">
          <text class="info-l">{{ school.scoreYear || '最新' }} 复试线</text>
          <text class="info-r green">{{ school.latestScore || '待确认' }}</text>
        </view>
        <view class="info-row">
          <text class="info-l">学费 / 学制</text>
          <text class="info-r">{{ school.tuition }} · {{ school.duration }}</text>
        </view>
        <view class="info-row">
          <text class="info-l">上课方式</text>
          <text class="info-r">{{ school.studyMode || '待确认' }}</text>
        </view>
        <view class="info-row">
          <text class="info-l">是否调剂</text>
          <text class="info-r">{{ school.adjustment || '待确认' }}</text>
        </view>
        <view class="info-row">
          <text class="info-l">退役 / 少骨计划</text>
          <text class="info-r">{{ school.retiredSoldierPlan || '待确认' }} / {{ school.minorityBackbonePlan || '待确认' }}</text>
        </view>
        <view class="info-row">
          <text class="info-l">上课地点</text>
          <text class="info-r">{{ school.classLocation || school.city || '待确认' }}</text>
        </view>
        <view class="info-row">
          <text class="info-l">项目记录</text>
          <text class="info-r">{{ school.programs.length }} 条</text>
        </view>
      </view>
      <view class="program-card" v-for="program in school.programs" :key="program.department + program.direction + program.studyMode">
        <!-- 头部 -->
        <view class="program-head">
          <view class="program-title-group">
            <text class="program-title">{{ program.major }}</text>
            <text class="program-sub">{{ program.department || '院系待确认' }} · {{ program.direction || '不区分研究方向' }}</text>
          </view>
          <view class="program-mode-tag">{{ program.studyMode || '待确认' }}</view>
        </view>

        <!-- 核心指标 -->
        <view class="program-stats">
          <view class="program-stat">
            <text class="program-stat-value">{{ program.tuition }}</text>
            <text class="program-stat-label">学费</text>
          </view>
          <view class="program-stat">
            <text class="program-stat-value">{{ program.duration }}</text>
            <text class="program-stat-label">学制</text>
          </view>
          <view class="program-stat">
            <text class="program-stat-value">{{ program.thisYearScore }}</text>
            <text class="program-stat-label">分数线</text>
          </view>
          <view class="program-stat">
            <text class="program-stat-value">{{ program.enrollment }}</text>
            <text class="program-stat-label">招生人数</text>
          </view>
        </view>

        <!-- 分隔线 -->
        <view v-if="program.classTime || program.admission" class="program-divider" />

        <!-- 上课信息 -->
        <view v-if="program.classTime" class="program-row">
          <text class="program-row-label">上课方式</text>
          <text class="program-row-value">{{ program.classTime }}</text>
        </view>

        <!-- 录取信息 -->
        <view v-if="program.admission" class="program-row">
          <text class="program-row-label">录取数据</text>
          <text class="program-row-value">{{ parseAdmission(program.admission) }}</text>
        </view>
      </view>
    </view>

    <!-- 底部 CTA -->
    <view class="cta-bar">
      <view class="bb-side" @click="saveSchool">
        <text class="bb-ico">★</text>
        <text class="bb-lbl">收藏</text>
      </view>
      <view class="cta-btn" @click="showConsult">
        <text class="cta-text">联系顾问 · 1v1 咨询</text>
        <text class="cta-arrow">→</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getSchoolById, type SchoolDetail } from '@/data/school-data'
import { trackEvent } from '@/api/request'

const school = ref<SchoolDetail>({
  id: '',
  code: '',
  name: '',
  type: '',
  province: '',
  city: '',
  levelText: '',
  tags: [],
  tuition: '待定',
  duration: '待定',
  studyMode: '待定',
  enrollment: '待定',
  programs: [],
  logoUrl: '',
  matchScore: 92,
  programCount: 0,
  retiredSoldierPlan: '',
  minorityBackbonePlan: ''
})

const parseAdmission = (admission: string) => {
  // 去掉"录取："前缀
  return admission.replace(/^录取[：:]\s*/, '')
}

const matchPercent = ref(92)

const hasInterview = computed(() => school.value.tags?.includes('提前面试') || false)

const schoolAvatar = computed(() => {
  const name = school.value.name
  if (name.includes('四川大学')) return '川大'
  if (name.includes('电子科技')) return '电科'
  if (name.includes('重庆大学')) return '重大'
  if (name.includes('西南财经')) return '西财'
  if (name.includes('西南交通')) return '交大'
  if (name.includes('重庆市委党校') || name.includes('重庆党校')) return '渝党'
  if (name.includes('省委党校') || name.includes('党校')) return '川党'
  return name.replace(/大学|学院|MPA|MBA|·/g, '').slice(0, 2) || '院校'
})

onLoad((options: any) => {
  if (!options.id) return
  
  const detail = getSchoolById(options.id)
  if (detail) {
    school.value = detail
    matchPercent.value = detail.matchScore || 92
    trackEvent('view_school_detail', {
      target_type: 'school',
      target_id: detail.id,
      target_name: detail.name,
      school_name: detail.name,
      program_type: detail.type,
      tuition: detail.tuition,
      city: detail.city
    })
  } else {
    uni.showToast({ title: '未找到该院校', icon: 'none' })
  }
})

const goBack = () => uni.navigateBack()

const saveSchool = () => {
  trackEvent('favorite_school', {
    target_type: 'school',
    target_id: school.value.id,
    target_name: school.value.name,
    school_name: school.value.name,
    program_type: school.value.type
  })
  uni.showToast({ title: '已收藏此院校', icon: 'success' })
}

const showConsult = () => {
  trackEvent('consult_click', {
    target_type: 'school',
    target_id: school.value.id,
    target_name: school.value.name,
    school_name: school.value.name,
    program_type: school.value.type
  })
  uni.showModal({
    title: '联系我们',
    content: '微信：yanzhidao2024\n顾问将在 3 分钟内回复',
    showCancel: false
  })
}
</script>

<style lang="scss" scoped>
/* 按 UI 样本 08_院校详情页.html 规范编写 */
.page-v3 {
  width: 100%;
  background: #F5EFE7;
  min-height: 100vh;
  padding: 0 0 140px;
  box-sizing: border-box;
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
}

.tb-btn {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #2A251E;
}

.tb-title {
  font-family: "Songti SC", serif;
  font-weight: 500;
  font-size: 28px;
  color: #2A251E;
}

/* Hero */
.hero {
  padding: 32px 32px 24px;
}

.hero-card {
  background: #FFFFFF;
  border-radius: 22px;
  border: 0.5px solid #ECE5D8;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  padding: 36px 32px;
  position: relative;
}

.hero-mast {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 18px;
}

.hero-avatar {
  width: 88px;
  height: 88px;
  border-radius: 18px;
  background: #F0E9DD;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 28px;
  color: #6B6258;
  flex-shrink: 0;
}

.hero-info {
  flex: 1;
  min-width: 0;
}

.hero-name {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 30px;
  color: #2A251E;
  margin-bottom: 4px;
}

.hero-loc {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 17px;
  color: #8A8175;
}

.hero-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.hero-badge {
  font-family: "Songti SC", serif;
  font-size: 16px;
  color: #CF7140;
  background: #F1E0D3;
  padding: 5px 14px;
  border-radius: 999px;
  letter-spacing: 0.04em;
}

.hero-badge.green {
  color: #5F8C6E;
  background: #DAE5DC;
}

.hero-stats {
  padding-top: 20px;
  border-top: 0.5px solid #E8E1D5;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.hero-stat {
  text-align: center;
}

.stat-v {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 24px;
  color: #2A251E;
}

.stat-l {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 14px;
  color: #8A8175;
  margin-top: 4px;
  letter-spacing: 0.04em;
}

/* 招生信息 */
.section-block {
  padding: 24px 32px;
}

.section-head {
  margin-bottom: 16px;
  padding: 0 4px;
}

.section-title {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 24px;
  color: #2A251E;
}

.info-card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 0.5px solid #ECE5D8;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  padding: 22px 26px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 12px 0;
  border-bottom: 0.5px solid #E8E1D5;
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-row:first-child {
  padding-top: 0;
}

.info-l {
  flex-shrink: 0;
  font-family: "Songti SC", serif;
  font-size: 17px;
  color: #8A8175;
}

.info-r {
  flex: 1;
  font-family: "Songti SC", serif;
  font-weight: 500;
  font-size: 17px;
  color: #2A251E;
  text-align: right;
  line-height: 1.45;
}

.info-r.green {
  color: #5F8C6E;
  font-weight: 600;
}

.program-card {
  margin-top: 14px;
  background: #FFFFFF;
  border-radius: 16px;
  border: 0.5px solid #ECE5D8;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  padding: 24px;
}

.program-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.program-title-group {
  flex: 1;
  min-width: 0;
}

.program-title {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 700;
  font-size: 20px;
  line-height: 1.35;
  color: #2A251E;
}

.program-sub {
  display: block;
  margin-top: 6px;
  font-family: "Songti SC", serif;
  font-size: 13px;
  line-height: 1.5;
  color: #8A8175;
}

.program-mode-tag {
  flex-shrink: 0;
  font-family: "Songti SC", serif;
  font-size: 13px;
  font-weight: 600;
  color: #5F8C6E;
  background: #E8F2EE;
  padding: 5px 12px;
  border-radius: 999px;
  line-height: 1;
}

.program-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.program-stat {
  background: #FAF7F2;
  border-radius: 10px;
  padding: 14px 6px 10px;
  text-align: center;
}

.program-stat-value {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 700;
  font-size: 16px;
  color: #2A251E;
  line-height: 1.2;
}

.program-stat-label {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 11px;
  color: #8A8175;
  margin-top: 4px;
  line-height: 1;
}

.program-divider {
  height: 1px;
  background: #ECE5D8;
  margin: 18px 0;
}

.program-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 10px;
}

.program-row:first-of-type {
  margin-top: 0;
}

.program-row-label {
  flex-shrink: 0;
  font-family: "Songti SC", serif;
  font-size: 12px;
  font-weight: 600;
  color: #8A8175;
  letter-spacing: 0.04em;
  width: 56px;
  line-height: 1.6;
}

.program-row-value {
  flex: 1;
  font-family: "Songti SC", serif;
  font-size: 14px;
  color: #6B6258;
  line-height: 1.65;
}

/* 底部 CTA */
.cta-bar {
  min-height: 46px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border-top: 0.5px solid #ECE5D8;
  padding: 10px 20px calc(12px + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 50;
  box-sizing: border-box;
}

.cta-btn {
  flex: 1;
  background: #CF7140;
  color: white;
  height: 46px;
  border-radius: 999px;
  box-shadow: 0 6px 20px rgba(207,113,64,0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.cta-text {
  font-family: "Songti SC", serif;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.1em;
  color: white;
}

.cta-arrow {
  font-size: 24px;
  color: white;
}
</style>
