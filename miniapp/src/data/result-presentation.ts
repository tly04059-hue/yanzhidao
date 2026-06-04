import { formatPeerProgramLabel, getPeerInsights, type PeerInsights } from './cases-v2-peer-insights'
import type { LocalRecommendation, RecommendedSchool } from './recommendation-strategy'
import {
  casesV2,
  casesV2Stats,
  managementExamCasesV2,
  partySchoolCasesV2,
  type CaseV2
} from './cases-v2'

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

const includesAny = (text: string, words: string[]) =>
  words.some(word => word && text.includes(word))

const answerSystemWords = (normalized: Answers) =>
  [
    normalized.system_detail,
    normalized.system,
    normalized.position
  ]
    .filter(Boolean)
    .map(item => String(item))

const scoreV2Case = (normalized: Answers, item: CaseV2, isPartyPath: boolean) => {
  const text = [
    item.systemLabel,
    item.regionLabel,
    item.programLabel,
    item.chosenTarget,
    item.cardQuote,
    item.reflection,
    item.examExperience,
    item.motivation
  ].join(' ')
  const systemWords = answerSystemWords(normalized)
  const province = String(normalized.province_detail || normalized.province || '')
  const goal = String(normalized.goal_detail || normalized.goal || '')

  return (
    item.richnessScore +
    (item.caseType === (isPartyPath ? 'party_school' : 'management_exam') ? 1000 : 0) +
    (province && includesAny(text, [province]) ? 120 : 0) +
    (systemWords.length && includesAny(text, systemWords) ? 160 : 0) +
    (goal && includesAny(text, [goal]) ? 80 : 0) +
    (item.aiFillLevel === 'none' ? 40 : 0)
  )
}

const selectV2Cases = (normalized: Answers, isPartyPath: boolean) => {
  const preferred = isPartyPath ? partySchoolCasesV2 : managementExamCasesV2
  const fallback = preferred.length ? preferred : casesV2
  return fallback
    .slice()
    .sort((a, b) => scoreV2Case(normalized, b, isPartyPath) - scoreV2Case(normalized, a, isPartyPath))
}

const formatV2Who = (item: CaseV2) =>
  [
    item.ageLabel,
    item.regionLabel || item.systemLabel,
    item.caseType === 'management_exam' ? item.programLabel : item.systemLabel
  ].filter(Boolean).join(' · ')

const formatV2Choice = (item: CaseV2) =>
  item.caseType === 'management_exam'
    ? item.admittedSchool || item.intentSchool || item.chosenTarget
    : item.chosenTarget

const formatV2Quote = (item: CaseV2) =>
  item.reflection || item.cardQuote || item.examExperience || item.motivation || item.studyMethod || '这条路更适合我当前阶段。'

const v2SourceNote = '来自 V2 脱敏公开案例，按路径、系统、地区和目标相似度选取。'

const isBudgetSensitive = (normalized: Answers) =>
  (Number(normalized.budget || 0) > 0 && Number(normalized.budget || 0) <= 65000) ||
  ((normalized.worries || []) as string[]).includes('budget_concern')

const hasExamConcern = (normalized: Answers) =>
  ['weak', 'unknown'].includes(String(normalized.math_base || '')) ||
  ((normalized.worries || []) as string[]).some(item => ['english_concern', 'math_concern', 'exam_concern'].includes(item))

const buildPolicyItems = (normalized: Answers, isPartyPath: boolean): RichItem[] => {
  const goal = String(normalized.goal || '')
  const goalText = String(normalized.goal_detail || normalized.goal || '')
  const provinceText = String(normalized.province_detail || normalized.province || '')

  if (isPartyPath) {
    return [
      {
        pre: '党校学历认可',
        text: '：中发〔2000〕10号文明确，党校学历待遇参照国民教育相应学历有关规定，主要适用于体制内本单位晋升、内部竞争和职务任免场景。',
        source: 'PD-02'
      },
      {
        pre: '使用边界',
        text: '：学信网不可查不等于不被承认；跨系统遴选、调任或部分专业职称评审，仍要以调入机关、岗位和本地评审细则为准。',
        source: 'PD-02;PD-03;PD-06'
      },
      {
        pre: '川渝招生',
        text: '：四川、重庆党校学制、收费、录取规则按党校年度招生章程执行，每年以最新章程和报名通知为准。',
        source: 'PD-10'
      }
    ]
  }

  if (goal === '遴选' || goalText.includes('遴选') || goal === '转行') {
    return [
      {
        pre: '国民教育序列',
        text: '：双证硕士学信网可查，在单位外部资格审核、跨系统使用和研究生学历门槛场景中通用性更高。',
        source: 'PD-03;PD-04;PD-05'
      },
      {
        pre: provinceText.includes('重庆') ? '重庆遴选口径' : '四川遴选口径',
        text: provinceText.includes('重庆')
          ? '：重庆2025年度遴选公告存在年龄和国民教育序列双证要求，具体岗位以当年公告为准。'
          : '：四川2025年度省直机关遴选/选调公告涉及年龄上限和有效学历学位证书要求，具体岗位以当年公告为准。',
        source: provinceText.includes('重庆') ? 'PD-05' : 'PD-04'
      },
      {
        pre: '调任审查',
        text: '：公务员调任等跨系统场景对学历属性存在审查要求，党校单证认可度可能因机关和岗位不同而有差异。',
        source: 'PD-03'
      }
    ]
  }

  if (goal === '职称' || goalText.includes('职称')) {
    return [
      {
        pre: '职称评审',
        text: '：人社部2017年深化职称改革意见及各地配套文件中，学历是中高级职称评审的重要资格条件。',
        source: 'PD-06'
      },
      {
        pre: '国民教育序列',
        text: '：部分职称系列更看重国民教育序列研究生学历，部分系列还会审查学科专业对口度。',
        source: 'PD-06'
      },
      {
        pre: '执行口径',
        text: '：职称评审存在地区、单位和系列差异，最终以本地评审细则和单位审核口径为准。',
        source: 'PD-06'
      }
    ]
  }

  return [
    {
      pre: '双证通用性',
      text: '：国民教育序列双证学信网可查，在遴选、调任、职称和跨系统使用中适用范围更广。',
      source: 'PD-03;PD-06'
    },
    {
      pre: '职级与岗位',
      text: '：研究生学历在新录用起点定级和职级晋升综合评价中是重要维度，具体执行视个人单位情况。',
      source: 'PD-01'
    },
    {
      pre: '使用边界',
      text: '：学历能提高资格条件和路径弹性，但不替代业绩、岗位要求和单位实际审核。',
      source: 'PD-01;PD-03;PD-06'
    }
  ]
}

const buildRealityItems = (normalized: Answers, peerInsights: PeerInsights): RealityItem[] => {
  const isPartyPath = String(peerInsights.distribution[0]?.programType || '').includes('党校')
  const v2Items = selectV2Cases(normalized, isPartyPath)
    .slice(0, 2)
    .map(item => ({
      text: item.reflection || item.cardQuote || item.examExperience || item.motivation || '',
      sourceCaseId: item.id,
      sourceLabel: 'V2 脱敏公开案例'
    }))
    .filter(item => Boolean(item.text))

  if (v2Items.length) return v2Items
  return []
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
  const v2Cases = selectV2Cases(normalized, isPartyPath)
  const v2SimilarCase = v2Cases[0]
  const [primaryDistribution, secondaryDistribution] = peerInsights.distribution
  const v2PrimaryCount = isPartyPath ? casesV2Stats.party : casesV2Stats.managementExam
  const v2SecondaryCount = isPartyPath ? casesV2Stats.managementExam : casesV2Stats.party
  const total = casesV2Stats.total || peerInsights.total || (primaryDistribution.count + secondaryDistribution.count)
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
      name: v2SimilarCase?.displayAlias || similarCase.display_name,
      who: v2SimilarCase
        ? formatV2Who(v2SimilarCase)
        : [
          similarCase.age_concrete || similarCase.age_band,
          similarCase.unit_narrative,
          [similarCase.edu_modifier, similarCase.education].filter(Boolean).join('')
        ].filter(Boolean).join(' · '),
      choice: v2SimilarCase ? formatV2Choice(v2SimilarCase) : similarCase.chosen_school,
      quote: v2SimilarCase ? formatV2Quote(v2SimilarCase) : similarCase.reflection || similarCase.key_quote || '这条路更适合我当前阶段。',
      result: v2SimilarCase?.outcomeLabel || similarCase.outcome || '结果待持续跟踪',
      sourceLabel: v2SimilarCase ? 'V2 脱敏公开案例' : peerInsights.source.caseSourceLabel,
      sourceNote: v2SimilarCase ? v2SourceNote : peerInsights.source.displayMessage,
      sourceCaseId: v2SimilarCase?.id || similarCase.case_id
    },
    knn: {
      total,
      a: v2PrimaryCount,
      b: v2SecondaryCount,
      aText: formatPeerCount(v2PrimaryCount),
      bText: formatPeerCount(v2SecondaryCount),
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
        ratio: total ? Math.max(10, Math.round((v2PrimaryCount / total) * 100)) : 50,
        countText: formatPeerCount(v2PrimaryCount),
        color: primaryDistribution.tone === 'A' ? '#CF7140' : '#5F8C6E'
      },
      {
        label: secondaryLabel,
        ratio: total ? Math.max(10, Math.round((v2SecondaryCount / total) * 100)) : 50,
        countText: formatPeerCount(v2SecondaryCount),
        color: secondaryDistribution.tone === 'A' ? '#CF7140' : '#5F8C6E'
      }
    ],
    passRateSummary: passRates.summary,
    passRateDetail: passRates.detail,
    stories: (v2Cases.length ? v2Cases : []).slice(0, 4).map(item => ({
      who: [
        item.displayAlias,
        formatV2Who(item)
      ].filter(Boolean).join(' · '),
      choice: formatV2Choice(item),
      quote: formatV2Quote(item),
      result: item.outcomeLabel || '',
      sourceCaseId: item.id,
      sourceLabel: 'V2 脱敏公开案例'
    })),
    provenance: {
      primaryRuleId: result.source?.primaryRuleId || result.strategyId,
      secondaryRuleId: result.source?.secondaryRuleId || result.secondaryOption?.strategyId || '',
      primarySchoolRecordId: school?.sourceRecordId || '',
      secondarySchoolRecordId: secondarySchool?.sourceRecordId || '',
      peerBucketKey: peerInsights.source.bucketKey,
      peerCaseSource: v2SimilarCase ? 'cases-v2-public' : peerInsights.source.caseSource,
      missingRuntimeSources: [
        'policy_basis.json',
        'rules.json',
        'path_options.json',
        'schools_meta.json'
      ]
    }
  }
}
