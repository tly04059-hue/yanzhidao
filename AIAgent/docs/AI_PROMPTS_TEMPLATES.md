# AI编程工具Prompt模板集
# 复制这些Prompt,直接粘贴到Cursor/Copilot/Claude Code中使用

---

## 📦 Phase 1: 数据准备

### Prompt 1.1: 补充院校数据

```
我有一个院校推荐项目,需要补充院校数据。

已有文件:
- schools_data_v2_optimized.json (包含8所示例院校)
- MBA_MPA报名学员信息.xlsx (包含56所MBA和54所MPA院校信息)

任务:
1. 读取Excel中的MPA sheet,提取以下字段:
   - 院校名称 → name
   - 学费(万) → tuition_min (转为"元",保留2位小数)
   - 择校推荐 → 择校推荐
   - 25年复试线 → 复试线_2025
   
2. 基于schools_data_v2_optimized.json中前8所院校的格式,为每所新院校生成完整配置

3. match_weights配置规则:
   - 参考同类型院校(例如:新院校是211,参考川农的配置)
   - 学费决定budget_*权重: 
     * 学费<5万 → budget_40_70k=10
     * 学费5-7万 → budget_40_70k=10, budget_70_90k=7
     * 学费7-9万 → budget_70_90k=10
   - 复试线决定difficulty_*权重:
     * <165 → difficulty_easy=10
     * 165-175 → difficulty_medium=10
     * >175 → difficulty_hard=10
   
4. 输出: 完整的JSON数组,包含42所院校

注意:
- 所有小数保留2位
- tuition_min单位是"元",不是"万"
- 严格遵循JSON格式,不要有语法错误
```

---

### Prompt 1.2: 验证数据格式

```
检查生成的院校数据JSON是否符合以下要求:

1. 所有数字字段是否保留2位小数
2. tuition_min是否是正确的单位(元)
3. match_weights是否包含所有必需的维度
4. 是否有重复的院校ID
5. JSON语法是否正确(括号、逗号)

如果有错误,请指出并修正。
```

---

## 💾 Phase 2: 数据库配置

### Prompt 2.1: 创建数据库

```
我需要在Supabase中创建数据库表。

已有文件:
- database-schema-optimized.sql

任务:
1. 帮我把这个SQL脚本转换为可在Supabase SQL Editor中执行的格式
2. 确保所有索引都创建成功
3. 生成验证SQL,检查表是否创建成功

执行后,帮我生成以下验证脚本:
```sql
-- 验证表结构
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- 验证索引
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public';

-- 验证RLS策略
SELECT tablename, policyname FROM pg_policies;
```
```

---

### Prompt 2.2: 导入院校数据

```
我需要将42所院校数据导入到Supabase的schools表。

已有:
- schools_data_v2_optimized.json (42所院校的完整数据)

任务:
1. 生成批量导入SQL脚本
2. 每条INSERT语句包含: id, name, short_name, data (JSONB)
3. data字段包含除id/name/short_name外的所有字段

示例格式:
```sql
INSERT INTO schools (id, name, short_name, data) VALUES
(1, '四川大学', '川大', '{"location": "成都", "tuition_min": 84000, ...}'::jsonb);
```

注意:
- JSONB中的字符串要用双引号
- 单引号需要转义为''
- 保证所有42所院校都导入
```

---

## 🎨 Phase 3: 前端集成

### Prompt 3.1: 集成测评页面

```
我需要将测评逻辑集成到HTML页面。

已有文件:
- 03_测一测答题页.html (静态HTML)
- assessment_questions_v2.js (题目配置)
- page-03-assessment-script.js (交互逻辑)

任务:
1. 将assessment_questions_v2.js和page-03-assessment-script.js的代码整合到HTML中
2. 保持HTML原有的样式和结构
3. 实现以下功能:
   - 根据URL参数?q=N显示对应题目
   - 用户选择选项后高亮
   - Q5题特殊处理: 如果选项有followup,显示子问题
   - 点击"下一题"跳转到下一题
   - 最后一题显示"生成方案"按钮
   - 提交时调用API: /functions/v1/assess

注意:
- 不要修改HTML的class名称
- 保持原有的CSS样式
- 在Console中打印调试信息

集成后的代码应该能直接在浏览器中运行,无需编译。
```

---

### Prompt 3.2: 集成结果页面

```
我需要将AI推荐结果动态渲染到结果页面。

已有文件:
- 04_诊断结果页.html (静态HTML)
- page-04-result-script.js (渲染逻辑)

任务:
1. 从URL参数获取assessment_id
2. 从Supabase读取测评结果
3. 动态渲染:
   - 推荐路径标题
   - TOP 3院校卡片
   - 投入收益指标
   - 匹配分数(百分比显示)

关键代码片段:
```javascript
// 读取测评结果
const { data } = await supabase
  .from('assessments')
  .select('*')
  .eq('id', assessmentId)
  .single();

// 渲染院校卡片
data.recommended_schools.forEach(school => {
  const card = `
    <div class="school-card">
      <div class="sc-name">${school.school_name}</div>
      <div class="sc-match">${school.match_score}%</div>
    </div>
  `;
  container.innerHTML += card;
});
```

确保数据正确显示,所有数字保留2位小数。
```

---

## 🔌 Phase 4: 后端API

### Prompt 4.1: 创建测评API

```
我需要创建Supabase Edge Function处理测评请求。

已有文件:
- prompts_v2.js (AI提示词模板)

任务:
创建Edge Function: assess

输入:
```json
{
  "user_id": "user_xxx",
  "answers": {
    "q1": "32-35岁",
    "q2": "公务员",
    ...
  },
  "tags": ["age_32_35", "position_gov", ...]
}
```

处理流程:
1. 从schools表读取42所院校数据
2. 调用generateMatchPrompt_v2生成提示词
3. 调用Anthropic API (claude-sonnet-4-20250514)
4. 解析返回的JSON
5. 保存到assessments表
6. 返回assessment_id和推荐结果

代码框架:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'
import Anthropic from 'npm:@anthropic-ai/sdk'

serve(async (req) => {
  const { user_id, answers, tags } = await req.json();
  
  // 读取院校数据
  const { data: schools } = await supabase.from('schools').select('*');
  
  // 生成提示词
  const prompt = generateMatchPrompt_v2(answers, tags, schools);
  
  // 调用Claude API
  const message = await anthropic.messages.create({...});
  
  // 解析并保存
  const result = JSON.parse(message.content[0].text);
  
  const { data: assessment } = await supabase
    .from('assessments')
    .insert({...})
    .select()
    .single();
  
  return new Response(JSON.stringify({
    success: true,
    assessment_id: assessment.id,
    result
  }));
});
```

确保错误处理和环境变量配置。
```

---

### Prompt 4.2: 部署Edge Function

```
帮我生成部署Edge Function的完整步骤:

1. 安装Supabase CLI
2. 登录Supabase
3. 创建函数目录结构
4. 部署函数
5. 设置环境变量
6. 测试API

提供详细的命令和验证方法。
```

---

## 🧪 Phase 5: 测试验证

### Prompt 5.1: 生成测试脚本

```
帮我生成完整的端到端测试脚本。

测试场景:
1. 用户A: 32岁公务员,预算8万,愿意考试 → 应推荐川大/电子科大
2. 用户B: 38岁公务员,预算4万,不想考试 → 应推荐党校
3. 用户C: 30岁事业编,预算6万,只要证书 → 应推荐川农/川师

测试脚本应该:
1. 模拟用户答题
2. 调用API
3. 验证返回结果是否符合预期
4. 打印详细日志

使用Node.js编写,可直接执行。
```

---

### Prompt 5.2: 调试错误

```
我的测评功能遇到以下错误:

[粘贴错误信息]

相关代码:
[粘贴出错的代码片段]

请帮我:
1. 分析错误原因
2. 提供修复方案
3. 给出调试建议

参考文档:
- AI_IMPLEMENTATION_GUIDE.md 中的"常见问题与AI解决方案"部分
```

---

## 📊 Phase 6: 数据看板

### Prompt 6.1: 生成数据统计

```
帮我写SQL查询,统计以下指标:

1. 今日新增用户数
2. 今日完成测评数
3. 今日留资转化率 = 留资数 / 测评数
4. 7日推荐准确率 = (用户选择的院校在TOP 3中的次数) / 总留资数
5. 热门院校TOP 10 (按heat_score排序)

每个查询都要包含:
- 清晰的注释
- 结果格式说明
- 示例输出
```

---

## 🎯 Phase 7: 优化迭代

### Prompt 7.1: 分析推荐偏差

```
我有一批真实用户数据,发现推荐结果与用户最终选择有偏差。

数据:
[粘贴CSV或JSON数据]

任务:
1. 分析哪些院校被推荐了,但用户没选
2. 分析哪些院校用户选了,但没被推荐
3. 找出match_weights配置的问题
4. 提供调整建议

输出格式:
- 偏差分析表格
- 具体的match_weights调整方案
- 预期改进效果
```

---

## 💡 通用Prompt模板

```
# 当你遇到任何问题时,使用这个模板

我在实施"研知道选校"项目时遇到问题:

【问题描述】
[清楚描述问题]

【期望结果】
[你想要达到什么效果]

【已尝试的方法】
[你已经试过什么]

【相关文件】
[涉及哪些文件]

【错误信息】
[如有报错,粘贴完整信息]

请参考项目文档:
- AI_IMPLEMENTATION_GUIDE.md
- schools_data_v2_optimized.json
- assessment_questions_v2.js
- prompts_v2.js

帮我解决这个问题,提供详细步骤。
```

---

**使用建议:**

1. **复制整个Prompt块** (包括```标记内的内容)
2. **粘贴到AI编程工具的Chat窗口**
3. **等待AI生成代码**
4. **检查并执行代码**
5. **如有错误,使用"调试错误"Prompt**

**Cursor快捷键:**
- Ctrl+L: 打开Chat
- Ctrl+K: 快速编辑
- Ctrl+I: 内联对话

**每完成一个Phase,记得提交Git!**
