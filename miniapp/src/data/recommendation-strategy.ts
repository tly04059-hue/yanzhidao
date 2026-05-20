import strategyPayload from './recommendation-strategies-publish.json'
import schoolPayload from './199exam-miniapp-school-publish-sc-cq.json'
import partySchoolPayload from './party-school-miniapp-publish.json'

type Answers = Record<string, any>

type Strategy = {
  strategy_id: string
  priority: number
  primary_path: string
  program_type: string
  reason: string
  match?: {
    systems?: string[]
    goals?: string[]
    age_bands?: string[]
    education?: string[]
    math_bases?: string[]
    study_times?: string[]
    budget_min?: number
    budget_max?: number
  }
  school_query?: {
    program_type: string
    province_from_answer?: boolean
    budget_from_answer?: boolean
  }
  static_schools?: RecommendedSchool[]
  school_priorities?: string[]
  risk_cards?: string[]
  weekly_plan?: string[]
  tags?: string[]
}

type SchoolRecord = {
  school_id: string
  school_name: string
  program_type: string
  province: string
  city: string
  tuition_min?: number | null
  latest_score?: string
  enrollment?: number | string | null
  study_mode?: string
  class_time?: string
  school_level_display?: string
}

export type RecommendedSchool = {
  name: string
  tuition: number
  reason: string
  meta?: string
}

export type LocalRecommendation = {
  blocked: boolean
  strategyId: string
  primaryPath: string
  reason: string
  message?: string
  warnings: Array<{ message: string }>
  recommendedSchools: RecommendedSchool[]
  schoolPriorities: string[]
  riskCards: string[]
  weeklyPlan: Array<{ title: string; desc: string }>
}

const strategies = ((strategyPayload as any).strategies || []) as Strategy[]
const schoolRecords = [
  ...(((schoolPayload as any).records || []) as SchoolRecord[]),
  ...(((partySchoolPayload as any).records || []) as SchoolRecord[])
]

const normalizeBudget = (value: any): number => {
  if (typeof value === 'number') return value
  const parsed = Number(String(value || '').replace(/[^\d.]/g, ''))
  return Number.isNaN(parsed) ? 0 : parsed
}

const answerValue = (answers: Answers, key: string) => {
  const aliases: Record<string, string[]> = {
    study_time: ['study_time', 'studyTime'],
    math_base: ['math_base', 'mathBase'],
    age: ['age'],
    goal: ['goal'],
    system: ['system'],
    education: ['education'],
    province: ['province'],
    budget: ['budget']
  }
  const keys = aliases[key] || [key]
  for (const item of keys) {
    if (answers[item] !== undefined && answers[item] !== null && answers[item] !== '') return answers[item]
  }
  return ''
}

const matchesList = (list: string[] | undefined, value: any) => {
  if (!list || !list.length) return 0
  return list.includes(String(value)) ? 1 : -1
}

const scoreStrategy = (strategy: Strategy, answers: Answers) => {
  const match = strategy.match || {}
  let score = strategy.priority || 0
  const checks: Array<[number, number]> = [
    [matchesList(match.systems, answerValue(answers, 'system')), 24],
    [matchesList(match.goals, answerValue(answers, 'goal')), 18],
    [matchesList(match.age_bands, answerValue(answers, 'age')), 12],
    [matchesList(match.education, answerValue(answers, 'education')), 8],
    [matchesList(match.math_bases, answerValue(answers, 'math_base')), 10],
    [matchesList(match.study_times, answerValue(answers, 'study_time')), 8]
  ]
  checks.forEach(([result, weight]) => {
    if (result > 0) score += weight
    if (result < 0) score -= Math.round(weight * 0.7)
  })

  const budget = normalizeBudget(answerValue(answers, 'budget'))
  if (typeof match.budget_min === 'number') {
    score += budget >= match.budget_min ? 10 : -8
  }
  if (typeof match.budget_max === 'number') {
    score += budget && budget <= match.budget_max ? 16 : -6
  }
  return score
}

const pickStrategy = (answers: Answers): Strategy => {
  const ranked = strategies
    .map(strategy => ({ strategy, score: scoreStrategy(strategy, answers) }))
    .sort((a, b) => b.score - a.score || b.strategy.priority - a.strategy.priority)
  return ranked[0]?.strategy || strategies[strategies.length - 1]
}

const pickRepresentative = (records: SchoolRecord[]) => {
  const hasTuition = (record: SchoolRecord) => typeof record.tuition_min === 'number'
  const nonFullWithTuition = records.find(record => record.study_mode === '非全日制' && hasTuition(record))
  const nonFull = records.find(record => record.study_mode === '非全日制')
  const anyWithTuition = records.find(hasTuition)
  return nonFullWithTuition || nonFull || anyWithTuition || records[0]
}

const groupSchools = (records: SchoolRecord[]) => {
  const groups = new Map<string, SchoolRecord[]>()
  records.forEach(record => {
    const key = `${record.school_id}-${record.program_type}`
    const current = groups.get(key) || []
    current.push(record)
    groups.set(key, current)
  })
  return Array.from(groups.values()).map(pickRepresentative)
}

const buildSchoolReason = (record: SchoolRecord, strategy: Strategy) => {
  const parts = [record.province, record.city, record.study_mode, record.latest_score ? `${record.latest_score} 分数线` : '分数线待确认']
    .filter(Boolean)
  if (strategy.program_type === 'MEM') parts.push('需复核 MEM 细分方向')
  if (strategy.program_type === '党校') parts.push('免全国联考 · 单证')
  return parts.join(' · ')
}

const recommendSchools = (strategy: Strategy, answers: Answers): RecommendedSchool[] => {
  if (strategy.static_schools?.length) return strategy.static_schools.slice(0, 3)
  const query = strategy.school_query
  if (!query?.program_type) return []
  const province = String(answerValue(answers, 'province') || '')
  const budget = normalizeBudget(answerValue(answers, 'budget'))
  let candidates = schoolRecords.filter(record => record.program_type === query.program_type)
  if (query.province_from_answer && province) {
    const local = candidates.filter(record => record.province === province)
    if (local.length) candidates = local
  }
  if (query.budget_from_answer && budget) {
    const inBudget = candidates.filter(record => typeof record.tuition_min === 'number' && record.tuition_min <= budget)
    if (inBudget.length) candidates = inBudget
  }
  const grouped = groupSchools(candidates)
  grouped.sort((a, b) => {
    const provinceA = a.province === province ? 0 : 1
    const provinceB = b.province === province ? 0 : 1
    const tuitionA = typeof a.tuition_min === 'number' ? a.tuition_min : Number.MAX_SAFE_INTEGER
    const tuitionB = typeof b.tuition_min === 'number' ? b.tuition_min : Number.MAX_SAFE_INTEGER
    return provinceA - provinceB || tuitionA - tuitionB || a.school_name.localeCompare(b.school_name, 'zh-Hans-CN')
  })
  return grouped.slice(0, 3).map(record => ({
    name: `${record.school_name} ${record.program_type}`,
    tuition: typeof record.tuition_min === 'number' ? record.tuition_min : 0,
    reason: buildSchoolReason(record, strategy),
    meta: strategy.program_type === '党校' ? '非全日制 · 单证 · 免全国联考' : '非全日制 · 双证'
  }))
}

const weeklyPlanObjects = (items: string[] = []) => {
  return items.slice(0, 3).map((desc, index) => ({
    title: `第 ${index + 1} 步`,
    desc
  }))
}

export const getLocalRecommendation = (answers: Answers): LocalRecommendation => {
  const strategy = pickStrategy(answers)
  const warnings = (strategy.risk_cards || []).map(message => ({ message }))
  return {
    blocked: false,
    strategyId: strategy.strategy_id,
    primaryPath: strategy.primary_path,
    reason: strategy.reason,
    warnings,
    recommendedSchools: recommendSchools(strategy, answers),
    schoolPriorities: strategy.school_priorities || [],
    riskCards: strategy.risk_cards || [],
    weeklyPlan: weeklyPlanObjects(strategy.weekly_plan || [])
  }
}
