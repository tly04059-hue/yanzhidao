// API 基础地址
const IS_PROD = import.meta.env.PROD || import.meta.env.MODE === 'production'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || (IS_PROD ? 'https://yanzhidao.com/api' : 'http://127.0.0.1:8010/api')
const ANALYTICS_BASE_URL = import.meta.env.VITE_ANALYTICS_BASE_URL || ''
const normalizeAnalyticsEnv = (value: string) => {
  if (value === 'trial' || value === 'production' || value === 'development') return value
  return IS_PROD ? 'production' : 'development'
}

const ANALYTICS_ENV = normalizeAnalyticsEnv(String(import.meta.env.VITE_ANALYTICS_ENV || ''))
const APP_VERSION = String(import.meta.env.VITE_APP_VERSION || 'v6')
const TRACKING_PLAN_VERSION = String(import.meta.env.VITE_TRACKING_PLAN_VERSION || '2026-06-v1')
const ENABLE_LOCAL_ANALYTICS_ENV = String(import.meta.env.VITE_ENABLE_LOCAL_ANALYTICS || '').toLowerCase() === 'true'
const IS_LOCAL_API = /\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(BASE_URL)
const LOCAL_ANALYTICS_SWITCH_KEY = 'yz_enable_local_analytics'
const ANONYMOUS_USER_KEY = 'yz_anonymous_user_id'
const FIRST_SEEN_KEY = 'yz_first_seen_at'
const VISIT_COUNT_KEY = 'yz_visit_count'
const SESSION_UPDATED_KEY = 'yz_session_updated_at'
const SESSION_TTL_MS = 30 * 60 * 1000

type AnalyticsValidation = {
  is_valid: boolean
  missing_fields: string[]
  warnings: string[]
}

const normalizeRequestError = (error: any, fallbackMessage = 'request:fail') => {
  if (error && typeof error === 'object') {
    return {
      ...error,
      errMsg: typeof error.errMsg === 'string' && error.errMsg ? error.errMsg : fallbackMessage
    }
  }
  return {
    errMsg: fallbackMessage,
    detail: error
  }
}

export const getAnalyticsSessionId = () => {
  const key = 'yz_session_id'
  let id = ''
  try {
    const now = Date.now()
    const updatedAt = Number(uni.getStorageSync(SESSION_UPDATED_KEY) || 0)
    id = uni.getStorageSync(key)
    if (!id || !updatedAt || now - updatedAt > SESSION_TTL_MS) {
      id = `yz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      uni.setStorageSync(key, id)
    }
    uni.setStorageSync(SESSION_UPDATED_KEY, now)
  } catch (error) {
    id = `yz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
  return id
}

const randomId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

export const getAnonymousUserId = () => {
  try {
    let id = uni.getStorageSync(ANONYMOUS_USER_KEY)
    if (!id) {
      id = randomId('anon')
      uni.setStorageSync(ANONYMOUS_USER_KEY, id)
      uni.setStorageSync(FIRST_SEEN_KEY, new Date().toISOString())
      uni.setStorageSync(VISIT_COUNT_KEY, 0)
    }
    return String(id)
  } catch (error) {
    return randomId('anon')
  }
}

const getFirstSeenAt = () => {
  try {
    return String(uni.getStorageSync(FIRST_SEEN_KEY) || '')
  } catch (error) {
    return ''
  }
}

const getVisitCount = () => {
  try {
    const current = Number(uni.getStorageSync(VISIT_COUNT_KEY) || 0)
    const next = current + 1
    uni.setStorageSync(VISIT_COUNT_KEY, next)
    return next
  } catch (error) {
    return 1
  }
}

const getStoredVisitCount = () => {
  try {
    return Number(uni.getStorageSync(VISIT_COUNT_KEY) || 1)
  } catch (error) {
    return 1
  }
}

const getCurrentPagePath = () => {
  try {
    const pages = getCurrentPages()
    const current = pages[pages.length - 1]
    return current?.route ? `/${current.route}` : ''
  } catch (error) {
    return ''
  }
}

const getEventPage = (payload: any, pagePath: string) =>
  String(payload?.page || payload?.target_name || pagePath || 'unknown')

const generateEventId = (eventType: string) =>
  `evt_${eventType}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

const requiresTargetId = (eventType: string, targetType = '') => {
  if (targetType === 'case') {
    return ['case_card_click', 'modal_open', 'modal_close'].includes(eventType)
  }
  if (['school_card_click', 'school_detail_view'].includes(eventType)) return true
  return false
}

const validateAnalyticsEvent = (event: any): AnalyticsValidation => {
  const missingFields: string[] = []
  const warnings: string[] = []
  const requiredFields = [
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

  requiredFields.forEach(field => {
    if (!event[field]) missingFields.push(field)
  })

  if (requiresTargetId(event.event_type, event.target_type) && !event.target_id) {
    missingFields.push('target_id')
  }

  if (!['development', 'trial', 'production'].includes(event.env)) {
    warnings.push(`unknown_env:${event.env}`)
  }

  return {
    is_valid: missingFields.length === 0,
    missing_fields: missingFields,
    warnings
  }
}

const buildAnalyticsEvent = (event_type: string, payload: any = {}) => {
  const now = new Date().toISOString()
  const pagePath = String(payload.page_path || payload.route || getCurrentPagePath() || 'unknown')
  const anonymousUserId = getAnonymousUserId()
  const firstSeenAt = getFirstSeenAt()
  const visitCount = event_type === 'page_view' ? getVisitCount() : getStoredVisitCount()
  const isNewUser = Boolean(firstSeenAt && firstSeenAt.slice(0, 10) === now.slice(0, 10) && visitCount <= 1)
  const page = getEventPage(payload, pagePath)

  const event = {
    event_id: payload.event_id || generateEventId(event_type),
    event_type,
    page,
    page_path: pagePath,
    page_title: payload.page_title || payload.target_name || page,
    anonymous_user_id: anonymousUserId,
    session_id: payload.session_id || getAnalyticsSessionId(),
    target_type: payload.target_type,
    target_id: payload.target_id,
    target_name: payload.target_name,
    source_channel: payload.source_channel || payload.source,
    scene: payload.scene,
    env: ANALYTICS_ENV,
    app_version: APP_VERSION,
    tracking_plan_version: TRACKING_PLAN_VERSION,
    created_at: now,
    is_new_user: isNewUser,
    payload: {
      ...payload,
      page,
      page_path: pagePath,
      app_version: APP_VERSION,
      env: ANALYTICS_ENV,
      tracking_plan_version: TRACKING_PLAN_VERSION
    }
  }
  const validation = validateAnalyticsEvent(event)

  return {
    ...event,
    payload: {
      ...event.payload,
      _validation: validation
    }
  }
}

export const setLocalAnalyticsEnabled = (enabled: boolean) => {
  try {
    uni.setStorageSync(LOCAL_ANALYTICS_SWITCH_KEY, enabled ? '1' : '0')
  } catch (error) {
    // ignore
  }
}

export const getLocalAnalyticsEnabled = () => {
  if (ENABLE_LOCAL_ANALYTICS_ENV) return true
  try {
    return String(uni.getStorageSync(LOCAL_ANALYTICS_SWITCH_KEY) || '') === '1'
  } catch (error) {
    return false
  }
}

// 通用请求函数
export const request = (options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  forceNetwork?: boolean
  baseUrl?: string
}) => {
  return new Promise((resolve, reject) => {
    // In dev mp-weixin preview, backend 127.0.0.1 often times out and pollutes console.
    // We short-circuit to a silent mock response to keep UI验收干净.
    // NEVER short-circuit in production.
    if (!IS_PROD && IS_LOCAL_API && !options.forceNetwork) {
      resolve({
        skipped: true,
        reason: 'local-api-disabled',
        url: options.url,
        data: null
      })
      return
    }

    uni.request({
      url: (options.baseUrl || BASE_URL) + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      timeout: 2500,
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(normalizeRequestError(res, `request:fail statusCode ${res.statusCode || 'unknown'}`))
        }
      },
      fail: (err) => {
        reject(normalizeRequestError(err))
      }
    })
  })
}

// 院校相关 API
export const schoolApi = {
	// 获取院校列表
	getList: (params: {
	  program_type?: string
	  province?: string
	  page?: number
	  page_size?: number
	}) => {
	  // 手动拼接查询字符串
	  const queryParts: string[] = []
	  if (params.program_type) {
		queryParts.push(`program_type=${encodeURIComponent(params.program_type)}`)
	  }
	  if (params.province) {
		queryParts.push(`province=${encodeURIComponent(params.province)}`)
	  }
	  if (params.page) {
		queryParts.push(`page=${params.page}`)
	  }
	  if (params.page_size) {
		queryParts.push(`page_size=${params.page_size}`)
	  }
	  
	  const query = queryParts.length > 0 ? '?' + queryParts.join('&') : ''
	  
	  return request({
		url: `/miniapp/schools${query}`,
		method: 'GET'
	  })
	},
  
  // 获取院校详情
  getDetail: (id: number) => {
    return request({
      url: `/miniapp/schools/${id}`,
      method: 'GET'
    })
  }
}

// 路径对比 API
export const comparisonApi = {
  getData: () => {
    return request({
      url: '/miniapp/path-comparison',
      method: 'GET'
    })
  }
}

// 推荐引擎 API
export const recommendApi = {
  getRecommendation: (answers: any) => {
    return request({
      url: '/miniapp/recommend',
      method: 'POST',
      data: answers
    })
  }
}

// 留资 API
export const leadApi = {
  submit: (payload: any) => {
    return request({
      url: '/miniapp/lead',
      method: 'POST',
      data: payload
    })
  }
}

// 备考时间线 API
export const timelineApi = {
  getData: (pathType: string) => {
    return request({
      url: `/miniapp/timeline/${pathType}`,
      method: 'GET'
    })
  }
}

// 估分 API
export const estimateApi = {
  estimate: (scores: any) => {
    return request({
      url: '/miniapp/score-estimate',
      method: 'POST',
      data: scores
    })
  }
}

export const analyticsApi = {
  track: (payload: any) => {
    const enabledInLocal = getLocalAnalyticsEnabled()
    const canForceNetwork = !IS_LOCAL_API || enabledInLocal
    const finalBaseUrl = ANALYTICS_BASE_URL || BASE_URL
    return request({
      url: '/miniapp/events',
      method: 'POST',
      data: payload,
      forceNetwork: canForceNetwork,
      baseUrl: finalBaseUrl
    })
  },
  feedback: (payload: any) => {
    return request({
      url: '/miniapp/recommendation-feedback',
      method: 'POST',
      data: payload
    })
  },
  getInsights: () => {
    return request({
      url: '/miniapp/flywheel/insights',
      method: 'GET'
    })
  }
}

export const trackEvent = (event_type: string, payload: any = {}) => {
  const event = buildAnalyticsEvent(event_type, payload)
  const validation = event.payload._validation as AnalyticsValidation
  if (!validation.is_valid && !IS_PROD) {
    console.warn('埋点字段校验未通过:', event_type, validation)
  }

  if (!IS_PROD && IS_LOCAL_API && !getLocalAnalyticsEnabled()) {
    return Promise.resolve({
      skipped: true,
      reason: 'local-api-disabled',
      event_type,
      event
    })
  }
  return analyticsApi.track(event).catch((error) => {
    if (!IS_PROD) console.warn('埋点失败:', event_type, error)
  })
}
