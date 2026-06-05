const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const ROOT = path.resolve(__dirname, '../../..')
const RUNTIME_DIR = path.join(ROOT, 'schooltool/data/runtime')
const EVENTS_FILE = path.join(RUNTIME_DIR, 'miniapp-events.jsonl')
const PORT = Number(process.env.PORT || 8010)
const MAX_BODY_BYTES = 128 * 1024
const VALID_ENVS = new Set(['development', 'trial', 'production'])

const jsonResponse = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  })
  res.end(JSON.stringify(payload))
}

const normalizeString = value => String(value || '').trim()
const normalizeNumberOrNull = value => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const readBody = req => new Promise((resolve, reject) => {
  const chunks = []
  let size = 0

  req.on('data', chunk => {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      reject(new Error('body_too_large'))
      req.destroy()
      return
    }
    chunks.push(chunk)
  })

  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8')
    if (!raw) {
      resolve({})
      return
    }
    try {
      resolve(JSON.parse(raw))
    } catch (error) {
      reject(new Error('invalid_json'))
    }
  })

  req.on('error', reject)
})

const requiresTargetId = event => {
  if (event.target_type === 'case') {
    return ['case_card_click', 'modal_open', 'modal_close'].includes(event.event_type)
  }
  return ['school_card_click', 'school_detail_view'].includes(event.event_type)
}

const normalizeEvent = raw => {
  const payload = raw && typeof raw.payload === 'object' && raw.payload !== null ? raw.payload : {}
  const event = {
    event_id: normalizeString(raw.event_id) || crypto.randomUUID(),
    event_type: normalizeString(raw.event_type),
    page: normalizeString(raw.page || payload.page || payload.target_name),
    page_path: normalizeString(raw.page_path || payload.page_path || payload.route),
    page_title: normalizeString(raw.page_title || payload.page_title || raw.target_name || payload.target_name),
    anonymous_user_id: normalizeString(raw.anonymous_user_id || payload.anonymous_user_id),
    session_id: normalizeString(raw.session_id || payload.session_id),
    wechat_openid: normalizeString(raw.wechat_openid || payload.wechat_openid) || null,
    is_new_user: typeof raw.is_new_user === 'boolean' ? raw.is_new_user : null,
    is_test_user: Boolean(raw.is_test_user || payload.is_test_user),
    target_type: normalizeString(raw.target_type || payload.target_type),
    target_id: normalizeString(raw.target_id || payload.target_id),
    target_name: normalizeString(raw.target_name || payload.target_name),
    source_channel: normalizeString(raw.source_channel || payload.source_channel || payload.source),
    scene: normalizeString(raw.scene || payload.scene),
    scene_category: normalizeString(raw.scene_category || payload.scene_category),
    duration_ms: Number(raw.duration_ms || payload.duration_ms || 0) || null,
    keyword: normalizeString(raw.keyword || payload.keyword),
    result_count: normalizeNumberOrNull(raw.result_count || payload.result_count),
    has_result: typeof raw.has_result === 'boolean' ? raw.has_result : (typeof payload.has_result === 'boolean' ? payload.has_result : null),
    error_type: normalizeString(raw.error_type || payload.error_type),
    err_msg: normalizeString(raw.err_msg || payload.err_msg),
    status_code: normalizeNumberOrNull(raw.status_code || payload.status_code),
    url: normalizeString(raw.url || payload.url),
    method: normalizeString(raw.method || payload.method),
    share_trace_id: normalizeString(raw.share_trace_id || payload.share_trace_id),
    referrer_share_trace_id: normalizeString(raw.referrer_share_trace_id || payload.referrer_share_trace_id),
    section_id: normalizeString(raw.section_id || payload.section_id),
    section_name: normalizeString(raw.section_name || payload.section_name),
    scroll_threshold: normalizeNumberOrNull(raw.scroll_threshold || payload.scroll_threshold),
    action: normalizeString(raw.action || payload.action),
    device_brand: normalizeString(raw.device_brand || payload.device_brand || payload.device?.device_brand),
    device_model: normalizeString(raw.device_model || payload.device_model || payload.device?.device_model),
    device_type: normalizeString(raw.device_type || payload.device_type || payload.device?.device_type),
    os_name: normalizeString(raw.os_name || payload.os_name || payload.device?.os_name),
    os_version: normalizeString(raw.os_version || payload.os_version || payload.device?.os_version),
    platform: normalizeString(raw.platform || payload.platform || payload.device?.platform),
    wechat_version: normalizeString(raw.wechat_version || payload.wechat_version || payload.device?.wechat_version),
    sdk_version: normalizeString(raw.sdk_version || payload.sdk_version || payload.device?.sdk_version),
    screen_width: normalizeNumberOrNull(raw.screen_width || payload.screen_width || payload.device?.screen_width),
    screen_height: normalizeNumberOrNull(raw.screen_height || payload.screen_height || payload.device?.screen_height),
    window_width: normalizeNumberOrNull(raw.window_width || payload.window_width || payload.device?.window_width),
    window_height: normalizeNumberOrNull(raw.window_height || payload.window_height || payload.device?.window_height),
    pixel_ratio: normalizeNumberOrNull(raw.pixel_ratio || payload.pixel_ratio || payload.device?.pixel_ratio),
    env: normalizeString(raw.env || payload.env),
    app_version: normalizeString(raw.app_version || payload.app_version),
    tracking_plan_version: normalizeString(raw.tracking_plan_version || payload.tracking_plan_version),
    created_at: normalizeString(raw.created_at) || new Date().toISOString(),
    received_at: new Date().toISOString(),
    payload
  }

  if (!event.page && event.page_path) event.page = event.page_path
  if (!event.page_title) event.page_title = event.page

  return event
}

const validateEvent = event => {
  const missingFields = []
  const invalidFields = []
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

  if (requiresTargetId(event) && !event.target_id) {
    missingFields.push('target_id')
  }

  if (event.env && !VALID_ENVS.has(event.env)) {
    invalidFields.push('env')
  }

  if (event.created_at && Number.isNaN(new Date(event.created_at).getTime())) {
    invalidFields.push('created_at')
  }

  return {
    is_valid: missingFields.length === 0 && invalidFields.length === 0,
    missing_fields: Array.from(new Set(missingFields)),
    invalid_fields: invalidFields
  }
}

const appendJsonl = async event => {
  await fs.promises.mkdir(RUNTIME_DIR, { recursive: true })
  await fs.promises.appendFile(EVENTS_FILE, JSON.stringify(event) + '\n', 'utf8')
}

const handleTrackEvent = async (req, res) => {
  try {
    const body = await readBody(req)
    const event = normalizeEvent(body)
    const validation = validateEvent(event)
    event.validation = validation
    event.payload = {
      ...event.payload,
      _server_validation: validation
    }

    if (!validation.is_valid) {
      jsonResponse(res, 400, {
        ok: false,
        error: 'invalid_analytics_event',
        validation
      })
      return
    }

    await appendJsonl(event)
    jsonResponse(res, 200, {
      ok: true,
      event_id: event.event_id,
      received_at: event.received_at
    })
  } catch (error) {
    const message = error && error.message ? error.message : 'unknown_error'
    jsonResponse(res, message === 'body_too_large' ? 413 : 400, {
      ok: false,
      error: message
    })
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`)

  if (req.method === 'OPTIONS') {
    jsonResponse(res, 200, { ok: true })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    jsonResponse(res, 200, {
      ok: true,
      service: 'yanzhidao-api',
      runtime_dir: path.relative(ROOT, RUNTIME_DIR)
    })
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/miniapp/events') {
    handleTrackEvent(req, res)
    return
  }

  jsonResponse(res, 404, {
    ok: false,
    error: 'not_found',
    path: url.pathname
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`API server listening on http://0.0.0.0:${PORT}/api`)
})
