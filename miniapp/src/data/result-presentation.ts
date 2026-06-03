import { formatPeerProgramLabel, getPeerInsights, type PeerInsights } from './peer-insights'
import type { LocalRecommendation, RecommendedSchool } from './recommendation-strategy'
import type { RuntimeCase } from './runtime-cases'

type Answers = Record<string, any>

type RichItem = { pre: string; text: string; source?: string }
type RealityItem = { text: string; sourceCaseId?: string; sourceLabel?: string }

export type ResultPresentation = {
  profile: string
  systemName: string
  isPartyPath: boolean
  recommendation: {
    title: string
    tuition: string
    duration: string
    city: string
    reason: string
    match: number
  }
	  backup: {
	    title: string
	    reason: string
	    source?: string
	  }
	  policyItems: RichItem[]
	  realityItems: RealityItem[]
	  pathMeaning: string
  riskItems: string[]
  weeklyPlan: string[]
	  similarCase: {
	    name: string
	    who: string
	    choice: string
	    quote: string
	    result: string
	    sourceLabel: string
	    sourceNote: string
	    sourceCaseId: string
	  }
  knn: {
    total: number
    a: number
    b: number
    aText: string
    bText: string
    aLabel: string
    bLabel: string
    reasonATitle: string
    reasonA: string
    reasonBTitle: string
    reasonB: string
  }
  compareTotal: number
  compareBars: Array<{
    label: string
    ratio: number
    countText: string
    color: string
  }>
  passRateSummary: string[]
  passRateDetail: string[]
	  stories: Array<{
	    who: string
	    choice: string
	    quote: string
	    result: string
	    sourceCaseId: string
	    sourceLabel: string
	  }>
	  provenance: {
	    primaryRuleId: string
	    secondaryRuleId: string
	    primarySchoolRecordId: string
	    secondarySchoolRecordId: string
	    peerBucketKey: string
	    peerCaseSource: string
	    missingRuntimeSources: string[]
	  }
	}

const cleanSchoolName = (value: string) =>
  String(value || '')
    .replace(/^中共/, '')
    .replace(/\(四川行政学院\)|\(重庆行政学院\)/g, '')
    .trim()

const formatProfileText = (normalized: Answers) => {
  const parts = [
    normalized.age_detail || normalized.age,
    normalized.province_detail || normalized.province,
    normalized.system_detail || normalized.system,
    normalized.education,
    normalized.party_member_detail || normalized.party_member,
    `目标：${normalized.goal_detail || normalized.goal}`
  ].filter(Boolean)
  return parts.join(' · ')
}

const formatSchoolTitle = (school?: RecommendedSchool, fallbackPath = '') => {
  if (!school) return fallbackPath
  if (school.programType === '党校') {
    return `${cleanSchoolName(school.shortName || school.schoolName || school.name)} · ${school.majorLabel || '党校在职研究生'}`
  }
  return `${cleanSchoolName(school.shortName || school.schoolName || school.name)} · ${school.programType || fallbackPath || '双证路径'}`
}

const formatSchoolTuition = (school?: RecommendedSchool) => {
  if (!school?.tuition) return '待确认'
  return `${(school.tuition / 10000).toFixed(1)} 万`
}

const formatSchoolDuration = (school?: RecommendedSchool, isPartyPath = false) => {
  const duration = Number(school?.duration || 0)
  if (duration > 0) return `${duration} 年`
  return isPartyPath ? '3 年' : '2-3 年'
}

const formatPeerCount = (count: number, compact = false) => {
  if (!compact) return String(count)
  return count > 10 ? '10+' : String(count)
}

const isBudgetSensitive = (normalized: Answers) =>
  (Number(normalized.budget || 0) > 0 && Number(normalized.budget || 0) <= 65000) ||
  ((normalized.worries || []) as string[]).includes('budget_concern')

const hasExamConcern = (normalized: Answers) =>
  ['weak', 'unknown'].includes(String(normalized.math_base || '')) ||
  ((normalized.worries || []) as string[]).some(item => ['english_concern', 'math_concern', 'exam_concern'].includes(item))

const isInternalUseGoal = (goal: string) => ['防御', '晋升'].includes(goal)

const REALITY_SYSTEM_MAP: Record<string, string[]> = {
  dangzheng: ['县级民政', '市直机关'],
  gongjianfa: ['市直政法'],
  education: ['教育系统', '高校'],
  medical: ['医院'],
  guoqi: ['央企', '国企', '省属国企'],
  bank_finance: ['银行金融'],
  xiangzhen: ['基层公职'],
  other_shiye: ['system_unknown_storied']
}

const realityCaseText = (item: RuntimeCase) =>
  [
    item.system,
    item.system_chip,
    item.unit_narrative,
    item.chosen_school,
    item.key_quote,
    item.story_summary,
    item.reflection,
    item.source.position_tag,
    item.source.goal_tag.join(' ')
  ].join(' ')

const isSuitableRealityCase = (normalized: Answers, item: RuntimeCase) => {
  const systemKey = String(normalized.system_key || '')
  const allowedSystems = REALITY_SYSTEM_MAP[systemKey]
  const text = realityCaseText(item)

  if (allowedSystems?.length && !allowedSystems.includes(item.system)) {
    return false
  }

  if (systemKey === 'education') {
    return /教育|学校|高校|教师|师范/.test(text) && !/人民银行|银行|金融|国企|央企/.test(text)
  }

  if (systemKey === 'medical') {
    return /医|医疗|医护|医院|医科|MEM/.test(text) && !/人民银行|银行|金融|国企|央企/.test(text)
  }

  if (systemKey === 'gongjianfa') {
    return /法院|检察|公安|纪委|纪检|政法|法学|法律/.test(text)
  }

  if (systemKey === 'bank_finance') {
    return /银行|金融|财经|财政|人民银行/.test(text)
  }

  return true
}

const buildPolicyItems = (normalized: Answers, isPartyPath: boolean): RichItem[] => {
  const systemName = normalized.system_detail || normalized.system
  const goal = String(normalized.goal || '')
  const position = String(normalized.position || '')
  const items: RichItem[] = []

  if (isPartyPath) {
    if (isInternalUseGoal(goal)) {
      items.push({
        pre: '内部使用',
        text: `：${systemName || '体制内'}场景里，党校更适合“先补学历条件 / 本系统内部使用”的判断方向，具体仍以单位口径为准。`,
        source: 'rule:P001; path:A'
      })
    }
    if (isBudgetSensitive(normalized)) {
      items.push({
        pre: '成本控制',
        text: '：你的预算约束较明显，党校学费通常处在 2-3 万区间，比多数统考非全项目更容易控制投入。',
        source: 'rule:R008; data:party-school-miniapp-publish'
      })
    }
    if (hasExamConcern(normalized)) {
      items.push({
        pre: '考试压力',
        text: '：党校不走全国联考，能避开管综/英语二这条压力线，但仍要承担主观题和材料表达要求。',
        source: 'rule:P001; risk:english-math'
      })
    }
    if (position && isInternalUseGoal(goal)) {
      items.push({
        pre: '岗位场景',
        text: `：你填的岗位是「${position}」，当前推荐只用于判断内部补位/晋升可能性，不替代单位正式认定。`,
        source: 'answers:position'
      })
    }
    return items.length
      ? items.slice(0, 3)
      : [{ pre: '单位口径', text: '：党校路径是否适用，核心看你所在单位是否认可，建议报名前先确认。', source: 'rule:A' }]
  }

  if (goal === '遴选' || goal === '转行') {
    return [
      { pre: '双证资格', text: '：更适合需要研究生学历门槛的遴选、跨系统或转行场景。', source: 'rule:P002' },
      { pre: '国民教育序列', text: '：学信网可查，单位外部认可度更高。', source: 'path:B' },
      { pre: '路径通用性', text: '：后续在职称、调动和岗位转换上更灵活。', source: 'rule:P002' }
    ]
  }

  if (goal === '职称') {
    return [
      { pre: '职称口径', text: '：职称/专技场景优先看国民教育序列双证，但最终仍要以本单位和当地评审口径为准。', source: 'rule:E002' },
      { pre: '外部认可', text: '：学信网可查的证书更适合跨单位、跨行业使用。', source: 'path:B' },
      { pre: '长期回报', text: '：更适合把学历当作长期职业资产来布局。', source: 'rule:E002' }
    ]
  }

  return [
    { pre: '双证通用性', text: '：学信网可查，在单位内外的认可场景更广。', source: 'path:B' },
    { pre: '考试门槛', text: '：需要同步承担英数和复试压力，越早准备越稳。', source: 'path:B' },
    { pre: '路径弹性', text: '：更适合兼顾晋升、遴选、职称或跨系统的综合目标。', source: 'rule:DEFAULT' }
  ]
}

const buildRealityItems = (normalized: Answers, peerInsights: PeerInsights): RealityItem[] => {
  if (peerInsights.source.caseSource === 'heuristic') return []

  const items = peerInsights.stories
    .filter(item => isSuitableRealityCase(normalized, item))
    .map(item => ({
      text: item.reflection || item.key_quote || '',
      sourceCaseId: item.case_id,
      sourceLabel: peerInsights.source.caseSourceLabel
    }))
    .filter(item => Boolean(item.text))

  return items.slice(0, 2)
}

const buildPathMeaning = (normalized: Answers, isPartyPath: boolean, realityItems: RealityItem[], proxyHint = '') => {
  const systemName = normalized.system_detail || normalized.system || '你当前的工作场景'
  const reality = realityItems[0]?.text || ''
  const traits = isPartyPath
    ? ['本系统内部使用', isBudgetSensitive(normalized) ? '预算谨慎' : '', hasExamConcern(normalized) ? '不想把精力押在英数上' : '先稳住学历下限'].filter(Boolean).join(' + ')
    : ['希望双证可查', '兼顾遴选/职称/跨系统可能性'].join(' + ')
  if (isPartyPath) {
    return `${systemName}里，你这次更像“${traits}”的画像。党校路径更偏学历条件补齐和内部竞争使用，但是否生效要看单位口径。${reality ? ` 案例库里有同学反馈：${reality}` : ''}${proxyHint ? ` ${proxyHint}` : ''}`
  }
  return `${systemName}里，你这次更像“${traits}”的画像。统考非全路径更偏通用价值，但也意味着要接受更完整的备考压力。${reality ? ` 案例库里有同学反馈：${reality}` : ''}${proxyHint ? ` ${proxyHint}` : ''}`
}

const buildPassRateSummary = (isPartyPath: boolean) => {
  if (isPartyPath) {
    return {
      summary: ['四川党校 40.4%', '重庆党校 44%'],
      detail: []
    }
  }
  return {
    summary: ['管综初试辅导 55.6%', '复试辅导 87.5%（含调剂）'],
    detail: []
  }
}

export const buildResultPresentation = (
  normalized: Answers,
  result: LocalRecommendation,
  providedPeerInsights?: PeerInsights
): ResultPresentation => {
  const isPartyPath = String(result.primaryPath || '').includes('党校')
  const school = result.recommendedSchools?.[0]
  const secondarySchool = result.secondaryOption?.recommendedSchool
  const peerInsights = providedPeerInsights || getPeerInsights(normalized, result.primaryPath)
  const similarCase = peerInsights.similarCase
  const [primaryDistribution, secondaryDistribution] = peerInsights.distribution
  const total = peerInsights.total || (primaryDistribution.count + secondaryDistribution.count)
  const primaryLabel = formatPeerProgramLabel(primaryDistribution.programType, normalized.province)
  const secondaryLabel = formatPeerProgramLabel(secondaryDistribution.programType, normalized.province)
  const primaryReasons = peerInsights.reasonSummary[primaryDistribution.programType] || []
  const secondaryReasons = peerInsights.reasonSummary[secondaryDistribution.programType] || []
  const realityItems = buildRealityItems(normalized, peerInsights)
  const passRates = buildPassRateSummary(isPartyPath)

  return {
    profile: formatProfileText(normalized),
    systemName: normalized.system_detail || normalized.system || '',
    isPartyPath,
    recommendation: {
      title: formatSchoolTitle(school, result.primaryPath),
      tuition: formatSchoolTuition(school),
      duration: formatSchoolDuration(school, isPartyPath),
      city: school?.city || school?.province || normalized.province_detail || normalized.province || '川渝',
      reason: result.reason,
      match: result.matchPercent || 88
    },
    backup: {
      title: formatSchoolTitle(secondarySchool, result.secondaryOption?.primaryPath || (isPartyPath ? 'MPA 双证路径' : '党校在职研究生路径')),
      reason: result.secondaryOption?.reason || (isPartyPath
        ? '如果后续要兼顾遴选、职称或跨系统，双证路径会更通用。'
        : '如果预算更紧或主要用于单位内部使用，党校路径会更省力。'),
      source: [
        result.secondaryOption?.strategyId ? `rule:${result.secondaryOption.strategyId}` : '',
        secondarySchool?.sourceRecordId ? `school:${secondarySchool.sourceRecordId}` : ''
      ].filter(Boolean).join('; ')
    },
    policyItems: buildPolicyItems(normalized, isPartyPath),
    realityItems,
    pathMeaning: buildPathMeaning(normalized, isPartyPath, realityItems, peerInsights.proxyHint),
    riskItems: result.riskCards?.length
      ? result.riskCards
      : (isPartyPath
        ? ['不能替代业绩和关系', '跨系统/遴选场景要额外确认口径']
        : ['不能替代单位内资历与实绩', '统考路径需要承担英数与复试压力']),
    weeklyPlan: (result.weeklyPlan || []).map(item => item.desc).slice(0, 3),
    similarCase: {
      name: similarCase.display_name,
      who: [
        similarCase.age_concrete || similarCase.age_band,
        similarCase.unit_narrative,
        [similarCase.edu_modifier, similarCase.education].filter(Boolean).join('')
      ].filter(Boolean).join(' · '),
      choice: similarCase.chosen_school,
      quote: similarCase.reflection || similarCase.key_quote || '这条路更适合我当前阶段。',
      result: similarCase.outcome || '结果待持续跟踪',
      sourceLabel: peerInsights.source.caseSourceLabel,
      sourceNote: peerInsights.source.displayMessage,
      sourceCaseId: similarCase.case_id
    },
    knn: {
      total,
      a: primaryDistribution.count,
      b: secondaryDistribution.count,
      aText: formatPeerCount(primaryDistribution.count, true),
      bText: formatPeerCount(secondaryDistribution.count, true),
      aLabel: primaryDistribution.label,
      bLabel: secondaryDistribution.label,
      reasonATitle: `选${primaryLabel}的核心理由：`,
      reasonA: primaryReasons.join(' · ') || '更贴近当前约束和目标',
      reasonBTitle: `选${secondaryLabel}的核心理由：`,
      reasonB: secondaryReasons.join(' · ') || '更贴近另一条可行路径'
    },
    compareTotal: total,
    compareBars: [
      {
        label: primaryLabel,
        ratio: total ? Math.max(10, Math.round((primaryDistribution.count / total) * 100)) : 50,
        countText: formatPeerCount(primaryDistribution.count, true),
        color: primaryDistribution.tone === 'A' ? '#CF7140' : '#5F8C6E'
      },
      {
        label: secondaryLabel,
        ratio: total ? Math.max(10, Math.round((secondaryDistribution.count / total) * 100)) : 50,
        countText: formatPeerCount(secondaryDistribution.count, true),
        color: secondaryDistribution.tone === 'A' ? '#CF7140' : '#5F8C6E'
      }
    ],
    passRateSummary: passRates.summary,
    passRateDetail: passRates.detail,
    stories: peerInsights.stories.map(item => ({
      who: [
        item.display_name,
        item.age_concrete || item.age_band,
        item.unit_narrative
      ].filter(Boolean).join(' · '),
      choice: item.chosen_school,
      quote: item.reflection || item.key_quote || '这条路更贴近当时的实际情况。',
      result: item.outcome || '',
      sourceCaseId: item.case_id,
      sourceLabel: peerInsights.source.caseSourceLabel
    })),
    provenance: {
      primaryRuleId: result.source?.primaryRuleId || result.strategyId,
      secondaryRuleId: result.source?.secondaryRuleId || result.secondaryOption?.strategyId || '',
      primarySchoolRecordId: school?.sourceRecordId || '',
      secondarySchoolRecordId: secondarySchool?.sourceRecordId || '',
      peerBucketKey: peerInsights.source.bucketKey,
      peerCaseSource: peerInsights.source.caseSource,
      missingRuntimeSources: [
        'policy_basis.json',
        'rules.json',
        'path_options.json',
        'schools_meta.json'
      ]
    }
  }
}
