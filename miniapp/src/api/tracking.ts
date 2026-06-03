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
