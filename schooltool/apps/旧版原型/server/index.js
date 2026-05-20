const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 频率限制：同一IP 10分钟最多30次请求
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use('/api', limiter);

// 静态文件
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/prototype', express.static(path.join(__dirname, '..', 'prototype')));

// API路由
app.use('/api', routes);

// SPA 路由：只处理根路径
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
