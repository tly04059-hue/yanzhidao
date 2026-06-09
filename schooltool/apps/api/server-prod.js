const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT || 8010);
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const workspaceRoot = path.resolve(__dirname, '../../..');
const schoolDataPath = process.env.SCHOOL_DATA_PATH || path.join(workspaceRoot, 'schooldata', 'data.json');
const runtimeDir = process.env.RUNTIME_DIR || path.join(workspaceRoot, 'schooltool', 'data', 'runtime');
const leadsPath = path.join(runtimeDir, 'miniapp-leads.jsonl');
const eventsPath = path.join(runtimeDir, 'miniapp-events.jsonl');
const analyticsReportsDir = path.join(workspaceRoot, 'analytics', 'reports');
const analyticsAuthUser = process.env.ANALYTICS_AUTH_USER || (process.env.NODE_ENV === 'production' ? '' : 'analytics_admin');
const analyticsAuthPassword = process.env.ANALYTICS_AUTH_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'yanzhidao-dashboard');

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true
}));
app.use(express.json({ limit: '1mb' }));

// ===================== 用户行为看板访问保护 =====================

function timingSafeEqualString(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseBasicAuth(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return null;

  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex < 0) return null;
    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1)
    };
  } catch (err) {
    return null;
  }
}

function isAnalyticsAuthConfigured() {
  return Boolean(analyticsAuthUser && analyticsAuthPassword);
}

function requireAnalyticsAuth(req, res, next) {
  if (!isAnalyticsAuthConfigured()) {
    return res.status(503).type('text/plain').send('Analytics dashboard auth is not configured. Set ANALYTICS_AUTH_USER and ANALYTICS_AUTH_PASSWORD.');
  }

  const credentials = parseBasicAuth(req);
  const passed = credentials &&
    timingSafeEqualString(credentials.username, analyticsAuthUser) &&
    timingSafeEqualString(credentials.password, analyticsAuthPassword);

  if (!passed) {
    res.set('WWW-Authenticate', 'Basic realm="Yanzhidao Analytics"');
    return res.status(401).type('text/plain').send('Authentication required.');
  }

  next();
}

app.use('/analytics', requireAnalyticsAuth, express.static(analyticsReportsDir, {
  index: 'user-behavior-dashboard.html',
  etag: false,
  maxAge: 0,
  setHeaders: res => {
    res.setHeader('Cache-Control', 'no-store');
  }
}));

// ===================== 埋点事件处理 =====================

const VALID_ENVS = new Set(['development', 'trial', 'production']);

const normalizeString = value => String(value || '').trim();

const requiresTargetId = event => {
  if (event.target_type === 'case') {
    return ['case_card_click', 'modal_open', 'modal_close'].includes(event.event_type);
  }
  return ['school_card_click', 'school_detail_view'].includes(event.event_type);
};

const normalizeEvent = raw => {
  const payload = raw && typeof raw.payload === 'object' && raw.payload !== null ? raw.payload : {};
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
    duration_ms: Number(raw.duration_ms || payload.duration_ms || 0) || null,
    env: normalizeString(raw.env || payload.env),
    app_version: normalizeString(raw.app_version || payload.app_version),
    tracking_plan_version: normalizeString(raw.tracking_plan_version || payload.tracking_plan_version),
    created_at: normalizeString(raw.created_at) || new Date().toISOString(),
    received_at: new Date().toISOString(),
    payload
  };

  if (!event.page && event.page_path) event.page = event.page_path;
  if (!event.page_title) event.page_title = event.page;

  return event;
};

const validateEvent = event => {
  const missingFields = [];
  const invalidFields = [];
  const requiredFields = [
    'event_id', 'event_type', 'page', 'page_path',
    'anonymous_user_id', 'session_id', 'env',
    'app_version', 'tracking_plan_version', 'created_at'
  ];

  requiredFields.forEach(field => {
    if (!event[field]) missingFields.push(field);
  });

  if (requiresTargetId(event) && !event.target_id) {
    missingFields.push('target_id');
  }

  if (event.env && !VALID_ENVS.has(event.env)) {
    invalidFields.push('env');
  }

  if (event.created_at && Number.isNaN(new Date(event.created_at).getTime())) {
    invalidFields.push('created_at');
  }

  return {
    is_valid: missingFields.length === 0 && invalidFields.length === 0,
    missing_fields: Array.from(new Set(missingFields)),
    invalid_fields: invalidFields
  };
};

const appendJsonl = async (filePath, data) => {
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(data) + '\n', 'utf8');
};

// ===================== 院校数据 =====================

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

// ===================== 路由 =====================

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'yanzhidao-miniapp-api',
    program_count: flattenSchoolData().length,
    analytics_auth_configured: isAnalyticsAuthConfigured()
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
  res.json(buildRecommendation(req.body || {}));
});

app.post('/api/miniapp/lead', (req, res) => {
  const body = req.body || {};
  if (!body.wechat && !body.wechat_id && !body.phone) {
    return res.status(400).json({ error: '请填写微信号或手机号' });
  }
  appendLead(body);
  res.json({ ok: true, message: '提交成功，顾问将在 3 分钟内联系你' });
});

app.post('/api/miniapp/events', (req, res) => {
  try {
    const body = req.body || {};
    // 支持单事件和批量事件
    const events = Array.isArray(body) ? body : [body];
    const results = [];

    for (const raw of events) {
      const event = normalizeEvent(raw);
      const validation = validateEvent(event);
      event.validation = validation;
      event.payload = {
        ...event.payload,
        _server_validation: validation
      };

      if (!validation.is_valid) {
        results.push({
          ok: false,
          event_id: event.event_id,
          error: 'invalid_analytics_event',
          validation
        });
        continue;
      }

      appendJsonl(eventsPath, event);
      results.push({
        ok: true,
        event_id: event.event_id,
        received_at: event.received_at
      });
    }

    // 单事件返回扁平格式，批量事件返回数组
    if (!Array.isArray(body)) {
      const r = results[0];
      if (r.ok) {
        res.json(r);
      } else {
        res.status(400).json(r);
      }
    } else {
      res.json({ results });
    }
  } catch (err) {
    res.status(400).json({ error: err.message || 'unknown_error' });
  }
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

app.listen(PORT, HOST, () => {
  console.log(`Miniapp API running at http://${HOST}:${PORT}`);
  console.log(`Loaded ${flattenSchoolData().length} school programs from ${schoolDataPath}`);
  console.log(`Runtime dir: ${runtimeDir}`);
});
