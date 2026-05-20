# AI编程工具实施指南 - 研知道选校项目

> 本文档专为使用Cursor/GitHub Copilot/Claude Code等AI编程工具设计
> 目标:让AI助手能够快速理解项目,准确实现代码集成

---

## 📋 项目概述

**项目名称:** 研知道选校 (考研院校智能推荐系统)  
**目标用户:** 四川、重庆地区的体制内人员(公务员/事业编)  
**核心功能:** 8题测评 → AI智能匹配 → 推荐TOP 3院校  
**技术栈:** HTML/CSS/JavaScript (前端) + Supabase (后端) + Claude API (AI)

---

## 🎯 核心概念

### 1. match_weights匹配算法

**原理:** 给每所院校配置一个"打分表",根据用户画像打分,分数高的推荐

**示例:**
```javascript
// 用户画像
const user = {
  age: "32-35岁",        // → 标签: age_32_35
  position: "公务员",     // → 标签: position_gov
  budget: "7-9万",       // → 标签: budget_70_90k
  exam: "可以考"         // → 标签: exam_willing
};

// 院校配置
const school = {
  name: "四川大学",
  tuition: 84000,
  match_weights: {
    age_32_35: 10,        // 32-35岁 → 10分
    position_gov: 10,     // 公务员 → 10分
    budget_70_90k: 10,    // 预算7-9万 → 10分
    exam_willing: 10      // 愿意考试 → 10分
  }
};

// 计算匹配分数
const score = 10 + 10 + 10 + 10 = 40分
const normalized_score = min(40, 100) = 40分

// 归一化到100分制
const match_score = (40 / 100) * 100 = 40%
```

### 2. 8题测评配置

**核心文件:** `assessment_questions_v2.js`

**特殊点:**
- Q5(目标)有子问题: 选"提拔"后,会追问"对学校要求?"
- 每个选项都有对应的`tag`,用于匹配院校的match_weights
- Q7(考试意愿)额外提取`difficulty_tag`

### 3. 数据流

```
用户填8题 
  ↓
extractTagsFromAnswers() 提取标签
  ↓
调用Supabase Edge Function: /assess
  ↓
Edge Function调用Claude API,传入:
  - 用户答案
  - 用户标签
  - 42所院校数据
  ↓
Claude根据prompts_v2.js中的提示词匹配
  ↓
返回TOP 3推荐
  ↓
保存到assessments表
  ↓
跳转到结果页展示
```

---

## 📁 文件说明与AI提示

### **文件1: schools_data_v2_optimized.json**

**作用:** 院校数据模板,包含8所示例院校

**AI实施任务:**
```
任务: 基于这个模板,补充剩余34所院校数据

数据来源:
- 院校基本信息: 从用户提供的Excel中提取
- match_weights配置: 参考已有的8所示例

关键点:
1. 所有小数保留2位 (例: 8.40 而非 8.4)
2. tuition_min/max单位是"元" (84000 = 8.4万)
3. 复试线_2025字段名包含下划线
4. admission_rate用小数表示 (0.60 = 60%)

请严格遵循JSON格式,不要遗漏逗号或括号
```

---

### **文件2: assessment_questions_v2.js**

**作用:** 8题测评的题目和选项配置

**AI实施任务:**
```
任务: 将此配置集成到HTML页面 03_测一测答题页.html

实施步骤:
1. 在HTML中创建一个<script src="assessment_questions_v2.js">引用
2. 读取QUESTIONS_V2数组
3. 根据URL参数?q=N动态渲染对应题目
4. 特殊处理Q5: 
   - 用户选择选项后,检查该选项是否有followup
   - 如有,显示子问题,等待用户选择
   - 子问题答案保存到answers.q5_followup
5. 最后一题(Q8)时,调用extractTagsFromAnswers()提取标签
6. 提交到后端API: /assess

关键代码片段:
```javascript
// 渲染题目
function renderQuestion(questionId) {
  const q = QUESTIONS_V2.find(item => item.id === questionId);
  // 渲染q.question, q.options
}

// 选择选项
function selectOption(option) {
  answers[`q${currentQuestion}`] = option.value;
  
  // 检查是否有子问题
  if (option.followup) {
    showFollowup(option.followup);
  } else {
    nextQuestion();
  }
}

// 提交测评
async function submitAssessment() {
  const tags = extractTagsFromAnswers(answers);
  
  await fetch('/functions/v1/assess', {
    method: 'POST',
    body: JSON.stringify({
      user_id: getUserId(),
      answers: answers,
      tags: tags
    })
  });
}
```
```

---

### **文件3: prompts_v2.js**

**作用:** AI匹配提示词模板

**AI实施任务:**
```
任务: 在Supabase Edge Function中使用此提示词调用Claude API

实施步骤:
1. 创建Edge Function: assess
2. 从请求中获取 answers, tags
3. 从数据库读取42所院校数据
4. 调用generateMatchPrompt_v2()生成提示词
5. 调用Anthropic API
6. 解析返回的JSON
7. 保存到assessments表

关键代码片段:
```typescript
// supabase/functions/assess/index.ts
import { generateMatchPrompt_v2 } from './prompts_v2.js';

const { answers, tags } = await req.json();

// 读取院校数据
const { data: schools } = await supabase
  .from('schools')
  .select('*');

// 生成提示词
const prompt = generateMatchPrompt_v2(answers, tags, schools);

// 调用Claude API
const message = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  temperature: 0.3,
  messages: [{ role: "user", content: prompt }]
});

// 解析返回
const result = JSON.parse(message.content[0].text);

// 保存
await supabase.from('assessments').insert({
  user_id,
  q1_age: answers.q1,
  q2_position: answers.q2,
  // ... 其他字段
  recommended_path: result.recommended_path,
  recommended_schools: result.recommendations
});
```

注意事项:
1. 必须设置环境变量: ANTHROPIC_API_KEY
2. 返回的JSON可能被```json包裹,需要清理
3. 错误处理: 如果AI返回格式错误,要有友好提示
```

---

### **文件4: database-schema-optimized.sql**

**作用:** 数据库完整DDL

**AI实施任务:**
```
任务: 在Supabase SQL Editor中执行此脚本

实施步骤:
1. 登录Supabase Dashboard
2. 进入SQL Editor
3. 粘贴整个脚本
4. 点击Run
5. 检查是否有错误

验证:
SELECT * FROM schools;
SELECT * FROM assessments;

如果表已存在,先DROP再重新创建:
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
然后重新执行脚本
```

---

### **文件5: frontend-global.js**

**作用:** 全局配置和工具函数

**AI实施任务:**
```
任务: 将此文件作为全局依赖,在所有HTML页面中引入

实施步骤:
1. 创建文件 /js/config.js
2. 粘贴frontend-global.js的内容
3. 在每个HTML页面的<head>中添加:
   <script src="js/config.js"></script>

关键配置:
const CONFIG = {
  SUPABASE_URL: 'YOUR_PROJECT_URL',     // 替换为实际URL
  SUPABASE_ANON_KEY: 'YOUR_ANON_KEY'    // 替换为实际KEY
};

如何获取这些值:
1. Supabase Dashboard → Settings → API
2. 复制Project URL
3. 复制anon/public key
```

---

### **文件6-10: 页面脚本**

**作用:** 各页面的交互逻辑

**AI实施任务:**
```
任务: 将脚本集成到对应HTML页面

实施步骤:
1. 打开HTML文件(例: 03_测一测答题页.html)
2. 在</body>前插入:
   <script src="js/config.js"></script>
   <script src="js/assessment_questions_v2.js"></script>
   <script>
   // 粘贴 page-03-assessment-script.js 的内容
   </script>

3. 检查页面中的DOM元素class/id是否与脚本中的选择器匹配
4. 如果不匹配,需要调整选择器

示例:
脚本中: document.querySelector('.cta-next')
HTML中: <button class="cta-next">下一题</button>
如果HTML中class不同,需要修改

调试:
打开浏览器Console,查看是否有错误
```

---

## 🔧 常见问题与AI解决方案

### 问题1: API返回401 Unauthorized

**AI解决步骤:**
```javascript
// 检查config.js中的配置
console.log(CONFIG.SUPABASE_URL);
console.log(CONFIG.SUPABASE_ANON_KEY);

// 确认fetch请求头
fetch(url, {
  headers: {
    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
    'apikey': CONFIG.SUPABASE_ANON_KEY,  // Supabase需要两个
    'Content-Type': 'application/json'
  }
});
```

### 问题2: JSON解析失败

**AI解决步骤:**
```javascript
// 在解析前打印原始文本
console.log('AI返回:', text);

// 清理可能的包裹符号
let clean = text.trim();
if (clean.startsWith('```json')) {
  clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
}

// 提取JSON对象
const jsonMatch = clean.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  console.error('无法提取JSON');
  return;
}

const result = JSON.parse(jsonMatch[0]);
```

### 问题3: 院校列表为空

**AI解决步骤:**
```javascript
// 1. 检查数据库
SELECT COUNT(*) FROM schools;

// 2. 检查API调用
const { data, error } = await supabase
  .from('schools')
  .select('*');
  
console.log('院校数据:', data);
console.log('错误:', error);

// 3. 检查RLS策略
// 确保schools表启用了PUBLIC SELECT权限
```

---

## 📝 AI编程工具使用技巧

### **在Cursor中使用本文档**

```
1. 打开Cursor
2. Ctrl+L (打开Chat)
3. 输入:
   "@IMPLEMENTATION_GUIDE.md 帮我实现第一步:补充院校数据"
   
4. Cursor会读取文档,理解上下文,给出代码

5. 如果出错,提供错误信息:
   "执行时报错: [粘贴错误信息]"
```

### **分步实施建议**

```
Step 1: 数据准备 (1小时)
提示词: "读取 schools_data_v2_optimized.json,帮我基于前8所院校的格式,生成剩余34所的配置框架"

Step 2: 数据库创建 (30分钟)
提示词: "读取 database-schema-optimized.sql,帮我在Supabase中执行,并验证表是否创建成功"

Step 3: 前端集成 (2小时)
提示词: "读取 page-03-assessment-script.js,帮我集成到 03_测一测答题页.html,保持原有样式"

Step 4: 后端API (2小时)
提示词: "读取 prompts_v2.js,帮我创建Supabase Edge Function,实现测评提交逻辑"

Step 5: 端到端测试 (1小时)
提示词: "帮我写一个测试脚本,模拟用户完成8题测评,验证整个流程"
```

---

## ✅ 验证清单

完成实施后,让AI帮你执行这些检查:

```
[ ] 数据库: 42所院校数据已导入
[ ] 数据库: 所有表创建成功,索引正常
[ ] 前端: 8题测评可正常答题
[ ] 前端: Q5子问题正常显示
[ ] 前端: 提交后正确跳转到加载页
[ ] 后端: Edge Function部署成功
[ ] 后端: Claude API调用正常
[ ] 后端: 数据正确保存到assessments表
[ ] 端到端: 完整流程走通
[ ] 端到端: 推荐结果准确(与预期一致)
```

---

## 🎓 给AI的最终指令

```
你是一个资深全栈工程师,现在要实施"研知道选校"项目。

你已经阅读了:
- schools_data_v2_optimized.json (院校数据模板)
- assessment_questions_v2.js (8题配置)
- prompts_v2.js (AI提示词)
- database-schema-optimized.sql (数据库DDL)
- frontend-global.js (全局工具函数)
- page-XX-script.js (页面脚本)

请严格按照这些文件的逻辑实施,不要自行发挥。

如果遇到问题:
1. 先检查文件中的注释和说明
2. 打印中间变量,定位问题
3. 参考"常见问题与AI解决方案"部分

开始实施!
```

---

**文档结束**

这份文档应该足够AI编程工具理解整个项目并准确实施。如有疑问,请参考其他技术文档。
