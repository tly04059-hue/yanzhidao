import peerProfilePayload from '../../../schooltool/data/peer_profile_cache.json'
import studentsMapPayload from '../../../schooltool/data/students_map.json'
import { runtimeCases, type RuntimeCase } from './runtime-cases'

type Answers = Record<string, any>

type PeerCacheEntry = {
  key: string
  q1_system: string
  q3_region: string
  q5_age_band: string
  students_n_total: number
  students_n_display: string
  students_path_distribution: {
    A_dangxiao?: number
    B_tongkao?: number
    unknown?: number
  }
  case_match_count: number
  case_match_count_display: string
  similar_case_ids: string[]
  top1_case_id: string | null
  top_reason_tags: string[]
  fallback_chain: null | unknown
  display_policy?: {
    students_aggregate_ok?: boolean
    case_cards_ok?: boolean
    max_case_cards?: number
  }
}

type FallbackChainNode = {
  level: number
  scope: string
  n: number
  eligible: boolean
  member_buckets?: string[]
  fallback_message?: string
}

type FallbackChainEntry = {
  original_n: number
  standard_response_prefix?: string
  chain: FallbackChainNode[]
  active_level?: number
}

export type PeerDistributionItem = {
  programType: string
  label: string
  count: number
  tone: 'A' | 'B'
}

export type PeerInsights = {
  similarCase: RuntimeCase
  total: number
  stories: RuntimeCase[]
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

const peerEntries = (((peerProfilePayload as any).data?.cache_entries || {}) as Record<string, PeerCacheEntry>)
const fallbackChains = ((((studentsMapPayload as any).data?.stats_by_match_key || {}).fallback_chains || {}) as Record<
  string,
  FallbackChainEntry
>)

const CHONGQING_REGIONS = ['重庆主城', '渝东北', '渝东南', '渝西', '涪陵']
const MINORITY_REGIONS = ['甘孜', '凉山', '阿坝']
const SYSTEM_BUCKET_MAP: Record<string, string[]> = {
  dangzheng: ['县级民政', '市直机关'],
  gongjianfa: ['市直政法'],
  education: ['教育系统', '高校'],
  medical: ['医院'],
  guoqi: ['央企', '国企', '省属国企'],
  bank_finance: ['银行金融'],
  xiangzhen: ['基层公职'],
  other_shiye: ['system_unknown_storied']
}

const normalizePrimaryProgramGroup = (primaryPath: string) =>
  primaryPath.includes('党校') ? '党校' : '统考非全'

const getComparisonPrograms = (primaryPath: string): [string, string] => {
  const primaryGroup = normalizePrimaryProgramGroup(primaryPath)
  return primaryGroup === '党校' ? ['党校', '统考非全'] : ['统考非全', '党校']
}

const buildBucketKey = (answers: Answers) => {
  const system = String(answers.system_key || '')
  const region = String(answers.province_key || '')
  const age = String(answers.age_key || '')
  return [system, region, age].filter(Boolean).join('|')
}

const caseMatchesRegion = (item: RuntimeCase, provinceKey: string) => {
  if (!provinceKey) return true
  if (provinceKey === 'sichuan_minzu') return MINORITY_REGIONS.includes(item.region)
  if (provinceKey === 'chongqing') return CHONGQING_REGIONS.some(region => item.region.includes(region))
  if (provinceKey === 'sichuan') {
    return !MINORITY_REGIONS.includes(item.region) && !CHONGQING_REGIONS.some(region => item.region.includes(region))
  }
  return true
}

const caseMatchesSystem = (item: RuntimeCase, systemKey: string) => {
  const allowed = SYSTEM_BUCKET_MAP[systemKey]
  if (!allowed?.length) return true
  return allowed.includes(item.system)
}

const caseMatchesAge = (item: RuntimeCase, ageKey: string) => {
  if (!ageKey) return true
  if (ageKey === '25-30') return item.age_band.includes('25-30') || item.age_band.includes('25-35')
  if (ageKey === '31-35') return item.age_band.includes('30-35') || item.age_band.includes('31-35') || item.age_band.includes('25-35')
  if (ageKey === '36-40') return item.age_band.includes('35-40') || item.age_band.includes('25-40')
  if (ageKey === '41+') return item.age_band.includes('40+') || item.age_band.includes('25-45') || item.age_band.includes('45+')
  return true
}

const preferredProgramTypes = (answers: Answers, primaryPath: string) => {
  if (primaryPath.includes('MEM')) return ['MEM', 'MPA']
  if (primaryPath.includes('MBA')) return ['MBA', 'MPA']
  if (primaryPath.includes('MPA')) return ['MPA', 'MEM']
  if (answers.system_key === 'gongjianfa' && answers.goal === '遴选') return ['MPA']
  return ['党校']
}

const isMedicalTitleScene = (answers: Answers) => answers.system_key === 'medical' && answers.goal === '职称'

const isPublicLawSelectionScene = (answers: Answers) => answers.system_key === 'gongjianfa' && answers.goal === '遴选'

const scoreProgramPreference = (item: RuntimeCase, answers: Answers, primaryPath: string) => {
  const preferred = preferredProgramTypes(answers, primaryPath)
  const programType = item.source.program_type

  if (programType === preferred[0]) return 32
  if (preferred.slice(1).includes(programType)) return 16
  if ((isMedicalTitleScene(answers) || isPublicLawSelectionScene(answers)) && programType === 'MBA') return -22
  return 0
}

const scoreSceneSpecificSignals = (item: RuntimeCase, answers: Answers, primaryPath: string) => {
  const text = [item.chosen_school, item.key_quote, item.story_summary, item.reflection, item.source.position_tag, item.source.goal_tag.join(' ')].join(' ')
  let score = 0

  if (isMedicalTitleScene(answers)) {
    if (item.system === '医院' || text.includes('医疗系统') || text.includes('医护')) score += 22
    if (item.source.position_tag === '医护') score += 12
    if (text.includes('MEM')) score += 24
    if (text.includes('医科')) score += 18
    if (text.includes('西南医科大学')) score += 10
    if (item.source.goal_tag.includes('职称')) score += 12
    if (item.source.goal_tag.includes('学历提升') || item.reason_tags.some(tag => tag.includes('双证'))) score += 6
    if (text.includes('国企')) score -= 18
    if (item.system === 'system_unknown_storied' && !text.includes('医科')) score -= 24
  }

  if (isPublicLawSelectionScene(answers)) {
    const hasLegalSignal =
      item.system === '市直政法' ||
      ['法院检察院', '公安系统', '纪委监委', '公检法岗位'].includes(item.source.position_tag) ||
      text.includes('法院') ||
      text.includes('检察') ||
      text.includes('政法') ||
      text.includes('法学') ||
      text.includes('法律')
    if (item.system === '市直政法') score += 22
    if (item.system === '市直机关' || item.system === '基层公职') score += 10
    if (['法院检察院', '公安系统', '纪委监委', '公检法岗位'].includes(item.source.position_tag)) score += 14
    if (text.includes('法院') || text.includes('检察') || text.includes('政法')) score += 14
    if (text.includes('MPA')) score += 18
    if (text.includes('法学') || text.includes('法律')) score += 20
    if (item.source.goal_tag.includes('遴选') || text.includes('遴选') || text.includes('调任') || text.includes('公务员')) score += 16
    if (!hasLegalSignal) score -= 80
    if (item.system === 'system_unknown_storied') score -= 6
  }

  if (primaryPath.includes('MPA') && text.includes('MBA') && !text.includes('MPA')) score -= 12
  if (primaryPath.includes('MEM') && text.includes('MBA') && !text.includes('MEM') && !text.includes('MPA')) score -= 12

  return score
}

const scoreHeuristicCase = (item: RuntimeCase, answers: Answers, primaryGroup: string, primaryPath: string) => {
  let score = 0
  if (caseMatchesSystem(item, String(answers.system_key || ''))) score += 26
  if (caseMatchesRegion(item, String(answers.province_key || ''))) score += 18
  if (caseMatchesAge(item, String(answers.age_key || ''))) score += 14
  if (answers.party_member === '是' && item.is_party_member) score += 6
  if (answers.party_member === '否' && item.is_party_member === false) score += 6
  if (primaryGroup === '党校' && item.source.program_type === '党校') score += 16
  if (primaryGroup === '统考非全' && item.source.program_type !== '党校') score += 16
  if (String(answers.goal || '') === '遴选' && item.reason_tags.some(tag => tag.includes('双证') || tag.includes('遴选'))) score += 8
  if (String(answers.goal || '') === '晋升' && item.reason_tags.some(tag => tag.includes('晋升'))) score += 8
  score += scoreProgramPreference(item, answers, primaryPath)
  score += scoreSceneSpecificSignals(item, answers, primaryPath)
  return score + item.completeness_score
}

const uniqueCaseIds = (caseIds: string[]) => Array.from(new Set(caseIds.filter(Boolean)))

const resolveCasesByIds = (caseIds: string[]) =>
  uniqueCaseIds(caseIds)
    .map(caseId => runtimeCases.find(item => item.case_id === caseId))
    .filter((item): item is RuntimeCase => Boolean(item))

const matchesPrimaryGroup = (item: RuntimeCase, primaryGroup: string) =>
  primaryGroup === '党校' ? item.source.program_type === '党校' : item.source.program_type !== '党校'

const topReasonTags = (cases: RuntimeCase[]) => {
  const counts = new Map<string, number>()
  cases.forEach(item => {
    ;(item.reason_tags.length ? item.reason_tags : item.reason_keywords).forEach(tag => {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    })
  })
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hans-CN'))
    .slice(0, 4)
    .map(([tag]) => tag)
}

const toAggregateEntry = (entryKey: string, bucketKeys: string[]): PeerCacheEntry | null => {
  const entries = bucketKeys.map(key => peerEntries[key]).filter((item): item is PeerCacheEntry => Boolean(item))
  if (!entries.length) return null

  const mergedSimilarCaseIds = uniqueCaseIds(entries.flatMap(item => item.similar_case_ids || []))
  const mergedTopTags = uniqueCaseIds(entries.flatMap(item => item.top_reason_tags || []))
  const total = entries.reduce((sum, item) => sum + (item.students_n_total || 0), 0)
  const countA = entries.reduce((sum, item) => sum + (item.students_path_distribution.A_dangxiao || 0), 0)
  const countB = entries.reduce((sum, item) => sum + (item.students_path_distribution.B_tongkao || 0), 0)
  const countUnknown = entries.reduce((sum, item) => sum + (item.students_path_distribution.unknown || 0), 0)

  return {
    key: entryKey,
    q1_system: entries[0].q1_system,
    q3_region: entries[0].q3_region,
    q5_age_band: entries[0].q5_age_band,
    students_n_total: total,
    students_n_display: total > 10 ? '10+' : String(total),
    students_path_distribution: {
      A_dangxiao: countA,
      B_tongkao: countB,
      unknown: countUnknown
    },
    case_match_count: mergedSimilarCaseIds.length,
    case_match_count_display: String(mergedSimilarCaseIds.length),
    similar_case_ids: mergedSimilarCaseIds,
    top1_case_id: mergedSimilarCaseIds[0] || null,
    top_reason_tags: mergedTopTags.slice(0, 6),
    fallback_chain: null,
    display_policy: {
      students_aggregate_ok: true,
      case_cards_ok: mergedSimilarCaseIds.length > 0,
      max_case_cards: 4
    }
  }
}

const getFallbackInfo = (bucketKey: string) => {
  const chain = fallbackChains[bucketKey]
  if (!chain?.chain?.length) {
    return { keys: [] as string[], level: null as number | null, message: '' }
  }

  const preferred = typeof chain.active_level === 'number'
    ? chain.chain.find(item => item.level === chain.active_level && item.eligible)
    : null
  const firstEligible = chain.chain.find(item => item.eligible && item.member_buckets?.length)
  const active = preferred || firstEligible || null

  return {
    keys: active?.member_buckets || [],
    level: active?.level ?? null,
    message: active?.fallback_message || chain.standard_response_prefix || ''
  }
}

const buildStoryPool = (answers: Answers, primaryGroup: string, primaryPath: string, exactEntry: PeerCacheEntry | null, fallbackEntry: PeerCacheEntry | null) => {
  const heuristicStories = runtimeCases
    .map(item => ({ item, score: scoreHeuristicCase(item, answers, primaryGroup, primaryPath) }))
    .filter(item => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.item.display_priority - a.item.display_priority ||
        b.item.completeness_score - a.item.completeness_score
    )
    .slice(0, 8)
    .map(item => item.item)

  const mergeAndSortStories = (seedStories: RuntimeCase[]) =>
    Array.from(new Map([...seedStories, ...heuristicStories].map(item => [item.case_id, item])).values()).sort(
      (a, b) =>
        scoreHeuristicCase(b, answers, primaryGroup, primaryPath) -
          scoreHeuristicCase(a, answers, primaryGroup, primaryPath) ||
        Number(matchesPrimaryGroup(b, primaryGroup)) - Number(matchesPrimaryGroup(a, primaryGroup)) ||
        b.display_priority - a.display_priority ||
        b.completeness_score - a.completeness_score ||
        a.sort_order - b.sort_order
    )

  const exactStories = resolveCasesByIds(exactEntry?.similar_case_ids || [])
  if (exactStories.length && exactEntry?.display_policy?.case_cards_ok !== false) {
    return {
      stories: mergeAndSortStories(exactStories),
      sourceEntry: exactEntry,
      caseSource: 'exact' as const,
      sourceCaseIds: uniqueCaseIds(exactEntry!.similar_case_ids || [])
    }
  }

  const fallbackStories = resolveCasesByIds(fallbackEntry?.similar_case_ids || [])
  if (fallbackStories.length && fallbackEntry?.display_policy?.case_cards_ok !== false) {
    return {
      stories: mergeAndSortStories(fallbackStories),
      sourceEntry: fallbackEntry,
      caseSource: 'fallback' as const,
      sourceCaseIds: uniqueCaseIds(fallbackEntry!.similar_case_ids || [])
    }
  }

  return {
    stories: mergeAndSortStories([]),
    sourceEntry: fallbackEntry || exactEntry,
    caseSource: 'heuristic' as const,
    sourceCaseIds: heuristicStories.map(item => item.case_id)
  }
}

const topCaseFromPool = (stories: RuntimeCase[], primaryGroup: string, preferPrimaryGroup = true) => {
  if (!stories.length) return runtimeCases[0]
  if (!preferPrimaryGroup) return stories[0]

  const primaryGroupStory = stories.find(item => matchesPrimaryGroup(item, primaryGroup))
  if (primaryGroupStory) return primaryGroupStory

  return stories[0]
}

const buildReasonSummary = (
  programA: string,
  programB: string,
  stories: RuntimeCase[],
  sourceEntry: PeerCacheEntry | null
) => {
  const partyStories = stories.filter(item => item.source.program_type === '党校')
  const tongkaoStories = stories.filter(item => item.source.program_type !== '党校')
  const partyReasons = topReasonTags(partyStories)
  const tongkaoReasons = topReasonTags(tongkaoStories)
  const fallbackReasons = (sourceEntry?.top_reason_tags || []).slice(0, 4)

  return {
    [programA]: (programA === '党校' ? partyReasons : tongkaoReasons).length
      ? (programA === '党校' ? partyReasons : tongkaoReasons)
      : fallbackReasons,
    [programB]: (programB === '党校' ? partyReasons : tongkaoReasons).length
      ? (programB === '党校' ? partyReasons : tongkaoReasons)
      : fallbackReasons
  }
}

const buildProxyHint = (answers: Answers, stories: RuntimeCase[], primaryPath: string) => {
  if (isMedicalTitleScene(answers) && primaryPath.includes('MEM')) {
    const hasRealMemStory = stories.some(item => item.chosen_school.includes('MEM') || item.source.program_type === 'MEM')
    if (!hasRealMemStory) {
      return '当前公开案例里暂无可直接复用的 MEM 上岸样本，已优先选用医科类 MPA / 医护双证案例作为最近似参考。'
    }
  }

  if (isPublicLawSelectionScene(answers) && primaryPath.includes('MPA')) {
    const hasPublicLawDualStory = stories.some(
      item =>
        item.source.program_type !== '党校' &&
        (item.system === '市直政法' || ['法院检察院', '公安系统', '纪委监委', '公检法岗位'].includes(item.source.position_tag))
    )
    if (!hasPublicLawDualStory) {
      return '当前公开案例里暂无可直接复用的政法系统双证上岸样本，已优先选用体制内公务员遴选 MPA 案例作为最近似参考。'
    }
  }

  return ''
}

const caseSearchText = (item: RuntimeCase) =>
  [
    item.system,
    item.unit_narrative,
    item.chosen_school,
    item.key_quote,
    item.story_summary,
    item.reflection,
    item.source.position_tag,
    item.source.goal_tag.join(' ')
  ].join(' ')

const filterStoriesForDisplay = (answers: Answers, stories: RuntimeCase[], primaryPath: string) => {
  if (isMedicalTitleScene(answers)) {
    const medicalStories = stories.filter(item => {
      const text = caseSearchText(item)
      return /医|医疗|医护|医院|医科|MEM/.test(text) && !text.includes('国企')
    })
    if (!primaryPath.includes('党校')) {
      const dualMedicalStories = medicalStories.filter(item => item.source.program_type !== '党校')
      if (dualMedicalStories.length) return dualMedicalStories
    }
    return medicalStories.length ? medicalStories : stories
  }

  if (isPublicLawSelectionScene(answers)) {
    const legalStories = stories.filter(item => {
      const text = caseSearchText(item)
      return (
        item.system === '市直政法' ||
        ['法院检察院', '公安系统', '纪委监委', '公检法岗位'].includes(item.source.position_tag) ||
        /法院|检察|公安|纪委|政法|法学|法律/.test(text)
      )
    })
    return legalStories.length ? legalStories : stories
  }

  return stories
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
  const bucketKey = buildBucketKey(answers)
  const exactEntry = peerEntries[bucketKey] || null
  const fallbackInfo = getFallbackInfo(bucketKey)
  const fallbackEntry = toAggregateEntry(bucketKey, fallbackInfo.keys)
  const countEntry = exactEntry || fallbackEntry
  const [programA, programB] = getComparisonPrograms(primaryPath)
  const primaryGroup = normalizePrimaryProgramGroup(primaryPath)
  const province = String(answers.province || '')

  const { stories, sourceEntry, caseSource, sourceCaseIds } = buildStoryPool(answers, primaryGroup, primaryPath, exactEntry, fallbackEntry)
  const displayStories = filterStoriesForDisplay(answers, stories, primaryPath)
  const similarCase = topCaseFromPool(displayStories.length ? displayStories : stories, primaryGroup, caseSource !== 'heuristic')
  const reasonSummary = buildReasonSummary(programA, programB, displayStories, sourceEntry)
  const proxyHint = buildProxyHint(answers, displayStories, primaryPath)
  const caseSourceLabel = caseSource === 'exact'
    ? '同画像真实案例'
    : caseSource === 'fallback'
      ? '降维相似案例'
      : '近似案例参考'
  const displayMessage = caseSource === 'exact'
    ? '案例来自同系统、同地区、同年龄段的脱敏样本。'
    : caseSource === 'fallback'
      ? (fallbackInfo.message || '精确画像样本不足，已按系统、地区或年龄降维后选取相似案例。')
      : '精确画像暂无可展示案例，以下仅按系统、地区、目标和路径相近度选取近似案例参考。'

  const storyPartyCount = displayStories.filter(item => item.source.program_type === '党校').length
  const storyTongkaoCount = displayStories.filter(item => item.source.program_type !== '党校').length
  const countA = programA === '党校'
    ? countEntry?.students_path_distribution.A_dangxiao || storyPartyCount
    : countEntry?.students_path_distribution.B_tongkao || storyTongkaoCount
  const countB = programB === '党校'
    ? countEntry?.students_path_distribution.A_dangxiao || storyPartyCount
    : countEntry?.students_path_distribution.B_tongkao || storyTongkaoCount
  const maxStories = caseSource === 'heuristic' ? 1 : Math.max(4, sourceEntry?.display_policy?.max_case_cards || 4)

  return {
    similarCase,
    total: countEntry?.students_n_total || displayStories.length,
    stories: displayStories.slice(0, maxStories),
    reasonSummary,
    proxyHint,
    distribution: [
      {
        programType: programA,
        label: `位选 ${formatPeerProgramLabel(programA, province)}`,
        count: countA,
        tone: 'A'
      },
      {
        programType: programB,
        label: `位选 ${formatPeerProgramLabel(programB, province)}`,
        count: countB,
        tone: 'B'
      }
    ],
    source: {
      bucketKey,
      sourceKey: sourceEntry?.key || bucketKey,
      caseSource,
      caseSourceLabel,
      sourceCaseIds,
      fallbackLevel: caseSource === 'fallback' ? fallbackInfo.level : null,
      caseCardsOk: caseSource !== 'heuristic',
      displayMessage
    }
  }
}
