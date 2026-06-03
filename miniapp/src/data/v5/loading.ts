export const v5LoadingContent = {
  route: 'loading',
  prd: '§4.7 加载过渡（2-3 秒）',
  dataSources: ['copy.json'],
  title: '正在生成你的方向建议',
  steps: [
    { text: '✓ 读取你的画像', state: 'done' },
    { text: '✓ 匹配相似画像同学', state: 'done' },
    { text: '→ 测算路径推荐', state: 'active' },
    { text: '合成方向建议长图', state: 'pending' }
  ],
  devAction: '查看结果（开发示例直跳）'
} as const

export type V5LoadingContent = typeof v5LoadingContent
