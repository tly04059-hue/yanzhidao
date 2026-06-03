-- Analytics data model for MySQL 8.0+.
-- Keep raw events append-only. Build daily/page/funnel summaries from these tables.

CREATE TABLE IF NOT EXISTS analytics_users (
  anonymous_user_id VARCHAR(64) PRIMARY KEY,
  wechat_openid VARCHAR(128) NULL,
  first_seen_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,
  visit_count INT NOT NULL DEFAULT 1,
  source_channel VARCHAR(128) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_analytics_users_openid (wechat_openid),
  INDEX idx_analytics_users_first_seen (first_seen_at)
);

CREATE TABLE IF NOT EXISTS analytics_sessions (
  session_id VARCHAR(64) PRIMARY KEY,
  anonymous_user_id VARCHAR(64) NOT NULL,
  env VARCHAR(32) NOT NULL,
  app_version VARCHAR(64) NOT NULL,
  source_channel VARCHAR(128) NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME NULL,
  duration_ms BIGINT NULL,
  page_view_count INT NOT NULL DEFAULT 0,
  event_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_analytics_sessions_user (anonymous_user_id),
  INDEX idx_analytics_sessions_started (started_at),
  INDEX idx_analytics_sessions_env (env)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  event_id VARCHAR(96) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  anonymous_user_id VARCHAR(64) NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  wechat_openid VARCHAR(128) NULL,
  is_new_user TINYINT(1) NULL,
  is_test_user TINYINT(1) NOT NULL DEFAULT 0,
  page_path VARCHAR(255) NULL,
  page_title VARCHAR(128) NULL,
  target_type VARCHAR(64) NULL,
  target_id VARCHAR(128) NULL,
  target_name VARCHAR(255) NULL,
  source_channel VARCHAR(128) NULL,
  scene VARCHAR(64) NULL,
  duration_ms BIGINT NULL,
  env VARCHAR(32) NOT NULL,
  app_version VARCHAR(64) NOT NULL,
  tracking_plan_version VARCHAR(64) NOT NULL,
  payload JSON NULL,
  created_at DATETIME NOT NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_analytics_event_id (event_id),
  INDEX idx_analytics_events_type_time (event_type, created_at),
  INDEX idx_analytics_events_user_time (anonymous_user_id, created_at),
  INDEX idx_analytics_events_session (session_id),
  INDEX idx_analytics_events_page (page_path),
  INDEX idx_analytics_events_target (target_type, target_id),
  INDEX idx_analytics_events_env_time (env, created_at)
);

CREATE TABLE IF NOT EXISTS analytics_daily_metrics (
  metric_date DATE PRIMARY KEY,
  env VARCHAR(32) NOT NULL,
  pv INT NOT NULL DEFAULT 0,
  uv INT NOT NULL DEFAULT 0,
  new_users INT NOT NULL DEFAULT 0,
  returning_users INT NOT NULL DEFAULT 0,
  sessions INT NOT NULL DEFAULT 0,
  leads INT NOT NULL DEFAULT 0,
  assessment_starts INT NOT NULL DEFAULT 0,
  assessment_finishes INT NOT NULL DEFAULT 0,
  recommendation_views INT NOT NULL DEFAULT 0,
  avg_page_duration_ms BIGINT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_analytics_daily_env (env, metric_date)
);

CREATE TABLE IF NOT EXISTS analytics_page_metrics (
  metric_date DATE NOT NULL,
  env VARCHAR(32) NOT NULL,
  page_path VARCHAR(255) NOT NULL,
  pv INT NOT NULL DEFAULT 0,
  uv INT NOT NULL DEFAULT 0,
  exits INT NOT NULL DEFAULT 0,
  avg_duration_ms BIGINT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (metric_date, env, page_path)
);
