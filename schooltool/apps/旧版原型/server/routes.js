const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { recommend } = require('./engine');

const router = express.Router();

// 创建访客
router.post('/start', (req, res) => {
  const uuid = uuidv4();
  const { source } = req.body || {};
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const device = req.headers['user-agent'] || '';

  db.prepare('INSERT INTO visitors (uuid, source_channel, device, ip) VALUES (?, ?, ?, ?)')
    .run(uuid, source || '', device, ip);

  res.json({ uuid });
});

// 记录答案
router.post('/answer', (req, res) => {
  const { uuid, question_key, answer_value } = req.body;
  if (!uuid || !question_key || answer_value === undefined) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  // 更新或插入（同一用户同一题覆盖）
  const existing = db.prepare('SELECT id FROM answers WHERE visitor_uuid = ? AND question_key = ?').get(uuid, question_key);
  if (existing) {
    db.prepare('UPDATE answers SET answer_value = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(answer_value, existing.id);
  } else {
    db.prepare('INSERT INTO answers (visitor_uuid, question_key, answer_value) VALUES (?, ?, ?)')
      .run(uuid, question_key, answer_value);
  }

  res.json({ ok: true });
});

// 获取推荐
router.post('/recommend', (req, res) => {
  const { uuid } = req.body;
  if (!uuid) return res.status(400).json({ error: '缺少uuid' });

  // 从数据库读取该用户的所有答案
  const rows = db.prepare('SELECT question_key, answer_value FROM answers WHERE visitor_uuid = ?').all(uuid);
  const answers = {};
  for (const r of rows) {
    answers[r.question_key] = r.answer_value;
  }

  if (Object.keys(answers).length < 6) {
    return res.status(400).json({ error: '答题不完整' });
  }

  const result = recommend(answers);

  // 存储推荐结果
  db.prepare(`INSERT INTO recommendations (visitor_uuid, primary_school, primary_major, primary_reason, alt_school, alt_major, alt_reason, case_id, warnings, fit_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      uuid,
      result.primary?.school || '', result.primary?.major || '', result.primary?.reason || '',
      result.alternative?.school || '', result.alternative?.major || '', result.alternative?.reason || '',
      result.case?.id || null,
      JSON.stringify(result.warnings),
      90
    );

  res.json(result);
});

// 提交线索
router.post('/lead', (req, res) => {
  const { uuid, wechat_id, phone } = req.body;
  if (!uuid) return res.status(400).json({ error: '缺少uuid' });
  if (!wechat_id && !phone) return res.status(400).json({ error: '请填写微信号或手机号' });

  db.prepare('INSERT INTO leads (visitor_uuid, wechat_id, phone) VALUES (?, ?, ?)')
    .run(uuid, wechat_id || '', phone || '');

  res.json({ ok: true, message: '提交成功，顾问将在24小时内联系你' });
});

// ============ 后台接口（简单密码保护） ============

const ADMIN_KEY = 'yanzhidao2026';

function checkAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key !== ADMIN_KEY) return res.status(403).json({ error: '无权限' });
  next();
}

// 线索列表
router.get('/admin/leads', checkAdmin, (req, res) => {
  const leads = db.prepare(`
    SELECT l.*, v.created_at as visit_time, v.source_channel,
      GROUP_CONCAT(a.question_key || ':' || a.answer_value, '|') as profile,
      r.primary_school, r.primary_major, r.alt_school, r.alt_major
    FROM leads l
    LEFT JOIN visitors v ON v.uuid = l.visitor_uuid
    LEFT JOIN answers a ON a.visitor_uuid = l.visitor_uuid
    LEFT JOIN recommendations r ON r.visitor_uuid = l.visitor_uuid
    GROUP BY l.id
    ORDER BY l.created_at DESC
    LIMIT 100
  `).all();

  res.json(leads);
});

// 统计数据
router.get('/admin/stats', checkAdmin, (req, res) => {
  const totalVisitors = db.prepare('SELECT COUNT(*) as count FROM visitors').get().count;
  const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
  const totalRecommends = db.prepare('SELECT COUNT(*) as count FROM recommendations').get().count;
  const todayVisitors = db.prepare("SELECT COUNT(*) as count FROM visitors WHERE date(created_at) = date('now')").get().count;
  const todayLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE date(created_at) = date('now')").get().count;

  // 热门画像
  const topSystems = db.prepare("SELECT answer_value, COUNT(*) as count FROM answers WHERE question_key = 'system' GROUP BY answer_value ORDER BY count DESC").all();
  const topGoals = db.prepare("SELECT answer_value, COUNT(*) as count FROM answers WHERE question_key = 'goal' GROUP BY answer_value ORDER BY count DESC").all();

  res.json({
    totalVisitors, totalLeads, totalRecommends,
    todayVisitors, todayLeads,
    conversionRate: totalVisitors > 0 ? (totalLeads / totalVisitors * 100).toFixed(1) + '%' : '0%',
    topSystems, topGoals
  });
});

module.exports = router;
