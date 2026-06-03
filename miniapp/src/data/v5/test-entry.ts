export const v5TestEntryContent = {
  route: 'test-entry',
  prd: '§4.5 测一测入口',
  dataSources: ['copy.json'],
  title: '测一测',
  brandLine: '已服务 1,000+ 川渝同学 · 不骗人 · 真服务',
  hero: {
    kicker: '测一测',
    title: '川渝体制内选校诊断',
    copy: '8-9 道题，3-5 分钟获得：'
  },
  promises: ['适合你的读研路径', '推荐的具体学校和专业', '和你情况相似的学员选择', '针对性的下一步动作'],
  action: '开始测试',
  footer: {
    privacy: '仅用于生成你的专属方案，严格保密'
  }
} as const

export type V5TestEntryContent = typeof v5TestEntryContent
