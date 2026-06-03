import casesPayload from '../../../schooltool/data/cases.json'

type OfficialCase = {
  case_id: string
  profile_combo_id: string
  display_name: string
  age_band?: string
  age_concrete?: string
  system?: string
  system_chip?: string
  region?: string
  education?: string
  edu_modifier?: string
  work_years?: string
  unit_narrative?: string
  is_party_member?: boolean | null
  chosen_path: 'A' | 'B'
  chosen_path_label?: string
  chosen_school?: string
  outcome?: string
  key_quote?: string
  narrative_choose?: string
  reflection?: string
  story_summary?: string
  reason_keywords?: string[]
  reason_tags?: string[]
  story_tags?: string[]
  completeness_score?: number
  display_priority?: number
  tags?: string[]
}

export type RuntimeCase = {
  case_id: string
  profile_combo_id: string
  display_name: string
  age_band: string
  age_concrete: string
  system: string
  system_chip: string
  region: string
  education: string
  edu_modifier: string
  work_years: string
  unit_narrative: string
  is_party_member: boolean | null
  chosen_path: 'A' | 'B'
  chosen_path_label: string
  chosen_school: string
  outcome: string
  key_quote: string
  narrative_choose: string
  reflection: string
  story_summary: string
  reason_keywords: string[]
  reason_tags: string[]
  story_tags: string[]
  prep_duration: string
  completeness_score: number
  display_priority: number
  sort_order: number
  source: {
    system_tag: string
    position_tag: string
    goal_tag: string[]
    program_type: string
  }
}

const officialCases = (((casesPayload as any).data?.cases || []) as OfficialCase[]).slice()

const SYSTEM_TO_CHIP: Record<string, string> = {
  县级民政: '党政机关',
  市直机关: '党政机关',
  市直政法: '党政机关',
  基层公职: '党政机关',
  教育系统: '教育系统',
  高校: '教育系统',
  医院: '医疗系统',
  央企: '国央企',
  国企: '国央企',
  省属国企: '国央企',
  银行金融: '国央企',
  system_unknown_storied: '其他',
  教育医疗: '教育医疗'
}

const inferProgramType = (item: OfficialCase) => {
  const school = String(item.chosen_school || '')
  if (item.chosen_path === 'A' || school.includes('党校')) return '党校'
  if (school.includes('MBA')) return 'MBA'
  if (school.includes('MEM')) return 'MEM'
  return 'MPA'
}

const deriveSystemChip = (item: OfficialCase) => item.system_chip || SYSTEM_TO_CHIP[item.system || ''] || '其他'

const deriveChoiceFallback = (item: OfficialCase) => {
  const programType = inferProgramType(item)
  if (programType === '党校') return '党校在职研究生'
  return `统考非全 · ${programType}`
}

const normalizeTag = (value: string) =>
  value
    .replace(/统考非全双证|统考非全/g, '双证')
    .replace(/党校政治学/g, '党校政治学')
    .replace(/体制内认可/g, '体制内认可')
    .trim()

const caseNarrativeText = (item: OfficialCase) =>
  [
    item.unit_narrative,
    item.story_summary,
    item.key_quote,
    item.narrative_choose,
    item.reflection,
    item.chosen_school
  ]
    .filter(Boolean)
    .join(' ')

const includesAny = (text: string, keywords: string[]) => keywords.some(keyword => text.includes(keyword))

const derivePositionTag = (item: OfficialCase) => {
  const text = caseNarrativeText(item)

  if (item.system === '医院' || includesAny(text, ['医护', '医生', '护士', '医疗系统', '医院'])) return '医护'
  if (item.system === '教育系统' || includesAny(text, ['教师', '学校', '高校'])) return '教师'
  if (item.system === '市直政法') {
    if (includesAny(text, ['法院', '检察'])) return '法院检察院'
    if (includesAny(text, ['公安'])) return '公安系统'
    if (includesAny(text, ['纪委', '监委', '纪检'])) return '纪委监委'
    return '公检法岗位'
  }
  if (includesAny(text, ['管理岗', '高管', '管理层'])) return '管理岗'
  if (includesAny(text, ['财政', '发改'])) return '财政发改'
  if (includesAny(text, ['社区', '村镇', '乡镇', '街道'])) return '社区村镇管理'
  return item.system_chip || deriveSystemChip(item)
}

const deriveGoalTags = (item: OfficialCase, reasonTags: string[]) => {
  const tags = new Set<string>()
  const text = caseNarrativeText(item)

  reasonTags.forEach(tag => {
    if (tag === '双证' || tag === '学历兜底') tags.add('学历提升')
    if (tag === '晋升') tags.add('晋升')
    if (tag === '自我提升') tags.add('自我提升')
  })

  if (includesAny(text, ['遴选', '调任'])) tags.add('遴选')
  if (includesAny(text, ['职称'])) tags.add('职称')
  if (includesAny(text, ['晋升', '职业发展', '发展空间'])) tags.add('晋升')
  if (includesAny(text, ['提升学历', '学历提升', '双证'])) tags.add('学历提升')
  if (includesAny(text, ['充实自我', '学习知识', '弥补遗憾', '提升自己'])) tags.add('自我提升')

  return Array.from(tags)
}

const deriveReasonTags = (item: OfficialCase, programType: string) => {
  const tags = new Set<string>()
  ;(item.reason_tags || []).forEach(tag => tag && tags.add(normalizeTag(tag)))
  ;(item.reason_keywords || []).forEach(tag => tag && tags.add(normalizeTag(tag)))

  if (!tags.size) {
    ;(item.story_tags || item.tags || []).forEach(tag => {
      if (!tag) return
      if (tag.includes('统考非全')) tags.add('双证')
      else if (tag.includes('党校')) tags.add('不考英数')
      else tags.add(normalizeTag(tag))
    })
  }

  if (programType === '党校') tags.add('不考英数')
  else tags.add('双证')

  if (item.system === '市直政法') tags.add('纪检公检法')
  if (item.system === '基层公职') tags.add('基层公职')
  if (item.system === '银行金融') tags.add('银行金融')
  if (item.system === '央企' || item.system === '国企' || item.system === '省属国企') tags.add('国央企')
  if (item.is_party_member) tags.add('党员')

  return Array.from(tags).filter(Boolean).slice(0, 6)
}

const toRuntimeCase = (item: OfficialCase, index: number): RuntimeCase => {
  const programType = inferProgramType(item)
  const chosenSchool = item.chosen_school || deriveChoiceFallback(item)
  const reflection = item.reflection || item.narrative_choose || item.key_quote || '这条路更贴近他/她当时的真实约束。'
  const reasonKeywords = (item.reason_keywords || []).filter(Boolean)
  const reasonTags = deriveReasonTags(item, programType)
  const positionTag = derivePositionTag(item)
  const goalTags = deriveGoalTags(item, reasonTags)

  return {
    case_id: item.case_id,
    profile_combo_id: item.profile_combo_id || '',
    display_name: item.display_name || '相似同学',
    age_band: item.age_band || '',
    age_concrete: item.age_concrete || '',
    system: item.system || 'system_unknown_storied',
    system_chip: deriveSystemChip(item),
    region: item.region || '',
    education: item.education || '',
    edu_modifier: item.edu_modifier || '',
    work_years: item.work_years || '',
    unit_narrative: item.unit_narrative || item.system || '',
    is_party_member: item.is_party_member ?? null,
    chosen_path: item.chosen_path,
    chosen_path_label: item.chosen_path_label || (programType === '党校' ? '党校在职研究生' : '统考非全研究生'),
    chosen_school: chosenSchool,
    outcome: item.outcome || '结果待跟踪',
    key_quote: item.key_quote || reflection,
    narrative_choose: item.narrative_choose || reflection,
    reflection,
    story_summary: item.story_summary || [item.age_band, item.region, chosenSchool, item.outcome].filter(Boolean).join('，'),
    reason_keywords: reasonKeywords,
    reason_tags: reasonTags,
    story_tags: (item.story_tags || item.tags || []).filter(Boolean),
    prep_duration: '',
    completeness_score: item.completeness_score || 0,
    display_priority: item.display_priority || 0,
    sort_order: index,
    source: {
      system_tag: item.system || '',
      position_tag: positionTag,
      goal_tag: goalTags.length ? goalTags : reasonKeywords,
      program_type: programType
    }
  }
}

export const runtimeCases = officialCases.map(toRuntimeCase)

export const runtimeCaseMap = new Map(runtimeCases.map(item => [item.case_id, item]))

export const getRuntimeCaseById = (caseId: string) => runtimeCaseMap.get(caseId)
