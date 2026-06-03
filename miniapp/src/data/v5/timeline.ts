export type BulletPart = { text: string; accent?: true }

export type PrepPath = {
  title: string
  bullets: BulletPart[][]
  actionLabel: string
  actionRoute: string
}

export const v6TimelineContent = {
  title: '选择备考路径',
  brandLine: '已服务 1,000+ 川渝同学 · 不骗人 · 真服务',
  hero: {
    kicker: '备考方案 · 第一屏',
    title: '你的目标适合哪条路径？',
    copy: '两条路径核心差异是：学信网可查与否、备考投入及适用场景。'
  },
  pathsSection: {
    title: '两条路径',
    meta: '2 选 1'
  },
  paths: [
    {
      title: '党校在职研究生（单证）',
      bullets: [
        [{ text: '学费 2.16-2.4 万 / 3 年' }],
        [{ text: '政治理论 + 专业课，不考英语数学' }],
        [{ text: '体制内认可【中发〔2000〕10 号文】' }],
        [{ text: '学信网不可查 · 有学历证无学位证' }],
        [{ text: '四川党校：须党员身份 / 重庆党校：不限党员身份' }],
        [{ text: '适合：单位内晋升 / 发展 / 防御 / 体制内资源' }],
        [{ text: '局限：遴选 / 事转公 / 部分职称评定不完全适配' }],
        [{ text: '四川 2025 年辅导过考率 ' }, { text: '40.4%', accent: true }],
        [{ text: '重庆 2025 年辅导过考率 ' }, { text: '44%', accent: true }]
      ],
      actionLabel: '查看更多党校备考信息 →',
      actionRoute: 'contact'
    },
    {
      title: '统考非全研究生（MPA / MBA / MEM）',
      bullets: [
        [{ text: '主流学费：MPA 2.4-15 万 / MBA 6-22 万 / MEM 8-13 万' }],
        [{ text: '学制 2-3 年' }],
        [{ text: '考管理类综合（逻辑 / 写作 / 数学）+ 英语二' }],
        [{ text: '学信网可查 · 国民教育序列双证' }],
        [{ text: '条件：专科毕业满 5 年 / 本科毕业满 3 年（算到入学时）' }],
        [{ text: '适合：遴选 / 调任 / 职称等各类需求' }],
        [{ text: '局限：考英语数学，备考投入有门槛' }],
        [{ text: '2026 年管综辅导通过率：初试 ' }, { text: '55.6%', accent: true }, { text: ' → 复试 ' }, { text: '87.5%', accent: true }],
        [{ text: '初试为研知道辅导的学员复试上岸率 100%。' }]
      ],
      actionLabel: '查看更多统考备考信息 →',
      actionRoute: 'contact'
    }
  ] as PrepPath[],
  ctas: {
    primary: '测一测，看看适合什么路径',
    secondary1: '看看院校库',
    secondary2: '真实同学案例'
  }
} as const

export type V6TimelineContent = typeof v6TimelineContent
