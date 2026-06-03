export const v5ResultContent = {
  route: 'result',
  prd: '§4.8 结果页 8 区块',
  dataSources: ['rules', 'copy', 'cases', 'pass_rate', 'peer_profile_cache', 'policy_basis', 'zexiao'],
  title: '你的选校方向建议',
  brandLine: '已服务 1,000+ 川渝同学 · 不骗人 · 真服务',
  diagnosis: {
    kicker: '选校诊断结果',
    title: '选校方向建议'
  },
  ui: {
    blockedTitle: '暂不建议直接报考',
    provinceFallback: '川渝',
    defaultProfile: '32 岁 · 成都 · 财政局 · 全日制本科 · 党员 · 目标：本单位晋升',
    retry: '重测',
    share: '分享',
    skippedLabelMap: {
      education: '学历',
      age: '年龄',
      goal: '目标',
      position: '岗位',
      budget: '预算'
    },
    skipNoticeTemplate: '你跳过了 {count} 题（{fields}），这些项会按川渝平均情况补值。',
    meaningIntroPrefix: '在',
    meaningIntroSuffix: '里，',
    riskLabels: {
      time: '学习时间',
      math: '数学基础',
      english: '英语基础',
      path: '路径风险',
      school: '择校提醒'
    },
    strategyFallbacks: {
      mbaReason: '品牌通用性 · 管理岗适配 · 周末授课',
      memReason: '技术转管理 · 双证需求 · 项目制岗位适配'
    }
  },
  skipNotice: {
    kicker: '📋 跳题补值说明',
    action: '补答让方案更准 →'
  },
  recommendation: {
    crown: '⭐ 首选推荐',
    matchLabel: '匹配度'
  },
  meaning: {
    title: '推荐理由',
    subtitle: '政策 + 真实作用',
    intro: '研究生学历的实际作用：',
    cards: [
      {
        title: '政策层面',
        muted: false,
        items: [
          '竞争上岗：研究生 +0.5 档（依据 2019 中办职级并行规定）',
          '遴选参考：省直财税遴选 50% 岗位要求研究生',
          '组织考察：学历作为综合素质指标'
        ]
      },
      {
        title: '真实作用 · 基于 186 位财政学员数据',
        muted: false,
        items: [
          '78% 在 3 年内晋升或竞争上岗',
          '45% 提到“学历在组织考察中起了关键作用”'
        ]
      },
      {
        title: '为什么这个时候做这件事',
        muted: false,
        items: [
          '延迟退休 63-65 岁配套政策下，体制内职业生涯延长 3-5 年',
          '国考限研岗占比 7%（2022）→ 12.95%（2025）— 学历从加分项向准入项过渡',
          '末等退出常态化（国企改办〔2021〕7 号）— 学历是少数你能拿到、不被替代、长期有效的资产',
          '三条政策叠加 = 3-5 年窗口期。基于核实政策事实的可能性和判断方向。'
        ]
      }
    ]
  },
  alternative: {
    title: '备选方案',
    subtitle: '统考非全研究生',
    defaultReason: '如果你未来考虑遴选到省级机关，MPA 双证是更稳妥的硬性门槛准备。',
    action: '查看院校库 →'
  },
  peer: {
    title: '同行实际怎么选',
    subtitle: '5a 个案 + 5b K-NN 聚合',
    casePrefix: '相似个案',
    selectedLabel: '选了',
    riskLabel: '提醒',
    aggregateTitle: '同样画像的同学怎么选',
    aggregateBadge: 'K-NN 5 维',
    sampleIntro: '和你 5 维画像相似的 12 位同学怎么选：',
    sourceNote: '',
    partyReasons: '不考英数 · 本系统晋升 · 学费低',
    mpaReasons: '遴选硬门槛 · 双证'
  },
  peerCompare: {
    title: '同行对比',
    subtitle: '186 位相似学员',
    partyLabel: '党校',
    mpaLabel: 'MPA'
  },
  guidance: {
    strategy: {
      title: '推荐策略',
      subtitle: '按你的信息筛选',
      reasonTitle: '为什么推荐这条路径'
    },
    risk: {
      title: '备考风险提示',
      subtitle: '先避坑再择校'
    },
    plan: {
      title: '本周最小行动',
      subtitle: '可直接执行'
    }
  },
  passRate: {
    title: '研知道辅导过考率',
    subtitle: '公开透明',
    summary: [
      {
        label: '四川党校',
        value: '40.4%',
        note: '25 年辅导口径'
      },
      {
        label: '重庆党校',
        value: '44%',
        note: '25 年辅导口径'
      },
      {
        label: '管综初试',
        value: '55.6%',
        note: '2026 届辅导口径'
      },
      {
        label: '管综复试',
        value: '87.5%',
        note: '2026 届辅导口径 · 含调剂'
      }
    ],
    baseline: '全国管综自然过线率约 25%',
    detailToggle: '',
    details: [],
    action: '看完整 5 段说明 →'
  },
  nextActions: {
    title: '你能做的下一步',
    subtitle: '研知道不催不诱',
    items: [
      {
        id: 'save',
        title: '⭐ 保存择校方向建议到手机',
        desc: '1 张完整长图 · 含路径建议 + 参考政策 + 相似故事 + 行动清单',
        action: '主 CTA · 跳长图 →',
        primary: true
      },
      {
        id: 'pass-rate',
        title: '这 4 个过考率怎么算的？',
        desc: '验证我们数据真实性的最直接路径。',
        action: '看过考率说明 →',
        primary: false
      },
      {
        id: 'wechat',
        title: '把你的情况和咨询人员聊聊',
        desc: '不会打扰你，不骗人真服务，可以放心聊！',
        action: '加企微 →',
        primary: false
      }
    ]
  },
  bottomActions: {
    primary: '看看院校库',
    secondary: '看看同学案例'
  }
} as const

export type V5ResultContent = typeof v5ResultContent
