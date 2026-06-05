<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side" @click="goBack">
        <image class="v6-back-icon" src="/static/icons/nav-back.svg" mode="aspectFit" />
      </view>
      <text class="v6-nav-title">选择备考路径</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page">
      <view class="brand-row">已服务 1,000+ 川渝同学 · 不骗人 · 真服务</view>

      <view class="hero-card">
        <text class="kicker-cn">备考方案 · 第一屏</text>
        <text class="hero-title">两条主流在职考研路径</text>
        <text class="hero-copy">两条路径核心差异是：学信网可查与否、备考投入及适用场景。</text>
      </view>

      <!-- 11维对比表 -->
      <view class="compare-table">
        <view class="compare-table-head">
          <text class="compare-table-th" style="flex: 0 0 61px; max-width: 61px;">维度</text>
          <text class="compare-table-th">路径 A · 党校在职</text>
          <text class="compare-table-th">路径 B · 统考非全</text>
        </view>
        <!-- 证书类型行单独渲染（加粗单证/双证） -->
        <view class="compare-table-row">
          <text class="compare-table-td" style="flex: 0 0 61px; max-width: 61px; color: #6B6258; font-weight: 500;">证书类型</text>
          <text class="compare-table-td"><text style="font-weight: 600; color: #2A251E;">单证</text>（学历证）</text>
          <text class="compare-table-td"><text style="font-weight: 600; color: #2A251E;">双证</text>（学历+学位）</text>
        </view>
        <view class="compare-table-row expand-trigger" @click="toggleExpand(expandRows[0].dim)">
          <text class="compare-table-td" style="flex: 0 0 61px; max-width: 61px; color: #6B6258; font-weight: 500;">{{ expandRows[0].dim }}</text>
          <text class="compare-table-td">{{ expandRows[0].a }}</text>
          <view class="compare-table-td compare-table-td-with-arrow">
            <text>{{ expandRows[0].b }}</text>
            <view class="expand-caret" :class="{ open: expandedRows[expandRows[0].dim] }"></view>
          </view>
        </view>
        <view class="compare-table-expand-row collapse-panel" :class="{ open: expandedRows[expandRows[0].dim] }">
          <view class="compare-table-expand-td">{{ expandRows[0].detail }}</view>
        </view>
        <view class="compare-table-row" v-for="row in compareRows" :key="row.dim">
          <text class="compare-table-td" style="flex: 0 0 61px; max-width: 61px; color: #6B6258; font-weight: 500;">{{ row.dim }}</text>
          <text class="compare-table-td">{{ row.a }}</text>
          <text class="compare-table-td">{{ row.b }}</text>
        </view>
        <!-- 可展开行 -->
        <view v-for="exp in expandRows.slice(1)" :key="exp.dim">
          <view class="compare-table-row expand-trigger" @click="toggleExpand(exp.dim)">
            <text class="compare-table-td" style="flex: 0 0 61px; max-width: 61px; color: #6B6258; font-weight: 500;">{{ exp.dim }}</text>
            <text class="compare-table-td">{{ exp.a }}</text>
            <view class="compare-table-td compare-table-td-with-arrow">
              <text>{{ exp.b }}</text>
              <view class="expand-caret" :class="{ open: expandedRows[exp.dim] }"></view>
            </view>
          </view>
          <view class="compare-table-expand-row collapse-panel" :class="{ open: expandedRows[exp.dim] }">
            <view class="compare-table-expand-td">{{ exp.detail }}</view>
          </view>
        </view>
      </view>

      <text class="data-cutoff">以上数据、信息截止2026年5月。</text>

      <!-- 两条路径的细节信息 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-title">两条路径的细节信息</text>
          <text class="section-head-meta">2 选 1</text>
        </view>
        <view class="entry-grid">
          <view class="entry-btn" @click="goPage('prep-dx')">
            <text class="entry-btn-title">党校在职研究生（四川/重庆党校）</text>
            <text class="entry-btn-desc">· 学费 2.16-2.4 万 / 3 年{{'\n'}}· 政治理论 + 专业课，不考英语数学{{'\n'}}· 体制内认可【中发〔2000〕10 号文】{{'\n'}}· 有学历证无学位证，学信网不可查{{'\n'}}· 四川党校：须党员身份 / 重庆党校：不限党员身份{{'\n'}}· 适合：单位内晋升 / 发展 / 防御 / 体制内资源{{'\n'}}· 局限：遴选 / 事转公 / 部分职称评定不完全适配{{'\n'}}· 四川 2025 年辅导过考率 <text class="text-accent">40.4%</text>{{'\n'}}· 重庆 2025 年辅导过考率 <text class="text-accent">44%</text></text>
            <text class="entry-btn-action">查看更多党校备考信息 →</text>
          </view>
          <view class="entry-btn" @click="goPage('prep-gz')">
            <text class="entry-btn-title">统考非全研究生（MPA / MBA / MEM）</text>
            <text class="entry-btn-desc">· 主流学费：MPA 2.4-15 万 / MBA 6-22 万 / MEM 8-13 万{{'\n'}}· 学制 2-3 年{{'\n'}}· 考管理类综合（逻辑/写作/数学） + 英语二{{'\n'}}· 国民教育序列双证，学信网可查{{'\n'}}· 条件：专科毕业满5年 / 本科毕业满3年（算到入学时）{{'\n'}}· 适合：遴选 / 调任 / 职称等各类需求{{'\n'}} · 局限：考英语数学，备考投入有门槛{{'\n'}}· 2026年管综辅导：初试通过 <text class="text-accent">55.6%</text> →复试辅导<text class="text-accent">87.5%</text></text>
            <text class="entry-btn-action">查看更多管综备考信息 →</text>
          </view>
        </view>
      </view>
      <view class="btn-primary" @click="goTab('test')">测一测，先判断适合哪条路径</view>
      <view class="btn-secondary" @click="goPage('wechat')">加企微 1 对 1 咨询</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { trackPageView, trackNavClick, trackTabClick } from '@/api/tracking'
import { usePageShare } from '@/utils/share'

usePageShare({
  title: '党校在职研 vs 管综非全路径对比｜研知道',
  path: '/pages/prep/index'
})

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta: 1 })
  else uni.switchTab({ url: '/pages/index/index' })
}

const goTab = (tab: string) => {
  trackTabClick('prep', tab, '/pages/test/index')
  uni.switchTab({ url: '/pages/test/index' })
}

const goPage = (key: string) => {
  trackNavClick('prep', key)
  const map: Record<string, string> = {
    'prep-dx': '/pages/prep-dx/index',
    'prep-gz': '/pages/prep-gz/index',
    wechat: '/pages/contact/index',
  }
  if (map[key]) uni.navigateTo({ url: map[key] })
}

const expandedRows = reactive<Record<string, boolean>>({})
const toggleExpand = (dim: string) => { expandedRows[dim] = !expandedRows[dim] }

const compareRows = [
  { dim: '考试科目', a: '政治理论+专业课\n主观题为主', b: '199 联考\n管综+英二' },
  { dim: '学费区间', a: '2.16-2.4 万 / 3 年', b: '5-26 万 / 2.5-3 年' },
  { dim: '学制', a: '3 年', b: '2.5-3 年' },
  { dim: '授课方式', a: '川：寒暑假集中授课\n渝：周末授课', b: '周末班 / 集中授课班' },
  { dim: '报考条件', a: '川：党员·工龄≥3年\n渝：工龄≥2年', b: '大专毕业满5年\n本科毕业满3年' },
  { dim: '认可范围', a: '体制内认可/晋升\n部分情况评中级可用', b: '各类场景通用/遴选\n事转公/职称评审等' },
  { dim: '大专可报', a: '❌ 不可报', b: '✅ 毕业满5年' },
]

const expandRows = [
  {
    dim: '学信网',
    a: '不可查',
    b: '可查',
    detail: '学信网是什么？学信网是中国教育部的高等学历、学籍及相关信息查询管理平台。学信网不可查，指的是学历不是由教育部认可的。但是，党校在职研究生是党校自主招生，其学历是组织部和党校认可的学历，对工作单位是国有企业、事业单位和政府部门的在职同学来说，组织部和党校认可，在某种程度上，是比教育部认可更独特的价值。',
  },
  {
    dim: '难度',
    a: '低-中（主观题多）',
    b: '中-高（考英数）',
    detail: '关于难度的说明：难度是一个主观词，我们标注难度的低中高是从一般备考时长衡量的，党校备考时长比管综非全少，因此难度低一些。建议在关注难度的时候，避免用模糊的阻力和恐惧来吓自己，比如：从自然过考率角度看，党校某些专业的过考率比统考非全更低，过考率低说明难度大。而从辅导过考率的角度看，党校在职和管综非全的过考率都在 40-50% 之间，在过考率相当的情况下，你会怎么选择呢？',
  },
  {
    dim: '适合人群',
    a: '单位内晋升/学历兜底\n担心英数/预算紧',
    b: '遴选及事转公\n中级副高评职称',
    detail: '关于"适合人群"的说明：此处的适合人群，是根据同学咨询和上岸后反馈综合得出的，是一般情况，非绝对正确、唯一匹配关系，具体选择建议结合同学的现状、动机、目标、规划等综合考虑。',
  },
]

onMounted(() => trackPageView('prep'))
</script>

<style lang="scss" scoped>
@import "@/styles/v6.scss";

.shell { background: #FAF7F2; min-height: 100vh; }

.expand-trigger:active { opacity: 0.78; }

.expand-caret {
  width: 23px;
  height: 23px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 23px;
  opacity: 0.39;
  transform: translateY(-10px);
  animation: arrowBreath 2.2s ease-in-out infinite;
  transition: transform 1.2s ease, opacity 0.8s ease;
}

.expand-caret::before {
  content: '';
  width: 8px;
  height: 8px;
  border-right: 1.76px solid #CF7140;
  border-bottom: 1.76px solid #CF7140;
  transform: rotate(45deg) translateY(-1px);
  transform-origin: center;
}

.expand-caret.open {
  transform: translateY(-10px) rotate(180deg);
}

.compare-table-td-with-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

@keyframes arrowBreath {
  0%, 100% {
    opacity: 0.39;
    transform: translateY(-10px);
  }
  50% {
    opacity: 0.6;
    transform: translateY(-2px);
  }
}

.collapse-panel {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 1s ease, opacity 1s ease;
}

.collapse-panel.open {
  max-height: 800px;
  opacity: 1;
}
</style>
