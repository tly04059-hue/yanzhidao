#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const outputDir = 'analytics/reports'
const eventsPath = path.join(outputDir, 'demo-miniapp-events.jsonl')
const leadsPath = path.join(outputDir, 'demo-miniapp-leads.jsonl')

let seed = 20260609
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const pick = (items) => items[Math.floor(rand() * items.length)]
const pad = (value, len = 4) => String(value).padStart(len, '0')
const iso = (date) => date.toISOString()

const devices = [
  { device_model: 'iPhone 15 Pro', platform: 'ios', os_name: 'iOS', os_version: '17.5', screen_width: 393, screen_height: 852 },
  { device_model: 'iPhone 14', platform: 'ios', os_name: 'iOS', os_version: '17.4', screen_width: 390, screen_height: 844 },
  { device_model: 'Huawei Mate 60', platform: 'android', os_name: 'HarmonyOS', os_version: '4.2', screen_width: 430, screen_height: 932 },
  { device_model: 'Xiaomi 14', platform: 'android', os_name: 'Android', os_version: '14', screen_width: 393, screen_height: 873 },
  { device_model: 'OPPO Find X7', platform: 'android', os_name: 'Android', os_version: '14', screen_width: 412, screen_height: 915 },
  { device_model: 'vivo X100', platform: 'android', os_name: 'Android', os_version: '14', screen_width: 412, screen_height: 915 }
]

const channels = [
  { source_channel: 'wechat_search', scene: '1005' },
  { source_channel: 'share_card', scene: '1007' },
  { source_channel: 'official_account', scene: '1035' },
  { source_channel: 'qr_code', scene: '1047' },
  { source_channel: 'video_account', scene: '1175' },
  { source_channel: 'direct', scene: '1001' }
]

const pages = {
  home: { page: 'home', page_path: '/pages/index/index', page_title: '首页' },
  learn: { page: 'learn', page_path: '/pages/learn/index', page_title: '在职考研学历了解' },
  test: { page: 'test', page_path: '/pages/test/index', page_title: '测一测' },
  loading: { page: 'loading', page_path: '/pages/loading/index', page_title: '生成方向建议' },
  result: { page: 'result', page_path: '/pages/result/index', page_title: '选校方向建议' },
  cases: { page: 'cases_v2', page_path: '/pages/cases-v2/index', page_title: '1000+学员真实选择' },
  contact: { page: 'contact', page_path: '/pages/contact/index', page_title: '加企微咨询' },
  schools: { page: 'schools', page_path: '/pages/schools/index', page_title: '院校库' },
  schoolDetail: { page: 'school-detail', page_path: '/pages/school-detail/index', page_title: '院校详情' },
  downloads: { page: 'downloads', page_path: '/pages/downloads/index', page_title: '资料下载' },
  prep: { page: 'prep', page_path: '/pages/prep/index', page_title: '在职考研路径对比' }
}

const cases = [
  { id: 'party-1106', name: '张同学 · 约32岁 · 成都', type: 'party_school' },
  { id: 'party-850', name: '吴同学 · 约28岁 · 绵阳', type: 'party_school' },
  { id: 'party-867', name: '道同学 · 约34岁 · 眉山', type: 'party_school' },
  { id: 'exam-001', name: '唐女士 · 约32岁 · 教育系统', type: 'management_exam' },
  { id: 'exam-006', name: '彭先生 · 约33岁 · 银行系统', type: 'management_exam' },
  { id: 'exam-012', name: '王女士 · 约35岁 · 事业单位', type: 'management_exam' }
]

const schools = [
  { id: 'scdx-politics', name: '四川省委党校 · 政治学' },
  { id: 'scdx-economics', name: '四川省委党校 · 经济学' },
  { id: 'cqu-mpa', name: '重庆大学 · MPA' },
  { id: 'swufe-mpa', name: '西南财经大学 · MPA' },
  { id: 'sicnu-mpa', name: '四川师范大学 · MPA' }
]

const eventTypesByFlow = ['learn_case_contact', 'test_result_contact', 'school_compare', 'download_share', 'browse_exit']
const events = []
const leads = []

const addEvent = (ctx, eventType, pageInfo, extra = {}) => {
  ctx.now = new Date(ctx.now.getTime() + (extra.offset_ms ?? Math.round((20 + rand() * 90) * 1000)))
  const event = {
    event_id: `evt_demo_${pad(events.length + 1, 6)}`,
    event_type: eventType,
    page: pageInfo.page,
    page_path: pageInfo.page_path,
    page_title: pageInfo.page_title,
    anonymous_user_id: ctx.userId,
    session_id: ctx.sessionId,
    is_new_user: ctx.isFirstEvent,
    target_type: extra.target_type || 'page',
    target_id: extra.target_id || pageInfo.page_path,
    target_name: extra.target_name || pageInfo.page_title,
    source_channel: ctx.source.source_channel,
    scene: ctx.source.scene,
    scene_category: ctx.source.source_channel,
    env: 'trial',
    app_version: 'demo-1.0.9',
    tracking_plan_version: '2026-06-v1',
    created_at: iso(ctx.now),
    received_at: iso(ctx.now),
    device_brand: ctx.device.device_model.split(' ')[0],
    device_model: ctx.device.device_model,
    device_type: 'phone',
    os_name: ctx.device.os_name,
    os_version: ctx.device.os_version,
    platform: ctx.device.platform,
    wechat_version: '8.0.50',
    sdk_version: '3.6.5',
    screen_width: ctx.device.screen_width,
    screen_height: ctx.device.screen_height,
    window_width: ctx.device.screen_width,
    window_height: ctx.device.screen_height - 88,
    pixel_ratio: ctx.device.platform === 'ios' ? 3 : 2.75,
    duration_ms: extra.duration_ms || 0,
    route: extra.route || pageInfo.page_path,
    position: extra.position || '',
    section_id: extra.section_id || '',
    section_name: extra.section_name || '',
    scroll_threshold: extra.scroll_threshold || null,
    action: extra.action || '',
    keyword: extra.keyword || '',
    result_count: extra.result_count ?? null,
    has_result: extra.has_result ?? null,
    share_trace_id: extra.share_trace_id || '',
    referrer_share_trace_id: ctx.referrerShareTraceId || '',
    payload: {
      demo: true,
      flow: ctx.flow,
      ...extra
    }
  }
  ctx.isFirstEvent = false
  events.push(event)
  return event
}

const visitPage = (ctx, pageInfo, durationMs, options = {}) => {
  addEvent(ctx, 'page_view', pageInfo, options)
  if (options.section_id) {
    addEvent(ctx, 'section_view_start', pageInfo, {
      target_type: 'section',
      target_id: options.section_id,
      target_name: options.section_name,
      section_id: options.section_id,
      section_name: options.section_name
    })
  }
  if (rand() > 0.25) {
    addEvent(ctx, 'scroll_depth', pageInfo, {
      target_type: 'page',
      target_id: `${pageInfo.page}_75`,
      target_name: `${pageInfo.page_title} 75%`,
      scroll_threshold: pick([50, 75, 90, 100])
    })
  }
  if (options.section_id) {
    addEvent(ctx, 'section_view_end', pageInfo, {
      target_type: 'section',
      target_id: options.section_id,
      target_name: options.section_name,
      section_id: options.section_id,
      section_name: options.section_name,
      duration_ms: Math.round(durationMs * 0.55)
    })
  }
  addEvent(ctx, 'page_leave', pageInfo, {
    target_type: 'page',
    target_id: pageInfo.page_path,
    target_name: pageInfo.page_title,
    duration_ms: durationMs,
    leave_reason: 'navigate'
  })
}

const nav = (ctx, fromPage, toPage, position) => {
  addEvent(ctx, 'nav_click', fromPage, {
    target_type: 'page',
    target_id: toPage.page_path,
    target_name: toPage.page_title,
    route: toPage.page_path,
    position
  })
}

const maybeContact = (ctx, pageInfo, probability = 0.35) => {
  if (rand() > probability) return
  addEvent(ctx, 'contact_click', pageInfo, {
    target_type: 'contact',
    target_id: 'wechat_consult',
    target_name: '联系顾问',
    position: 'wechat'
  })
  if (rand() > 0.45) {
    const leadId = `lead_demo_${pad(leads.length + 1, 4)}`
    addEvent(ctx, 'lead_submit', pageInfo, {
      target_type: 'lead',
      target_id: leadId,
      target_name: '用户留资',
      position: 'lead_submit'
    })
    leads.push({
      lead_id: leadId,
      anonymous_user_id: ctx.userId,
      session_id: ctx.sessionId,
      name: `演示用户${pad(leads.length + 1, 3)}`,
      phone_masked: `1${Math.floor(30 + rand() * 60)}****${pad(Math.floor(rand() * 10000), 4)}`,
      source_channel: ctx.source.source_channel,
      created_at: iso(ctx.now),
      demo: true
    })
  }
}

const runFlow = (ctx) => {
  addEvent(ctx, 'app_launch', pages.home, {
    target_type: 'app',
    target_id: 'miniapp',
    target_name: '研知道小程序',
    launch_path: pages.home.page_path
  })
  addEvent(ctx, 'app_show', pages.home, {
    target_type: 'app',
    target_id: 'miniapp',
    target_name: '研知道小程序'
  })
  if (ctx.referrerShareTraceId) {
    addEvent(ctx, 'share_open', pages.home, {
      target_type: 'share',
      target_id: ctx.referrerShareTraceId,
      target_name: '分享打开'
    })
  }

  visitPage(ctx, pages.home, 18_000 + rand() * 42_000, { section_id: 'home_entry', section_name: '首页入口区' })

  if (ctx.flow === 'learn_case_contact') {
    nav(ctx, pages.home, pages.learn, 'learn_entry')
    visitPage(ctx, pages.learn, 45_000 + rand() * 90_000, { section_id: 'learn-peer-samples', section_name: '同学实际选择' })
    nav(ctx, pages.learn, pages.cases, 'cases_entry')
    visitPage(ctx, pages.cases, 55_000 + rand() * 120_000, { section_id: 'case-list', section_name: '案例列表' })
    const c = pick(cases)
    addEvent(ctx, 'case_card_click', pages.cases, {
      target_type: 'case',
      target_id: c.id,
      target_name: c.name,
      case_type: c.type,
      position: 'case_card'
    })
    addEvent(ctx, 'modal_open', pages.cases, {
      target_type: 'case',
      target_id: c.id,
      target_name: c.name,
      case_type: c.type,
      modal_type: 'case_detail',
      duration_ms: 0
    })
    addEvent(ctx, 'modal_close', pages.cases, {
      target_type: 'case',
      target_id: c.id,
      target_name: c.name,
      case_type: c.type,
      modal_type: 'case_detail',
      duration_ms: 25_000 + rand() * 75_000
    })
    maybeContact(ctx, pages.cases, 0.52)
  }

  if (ctx.flow === 'test_result_contact') {
    nav(ctx, pages.home, pages.test, 'test_entry')
    visitPage(ctx, pages.test, 35_000 + rand() * 70_000, { section_id: 'assessment-form', section_name: '测评表单' })
    addEvent(ctx, 'assessment_start', pages.test, { target_type: 'assessment', target_id: 'main_quiz', target_name: '测一测' })
    for (let q = 1; q <= 5; q += 1) {
      addEvent(ctx, 'assessment_answer', pages.test, {
        target_type: 'question',
        target_id: `q${q}`,
        target_name: `测评题 ${q}`,
        action: pick(['party_school', 'management_exam', 'unclear'])
      })
    }
    addEvent(ctx, 'assessment_finish', pages.test, { target_type: 'assessment', target_id: 'main_quiz', target_name: '测一测' })
    visitPage(ctx, pages.loading, 8_000 + rand() * 12_000)
    visitPage(ctx, pages.result, 80_000 + rand() * 180_000, { section_id: 'recommendation-reason', section_name: '推荐理由' })
    addEvent(ctx, 'recommendation_view', pages.result, {
      target_type: 'strategy',
      target_id: pick(['party_school_strategy', 'management_exam_strategy']),
      target_name: '选校方向建议'
    })
    maybeContact(ctx, pages.result, 0.62)
  }

  if (ctx.flow === 'school_compare') {
    nav(ctx, pages.home, pages.schools, 'schools_entry')
    visitPage(ctx, pages.schools, 55_000 + rand() * 120_000, { section_id: 'school-filter', section_name: '院校筛选' })
    addEvent(ctx, 'school_filter_change', pages.schools, {
      target_type: 'filter',
      target_id: pick(['region_sichuan', 'region_chongqing', 'path_party', 'path_exam']),
      target_name: '院校筛选',
      action: 'change'
    })
    const s = pick(schools)
    addEvent(ctx, 'school_card_click', pages.schools, {
      target_type: 'school',
      target_id: s.id,
      target_name: s.name
    })
    visitPage(ctx, pages.schoolDetail, 45_000 + rand() * 100_000, { section_id: 'school-policy', section_name: '政策与作用' })
    addEvent(ctx, 'school_detail_view', pages.schoolDetail, {
      target_type: 'school',
      target_id: s.id,
      target_name: s.name
    })
    maybeContact(ctx, pages.schoolDetail, 0.38)
  }

  if (ctx.flow === 'download_share') {
    nav(ctx, pages.home, pages.downloads, 'downloads_entry')
    visitPage(ctx, pages.downloads, 40_000 + rand() * 80_000, { section_id: 'download-preview', section_name: '资料预览' })
    addEvent(ctx, 'content_interaction', pages.downloads, {
      target_type: 'download',
      target_id: 'sc-party-2026-one-page',
      target_name: '2026四川党校考前必背一页纸',
      action: pick(['download', 'save_image', 'preview'])
    })
    if (rand() > 0.4) {
      const shareTraceId = `share_demo_${pad(Math.floor(rand() * 600), 4)}`
      addEvent(ctx, 'share_attempt', pages.downloads, {
        target_type: 'share',
        target_id: shareTraceId,
        target_name: '资料下载页分享',
        share_trace_id: shareTraceId
      })
    }
  }

  if (ctx.flow === 'browse_exit') {
    nav(ctx, pages.home, pages.prep, 'prep_entry')
    visitPage(ctx, pages.prep, 28_000 + rand() * 70_000, { section_id: 'path-compare', section_name: '路径对比' })
    if (rand() > 0.5) {
      nav(ctx, pages.prep, pages.cases, 'cases_entry')
      visitPage(ctx, pages.cases, 22_000 + rand() * 60_000)
    }
  }

  addEvent(ctx, 'app_hide', pages.home, {
    target_type: 'app',
    target_id: 'miniapp',
    target_name: '研知道小程序',
    duration_ms: 90_000 + rand() * 360_000
  })
}

for (let i = 1; i <= 100; i += 1) {
  const userId = `anon_demo_${pad(i, 4)}`
  const device = pick(devices)
  const source = pick(channels)
  const flow = pick(eventTypesByFlow)
  const sessionCount = 1 + Math.floor(rand() * 4)
  const base = new Date(Date.UTC(2026, 5, 1 + Math.floor(rand() * 2), 1 + Math.floor(rand() * 12), Math.floor(rand() * 60), 0))

  for (let s = 1; s <= sessionCount; s += 1) {
    const ctx = {
      userId,
      sessionId: `sess_demo_${pad(i, 4)}_${pad(s, 2)}`,
      device,
      source: s === 1 ? source : pick(channels),
      flow: s === 1 ? flow : pick(eventTypesByFlow),
      now: new Date(base.getTime() + (s - 1) * (1 + Math.floor(rand() * 2)) * 24 * 60 * 60 * 1000 + Math.floor(rand() * 10) * 60 * 60 * 1000),
      isFirstEvent: s === 1,
      referrerShareTraceId: source.source_channel === 'share_card' && s === 1 ? `share_demo_${pad(Math.floor(rand() * 600), 4)}` : ''
    }
    runFlow(ctx)
  }
}

events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

await fs.promises.mkdir(outputDir, { recursive: true })
await fs.promises.writeFile(eventsPath, events.map(item => JSON.stringify(item)).join('\n') + '\n', 'utf8')
await fs.promises.writeFile(leadsPath, leads.map(item => JSON.stringify(item)).join('\n') + '\n', 'utf8')

console.log(JSON.stringify({
  ok: true,
  events: events.length,
  users: 100,
  leads: leads.length,
  eventsPath,
  leadsPath
}, null, 2))
