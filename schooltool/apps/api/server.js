const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 8010);
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const workspaceRoot = path.resolve(__dirname, '../../..');
const defaultSchoolDataPath = path.join(workspaceRoot, 'schooldata', 'data.json');
const fallbackSchoolDataPath = path.join(workspaceRoot, 'd', 'data.json');
const schoolDataPath = process.env.SCHOOL_DATA_PATH || (fs.existsSync(defaultSchoolDataPath) ? defaultSchoolDataPath : fallbackSchoolDataPath);
const runtimeDir = process.env.RUNTIME_DIR || path.join(workspaceRoot, 'schooltool', 'data', 'runtime');
const leadsPath = path.join(runtimeDir, 'miniapp-leads.jsonl');
const eventsPath = path.join(runtimeDir, 'miniapp-events.jsonl');
const feedbackPath = path.join(runtimeDir, 'miniapp-feedback.jsonl');
const insightsPath = path.join(runtimeDir, 'miniapp-flywheel-insights.json');

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true
}));
app.use(express.json({ limit: '1mb' }));

const regionMap = {
  scData: '四川',
  cqData: '重庆',
  ynData: '云南',
  gzData: '贵州'
};

let cachedPrograms = null;

function parseTuitionTotal(raw) {
  const text = String(raw || '');
  const match = text.match(/([\d.]+)\s*(?:W|w|万)/);
  if (match) return Math.round(Number(match[1]) * 10000);
  const yuan = text.match(/([\d.]+)\s*元/);
  if (yuan) return Math.round(Number(yuan[1]));
  return 0;
}

function parseDuration(program) {
  const text = [program.tuition, program.notes, program.study_years].filter(Boolean).join(' ');
  const match = text.match(/学制[:：]?\s*([\d.]+年)|[丨|｜]\s*([\d.]+年)/);
  return match?.[1] || match?.[2] || program.duration || '2-3年';
}

function inferCity(schoolName, province) {
  if (/重庆/.test(schoolName) || province === '重庆') return '重庆';
  if (/成都|四川大学|电子科技|西南财经|西南交通|四川师范|西南民族|成都/.test(schoolName)) return '成都';
  if (/昆明|云南/.test(schoolName) || province === '云南') return '昆明';
  if (/贵阳|贵州/.test(schoolName) || province === '贵州') return '贵阳';
  return province || '';
}

function schoolLevel(tags = []) {
  const text = tags.join(' ');
  if (/985/.test(text) || /自划线/.test(text)) return '985/211/双一流';
  if (/211/.test(text)) return '211/双一流';
  if (/双一流/.test(text)) return '双一流';
  return '普通院校';
}

function flattenSchoolData() {
  if (cachedPrograms) return cachedPrograms;
  if (!fs.existsSync(schoolDataPath)) {
    throw new Error(`School data file not found: ${schoolDataPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(schoolDataPath, 'utf8'));
  const list = [];
  let id = 1;

  for (const [regionKey, programGroups] of Object.entries(raw)) {
    const province = regionMap[regionKey] || regionKey;
    for (const [programType, group] of Object.entries(programGroups || {})) {
      const schools = Array.isArray(group.schools) ? group.schools : [];
      for (const school of schools) {
        const programs = Array.isArray(school.programs) && school.programs.length
          ? school.programs
          : [{}];

        for (const program of programs) {
          const universityName = school.school_name || school.name || '未知院校';
          const tuitionTotal = parseTuitionTotal(program.tuition || school.tuition);
          const enrollment = Number(String(program.enrollment || '').replace(/[^\d]/g, '')) || 0;
          const city = inferCity(universityName, province);
          const duration = parseDuration(program);
          const tags = Array.isArray(school.tags) ? school.tags : [];

          list.push({
            id: id++,
            university_name: universityName,
            school_code: school.school_code || '',
            program_type: programType,
            province,
            city,
            level: schoolLevel(tags),
            tags,
            department: program.department || '',
            major_name: program.major || group.major || programType,
            direction: program.direction || '',
            study_mode: program.study_mode || '非全日制',
            tuition: program.tuition || '',
            tuition_total: tuitionTotal,
            duration,
            enrollment,
            class_time: program.class_time || '',
            exam_subjects: program.exam_subjects || '',
            last_year_score: program.last_year_score || '',
            this_year_score: program.this_year_score || '',
            admission: program.admission || '',
            admission_rate: program.admission_rate || '',
            adjustment: program.adjustment || '',
            notes: program.notes || '',
            source: group.data_source || 'schooldata/data.json',
            status: '上线',
            description: `${universityName}${programType} 项目，学习方式为 ${program.study_mode || '非全日制'}，学费 ${program.tuition || '待定'}。数据来自当前院校库，提测阶段用于打通前后端流程。`
          });
        }
      }
    }
  }

  cachedPrograms = list;
  return cachedPrograms;
}

function filterPrograms(query) {
  let rows = flattenSchoolData();
  if (query.program_type && query.program_type !== 'all') {
    rows = rows.filter(item => item.program_type === query.program_type);
  }
  if (query.province && query.province !== 'all') {
    rows = rows.filter(item => item.province === query.province);
  }
  return rows;
}

function dedupePrograms(rows) {
  const map = new Map();
  for (const item of rows) {
    const key = `${item.province}-${item.program_type}-${item.university_name}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...item });
      continue;
    }
    existing.enrollment = Math.max(existing.enrollment || 0, item.enrollment || 0);
    if (!existing.this_year_score && item.this_year_score) existing.this_year_score = item.this_year_score;
    if (!existing.admission_rate && item.admission_rate) existing.admission_rate = item.admission_rate;
  }
  return Array.from(map.values());
}

function recommendSchools(answers = {}) {
  const province = answers.province || answers.region || '四川';
  const budget = Number(answers.budget || 80000);
  const goal = answers.goal || '';
  const preferredType = /转行|管理|国企/.test(`${goal}${answers.system || ''}`) ? 'MBA' : 'MPA';
  const pool = dedupePrograms(filterPrograms({ province, program_type: preferredType }));

  const sorted = pool
    .filter(item => !item.tuition_total || item.tuition_total <= Math.max(budget + 20000, 90000))
    .sort((a, b) => {
      const aScore = Number(String(a.this_year_score || '').match(/\d+/)?.[0] || 999);
      const bScore = Number(String(b.this_year_score || '').match(/\d+/)?.[0] || 999);
      return aScore - bScore || (b.enrollment || 0) - (a.enrollment || 0);
    });

  return (sorted.length ? sorted : pool).slice(0, 3).map(item => ({
    id: item.id,
    name: `${item.university_name} ${item.program_type}`,
    tuition: item.tuition_total || 0,
    reason: `${item.province}${item.city ? `·${item.city}` : ''}，${item.study_mode || '非全日制'}，${item.this_year_score ? `今年线 ${item.this_year_score}` : '适合作为提测推荐项'}`
  }));
}

function buildRecommendation(answers = {}) {
  const recommendedSchools = recommendSchools(answers);
  const primaryPath = /MBA|国企|转行/.test(`${answers.goal || ''}${answers.system || ''}`)
    ? 'MBA 双证路径'
    : 'MPA 双证路径';
  const reason = `根据你的地区、目标、预算和学习基础，提测版先推荐 ${primaryPath}，并优先用学费、分数线、招生人数和学习方式做院校筛选。`;

  return {
    blocked: false,
    primary_path: primaryPath,
    reason,
    message: reason,
    warnings: [],
    recommended_schools: recommendedSchools
  };
}

function appendLead(payload) {
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.appendFileSync(leadsPath, `${JSON.stringify({ ...payload, created_at: new Date().toISOString() })}\n`);
}

function appendJsonl(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify({ ...payload, created_at: new Date().toISOString() })}\n`);
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);
}

function increment(map, key, step = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + step);
}

function topEntries(map, limit = 10) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function buildFlywheelInsights() {
  const events = readJsonl(eventsPath);
  const leads = readJsonl(leadsPath);
  const feedbacks = readJsonl(feedbackPath);
  const eventCounts = new Map();
  const schoolInterest = new Map();
  const recommendationInterest = new Map();
  const leadSchoolInterest = new Map();
  const contentDemand = new Map();

  for (const event of events) {
    increment(eventCounts, event.event_type);
    const payload = event.payload || {};
    const schoolName = payload.school_name || payload.name || event.target_name;
    if (event.target_type === 'school' || /school|院校/.test(event.event_type || '')) {
      increment(schoolInterest, schoolName || event.target_id);
    }
    if (event.event_type === 'recommendation_generated') {
      for (const item of payload.recommended_schools || []) {
        increment(recommendationInterest, item.name || item.university_name);
      }
      increment(contentDemand, payload.primary_path);
    }
    if (/comparison|path/.test(event.event_type || '')) {
      increment(contentDemand, payload.path_type || event.target_name || '路径对比');
    }
  }

  for (const lead of leads) {
    const recommendation = lead.recommendation || {};
    for (const item of recommendation.schools || []) {
      increment(leadSchoolInterest, item.name || item.university_name);
    }
    increment(contentDemand, recommendation.primary_path);
  }

  const funnel = {
    start_assessment: eventCounts.get('start_assessment') || 0,
    finish_assessment: eventCounts.get('finish_assessment') || 0,
    recommendation_generated: eventCounts.get('recommendation_generated') || 0,
    submit_lead: Math.max(eventCounts.get('submit_lead') || 0, leads.length),
    consult_click: eventCounts.get('consult_click') || 0,
    favorite_school: eventCounts.get('favorite_school') || 0,
    share_result: eventCounts.get('share_result') || 0
  };

  const recommendations = topEntries(recommendationInterest, 8);
  const leadSchools = topEntries(leadSchoolInterest, 8);
  const hotSchools = topEntries(schoolInterest, 8);

  const product_updates = [
    ...leadSchools.slice(0, 3).map(item => ({
      type: 'school_weight',
      priority: 'high',
      title: `提升「${item.name}」推荐权重审核`,
      reason: `该院校已出现在 ${item.count} 条留资推荐结果中，建议运营审核后加热门标签或提高同类画像权重。`
    })),
    ...hotSchools.slice(0, 3).map(item => ({
      type: 'content',
      priority: 'medium',
      title: `补充「${item.name}」院校详情内容`,
      reason: `该院校浏览/互动 ${item.count} 次，适合优先补齐学费、分数线、上课方式和案例。`
    })),
    ...topEntries(contentDemand, 3).map(item => ({
      type: 'faq',
      priority: 'medium',
      title: `生成「${item.name}」FAQ/路径说明`,
      reason: `该路径在推荐或行为数据中出现 ${item.count} 次，可反哺了解 Tab。`
    }))
  ];

  return {
    generated_at: new Date().toISOString(),
    scope: 'miniapp_minimum_flywheel',
    summary: {
      total_events: events.length,
      total_leads: leads.length,
      total_feedbacks: feedbacks.length,
      unique_sessions: new Set(events.map(item => item.session_id).filter(Boolean)).size,
      recommendation_events: funnel.recommendation_generated
    },
    funnel,
    top_schools: hotSchools,
    top_recommended_schools: recommendations,
    top_lead_schools: leadSchools,
    content_demands: topEntries(contentDemand, 8),
    product_updates,
    next_actions: [
      '人工审核 product_updates 中的热门院校和 FAQ 建议',
      '把审核通过的热门标签写回院校库或推荐权重配置',
      '继续采集收藏、分享、咨询和留资后的转化反馈'
    ]
  };
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'yanzhidao-miniapp-api',
    program_count: flattenSchoolData().length,
    flywheel: {
      events: readJsonl(eventsPath).length,
      leads: readJsonl(leadsPath).length,
      feedbacks: readJsonl(feedbackPath).length,
      insights_file: fs.existsSync(insightsPath)
    },
    endpoints: [
      'GET /api/health',
      'GET /api/miniapp/schools',
      'POST /api/miniapp/recommend',
      'POST /api/miniapp/lead',
      'POST /api/miniapp/events',
      'POST /api/miniapp/recommendation-feedback',
      'GET /api/miniapp/flywheel/insights'
    ]
  });
});

app.get('/api/miniapp/schools', (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.page_size || 200), 1), 500);
  const rows = dedupePrograms(filterPrograms(req.query));
  const start = (page - 1) * pageSize;
  res.json({
    data: rows.slice(start, start + pageSize),
    total: rows.length,
    page,
    page_size: pageSize
  });
});

app.get('/api/miniapp/schools/:id', (req, res) => {
  const item = flattenSchoolData().find(row => row.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: '院校项目不存在' });
  res.json(item);
});

app.post('/api/miniapp/recommend', (req, res) => {
  const answers = req.body || {};
  const recommendation = buildRecommendation(answers);
  appendJsonl(eventsPath, {
    event_type: 'recommendation_generated',
    target_type: 'recommendation',
    session_id: answers.session_id || answers.sessionId || '',
    user_id: answers.user_id || answers.userId || '',
    payload: {
      answers,
      primary_path: recommendation.primary_path,
      recommended_schools: recommendation.recommended_schools
    }
  });
  res.json(recommendation);
});

app.post('/api/miniapp/lead', (req, res) => {
  const body = req.body || {};
  if (!body.wechat && !body.wechat_id && !body.phone) {
    return res.status(400).json({ error: '请填写微信号或手机号' });
  }
  appendLead(body);
  appendJsonl(eventsPath, {
    event_type: 'submit_lead',
    target_type: 'lead',
    session_id: body.session_id || body.sessionId || '',
    user_id: body.user_id || body.userId || '',
    payload: {
      source: body.source,
      answers: body.answers,
      recommendation: body.recommendation
    }
  });
  res.json({ ok: true, message: '提交成功，顾问将在 3 分钟内联系你' });
});

app.post('/api/miniapp/events', (req, res) => {
  const body = req.body || {};
  if (!body.event_type) {
    return res.status(400).json({ error: 'event_type is required' });
  }
  appendJsonl(eventsPath, {
    event_type: body.event_type,
    target_type: body.target_type || '',
    target_id: body.target_id || '',
    target_name: body.target_name || '',
    session_id: body.session_id || body.sessionId || '',
    user_id: body.user_id || body.userId || '',
    payload: body.payload || {}
  });
  res.json({ ok: true });
});

app.post('/api/miniapp/recommendation-feedback', (req, res) => {
  const body = req.body || {};
  appendJsonl(feedbackPath, {
    session_id: body.session_id || body.sessionId || '',
    user_id: body.user_id || body.userId || '',
    recommendation_id: body.recommendation_id || '',
    action: body.action || 'unknown',
    payload: body.payload || {}
  });
  appendJsonl(eventsPath, {
    event_type: `feedback_${body.action || 'unknown'}`,
    target_type: 'recommendation',
    session_id: body.session_id || body.sessionId || '',
    user_id: body.user_id || body.userId || '',
    payload: body.payload || {}
  });
  res.json({ ok: true });
});

app.get('/api/miniapp/flywheel/insights', (req, res) => {
  const insights = buildFlywheelInsights();
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(insightsPath, JSON.stringify(insights, null, 2));
  res.json(insights);
});

app.get('/api/miniapp/timeline/:pathType', (req, res) => {
  res.json({
    title: 'MPA/MBA 管综备考时间线',
    stages: [
      { month: '1-5月', title: '基础阶段', tasks: ['数学基础补弱', '英语词汇和长难句', '完成院校初筛'] },
      { month: '6-9月', title: '强化阶段', tasks: ['管综专项刷题', '阅读和写作模板训练', '根据分数调整目标院校'] },
      { month: '10-12月', title: '报名与冲刺', tasks: ['完成研招网报名', '进行模拟考试分析', '查漏补缺和考前复盘'] }
    ]
  });
});

app.post('/api/miniapp/score-estimate', (req, res) => {
  const scores = req.body || {};
  const total = ['math', 'logic', 'writing', 'english'].reduce((sum, key) => sum + (Number(scores[key]) || 0), 0);
  res.json({
    total_score: total,
    level: total >= 220 ? '优秀' : total >= 180 ? '良好' : total >= 170 ? '及格' : '需努力',
    recommended_schools: total >= 180 ? ['四川大学', '西南财经大学'] : ['建议先按低分稳妥院校筛选'],
    note: '提测版估分接口已打通，正式推荐逻辑后续接入。'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Miniapp API running at http://${HOST}:${PORT}`);
  console.log(`Loaded ${flattenSchoolData().length} school programs from ${schoolDataPath}`);
  console.log(`Runtime dir: ${runtimeDir}`);
});
server.ref();
setInterval(() => {}, 1 << 30);
