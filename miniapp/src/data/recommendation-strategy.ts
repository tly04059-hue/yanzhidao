import schoolPayload from './199exam-miniapp-school-publish-sc-cq.json'
import partySchoolPayload from './party-school-miniapp-publish.json'

type Answers = Record<string, any>

type SchoolRecord = {
  id?: string
  school_id: string
  program_id?: string
  school_name: string
  short_name?: string
  program_type: string
  province: string
  city: string
  tuition_min?: number | null
  tuition_max?: number | null
  latest_score?: string
  enrollment?: number | string | null
  major_label?: string
  direction?: string
  duration?: number | null
  study_mode?: string
  class_time?: string
  degree_type?: string
  exam_type?: string
  school_level_display?: string
  total_score?: number | null
  tags?: string[]
  publish?: {
    source_record_id?: string
    source_file?: string
  }
}

type ProgramType = '党校' | 'MPA' | 'MBA' | 'MEM'

type RouteCandidate = {
  ruleId: string
  primaryPath: string
  programType: ProgramType
  reason: string
  matchPercent: number
  preferredSchoolNames?: string[]
  preferredPartyMajors?: string[]
  schoolPriorities: string[]
  riskCards: string[]
  weeklyPlan: string[]
}

export type RecommendedSchool = {
  name: string
  tuition: number
  reason: string
  meta?: string
  schoolName?: string
  shortName?: string
  province?: string
  city?: string
  duration?: number | null
  programType?: string
  majorLabel?: string
  direction?: string
  studyMode?: string
  degreeType?: string
  examType?: string
  sourceRecordId?: string
  sourceFile?: string
  ruleId?: string
  fitSignals?: string[]
}

export type SecondaryRecommendation = {
  strategyId: string
  primaryPath: string
  programType: string
  reason: string
  matchPercent: number
  recommendedSchool?: RecommendedSchool
}

export type LocalRecommendation = {
  blocked: boolean
  strategyId: string
  primaryPath: string
  matchPercent: number
  reason: string
  message?: string
  warnings: Array<{ message: string }>
  recommendedSchools: RecommendedSchool[]
  secondaryOption?: SecondaryRecommendation
  schoolPriorities: string[]
  riskCards: string[]
  weeklyPlan: Array<{ title: string; desc: string }>
  source: {
    primaryRuleId: string
    secondaryRuleId?: string
    schoolSourceRecordIds: string[]
  }
}

type RecommendationContext = {
  systemKey: string
  system: string
  systemDetail: string
  partyMember: boolean
  provinceKey: string
  province: string
  isEthnicRegion: boolean
  education: string
  ageKey: string
  age: string
  goal: string
  goalDetail: string
  position: string
  budget: number
  budgetCeiling: number
  mathBase: string
  studyTime: string
  mustDualDegree: boolean
  worries: string[]
}

const schoolRecords = [
  ...(((schoolPayload as any).records || []) as SchoolRecord[]),
  ...(((partySchoolPayload as any).records || []) as SchoolRecord[])
]

const normalizeBudget = (value: any): number => {
  if (typeof value === "number") return value
  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""))
  return Number.isNaN(parsed) ? 0 : parsed
}

const answerValue = (answers: Answers, key: string) => {
  const aliases: Record<string, string[]> = {
    system: ["system"],
    system_key: ["system_key"],
    system_detail: ["system_detail"],
    party_member: ["party_member"],
    province: ["province"],
    province_key: ["province_key"],
    is_ethnic_region: ["is_ethnic_region"],
    education: ["education"],
    age: ["age"],
    age_key: ["age_key"],
    goal: ["goal"],
    goal_detail: ["goal_detail"],
    position: ["position"],
    budget: ["budget"],
    math_base: ["math_base", "mathBase"],
    study_time: ["study_time", "studyTime"],
    must_dual_degree: ["must_dual_degree"],
    worries: ["worries"]
  }
  const keys = aliases[key] || [key]
  for (const item of keys) {
    if (answers[item] !== undefined && answers[item] !== null && answers[item] !== "") return answers[item]
  }
  return ""
}

const budgetCeilingFromMidpoint = (budget: number) => {
  if (!budget) return Number.POSITIVE_INFINITY
  if (budget <= 25000) return 30000
  if (budget <= 65000) return 80000
  return Number.POSITIVE_INFINITY
}

const cleanSchoolName = (value: string) =>
  String(value || "")
    .replace(/^中共/, "")
    .replace(/\(四川行政学院\)|\(重庆行政学院\)/g, "")
    .trim()

const buildContext = (answers: Answers): RecommendationContext => {
  const budget = normalizeBudget(answerValue(answers, "budget"))

  return {
    systemKey: String(answerValue(answers, "system_key") || ""),
    system: String(answerValue(answers, "system") || ""),
    systemDetail: String(answerValue(answers, "system_detail") || ""),
    partyMember: String(answerValue(answers, "party_member") || "") === "是",
    provinceKey: String(answerValue(answers, "province_key") || ""),
    province: String(answerValue(answers, "province") || ""),
    isEthnicRegion: answerValue(answers, "is_ethnic_region") === true,
    education: String(answerValue(answers, "education") || ""),
    ageKey: String(answerValue(answers, "age_key") || ""),
    age: String(answerValue(answers, "age") || ""),
    goal: String(answerValue(answers, "goal") || ""),
    goalDetail: String(answerValue(answers, "goal_detail") || ""),
    position: String(answerValue(answers, "position") || ""),
    budget,
    budgetCeiling: budgetCeilingFromMidpoint(budget),
    mathBase: String(answerValue(answers, "math_base") || ""),
    studyTime: String(answerValue(answers, "study_time") || ""),
    mustDualDegree: answerValue(answers, "must_dual_degree") === true,
    worries: ((answerValue(answers, "worries") as string[]) || []).filter(Boolean)
  }
}

const isRigidDualGoal = (ctx: RecommendationContext) =>
  ctx.mustDualDegree || ["遴选", "转行", "职称"].includes(ctx.goal)

const isPartyFriendlyGoal = (ctx: RecommendationContext) =>
  ["晋升", "防御"].includes(ctx.goal) || !ctx.goal

const isEducationMedical = (ctx: RecommendationContext) =>
  ["education", "medical", "other_shiye"].includes(ctx.systemKey)

const isPublicLegal = (ctx: RecommendationContext) => ctx.systemKey === "gongjianfa"

const isEnterprise = (ctx: RecommendationContext) => ["guoqi", "bank_finance"].includes(ctx.systemKey)

const isEnterpriseMidWindow = (ctx: RecommendationContext) =>
  isEnterprise(ctx) && ["31-35", "36-40"].includes(ctx.ageKey)

const isManagementLikePosition = (position: string) =>
  ["管理岗", "管理岗（走职务）", "业务岗", "组织部", "宣传部", "纪委监委", "财政发改", "教育管理（校长 / 教导主任）"].includes(position)

const isTechnicalLikePosition = (position: string) =>
  ["技术岗", "专技岗（走职称）", "医护", "教师"].includes(position)

const canChooseAnyPartySchool = (ctx: RecommendationContext) => ctx.education !== "大专"

const canChooseSichuanPartySchool = (ctx: RecommendationContext) =>
  canChooseAnyPartySchool(ctx) && ctx.partyMember && ["sichuan", "sichuan_minzu"].includes(ctx.provinceKey)

const canChooseChongqingPartySchool = (ctx: RecommendationContext) =>
  canChooseAnyPartySchool(ctx) && ctx.provinceKey === "chongqing"

const canChoosePartyPath = (ctx: RecommendationContext) =>
  !ctx.mustDualDegree && (canChooseSichuanPartySchool(ctx) || canChooseChongqingPartySchool(ctx))

const prefersLowBudgetSwap = (ctx: RecommendationContext) =>
  ctx.budget > 0 && ctx.budget <= 30000 && !isRigidDualGoal(ctx) && canChoosePartyPath(ctx)

const defaultDualProgram = (ctx: RecommendationContext): ProgramType => {
  if (ctx.systemKey === "medical" && isTechnicalLikePosition(ctx.position)) return "MEM"
  if (isEnterpriseMidWindow(ctx) && isManagementLikePosition(ctx.position) && ctx.budgetCeiling >= 80000) return "MBA"
  return "MPA"
}

const buildPartyPreferredMajors = (ctx: RecommendationContext) => {
  if (ctx.systemKey === "gongjianfa") return ["法学", "法律"]
  if (ctx.systemKey === "bank_finance" || ctx.position === "财政发改" || ctx.position === "财务审计") {
    return ["经济学", "经济管理"]
  }
  if (ctx.systemKey === "xiangzhen") return ["政治学", "党政管理", "公共管理", "战略管理"]
  if (ctx.position === "党建纪检" || ctx.position === "党务行政") return ["政治学", "党政管理", "法学", "法律"]
  if (ctx.systemKey === "medical") return ["公共管理", "战略管理", "政治学"]
  if (ctx.systemKey === "education") return ["政治学", "公共管理", "党政管理"]
  return ["政治学", "党政管理", "公共管理", "战略管理", "经济学"]
}

const buildPreferredSchoolNames = (ctx: RecommendationContext, programType: ProgramType) => {
  if (programType === "党校") {
    return ctx.provinceKey === "chongqing" ? ["中共重庆市委党校"] : ["中共四川省委党校", "中共重庆市委党校"]
  }

  if (programType === "MBA") {
    return ctx.provinceKey === "chongqing"
      ? ["重庆大学", "四川大学", "西南交通大学"]
      : ["四川大学", "西南交通大学", "电子科技大学", "重庆大学"]
  }

  if (programType === "MEM") {
    return ctx.provinceKey === "chongqing"
      ? ["重庆大学", "西南交通大学"]
      : ["西南交通大学", "重庆大学"]
  }

  if (ctx.budgetCeiling <= 30000) {
    return ctx.provinceKey === "chongqing"
      ? ["中共重庆市委党校", "西南政法大学", "重庆大学"]
      : ["中共四川省委党校", "西南政法大学", "西昌学院", "西华师范大学", "川北医学院"]
  }

  if (ctx.systemKey === "bank_finance" || ctx.position === "财政发改") {
    return ctx.provinceKey === "chongqing"
      ? ["重庆大学", "西南财经大学", "西南交通大学"]
      : ["西南财经大学", "四川大学", "西南交通大学", "重庆大学"]
  }

  if (ctx.systemKey === "gongjianfa") {
    return ctx.provinceKey === "chongqing"
      ? ["西南政法大学", "重庆大学", "中共重庆市委党校"]
      : ["西南政法大学", "四川大学", "重庆大学"]
  }

  if (ctx.systemKey === "education") {
    return ctx.provinceKey === "chongqing"
      ? ["重庆大学", "西南财经大学", "西南政法大学"]
      : ["四川大学", "西南财经大学", "西南交通大学", "电子科技大学"]
  }

  if (ctx.systemKey === "medical") {
    return ctx.provinceKey === "chongqing"
      ? ["重庆大学", "西南政法大学"]
      : ["四川大学", "西南交通大学", "西南财经大学"]
  }

  if (ctx.systemKey === "guoqi") {
    return ctx.provinceKey === "chongqing"
      ? ["重庆大学", "中共重庆市委党校", "西南政法大学"]
      : ["四川大学", "西南财经大学", "西南交通大学", "中共四川省委党校"]
  }

  if (ctx.provinceKey === "chongqing") {
    return ["重庆大学", "西南政法大学", "中共重庆市委党校"]
  }

  return ["四川大学", "电子科技大学", "西南交通大学", "西南财经大学", "中共四川省委党校"]
}

const hasTuition = (record: SchoolRecord) => typeof record.tuition_min === "number"

const pickRepresentative = (records: SchoolRecord[]) => {
  const nonFullWithTuition = records.find(record => record.study_mode === "非全日制" && hasTuition(record))
  const nonFull = records.find(record => record.study_mode === "非全日制")
  const anyWithTuition = records.find(hasTuition)
  return nonFullWithTuition || nonFull || anyWithTuition || records[0]
}

const groupSchools = (records: SchoolRecord[]) => {
  const groups = new Map<string, SchoolRecord[]>()
  records.forEach(record => {
    const key = record.program_type === "党校"
      ? (record.program_id || record.id || `${record.school_id}-${record.major_label || record.program_type}`)
      : (record.program_id || `${record.school_id}-${record.program_type}`)
    const current = groups.get(key) || []
    current.push(record)
    groups.set(key, current)
  })
  return Array.from(groups.values()).map(pickRepresentative)
}

const buildSchoolReason = (record: SchoolRecord, candidate: RouteCandidate) => {
  const parts = [
    record.province,
    record.city,
    record.study_mode,
    record.latest_score ? `${record.latest_score} 分数线` : "分数线待确认"
  ].filter(Boolean)
  if (candidate.programType === "党校") parts.push("免全国联考 · 单证")
  else parts.push("非全日制 · 双证")
  return parts.join(" · ")
}

const schoolLevelScore = (record: SchoolRecord) => {
  const level = String(record.school_level_display || "")
  if (level.includes("985")) return 6
  if (level.includes("211")) return 4
  if (level.includes("双非")) return 1
  return 0
}

const examThresholdScore = (record: SchoolRecord) => {
  const score = Number(record.total_score || 0)
  if (!score) return 0
  if (score <= 175) return 8
  if (score <= 185) return 6
  if (score <= 195) return 3
  if (score >= 210) return -5
  return 0
}

const preferredNameScore = (schoolName: string, preferredNames: string[], isPartyProgram: boolean) => {
  const rank = preferredNames.findIndex(name => schoolName.includes(name))
  if (rank === -1) return 0
  return isPartyProgram ? Math.max(10, 24 - rank * 5) : Math.max(2, 9 - rank * 2)
}

const buildFitSignals = (record: SchoolRecord, candidate: RouteCandidate, ctx: RecommendationContext) => {
  const text = [record.school_name, record.short_name, record.major_label, record.direction, ...(record.tags || [])].filter(Boolean).join(" ")
  const signals: string[] = []
  if (record.province === ctx.province) signals.push("本地")
  if (record.study_mode === "非全日制") signals.push("在职友好")
  if (typeof record.tuition_min === "number" && record.tuition_min <= ctx.budgetCeiling) signals.push("预算内")
  if (candidate.programType === "党校") signals.push("免全国联考")
  if (ctx.systemKey === "gongjianfa" && /政法|法学|法律/.test(text)) signals.push("政法贴合")
  if ((ctx.systemKey === "bank_finance" || ctx.position === "财政发改") && /财经|经济|金融/.test(text)) signals.push("财经贴合")
  if (ctx.systemKey === "education" && /师范|教育/.test(text)) signals.push("教育贴合")
  if (ctx.systemKey === "medical" && /医|医疗|MEM|MPA/.test(text)) signals.push("医护近似")
  return dedupe(signals).slice(0, 4)
}

const scoreRecordForCandidate = (
  record: SchoolRecord,
  candidate: RouteCandidate,
  ctx: RecommendationContext,
  preferredNames: string[],
  preferredMajors: string[]
) => {
  const text = [record.school_name, record.short_name, record.major_label, record.direction].filter(Boolean).join(" ")
  const tuition = typeof record.tuition_min === "number" ? record.tuition_min : Number.MAX_SAFE_INTEGER
  const inBudget = tuition <= ctx.budgetCeiling
  let score = 0

  if (record.province === ctx.province) score += candidate.programType === "党校" ? 28 : 14
  if (record.study_mode === "非全日制") score += 14
  else if (record.study_mode === "全日制") score -= 10

  if (inBudget) score += 24
  else if (Number.isFinite(ctx.budgetCeiling)) score -= 18
  if (tuition < Number.MAX_SAFE_INTEGER) score += Math.max(0, 10 - Math.floor(tuition / 20000))

  score += preferredNameScore(record.school_name, preferredNames, candidate.programType === "党校")
  if (preferredMajors.some(keyword => text.includes(keyword))) score += candidate.programType === "党校" ? 24 : 8

  if (ctx.systemKey === "gongjianfa" && /政法|法学|法律/.test(text)) score += 22
  if ((ctx.systemKey === "bank_finance" || ctx.position === "财政发改") && /财经|经济|金融/.test(text)) score += 18
  if (ctx.systemKey === "education" && /师范|教育/.test(text)) score += 16
  if (ctx.systemKey === "medical" && /医|医疗/.test(text)) score += 14
  if (ctx.isEthnicRegion && (record.city.includes("凉山") || record.school_name.includes("西昌"))) score += 14

  score += schoolLevelScore(record)
  score += examThresholdScore(record)

  return score
}

const selectRecordsForCandidate = (candidate: RouteCandidate, ctx: RecommendationContext) => {
  let candidates = schoolRecords.filter(record => record.program_type === candidate.programType)

  if (candidate.programType === "党校") {
    if (ctx.provinceKey === "chongqing") {
      const local = candidates.filter(record => record.province === "重庆")
      if (local.length) candidates = local
    } else {
      const local = candidates.filter(record => record.province === "四川")
      if (local.length) candidates = local
    }
  } else if (ctx.province) {
    const local = candidates.filter(record => record.province === ctx.province)
    if (local.length) candidates = local
  }

  const grouped = groupSchools(candidates)
  const preferredNames = candidate.preferredSchoolNames || []
  const preferredMajors = candidate.preferredPartyMajors || []

  grouped.sort((a, b) => {
    const tuitionA = typeof a.tuition_min === "number" ? a.tuition_min : Number.MAX_SAFE_INTEGER
    const tuitionB = typeof b.tuition_min === "number" ? b.tuition_min : Number.MAX_SAFE_INTEGER
    const scoreA = scoreRecordForCandidate(a, candidate, ctx, preferredNames, preferredMajors)
    const scoreB = scoreRecordForCandidate(b, candidate, ctx, preferredNames, preferredMajors)

    return (
      scoreB - scoreA ||
      tuitionA - tuitionB ||
      a.school_name.localeCompare(b.school_name, "zh-Hans-CN")
    )
  })

  return grouped.slice(0, 3)
}

const toRecommendedSchools = (candidate: RouteCandidate, ctx: RecommendationContext): RecommendedSchool[] =>
  selectRecordsForCandidate(candidate, ctx).map(record => ({
    name: candidate.programType === "党校"
      ? `${cleanSchoolName(record.short_name || record.school_name)} · ${record.major_label || "党校在职研究生"}`
      : `${cleanSchoolName(record.short_name || record.school_name)} · ${record.program_type}`,
    tuition: typeof record.tuition_min === "number" ? record.tuition_min : 0,
    reason: buildSchoolReason(record, candidate),
    meta: candidate.programType === "党校" ? "非全日制 · 单证 · 免全国联考" : "非全日制 · 双证",
    schoolName: cleanSchoolName(record.school_name),
    shortName: cleanSchoolName(record.short_name || record.school_name),
    province: record.province,
    city: record.city,
    duration: record.duration,
    programType: record.program_type,
    majorLabel: record.major_label,
    direction: record.direction,
    studyMode: record.study_mode,
    degreeType: record.degree_type,
    examType: record.exam_type,
    sourceRecordId: record.publish?.source_record_id || record.id || record.program_id,
    sourceFile: record.publish?.source_file,
    ruleId: candidate.ruleId,
    fitSignals: buildFitSignals(record, candidate, ctx)
  }))

const weeklyPlanObjects = (items: string[] = []) =>
  items.slice(0, 3).map((desc, index) => ({
    title: `第 ${index + 1} 步`,
    desc
  }))

const dedupe = (items: string[]) => items.filter((item, index) => item && items.indexOf(item) === index)

const buildPartyWeeklyPlan = () => [
  "先核对本省党校最新招生简章、党员身份和单位口径，确认自己能不能报。",
  "结合岗位把专业方向缩到 1-2 个，再准备党员/学历/工作证明等报名材料。",
  "按主观题节奏开始复习，先搭政策材料与论述表达框架。"
]

const buildDualWeeklyPlan = (programType: ProgramType) => {
  if (programType === "MBA") {
    return [
      "先把目标院校缩到 1-3 所，核对学费、提前面试和复试要求。",
      "评估自己是否真的需要 MBA 的管理场景回报，再决定投入强度。",
      "同步启动管综/英语二备考，并提前准备面试材料。"
    ]
  }
  if (programType === "MEM") {
    return [
      "先核对 MEM 具体方向和你岗位的贴合度，避免只看名称就报。",
      "用近三年分数线和学费做筛选，优先留下时间与预算都能承受的项目。",
      "开始管综/英语二准备，并把项目经历整理成复试素材。"
    ]
  }
  return [
    "先锁定 1-3 所 MPA 院校，核对学费、分数线和上课方式。",
    "确认自己对双证的刚性需求，再评估英二和管综需要补到什么程度。",
    "按联考 + 复试双线开始准备，尽早把时间窗口拉开。"
  ]
}

const buildPartyCandidate = (
  ctx: RecommendationContext,
  ruleId: string,
  reason: string,
  extraRiskCards: string[] = []
): RouteCandidate => ({
  ruleId,
  primaryPath: ctx.provinceKey === "chongqing" && !ctx.partyMember ? "重庆党校在职路径" : "党校在职研究生路径",
  programType: "党校",
  reason,
  matchPercent: ctx.isEthnicRegion ? 93 : 90,
  preferredSchoolNames: buildPreferredSchoolNames(ctx, "党校"),
  preferredPartyMajors: buildPartyPreferredMajors(ctx),
  schoolPriorities: [
    "先看本省党校招生口径和身份限制，再看具体专业方向。",
    "党校更适合内部使用和防御性补位，不适合替代双证硬门槛。",
    "预算敏感或不想把精力押在英数上的场景，党校更省力。"
  ],
  riskCards: dedupe([
    "党校路径更适合体制内内部认可场景，涉及遴选、调任、职称时要额外核口径。",
    ...extraRiskCards
  ]),
  weeklyPlan: buildPartyWeeklyPlan()
})

const buildDualCandidate = (
  ctx: RecommendationContext,
  programType: ProgramType,
  ruleId: string,
  reason: string,
  extraRiskCards: string[] = []
): RouteCandidate => ({
  ruleId,
  primaryPath: programType === "MBA"
    ? "MBA 管理提升路径"
    : programType === "MEM"
      ? "MEM 项目管理路径"
      : "MPA 双证路径",
  programType,
  reason,
  matchPercent: programType === "MPA" ? 89 : 86,
  preferredSchoolNames: buildPreferredSchoolNames(ctx, programType),
  schoolPriorities: [
    "先保证路径和目标场景一致，再比较学费、分数线和上课方式。",
    "双证路径的价值在于国民教育序列通用性，不是单看学校名气。",
    "如果预算和时间承受不了，宁可提前调整，不要边报边赌。"
  ],
  riskCards: dedupe(extraRiskCards),
  weeklyPlan: buildDualWeeklyPlan(programType)
})

const buildAgeRisk = () =>
  "你现在落在 35-38 岁窗口附近，政策红线和单位实操红线可能并不一致，报名和使用前都要核对最新口径。"

const buildEnglishRisk = () =>
  "党校不考英数是事实，但不等于容易，它把难点换成了全主观题、材料积累和结构化表达。"

const buildPartyMpaRisk = () =>
  "党校 MPA 是低学费但高分线的反常识组合，省钱不代表省力，别把它当成最轻松的双证路线。"

const buildEnterpriseRisk = () =>
  "国央企近两年绩效与末等调整压力持续存在，学历更像防御性资产和下一条通道，不只是锦上添花。"

const buildBudgetRisk = () =>
  "你的预算和双证项目学费之间有明显落差，如果双证不是硬门槛，党校往往是更稳的交换方案。"

const buildTownshipRisk = () =>
  "乡镇 25-30 岁常处在服务期窗口，不能遴选/调动恰好也是补学历的时间窗口，越早准备越不被动。"

const buildDualReason = (ctx: RecommendationContext, programType: ProgramType) => {
  if (ctx.goal === "遴选") {
    return "你的核心目标已经是遴选/调任类硬门槛，主线必须回到国民教育序列双证，先把证书通用性放在前面。"
  }
  if (ctx.goal === "转行") {
    return "你这次的诉求带有明显的转公务员/跨系统色彩，先拿双证更符合后续资格审核和外部认可逻辑。"
  }
  if (ctx.goal === "职称") {
    return "你当前更像职称或专技认可场景，主线要优先考虑国民教育序列双证，避免把党校单证押成唯一出口。"
  }
  if (programType === "MBA") {
    return "你这次更像国企/管理岗的管理升级场景，MBA 比单纯 MPA 更贴近管理职责与组织协同能力的补强。"
  }
  if (programType === "MEM") {
    return "你的岗位更贴近项目、技术或工程管理语境，MEM 更容易把工作能力和学历提升放到同一条线上。"
  }
  return "你的目标更偏向双证通用性和长期职业弹性，先走 MPA 这类公共管理双证路径更稳。"
}

const buildPartyReason = (ctx: RecommendationContext) => {
  if (ctx.isEthnicRegion) {
    return "你属于四川民族地区画像，又不以双证硬门槛为主，党校路径既贴近本系统使用场景，也能吃到民族地区专项和录取批次优势。"
  }
  if (ctx.provinceKey === "chongqing" && !ctx.partyMember) {
    return "你在重庆、又不是党员，但当前目标更偏内部补位和成本控制，重庆党校这条在职路径会比硬冲全国联考更贴近现实。"
  }
  return "你当前更像体制内内部使用场景：目标偏晋升/防御，预算又更谨慎，党校路径更贴近本系统认可与成本控制。"
}

const resolveCandidates = (ctx: RecommendationContext): RouteCandidate[] => {
  const candidates: RouteCandidate[] = []

  if (ctx.education === "大专") {
    candidates.push(buildDualCandidate(
      ctx,
      "MPA",
      "B001",
      "大专场景先天不适合党校路径，当前更现实的出口是非全双证，但报名前一定要核对是否满足满 5 年工龄等同等学力要求。",
      ["大专不能报党校；走非全双证前，请先确认自己是否满足满 5 年工龄等报考条件。"])
    )
    return candidates
  }

  if (isEducationMedical(ctx) && ctx.goal === "职称") {
    const programType: ProgramType = ctx.systemKey === "medical" && isTechnicalLikePosition(ctx.position) ? "MEM" : "MPA"
    candidates.push(buildDualCandidate(
      ctx,
      programType,
      "E002",
      buildDualReason(ctx, programType),
      ["教育/医护专技岗的职称场景更看双证通用性，党校单证的认可度会受地区和单位口径影响。"])
    )
    if (programType === "MEM") {
      candidates.push(buildDualCandidate(
        ctx,
        "MPA",
        "A-E002-MPA",
        "如果你更看重公共管理通用性，而不是项目/技术管理贴合度，MPA 可以作为第二条双证路径。"))
    }
    if (canChoosePartyPath(ctx)) {
      candidates.push(buildPartyCandidate(
        ctx,
        "A-E002",
        "如果你所在单位明确认可党校，而且当前更重视成本和省力，党校可以作为备选，但不建议反客为主。"))
    }
    return candidates
  }

  if (isPublicLegal(ctx)) {
    if (prefersLowBudgetSwap(ctx)) {
      candidates.push(buildPartyCandidate(
        ctx,
        "P004+R008",
        "你属于公检法纪检画像，但当前目标并非双证硬门槛，预算又压得很低，先走党校法学/法律方向会比硬冲 MPA 更贴近现实。",
        [buildBudgetRisk()]
      ))
      candidates.push(buildDualCandidate(ctx, "MPA", "P004", buildDualReason(ctx, "MPA")))
      return candidates
    }

    candidates.push(buildDualCandidate(ctx, "MPA", "P004", buildDualReason(ctx, "MPA")))
    if (canChoosePartyPath(ctx)) {
      candidates.push(buildPartyCandidate(
        ctx,
        "A-P004",
        "如果你更重视本系统内部认可、预算压力又更大，党校法学/法律方向可以作为第二路径。"))
    }
    return candidates
  }

  if (isEnterpriseMidWindow(ctx)) {
    const primaryProgram: ProgramType =
      isManagementLikePosition(ctx.position) && ctx.budgetCeiling >= 80000 && ctx.goal !== "转行" ? "MBA" : "MPA"
    const secondaryProgram: ProgramType = primaryProgram === "MBA" ? "MPA" : "MBA"

    if (prefersLowBudgetSwap(ctx)) {
      candidates.push(buildPartyCandidate(
        ctx,
        "P003+R008",
        "你在国央企窗口期，但当前预算更贴近党校成本带；如果这次主要是防御性补位，先走党校会比强上高学费双证更稳。",
        [buildEnterpriseRisk(), buildBudgetRisk()]
      ))
      candidates.push(buildDualCandidate(ctx, primaryProgram, "P003", buildDualReason(ctx, primaryProgram), [buildEnterpriseRisk()]))
      return candidates
    }

    candidates.push(buildDualCandidate(ctx, primaryProgram, "P003", buildDualReason(ctx, primaryProgram), [buildEnterpriseRisk()]))
    candidates.push(buildDualCandidate(
      ctx,
      secondaryProgram,
      "A-P003",
      secondaryProgram === "MPA"
        ? "如果你后续更看重转编、遴选或更广的体制内通用性，MPA 会是更稳的第二路径。"
        : "如果你后续更看重管理升级和组织协同能力，MBA 可以作为第二路径。"))
    if (canChoosePartyPath(ctx) && !isRigidDualGoal(ctx)) {
      candidates.push(buildPartyCandidate(
        ctx,
        "A-P003-PARTY",
        "如果你最终更在意成本和省力、又主要用于内部防御性补位，党校也可以作为第三选择。"))
    }
    return candidates
  }

  if (ctx.isEthnicRegion && canChoosePartyPath(ctx) && !isRigidDualGoal(ctx)) {
    candidates.push(buildPartyCandidate(ctx, "P005", buildPartyReason(ctx)))
    candidates.push(buildDualCandidate(ctx, "MPA", "A-P005", "如果后续出现遴选、调任或双证刚需，再回到 MPA 双证路径会更稳。"))
    return candidates
  }

  if (isRigidDualGoal(ctx)) {
    const programType = defaultDualProgram(ctx)
    candidates.push(buildDualCandidate(ctx, programType, "P002", buildDualReason(ctx, programType)))
    if (canChoosePartyPath(ctx)) {
      candidates.push(buildPartyCandidate(
        ctx,
        "A-P002",
        "党校可以作为低成本备选，但在遴选、调任、职称这些硬场景里，不能替代双证主线。"))
    }
    return candidates
  }

  if (canChoosePartyPath(ctx) && isPartyFriendlyGoal(ctx)) {
    candidates.push(buildPartyCandidate(ctx, "P001", buildPartyReason(ctx)))
    candidates.push(buildDualCandidate(ctx, defaultDualProgram(ctx), "A-P001", "如果你后续需求从内部使用转向遴选、调任或跨系统，双证路径是更稳的第二选择。"))
    return candidates
  }

  if (ctx.provinceKey === "chongqing" && canChooseAnyPartySchool(ctx) && isPartyFriendlyGoal(ctx) && !ctx.partyMember) {
    candidates.push(buildPartyCandidate(ctx, "E001-CQ", buildPartyReason(ctx)))
    candidates.push(buildDualCandidate(ctx, "MPA", "A-E001", "如果你更在意证书通用性和外部认可，MPA 双证路径会更稳。"))
    return candidates
  }

  const fallbackProgram = defaultDualProgram(ctx)
  candidates.push(buildDualCandidate(ctx, fallbackProgram, "DEFAULT", buildDualReason(ctx, fallbackProgram)))
  if (canChoosePartyPath(ctx)) {
    candidates.push(buildPartyCandidate(ctx, "A-DEFAULT", "如果你最后更在意成本与省力，而不是双证硬门槛，党校可以作为备选。"))
  }
  return candidates
}

const buildDynamicRiskCards = (ctx: RecommendationContext, primary: RouteCandidate, schools: RecommendedSchool[]) => {
  const cards: string[] = [...primary.riskCards]

  if (!ctx.partyMember && ["sichuan", "sichuan_minzu"].includes(ctx.provinceKey)) {
    cards.push("四川党校只接受党员或预备党员；如果你不是党员，党校路线只能比较重庆党校，或改走双证。")
  }
  if (ctx.ageKey === "36-40") cards.push(buildAgeRisk())
  if (["english_concern", "math_concern"].some(item => ctx.worries.includes(item)) && primary.programType === "党校") {
    cards.push(buildEnglishRisk())
  }
  if (primary.programType === "MPA" && schools.some(item => String(item.schoolName || "").includes("党校"))) {
    cards.push(buildPartyMpaRisk())
  }
  if (isEnterpriseMidWindow(ctx)) cards.push(buildEnterpriseRisk())
  if (ctx.budgetCeiling <= 30000 && primary.programType !== "党校") cards.push(buildBudgetRisk())
  if (ctx.systemKey === "xiangzhen" && ctx.ageKey === "25-30") cards.push(buildTownshipRisk())
  if (isEducationMedical(ctx) && ctx.goal === "职称") {
    cards.push("教育/医护专技岗最终是否认可这条学历，仍要以你所在单位和当地评审口径为准。")
  }

  return dedupe(cards)
}

const buildSecondaryOption = (candidate: RouteCandidate | undefined, ctx: RecommendationContext): SecondaryRecommendation | undefined => {
  if (!candidate) return undefined
  const schools = toRecommendedSchools(candidate, ctx)
  return {
    strategyId: candidate.ruleId,
    primaryPath: candidate.primaryPath,
    programType: candidate.programType,
    reason: candidate.reason,
    matchPercent: Math.max(60, candidate.matchPercent - 6),
    recommendedSchool: schools[0]
  }
}

export const getLocalRecommendation = (answers: Answers): LocalRecommendation => {
  const ctx = buildContext(answers)
  const candidates = resolveCandidates(ctx)
  const primary = candidates[0]
  const secondary = candidates[1]
  const recommendedSchools = toRecommendedSchools(primary, ctx)
  const riskCards = buildDynamicRiskCards(ctx, primary, recommendedSchools)

  return {
    blocked: false,
    strategyId: primary.ruleId,
    primaryPath: primary.primaryPath,
    matchPercent: primary.matchPercent,
    reason: primary.reason,
    warnings: riskCards.map(message => ({ message })),
    recommendedSchools,
    secondaryOption: buildSecondaryOption(secondary, ctx),
    schoolPriorities: primary.schoolPriorities,
    riskCards,
    weeklyPlan: weeklyPlanObjects(primary.weeklyPlan),
    source: {
      primaryRuleId: primary.ruleId,
      secondaryRuleId: secondary?.ruleId,
      schoolSourceRecordIds: recommendedSchools.map(item => item.sourceRecordId || '').filter(Boolean)
    }
  }
}
