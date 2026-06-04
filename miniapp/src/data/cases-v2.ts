import publicPayload from './cases-v2-public.json'

export type CaseV2Type = 'party_school' | 'management_exam'
export type CaseV2Quality = 'rich' | 'standard' | 'compact'
export type CaseV2TargetPrecision = 'precise' | 'broad' | 'unknown'

type PublicSection = {
  key: string
  label: string
  text: string
}

type PublicCaseV2Record = {
  direction: 'party' | 'exam'
  source_dataset: string
  source_id: string
  display_order_source: number
  richness_score?: number
  quality?: CaseV2Quality
  target_precision?: CaseV2TargetPrecision
  ai_fill_level?: 'none' | 'partial'
  ai_filled_fields?: string[]
  human_review_status?: string
  display_name: string
  age: string
  region?: string
  system?: string
  program?: string
  chosen_target?: string
  intent_school?: string
  admitted_school?: string
  outcome?: string
  exam_experience?: string
  motivation?: string
  baseline?: string
  score?: string
  study_time?: string
  risk?: string
  advice?: string
  tags?: string[]
  sections?: PublicSection[]
}

export type CaseV2 = {
  id: string
  sourceId: string
  sourceDataset: string
  caseType: CaseV2Type
  quality: CaseV2Quality
  targetPrecision: CaseV2TargetPrecision
  displayAlias: string
  ageLabel: string
  regionLabel: string
  systemLabel: string
  positionLabel: string
  pathLabel: string
  programLabel: string
  chosenTarget: string
  intentSchool: string
  admittedSchool: string
  outcomeLabel: string
  cardQuote: string
  detailSummary: string
  choiceReason: string
  reflection: string
  studyMethod: string
  turningPoint: string
  examExperience: string
  motivation: string
  baseline: string
  score: string
  studyTime: string
  risk: string
  advice: string
  tags: string[]
  goalTags: string[]
  richnessScore: number
  completenessScore: number
  displayPriority: number
  sourceOrder: number
  aiFillLevel: 'none' | 'partial'
  aiFilledFields: string[]
  evidenceFields: Record<string, string>
}

export type CaseV2Stats = {
  total: number
  party: number
  managementExam: number
  richParty: number
  completeExam: number
}

const records = (((publicPayload as any).records || []) as PublicCaseV2Record[])
  .filter(record => record.direction !== 'party' || record.ai_fill_level === 'none')

const cleanText = (value: unknown) => String(value || '').trim()

const compactTags = (...groups: Array<Array<string | undefined> | undefined>) =>
  Array.from(
    new Set(
      groups
        .flatMap(group => group || [])
        .map(item => cleanText(item))
        .filter(Boolean)
        .filter(item => !['其他', 'M8-resync', 'system_unknown_storied', '心得型', '党校', 'precise', 'broad'].includes(item))
    )
  )

const sectionText = (record: PublicCaseV2Record, key: string) =>
  cleanText((record.sections || []).find(section => section.key === key)?.text)

const normalizeQuality = (quality: unknown, score: number): CaseV2Quality => {
  if (quality === 'rich' || quality === 'standard' || quality === 'compact') return quality
  if (score >= 480) return 'rich'
  if (score >= 180) return 'standard'
  return 'compact'
}

const normalizePrecision = (value: unknown): CaseV2TargetPrecision => {
  if (value === 'precise' || value === 'broad' || value === 'unknown') return value
  return 'unknown'
}

const toPartyCase = (record: PublicCaseV2Record): CaseV2 => {
  const score = Number(record.richness_score || 0)
  const keyQuote = sectionText(record, 'key_quote')
  const reflection = sectionText(record, 'reflection')
  const studyMethod = sectionText(record, 'study_method')
  const target = cleanText(record.chosen_target)
  const tags = compactTags(record.tags, [record.system, record.outcome])

  return {
    id: `party-${record.source_id}`,
    sourceId: record.source_id,
    sourceDataset: record.source_dataset,
    caseType: 'party_school',
    quality: normalizeQuality(record.quality, score),
    targetPrecision: 'precise',
    displayAlias: cleanText(record.display_name) || '同学',
    ageLabel: cleanText(record.age),
    regionLabel: cleanText(record.region),
    systemLabel: cleanText(record.system),
    positionLabel: '',
    pathLabel: '在职研',
    programLabel: target,
    chosenTarget: target,
    intentSchool: target,
    admittedSchool: target,
    outcomeLabel: cleanText(record.outcome) || '结果待确认',
    cardQuote: keyQuote,
    detailSummary: '',
    choiceReason: '',
    reflection,
    studyMethod,
    turningPoint: '',
    examExperience: '',
    motivation: keyQuote,
    baseline: '',
    score: '',
    studyTime: '',
    risk: cleanText(record.risk),
    advice: cleanText(record.advice),
    tags,
    goalTags: tags.slice(0, 6),
    richnessScore: score,
    completenessScore: score,
    displayPriority: score,
    sourceOrder: Number(record.display_order_source || 0),
    aiFillLevel: record.ai_fill_level || 'none',
    aiFilledFields: record.ai_filled_fields || [],
    evidenceFields: {
      key_quote: keyQuote,
      reflection,
      study_method: studyMethod
    }
  }
}

const toExamCase = (record: PublicCaseV2Record): CaseV2 => {
  const score = Number(record.richness_score || 0)
  const intentSchool = cleanText(record.intent_school)
  const admittedSchool = cleanText(record.admitted_school)
  const tags = compactTags(record.tags, [record.system, record.program, record.outcome])

  return {
    id: `exam-${record.source_id}`,
    sourceId: record.source_id,
    sourceDataset: record.source_dataset,
    caseType: 'management_exam',
    quality: normalizeQuality(record.quality || 'standard', score),
    targetPrecision: normalizePrecision(record.target_precision),
    displayAlias: cleanText(record.display_name) || '同学',
    ageLabel: cleanText(record.age),
    regionLabel: '',
    systemLabel: cleanText(record.system),
    positionLabel: '',
    pathLabel: '管综',
    programLabel: cleanText(record.program),
    chosenTarget: admittedSchool || intentSchool,
    intentSchool,
    admittedSchool,
    outcomeLabel: cleanText(record.outcome) || '结果待确认',
    cardQuote: cleanText(record.motivation),
    detailSummary: cleanText(record.exam_experience),
    choiceReason: '',
    reflection: '',
    studyMethod: '',
    turningPoint: '',
    examExperience: cleanText(record.exam_experience),
    motivation: cleanText(record.motivation),
    baseline: cleanText(record.baseline),
    score: cleanText(record.score),
    studyTime: cleanText(record.study_time),
    risk: cleanText(record.risk),
    advice: cleanText(record.advice),
    tags,
    goalTags: tags.slice(0, 6),
    richnessScore: score,
    completenessScore: score,
    displayPriority: score,
    sourceOrder: Number(record.display_order_source || 0),
    aiFillLevel: record.ai_fill_level || 'none',
    aiFilledFields: record.ai_filled_fields || [],
    evidenceFields: {
      intent_school: intentSchool,
      admitted_school: admittedSchool,
      exam_experience: cleanText(record.exam_experience),
      motivation: cleanText(record.motivation),
      baseline: cleanText(record.baseline),
      score: cleanText(record.score),
      study_time: cleanText(record.study_time),
      risk: cleanText(record.risk),
      advice: cleanText(record.advice)
    }
  }
}

const sortCases = (items: CaseV2[]) =>
  items.slice().sort((a, b) => {
    const aiWeight = Number(a.aiFillLevel !== 'none') - Number(b.aiFillLevel !== 'none')
    return aiWeight || b.richnessScore - a.richnessScore || a.sourceOrder - b.sourceOrder
  })

const partyCasesAtEndIds = new Set([
  'party-C102',
  'party-C115',
  'party-C107',
  'party-C124'
])

const shouldPlacePartyCaseAtEnd = (item: CaseV2) => {
  if (partyCasesAtEndIds.has(item.id)) return true

  return item.displayAlias === '梁同学'
    && item.ageLabel === '约 30 岁'
    && item.regionLabel === '甘孜'
    && item.richnessScore === 148
}

const sortPartyCases = (items: CaseV2[]) => {
  const sorted = sortCases(items)
  const delayed = sorted.filter(shouldPlacePartyCaseAtEnd)
  const normal = sorted.filter(item => !shouldPlacePartyCaseAtEnd(item))

  return [...normal, ...delayed]
}

export const partySchoolCasesV2 = sortPartyCases(
  records.filter(record => record.direction === 'party').map(toPartyCase)
)

export const managementExamCasesV2 = sortCases(
  records.filter(record => record.direction === 'exam').map(toExamCase)
)

export const casesV2 = [...partySchoolCasesV2, ...managementExamCasesV2]

export const casesV2Stats: CaseV2Stats = {
  total: casesV2.length,
  party: partySchoolCasesV2.length,
  managementExam: managementExamCasesV2.length,
  richParty: partySchoolCasesV2.filter(item => item.quality === 'rich').length,
  completeExam: managementExamCasesV2.length
}

export const casesV2Compatibility = {
  legacyRoute: '/pages/cases/index',
  v2Route: '/pages/cases-v2/index',
  entryStatus: 'active',
  note: 'V2 reads miniapp/src/data/cases-v2-public.json and is the primary cases route. Legacy cases route remains available for compatibility only.'
} as const
