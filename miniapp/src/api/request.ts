// API 基础地址
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8010/api'

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

// 通用请求函数
export const request = (options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
}) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
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
          reject(res)
        }
      },
      fail: (err) => {
        reject(err)
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
    return request({
      url: '/miniapp/events',
      method: 'POST',
      data: payload
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
  return analyticsApi.track({
    event_type,
    session_id: getAnalyticsSessionId(),
    target_type: payload.target_type,
    target_id: payload.target_id,
    target_name: payload.target_name,
    payload
  }).catch((error) => {
    console.warn('埋点失败:', event_type, error)
  })
}
