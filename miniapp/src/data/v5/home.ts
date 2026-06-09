import type { V5EntryCard, V5MetricCard, V5NavigationTarget, V5SectionHeader } from './types'

export const v5HomeContent = {
  route: 'home',
  prd: '§4.1 首页',
  dataSources: ['copy.json', 'pass_rate.json', 'about.json'],
  title: '研知道',
  brandLine: '已服务1000+川渝同学 · 不骗人 · 真服务',
  hero: {
    kicker: '辅导过考率',
    title: '研知道，川渝在职考研',
    copy: '服务统考非全研究生和川渝党校在职研究生，提供择校及备考信息，结合真实服务数据，助你考研上岸。'
  },
  metrics: [
    {
      value: '40.4%',
      label: '四川党校',
      note: '2025年辅导过考率',
      route: 'pass-rate'
    },
    {
      value: '44%',
      label: '重庆党校',
      note: '2025年辅导过考率',
      route: 'pass-rate'
    },
    {
      value: '55.6%',
      label: '管综初试',
      note: '2026管综非全初试辅导过考率',
      route: 'pass-rate'
    },
    {
      value: '87.5%',
      label: '管综复试',
      note: '2026管综非全复试辅导过考率',
      route: 'pass-rate'
    }
  ] satisfies V5MetricCard[],
  metricHint: '点数字看「过考率怎么算的」',
  entrySection: {
    header: {
      title: '你现在更像哪种状态',
      meta: '3 个入口'
    } satisfies V5SectionHeader,
    items: [
      {
        title: '先了解',
        description: '还没决定，看看学历有什么用，了解院校和真实案例。',
        action: '浏览政策、案例、院校信息 →',
        route: 'understand'
      },
      {
        title: '测一测',
        description: '有想法，快速判断适合党校单证还是统考非全双证。',
        action: '3 分钟得到第一轮建议 →',
        route: 'test-entry'
      },
      {
        title: '看看备考时间节奏',
        description: '了解不同考研路径的区别、报考条件和时间安排。',
        action: '党校在职研究生 vs 统考非全研究生 →',
        route: 'prep'
      }
    ] satisfies V5EntryCard[]
  },
  otherSection: {
    header: {
      title: '院校/案例/咨询',
      meta: '查询、说明、联系'
    } satisfies V5SectionHeader,
    items: [
      { label: '院校库查询', route: 'zk-lib' },
      { label: '1,000+ 同学真实案例', route: 'cases' },
      { label: '1,000+ 同学的川渝分布', route: 'map' },
      { label: '加企业微信1对1咨询', route: 'wechat' },
      { label: '数据来源与说明', route: 'data-source' },
      { label: '使用说明', route: 'usage' },
      { label: '关于研知道', route: 'about' }
    ] satisfies V5NavigationTarget[]
  },
  footer: {
    title: '不骗人 · 真服务',
    subtitle: '研知道 · 成立于 2021 年'
  }
} as const

export type V5HomeContent = typeof v5HomeContent
