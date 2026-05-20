// ==========================================
// 研知道 - PM2 进程管理器配置
// ==========================================
// PM2 比 systemd 更适合 Node.js 应用管理
// 安装: npm install -g pm2
// 启动: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'yanzhidao-api',
    script: 'server.js',
    cwd: '/var/www/yanzhidao/api',
    
    // 环境变量
    env: {
      NODE_ENV: 'production',
      PORT: 8010,
      HOST: '0.0.0.0',
      SCHOOL_DATA_PATH: '/var/www/yanzhidao/api/schooldata/data.json',
      RUNTIME_DIR: '/var/www/yanzhidao/api/runtime',
      CORS_ORIGIN: '*'
    },
    
    // 日志
    log_file: '/var/www/yanzhidao/logs/api-combined.log',
    out_file: '/var/www/yanzhidao/logs/api-out.log',
    error_file: '/var/www/yanzhidao/logs/api-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 进程管理
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    
    // 其他
    kill_timeout: 5000,
    listen_timeout: 3000,
    shutdown_with_message: true
  }]
}
