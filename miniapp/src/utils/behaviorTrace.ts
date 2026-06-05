import { nextTick, onMounted, onUnmounted } from 'vue'
import { onHide, onPageScroll, onUnload } from '@dcloudio/uni-app'
import {
  trackPageLeave,
  trackScrollDepth,
  trackSectionViewEnd,
  trackSectionViewStart
} from '@/api/tracking'

type SectionConfig = {
  id: string
  name: string
}

type ActiveSection = {
  id: string
  name: string
  startedAt: number
}

type BehaviorTraceOptions = {
  sections?: SectionConfig[]
  sectionSelector?: string
  contentSelector?: string
}

const DEFAULT_THRESHOLDS = [25, 50, 75, 90, 100]

const getWindowHeight = () => {
  try {
    const uniAny = uni as any
    if (typeof uniAny.getWindowInfo === 'function') {
      return Number(uniAny.getWindowInfo()?.windowHeight || 0)
    }
    return Number(uni.getSystemInfoSync()?.windowHeight || 0)
  } catch (error) {
    return 0
  }
}

const nowIso = (timestamp: number) => new Date(timestamp).toISOString()

export const useBehaviorTrace = (page: string, options: BehaviorTraceOptions = {}) => {
  const sectionSelector = options.sectionSelector || '.js-track-section'
  const contentSelector = options.contentSelector || '.v6-page'
  const sectionNames = new Map((options.sections || []).map(item => [item.id, item.name]))
  const activeSections = new Map<string, ActiveSection>()
  const reachedDepth = new Set<number>()
  let lastScrollTop = 0
  let lastSampleAt = 0
  let disposed = false
  let mountedSampleTimer: ReturnType<typeof setTimeout> | null = null

  const endSection = (sectionId: string, reason: string) => {
    const section = activeSections.get(sectionId)
    if (!section) return
    activeSections.delete(sectionId)
    const endedAt = Date.now()
    trackSectionViewEnd(page, section.id, section.name, {
      duration_ms: Math.max(0, endedAt - section.startedAt),
      started_at: nowIso(section.startedAt),
      ended_at: nowIso(endedAt),
      scroll_top: lastScrollTop,
      leave_reason: reason
    })
  }

  const flushSections = (reason: string) => {
    Array.from(activeSections.keys()).forEach(sectionId => endSection(sectionId, reason))
  }

  const startSection = (sectionId: string, sectionName: string) => {
    if (activeSections.has(sectionId)) return
    const startedAt = Date.now()
    activeSections.set(sectionId, {
      id: sectionId,
      name: sectionName,
      startedAt
    })
    trackSectionViewStart(page, sectionId, sectionName, {
      started_at: nowIso(startedAt),
      scroll_top: lastScrollTop
    })
  }

  const sampleSections = () => {
    if (disposed) return
    const viewportHeight = getWindowHeight()
    if (!viewportHeight) return

    uni.createSelectorQuery()
      .selectAll(sectionSelector)
      .boundingClientRect((rects) => {
        if (disposed) return
        const visibleIds = new Set<string>()
        const items = Array.isArray(rects) ? rects : []

        items.forEach((rect: any) => {
          const sectionId = String(rect?.id || '')
          if (!sectionId) return
          const isVisible = Number(rect.top) < viewportHeight * 0.82 && Number(rect.bottom) > viewportHeight * 0.18
          if (!isVisible) return
          visibleIds.add(sectionId)
          startSection(sectionId, sectionNames.get(sectionId) || sectionId)
        })

        Array.from(activeSections.keys()).forEach(sectionId => {
          if (!visibleIds.has(sectionId)) endSection(sectionId, 'out_of_view')
        })
      })
      .exec()
  }

  const sampleScrollDepth = (scrollTop: number) => {
    const viewportHeight = getWindowHeight()
    if (!viewportHeight) return
    uni.createSelectorQuery()
      .select(contentSelector)
      .boundingClientRect((rect: any) => {
        if (disposed) return
        const contentHeight = Number(rect?.height || 0)
        if (!contentHeight) return
        const depth = Math.min(100, Math.round(((scrollTop + viewportHeight) / contentHeight) * 100))
        DEFAULT_THRESHOLDS.forEach(threshold => {
          if (depth >= threshold && !reachedDepth.has(threshold)) {
            reachedDepth.add(threshold)
            trackScrollDepth(page, threshold, {
              scroll_depth: depth,
              scroll_top: scrollTop,
              viewport_height: viewportHeight,
              content_height: contentHeight
            })
          }
        })
      })
      .exec()
  }

  const sample = (scrollTop = lastScrollTop, force = false) => {
    if (disposed) return
    const current = Date.now()
    if (!force && current - lastSampleAt < 350) return
    lastSampleAt = current
    lastScrollTop = scrollTop
    sampleSections()
    sampleScrollDepth(scrollTop)
  }

  onMounted(() => {
    nextTick(() => {
      sample(0, true)
      mountedSampleTimer = setTimeout(() => sample(0, true), 600)
    })
  })

  onPageScroll((event) => {
    sample(Number(event.scrollTop || 0))
  })

  onHide(() => {
    flushSections('page_hide')
    trackPageLeave('page_hide')
  })

  onUnload(() => {
    flushSections('page_unload')
    trackPageLeave('page_unload')
  })

  onUnmounted(() => {
    disposed = true
    if (mountedSampleTimer) {
      clearTimeout(mountedSampleTimer)
      mountedSampleTimer = null
    }
    flushSections('component_unmounted')
  })
}
