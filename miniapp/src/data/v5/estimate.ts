export const v6EstimateContent = {
  title: '估分工具',
  brandLine: '已服务 1,000+ 川渝同学 · 不骗人 · 真服务',
  hero: {
    kicker: 'Beta 工具',
    title: '先估一个大概区间',
    subtitle: '如果你现在还没做过完整的测试题，先把它当作“方向感”，不是正式结果，也欢迎滑到页面底部联系班主任做一套测试题再来评估。'
  },
  notice: {
    title: '先说边界',
    items: [
      '这里只做你自己的粗估，不输出“必上 / 稳上”一类结论。',
      '英语和管综主观题波动会比较大，建议按你更保守的一侧填写。',
      '最终择校还是要结合地区、预算、目标和正式院校数据。'
    ]
  },
  form: {
    title: '输入你的预估分数',
    fields: [
      { key: 'math', label: '数学', placeholder: '0-75' },
      { key: 'logic', label: '逻辑', placeholder: '0-60' },
      { key: 'writing', label: '写作', placeholder: '0-65' },
      { key: 'english', label: '英语二', placeholder: '0-100' }
    ]
  },
  result: {
    title: '你的当前分数带',
    bands: [
      {
        id: 'low',
        label: '先补基础',
        range: '< 140',
        desc: '先别急着定学校，优先把英语和管综基础补到能稳定过线。'
      },
      {
        id: 'mid',
        label: '可做第一轮筛校',
        range: '140-179',
        desc: '可以开始筛党校和中段 MPA，但要结合复试线和预算看风险。'
      },
      {
        id: 'high',
        label: '可以看更强院校',
        range: '180+',
        desc: '可以关注竞争更强的学校，但仍要防止单科和复试波动。'
      }
    ]
  },
  tips: {
    title: '怎么看这个分数',
    items: [
      '如果你现在还没做完整套题，先把它当作“方向感”，不是正式结果。',
      '如果你是体制内防御型需求，党校路径不只看分，还要看党员、工龄和授课节奏。',
      '如果你是为遴选、职称或双证准备，后面要去院校库里看具体项目。'
    ]
  },
  cta: {
    primary: '去院校库继续筛',
    secondary: '先测一测适合哪条路径',
    tertiary: '看过考率说明'
  }
} as const

export type V6EstimateContent = typeof v6EstimateContent
