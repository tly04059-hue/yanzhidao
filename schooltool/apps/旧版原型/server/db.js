const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', '..', 'data', 'app.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    source_channel TEXT DEFAULT '',
    device TEXT DEFAULT '',
    ip TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_uuid TEXT NOT NULL,
    question_key TEXT NOT NULL,
    answer_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_uuid TEXT NOT NULL,
    primary_school TEXT,
    primary_major TEXT,
    primary_reason TEXT,
    alt_school TEXT,
    alt_major TEXT,
    alt_reason TEXT,
    case_id INTEGER,
    warnings TEXT DEFAULT '[]',
    fit_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_uuid TEXT NOT NULL,
    wechat_id TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    city TEXT,
    system_type TEXT,
    position TEXT,
    education TEXT,
    party_member INTEGER DEFAULT 1,
    work_years INTEGER,
    goal TEXT,
    choice TEXT,
    motivation TEXT,
    quote TEXT,
    outcome TEXT,
    tags TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    province TEXT,
    majors TEXT DEFAULT '[]',
    fee TEXT,
    fee_num INTEGER DEFAULT 0,
    enrollment INTEGER DEFAULT 0,
    pass_rate TEXT,
    requirements TEXT DEFAULT '',
    deadline TEXT DEFAULT '',
    notes TEXT DEFAULT ''
  );
`);

module.exports = db;
