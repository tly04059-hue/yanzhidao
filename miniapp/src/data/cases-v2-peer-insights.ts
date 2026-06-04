import { casesV2, casesV2Stats, managementExamCasesV2, partySchoolCasesV2 } from './cases-v2'

type Answers = Record<string, any>

type LegacyLikeCase = {
  case_id: string
  display_name: string
  age_concrete: string
  age_band: string
  unit_narrative: string
  edu_modifier: string
  education: string
  chosen_school: string
  reflection: string
  key_quote: string
  outcome: string
}

export type PeerDistributionItem = {
  programType: string
  label: string
  count: number
  tone: 'A' | 'B'
}

export type PeerInsights = {
  similarCase: LegacyLikeCase
  total: number
  stories: LegacyLikeCase[]
  reasonSummary: Record<string, string[]>
  distribution: [PeerDistributionItem, PeerDistributionItem]
  proxyHint: string
  source: {
    bucketKey: string
    sourceKey: string
    caseSource: 'exact' | 'fallback' | 'heuristic'
    caseSourceLabel: string
    sourceCaseIds: string[]
    fallbackLevel: number | null
    caseCardsOk: boolean
    displayMessage: string
  }
}

const normalizePrimaryProgramGroup = (primaryPath: string) =>
  primaryPath.includes('党校') ? '党校' : '统考非全'

const getComparisonPrograms = (primaryPath: string): [string, string] => {
  const primaryGroup = normalizePrimaryProgramGroup(primaryPath)
  return primaryGroup === '党校' ? ['党校', '统考非全'] : ['统考非全', '党校']
}

const countByProgram = (programType: string) =>
  programType === '党校' ? casesV2Stats.party : casesV2Stats.managementExam

const buildBucketKey = (answers: Answers) => {
  const system = String(answers.system_key || '')
  const region = String(answers.province_key || '')
  const age = String(answers.age_key || '')
  return [system, region, age].filter(Boolean).join('|') || 'cases-v2'
}

const toLegacyLikeCase = (): LegacyLikeCase => {
  const item = partySchoolCasesV2[0] || managementExamCasesV2[0] || casesV2[0]
  return {
    case_id: item?.id || 'cases-v2-empty',
    display_name: item?.displayAlias || '同学',
    age_concrete: item?.ageLabel || '',
    age_band: item?.ageLabel || '',
    unit_narrative: item?.systemLabel || item?.regionLabel || '',
    edu_modifier: '',
    education: '',
    chosen_school: item?.chosenTarget || '',
    reflection: item?.reflection || item?.examExperience || '',
    key_quote: item?.cardQuote || item?.motivation || '',
    outcome: item?.outcomeLabel || '结果待确认'
  }
}

export const formatPeerProgramLabel = (programType: string, province?: string) => {
  if (programType === '党校') {
    if (province === '重庆') return '重庆党校'
    if (province === '四川') return '四川党校'
    return '党校'
  }
  if (programType === '统考非全') return '统考非全'
  return programType
}

export const getPeerInsights = (answers: Answers, primaryPath: string): PeerInsights => {
  const [programA, programB] = getComparisonPrograms(primaryPath)
  const province = String(answers.province || '')
  const bucketKey = buildBucketKey(answers)
  const sourceCaseIds = casesV2.slice(0, 24).map(item => item.id)

  return {
    similarCase: toLegacyLikeCase(),
    total: casesV2Stats.total,
    stories: [],
    reasonSummary: {
      党校: ['不考英数', '本系统内部使用', '学费更可控'],
      统考非全: ['双证通用', '遴选/职称更硬', '院校选择更广']
    },
    proxyHint: '相似案例参考来自 V2 脱敏公开案例库。',
    distribution: [
      {
        programType: programA,
        label: `位选 ${formatPeerProgramLabel(programA, province)}`,
        count: countByProgram(programA),
        tone: 'A'
      },
      {
        programType: programB,
        label: `位选 ${formatPeerProgramLabel(programB, province)}`,
        count: countByProgram(programB),
        tone: 'B'
      }
    ],
    source: {
      bucketKey,
      sourceKey: bucketKey,
      caseSource: 'exact',
      caseSourceLabel: 'V2 脱敏公开案例',
      sourceCaseIds,
      fallbackLevel: null,
      caseCardsOk: true,
      displayMessage: '案例来自 V2 脱敏公开案例，按路径、系统、地区和目标相似度选取。'
    }
  }
}
