export const v6UsageContent = {
  title: '使用说明',
  brandLine: '研知道 · 川渝在职考研 · 不骗人 · 真服务',
  hero: {
    kicker: '怎么用',
    title: '3 种状态 · 3 条路径',
    subtitle: '按当前的状态分流，或直接咨询。'
  },
  entries: [
    {
      title: '1. 我还在犹豫',
      body: [
        '从「了解」Tab 进入',
        '按系统 / 目标 / 学历 / 年龄四个维度看政策和案例',
        '看清学历对你的真实作用再决定'
      ],
      action: '进入了解',
      route: '/pages/learn/index'
    },
    {
      title: '2. 我想知道适合考什么',
      body: [
        '从「测一测」Tab 进入',
        '8-9 题（Q9 可不选）· 3-5 分钟',
        '得到党校在职研究生 vs 统考非全研究生的个性化建议'
      ],
      action: '开始测一测',
      route: '/pages/test/index'
    },
    {
      title: '3. 想详细了解',
      body: [
        '从首页「看备考时间节奏」入口进入',
        '选路径，党校在职研究生 or 统考非全研究生',
        '看具体院校 + 备考时间 + 报名节奏'
      ],
      action: '看备考时间节奏',
      route: '/pages/timeline/index'
    }
  ],
  cta: {
    primary: '加企微 1 对 1 咨询',
    secondary: '先回首页'
  },
  footer: '■ 研知道 · 川渝在职考研 · 不骗人 · 真服务'
} as const
