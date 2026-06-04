import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'

type PageShareOptions = {
  title?: string
  path?: string
  imageUrl?: string
}

const DEFAULT_TITLE = '研知道｜川渝在职考研怎么选'
const DEFAULT_PATH = '/pages/index/index'

const buildTimelineQuery = (path: string) => {
  const [, query = ''] = path.split('?')
  return query
}

export const usePageShare = (options: PageShareOptions = {}) => {
  const title = options.title || DEFAULT_TITLE
  const path = options.path || DEFAULT_PATH
  const imageUrl = options.imageUrl || ''

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

  onShareAppMessage(() => ({
    title,
    path,
    imageUrl
  }))

  onShareTimeline(() => ({
    title,
    query: buildTimelineQuery(path),
    imageUrl
  }))
}
