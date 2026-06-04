import { v5QuizContent } from './v5/quiz'
import { buildNormalizedQuizAnswers, normalizeConcernLabels, type NormalizedQuizAnswers } from './quiz-normalization'
import { getLocalRecommendation, type LocalRecommendation } from './recommendation-strategy'
import { buildResultPresentation, type ResultPresentation } from './result-presentation'
import { getPeerInsights, type PeerInsights } from './cases-v2-peer-insights'

type RawAnswers = Record<number, string | string[]>
type DpAnswers = Record<string, string>

export type QuizSubmission = {
  answers: RawAnswers
  dpAnswers: DpAnswers
}

type SkipResolution = {
  questionId: number
  title: string
  fallbackValue: string
  fallbackLabel: string
}

export type QuizRuntime = {
  version: string
  generatedAt: string
  normalized: NormalizedQuizAnswers
  skipped: SkipResolution[]
  skipNotice: string
  dp: {
    answers: DpAnswers
    lines: Array<{ label: string; text: string }>
  }
  recommendation: LocalRecommendation
  peer: PeerInsights
  presentation: ResultPresentation
  zexiao: {
    profile: string
    recommendation: {
      title: string
      backup: string
      reason: string
      match: number
    }
    pathMeaning: string
    policies: Array<{ name: string; desc: string }>
    stories: Array<{ who: string; choice: string; quote: string }>
    actionSteps: string[]
    disclaimer: string
  }
}

export type QuizPreparedInput = {
  normalized: NormalizedQuizAnswers
  skipped: SkipResolution[]
  skipNotice: string
  dp: {
    answers: DpAnswers
    lines: Array<{ label: string; text: string }>
  }
}

const SKIP_DEFAULTS: Record<number, string> = {
  5: '31-35',
  6: 'defensive',
  8: '5-10万'
}

const optionLabel = (questionId: number, value: string) => {
  const question = v5QuizContent.questions.find(item => item.id === questionId)
  return question?.options.find(option => option.value === value)?.label || value
}

const applySkipDefaults = (answers: RawAnswers) => {
  const patched: RawAnswers = { ...answers }
  const skipped: SkipResolution[] = []

  Object.entries(SKIP_DEFAULTS).forEach(([rawId, fallbackValue]) => {
    const questionId = Number(rawId)
    const hasValue = patched[questionId] !== undefined && patched[questionId] !== null && patched[questionId] !== ''
    if (hasValue) return
    const question = v5QuizContent.questions.find(item => item.id === questionId)
    patched[questionId] = fallbackValue
    skipped.push({
      questionId,
      title: question?.title || `Q${questionId}`,
      fallbackValue,
      fallbackLabel: optionLabel(questionId, fallbackValue)
    })
  })

  return { patched, skipped }
}

const buildSkipNotice = (skipped: SkipResolution[]) => {
  if (!skipped.length) return ''
  const details = skipped.map(item => `${item.title.replace('？', '')}按「${item.fallbackLabel}」补值`)
  return `你跳过了 ${skipped.length} 题：${details.join('；')}。`
}

const buildDpLines = (dp: DpAnswers) => {
  const lines: Array<{ label: string; text: string }> = []
  if (!dp.L1) return lines

  if (dp.L1 === 'untested') {
    lines.push({ label: 'L1 能力真伪辨', text: '你说“英数不行”但未经测试。参考门槛：英语二通常只需 34-38 分，数学主要是高中到大学初级。' })
  } else {
    lines.push({ label: 'L1 能力真伪辨', text: '你已测试并了解自己英数水平，按实际基础匹配路径。' })
  }

  if (dp.L2 === 'must_dual_degree') {
    lines.push({ label: 'L2 动机需求辨', text: '你必须双证，因此更偏向统考非全路径（MPA / MBA / MEM）。' })
  } else if (dp.L2 === 'no_hard_requirement' || dp.L2 === 'first_get_certificate') {
    lines.push({ label: 'L2 动机需求辨', text: '没有硬性双证要求，党校路径也在选项内，不考英数才是真省力点。' })
  }

  if (dp.L3 === 'science_thinking') {
    lines.push({ label: 'L3 能力偏好辨', text: '理科思维更适合管综逻辑和数学，统考路径有优势。' })
  } else if (dp.L3 === 'liberal_thinking') {
    lines.push({ label: 'L3 能力偏好辨', text: '文科思维更对口党校主观题，依赖材料积累和论述表达。' })
  } else if (dp.L3b === 'comprehension_effort') {
    lines.push({ label: 'L3 能力偏好辨', text: '偏理解/思考，管综逻辑和数学更适合你。' })
  } else if (dp.L3b === 'recitation_effort') {
    lines.push({ label: 'L3 能力偏好辨', text: '偏背诵/重复，党校主观题的节奏更适合你。' })
  }

  return lines
}

const buildZexiaoRuntime = (normalized: NormalizedQuizAnswers, presentation: ResultPresentation) => ({
  profile: presentation.profile,
  recommendation: {
    title: presentation.recommendation.title,
    backup: presentation.backup.title,
    reason: presentation.recommendation.reason,
    match: presentation.recommendation.match
  },
  pathMeaning: presentation.pathMeaning,
  policies: presentation.policyItems.map(item => ({
    name: item.pre,
    desc: item.text.replace(/^：/, '')
  })),
  stories: presentation.stories.slice(0, 4).map(item => ({
    who: item.who,
    choice: item.choice,
    quote: item.quote
  })),
  actionSteps: presentation.weeklyPlan,
  disclaimer: `以上判断基于你的作答、案例反馈和公开政策信息生成，仅供方向参考。涉及报名资格、单位认可和最新政策，请以最新招生简章及你所在单位口径为准。${normalized.worry_details.length ? ` 你当前主要顾虑包括：${normalizeConcernLabels(normalized.worries).join('、')}。` : ''}`
})

export const prepareQuizInput = (submission: QuizSubmission): QuizPreparedInput => {
  const { patched, skipped } = applySkipDefaults(submission.answers)
  const normalized = buildNormalizedQuizAnswers(patched, submission.dpAnswers)

  return {
    normalized,
    skipped,
    skipNotice: buildSkipNotice(skipped),
    dp: {
      answers: { ...submission.dpAnswers },
      lines: buildDpLines(submission.dpAnswers)
    }
  }
}

export const buildQuizRuntimeFromPieces = (
  prepared: QuizPreparedInput,
  recommendation: LocalRecommendation,
  peer: PeerInsights,
  presentation: ResultPresentation
): QuizRuntime => ({
  version: 'runtime-v1',
  generatedAt: new Date().toISOString(),
  normalized: prepared.normalized,
  skipped: prepared.skipped,
  skipNotice: prepared.skipNotice,
  dp: prepared.dp,
  recommendation,
  peer,
  presentation,
  zexiao: buildZexiaoRuntime(prepared.normalized, presentation)
})

export const buildQuizRuntime = (submission: QuizSubmission): QuizRuntime => {
  const prepared = prepareQuizInput(submission)
  const recommendation = getLocalRecommendation(prepared.normalized)
  const peer = getPeerInsights(prepared.normalized, recommendation.primaryPath)
  const presentation = buildResultPresentation(prepared.normalized, recommendation, peer)
  return buildQuizRuntimeFromPieces(prepared, recommendation, peer, presentation)
}
