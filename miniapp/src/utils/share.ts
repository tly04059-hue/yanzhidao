import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import { trackShareAttempt } from '@/api/tracking'

type PageShareOptions = {
  title?: string
  path?: string
  imageUrl?: string
  page?: string
}

const DEFAULT_TITLE = '研知道｜川渝在职考研怎么选'
const DEFAULT_PATH = '/pages/index/index'

const buildTimelineQuery = (path: string) => {
  const [, query = ''] = path.split('?')
  return query
}

const randomShareTraceId = () => `share_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

const appendQuery = (path: string, params: Record<string, string>) => {
  const [basePath, query = ''] = path.split('?')
  const queryMap: Record<string, string> = {}
  query.split('&').filter(Boolean).forEach((item) => {
    const [key, value = ''] = item.split('=')
    if (key) queryMap[decodeURIComponent(key)] = decodeURIComponent(value)
  })
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryMap[key] = value
  })
  const nextQuery = Object.entries(queryMap)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
  return nextQuery ? `${basePath}?${nextQuery}` : basePath
}

const inferPageName = (path: string) => {
  if (path.includes('/pages/cases-v2/index')) return 'cases_v2'
  if (path.includes('/pages/result/index')) return 'result'
  if (path.includes('/pages/learn/index')) return 'learn'
  if (path.includes('/pages/test/index')) return 'test'
  if (path.includes('/pages/contact/index')) return 'contact'
  if (path.includes('/pages/index/index')) return 'home'
  return 'unknown'
}

export const usePageShare = (options: PageShareOptions = {}) => {
  const title = options.title || DEFAULT_TITLE
  const path = options.path || DEFAULT_PATH
  const imageUrl = options.imageUrl || ''
  const page = options.page || inferPageName(path)

  const buildSharedPath = (position: string) => {
    const shareTraceId = randomShareTraceId()
    const sharedPath = appendQuery(path, {
      share_trace_id: shareTraceId,
      share_from_page: page
    })
    trackShareAttempt(page, shareTraceId, {
      title,
      position,
      target_path: sharedPath,
      original_path: path
    })
    return {
      shareTraceId,
      sharedPath
    }
  }

  onShow(() => {
    // #ifdef MP-WEIXIN
    const showShareMenu = (uni as any).showShareMenu
    if (typeof showShareMenu === 'function') {
      showShareMenu({
        menus: ['shareAppMessage', 'shareTimeline']
      })
    }
    // #endif
  })

  onShareAppMessage(() => {
    const { sharedPath } = buildSharedPath('share_app_message')
    return {
      title,
      path: sharedPath,
      imageUrl
    }
  })

  onShareTimeline(() => {
    const { sharedPath } = buildSharedPath('share_timeline')
    return {
      title,
      query: buildTimelineQuery(sharedPath),
      imageUrl
    }
  })
}
