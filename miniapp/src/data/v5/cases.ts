export type CaseSystemFilterKey =
  | 'all'
  | 'government'
  | 'street'
  | 'education'
  | 'medical'
  | 'soe'
  | 'law'

export type CaseAgeFilterKey = 'all' | '25-30' | '30-35' | '35-40' | '40+'

export type CasePathFilterKey = 'all' | 'party-school' | 'tongkao'

export const v6CasesContent = {
  title: '1000+学员真实选择',
  brandLine: '已服务 1,000+ 川渝同学 · 不骗人 · 真服务',
  hero: {
    kicker: '真实样本',
    title: '1,000+ 川渝学员怎么选',
    subtitle: '所有案例信息均脱敏处理',
    copy: '按系统、年龄、路径筛一筛，看看和你最像的同学最后怎么选。'
  },
  metrics: [
    { label: '公开样本', key: 'total', suffix: '条', note: '当前发布层匿名案例' },
    { label: '党校路径', key: 'party', suffix: '条', note: '四川党校在职研究生' },
    { label: '统考路径', key: 'exam', suffix: '条', note: 'MPA / MBA / MEM' },
    { label: '高频系统', key: 'systems', suffix: '类', note: '党政机关占比最高' }
  ] as const,
  filters: {
    systems: [
      { key: 'all', label: '全部系统' },
      { key: 'government', label: '党政机关' },
      { key: 'street', label: '乡镇街道' },
      { key: 'education', label: '教育系统' },
      { key: 'medical', label: '医疗系统' },
      { key: 'soe', label: '国央企' },
      { key: 'law', label: '公检法纪检' }
    ] as const,
    ages: [
      { key: 'all', label: '全部年龄' },
      { key: '25-30', label: '25-30' },
      { key: '30-35', label: '30-35' },
      { key: '35-40', label: '35-40' },
      { key: '40+', label: '40+' }
    ] as const,
    paths: [
      { key: 'all', label: '全部路径' },
      { key: 'party-school', label: '党校在职研究生' },
      { key: 'tongkao', label: '统考非全' }
    ] as const
  },
  sections: {
    filtersTitle: '按画像筛选',
    filtersMetaPrefix: '当前共 ',
    filtersMetaSuffix: ' 条',
    summaryLabel: '当前筛到'
  },
  featured: {
    title: '先看 3 个代表样本',
    meta: '按当前正式数据自动挑选'
  },
  list: {
    title: '继续看更多',
    meta: '点击卡片看完整风险与建议',
    emptyTitle: '这一组画像的公开样本还不够多',
    emptyDesc: '当前公开样本里，这一组画像暂时没有更多可展示案例。你可以先换一个系统、年龄或路径继续看。',
    moreLabel: '继续加载更多案例',
    endLabel: '已展示当前筛选下全部匿名样本'
  },
  note: {
    title: '公开页说明',
    items: [
      '所有案例都已脱敏，不显示真实姓名、单位、区县和手机号。',
      '示例中的路径、系统和风险说明，均来自当前正式发布层，不以原型示例覆盖。',
      '案例会按正式发布层持续更新，同类画像下展示条数会随样本变化而变化。'
    ]
  },
  detail: {
    target: '目标院校 / 路径',
    selectedPath: '选了哪条路径',
    baseline: '基础与投入',
    risk: '当时最大的风险',
    advice: '建议怎么做',
    confirm: '知道了'
  },
  cta: {
    title: '还不确定自己更像哪一类？',
    desc: '先做测一测，系统会生成你的画像、推荐路径、相似个案和本周行动。',
    primary: '测一测我的路径',
    secondary: '看服务同学分布',
    tertiary: '联系顾问看更多案例'
  },
  footerHint: '↓ 已展示公开匿名样本 · 发布层会继续滚动更新',
  consult: {
    title: '联系顾问',
    official: '微信公众号',
    wecom: '企业微信号',
    qrcodeTip: '长按识别二维码'
  }
} as const
