#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const args = new Map()
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i]
  const value = process.argv[i + 1]
  if (key.startsWith('--')) {
    args.set(key.slice(2), value)
    i += 1
  }
}

const eventsPath = args.get('events') || 'schooltool/data/runtime/miniapp-events.jsonl'
const leadsPath = args.get('leads') || 'schooltool/data/runtime/miniapp-leads.jsonl'
const outputPath = args.get('output') || 'analytics/reports/latest-summary.json'
const envFilter = args.get('env') || 'all'
const dateFrom = args.get('date-from') || ''
const dateTo = args.get('date-to') || ''
const VALID_ENVS = new Set(['development', 'trial', 'production'])

const readJsonl = (filePath) => {
  if (!fs.existsSync(filePath)) return []
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

const dayKey = (value) => {
  const raw = value?.created_at || value?.received_at || value?.timestamp || ''
  const date = raw ? new Date(raw) : null
  if (!date || Number.isNaN(date.getTime())) return 'unknown'
  return date.toISOString().slice(0, 10)
}

const eventTime = (value) => {
  const raw = value?.created_at || value?.received_at || value?.timestamp || ''
  const date = raw ? new Date(raw) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

const inDateRange = (event) => {
  const date = eventTime(event)
  if (!date) return true
  const day = date.toISOString().slice(0, 10)
  if (dateFrom && day < dateFrom) return false
  if (dateTo && day > dateTo) return false
  return true
}

const eventEnv = (event) => event.env || event.payload?.env || 'unknown'

const inEnv = (event) => envFilter === 'all' || eventEnv(event) === envFilter

const increment = (map, key, step = 1) => {
  if (!key) return
  map.set(key, (map.get(key) || 0) + step)
}

const topEntries = (map, limit = 10) => Array.from(map.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, limit)
  .map(([name, count]) => ({ name, count }))

const rawEvents = readJsonl(eventsPath)
const leads = readJsonl(leadsPath)
const events = rawEvents.filter(event => inEnv(event) && inDateRange(event))

const users = new Set()
const sessions = new Set()
const pageViews = []
const pageDurations = new Map()
const eventCounts = new Map()
const pageCounts = new Map()
const targetCounts = new Map()
const daily = new Map()
const pageUsers = new Map()
const casePageUsers = new Set()
const caseStats = new Map()
const qualityMissing = new Map()
let invalidEventCount = 0

const eventPage = (event) => event.page || event.payload?.page || event.target_name || 'unknown'
const eventPagePath = (event) => event.page_path || event.payload?.page_path || event.payload?.route || event.payload?.page || ''
const eventUserId = (event) => event.anonymous_user_id || event.user_id || event.session_id || ''
const eventSessionId = (event) => event.session_id || ''
const eventTargetId = (event) => event.target_id || event.payload?.target_id || ''
const eventTargetName = (event) => event.target_name || event.payload?.target_name || eventTargetId(event) || ''
const eventTargetType = (event) => event.target_type || event.payload?.target_type || ''
const eventCaseType = (event) => event.case_type || event.payload?.case_type || event.payload?.active_tab || ''
const eventModalType = (event) => event.modal_type || event.payload?.modal_type || ''
const eventRoute = (event) => event.route || event.payload?.route || ''
const eventPosition = (event) => event.position || event.payload?.position || ''

const pageKey = (event) => eventPagePath(event) || eventPage(event) || 'unknown'

const addPageUser = (page, userId) => {
  if (!page || !userId) return
  if (!pageUsers.has(page)) pageUsers.set(page, new Set())
  pageUsers.get(page).add(userId)
}

const isCasesV2Page = (event) => {
  const page = eventPage(event)
  const pagePath = eventPagePath(event)
  return page === 'cases_v2' || pagePath.includes('/pages/cases-v2/index')
}

const isResultPage = (event) => {
  const page = eventPage(event)
  const pagePath = eventPagePath(event)
  return page === 'result' || pagePath.includes('/pages/result/index')
}

const isContactRoute = (event) => eventRoute(event).includes('/pages/contact/index')
const isZexiaoRoute = (event) => eventRoute(event).includes('/pages/zexiao/index')

const getCaseStat = (event) => {
  const targetId = eventTargetId(event)
  if (!targetId) return null
  if (!caseStats.has(targetId)) {
    caseStats.set(targetId, {
      target_id: targetId,
      target_name: eventTargetName(event),
      case_type: eventCaseType(event),
      clicks: 0,
      detail_opens: 0,
      contact_clicks: 0
    })
  }
  const stat = caseStats.get(targetId)
  if (!stat.target_name && eventTargetName(event)) stat.target_name = eventTargetName(event)
  if (!stat.case_type && eventCaseType(event)) stat.case_type = eventCaseType(event)
  return stat
}

const incrementMissing = (field) => increment(qualityMissing, field)

const requiresTargetId = (event) => {
  const eventType = event.event_type || ''
  const targetType = eventTargetType(event)
  if (targetType === 'case') return ['case_card_click', 'modal_open', 'modal_close'].includes(eventType)
  return ['school_card_click', 'school_detail_view'].includes(eventType)
}

const validateEvent = (event) => {
  const required = [
    'event_id',
    'event_type',
    'page',
    'page_path',
    'anonymous_user_id',
    'session_id',
    'env',
    'app_version',
    'tracking_plan_version',
    'created_at'
  ]
  let invalid = false

  for (const field of required) {
    const value = field === 'page'
      ? eventPage(event)
      : field === 'page_path'
        ? eventPagePath(event)
        : field === 'anonymous_user_id'
          ? eventUserId(event)
          : event[field]
    if (!value || value === 'unknown') {
      incrementMissing(field)
      invalid = true
    }
  }

  if (requiresTargetId(event) && !eventTargetId(event)) {
    incrementMissing('target_id')
    invalid = true
  }

  const env = eventEnv(event)
  if (env && env !== 'unknown' && !VALID_ENVS.has(env)) {
    incrementMissing('invalid_env')
    invalid = true
  }

  const createdAt = event.created_at || event.received_at || event.timestamp
  if (createdAt && Number.isNaN(new Date(createdAt).getTime())) {
    incrementMissing('invalid_created_at')
    invalid = true
  }

  if (invalid) invalidEventCount += 1
}

const eventUserSet = (items) => new Set(items.map(eventUserId).filter(Boolean))
const eventCount = (type) => eventCounts.get(type) || 0

const step = (name, eventType, items, previousUv = null) => {
  const uv = eventUserSet(items).size
  const count = items.length
  const denominator = previousUv === null ? uv : previousUv
  return {
    step: name,
    event_type: eventType,
    count,
    uv,
    conversion_rate: denominator ? Number((uv / denominator).toFixed(4)) : 0
  }
}

for (const event of events) {
  const eventType = event.event_type || 'unknown'
  const userId = eventUserId(event)
  const sessionId = eventSessionId(event)
  const page = eventPage(event)
  const pagePath = pageKey(event)
  const date = dayKey(event)
  validateEvent(event)

  if (userId) users.add(userId)
  if (sessionId) sessions.add(sessionId)
  increment(eventCounts, eventType)
  increment(daily, `${date}:${eventType}`)

  if (eventType === 'page_view') {
    pageViews.push(event)
    increment(pageCounts, pagePath || 'unknown')
    addPageUser(pagePath || 'unknown', userId)
    if (isCasesV2Page(event) && userId) casePageUsers.add(userId)
  }

  const duration = Number(event.duration_ms || event.payload?.duration_ms || 0)
  if (eventType === 'page_leave' && duration >= 500 && duration <= 30 * 60 * 1000) {
    const current = pageDurations.get(pagePath || 'unknown') || { total: 0, count: 0 }
    current.total += duration
    current.count += 1
    pageDurations.set(pagePath || 'unknown', current)
  }

  if (eventTargetType(event) && (eventTargetName(event) || eventTargetId(event))) {
    increment(targetCounts, `${eventTargetType(event)}:${eventTargetName(event) || eventTargetId(event)}`)
  }

  if (eventType === 'case_card_click') {
    const stat = getCaseStat(event)
    if (stat) stat.clicks += 1
  }

  if (eventType === 'modal_open' && eventTargetType(event) === 'case' && eventModalType(event) === 'case_detail') {
    const stat = getCaseStat(event)
    if (stat) stat.detail_opens += 1
  }

  if (['cta_click', 'nav_click'].includes(eventType) && isContactRoute(event) && eventTargetType(event) === 'case') {
    const stat = getCaseStat(event)
    if (stat) stat.contact_clicks += 1
  }
}

const pageDurationSummary = Array.from(pageDurations.entries())
  .map(([page, item]) => ({
    page,
    avg_duration_ms: Math.round(item.total / item.count),
    samples: item.count
  }))
  .sort((a, b) => b.avg_duration_ms - a.avg_duration_ms)

const pages = Array.from(pageCounts.entries())
  .map(([page, pv]) => {
    const duration = pageDurations.get(page)
    return {
      page,
      page_path: page.startsWith('/') ? page : '',
      pv,
      uv: pageUsers.get(page)?.size || 0,
      avg_duration_ms: duration ? Math.round(duration.total / duration.count) : 0
    }
  })
  .sort((a, b) => b.pv - a.pv)

const casePageViews = pageViews.filter(isCasesV2Page)
const validCaseEvent = (event) => eventTargetType(event) === 'case' && Boolean(eventTargetId(event))
const caseCardClicks = events.filter(event => event.event_type === 'case_card_click' && validCaseEvent(event))
const caseDetailOpens = events.filter(event =>
  event.event_type === 'modal_open' &&
  validCaseEvent(event) &&
  eventModalType(event) === 'case_detail'
)
const caseLoadMoreClicks = events.filter(event => event.event_type === 'case_list_load_more')
const partyClicks = caseCardClicks.filter(event => ['party_school', 'party'].includes(eventCaseType(event)))
const managementExamClicks = caseCardClicks.filter(event => ['management_exam', 'exam'].includes(eventCaseType(event)))
const caseToContactEvents = events.filter(event =>
  ['cta_click', 'nav_click', 'contact_click'].includes(event.event_type) &&
  isContactRoute(event) &&
  (isCasesV2Page(event) || eventPage(event) === 'cases_v2')
)
const resultToContactEvents = events.filter(event =>
  ['cta_click', 'nav_click', 'contact_click'].includes(event.event_type) &&
  isContactRoute(event) &&
  isResultPage(event)
)
const resultToZexiaoEvents = events.filter(event =>
  ['cta_click', 'nav_click'].includes(event.event_type) &&
  isZexiaoRoute(event) &&
  isResultPage(event)
)
const resultPageViews = pageViews.filter(isResultPage)
const loadingPageViews = pageViews.filter(event => eventPage(event) === 'loading' || eventPagePath(event).includes('/pages/loading/index'))
const leadSubmitEvents = events.filter(event => ['lead_submit', 'submit_lead'].includes(event.event_type))

const topCases = Array.from(caseStats.values())
  .sort((a, b) => b.clicks - a.clicks || b.detail_opens - a.detail_opens)
  .slice(0, 20)
const caseClickUsers = eventUserSet(caseCardClicks)
const caseDetailUsers = eventUserSet(caseDetailOpens)

const assessmentStartEvents = events.filter(event => ['assessment_start', 'start_assessment'].includes(event.event_type))
const assessmentFinishEvents = events.filter(event => ['assessment_finish', 'finish_assessment'].includes(event.event_type))
const recommendationViewEvents = events.filter(event =>
  ['recommendation_view', 'recommendation_generated'].includes(event.event_type) ||
  (event.event_type === 'page_view' && isResultPage(event))
)

const assessmentStartStep = step('开始测一测', 'assessment_start', assessmentStartEvents)
const assessmentFinishStep = step('完成测一测', 'assessment_finish', assessmentFinishEvents, assessmentStartStep.uv)
const loadingStep = step('进入生成页', 'page_view:loading', loadingPageViews, assessmentFinishStep.uv)
const resultStep = step('到达结果页', 'page_view:result', recommendationViewEvents, loadingStep.uv || assessmentFinishStep.uv)

const caseViewStep = step('进入案例页', 'page_view:cases_v2', casePageViews)
const caseClickStep = step('点击案例卡片', 'case_card_click', caseCardClicks, caseViewStep.uv)
const caseDetailStep = step('打开案例详情', 'modal_open:case_detail', caseDetailOpens, caseClickStep.uv)
const caseContactStep = step('案例页咨询点击', 'cta_click:contact', caseToContactEvents, caseDetailStep.uv || caseClickStep.uv)

const resultViewStep = step('进入结果页', 'page_view:result', resultPageViews)
const resultContactStep = step('结果页咨询点击', 'cta_click:contact', resultToContactEvents, resultViewStep.uv)
const resultZexiaoStep = step('结果页长图点击', 'nav_click:zexiao', resultToZexiaoEvents, resultViewStep.uv)
const resultLeadStep = step('提交留资', 'lead_submit', leadSubmitEvents, resultContactStep.uv || resultViewStep.uv)

const cases = {
  page_pv: casePageViews.length,
  page_uv: casePageUsers.size,
  card_clicks: caseCardClicks.length,
  detail_opens: caseDetailOpens.length,
  load_more_clicks: caseLoadMoreClicks.length,
  party_clicks: partyClicks.length,
  management_exam_clicks: managementExamClicks.length,
  card_click_rate: casePageUsers.size ? Number((caseClickUsers.size / casePageUsers.size).toFixed(4)) : 0,
  detail_open_rate: caseClickUsers.size ? Number((caseDetailUsers.size / caseClickUsers.size).toFixed(4)) : 0,
  top_cases: topCases
}

const eventsQuality = {
  missing_required_count: Array.from(qualityMissing.values()).reduce((sum, count) => sum + count, 0),
  invalid_event_count: invalidEventCount,
  missing_fields: topEntries(qualityMissing, 50).map(item => ({
    field: item.name,
    count: item.count
  }))
}

const summary = {
  generated_at: new Date().toISOString(),
  filters: {
    env: envFilter,
    date_from: dateFrom,
    date_to: dateTo
  },
  sources: {
    events: eventsPath,
    leads: leadsPath
  },
  totals: {
    events: events.length,
    leads: leads.length,
    pv: pageViews.length,
    uv: users.size,
    sessions: sessions.size
  },
  funnel: {
    assessment_start: eventCounts.get('assessment_start') || eventCounts.get('start_assessment') || 0,
    assessment_finish: eventCounts.get('assessment_finish') || eventCounts.get('finish_assessment') || 0,
    recommendation_view: eventCounts.get('recommendation_view') || eventCounts.get('recommendation_generated') || 0,
    lead_submit: eventCounts.get('lead_submit') || Math.max(eventCounts.get('submit_lead') || 0, leads.length)
  },
  cases,
  funnels: {
    assessment_to_result: [
      assessmentStartStep,
      assessmentFinishStep,
      loadingStep,
      resultStep
    ],
    case_to_contact: [
      caseViewStep,
      caseClickStep,
      caseDetailStep,
      caseContactStep
    ],
    result_to_contact: [
      resultViewStep,
      resultContactStep,
      resultZexiaoStep,
      resultLeadStep
    ]
  },
  pages,
  events_quality: eventsQuality,
  top_events: topEntries(eventCounts, 20),
  top_pages: topEntries(pageCounts, 20),
  top_targets: topEntries(targetCounts, 20),
  page_durations: pageDurationSummary,
  daily_event_counts: Object.fromEntries(daily)
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify({ ok: true, output: outputPath, totals: summary.totals }, null, 2))
