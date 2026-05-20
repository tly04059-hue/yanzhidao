<template>
  <view class="page-v3">
    <!-- 顶部导航 -->
    <view class="topbar">
      <view class="tb-btn" @click="goBack">‹</view>
      <text class="tb-title">备考方案</text>
      <view class="tb-btn">⤴</view>
    </view>

    <!-- Hero -->
    <view class="hero">
      <view class="hero-card">
        <text class="hero-tag">{{ currentPlan.tag }}</text>
        <text class="hero-title">{{ currentPlan.title }}</text>
        <text class="hero-sub">{{ currentPlan.subtitle }}</text>
        <view class="hero-stats">
          <view class="hero-stat">
            <text class="stat-v">{{ currentPlan.cycle }}</text>
            <text class="stat-l">周期</text>
          </view>
          <view class="hero-stat">
            <text class="stat-v">{{ currentPlan.stageCount }}</text>
            <text class="stat-l">节奏</text>
          </view>
          <view class="hero-stat">
            <text class="stat-v">{{ currentPlan.cost }}</text>
            <text class="stat-l">学费</text>
          </view>
        </view>
      </view>
    </view>

    <view class="plan-switch">
      <view class="plan-chip" :class="{ active: pathType === 'management' }" @click="pathType = 'management'">管综备考</view>
      <view class="plan-chip" :class="{ active: pathType === 'party' }" @click="pathType = 'party'">党校备考</view>
    </view>

    <!-- 备考时间轴 HUD -->
    <view class="timeline-section">
      <view class="section-head">
        <text class="kicker">Timeline · {{ currentPlan.stageCount }}</text>
        <text class="section-title">备考时间轴</text>
      </view>
      <view class="timeline-card">
        <view class="timeline-track">
          <view class="track-fill"></view>
          <view class="timeline-nodes">
            <view class="node-item"><view class="node-dot"></view></view>
            <view class="node-item"><view class="node-dot future"></view></view>
            <view class="node-item"><view class="node-dot future"></view></view>
            <view class="node-item"><view class="node-dot future"></view></view>
          </view>
        </view>
        <view class="timeline-labels">
          <view v-for="node in currentPlan.nodes" :key="node.time" class="node-label"><text class="node-d">{{ node.time }}</text><text class="node-s">{{ node.name }}</text></view>
        </view>
      </view>
    </view>

    <!-- 4 阶段卡 -->
    <view class="stages">
      <view v-for="(stage, idx) in currentPlan.stages" :key="idx" class="stage-card">
        <view class="stage-head">
          <view class="stage-num">{{ stage.num }}</view>
          <view class="stage-info">
            <text class="stage-name">{{ stage.name }}</text>
            <text class="stage-time">{{ stage.time }}</text>
          </view>
        </view>
        <text class="stage-goal" v-html="stage.goal"></text>
        <view class="stage-list">
          <view v-for="(item, i) in stage.tasks" :key="i" class="stage-item">
            <view class="stage-item-ico">✓</view>
            <text>{{ item }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 同行案例 -->
    <view class="case-section">
      <view class="section-head">
        <text class="section-title">按这套节奏上岸的同行</text>
      </view>
      <view class="case-card">
        <view class="case-h">
          <text class="case-name">{{ currentPlan.caseName }}</text>
          <text class="case-status">已上岸</text>
        </view>
        <text class="case-text">"{{ currentPlan.caseText }}"</text>
      </view>
    </view>

    <!-- 底部 CTA -->
    <view class="cta-bar">
      <view class="bb-side" @click="savePlan">
        <text class="bb-ico">★</text>
        <text class="bb-lbl">收藏</text>
      </view>
    </view>

    <!-- Tab Bar -->
    <view class="tab-bar">
      <view class="tab-item" @click="goHome">
        <image class="tab-icon-img" src="/static/icons/tab-home.svg" mode="aspectFit" />
        <text class="tab-label">首页</text>
      </view>
      <view class="tab-item" @click="goLearn">
        <image class="tab-icon-img" src="/static/icons/tab-learn.svg" mode="aspectFit" />
        <text class="tab-label">了解</text>
      </view>
      <view class="tab-item" @click="goTest">
        <image class="tab-icon-img" src="/static/icons/tab-test.svg" mode="aspectFit" />
        <text class="tab-label">测一测</text>
      </view>
      <view class="tab-item" @click="goContact">
        <image class="tab-icon-img" src="/static/icons/tab-contact.svg" mode="aspectFit" />
        <text class="tab-label">咨询</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const pathType = ref<'management' | 'party'>('management')

const managementStages = [
  {
    num: '01',
    name: '基础阶段',
    time: '6-8 月 · 12 周 · 每周 6h',
    goal: '先把<span style="color:#CF7140;font-weight:600">英语二词汇</span>过一遍 + 数学公式建立体系——<strong>"听得懂、做得对"</strong>。',
    tasks: [
      '英语二 5500 词刷 2 遍（每天 50 个）',
      '数学公式手册 + 例题入门（算术 / 代数 / 几何）',
      '逻辑 0 基础课（形式逻辑 + 论证逻辑）',
      '提前面试材料准备（目标院校 · 周末上交）'
    ]
  },
  {
    num: '02',
    name: '强化阶段',
    time: '9-10 月 · 8 周 · 每周 8h',
    goal: '真题切片 · <span style="color:#CF7140;font-weight:600">高频考点</span>逐个突破——<strong>"做得快、做得稳"</strong>。',
    tasks: [
      '近 10 年联考真题分章节训练',
      '逻辑专项（每周 30 题 · 错题归类）',
      '写作模板搭建（论说文 + 论证有效性分析）',
      '提前面试现场（目标院校优先批）'
    ]
  },
  {
    num: '03',
    name: '冲刺阶段',
    time: '11 月 · 4 周 · 每周 10h',
    goal: '挑命中率最高的 <span style="color:#CF7140;font-weight:600">30% 高频考点</span>集中讲透——<strong>"押中分数"</strong>。',
    tasks: [
      '近 5 年真题第 2 / 3 轮（限时 · 计分）',
      '三轮模考（全真模拟 · 含一对一改卷）',
      '写作背诵 10 个万能开头 + 5 个万能结尾',
      '政治大题 20 个考点背诵（11 月底启动）'
    ]
  },
  {
    num: '04',
    name: '联考冲线',
    time: '12 月 · 2 周 · 心态收尾',
    goal: '最后 2 周 <span style="color:#CF7140;font-weight:600">不学新东西</span>——<strong>"保住已学的 · 不焦虑"</strong>。',
    tasks: [
      '每天复习一份错题本',
      '政治冲刺背诵（每天 1h）',
      '提前 3 天看考场 + 准备身份证 / 笔',
      '考前晚 8 点前关书，12 点前睡'
    ]
  }
]

const partyStages = [
  {
    num: '01',
    name: '资格与路径确认',
    time: '3 月前 · 1-2 周',
    goal: '先确认<span style="color:#CF7140;font-weight:600">单位认可口径</span>、党员身份、工作年限和地区限制——<strong>"能不能报、值不值得报"</strong>。',
    tasks: [
      '确认本单位是否认可党校在职研究生学历',
      '四川用户核对党员/预备党员、本科、3 年工作经验',
      '重庆用户核对本科、2 年工作经验和川渝工作范围',
      '民族地区用户单独核对专项、加分和证明材料'
    ]
  },
  {
    num: '02',
    name: '报名与材料阶段',
    time: '3 月 · 报名窗口',
    goal: '完成报名、缴费和资料准备，把<span style="color:#CF7140;font-weight:600">资格风险</span>提前处理掉。',
    tasks: [
      '重庆党校关注 3 月 2 日-16 日报名和 3 月 17 日缴费截止',
      '四川党校关注 3 月 18 日-31 日报名和报名上限',
      '提前处理学信网学历认证、党校函授本科、军队院校学历等问题',
      '保存报名表、缴费凭证、单位证明和后续资格审查材料'
    ]
  },
  {
    num: '03',
    name: '专业课强化',
    time: '4-5 月 · 每周 6-8h',
    goal: '围绕政治理论和专业综合建立<span style="color:#CF7140;font-weight:600">主观题输出</span>能力。',
    tasks: [
      '按目标专业拆参考书和核心课程',
      '每周完成 2 套简答/辨析/论述题框架',
      '四川政治理论补选择题，重庆重点练全主观题表达',
      '把岗位经历转成公共管理、党政、法学或经济类答题素材'
    ]
  },
  {
    num: '04',
    name: '考试与录取跟进',
    time: '5-6 月 · 考前冲线',
    goal: '按专业考试日期收尾，考后盯紧<span style="color:#CF7140;font-weight:600">成绩、复核、资格审查</span>。',
    tasks: [
      '下载准考证并确认考点交通和住宿',
      '考前 10 天只背高频框架和错题',
      '成绩发布后 2 日内判断是否需要复核',
      '拟录取后准备现场资格审查和入学材料'
    ]
  }
]

const currentPlan = computed(() => {
  if (pathType.value === 'party') {
    return {
      tag: '党校系 · 四川党校 / 重庆党校',
      title: '党校在职研\n备考路线图',
      subtitle: '3-6 月关键节点 · 适合体制内低预算、免全国联考路径',
      cycle: '4 月',
      stageCount: '4 阶段',
      cost: '¥ 2.16-2.4 万',
      nodes: [
        { time: '03前', name: '资格' },
        { time: '03', name: '报名' },
        { time: '04-05', name: '强化' },
        { time: '05-06', name: '考试' }
      ],
      stages: partyStages,
      materials: [
        { name: '党校报考资格核对表', meta: '四川/重庆条件对照 + 单位认可确认', tag: '免费领取', free: true },
        { name: '党校专业选择清单', meta: '经济/政治/法学/公管/党政/战略岗位映射', tag: '免费领取', free: true },
        { name: '主观题答题框架包', meta: '简答 · 辨析 · 论述题结构模板', tag: '资料包', free: false }
      ],
      caseName: '陈女士 · 区县机关 · 38 岁',
      caseText: '先确认单位认可，再选党校路径；没有被联考拖住，按主观题框架准备后顺利上岸。',
      editorNote: '党校路径不是“更简单的研究生”，而是更明确的体制内使用场景。先确认单位认可和报考资格，再谈专业选择与备考。'
    }
  }
  return {
    tag: '管综系 · MPA / MBA / MEM',
    title: '非全日制管综\n备考路线图',
    subtitle: '12 个月时间表 · 周末 1 天 / 周 · 适合体制内在职 28-40 岁',
    cycle: '12 月',
    stageCount: '4 阶段',
    cost: '¥ 6-12 万',
    nodes: [
      { time: '06-08', name: '基础' },
      { time: '09-10', name: '强化' },
      { time: '11', name: '冲刺' },
      { time: '12', name: '联考' }
    ],
    stages: managementStages,
    materials: [
      { name: '研知道管综基础班', meta: '12 周 · 含全套讲义 + 答疑', tag: '¥ X,XXX', free: false },
      { name: '研知道冲刺班（8 周）', meta: '含三轮模考 + 一对一批注', tag: '¥ X,XXX', free: false },
      { name: '提前面试材料包', meta: '12 所目标院校模板 + 复盘', tag: '免费领取', free: true }
    ],
    caseName: '王 X X · 市直机关 · 34 岁',
    caseText: '周末 1 天 / 周，半年备考、第一次联考超国家线 32 分。完全按这个 12 月时间表跑下来的。',
    editorNote: '这套方案是给“周末 1 天/周”在职人定制的。每周 6-10h，持续 12 个月，比每周 30h 持续 3 个月有效得多。'
  }
})

onLoad((options: any) => {
  const value = String(options?.pathType || options?.type || '')
  if (value.includes('党校') || value.includes('party') || value.includes('dx')) {
    pathType.value = 'party'
  }
})

const goBack = () => uni.navigateBack()
const goHome = () => uni.redirectTo({ url: '/pages/index/index' })
const goLearn = () => uni.redirectTo({ url: '/pages/learn/index' })
const goTest = () => uni.redirectTo({ url: '/pages/test/index' })
const goContact = () => uni.redirectTo({ url: '/pages/contact/index' })

const savePlan = () => {
  uni.showToast({ title: '已收藏此方案', icon: 'success' })
}
</script>

<style lang="scss" scoped>
/* 按 UI 样本 12_备考方案_管综.html 规范编写 */
.page-v3 {
  width: 100%;
  background: #F5EFE7;
  min-height: 100vh;
  padding-bottom: 200px;
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
  font-size: 24px;
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
  background: #CF7140;
  color: white;
  border-radius: 24px;
  padding: 44px 36px;
  position: relative;
  overflow: hidden;
}

.hero-card::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%);
}

.hero-tag {
  display: inline-block;
  background: rgba(255,255,255,0.18);
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 17px;
  letter-spacing: 0.16em;
  margin-bottom: 20px;
  font-family: "Songti SC", serif;
}

.hero-title {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 44px;
  line-height: 1.28;
  margin-bottom: 14px;
  white-space: pre-line;
}

.hero-sub {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 19px;
  color: rgba(255,255,255,0.85);
  line-height: 1.65;
  margin-bottom: 22px;
}

.hero-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  padding-top: 22px;
  border-top: 1px solid rgba(255,255,255,0.22);
}

.hero-stat {
  text-align: center;
}

.plan-switch {
  margin: 0 32px 18px;
  background: #FFFFFF;
  border: 0.5px solid #ECE5D8;
  border-radius: 14px;
  padding: 6px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.plan-chip {
  text-align: center;
  padding: 14px 10px;
  border-radius: 10px;
  font-family: "Songti SC", serif;
  font-size: 18px;
  font-weight: 600;
  color: #6B6258;
}

.plan-chip.active {
  background: #CF7140;
  color: #FFFFFF;
}

.stat-v {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 26px;
  color: white;
}

.stat-l {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 14px;
  color: rgba(255,255,255,0.7);
  margin-top: 4px;
  letter-spacing: 0.06em;
}

/* 时间轴 */
.timeline-section {
  padding: 8px 32px 16px;
}

.section-head {
  margin-bottom: 16px;
  padding: 0 4px;
}

.kicker {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 500;
  font-size: 18px;
  color: #CF7140;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.section-title {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 30px;
  color: #2A251E;
}

.timeline-card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 0.5px solid #ECE5D8;
  padding: 32px 28px;
}

.timeline-track {
  position: relative;
  height: 12px;
  background: #E8E1D5;
  border-radius: 999px;
  margin: 8px 12px 24px;
}

.track-fill {
  width: 25%;
  height: 100%;
  background: #CF7140;
  border-radius: 999px;
}

.timeline-nodes {
  position: absolute;
  top: -10px;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.node-item {
  display: flex;
  justify-content: center;
}

.node-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 3px solid #CF7140;
}

.node-dot.future {
  border-color: #8A8175;
}

.timeline-labels {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.node-label {
  text-align: center;
}

.node-d {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 17px;
  color: #2A251E;
  margin-top: 12px;
}

.node-s {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 17px;
  color: #6B6258;
  margin-top: 4px;
}

/* 4 阶段卡 */
.stages {
  padding: 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stage-card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 0.5px solid #ECE5D8;
  padding: 30px 30px;
}

.stage-head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 0.5px solid #E8E1D5;
}

.stage-num {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #F1E0D3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 22px;
  color: #CF7140;
  flex-shrink: 0;
}

.stage-info {
  flex: 1;
}

.stage-name {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 600;
  font-size: 26px;
  color: #2A251E;
  margin-bottom: 4px;
}

.stage-time {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 16px;
  color: #8A8175;
  letter-spacing: 0.04em;
}

.stage-goal {
  display: block;
  font-family: "Songti SC", serif;
  font-weight: 500;
  font-size: 18px;
  color: #6B6258;
  line-height: 1.6;
  margin-bottom: 16px;
}

.stage-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stage-item {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  font-family: "Songti SC", serif;
  font-size: 17px;
  line-height: 1.6;
  color: #2A251E;
}

.stage-item-ico {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #F1E0D3;
  color: #CF7140;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Songti SC", serif;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 2px;
}

/* 同行案例 */
.case-section {
  padding: 24px 32px;
}

.case-card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 0.5px solid #ECE5D8;
  padding: 24px 26px;
}

.case-h {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.case-name {
  font-family: "Songti SC", serif;
  font-weight: 500;
  font-size: 17px;
  color: #2A251E;
}

.case-status {
  font-family: "Songti SC", serif;
  font-size: 14px;
  color: #5F8C6E;
  background: #DAE5DC;
  padding: 4px 12px;
  border-radius: 999px;
  letter-spacing: 0.04em;
}

.case-text {
  display: block;
  font-family: "Songti SC", serif;
  font-size: 19px;
  line-height: 1.7;
  color: #2A251E;
}

/* 底部 CTA */
.cta-bar {
  height: 46px;
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border-top: 0.5px solid #ECE5D8;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  box-sizing: border-box;
}

</style>
