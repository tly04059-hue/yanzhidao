<template>
  <view class="page-v3 result-page">
    <view class="result-topbar">
      <view class="tb-btn" @click="retryTest">‹</view>
      <text class="tb-title">你的专属方案</text>
      <view class="tb-btn" @click="shareResult">⤴</view>
    </view>

    <view class="profile-strip">
      <text class="profile-label">你的信息</text>
      <text class="profile-text">{{ profileText }}</text>
    </view>

    <view v-if="recommendation.blocked" class="hero-shell">
      <view class="result-hero-card">
        <view class="hero-icon">!</view>
        <text class="hero-tag">基于你的 8 题答案</text>
        <text class="hero-title">暂不建议<br>直接报考</text>
        <text class="hero-sub">{{ recommendation.message || recommendation.reason }}</text>
      </view>
    </view>

    <template v-else>
      <view class="hero-shell">
        <view class="result-hero-card">
          <view class="hero-icon">★</view>
          <text class="hero-tag">基于你的 8 题答案</text>
          <text class="hero-title">推荐路径:<br>{{ recommendation.primaryPath }}</text>
          <text class="hero-sub">{{ recommendation.reason }}</text>
        </view>
      </view>

      <view class="dual">
        <view class="dual-card">
          <view class="dual-head">
            <image class="dual-icon-img" src="/static/icons/icon-cost.svg" mode="aspectFit" />
            <text class="dual-title warm">预计成本</text>
          </view>
          <view class="dual-row">
            <text class="dual-l">时间成本</text>
            <text class="dual-v">{{ heroDuration }} · 周末学习</text>
          </view>
          <view class="dual-row">
            <text class="dual-l">金钱成本</text>
            <text class="dual-v">约 {{ heroTuition }}</text>
          </view>
        </view>
        <view class="dual-card">
          <view class="dual-head">
            <image class="dual-icon-img" src="/static/icons/icon-benefit.svg" mode="aspectFit" />
            <text class="dual-title green">核心收益</text>
          </view>
          <view class="dual-row">
            <text class="dual-l">短期</text>
            <text class="dual-v">满足学历筛选</text>
          </view>
          <view class="dual-row">
            <text class="dual-l">长期</text>
            <text class="dual-v">拓宽遴选通道</text>
          </view>
        </view>
      </view>

      <view class="school-section">
        <view class="section-head">
          <text class="section-title-main">匹配院校(前 3)</text>
          <view class="more" @click="goSchools"><text>查看全部</text><text class="more-arrow">›</text></view>
        </view>
        <view class="school-list">
          <view
            v-for="(school, index) in topSchools"
            :key="school.name"
            class="school-card"
            @click="goSchools"
          >
            <view class="sc-left">
              <view class="sc-avatar">
                <image class="sc-avatar-img" :src="schoolLogo(school.name)" mode="aspectFill" />
              </view>
              <view class="sc-copy">
                <text class="sc-name">{{ school.name }}</text>
                <text class="sc-meta">{{ school.meta || '非全日制 · 双证' }} · {{ formatTuition(school.tuition) }}</text>
              </view>
            </view>

          </view>
        </view>
      </view>

      <view class="strategy-section">
        <view class="section-head">
          <text class="section-title-main">推荐策略</text>
          <text class="more">按你的信息筛选</text>
        </view>
        <view class="strategy-card">
          <text class="strategy-title">为什么推荐这条路径</text>
          <text class="strategy-text">{{ recommendation.reason }}</text>
        </view>
        <view class="strategy-grid">
          <view v-for="(item, index) in schoolPriorities" :key="index" class="strategy-pill">
            <text class="pill-num">{{ index + 1 }}</text>
            <text class="pill-text">{{ item }}</text>
          </view>
        </view>
      </view>

      <view class="risk-section">
        <view class="section-head">
          <text class="section-title-main">备考风险提示</text>
          <text class="more">先避坑再择校</text>
        </view>
        <view class="risk-list">
          <view v-for="item in riskCards" :key="item.label" class="risk-card">
            <view class="risk-head">
              <text class="risk-label">{{ item.label }}</text>
              <text class="risk-value">{{ item.value }}</text>
            </view>
            <text class="risk-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>

      <view class="plan-section">
        <view class="section-head">
          <text class="section-title-main">本周最小行动</text>
          <text class="more">可直接执行</text>
        </view>
        <view class="plan-list">
          <view v-for="item in weeklyPlan" :key="item.title" class="plan-card">
            <text class="plan-title">{{ item.title }}</text>
            <text class="plan-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>

      <view class="case-block">
        <view class="section-head">
          <text class="section-title-main">同类同行</text>
          <view class="more"><text>查看更多</text><text class="more-arrow">›</text></view>
        </view>
        <view class="case-card">
          <view class="case-head">
            <text class="case-name">{{ similarCase.title }}</text>
            <text class="case-status">已上岸</text>
          </view>
          <text class="case-text">"{{ similarCase.advice }}"</text>
          <text class="case-meta">{{ similarCase.profile }} · {{ similarCase.risk }}</text>
        </view>
      </view>

    </template>

    <view class="result-cta-bar">
      <view class="result-btn" @click="retryTest">
        <text class="result-btn-ico">⟲</text>
        <text class="result-btn-lbl">重测</text>
      </view>
      <view class="result-btn primary" @click="shareResult">
        <text class="result-btn-ico">⤴</text>
        <text class="result-btn-lbl">分享</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAnalyticsSessionId, trackEvent } from '@/api/request'
import { dataDrivenCases } from '@/data/real-insights'
import { getLocalRecommendation } from '@/data/recommendation-strategy'
import { getAllSchools } from '@/data/school-data'

type Warning = {
  type?: string
  message: string
}

type RecommendedSchool = {
  name: string
  tuition: number
  reason: string
  meta?: string
}

const answers = ref<Record<string, any>>({})

const recommendation = ref<{
  blocked: boolean
  primaryPath: string
  reason: string
  message?: string
  warnings: Warning[]
  recommendedSchools: RecommendedSchool[]
  schoolPriorities?: string[]
  riskCards?: string[]
  weeklyPlan?: Array<{ title: string; desc: string }>
}>({
  blocked: false,
  primaryPath: 'MPA 双证路径',
  reason: '根据你的目标和条件，建议优先比较 MPA 双证项目，并用地区、学费、分数线、授课方式做二次筛选。',
  warnings: [],
  recommendedSchools: [
    { name: '西南财经大学 MPA', tuition: 54000, reason: '公共管理方向匹配体制内目标，适合作为重点比较项' },
    { name: '四川大学 MPA', tuition: 84000, reason: '院校层次高，但需要同步评估分数和复试压力' }
  ],
  schoolPriorities: [],
  riskCards: [],
  weeklyPlan: []
})

const fallbackRecommendation: {
  blocked: boolean
  primaryPath: string
  reason: string
  warnings: Warning[]
  recommendedSchools: RecommendedSchool[]
  schoolPriorities: string[]
  riskCards: string[]
  weeklyPlan: Array<{ title: string; desc: string }>
} = {
  blocked: false,
  primaryPath: 'MPA 双证路径',
  reason: '根据你的目标和条件，建议优先比较 MPA 双证项目，并用地区、学费、分数线、授课方式做二次筛选。',
  warnings: [],
  recommendedSchools: [
    { name: '西南财经大学 MPA', tuition: 54000, reason: '公共管理方向匹配体制内目标，适合作为重点比较项' },
    { name: '四川大学 MPA', tuition: 84000, reason: '院校层次高，但需要同步评估分数和复试压力' }
  ],
  schoolPriorities: [],
  riskCards: [],
  weeklyPlan: []
}

const allSchools = getAllSchools()

const profileText = computed(() => {
  const items = [
    answers.value.system,
    answers.value.province,
    answers.value.education,
    answers.value.age,
    answers.value.goal,
    answers.value.study_time || answers.value.studyTime,
    mathBaseText.value
  ].filter(Boolean)
  return items.length ? items.join(' · ') : '体制内 · 全日制本科 · 目标晋升 · 数学弱基础'
})

const heroTuition = computed(() => {
  if (recommendation.value.primaryPath.includes('党校')) return '2-5 万'
  if (recommendation.value.primaryPath.includes('MBA')) return '5-22 万'
  if (recommendation.value.primaryPath.includes('MEM')) return '3-10 万'
  return '3-9 万'
})
const heroDuration = computed(() => '2-3 年')
const studyTime = computed(() => answers.value.study_time || answers.value.studyTime || '1h-2h')
const mathBase = computed(() => answers.value.math_base || answers.value.mathBase || 'weak')
const englishBase = computed(() => answers.value.english_base || answers.value.englishBase || '四级未过')
const schoolPreference = computed(() => answers.value.school_preference || answers.value.schoolPreference || 'low_score')

const mathBaseText = computed(() => {
  const map: Record<string, string> = {
    weak: '数学弱基础',
    normal: '数学中下',
    good: '数学较好',
    unknown: '数学待诊断'
  }
  return map[mathBase.value] || ''
})

const riskCards = computed(() => {
  const strategyRiskCards = recommendation.value.riskCards || []
  const timeMap: Record<string, string> = {
    '小于等于1h': '时间极紧，先做保底任务，不建议同时铺太多课。',
    '1h-2h': '这是花名册里最常见状态，关键是稳定周计划。',
    '2h及以上': '可以按常规通关节奏推进，但要防止前期只听课不输出。',
    '时间不固定': '建议用弹性任务池，先保证背词、补课和错题复盘。'
  }
  const mathMap: Record<string, string> = {
    weak: '真实学员里数学弱基础占比最高，择校要优先看低分线和招生人数。',
    normal: '可考虑常规 MPA/MBA，但要把数学刷题稳定下来。',
    good: '数学不是主要短板，可以把院校层次和城市匹配放得更靠前。',
    unknown: '按弱基础处理更稳，先做一次基础测评再决定冲刺范围。'
  }
  const englishMap: Record<string, string> = {
    '四级未过': '词汇和长难句要前置，否则后期会挤压写作和逻辑时间。',
    '高考中下': '先稳词汇和阅读基本盘，避免只刷真题不复盘。',
    '大学英语四级': '具备基础，重点是阅读速度和作文模板输出。',
    '大学英语六级': '英语可作为优势科目，数学和逻辑更值得优先补。'
  }
  const baseCards = [
    { label: '学习时间', value: studyTime.value, desc: timeMap[studyTime.value] || timeMap['1h-2h'] },
    { label: '数学基础', value: mathBaseText.value || '待诊断', desc: mathMap[mathBase.value] || mathMap.weak },
    { label: '英语基础', value: englishBase.value, desc: englishMap[englishBase.value] || englishMap['四级未过'] }
  ]
  if (!strategyRiskCards.length) return baseCards
  return [
    ...strategyRiskCards.slice(0, 2).map((desc, index) => ({
      label: index === 0 ? '路径风险' : '择校提醒',
      value: recommendation.value.primaryPath,
      desc
    })),
    ...baseCards.slice(0, 2)
  ]
})

const schoolPriorities = computed(() => {
  if (recommendation.value.schoolPriorities?.length) return recommendation.value.schoolPriorities
  const map: Record<string, string[]> = {
    low_score: ['先看今年分数线和去年复试线', '优先招生人数较多、录取率更稳的院校', '再比较学费和城市通勤成本'],
    low_tuition: ['先排除超预算项目', '在低学费里看分数线和招生人数', '保留 1 所更稳的保底院校'],
    nearby_weekend: ['先锁定所在城市或高铁可达城市', '确认非全日制和周末授课方式', '再比较学费、分数线和复试压力'],
    brand: ['先确认名校是否符合预算和时间', '同时放 1-2 所稳妥备选', '不要只看校名，必须看录取率和复试压力'],
    certificate: ['优先低风险、低学费、低通勤成本', '避开复试不确定性过高的项目', '把拿证稳定性放在学校层次前面']
  }
  return map[schoolPreference.value] || map.low_score
})

const weeklyPlan = computed(() => {
  if (recommendation.value.weeklyPlan?.length) return recommendation.value.weeklyPlan
  if (studyTime.value === '小于等于1h') {
    return [
      { title: '每天 20 分钟', desc: '背核心词汇，不追求量，保证连续 7 天。' },
      { title: '每天 25 分钟', desc: '补数学基础题，只做能复盘的题。' },
      { title: '周末 1 次', desc: '完成一次院校筛选，确定冲刺和保底各 1 所。' }
    ]
  }
  if (studyTime.value === '2h及以上') {
    return [
      { title: '工作日 90 分钟', desc: '数学基础课 + 当天练习题，形成错题记录。' },
      { title: '工作日 30 分钟', desc: '英语词汇和阅读精读交替推进。' },
      { title: '周末半天', desc: '补逻辑或写作系统课，避免写作启动过晚。' }
    ]
  }
  if (studyTime.value === '时间不固定') {
    return [
      { title: '碎片时间', desc: '只放词汇、公式和错题回看，不安排重课。' },
      { title: '完整时间块', desc: '优先补数学基础课，一次只解决一个知识点。' },
      { title: '每周复盘', desc: '顾问根据本周完成度调整任务，不用硬凑每日时长。' }
    ]
  }
  return [
    { title: '每天 30 分钟', desc: '英语词汇 + 1 篇阅读或长难句。' },
    { title: '每天 45 分钟', desc: '数学基础课和同类题练习。' },
    { title: '周末 2 小时', desc: '逻辑/写作系统课启动，并同步院校筛选。' }
  ]
})

const similarCase = computed(() => {
  if (studyTime.value === '时间不固定') return dataDrivenCases[2]
  if (schoolPreference.value === 'nearby_weekend') return dataDrivenCases[3]
  if (mathBase.value === 'weak' || mathBase.value === 'unknown') return dataDrivenCases[1]
  return dataDrivenCases[0]
})

const topSchools = computed(() => {
  const schools = recommendation.value.recommendedSchools?.length
    ? recommendation.value.recommendedSchools
    : fallbackRecommendation.recommendedSchools
  return schools.slice(0, 3)
})

onLoad(async (options: any) => {
  if (!options.answers) return
  try {
    const parsed = JSON.parse(decodeURIComponent(options.answers))
    parsed.session_id = parsed.session_id || getAnalyticsSessionId()
    answers.value = parsed
    recommendation.value = normalizeRecommendation(getLocalRecommendation(parsed))
    trackEvent('view_result', {
      target_type: 'recommendation',
      answers: parsed,
      primary_path: recommendation.value.primaryPath,
      recommended_schools: recommendation.value.recommendedSchools
    })
  } catch (error) {
    console.error('获取推荐失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
})

const normalizeRecommendation = (raw: typeof recommendation.value) => {
  return {
    ...raw,
    reason: raw.reason || fallbackRecommendation.reason,
    recommendedSchools: raw.recommendedSchools?.length ? raw.recommendedSchools : fallbackRecommendation.recommendedSchools,
    schoolPriorities: raw.schoolPriorities?.length ? raw.schoolPriorities : fallbackRecommendation.schoolPriorities,
    riskCards: raw.riskCards?.length ? raw.riskCards : fallbackRecommendation.riskCards,
    weeklyPlan: raw.weeklyPlan?.length ? raw.weeklyPlan : fallbackRecommendation.weeklyPlan
  }
}

const formatTuition = (tuition: number) => {
  if (!tuition) return '待定'
  return tuition >= 10000 ? `${(tuition / 10000).toFixed(1)}万` : `${tuition}元`
}

const schoolAvatar = (name: string) => {
  if (name.includes('四川大学')) return '川大'
  if (name.includes('电子科技')) return '电科'
  if (name.includes('重庆大学')) return '重大'
  if (name.includes('西南财经')) return '西财'
  if (name.includes('西南交通')) return '交大'
  return name.replace(/大学|学院|MPA|MBA|·/g, '').slice(0, 2) || '院校'
}

const schoolLogo = (name: string) => {
  const pureName = name.replace(/\s*(MPA|MBA|MEM|党校)\s*$/i, '').trim()
  const fromSchoolData = allSchools.find(
    school => school.name === pureName || pureName.includes(school.name) || school.name.includes(pureName)
  )
  if (fromSchoolData?.logoUrl) return fromSchoolData.logoUrl
  if (name.includes('重庆') && name.includes('党校')) return '/static/icons/school-party-cq.svg'
  if (name.includes('党校')) return '/static/icons/school-party-sc.svg'
  if (name.includes('MEM')) return '/static/icons/school-mem.svg'
  if (name.includes('MBA')) return '/static/icons/school-mba.svg'
  return '/static/icons/school-mpa.svg'
}

const saveResult = () => {
  trackEvent('favorite_recommendation', {
    target_type: 'recommendation',
    primary_path: recommendation.value.primaryPath,
    recommended_schools: recommendation.value.recommendedSchools
  })
  uni.showToast({ title: '保存功能待接入', icon: 'none' })
}
const shareResult = () => {
  trackEvent('share_result', {
    target_type: 'recommendation',
    primary_path: recommendation.value.primaryPath,
    recommended_schools: recommendation.value.recommendedSchools
  })
  uni.showModal({ title: '分享预览', content: '提测版先展示分享内容，不生成海报下载。后续接入分享海报能力。', showCancel: false })
}
const followAccount = () => {
  trackEvent('follow_account_click', {
    target_type: 'content',
    source: 'result_page'
  })
  uni.showModal({ title: '关注研知道', content: '公众号能力接入后，可获取你所在系统的政策提醒。', showCancel: false })
}
const retryTest = () => uni.navigateTo({ url: '/pages/test/index' })
const goSchools = () => uni.navigateTo({ url: '/pages/schools/index' })
</script>

<style lang="scss" scoped>
.result-page {
  padding: 0;
  padding-bottom: 124px;
}

.result-topbar {
  position: sticky;
  top: 0;
  z-index: 12;
  height: 56px;
  padding: 10px 16px;
  background: #FFFFFF;
  border-bottom: 1px solid #ECE5D8;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tb-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2A251E;
  font-size: 24px;
  font-family: "Songti SC", serif;
}

.tb-title {
  color: #2A251E;
  font-size: 16px;
  font-weight: 600;
}

.profile-strip {
  margin: 24px 20px 0;
  padding: 22px 20px;
  border-radius: 14px;
  background: #FFFFFF;
  border: 1px solid #ECE5D8;
}

.profile-label,
.profile-text,
.hero-tag,
.hero-title,
.hero-sub,
.meta-title,
.metric-lbl,
.metric-tag,
.dual-title,
.dual-l,
.dual-v,
.section-title-main,
.more,
.sc-name,
.sc-meta,
.case-name,
.case-status,
.case-text,
.case-meta,
.lead-title,
.lead-sub,
.input-label,
.privacy {
  display: block;
}

.profile-label {
  color: #8A8175;
  font-size: 12px;
  margin-bottom: 5px;
}

.profile-text {
  color: #2A251E;
  font-size: 14px;
  line-height: 1.6;
}

.hero-shell {
  padding: 28px 20px 20px;
}

.result-hero-card {
  padding: 40px 28px;
  border-radius: 24px;
  background: #FFFFFF;
  border: 1px solid #ECE5D8;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
  text-align: center;
}

.hero-icon {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  margin: 0 auto 16px;
  background: #F1E0D3;
  color: #CF7140;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Songti SC", serif;
  font-size: 24px;
  font-weight: 700;
}

.hero-tag {
  width: max-content;
  max-width: 100%;
  margin: 0 auto 14px;
  padding: 4px 12px;
  border-radius: 999px;
  background: #F1E0D3;
  color: #CF7140;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
}

.hero-title {
  color: #2A251E;
  font-family: "Songti SC", "Noto Serif SC", serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.35;
  margin-bottom: 12px;
}

.hero-sub {
  color: #6B6258;
  font-size: 14px;
  line-height: 1.75;
}

.meta-card {
  margin: 0 16px 18px;
  padding: 24px 20px;
  border-radius: 20px;
  background: #FFFFFF;
  border: 1px solid #ECE5D8;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
}

.meta-title,
.section-title-main {
  color: #2A251E;
  font-family: "Songti SC", "Noto Serif SC", serif;
  font-size: 18px;
  font-weight: 700;
}

.meta-title {
  margin-bottom: 20px;
}

.metric {
  margin-bottom: 18px;
}

.metric:last-child {
  margin-bottom: 0;
}

.metric-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.metric-lbl {
  color: #2A251E;
  font-size: 16px;
  font-weight: 600;
}

.metric-tag {
  font-size: 16px;
  font-weight: 800;
}

.metric-tag.warm {
  color: #CF7140;
}

.metric-tag.green {
  color: #5F8C6E;
}

.metric-bar {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: #E8E1D5;
}

.metric-bar .fill {
  height: 100%;
  border-radius: 999px;
}

.metric-bar .fill.warm {
  width: 42%;
  background: #CF7140;
}

.metric-bar .fill.green {
  width: 78%;
  background: #5F8C6E;
}

.dual {
  padding: 0 20px 22px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.dual-card {
  min-width: 0;
  padding: 24px 20px;
  border-radius: 16px;
  background: #FFFFFF;
  border: 1px solid #ECE5D8;
  box-shadow: 0 2px 8px rgba(60, 50, 40, 0.04);
}

.dual-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.dual-icon-img {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.dual-title {
  font-family: "Songti SC", serif;
  font-size: 18px;
  font-weight: 700;
}

.dual-title.warm {
  color: #CF7140;
}

.dual-title.green {
  color: #5F8C6E;
}

.dual-row {
  padding: 9px 0;
  border-bottom: 1px solid #E8E1D5;
}

.dual-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.dual-l {
  color: #8A8175;
  font-size: 12px;
  margin-bottom: 4px;
}

.dual-v {
  color: #2A251E;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
}

.school-section {
  padding: 16px 20px 24px;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.more {
  flex-shrink: 0;
  color: #CF7140;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.more-arrow {
  font-size: 24px;
  color: #CF7140;
}

.school-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.school-card {
  padding: 22px;
  border-radius: 16px;
  background: #FFFFFF;
  border: 1px solid #ECE5D8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.sc-left {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.sc-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  flex-shrink: 0;
  background: #F0E9DD;
  color: #6B6258;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Songti SC", serif;
  font-weight: 700;
  font-size: 15px;
  overflow: hidden;
}

.sc-avatar-img {
  width: 48px;
  height: 48px;
  display: block;
}

.sc-copy {
  min-width: 0;
}

.sc-name {
  color: #2A251E;
  font-family: "Songti SC", serif;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 3px;
}

.sc-meta {
  color: #8A8175;
  font-size: 12px;
  line-height: 1.4;
}

.case-block {
  background: #FFFFFF;
  border-top: 16px solid #F5EFE7;
  padding: 28px 20px;
}

.strategy-section,
.risk-section,
.plan-section {
  padding: 28px 20px;
  border-top: 16px solid #F5EFE7;
  background: #FFFFFF;
}

.strategy-card {
  padding: 20px;
  border-radius: 14px;
  background: #F5EFE7;
  border: 1px solid #ECE5D8;
  margin-bottom: 14px;
}

.strategy-title,
.plan-title {
  color: #2A251E;
  font-family: "Songti SC", serif;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}

.strategy-text,
.plan-desc,
.risk-desc {
  color: #6B6258;
  font-size: 14px;
  line-height: 1.7;
}

.strategy-grid,
.risk-list,
.plan-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.strategy-pill,
.plan-card {
  display: flex;
  gap: 14px;
  padding: 18px;
  border-radius: 14px;
  background: #FFFFFF;
  border: 1px solid #ECE5D8;
}

.plan-card {
  flex-direction: column;
}

.pill-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #CF7140;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.pill-text {
  color: #2A251E;
  font-size: 14px;
  line-height: 1.65;
}

.risk-card {
  padding: 18px;
  border-radius: 14px;
  background: #F5EFE7;
  border: 1px solid #ECE5D8;
}

.risk-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.risk-label {
  color: #2A251E;
  font-size: 14px;
  font-weight: 700;
}

.risk-value {
  flex-shrink: 0;
  color: #5F8C6E;
  font-size: 14px;
  font-weight: 700;
}

.case-card {
  padding: 26px;
  border-radius: 14px;
  background: #F5EFE7;
}

.case-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.case-name {
  color: #2A251E;
  font-size: 14px;
  font-weight: 600;
}

.case-status {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 999px;
  background: #DAE5DC;
  color: #5F8C6E;
  font-size: 12px;
}

.case-text {
  color: #2A251E;
  font-family: "Songti SC", serif;
  font-size: 16px;
  line-height: 1.75;
}

.case-meta {
  color: #8A8175;
  font-size: 12px;
  line-height: 1.6;
  margin-top: 8px;
}

.result-cta-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid #ECE5D8;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.result-btn {
  flex: 1;
  max-width: 160px;
  height: 46px;
  border-radius: 999px;
  background: #F5EFE7;
  border: 0.5px solid #ECE5D8;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.result-btn.primary {
  background: #CF7140;
  border-color: #CF7140;
  box-shadow: 0 6px 20px rgba(207, 113, 64, 0.22);
}

.result-btn-ico {
  font-family: "Songti SC", serif;
  font-size: 18px;
  color: #6B6258;
}

.result-btn.primary .result-btn-ico {
  color: #FFFFFF;
}

.result-btn-lbl {
  font-family: "Songti SC", serif;
  font-size: 15px;
  font-weight: 600;
  color: #6B6258;
}

.result-btn.primary .result-btn-lbl {
  color: #FFFFFF;
}

</style>
