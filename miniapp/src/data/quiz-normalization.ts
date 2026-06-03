type RawAnswers = Record<number, string | string[]>
type DpAnswers = Record<string, string>

export type NormalizedQuizAnswers = {
  system_key: string
  system: string
  system_detail: string
  party_member: string
  party_member_detail: string
  province_key: string
  province: string
  province_detail: string
  is_ethnic_region: boolean
  education: string
  age_key: string
  age: string
  age_detail: string
  goal: string
  goal_detail: string
  position: string
  budget: number
  budget_detail: string
  math_base: string
  study_time: string
  must_dual_degree: boolean
  worries: string[]
  worry_details: string[]
}

const SYSTEM_DETAIL_MAP: Record<string, string> = {
  dangzheng: '党政机关',
  gongjianfa: '公检法纪检',
  education: '教育系统',
  medical: '医疗系统',
  guoqi: '国企央企',
  bank_finance: '银行金融',
  xiangzhen: '乡镇街道',
  other_shiye: '其他事业编'
}

const SYSTEM_TO_STRATEGY_MAP: Record<string, string> = {
  dangzheng: '党政机关',
  gongjianfa: '公检法纪检',
  education: '教育医疗',
  medical: '教育医疗',
  guoqi: '国有企业',
  bank_finance: '国有企业',
  xiangzhen: '乡镇街道',
  other_shiye: '教育医疗'
}

const PROVINCE_MAP: Record<string, { value: string; detail: string; ethnic: boolean }> = {
  sichuan: { value: '四川', detail: '四川', ethnic: false },
  sichuan_minzu: { value: '四川', detail: '四川民族州', ethnic: true },
  chongqing: { value: '重庆', detail: '重庆', ethnic: false }
}

const EDUCATION_MAP: Record<string, string> = {
  full_time_bachelor: '全日制本科',
  part_time_bachelor: '非全日制本科',
  junior_college: '大专'
}

const AGE_MAP: Record<string, { value: string; detail: string }> = {
  '25-30': { value: '25-30', detail: '25-30' },
  '31-35': { value: '30-35', detail: '31-35' },
  '36-40': { value: '35-40', detail: '36-40' },
  '41+': { value: '40+', detail: '41+' }
}

const GOAL_MAP: Record<string, { value: string; detail: string }> = {
  promotion_in_unit: { value: '晋升', detail: '本单位晋升' },
  lianxuan: { value: '遴选', detail: '遴选/调任' },
  defensive: { value: '防御', detail: '防御/提升下限' },
  zhicheng: { value: '职称', detail: '职称评审' },
  transfer_civil_servant: { value: '转行', detail: '转公务员' },
  other: { value: '防御', detail: '学历提升/个人成长' }
}

const BUDGET_MAP: Record<string, { value: number; detail: string }> = {
  '2-5万': { value: 25000, detail: '2-5 万' },
  '5-10万': { value: 65000, detail: '5-10 万' },
  '10万+': { value: 100000, detail: '10 万 +' },
  // 兼容历史版本 value，避免旧缓存答案回放时失效
  '2-3w': { value: 25000, detail: '2-5 万' },
  '5-8w': { value: 65000, detail: '5-10 万' },
  '8w+': { value: 100000, detail: '10 万 +' }
}

const CONCERN_LABEL_MAP: Record<string, string> = {
  english_concern: '英语不好',
  math_concern: '数学不好',
  budget_concern: '学费贵 · 想省钱',
  age_concern: '年龄到了 35-38',
  unit_concern: '怕单位知道',
  exam_concern: '怕考不过 · 时间不够',
  no_concern: '没什么特别担心'
}

const PARTY_MAP: Record<string, { value: string; detail: string }> = {
  yes: { value: '是', detail: '是（含预备党员）' },
  no: { value: '否', detail: '不是' }
}

export const normalizeProvince = (value: string) => PROVINCE_MAP[value]?.value || ''

export const normalizeProvinceDisplay = (value: string) => PROVINCE_MAP[value]?.detail || ''

export const normalizeGoal = (value: string) => GOAL_MAP[value]?.value || '防御'

export const normalizeGoalDisplay = (value: string) => GOAL_MAP[value]?.detail || '防御/提升下限'

export const normalizeBudgetNum = (value: string) => BUDGET_MAP[value]?.value || 0

export const normalizeBudgetDisplay = (value: string) => BUDGET_MAP[value]?.detail || ''

export const normalizeConcernLabels = (values: string[]) =>
  values
    .map(value => CONCERN_LABEL_MAP[value] || value)
    .filter(Boolean)

export const normalizeMathBase = (dpAnswers: DpAnswers) => {
  const l1 = dpAnswers.L1 || ''
  const l3 = dpAnswers.L3 || ''
  const l3b = dpAnswers.L3b || ''

  if (!l1 || l1 === 'untested') return 'unknown'
  if (l3 === 'science_thinking') return 'normal'
  if (l3 === 'liberal_thinking') return 'weak'
  if (l3b === 'comprehension_effort') return 'normal'
  if (l3b === 'recitation_effort') return 'weak'
  return 'unknown'
}

export const normalizeStudyTime = (worries: string[]) =>
  worries.includes('exam_concern') ? '小于等于1h' : '时间不固定'

export const normalizeSystemForStrategy = (value: string) => SYSTEM_TO_STRATEGY_MAP[value] || ''

export const buildNormalizedQuizAnswers = (answers: RawAnswers, dpAnswers: DpAnswers): NormalizedQuizAnswers => {
  const rawSystem = String(answers[1] || '')
  const rawParty = String(answers[2] || '')
  const rawProvince = String(answers[3] || '')
  const rawEducation = String(answers[4] || '')
  const rawAge = String(answers[5] || '')
  const rawGoal = String(answers[6] || '')
  const rawPosition = String(answers[7] || '')
  const rawBudget = String(answers[8] || '')
  const worries = ((answers[9] as string[]) || []).filter(Boolean)

  const province = PROVINCE_MAP[rawProvince]
  const party = PARTY_MAP[rawParty]
  const age = AGE_MAP[rawAge]
  const goal = GOAL_MAP[rawGoal] || GOAL_MAP.defensive

  return {
    system_key: rawSystem,
    system: normalizeSystemForStrategy(rawSystem),
    system_detail: SYSTEM_DETAIL_MAP[rawSystem] || rawSystem,
    party_member: party?.value || '',
    party_member_detail: party?.detail || '',
    province_key: rawProvince,
    province: province?.value || '',
    province_detail: province?.detail || '',
    is_ethnic_region: province?.ethnic || false,
    education: EDUCATION_MAP[rawEducation] || '',
    age_key: rawAge,
    age: age?.value || '',
    age_detail: age?.detail || '',
    goal: goal.value,
    goal_detail: goal.detail,
    position: rawPosition,
    budget: normalizeBudgetNum(rawBudget),
    budget_detail: normalizeBudgetDisplay(rawBudget),
    math_base: normalizeMathBase(dpAnswers),
    study_time: normalizeStudyTime(worries),
    must_dual_degree: dpAnswers.L2 === 'must_dual_degree',
    worries,
    worry_details: normalizeConcernLabels(worries)
  }
}
