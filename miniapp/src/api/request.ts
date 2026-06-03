// API 基础地址
const IS_PROD = import.meta.env.PROD || import.meta.env.MODE === 'production'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || (IS_PROD ? 'https://yanzhidao.com/api' : 'http://127.0.0.1:8010/api')
const ANALYTICS_BASE_URL = import.meta.env.VITE_ANALYTICS_BASE_URL || ''
const ENABLE_LOCAL_ANALYTICS_ENV = String(import.meta.env.VITE_ENABLE_LOCAL_ANALYTICS || '').toLowerCase() === 'true'
const IS_LOCAL_API = /\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(BASE_URL)
const LOCAL_ANALYTICS_SWITCH_KEY = 'yz_enable_local_analytics'

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
    id = uni.getStorageSync(key)
    if (!id) {
      id = `yz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      uni.setStorageSync(key, id)
    }
  } catch (error) {
    id = `yz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
  return id
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
  if (!IS_PROD && IS_LOCAL_API && !getLocalAnalyticsEnabled()) {
    return Promise.resolve({
      skipped: true,
      reason: 'local-api-disabled',
      event_type
    })
  }
  return analyticsApi.track({
    event_type,
    session_id: getAnalyticsSessionId(),
    target_type: payload.target_type,
    target_id: payload.target_id,
    target_name: payload.target_name,
    payload
  }).catch((error) => {
    if (!IS_PROD) console.warn('埋点失败:', event_type, error)
  })
}
