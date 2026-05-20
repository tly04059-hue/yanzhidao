export const intakeFields = {
  basic: ['姓名', '性别', '年龄', '联系电话', '微信号', '工作年限', '所在城市'],
  education: ['最高学历', '毕业院校', '专业', '毕业时间'],
  work: ['工作单位性质', '职位名称', '工作内容'],
  target: ['报考专业', '目标院校', '选择原因'],
  learning: ['考研经历', '学习进度', '英语基础', '数学基础', '逻辑写作准备', '每日学习时间', '学习方式偏好'],
  service: ['辅导需求', '是否需要一对一答疑', '课程时间要求', '模考需求']
}

export const customerInsights = {
  sampleSize: 19,
  availableTime: [
    { label: '1h-2h', count: 9, desc: '最常见，适合拆成每日词汇+周末系统课' },
    { label: '2h及以上', count: 6, desc: '可以进入常规通关节奏' },
    { label: '时间不固定', count: 3, desc: '需要弹性计划，优先保证背词和补课' },
    { label: '小于等于1h', count: 1, desc: '需要极简任务和保底择校' }
  ],
  mathBase: [
    { label: '高考未及格/初中水平', count: 12, desc: '数学是最大风险，院校建议优先低分、低复试压力' },
    { label: '高考中下', count: 5, desc: '可冲常规 MPA/MBA，但需要稳定刷题' },
    { label: '高考良好', count: 2, desc: '择校空间更大，可考虑名校或性价比强校' }
  ],
  coreNeeds: ['分低', '学费低', '好上岸', '周末授课', '离所在城市近', '15万以内', '只要证书'],
  commonRisks: ['非常忙碌', '工作繁忙期', '家庭突发情况', '学习动力不强', 'CPA等其他考试占用时间'],
  progressPattern: {
    foundation: '基础课常见短板集中在数学和英语，系统课写作启动普遍偏晚。',
    action: '结果页应给用户一个“本周最小可执行计划”，而不是只给院校名单。'
  }
}

export const schoolDataSummary = {
  source: 'data.json / 中国研究生招生信息网结构化数据',
  totalSchools: 65,
  byProgram: [
    { label: 'MPA', count: 35 },
    { label: 'MBA', count: 30 }
  ],
  byRegion: [
    { label: '四川', count: 28 },
    { label: '重庆', count: 17 },
    { label: '云南', count: 12 },
    { label: '贵州', count: 8 }
  ],
  usefulFields: ['学费', '招生人数', '考试科目', '去年分数线', '今年分数线', '复录比/录取率', '学习方式', '方向']
}

export const dataDrivenCases = [
  {
    id: 1,
    title: '成都在职学员 · 每天 1-2 小时',
    profile: '理科 · 数学中下 · 四级未过',
    target: '川大或川农，MBA 也可，要求分数性价比高',
    risk: '非常忙碌，计划执行难',
    advice: '先按“低分性价比”筛选，再用 7 天最小学习计划恢复节奏。',
    tags: ['时间少', '数学中下', '低分诉求']
  },
  {
    id: 2,
    title: '卫生系统学员 · 基础弱但时间可投入',
    profile: '未上高中 · 数学未及格 · 四级未过 · 每天 2h+',
    target: 'MPA，好上岸',
    risk: '正式学习时间较晚，基础课需要补齐',
    advice: '择校优先看低分、低学费和招生人数；学习上先补数学基础和英语词汇。',
    tags: ['基础弱', 'MPA', '好上岸']
  },
  {
    id: 3,
    title: '宜宾在职学员 · 家庭事务占用',
    profile: '未上高中 · 数学初中水平 · 四级未过',
    target: 'MPA，分数和学费低，好上岸',
    risk: '家庭突发情况多，无法稳定执行周计划',
    advice: '推荐保底院校+弹性计划，不建议盲目冲名校。',
    tags: ['特殊情况', '低学费', '保底']
  },
  {
    id: 4,
    title: '成都周末授课诉求 · MBA',
    profile: '理科 · 数学中下 · 四级基础',
    target: 'MBA，分数低，学费 15w 以下，周末授课，成都',
    risk: '地点和授课时间是硬约束',
    advice: '先筛成都/周边和学费上限，再比较复试压力。',
    tags: ['MBA', '周末授课', '15万以内']
  }
]

export const answerOptionHints = {
  studyTime: {
    '小于等于1h': '时间极紧，建议保底择校+极简任务。',
    '1h-2h': '真实学员最常见，需要稳定周计划。',
    '2h及以上': '可以执行常规通关节奏。',
    '时间不固定': '建议用弹性计划，优先背词和补课。'
  },
  mathBase: {
    weak: '数学是主要风险，优先低分、低学费、招生人数较多的院校。',
    normal: '可考虑常规 MPA/MBA，但需要持续刷题。',
    good: '可考虑更高层级或更匹配城市的院校。'
  }
}
