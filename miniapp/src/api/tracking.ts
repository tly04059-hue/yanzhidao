import { trackEvent } from './request'

type CommonPayload = Record<string, any>

const getCurrentRoute = () => {
  try {
    const pages = getCurrentPages()
    const current = pages[pages.length - 1]
    return current?.route ? `/${current.route}` : ''
  } catch (error) {
    return ''
  }
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
