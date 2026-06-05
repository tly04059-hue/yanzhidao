import { trackEvent } from './request'

type CommonPayload = Record<string, any>

type PageVisitState = {
  page: string
  page_path: string
  started_at: number
  source: string
}

let currentPageVisit: PageVisitState | null = null
let appVisibleStartedAt = 0
let lastShareOpenTraceId = ''

const getCurrentRoute = () => {
  try {
    const pages = getCurrentPages()
    const current = pages[pages.length - 1]
    return current?.route ? `/${current.route}` : ''
  } catch (error) {
    return ''
  }
}

const getLaunchQuery = (options: any = {}) => {
  const query = options.query || options.referrerInfo?.extraData || {}
  return query && typeof query === 'object' ? query : {}
}

const getShareTraceId = (options: any = {}) => {
  const query = getLaunchQuery(options)
  return String(query.share_trace_id || query.shareTraceId || '')
}

const leaveCurrentPage = (reason: string, extra: CommonPayload = {}) => {
  if (!currentPageVisit) return Promise.resolve({ skipped: true, reason: 'no-current-page' })
  const now = Date.now()
  const durationMs = Math.max(0, now - currentPageVisit.started_at)
  const pageVisit = currentPageVisit
  currentPageVisit = null

  return trackEvent('page_leave', {
    target_type: 'page',
    target_name: pageVisit.page,
    page: pageVisit.page,
    page_path: pageVisit.page_path,
    route: pageVisit.page_path,
    source: pageVisit.source,
    position: reason,
    leave_reason: reason,
    duration_ms: durationMs,
    started_at: new Date(pageVisit.started_at).toISOString(),
    ended_at: new Date(now).toISOString(),
    ...extra
  })
}

const getScene = () => {
  try {
    // mp-weixin: 优先取进入场景码
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wxAny = (globalThis as any).wx
    if (wxAny?.getEnterOptionsSync) {
      const options = wxAny.getEnterOptionsSync() || {}
      return String(options.scene || 'unknown')
    }
    // 兜底：uni launch options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniAny = uni as any
    if (uniAny?.getLaunchOptionsSync) {
      const options = uniAny.getLaunchOptionsSync() || {}
      return String(options.scene || 'unknown')
    }
    return 'unknown'
  } catch (error) {
    return 'unknown'
  }
}

export const trackPageView = (page: string, source = 'direct', extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  if (currentPageVisit && currentPageVisit.page_path !== route) {
    leaveCurrentPage('navigate', {
      next_page: page,
      next_page_path: route
    })
  }
  currentPageVisit = {
    page,
    page_path: route,
    started_at: Date.now(),
    source
  }
  return trackEvent('page_view', {
    target_type: 'page',
    target_name: page,
    page,
    source,
    route,
    scene,
    version: 'v6',
    ...extra
  })
}

export const trackPageLeave = (reason = 'manual', extra: CommonPayload = {}) =>
  leaveCurrentPage(reason, extra)

export const trackAppLaunch = (options: any = {}) => {
  const scene = String(options.scene || getScene())
  const shareTraceId = getShareTraceId(options)
  return trackEvent('app_launch', {
    target_type: 'app',
    target_id: 'miniapp',
    target_name: '研知道小程序',
    page: 'app',
    page_path: '/app',
    source: 'app',
    position: 'launch',
    route: getCurrentRoute() || '/app',
    scene,
    launch_path: options.path ? `/${options.path}` : '',
    launch_query: getLaunchQuery(options),
    referrer_share_trace_id: shareTraceId
  })
}

export const trackAppShow = (options: any = {}) => {
  appVisibleStartedAt = Date.now()
  const scene = String(options.scene || getScene())
  const shareTraceId = getShareTraceId(options)
  if (shareTraceId && shareTraceId !== lastShareOpenTraceId) {
    lastShareOpenTraceId = shareTraceId
    trackShareOpen({
      referrer_share_trace_id: shareTraceId,
      scene,
      route: options.path ? `/${options.path}` : getCurrentRoute(),
      query: getLaunchQuery(options)
    })
  }
  return trackEvent('app_show', {
    target_type: 'app',
    target_id: 'miniapp',
    target_name: '研知道小程序',
    page: 'app',
    page_path: '/app',
    source: 'app',
    position: 'show',
    route: getCurrentRoute() || '/app',
    scene,
    launch_path: options.path ? `/${options.path}` : '',
    launch_query: getLaunchQuery(options),
    referrer_share_trace_id: shareTraceId
  })
}

export const trackAppHide = (extra: CommonPayload = {}) => {
  const now = Date.now()
  const durationMs = appVisibleStartedAt ? Math.max(0, now - appVisibleStartedAt) : 0
  leaveCurrentPage('app_hide')
  return trackEvent('app_hide', {
    target_type: 'app',
    target_id: 'miniapp',
    target_name: '研知道小程序',
    page: 'app',
    page_path: '/app',
    source: 'app',
    position: 'hide',
    route: getCurrentRoute() || '/app',
    scene: getScene(),
    duration_ms: durationMs,
    started_at: appVisibleStartedAt ? new Date(appVisibleStartedAt).toISOString() : '',
    ended_at: new Date(now).toISOString(),
    ...extra
  })
}

export const trackNavClick = (page: string, position: string, route = '', extra: CommonPayload = {}) => {
  const from_route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('nav_click', {
    target_type: 'page',
    target_name: page,
    page,
    source: page,
    position,
    route,
    from_route,
    scene,
    ...extra
  })
}

export const trackTabClick = (page: string, tab: string, route = '', extra: CommonPayload = {}) => {
  const from_route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('tab_click', {
    target_type: 'page',
    target_name: page,
    page,
    source: page,
    tab,
    position: 'tabbar',
    route,
    from_route,
    scene,
    ...extra
  })
}

export const trackCtaClick = (page: string, position: string, label = '', route = '', extra: CommonPayload = {}) => {
  const from_route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('cta_click', {
    target_type: 'page',
    target_name: page,
    page,
    source: page,
    position,
    label,
    route,
    from_route,
    scene,
    ...extra
  })
}

export const trackAssessmentStart = (page = 'test', extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('assessment_start', {
    target_type: 'assessment',
    target_id: extra.target_id || 'main_quiz',
    target_name: extra.target_name || '测一测',
    page,
    source: page,
    position: extra.position || 'assessment_start',
    route,
    scene,
    ...extra
  })
}

export const trackAssessmentFinish = (page = 'test', extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('assessment_finish', {
    target_type: 'assessment',
    target_id: extra.target_id || 'main_quiz',
    target_name: extra.target_name || '测一测',
    page,
    source: page,
    position: extra.position || 'assessment_finish',
    route,
    scene,
    ...extra
  })
}

export const trackRecommendationView = (page = 'result', extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('recommendation_view', {
    target_type: 'strategy',
    target_id: extra.target_id || extra.strategy_id || 'result_recommendation',
    target_name: extra.target_name || extra.recommendation_title || '选校方向建议',
    page,
    source: page,
    position: extra.position || 'result_view',
    route,
    scene,
    ...extra
  })
}

export const trackContactClick = (page: string, position: string, label = '联系顾问', route = '', extra: CommonPayload = {}) => {
  const from_route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('contact_click', {
    target_type: 'contact',
    target_id: extra.target_id || position,
    target_name: extra.target_name || label,
    page,
    source: page,
    position,
    label,
    route,
    from_route,
    scene,
    ...extra
  })
}

export const trackLeadSubmit = (page: string, leadId = '', extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('lead_submit', {
    target_type: 'lead',
    target_id: leadId || extra.target_id || 'lead_pending',
    target_name: extra.target_name || '用户留资',
    page,
    source: page,
    position: extra.position || 'lead_submit',
    route,
    scene,
    ...extra
  })
}

export const trackModalOpen = (page: string, modal_type: string, extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('modal_open', {
    target_type: extra.target_type || 'case',
    target_id: extra.target_id,
    target_name: extra.target_name,
    page,
    source: page,
    position: extra.position || modal_type,
    route,
    scene,
    modal_type,
    ...extra
  })
}

export const trackModalClose = (page: string, modal_type: string, extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('modal_close', {
    target_type: extra.target_type || 'case',
    target_id: extra.target_id,
    target_name: extra.target_name,
    page,
    source: page,
    position: extra.position || modal_type,
    route,
    scene,
    modal_type,
    ...extra
  })
}

export const trackCaseCardClick = (page: string, caseId: string, caseName: string, extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('case_card_click', {
    target_type: 'case',
    target_id: caseId,
    target_name: caseName,
    page,
    source: page,
    position: extra.position || 'case_card',
    route,
    scene,
    ...extra
  })
}

export const trackCaseFilterChange = (page: string, filterKey: string, filterValue: string, extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('filter_case_list', {
    target_type: 'case',
    target_name: page,
    page,
    source: page,
    position: extra.position || 'case_filter',
    route,
    scene,
    filter_key: filterKey,
    filter_value: filterValue,
    ...extra
  })
}

export const trackCaseListLoadMore = (page: string, extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('case_list_load_more', {
    target_type: 'case',
    target_name: page,
    page,
    source: page,
    position: extra.position || 'load_more',
    route,
    scene,
    ...extra
  })
}

export const trackShareAttempt = (page: string, shareTraceId: string, extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('share_attempt', {
    target_type: 'share',
    target_id: shareTraceId,
    target_name: extra.title || page,
    page,
    page_path: route,
    source: page,
    position: extra.position || 'share_app_message',
    route,
    scene,
    share_trace_id: shareTraceId,
    ...extra
  })
}

export const trackShareOpen = (extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  const referrerShareTraceId = String(extra.referrer_share_trace_id || '')
  return trackEvent('share_open', {
    target_type: 'share',
    target_id: referrerShareTraceId || 'unknown_share',
    target_name: extra.target_name || '分享打开',
    page: extra.page || 'app',
    page_path: route || extra.route || '/app',
    source: 'share',
    position: 'share_open',
    route: route || extra.route || '',
    scene,
    referrer_share_trace_id: referrerShareTraceId,
    ...extra
  })
}

export const trackSectionViewStart = (page: string, sectionId: string, sectionName = '', extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('section_view_start', {
    target_type: 'section',
    target_id: sectionId,
    target_name: sectionName || sectionId,
    page,
    source: page,
    position: extra.position || sectionId,
    route,
    scene,
    section_id: sectionId,
    section_name: sectionName || sectionId,
    ...extra
  })
}

export const trackSectionViewEnd = (page: string, sectionId: string, sectionName = '', extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('section_view_end', {
    target_type: 'section',
    target_id: sectionId,
    target_name: sectionName || sectionId,
    page,
    source: page,
    position: extra.position || sectionId,
    route,
    scene,
    section_id: sectionId,
    section_name: sectionName || sectionId,
    ...extra
  })
}

export const trackScrollDepth = (page: string, threshold: number, extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('scroll_depth', {
    target_type: 'page',
    target_id: `${page}_${threshold}`,
    target_name: `${page} ${threshold}%`,
    page,
    source: page,
    position: `${threshold}%`,
    route,
    scene,
    scroll_threshold: threshold,
    ...extra
  })
}

export const trackSectionToggle = (page: string, sectionId: string, open: boolean, extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('section_toggle', {
    target_type: 'section',
    target_id: sectionId,
    target_name: extra.section_name || sectionId,
    page,
    source: page,
    position: sectionId,
    route,
    scene,
    section_id: sectionId,
    section_name: extra.section_name || sectionId,
    action: open ? 'open' : 'close',
    ...extra
  })
}

export const trackSearch = (page: string, keyword: string, resultCount = 0, extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('search_submit', {
    target_type: 'search',
    target_id: keyword || 'empty_keyword',
    target_name: keyword || '空搜索',
    page,
    source: page,
    position: extra.position || 'search_box',
    route,
    scene,
    keyword,
    result_count: resultCount,
    has_result: resultCount > 0,
    ...extra
  })
}

export const trackSearchResultClick = (page: string, keyword: string, targetId: string, targetName = '', extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('search_result_click', {
    target_type: extra.target_type || 'search_result',
    target_id: targetId,
    target_name: targetName || targetId,
    page,
    source: page,
    position: extra.position || 'search_result',
    route,
    scene,
    keyword,
    ...extra
  })
}

export const trackContentInteraction = (page: string, action: string, targetId: string, targetName = '', extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('content_interaction', {
    target_type: extra.target_type || 'content',
    target_id: targetId,
    target_name: targetName || targetId,
    page,
    source: page,
    position: extra.position || action,
    route,
    scene,
    action,
    ...extra
  })
}

export const trackTechnicalError = (page: string, errorType: string, message = '', extra: CommonPayload = {}) => {
  const route = getCurrentRoute()
  const scene = getScene()
  return trackEvent('technical_error', {
    target_type: 'technical',
    target_id: extra.target_id || errorType,
    target_name: message || errorType,
    page,
    source: 'technical_monitor',
    position: errorType,
    route,
    scene,
    error_type: errorType,
    err_msg: message,
    ...extra
  })
}

export const buildBizTrackPayload = (source: string, position: string, route = '', extra: CommonPayload = {}) => {
  const scene = getScene()
  return {
    source,
    position,
    route,
    scene,
    ...extra
  }
}
