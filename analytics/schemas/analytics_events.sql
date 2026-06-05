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
  entry_page VARCHAR(255) NULL,
  exit_page VARCHAR(255) NULL,
  device_model VARCHAR(128) NULL,
  platform VARCHAR(64) NULL,
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
  page VARCHAR(128) NOT NULL,
  page_path VARCHAR(255) NULL,
  page_title VARCHAR(128) NULL,
  target_type VARCHAR(64) NULL,
  target_id VARCHAR(128) NULL,
  target_name VARCHAR(255) NULL,
  source_channel VARCHAR(128) NULL,
  scene VARCHAR(64) NULL,
  scene_category VARCHAR(128) NULL,
  duration_ms BIGINT NULL,
  keyword VARCHAR(255) NULL,
  result_count INT NULL,
  has_result TINYINT(1) NULL,
  error_type VARCHAR(128) NULL,
  err_msg VARCHAR(512) NULL,
  status_code INT NULL,
  url VARCHAR(512) NULL,
  method VARCHAR(16) NULL,
  share_trace_id VARCHAR(96) NULL,
  referrer_share_trace_id VARCHAR(96) NULL,
  section_id VARCHAR(128) NULL,
  section_name VARCHAR(128) NULL,
  scroll_threshold INT NULL,
  device_brand VARCHAR(128) NULL,
  device_model VARCHAR(128) NULL,
  device_type VARCHAR(64) NULL,
  os_name VARCHAR(64) NULL,
  os_version VARCHAR(128) NULL,
  platform VARCHAR(64) NULL,
  wechat_version VARCHAR(64) NULL,
  sdk_version VARCHAR(64) NULL,
  screen_width INT NULL,
  screen_height INT NULL,
  window_width INT NULL,
  window_height INT NULL,
  pixel_ratio DECIMAL(8, 3) NULL,
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
  INDEX idx_analytics_events_page_name (page),
  INDEX idx_analytics_events_page (page_path),
  INDEX idx_analytics_events_source (source_channel, created_at),
  INDEX idx_analytics_events_keyword (keyword),
  INDEX idx_analytics_events_error (error_type, created_at),
  INDEX idx_analytics_events_target (target_type, target_id),
  INDEX idx_analytics_events_share_trace (share_trace_id),
  INDEX idx_analytics_events_referrer_share_trace (referrer_share_trace_id),
  INDEX idx_analytics_events_section (section_id),
  INDEX idx_analytics_events_device (device_model),
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

CREATE TABLE IF NOT EXISTS analytics_case_metrics (
  metric_date DATE NOT NULL,
  env VARCHAR(32) NOT NULL,
  case_id VARCHAR(128) NOT NULL,
  case_name VARCHAR(255) NULL,
  case_type VARCHAR(64) NULL,
  card_clicks INT NOT NULL DEFAULT 0,
  detail_opens INT NOT NULL DEFAULT 0,
  contact_clicks INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (metric_date, env, case_id),
  INDEX idx_analytics_case_metrics_type (env, metric_date, case_type)
);

CREATE TABLE IF NOT EXISTS analytics_funnel_metrics (
  metric_date DATE NOT NULL,
  env VARCHAR(32) NOT NULL,
  funnel_name VARCHAR(64) NOT NULL,
  step_order INT NOT NULL,
  step_name VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  event_count INT NOT NULL DEFAULT 0,
  uv INT NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(8, 4) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (metric_date, env, funnel_name, step_order),
  INDEX idx_analytics_funnel_metrics_name (env, metric_date, funnel_name)
);

CREATE TABLE IF NOT EXISTS analytics_event_quality_metrics (
  metric_date DATE NOT NULL,
  env VARCHAR(32) NOT NULL,
  field_name VARCHAR(64) NOT NULL,
  missing_count INT NOT NULL DEFAULT 0,
  invalid_count INT NOT NULL DEFAULT 0,
  total_count INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (metric_date, env, field_name)
);
