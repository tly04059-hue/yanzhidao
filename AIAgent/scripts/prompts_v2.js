// prompts_v2.js - 调整后的AI提示词模板

/**
 * 核心匹配算法 v2.0
 * 
 * 主要改进:
 * 1. 增加"上岸难度"维度(difficulty_easy/medium/hard)
 * 2. 增加"目标强度"维度(goal_strong/weak)
 * 3. 预算区间细化为5档(0-40k, 40-70k, 70-90k, 90-160k, 160k+)
 * 4. 强化"性价比"优先逻辑
 * 5. 所有小数保留2位,百分比优先
 */

export function generateMatchPrompt_v2(userAnswers, userTags, schoolsData) {
  return `
你是川渝地区考研择校专家,有10年经验。现在要为用户推荐最合适的院校。

# 用户答案
年龄: ${userAnswers.q1}
职务: ${userAnswers.q2}
学历: ${userAnswers.q3}
预算: ${userAnswers.q4}
目标: ${userAnswers.q5}${userAnswers.q5_followup ? ' → ' + userAnswers.q5_followup : ''}
时间: ${userAnswers.q6}
考试意愿: ${userAnswers.q7}
地点: ${userAnswers.q8}

# 用户标签 (从答案中提取)
${userTags.join(', ')}

# 可选院校库 (${schoolsData.length}所)
${JSON.stringify(schoolsData, null, 2)}

# 匹配规则 (严格按此执行,不得擅自调整)

## 第1层: 硬性筛选 (不符合直接排除)

1. **预算红线**
   院校学费必须在用户预算±20%内。
   例: 用户预算7-9万 → 院校学费必须在5.6-10.8万区间内
   
2. **考试意愿红线**
   - 用户选"不想考试" → 只推荐免联考(党校系/同等学力)
   - 用户选"可以考试" → 全部可选
   - 用户选"中立" → 管综和党校都可以推荐,但党校优先

## 第2层: 加权打分 (基于match_weights)

### 匹配算法:

对每所通过硬性筛选的院校,执行以下步骤:

**步骤1: 提取用户标签对应的权重分数**

从用户标签中,找到该院校match_weights中对应的权重值,累加。

示例:
用户标签: age_32_35, position_gov, budget_70_90k, goal_promotion, goal_strong, exam_willing

某院校(川大)的match_weights:
{
  "age_32_35": 10,
  "position_gov": 10,
  "budget_70_90k": 10,
  "goal_promotion": 10,
  "goal_strong": 10,
  "exam_willing": 10
}

累加分数 = 10+10+10+10+10+10 = 60分

**步骤2: 归一化到0-100分**

match_score = (累加分数 / 理论最高分) × 100

理论最高分 ≈ 100 (假设所有维度都是10分)
实际计算: match_score = min(累加分数, 100)

**步骤3: 调整规则(重要!)**

基于真实数据洞察,对分数进行微调:

1. **性价比加成**
   如果用户选择"只要证书就行" (goal_weak标签),且院校复试线<170:
   match_score += 5分

2. **名校刚需加成**
   如果用户选择"必须985名校" (goal_strong标签),且院校是985:
   match_score += 5分

3. **预算超支惩罚**
   如果院校学费超过用户预算上限10%-20%:
   match_score -= 3分

## 第3层: 排序与推荐

1. 按match_score降序排列
2. 选出TOP 3
3. 对每所院校生成推荐理由

## 第4层: 推荐理由生成规则

对TOP 3的每所院校,生成3个推荐理由,必须遵循:

1. **第1条理由: 学费与预算的关系**
   - 格式: "学费X万,符合你的预算"
   - 必须包含具体数字

2. **第2条理由: 院校核心优势**
   - 985: "985名校,川渝地区认可度最高"
   - 211: "211双一流,性价比高"
   - 党校: "免联考,体制内认可"
   - 性价比院校: "复试线X分,好上岸"

3. **第3条理由: 用户诉求匹配点**
   - 如果用户"不想考试" → "免联考,无需备考压力"
   - 如果用户"只要证书" → "录取率XX%,上岸概率高"
   - 如果用户"必须985" → "985双证,遴选有优势"

## 第5层: 投入收益计算

对每所推荐院校,估算:

### 投入 (investment)

**时间投入:**
- 管综系需联考: "周末1天/周,约6个月备考"
- 党校免联考: "周末1天/周,无需备考"

**金钱投入:**
学费X万 + 考试费500 + 资料约2000
格式: 保留2位小数,例如"8.40万"而非"8.4万"

### 收益 (return)

**短期收益 (1-2年内):**
- 提拔: "满足科级提拔硬性学历要求"
- 遴选: "具备市直遴选报考资格"
- 转岗: "拓宽岗位选择面"

**长期收益 (3-5年):**
- 985: "打开遴选通道,拓宽职业天花板"
- 211: "体制内认可度高,提拔有优势"
- 党校: "满足基本要求,成本最低"

## 输出格式要求

⚠️ 严格要求:

1. **仅返回JSON,无其他文字**
2. **不要用```json包裹**
3. **所有小数保留2位** (例: 8.40 而非 8.4)
4. **百分比用整数表示** (例: 92 而非 0.92)

输出结构:

{
  "recommended_path": "非全日制MPA",
  "path_reason": "32岁在职,提拔目标,MPA是最佳平衡点",
  "recommendations": [
    {
      "school_name": "四川大学",
      "program": "MPA非全",
      "match_score": 92,
      "match_reasons": [
        "学费8.40万,符合你的预算范围",
        "985名校,川渝地区认可度最高",
        "提前面试制,通过率约60%"
      ],
      "investment": {
        "time": "周末1天/周,约6个月备考",
        "money": "学费8.40万 + 考试费0.05万 + 资料约0.20万"
      },
      "return": {
        "short_term": "满足科级提拔硬性学历要求",
        "long_term": "打开市直遴选通道,拓宽职业天花板"
      },
      "tuition": 8.40,
      "duration": 3.0,
      "admission_rate": 60
    },
    // ... TOP 2, TOP 3
  ],
  "general_advice": "你的情况推荐管综系MPA,虽然需要备考,但双证含金量高,适合体制内长期发展。如果实在不想考试,可以考虑党校系,但社会认可度有限。"
}

# 关键要求 (必须遵守)

1. ✅ match_score必须基于match_weights计算,不能随意编造
2. ✅ 如果用户"不想考试",绝不推荐管综系
3. ✅ 如果用户"只要证书",优先推荐性价比院校(川农/川师等)
4. ✅ 如果用户"必须985",不要推荐211或党校
5. ✅ 推荐理由必须引用具体数字(学费/复试线/录取率)
6. ✅ 避免官话套话,语气像朋友建议
7. ✅ 所有金额保留2位小数
8. ✅ 所有百分比用整数表示

# 常见错误 (严禁犯错)

❌ 错误1: 用户"不想考试"还推荐川大MPA
❌ 错误2: 用户"只要证书"却推荐最难考的院校
❌ 错误3: 用户预算4-7万,推荐学费8.4万的院校
❌ 错误4: 推荐理由空泛,没有具体数字
❌ 错误5: 返回```json包裹的JSON

现在开始推荐:
`;
}

// 使用示例
import Anthropic from '@anthropic-ai/sdk';

export async function getSchoolRecommendations_v2(userAnswers, userTags, schoolsData) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    temperature: 0.3, // 降低随机性,保证一致性
    messages: [{
      role: "user",
      content: generateMatchPrompt_v2(userAnswers, userTags, schoolsData)
    }]
  });
  
  const text = message.content[0].text;
  
  // 提取JSON (可能有```json包裹,需要清理)
  let jsonText = text.trim();
  
  // 移除可能的```json标记
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // 提取JSON对象
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI返回格式错误,无法提取JSON');
  }
  
  const result = JSON.parse(jsonMatch[0]);
  
  // 验证返回数据
  if (!result.recommendations || result.recommendations.length === 0) {
    throw new Error('AI未返回推荐结果');
  }
  
  return result;
}
