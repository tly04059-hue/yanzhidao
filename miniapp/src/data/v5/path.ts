import type { V5NavigationTarget, V5RouteKey } from './types'

export type V5PathCompareRow = {
  dimension: string
  pathA: string
  pathB: string
  pathANote?: string
  pathBNote?: string
}

export const v5PathContent = {
  route: 'path',
  prd: '§4.4 路径对比页',
  dataSources: ['path_options.json'],
  title: '路径对比',
  hero: {
    kicker: '路径对比',
    title: '党校 vs 统考非全 · 11 维对比',
    copy: '两条路径平等并列，选择适合自己的。'
  },
  table: {
    columns: {
      dimension: '维度',
      pathA: '路径 A · 党校在职',
      pathB: '路径 B · 统考非全'
    },
    rows: [
      { dimension: '证书类型', pathA: '单证（学历证）', pathB: '双证（学历+学位）' },
      { dimension: '学信网', pathA: '不可查', pathB: '可查' },
      { dimension: '考试科目', pathA: '政治理论+专业课', pathANote: '主观题为主', pathB: '199 联考', pathBNote: '管综+英二' },
      { dimension: '学费区间', pathA: '2.16-2.4 万 / 3 年', pathB: '5-26 万 / 2.5-3 年' },
      { dimension: '学制', pathA: '3 年', pathB: '2.5-3 年' },
      { dimension: '授课方式', pathA: '川：寒暑假集中授课', pathANote: '渝：周末授课', pathB: '周末班 / 集中授课班' },
      { dimension: '报考条件', pathA: '川：党员·工龄≥3年', pathANote: '渝：工龄≥2年', pathB: '大专毕业满5年', pathBNote: '本科毕业满3年' },
      { dimension: '认可范围', pathA: '体制内认可/晋升', pathANote: '部分情况评中级可用', pathB: '各类场景通用/遴选', pathBNote: '事转公/职称评审等' },
      { dimension: '大专可报', pathA: '❌ 不可报', pathB: '✅ 毕业满5年' },
      { dimension: '难度', pathA: '低-中（主观题多）', pathB: '中-高（考英数）' },
      { dimension: '适合人群', pathA: '单位内晋升/学历兜底', pathANote: '担心英数/预算紧', pathB: '遴选及事转公刚需', pathBNote: '中级副高评职称等' }
    ] satisfies V5PathCompareRow[]
  },
  note: '以上数据、信息截止2026年5月。',
  actions: [
    {
      label: '测一测，看哪条更适合你',
      route: 'test-entry'
    },
    {
      label: '看不同路径的详细信息',
      route: 'prep'
    }
  ] satisfies V5NavigationTarget[],
  tabs: [
    { label: '首页', route: 'home' },
    { label: '了解', route: 'understand' },
    { label: '测一测', route: 'test-entry' }
  ] satisfies Array<{ label: string; route: V5RouteKey }>
} as const

export type V5PathContent = typeof v5PathContent

