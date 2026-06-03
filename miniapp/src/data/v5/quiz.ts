export type V5QuizOption = {
  value: string
  label: string
}

export type V5QuizQuestion = {
  id: number
  field: string
  title: string
  hint: string
  required?: boolean
  multi?: boolean
  dynamicOptionsKey?: 'q7BySystem'
  options: V5QuizOption[]
}

export type V5DpLayer = {
  id: 'L1' | 'L2' | 'L3' | 'L3b'
  title: string
  hint: string
  banner?: {
    kicker: string
    text: string
  }
  options: V5QuizOption[]
  note: string
}

export const v5QuizContent = {
  route: 'test-quiz',
  prd: '§4.6 答题（9 题 · Q1 八宫格 · DP001 反向追问）',
  dataSources: ['questions.json', 'dialog_protocols.json'],
  title: '测一测',
  brandLine: '已服务 1,000+ 川渝同学 · 不骗人 · 真服务',
  banner: {
    kicker: '⏱ 答题约 3-5 分钟',
    text: '如果你担心英数底子 → 测完会单独再问你 3 个问题，帮你确认是否真的不行。'
  },
  ui: {
    emptyQ7: '请先在 Q1 选择系统类型',
    skip: '跳过本题',
    prev: '← 上一题',
    prevFromDp: '← 返回 Q9',
    next: '下一题 →',
    nextStep: '下一步 →',
    submit: '提交 → 看你的方向建议',
    progress: {
      questionPrefix: '第',
      questionMid: '题 / 共',
      questionSuffix: '题',
      dpPrefix: '反向追问 · DP001 · '
    },
    dynamicHintPrefix: '可跳过 · 候选按你 Q1 选的「',
    dynamicHintSuffix: '」展开'
  },
  questions: [
    {
      id: 1,
      field: 'system',
      title: '你在哪个系统工作？',
      hint: '单选 · 决定后续岗位选项 + 专业匹配',
      required: true,
      options: [
        { value: 'dangzheng', label: '党政机关' },
        { value: 'gongjianfa', label: '公检法纪检' },
        { value: 'education', label: '教育系统' },
        { value: 'medical', label: '医疗系统' },
        { value: 'guoqi', label: '国企央企' },
        { value: 'bank_finance', label: '银行金融' },
        { value: 'xiangzhen', label: '乡镇街道' },
        { value: 'other_shiye', label: '其他事业编' }
      ]
    },
    {
      id: 2,
      field: 'partyMember',
      title: '你是党员或预备党员吗？',
      hint: '含预备党员 · 影响院校范围',
      required: true,
      options: [
        { value: 'yes', label: '是（含预备党员）' },
        { value: 'no', label: '不是' }
      ]
    },
    {
      id: 3,
      field: 'province',
      title: '你在四川还是重庆？',
      hint: '单选 · 民族州在四川党校有专项加分',
      required: true,
      options: [
        { value: 'sichuan', label: '四川（普通地市）' },
        { value: 'sichuan_minzu', label: '四川民族州（甘孜 · 阿坝 · 凉山）' },
        { value: 'chongqing', label: '重庆' }
      ]
    },
    {
      id: 4,
      field: 'education',
      title: '你的最高学历？',
      hint: '大专不能报党校',
      options: [
        { value: 'full_time_bachelor', label: '全日制本科' },
        { value: 'part_time_bachelor', label: '非全日制本科' },
        { value: 'junior_college', label: '大专' }
      ]
    },
    {
      id: 5,
      field: 'age',
      title: '你的年龄段？',
      hint: '影响遴选 / 调任等时间窗口提醒',
      options: [
        { value: '25-30', label: '25-30' },
        { value: '31-35', label: '31-35' },
        { value: '36-40', label: '36-40' },
        { value: '41+', label: '41 +' }
      ]
    },
    {
      id: 6,
      field: 'goal',
      title: '读研的核心目标？',
      hint: '核心分流题（党校 vs 统考双证）',
      options: [
        { value: 'promotion_in_unit', label: '在单位/系统内更稳或晋升（职级并行）' },
        { value: 'lianxuan', label: '想跳出本单位（遴选/调任等）' },
        { value: 'defensive', label: '危机感，不想被卡在学历上（提升下限）' },
        { value: 'zhicheng', label: '职称评审需要（教育 / 医疗 / 事业编）' },
        { value: 'transfer_civil_servant', label: '想从国企 / 事业编转公务员' },
        { value: 'other', label: '其他（学历身份提升 / 个人成长 / 给孩子做榜样）' }
      ]
    },
    {
      id: 7,
      field: 'position',
      title: '具体岗位方向？',
      hint: '候选随你选的系统动态切换',
      dynamicOptionsKey: 'q7BySystem',
      options: []
    },
    {
      id: 8,
      field: 'budget',
      title: '学费预算范围？',
      hint: '筛掉超出预算的院校',
      options: [
        { value: '2-5万', label: '2-5 万' },
        { value: '5-10万', label: '5-10 万' },
        { value: '10万+', label: '10 万 +' }
      ]
    },
    {
      id: 9,
      field: 'concerns',
      title: '你最担心的是？',
      hint: '多选 · 主观顾虑表达',
      multi: true,
      options: [
        { value: 'english_concern', label: '英语不好' },
        { value: 'math_concern', label: '数学不好' },
        { value: 'budget_concern', label: '学费贵 · 想省钱' },
        { value: 'age_concern', label: '年龄到了 35-38' },
        { value: 'unit_concern', label: '怕单位知道' },
        { value: 'exam_concern', label: '怕考不过 · 时间不够' },
        { value: 'no_concern', label: '没什么特别担心' }
      ]
    }
  ] satisfies V5QuizQuestion[],
  q7BySystem: {
    dangzheng: ['组织部', '宣传部', '纪委监委', '财政发改', '人社民政', '应急管理', '司法法治信访', '综合岗'],
    gongjianfa: ['公安系统', '法院检察院', '司法行政', '综合岗'],
    education: ['教师', '教育管理（校长 / 教导主任）', '教育局机关', '综合岗'],
    medical: ['医护', '医院党务 / 行政', '卫健委机关', '综合岗'],
    guoqi: ['管理岗', '技术岗', '党建纪检', '综合岗'],
    bank_finance: ['业务岗', '管理岗', '党建纪检', '综合岗'],
    xiangzhen: ['社区村镇管理', '社会事务民政', '党建组织', '综合岗'],
    other_shiye: ['管理岗（走职务）', '专技岗（走职称）', '党务行政', '财务审计', '综合岗']
  } as Record<string, string[]>,
  dp: [
    {
      id: 'L1',
      title: '追问1 · 真的不行吗？',
      hint: '你说"英语不行 / 数学不行"，是真实考过试测下来不行，认真学习过不行，还是没正式测过只是主观觉得自己不行？',
      banner: {
        kicker: '⚡ 英语数学追问',
        text: '聊路径前先确认下，帮你判断是不是真不行。'
      },
      options: [
        { value: 'tested', label: 'A. 测试过' },
        { value: 'untested', label: 'B. 没测试过' }
      ],
      note: '💡 选 A 测试过 → 会问你具体分数；选 B 没测试过 → 透出门槛："非全管综英语二满分 100 只需过 34-38 分；管综数学是高中 + 大学初级，不是考研数学一/二难度"'
    },
    {
      id: 'L2',
      title: '追问2 · 一定要双证吗？',
      hint: '你的考研目标对学位类型有硬性要求吗？',
      options: [
        { value: 'must_dual_degree', label: 'A. 必须双证（遴选/调任/职称等要求）' },
        { value: 'no_hard_requirement', label: 'B. 没有硬性要求' },
        { value: 'first_get_certificate', label: 'C. 先有证再优化' }
      ],
      note: '💡 A 必须双证 → 推统考非全研究生；B 没有硬性要求 → 推党校（不考英数才是真省力点）；C 先有证再优化 → 党校优先 + 统考非全备选（防御性立场：先确保不掉队再考虑加分）'
    },
    {
      id: 'L3',
      title: '追问3 · 能力偏好？',
      hint: '你更擅长学习理科知识还是文科类知识？',
      options: [
        { value: 'science_thinking', label: 'A. 理科思维' },
        { value: 'liberal_thinking', label: 'B. 文科思维' },
        { value: 'unsure', label: 'C. 说不准' }
      ],
      note: '💡 A 理科 → 推统考非全管综（数学+英二+逻辑靠方法和推导）；B 文科 → 推党校（全主观题靠材料积累+论述）；C 说不准 → 再问一题深入辨析'
    },
    {
      id: 'L3b',
      title: '追问4 · 努力偏好？',
      hint: '你更愿意在理解上努力，还是在大量背诵上努力？',
      options: [
        { value: 'comprehension_effort', label: 'A. 更愿意在理解/思考上努力' },
        { value: 'recitation_effort', label: 'B. 更愿意在背诵/重复上努力' }
      ],
      note: '💡 A 理解努力 → 类管综 → 统考非全研究生；B 背诵努力 → 类党校 → 党校在职研究生'
    }
  ] satisfies V5DpLayer[],
  escape: {
    label: '先去了解相关规则 →',
    note: ''
  }
} as const

export type V5QuizContent = typeof v5QuizContent
