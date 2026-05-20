// 诊断题目数据
// Q1（系统选择）在首页六宫格完成，这里从 Q2 开始

export const systemOptions = [
  { id: 'gov', icon: '🏛️', label: '党政机关', desc: '组织/宣传/纪委' },
  { id: 'law', icon: '⚖️', label: '公检法', desc: '纪检' },
  { id: 'township', icon: '🏘️', label: '乡镇街道', desc: '基层岗位' },
  { id: 'public', icon: '🏥', label: '教育医疗', desc: '学校医院' },
  { id: 'soe', icon: '🏢', label: '国企银行', desc: '城投金融' },
  { id: 'ethnic', icon: '🏔️', label: '民族地区', desc: '甘孜阿坝' }
]

export const questions = [
  {
    key: 'party_member',
    title: '你是中共党员吗？',
    subtitle: '（含预备党员）',
    options: [
      { value: 'yes', label: '是（含预备党员）' },
      { value: 'no', label: '不是' }
    ]
  },
  {
    key: 'region',
    title: '你在四川还是重庆工作？',
    options: [
      { value: 'sichuan', label: '四川' },
      { value: 'chongqing', label: '重庆' }
    ]
  },
  {
    key: 'education',
    title: '你的最高学历是？',
    options: [
      { value: 'fulltime_bachelor', label: '全日制本科' },
      { value: 'parttime_bachelor', label: '非全日制本科' },
      { value: 'college', label: '大专' }
    ]
  },
  {
    key: 'age',
    title: '你的年龄段？',
    options: [
      { value: '25-30', label: '25-30岁' },
      { value: '31-35', label: '31-35岁' },
      { value: '36-40', label: '36-40岁' },
      { value: '41+', label: '41岁以上' }
    ]
  },
  {
    key: 'goal',
    title: '你读研的核心目标是什么？',
    dynamicOptions: {
      gov: [
        { value: 'promotion', label: '本单位晋升' },
        { value: 'transfer', label: '遴选到上级单位' },
        { value: 'defense', label: '防御性储备（学历保底）' }
      ],
      law: [
        { value: 'promotion', label: '本单位晋升' },
        { value: 'transfer', label: '遴选到上级单位' },
        { value: 'defense', label: '防御性储备（学历保底）' }
      ],
      township: [
        { value: 'promotion', label: '本单位晋升' },
        { value: 'transfer', label: '遴选到上级单位' },
        { value: 'defense', label: '防御性储备（学历保底）' }
      ],
      public: [
        { value: 'title', label: '职称评定需要' },
        { value: 'promotion', label: '转管理岗/晋升' },
        { value: 'defense', label: '防御性储备（学历保底）' }
      ],
      soe: [
        { value: 'promotion', label: '本单位晋升' },
        { value: 'switch', label: '考虑转公务员' },
        { value: 'defense', label: '防御性储备（学历保底）' }
      ],
      ethnic: [
        { value: 'promotion', label: '本单位晋升' },
        { value: 'transfer', label: '遴选到上级单位' },
        { value: 'defense', label: '防御性储备（学历保底）' }
      ]
    }
  },
  {
    key: 'position',
    title: '你的具体岗位方向？',
    dynamicOptions: {
      gov: [
        { value: 'org_propaganda', label: '组织部/宣传部/统战部' },
        { value: 'discipline', label: '纪委监委' },
        { value: 'finance', label: '财政/经信/发改/统计' },
        { value: 'civil', label: '民政/人社/街道/社区' },
        { value: 'legal', label: '法治/信访/司法' },
        { value: 'emergency', label: '应急管理' },
        { value: 'other', label: '其他' }
      ],
      law: [
        { value: 'police', label: '公安系统' },
        { value: 'court', label: '法院' },
        { value: 'procuratorate', label: '检察院' },
        { value: 'discipline', label: '纪委监委' },
        { value: 'other', label: '其他' }
      ],
      township: [
        { value: 'general', label: '综合管理岗' },
        { value: 'civil', label: '民政/社会事务' },
        { value: 'party', label: '党建/纪检' },
        { value: 'other', label: '其他' }
      ],
      public: [
        { value: 'teacher_admin', label: '教师（管理岗）' },
        { value: 'teacher_tech', label: '教师（专技岗）' },
        { value: 'medical_admin', label: '医护（管理岗）' },
        { value: 'medical_tech', label: '医护（专技岗）' },
        { value: 'other', label: '其他' }
      ],
      soe: [
        { value: 'party', label: '国企党委/纪委' },
        { value: 'management', label: '管理岗' },
        { value: 'finance_bank', label: '银行/金融' },
        { value: 'other', label: '其他' }
      ],
      ethnic: [
        { value: 'general', label: '综合管理岗' },
        { value: 'civil', label: '民政/社会事务' },
        { value: 'other', label: '其他' }
      ]
    }
  },
  {
    key: 'budget',
    title: '你的预算范围？',
    options: [
      { value: 'low', label: '2-3万（党校学费水平）' },
      { value: 'mid', label: '5-8万（MPA学费水平）' },
      { value: 'high', label: '8万以上' }
    ]
  }
]
