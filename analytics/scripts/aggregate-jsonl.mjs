#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const args = new Map()
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i]
  const value = process.argv[i + 1]
  if (key.startsWith('--')) {
    args.set(key.slice(2), value)
    i += 1
  }
}

const eventsPath = args.get('events') || 'schooltool/data/runtime/miniapp-events.jsonl'
const leadsPath = args.get('leads') || 'schooltool/data/runtime/miniapp-leads.jsonl'
const outputPath = args.get('output') || 'analytics/reports/latest-summary.json'

const readJsonl = (filePath) => {
  if (!fs.existsSync(filePath)) return []
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

const dayKey = (value) => {
  const raw = value?.created_at || value?.received_at || value?.timestamp || ''
  const date = raw ? new Date(raw) : null
  if (!date || Number.isNaN(date.getTime())) return 'unknown'
  return date.toISOString().slice(0, 10)
}

const increment = (map, key, step = 1) => {
  if (!key) return
  map.set(key, (map.get(key) || 0) + step)
}

const topEntries = (map, limit = 10) => Array.from(map.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, limit)
  .map(([name, count]) => ({ name, count }))

const events = readJsonl(eventsPath)
const leads = readJsonl(leadsPath)

const users = new Set()
const sessions = new Set()
const pageViews = []
const pageDurations = new Map()
const eventCounts = new Map()
const pageCounts = new Map()
const targetCounts = new Map()
const daily = new Map()

for (const event of events) {
  const eventType = event.event_type || 'unknown'
  const userId = event.anonymous_user_id || event.user_id || event.session_id
  const sessionId = event.session_id
  const pagePath = event.page_path || event.payload?.page || event.payload?.page_path
  const date = dayKey(event)

  if (userId) users.add(userId)
  if (sessionId) sessions.add(sessionId)
  increment(eventCounts, eventType)
  increment(daily, `${date}:${eventType}`)

  if (eventType === 'page_view') {
    pageViews.push(event)
    increment(pageCounts, pagePath || 'unknown')
  }

  const duration = Number(event.duration_ms || event.payload?.duration_ms || 0)
  if (eventType === 'page_leave' && duration >= 500 && duration <= 30 * 60 * 1000) {
    const current = pageDurations.get(pagePath || 'unknown') || { total: 0, count: 0 }
    current.total += duration
    current.count += 1
    pageDurations.set(pagePath || 'unknown', current)
  }

  if (event.target_type && (event.target_name || event.target_id)) {
    increment(targetCounts, `${event.target_type}:${event.target_name || event.target_id}`)
  }
}

const pageDurationSummary = Array.from(pageDurations.entries())
  .map(([page, item]) => ({
    page,
    avg_duration_ms: Math.round(item.total / item.count),
    samples: item.count
  }))
  .sort((a, b) => b.avg_duration_ms - a.avg_duration_ms)

const summary = {
  generated_at: new Date().toISOString(),
  sources: {
    events: eventsPath,
    leads: leadsPath
  },
  totals: {
    events: events.length,
    leads: leads.length,
    pv: pageViews.length,
    uv: users.size,
    sessions: sessions.size
  },
  funnel: {
    assessment_start: eventCounts.get('assessment_start') || eventCounts.get('start_assessment') || 0,
    assessment_finish: eventCounts.get('assessment_finish') || eventCounts.get('finish_assessment') || 0,
    recommendation_view: eventCounts.get('recommendation_view') || eventCounts.get('recommendation_generated') || 0,
    lead_submit: eventCounts.get('lead_submit') || Math.max(eventCounts.get('submit_lead') || 0, leads.length)
  },
  top_events: topEntries(eventCounts, 20),
  top_pages: topEntries(pageCounts, 20),
  top_targets: topEntries(targetCounts, 20),
  page_durations: pageDurationSummary,
  daily_event_counts: Object.fromEntries(daily)
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify({ ok: true, output: outputPath, totals: summary.totals }, null, 2))
