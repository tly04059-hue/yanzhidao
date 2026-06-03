<template>
  <view class="shell">
    <view class="v6-nav">
      <view class="v6-nav-side"></view>
      <text class="v6-nav-title">在职考研学历了解</text>
      <view class="v6-nav-side"></view>
    </view>

    <view class="v6-page has-tabbar">
      <view class="brand-row">已服务 1,000+ 川渝同学 · 不骗人 · 真服务</view>

      <view class="hero-card">
        <text class="hero-title">学历提升，是投资</text>
        <text class="hero-copy">考研，是工作上少有的依靠个人努力就有结果，且一次付出长期有价值的投资。</text>
      </view>

      <!-- §1 政策大背景 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-h2">政策大背景</text>
          <text class="section-head-meta">3-5 年窗口期</text>
        </view>
        <view class="policy-grid">
          <view class="card card-sm policy-card" v-for="p in policies" :key="p.seq">
            <text class="policy-seq">{{ p.seq }}</text>
            <text class="policy-title">{{ p.title }}</text>
            <text class="policy-desc">{{ p.desc }}</text>
          </view>
        </view>
        <view class="card card-sm summary-card">
          <text class="summary-title">总结 · 3-5 年窗口期</text>
          <text class="summary-text">延迟退休是长期影响，与<text class="text-bold">以上几条政策叠加</text>——学历发挥价值的时间和场景增多。不是焦虑营销，是基于事实的判断。具体执行视个人情况。</text>
        </view>
      </view>

      <!-- §2 学历到底有什么用 -->
      <view class="section">
        <view class="section-head section-head-inline">
          <view class="learn-head-shell" @click="toggleUseSection">
            <view class="section-head-top">
              <text class="section-head-h2">学历到底有什么用</text>
              <text class="learn-head-meta">3 类作用</text>
            </view>
            <view class="learn-toggle">
              <view class="learn-toggle-arrow" :class="{ open: useSectionOpen, drift: arrowDriftDown && !useSectionOpen }"></view>
            </view>
          </view>
        </view>
        <view class="collapse-panel" :class="{ open: useSectionOpen }">
          <view class="collapse-panel-inner result-grid">
          <view class="result-card" v-for="item in useItems" :key="item.title">
            <text class="result-card-title" :style="item.muted ? 'color:#6B6258' : ''">{{ item.title }}</text>
            <view v-for="li in item.items" :key="li">
              <text class="result-card-item">{{ li }}</text>
            </view>
          </view>
          </view>
        </view>
      </view>

      <!-- §3 4维度规则 -->
      <view class="section">
        <view class="section-head section-head-inline">
          <view class="learn-head-shell" @click="togglePathRuleSection">
            <view class="section-head-top">
              <text class="section-head-h2">不同情况路径不一样</text>
              <text class="learn-head-meta">4 维度横扫 · 19 条规则</text>
            </view>
            <view class="learn-toggle">
              <view class="learn-toggle-arrow" :class="{ open: pathRuleSectionOpen, drift: arrowDriftDown && !pathRuleSectionOpen }"></view>
            </view>
          </view>
        </view>
        <view class="collapse-panel" :class="{ open: pathRuleSectionOpen }">
          <view class="collapse-panel-inner">
          <view class="dim-fold" v-for="dim in dims" :key="dim.id">
            <view class="dim-fold-summary" @click="toggleDim(dim.id)">
              <view class="dim-fold-info">
                <view class="dim-title-row">
                  <text class="dim-title">{{ dim.title }}</text>
                  <view class="dim-arrow-inline" :class="{ open: openDims[dim.id], drift: arrowDriftDown && !openDims[dim.id] }"></view>
                </view>
                <text class="dim-desc">{{ dim.desc }}</text>
              </view>
            </view>
            <view class="dim-rules" v-if="openDims[dim.id]">
              <view class="dim-rule-row" v-for="rule in dim.rules" :key="rule.tag">
                <text class="chip dim-chip" :class="rule.chipClass">{{ rule.tag }}</text>
                <text class="dim-rule-text">{{ rule.text }}</text>
              </view>
            </view>
          </view>
          </view>
        </view>
      </view>

      <!-- §4 路径总览 -->
      <view class="section">
        <view class="section-head section-head-inline">
          <view class="learn-head-shell" @click="toggleMainPathSection">
            <view class="section-head-top">
              <text class="section-head-h2">主流路径怎么选</text>
              <text class="learn-head-meta">A 党校 vs B 统考</text>
            </view>
            <view class="learn-toggle">
              <view class="learn-toggle-arrow" :class="{ open: mainPathSectionOpen, drift: arrowDriftDown && !mainPathSectionOpen }"></view>
            </view>
          </view>
        </view>
        <view class="collapse-panel" :class="{ open: mainPathSectionOpen }">
          <view class="collapse-panel-inner">
          <text class="text-sm text-3" style="margin-bottom: 12px; display: block;">路径A：党校在职研究生，体制内认可的独立路径；路径B：统考非全研究生，学信网可查，有MPA / MBA / MEM 3种招生人数较多的专业选择</text>
          <view class="compare-table">
            <view class="compare-table-head">
              <text class="compare-table-th" style="flex: 0 0 54px; max-width: 54px;">维度</text>
              <text class="compare-table-th">A 党校</text>
              <text class="compare-table-th">B · MPA</text>
              <text class="compare-table-th">B · MBA</text>
              <text class="compare-table-th">B · MEM</text>
            </view>
            <view class="compare-table-row" v-for="row in compareRows" :key="row[0]">
              <text class="compare-table-td" style="flex: 0 0 54px; max-width: 54px; color: #6B6258; font-weight: 500;">{{ row[0] }}</text>
              <text class="compare-table-td" v-for="(cell, i) in row.slice(1)" :key="i">{{ cell }}</text>
            </view>
          </view>
          <view class="btn-secondary" @click="goPage('prep')">看完整 11 维对比 + 目标场景适配 →</view>
          </view>
        </view>
      </view>

      <!-- §5 同行实际怎么选 -->
      <view class="section">
        <view class="section-head section-head-inline">
          <view class="learn-head-shell" @click="togglePeerSampleSection">
            <view class="section-head-top">
              <text class="section-head-h2">同学们实际怎么选</text>
              <text class="learn-head-meta">1,000+ 全样本</text>
            </view>
            <view class="learn-toggle">
              <view class="learn-toggle-arrow" :class="{ open: peerSampleSectionOpen, drift: arrowDriftDown && !peerSampleSectionOpen }"></view>
            </view>
          </view>
        </view>
        <view class="collapse-panel" :class="{ open: peerSampleSectionOpen }">
          <view class="collapse-panel-inner">
          <view class="knn-pair" style="margin-bottom: 12px;">
            <view class="knn-card A">
              <text class="knn-num">62%</text>
              <text class="knn-lbl">党校在职研究生</text>
            </view>
            <view class="knn-card B">
              <text class="knn-num">31%</text>
              <text class="knn-lbl">统考非全研究生{{'\n'}}<text class="knn-sub">MPA / MBA / MEM</text></text>
            </view>
          </view>
          <view class="card card-sm" style="background: linear-gradient(180deg, #fff8f3 0%, #ffffff 100%);">
            <text class="case-title">王同学 · 市直机关 34 岁 · 党员</text>
            <text class="case-text">想到了"先把学历这件事做了，不掉队"——最终选了四川省委党校经济学，3年毕业。</text>
            <text class="case-quote" style="font-style: italic;">"我没想着这一张文凭能带我升多远，但少了它是实实在在少一些底气，一方面是实在的资格作用，一方面是心里的底气，都很重要。"</text>
          </view>
          <view class="btn-secondary" style="margin-top: 12px;" @click="goPage('cases')">看更多同学案例 →</view>
          </view>
        </view>
      </view>

      <!-- §6 你可以做的事 -->
      <view class="section">
        <view class="section-head">
          <text class="section-head-h2">你可以做的事</text>
          <text class="section-head-meta">3 个入口 · 平铺无主次</text>
        </view>
        <view class="entry-grid">
          <view class="entry-btn" @click="goTab('test')">
            <text class="entry-btn-title">看适合自己的参考方案</text>
            <text class="entry-btn-desc">测一测：8 道题 · 3 分钟 · 得到属于你的诊断书。</text>
            <text class="entry-btn-action">开始测一测 →</text>
          </view>
          <view class="entry-btn" @click="goPage('prep')">
            <text class="entry-btn-title">进一步了解不同路径</text>
            <text class="entry-btn-desc">党校在职研究生 vs 统考非全研究生，分路径详细指南。</text>
            <text class="entry-btn-action">看备考时间安排，选适合的路径 →</text>
          </view>
          <view class="entry-btn" @click="goPage('wechat')">
            <text class="entry-btn-title">咨询了解 / 一对一聊</text>
            <text class="entry-btn-desc">加企微，把具体情况发我们，不骗人真服务，可以放心聊。</text>
            <text class="entry-btn-action">加企微顾问 →</text>
          </view>
        </view>
      </view>

      <!-- 刊尾 -->
      <view class="footer-sign">
        <text class="footer-sign-title">不骗人 · 真服务</text>
        <text class="footer-sign-sub">研知道 · 成立于 2021 年</text>
      </view>
    </view>
  <BottomTabBar />
  </view>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BottomTabBar from '@/components/BottomTabBar.vue'
import { trackPageView, trackTabClick, trackNavClick } from '@/api/tracking'

const routeMap: Record<string, string> = {
  prep: '/pages/prep/index',
  cases: '/pages/cases/index',
  wechat: '/pages/contact/index',
}

const goPage = (key: string) => {
  trackNavClick('learn', key)
  const url = routeMap[key]
  if (url) uni.navigateTo({ url })
}

const goTab = (tab: string) => {
  trackTabClick('learn', tab, '/pages/test/index')
  uni.switchTab({ url: '/pages/test/index' })
}

const openDims = reactive<Record<string, boolean>>({
  system: false, goal: false, edu: false, age: false,
})
const useSectionOpen = ref(false)
const pathRuleSectionOpen = ref(false)
const mainPathSectionOpen = ref(false)
const peerSampleSectionOpen = ref(false)
const arrowDriftDown = ref(false)
let arrowDriftTimer: ReturnType<typeof setInterval> | null = null

const toggleDim = (id: string) => { openDims[id] = !openDims[id] }
const toggleUseSection = () => { useSectionOpen.value = !useSectionOpen.value }
const togglePathRuleSection = () => { pathRuleSectionOpen.value = !pathRuleSectionOpen.value }
const toggleMainPathSection = () => { mainPathSectionOpen.value = !mainPathSectionOpen.value }
const togglePeerSampleSection = () => { peerSampleSectionOpen.value = !peerSampleSectionOpen.value }

const policies = [
  { seq: '01', title: '党校学历体制内认可', desc: '中发〔2000〕10 号文，党政机关 / 事业单位 / 国有企业内部认可，用于晋升、职称等。' },
  { seq: '02', title: '职级并行 学历优势', desc: '2019中办职级并行规定，研究生学历在定级、晋升中是重要加分项。' },
  { seq: '03', title: '末等退出常态化', desc: '2024年9月国资委提出，2025年国有企业普遍推行管理人员末等调整和不胜任退出制度。' },
  { seq: '04', title: '限研岗占比12.95%', desc: '2025国家公务员考试近60个岗位要求从"本科可报考"变为"仅限研究生可报考"，趋势明显。' },
]

const useItems = [
  { title: '发展', muted: false, items: ['单位内竞争和发展的学历优势', '增加可以报考的遴选岗位', '调任资格审核更有竞争力，提升晋升概率', '职称评审年限优势（硕士比本科快 2-3 年到中级 / 3-5 年到副高）'] },
  { title: '防御', muted: false, items: ['国央企末等退出、新进人员平均学历提升、延迟退休让在岗时间增长需加大竞争 — 学历是少数能依靠自己、不被替代、长期有效的资产；延迟退休也让学历投资回收期对应延长。'] },
  { title: '拓展', muted: false, items: ['校友网络 = 体制内职业发展的隐性资产；理论和实践方法论的积累；学历提升带来的信心和提升抓住机会的能力。'] },
]

const dims = [
  {
    id: 'system', title: '按系统看', desc: '你在哪个系统，对口学校就大概率确定了。',
    rules: [
      { tag: '财政税务', chipClass: '', text: '业务岗位选财经类院校综合类院校的 MPA 较多（业务对口 + 校友圈层），其他岗位考虑党校经济类专业的较多' },
      { tag: '党政机关', chipClass: '', text: '党校在职研究生为主线，政治 / 经济 / 公管 / 战略类专业优先，选择 MPA 专业的占比相对较少' },
      { tag: '公检法', chipClass: '', text: '党校在职研究生法学专业为主，MPA 双证为辅' },
      { tag: '教育医疗', chipClass: '', text: '评副高的 MPA 优先，其他的党校单证优先，可提高发展下限，部分情况评中级职称有用' },
      { tag: '乡镇', chipClass: '', text: '5 年服务期内是黄金窗口，优先考虑读研预算和拿证概率，选择党校在职研究生与统考非全双证的各占一半' },
      { tag: '国企', chipClass: '', text: '受岗位类型和发展方向的影响较多，择校上统考非全偏向增强发展机会和专业能力提升，党校抬高下限' },
      { tag: '民族地区', chipClass: 'chip-success', text: '党校优先（四川民族专项 +15 分 + 单独录取批次）' },
    ],
  },
  {
    id: 'goal', title: '按目标看', desc: '先想清楚为什么，再决定走哪条。',
    rules: [
      { tag: '本单位晋升', chipClass: '', text: '党校在职为主（性价比 + 体制内认可双锁定）' },
      { tag: '遴选', chipClass: '', text: '优先双证（MPA / MBA / MEM），党校单证次选' },
      { tag: '事转公', chipClass: '', text: '优先双证 + 副处 / 副高级别满 2 年，党校单证次选' },
      { tag: '职称评审', chipClass: '', text: '国民教育序列双证；硕士比本科快 2-3 / 3-5 年到中级 / 副高' },
      { tag: '防御性占位', chipClass: 'chip-success', text: '党校优先（成本低 + 同事敏感度低 + 不掉队）' },
    ],
  },
  {
    id: 'edu', title: '按学历看', desc: '起点学历决定可选路径范围。',
    rules: [
      { tag: '全日制本科', chipClass: '', text: '两条路径都可选（路径 A 党校 / 路径 B 统考非全含 MPA / MBA / MEM），按目标和资源选' },
      { tag: '非全本科', chipClass: '', text: '两条路径基本全开，部分统考非全院校 MPA 需要检查是否限制非全日制本科' },
      { tag: '大专', chipClass: '', text: '党校全部不收。约30%选择统考非全研究生，统考非全可接受大专毕业满5年' },
    ],
  },
  {
    id: 'age', title: '按年龄看', desc: '时间窗口和政策红线视年龄段而定。',
    rules: [
      { tag: '25-30', chipClass: '', text: '条件够先冲含金量高的双证，服务期内是黄金窗口，无论如何先搞定研究生学历' },
      { tag: '31-35', chipClass: '', text: '根据目标和在职实际情况，选择统考非全双证 或 党校在职研究生单证' },
      { tag: '36-40', chipClass: 'chip-success', text: '晋升、调岗和防御一并考虑：政策上 2026 国考放宽至38' },
      { tag: '41+', chipClass: '', text: '党校在职为主选择（防御性占位 + 延迟退休政策下回报期延长），双证提升为辅' },
    ],
  },
]

const compareRows = [
  ['证书', '单证', '双证', '双证', '双证'],
  ['学信网', '❌ 不可查', '✅ 可查', '✅ 可查', '✅ 可查'],
  ['学费', '2.16-2.4 万', '2.4-10.5 万', '6-22 万', '8-13 万'],
  ['学制', '3 年', '2-3 年', '2-3 年', '2-3 年'],
  ['考试', '政治+专业课', '管综+英二', '管综+英二', '管综+英二'],
  ['党员', '四川必须/重庆不限', '不要求', '不要求', '不要求'],
  ['大专', '❌ 无资格', '满 5 年可报', '满 5 年可报', '满 5 年可报'],
]

onMounted(() => {
  trackPageView('learn')
  arrowDriftTimer = setInterval(() => {
    arrowDriftDown.value = !arrowDriftDown.value
  }, 1400)
})

// onShow(() => {
//   const pages = getCurrentPages()
//   const page = pages[pages.length - 1] as any
//   if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
//     page.getTabBar().setData({ selected: '/pages/learn/index' })
//   }
// })

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

.v6-page.has-tabbar {
  padding-bottom: calc(50px + env(safe-area-inset-bottom, 0px));
}

.policy-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.policy-card { margin-bottom: 0; padding: 14px; }

.policy-seq { font-size: 10px; color: #CF7140; letter-spacing: 0.14em; margin-bottom: 6px; display: block; }
.policy-title { font-family: "Songti SC", serif; font-size: 15px; font-weight: 600; line-height: 1.35; margin-bottom: 6px; display: block; color: #2A251E; }
.policy-desc { font-size: 12px; color: #6B6258; line-height: 1.6; display: block; }

.summary-card { background: linear-gradient(180deg, #fff8f3 0%, #ffffff 100%); margin-bottom: 0; padding: 14px 16px; }
.summary-title { font-family: "Songti SC", serif; font-size: 14px; font-weight: 600; color: #2A251E; margin-bottom: 6px; display: block; }
.summary-text { font-size: 12px; color: #6B6258; line-height: 1.8; display: block; }

.section-head-inline {
  width: 100%;
  align-items: flex-start;
  flex-direction: column;
  gap: 6px;
}

.learn-head-shell {
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

.section-head-h2 {
  line-height: 1.2;
}

.learn-head-meta {
  flex-shrink: 0;
  max-width: none;
  padding-right: 10px;
  color: #8A8175;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.08em;
  text-align: right;
  white-space: nowrap;
}

.learn-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 24px;
  border-radius: 10px;
  background: transparent;
}

.learn-toggle-text {
  display: none;
}

.learn-toggle-arrow {
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

.learn-toggle-arrow::before {
  content: '';
  width: 10px;
  height: 10px;
  border-right: 1.76px solid #CF7140;
  border-bottom: 1.76px solid #CF7140;
  transform: rotate(45deg) translateY(-1px);
  transform-origin: center;
}

.learn-toggle-arrow.open {
  transform: translateY(-10px) rotate(180deg);
}

.learn-toggle-arrow.drift {
  transform: translateY(-2px);
  opacity: 0.49;
}

.dim-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.dim-arrow-inline {
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

.dim-arrow-inline::before {
  content: '';
  width: 10px;
  height: 10px;
  border-right: 1.76px solid #CF7140;
  border-bottom: 1.76px solid #CF7140;
  transform: rotate(45deg) translateY(-1px);
  transform-origin: center;
}

.dim-arrow-inline.open {
  transform: translateY(-10px) rotate(180deg);
}

.dim-arrow-inline.drift {
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

.case-title { font-weight: 700; font-size: 14px; color: #2A251E; margin-bottom: 6px; display: block; }
.case-text { font-size: 13px; color: #6B6258; line-height: 1.8; display: block; }
.case-quote { font-size: 13px; color: #6B6258; line-height: 1.8; margin-top: 8px; display: block; }

.dim-chip {
  min-width: 76px;
  text-align: center;
  font-size: 11px;
  justify-content: center;
  flex-shrink: 0;
}

.knn-sub {
  font-size: 10px;
  opacity: 0.85;
}
</style>
