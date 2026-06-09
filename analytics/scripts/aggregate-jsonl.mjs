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
const eventSampleLimit = Number(args.get('event-sample-limit') || 10000)
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
const eventSectionId = (event) => event.section_id || event.payload?.section_id || eventTargetId(event) || ''
const eventSectionName = (event) => event.section_name || event.payload?.section_name || eventTargetName(event) || eventSectionId(event)
const eventScrollThreshold = (event) => Number(event.scroll_threshold || event.payload?.scroll_threshold || 0) || 0
const eventShareTraceId = (event) => event.share_trace_id || event.payload?.share_trace_id || ''
const eventReferrerShareTraceId = (event) => event.referrer_share_trace_id || event.payload?.referrer_share_trace_id || ''
const eventSourceChannel = (event) => event.source_channel || event.scene_category || event.payload?.source_channel || event.payload?.source || ''
const eventKeyword = (event) => event.keyword || event.payload?.keyword || ''
const eventResultCount = (event) => Number(event.result_count ?? event.payload?.result_count ?? 0) || 0
const eventHasResult = (event) => {
  if (typeof event.has_result === 'boolean') return event.has_result
  if (typeof event.payload?.has_result === 'boolean') return event.payload.has_result
  return eventResultCount(event) > 0
}
const eventErrorType = (event) => event.error_type || event.payload?.error_type || event.event_type || ''
const eventErrorMessage = (event) => event.err_msg || event.payload?.err_msg || event.target_name || ''
const eventStatusCode = (event) => Number(event.status_code || event.payload?.status_code || 0) || 0
const eventUrl = (event) => event.url || event.payload?.url || ''
const eventDeviceModel = (event) => event.device_model || event.payload?.device_model || event.payload?.device?.device_model || ''
const eventPlatform = (event) => event.platform || event.payload?.platform || event.payload?.device?.platform || ''
const eventOsName = (event) => event.os_name || event.payload?.os_name || event.payload?.device?.os_name || ''

const pageKey = (event) => eventPagePath(event) || eventPage(event) || 'unknown'
const eventTimestamp = (event) => {
  const date = eventTime(event)
  return date ? date.getTime() : 0
}

const addPageUser = (page, userId) => {
  if (!page || !userId) return
  if (!pageUsers.has(page)) pageUsers.set(page, new Set())
  pageUsers.get(page).add(userId)
}

const addMapSetValue = (map, key, value) => {
  if (!key || !value) return
  if (!map.has(key)) map.set(key, new Set())
  map.get(key).add(value)
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
const eventPreview = (event) => ({
  event_id: event.event_id || '',
  created_at: event.created_at || event.received_at || event.timestamp || '',
  event_type: event.event_type || 'unknown',
  anonymous_user_id: eventUserId(event),
  session_id: eventSessionId(event),
  page: eventPage(event),
  page_path: eventPagePath(event),
  target_type: eventTargetType(event),
  target_id: eventTargetId(event),
  target_name: eventTargetName(event),
  position: eventPosition(event),
  section_id: eventSectionId(event),
  section_name: eventSectionName(event),
  scroll_threshold: eventScrollThreshold(event),
  action: event.action || event.payload?.action || '',
  env: eventEnv(event),
  source_channel: eventSourceChannel(event),
  keyword: eventKeyword(event),
  result_count: eventResultCount(event),
  has_result: eventHasResult(event),
  error_type: eventErrorType(event),
  err_msg: eventErrorMessage(event),
  status_code: eventStatusCode(event),
  url: eventUrl(event),
  device_model: eventDeviceModel(event),
  platform: eventPlatform(event),
  duration_ms: Number(event.duration_ms || event.payload?.duration_ms || 0) || 0,
  share_trace_id: eventShareTraceId(event),
  referrer_share_trace_id: eventReferrerShareTraceId(event)
})

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

const userStats = new Map()
const sessionStats = new Map()
const deviceModelCounts = new Map()
const platformCounts = new Map()
const osCounts = new Map()
const shareAttemptPageCounts = new Map()
const shareOpenPageCounts = new Map()
const shareTraces = new Map()
const sectionStats = new Map()
const sectionToggleStats = new Map()
const scrollDepthStats = new Map()
const entryPageCounts = new Map()
const exitPageCounts = new Map()
const transitionCounts = new Map()
const hourlyCounts = new Map()
const weekdayCounts = new Map()
const sectionTransitionCounts = new Map()
const sourceChannelCounts = new Map()
const sourceChannelUsers = new Map()
const sourceChannelSessions = new Map()
const sourceChannelContacts = new Map()
const sourceChannelLeads = new Map()
const searchKeywordCounts = new Map()
const searchKeywordUsers = new Map()
const noResultSearchCounts = new Map()
const searchClickCounts = new Map()
const interactionCounts = new Map()
const interactionUsers = new Map()
const technicalIssueCounts = new Map()
const technicalUrlCounts = new Map()
const technicalStatusCounts = new Map()
const newUserIds = new Set()
const returningUserIds = new Set()

const getUserStat = (userId) => {
  if (!userId) return null
  if (!userStats.has(userId)) {
    userStats.set(userId, {
      anonymous_user_id: userId,
      first_seen_at: '',
      last_seen_at: '',
      event_count: 0,
      page_view_count: 0,
      session_ids: new Set(),
      pages: new Set(),
      visit_days: new Set(),
      visit_times: new Set(),
      devices: new Set(),
      platforms: new Set(),
      total_page_duration_ms: 0,
      share_attempts: 0,
      share_opens: 0,
      contact_clicks: 0,
      lead_submits: 0,
      case_detail_opens: 0
    })
  }
  return userStats.get(userId)
}

const getSessionStat = (sessionId, userId) => {
  if (!sessionId) return null
  if (!sessionStats.has(sessionId)) {
    sessionStats.set(sessionId, {
      session_id: sessionId,
      anonymous_user_id: userId || '',
      started_at: '',
      ended_at: '',
      start_ts: 0,
      end_ts: 0,
      event_count: 0,
      page_view_count: 0,
      pages: new Set(),
      events: [],
      entry_page: '',
      exit_page: '',
      device_model: '',
      platform: '',
      share_attempts: 0,
      share_opens: 0,
      contact_clicks: 0,
      lead_submits: 0,
      total_page_duration_ms: 0
    })
  }
  const stat = sessionStats.get(sessionId)
  if (!stat.anonymous_user_id && userId) stat.anonymous_user_id = userId
  return stat
}

const getShareTrace = (traceId) => {
  if (!traceId) return null
  if (!shareTraces.has(traceId)) {
    shareTraces.set(traceId, {
      share_trace_id: traceId,
      attempt_count: 0,
      open_count: 0,
      shared_page: '',
      shared_path: '',
      sharer_user_id: '',
      opener_users: new Set(),
      first_attempt_at: '',
      first_open_at: ''
    })
  }
  return shareTraces.get(traceId)
}

const getSectionStat = (event) => {
  const sectionId = eventSectionId(event)
  if (!sectionId) return null
  const page = eventPage(event)
  const key = `${page}:${sectionId}`
  if (!sectionStats.has(key)) {
    sectionStats.set(key, {
      page,
      section_id: sectionId,
      section_name: eventSectionName(event),
      starts: 0,
      ends: 0,
      total_duration_ms: 0,
      users: new Set(),
      sessions: new Set()
    })
  }
  const stat = sectionStats.get(key)
  if (!stat.section_name && eventSectionName(event)) stat.section_name = eventSectionName(event)
  return stat
}

for (const event of events) {
  const eventType = event.event_type || 'unknown'
  const userId = eventUserId(event)
  const sessionId = eventSessionId(event)
  const page = eventPage(event)
  const pagePath = pageKey(event)
  const date = dayKey(event)
  const timestamp = eventTimestamp(event)
  const timeIso = event.created_at || event.received_at || event.timestamp || ''
  const duration = Number(event.duration_ms || event.payload?.duration_ms || 0)
  const validDuration = duration >= 500 && duration <= 30 * 60 * 1000
  const sourceChannel = eventSourceChannel(event) || 'unknown'
  validateEvent(event)

  if (userId) users.add(userId)
  if (sessionId) sessions.add(sessionId)
  if (event.is_new_user === true && userId) newUserIds.add(userId)
  if (event.is_new_user === false && userId) returningUserIds.add(userId)
  increment(eventCounts, eventType)
  increment(daily, `${date}:${eventType}`)
  increment(sourceChannelCounts, sourceChannel)
  addMapSetValue(sourceChannelUsers, sourceChannel, userId)
  addMapSetValue(sourceChannelSessions, sourceChannel, sessionId)
  if (eventType === 'contact_click') increment(sourceChannelContacts, sourceChannel)
  if (eventType === 'lead_submit') increment(sourceChannelLeads, sourceChannel)

  const deviceModel = eventDeviceModel(event)
  const platform = eventPlatform(event)
  const osName = eventOsName(event)
  if (deviceModel) increment(deviceModelCounts, deviceModel)
  if (platform) increment(platformCounts, platform)
  if (osName) increment(osCounts, osName)

  const userStat = getUserStat(userId)
  if (userStat) {
    userStat.event_count += 1
    if (!userStat.first_seen_at || (timestamp && timestamp < new Date(userStat.first_seen_at).getTime())) userStat.first_seen_at = timeIso
    if (!userStat.last_seen_at || (timestamp && timestamp > new Date(userStat.last_seen_at).getTime())) userStat.last_seen_at = timeIso
    if (sessionId) userStat.session_ids.add(sessionId)
    if (pagePath) userStat.pages.add(pagePath)
    if (date) userStat.visit_days.add(date)
    if (timeIso && ['app_launch', 'app_show', 'app_hide', 'page_view', 'page_leave'].includes(eventType)) {
      userStat.visit_times.add(timeIso)
    }
    if (deviceModel) userStat.devices.add(deviceModel)
    if (platform) userStat.platforms.add(platform)
    if (eventType === 'page_view') userStat.page_view_count += 1
    if (eventType === 'page_leave' && validDuration) userStat.total_page_duration_ms += duration
    if (eventType === 'share_attempt') userStat.share_attempts += 1
    if (eventType === 'share_open') userStat.share_opens += 1
    if (eventType === 'contact_click') userStat.contact_clicks += 1
    if (eventType === 'lead_submit') userStat.lead_submits += 1
    if (eventType === 'modal_open' && eventModalType(event) === 'case_detail') userStat.case_detail_opens += 1
  }

  const sessionStat = getSessionStat(sessionId, userId)
  if (sessionStat) {
    sessionStat.event_count += 1
    if (!sessionStat.started_at || (timestamp && timestamp < sessionStat.start_ts)) {
      sessionStat.started_at = timeIso
      sessionStat.start_ts = timestamp
      sessionStat.entry_page = pagePath || page || 'unknown'
    }
    if (!sessionStat.ended_at || (timestamp && timestamp > sessionStat.end_ts)) {
      sessionStat.ended_at = timeIso
      sessionStat.end_ts = timestamp
      sessionStat.exit_page = pagePath || page || 'unknown'
    }
    if (eventType === 'page_view') sessionStat.page_view_count += 1
    if (pagePath) sessionStat.pages.add(pagePath)
    if (deviceModel && !sessionStat.device_model) sessionStat.device_model = deviceModel
    if (platform && !sessionStat.platform) sessionStat.platform = platform
    if (eventType === 'page_leave' && validDuration) sessionStat.total_page_duration_ms += duration
    if (eventType === 'share_attempt') sessionStat.share_attempts += 1
    if (eventType === 'share_open') sessionStat.share_opens += 1
    if (eventType === 'contact_click') sessionStat.contact_clicks += 1
    if (eventType === 'lead_submit') sessionStat.lead_submits += 1
    if (sessionStat.events.length < 120) sessionStat.events.push(eventPreview(event))
  }

  if (eventType === 'share_attempt') {
    const trace = getShareTrace(eventShareTraceId(event))
    if (trace) {
      trace.attempt_count += 1
      trace.shared_page = eventPage(event)
      trace.shared_path = event.payload?.target_path || event.payload?.original_path || eventPagePath(event)
      trace.sharer_user_id = userId
      if (!trace.first_attempt_at) trace.first_attempt_at = timeIso
    }
    increment(shareAttemptPageCounts, eventPage(event))
  }

  if (eventType === 'share_open') {
    const trace = getShareTrace(eventReferrerShareTraceId(event))
    const sharedFromPage = event.payload?.query?.share_from_page || eventPage(event)
    if (trace) {
      trace.open_count += 1
      if (userId) trace.opener_users.add(userId)
      if (!trace.shared_page && sharedFromPage) trace.shared_page = sharedFromPage
      if (!trace.first_open_at) trace.first_open_at = timeIso
    }
    increment(shareOpenPageCounts, sharedFromPage)
  }

  if (eventType === 'section_view_start' || eventType === 'section_view_end') {
    const stat = getSectionStat(event)
    if (stat) {
      if (eventType === 'section_view_start') stat.starts += 1
      if (eventType === 'section_view_end') {
        stat.ends += 1
        if (validDuration) stat.total_duration_ms += duration
      }
      if (userId) stat.users.add(userId)
      if (sessionId) stat.sessions.add(sessionId)
    }
  }

  if (eventType === 'section_toggle') {
    const sectionId = eventSectionId(event)
    const key = `${eventPage(event)}:${sectionId}`
    if (!sectionToggleStats.has(key)) {
      sectionToggleStats.set(key, {
        page: eventPage(event),
        section_id: sectionId,
        section_name: eventSectionName(event),
        opens: 0,
        closes: 0,
        users: new Set()
      })
    }
    const stat = sectionToggleStats.get(key)
    if ((event.action || event.payload?.action) === 'open') stat.opens += 1
    else stat.closes += 1
    if (userId) stat.users.add(userId)
  }

  if (eventType === 'search_submit') {
    const keyword = eventKeyword(event) || '空搜索'
    increment(searchKeywordCounts, keyword)
    addMapSetValue(searchKeywordUsers, keyword, userId)
    if (!eventHasResult(event)) increment(noResultSearchCounts, keyword)
  }

  if (eventType === 'search_result_click') {
    increment(searchClickCounts, eventKeyword(event) || eventTargetName(event) || 'unknown')
  }

  if (eventType === 'content_interaction') {
    const key = `${event.action || event.payload?.action || 'interaction'}:${eventTargetName(event) || eventTargetId(event) || 'unknown'}`
    increment(interactionCounts, key)
    addMapSetValue(interactionUsers, key, userId)
  }

  if (eventType === 'technical_error' || eventType === 'api_request_fail') {
    increment(technicalIssueCounts, eventErrorType(event) || eventType)
    increment(technicalUrlCounts, eventUrl(event) || eventPagePath(event) || eventPage(event))
    if (eventStatusCode(event)) increment(technicalStatusCounts, String(eventStatusCode(event)))
  }

  if (eventType === 'scroll_depth') {
    const threshold = eventScrollThreshold(event)
    if (threshold) {
      const key = `${pagePath || page}:${threshold}`
      if (!scrollDepthStats.has(key)) {
        scrollDepthStats.set(key, {
          page: pagePath || page,
          threshold,
          count: 0,
          users: new Set()
        })
      }
      const stat = scrollDepthStats.get(key)
      stat.count += 1
      if (userId) stat.users.add(userId)
    }
  }

  if (eventType === 'page_view') {
    pageViews.push(event)
    increment(pageCounts, pagePath || 'unknown')
    addPageUser(pagePath || 'unknown', userId)
    if (isCasesV2Page(event) && userId) casePageUsers.add(userId)
  }

  if (eventType === 'page_leave' && validDuration) {
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
    const exits = exitPageCounts.get(page) || 0
    return {
      page,
      page_path: page.startsWith('/') ? page : '',
      pv,
      uv: pageUsers.get(page)?.size || 0,
      avg_duration_ms: duration ? Math.round(duration.total / duration.count) : 0,
      exits,
      exit_rate: pv ? Number((exits / pv).toFixed(4)) : 0
    }
  })
  .sort((a, b) => b.pv - a.pv)

const sessionDetails = Array.from(sessionStats.values())
  .map((item) => {
    const durationMs = item.total_page_duration_ms || Math.max(0, (item.end_ts || 0) - (item.start_ts || 0))
    const eventsSorted = item.events
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    return {
      session_id: item.session_id,
      anonymous_user_id: item.anonymous_user_id,
      started_at: item.started_at,
      ended_at: item.ended_at,
      duration_ms: durationMs,
      entry_page: item.entry_page,
      exit_page: item.exit_page,
      page_view_count: item.page_view_count,
      event_count: item.event_count,
      page_count: item.pages.size,
      pages: Array.from(item.pages).slice(0, 20),
      device_model: item.device_model,
      platform: item.platform,
      share_attempts: item.share_attempts,
      share_opens: item.share_opens,
      contact_clicks: item.contact_clicks,
      lead_submits: item.lead_submits,
      events: eventsSorted
    }
  })
  .sort((a, b) => new Date(b.ended_at || b.started_at).getTime() - new Date(a.ended_at || a.started_at).getTime())

const userJourneys = Array.from(userStats.values())
  .map((item) => {
    const score = item.lead_submits * 100 +
      item.contact_clicks * 30 +
      item.case_detail_opens * 10 +
      item.share_attempts * 8 +
      item.page_view_count
    return {
      anonymous_user_id: item.anonymous_user_id,
      first_seen_at: item.first_seen_at,
      last_seen_at: item.last_seen_at,
      session_count: item.session_ids.size,
      visit_days: item.visit_days.size,
      event_count: item.event_count,
      page_view_count: item.page_view_count,
      page_count: item.pages.size,
      visit_times: Array.from(item.visit_times)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
      total_page_duration_ms: item.total_page_duration_ms,
      devices: Array.from(item.devices),
      platforms: Array.from(item.platforms),
      pages: Array.from(item.pages).slice(0, 20),
      share_attempts: item.share_attempts,
      share_opens: item.share_opens,
      contact_clicks: item.contact_clicks,
      lead_submits: item.lead_submits,
      case_detail_opens: item.case_detail_opens,
      intent_score: score
    }
  })
  .sort((a, b) => b.intent_score - a.intent_score || new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime())

userJourneys.forEach((item) => {
  if (item.session_count >= 2 || item.visit_days >= 2) returningUserIds.add(item.anonymous_user_id)
})

const shareTraceSummary = Array.from(shareTraces.values())
  .map((item) => ({
    share_trace_id: item.share_trace_id,
    attempt_count: item.attempt_count,
    open_count: item.open_count,
    shared_page: item.shared_page,
    shared_path: item.shared_path,
    sharer_user_id: item.sharer_user_id,
    opener_uv: item.opener_users.size,
    first_attempt_at: item.first_attempt_at,
    first_open_at: item.first_open_at
  }))
  .sort((a, b) => b.open_count - a.open_count || b.attempt_count - a.attempt_count)

const devices = {
  top_models: topEntries(deviceModelCounts, 20),
  platforms: topEntries(platformCounts, 12),
  os: topEntries(osCounts, 12)
}

const share = {
  attempts: eventCounts.get('share_attempt') || 0,
  opens: eventCounts.get('share_open') || 0,
  attempt_pages: topEntries(shareAttemptPageCounts, 20),
  open_pages: topEntries(shareOpenPageCounts, 20),
  traces: shareTraceSummary.slice(0, 50)
}

const user_behavior = {
  users: userJourneys,
  sessions: sessionDetails,
  recent_sessions: sessionDetails.slice(0, 20),
  high_intent_users: userJourneys.slice(0, 20),
  high_intent_unconverted_users: userJourneys
    .filter(item => !item.lead_submits && (item.contact_clicks || item.case_detail_opens >= 2 || item.total_page_duration_ms >= 90 * 1000))
    .slice(0, 30)
}

const sections = {
  top_sections: Array.from(sectionStats.values())
    .map((item) => ({
      page: item.page,
      section_id: item.section_id,
      section_name: item.section_name,
      starts: item.starts,
      ends: item.ends,
      uv: item.users.size,
      sessions: item.sessions.size,
      total_duration_ms: item.total_duration_ms,
      avg_duration_ms: item.ends ? Math.round(item.total_duration_ms / item.ends) : 0
    }))
    .sort((a, b) => b.avg_duration_ms - a.avg_duration_ms || b.starts - a.starts)
    .slice(0, 80),
  toggles: Array.from(sectionToggleStats.values())
    .map((item) => ({
      page: item.page,
      section_id: item.section_id,
      section_name: item.section_name,
      opens: item.opens,
      closes: item.closes,
      uv: item.users.size
    }))
    .sort((a, b) => b.opens - a.opens || b.uv - a.uv)
    .slice(0, 50)
}

const scroll_depth = {
  by_page: Array.from(scrollDepthStats.values())
    .map((item) => ({
      page: item.page,
      threshold: item.threshold,
      count: item.count,
      uv: item.users.size
    }))
    .sort((a, b) => String(a.page).localeCompare(String(b.page)) || a.threshold - b.threshold)
}

sessionDetails.forEach((session) => {
  increment(entryPageCounts, session.entry_page || 'unknown')
  increment(exitPageCounts, session.exit_page || 'unknown')
  const viewedPages = (session.events || [])
    .filter(event => event.event_type === 'page_view')
    .map(event => event.page_path || event.page)
    .filter(Boolean)
  for (let i = 1; i < viewedPages.length; i += 1) {
    const from = viewedPages[i - 1]
    const to = viewedPages[i]
    if (from && to && from !== to) increment(transitionCounts, `${from} → ${to}`)
  }

  const viewedSections = (session.events || [])
    .filter(event => event.event_type === 'section_view_start')
    .map(event => event.target_name || event.target_id || event.position)
    .filter(Boolean)
  for (let i = 1; i < viewedSections.length; i += 1) {
    const from = viewedSections[i - 1]
    const to = viewedSections[i]
    if (from && to && from !== to) increment(sectionTransitionCounts, `${from} → ${to}`)
  }
})

const pagesWithExit = Array.from(pageCounts.entries())
  .map(([page, pv]) => {
    const duration = pageDurations.get(page)
    const exits = exitPageCounts.get(page) || 0
    return {
      page,
      page_path: page.startsWith('/') ? page : '',
      pv,
      uv: pageUsers.get(page)?.size || 0,
      avg_duration_ms: duration ? Math.round(duration.total / duration.count) : 0,
      exits,
      exit_rate: pv ? Number((exits / pv).toFixed(4)) : 0
    }
  })
  .sort((a, b) => b.pv - a.pv)

events.forEach((event) => {
  const date = eventTime(event)
  if (!date) return
  increment(hourlyCounts, String(date.getHours()).padStart(2, '0'))
  increment(weekdayCounts, String(date.getDay()))
})

const retention = {
  total_users: userJourneys.length,
  users_visited_2plus_days: userJourneys.filter(item => item.visit_days >= 2).length,
  users_visited_3plus_sessions: userJourneys.filter(item => item.session_count >= 3).length,
  users_visited_7plus_sessions: userJourneys.filter(item => item.session_count >= 7).length,
  users_visited_30plus_sessions: userJourneys.filter(item => item.session_count >= 30).length
}

const navigation = {
  entry_pages: topEntries(entryPageCounts, 20),
  exit_pages: topEntries(exitPageCounts, 20),
  page_transitions: topEntries(transitionCounts, 30),
  section_transitions: topEntries(sectionTransitionCounts, 30)
}

const time_distribution = {
  by_hour: topEntries(hourlyCounts, 24).sort((a, b) => Number(a.name) - Number(b.name)),
  by_weekday: topEntries(weekdayCounts, 7).sort((a, b) => Number(a.name) - Number(b.name))
}

const totalUserCount = users.size
const totalSessionCount = sessions.size
const totalSessionDurationMs = sessionDetails.reduce((sum, item) => sum + (item.duration_ms || 0), 0)
const bounceSessions = sessionDetails.filter(item => item.page_view_count <= 1).length
const newUserCount = newUserIds.size
const returningUserCount = Math.max(0, totalUserCount - newUserCount)

const overview = {
  uv: totalUserCount,
  pv: pageViews.length,
  sessions: totalSessionCount,
  new_users: newUserCount,
  returning_users: returningUserCount,
  avg_sessions_per_user: totalUserCount ? Number((totalSessionCount / totalUserCount).toFixed(2)) : 0,
  avg_page_views_per_user: totalUserCount ? Number((pageViews.length / totalUserCount).toFixed(2)) : 0,
  avg_session_duration_ms: totalSessionCount ? Math.round(totalSessionDurationMs / totalSessionCount) : 0,
  avg_user_duration_ms: totalUserCount ? Math.round(totalSessionDurationMs / totalUserCount) : 0,
  bounce_sessions: bounceSessions,
  bounce_rate: totalSessionCount ? Number((bounceSessions / totalSessionCount).toFixed(4)) : 0
}

const source_analysis = {
  channels: Array.from(sourceChannelCounts.entries())
    .map(([channel, count]) => {
      const uv = sourceChannelUsers.get(channel)?.size || 0
      const sessionCount = sourceChannelSessions.get(channel)?.size || 0
      const contacts = sourceChannelContacts.get(channel) || 0
      const leadsCount = sourceChannelLeads.get(channel) || 0
      return {
        channel,
        count,
        uv,
        sessions: sessionCount,
        contact_clicks: contacts,
        lead_submits: leadsCount,
        contact_rate: uv ? Number((contacts / uv).toFixed(4)) : 0,
        lead_rate: uv ? Number((leadsCount / uv).toFixed(4)) : 0
      }
    })
    .sort((a, b) => b.uv - a.uv || b.count - a.count)
}

const searchSubmitCount = eventCounts.get('search_submit') || 0
const searchClickCount = eventCounts.get('search_result_click') || 0
const search_analysis = {
  total_searches: searchSubmitCount,
  result_clicks: searchClickCount,
  click_through_rate: searchSubmitCount ? Number((searchClickCount / searchSubmitCount).toFixed(4)) : 0,
  top_keywords: Array.from(searchKeywordCounts.entries())
    .map(([keyword, count]) => ({
      keyword,
      count,
      uv: searchKeywordUsers.get(keyword)?.size || 0,
      result_clicks: searchClickCounts.get(keyword) || 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50),
  no_result_keywords: topEntries(noResultSearchCounts, 50).map(item => ({
    keyword: item.name,
    count: item.count
  }))
}

const interactions = {
  total: eventCounts.get('content_interaction') || 0,
  top_actions: Array.from(interactionCounts.entries())
    .map(([key, count]) => ({
      key,
      action: key.split(':')[0] || '',
      target_name: key.split(':').slice(1).join(':') || '',
      count,
      uv: interactionUsers.get(key)?.size || 0
    }))
    .sort((a, b) => b.count - a.count || b.uv - a.uv)
    .slice(0, 50),
  contact_clicks: eventCounts.get('contact_click') || 0,
  lead_submits: eventCounts.get('lead_submit') || 0,
  share_attempts: eventCounts.get('share_attempt') || 0
}

const technical = {
  total_issues: (eventCounts.get('technical_error') || 0) + (eventCounts.get('api_request_fail') || 0),
  api_failures: eventCounts.get('api_request_fail') || 0,
  page_errors: eventCounts.get('technical_error') || 0,
  by_type: topEntries(technicalIssueCounts, 50).map(item => ({ type: item.name, count: item.count })),
  by_url: topEntries(technicalUrlCounts, 50).map(item => ({ url: item.name, count: item.count })),
  by_status: topEntries(technicalStatusCounts, 20).map(item => ({ status_code: item.name, count: item.count }))
}

const userSessionDays = new Map()
sessionDetails.forEach((session) => {
  const userId = session.anonymous_user_id
  const day = session.started_at ? new Date(session.started_at).toISOString().slice(0, 10) : ''
  if (!userId || !day) return
  if (!userSessionDays.has(userId)) userSessionDays.set(userId, new Set())
  userSessionDays.get(userId).add(day)
})

let d1Base = 0
let d1Retained = 0
let d7Base = 0
let d7Retained = 0
let d30Base = 0
let d30Retained = 0
userSessionDays.forEach((daysSet) => {
  const days = Array.from(daysSet).sort()
  const first = days[0]
  if (!first) return
  const firstTime = new Date(`${first}T00:00:00.000Z`).getTime()
  const offsets = days.map(day => Math.round((new Date(`${day}T00:00:00.000Z`).getTime() - firstTime) / 86400000))
  d1Base += 1
  d7Base += 1
  d30Base += 1
  if (offsets.includes(1)) d1Retained += 1
  if (offsets.some(offset => offset >= 1 && offset <= 7)) d7Retained += 1
  if (offsets.some(offset => offset >= 1 && offset <= 30)) d30Retained += 1
})

const retention_cohorts = {
  next_day: {
    base_users: d1Base,
    retained_users: d1Retained,
    retention_rate: d1Base ? Number((d1Retained / d1Base).toFixed(4)) : 0
  },
  seven_day: {
    base_users: d7Base,
    retained_users: d7Retained,
    retention_rate: d7Base ? Number((d7Retained / d7Base).toFixed(4)) : 0
  },
  thirty_day: {
    base_users: d30Base,
    retained_users: d30Retained,
    retention_rate: d30Base ? Number((d30Retained / d30Base).toFixed(4)) : 0
  }
}

const recent_events = events
  .slice()
  .sort((a, b) => eventTimestamp(b) - eventTimestamp(a))
  .slice(0, eventSampleLimit)
  .map(eventPreview)

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

const userHasEvent = (userId, types) =>
  events.some(event => eventUserId(event) === userId && types.includes(event.event_type || ''))

const userViewedPage = (userId, predicate) =>
  pageViews.some(event => eventUserId(event) === userId && predicate(event))

const dropoffs = {
  assessment_started_not_finished: Array.from(eventUserSet(assessmentStartEvents))
    .filter(userId => !userHasEvent(userId, ['assessment_finish', 'finish_assessment']))
    .slice(0, 50),
  assessment_finished_not_result: Array.from(eventUserSet(assessmentFinishEvents))
    .filter(userId => !userHasEvent(userId, ['recommendation_view', 'recommendation_generated']) && !userViewedPage(userId, isResultPage))
    .slice(0, 50),
  result_view_no_contact: Array.from(eventUserSet(resultPageViews))
    .filter(userId => !userHasEvent(userId, ['contact_click', 'lead_submit']))
    .slice(0, 50),
  contact_click_no_lead: Array.from(eventUserSet(events.filter(event => event.event_type === 'contact_click')))
    .filter(userId => !userHasEvent(userId, ['lead_submit']))
    .slice(0, 50),
  case_page_no_case_click: Array.from(eventUserSet(casePageViews))
    .filter(userId => !caseClickUsers.has(userId))
    .slice(0, 50)
}

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
  overview,
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
  pages: pagesWithExit,
  user_behavior,
  source_analysis,
  share,
  devices,
  sections,
  search_analysis,
  interactions,
  scroll_depth,
  navigation,
  retention,
  retention_cohorts,
  time_distribution,
  technical,
  dropoffs,
  recent_events,
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
