# match_weights配置完整指南 v2.0
# 基于579人党校学员真实数据 + 19人管综学员需求优化

---

## 📊 数据洞察总结

### 真实数据1: 党校学员画像 (579人)

```
年龄分布:
- 平均年龄: 33.66岁
- 35岁以上: 36.10% (209人)
- 32-35岁: 18.83% (109人)
- 28-32岁: 26.25% (152人) ⭐ 最大群体
- 25-28岁: 18.83% (109人)

关键发现: 
❌ 原假设"党校主要35+"错误
✅ 实际28-35岁占45%,是主力军

工作单位:
- 公务员/政府部门: 主力
- 事业单位: 第二大
- 国企: 少量
- 民企: 几乎为0

学历:
- 本科(统考): 55%
- 本科(小自考/成教/网教): 45%
```

### 真实数据2: MBA/MPA学员需求 (19人)

```
高频诉求:
1. "分数低" - 出现8次
2. "学费低" - 出现7次
3. "好上岸" - 出现5次
4. "只要证书" - 出现4次

典型案例:
- 蔡红梅: "MPA,分数和学费低,好上岸"
- 张宗会: "学费和分数要求越低越好,只要证书"
- 辜欢: "MPA 低分低学费,离雅安近"

关键发现:
❌ 原假设"用户追求985名校"错误
✅ 实际更关心"性价比",不是"名校光环"
```

---

## 🎯 调整后的配置原则

### 原则1: 年龄权重 (基于579人数据)

**党校系:**
```json
"age_25_28": 3,     // 19% → 给3分(太年轻,建议读管综)
"age_28_32": 8,     // 26% ⭐ 主力军 → 从5分调到8分
"age_32_35": 10,    // 19% ⭐ 黄金年龄 → 从8分调到10分
"age_35_plus": 10   // 36% → 保持10分
```

**管综系(985):**
```json
"age_25_28": 5,     // 可以,但建议读全日制
"age_28_32": 10,    // 黄金年龄段
"age_32_35": 10,    // 依然很适合
"age_35_plus": 5    // 略有年龄劣势
```

**管综系(211性价比):**
```json
"age_25_28": 7,     // 年轻人优势
"age_28_32": 10,
"age_32_35": 10,
"age_35_plus": 6
```

---

### 原则2: 预算权重 (基于真实学费分布)

**预算区间调整:**
```
旧: 0-50k, 50-80k, 80-100k, 100k+
新: 0-40k, 40-70k, 70-90k, 90-160k, 160k+
```

**配置逻辑:**

**党校 (学费2.4-3.5万):**
```json
"budget_0_40k": 10,      // 完美匹配
"budget_40_70k": 5,      // 预算充足,建议读211
"budget_70_90k": 2,      // 太浪费
"budget_90_160k": 0,
"budget_160k_plus": 0
```

**211性价比 (学费4.6-6.9万,如川农/川师):**
```json
"budget_0_40k": 0,       // 买不起
"budget_40_70k": 10,     // ⭐ 性价比之王
"budget_70_90k": 7,      // 有余钱,可考虑985
"budget_90_160k": 5,
"budget_160k_plus": 3
```

**985 MPA (学费8.4万):**
```json
"budget_0_40k": 0,
"budget_40_70k": 2,      // 勉强够,压力大
"budget_70_90k": 10,     // 最匹配
"budget_90_160k": 8,
"budget_160k_plus": 5
```

**985 MBA (学费15-22万):**
```json
"budget_0_40k": 0,
"budget_40_70k": 0,
"budget_70_90k": 0,
"budget_90_160k": 10,    // 9-16万正好
"budget_160k_plus": 10   // 充足
```

---

### 原则3: 目标权重 (新增goal_strong/weak维度)

**基于"只要证书"vs"必须985"的区分:**

**川大985:**
```json
"goal_promotion": 10,
"goal_selection": 10,
"goal_transfer": 8,
"goal_prestige": 10,
"goal_strong": 10,       // 🆕 必须985 → 强推
"goal_weak": 5           // 🆕 只要证书 → 不太推荐(浪费)
```

**川农211性价比:**
```json
"goal_promotion": 10,
"goal_selection": 8,
"goal_transfer": 7,
"goal_prestige": 5,
"goal_strong": 3,        // 🆕 要985的看不上211
"goal_weak": 10          // 🆕 只要证书的最爱
```

**党校:**
```json
"goal_promotion": 10,
"goal_selection": 4,     // 单证劣势
"goal_transfer": 2,
"goal_prestige": 0,      // 不适合镀金
"goal_strong": 0,        // 🆕 要名校的别来
"goal_weak": 10          // 🆕 只要证书的最佳选择
```

---

### 原则4: 上岸难度权重 (新增difficulty维度)

**基于复试线和录取率:**

**川农 MPA (复试线164,录取率75%):**
```json
"difficulty_easy": 10,   // 🆕 最好上岸
"difficulty_medium": 5,
"difficulty_hard": 0
```

**川大 MPA (复试线180+,录取率60%):**
```json
"difficulty_easy": 3,
"difficulty_medium": 7,
"difficulty_hard": 10    // 🆕 有挑战
```

**党校 (免联考,录取率90%):**
```json
"difficulty_easy": 10,   // 🆕 免联考优势
"difficulty_medium": 5,
"difficulty_hard": 0
```

**匹配逻辑:**

用户选"不想考试" → 提取difficulty_easy标签 → 党校/川农得高分

用户选"可以考" → 提取difficulty_medium标签 → 所有院校都适合

---

## 📖 完整配置案例

### 案例1: 川大MPA (985名校)

```json
{
  "name": "四川大学",
  "tuition_min": 84000,
  "复试线_2025": 180,
  "admission_rate": 0.60,
  
  "match_weights": {
    // 年龄
    "age_25_28": 5,
    "age_28_32": 10,
    "age_32_35": 10,
    "age_35_plus": 5,
    
    // 预算 (学费8.4万)
    "budget_0_40k": 0,
    "budget_40_70k": 2,
    "budget_70_90k": 10,
    "budget_90_160k": 8,
    "budget_160k_plus": 5,
    
    // 目标
    "goal_promotion": 10,
    "goal_selection": 10,
    "goal_transfer": 8,
    "goal_prestige": 10,
    "goal_strong": 10,    // 必须985 → 强推
    "goal_weak": 5,       // 只要证书 → 不太推(浪费)
    
    // 职务
    "position_gov": 10,
    "position_institution": 9,
    "position_soe": 8,
    "position_private": 6,
    
    // 学历
    "education_junior": 5,
    "education_bachelor": 10,
    "education_master": 8,
    
    // 时间
    "time_abundant": 8,
    "time_limited": 10,
    "time_tight": 5,
    
    // 考试
    "exam_willing": 10,
    "exam_neutral": 5,
    "exam_unwilling": 0,
    
    // 难度 (复试线180,有挑战)
    "difficulty_easy": 3,
    "difficulty_medium": 7,
    "difficulty_hard": 10,
    
    // 地点
    "location_local": 10,
    "location_province": 7,
    "location_neighbor": 5,
    "location_remote": 3
  }
}
```

---

### 案例2: 川农MPA (211性价比之王)

```json
{
  "name": "四川农业大学",
  "tuition_min": 69000,
  "复试线_2025": 164,
  "admission_rate": 0.75,
  
  "match_weights": {
    // 年龄
    "age_25_28": 7,
    "age_28_32": 10,
    "age_32_35": 10,
    "age_35_plus": 6,
    
    // 预算 (学费6.9万)
    "budget_0_40k": 0,
    "budget_40_70k": 10,   // ⭐ 性价比王
    "budget_70_90k": 7,
    "budget_90_160k": 5,
    "budget_160k_plus": 3,
    
    // 目标
    "goal_promotion": 10,
    "goal_selection": 8,
    "goal_transfer": 7,
    "goal_prestige": 5,
    "goal_strong": 3,      // 要985的看不上
    "goal_weak": 10,       // ⭐ 只要证书的最爱
    
    // 职务
    "position_gov": 10,
    "position_institution": 10,
    "position_soe": 8,
    "position_private": 6,
    
    // 学历
    "education_junior": 6,
    "education_bachelor": 10,
    "education_master": 7,
    
    // 时间
    "time_abundant": 7,
    "time_limited": 10,
    "time_tight": 7,
    
    // 考试
    "exam_willing": 10,
    "exam_neutral": 7,
    "exam_unwilling": 0,
    
    // 难度 (复试线164,好上岸)
    "difficulty_easy": 10,  // ⭐ 最大优势
    "difficulty_medium": 5,
    "difficulty_hard": 0,
    
    // 地点
    "location_local": 10,
    "location_province": 10,
    "location_neighbor": 7,
    "location_remote": 4
  }
}
```

---

### 案例3: 四川省委党校 (免联考)

```json
{
  "name": "中共四川省委党校",
  "tuition_min": 24000,
  "复试线_2025": 213,
  "admission_rate": 0.90,
  
  "match_weights": {
    // 年龄 (基于579人数据调整)
    "age_25_28": 3,
    "age_28_32": 8,        // ⬆️ 从5调到8
    "age_32_35": 10,       // ⬆️ 从8调到10
    "age_35_plus": 10,
    
    // 预算 (学费2.4万)
    "budget_0_40k": 10,    // ⭐ 最便宜
    "budget_40_70k": 5,
    "budget_70_90k": 2,
    "budget_90_160k": 0,
    "budget_160k_plus": 0,
    
    // 目标
    "goal_promotion": 10,
    "goal_selection": 4,
    "goal_transfer": 2,
    "goal_prestige": 0,
    "goal_strong": 0,      // 要名校的别来
    "goal_weak": 10,       // ⭐ 只要证书的最佳
    
    // 职务
    "position_gov": 10,
    "position_institution": 8,
    "position_soe": 5,
    "position_private": 0,
    
    // 学历
    "education_junior": 10,
    "education_bachelor": 10,
    "education_master": 3,
    
    // 时间
    "time_abundant": 5,
    "time_limited": 10,
    "time_tight": 10,
    
    // 考试
    "exam_willing": 0,
    "exam_neutral": 5,
    "exam_unwilling": 10,  // ⭐ 免联考优势
    
    // 难度
    "difficulty_easy": 10,
    "difficulty_medium": 5,
    "difficulty_hard": 0,
    
    // 地点
    "location_local": 10,
    "location_province": 7,
    "location_neighbor": 3,
    "location_remote": 0
  }
}
```

---

## ✅ 配置验证方法

### 测试案例1: 32岁公务员,预算8万,要985

```
用户标签:
age_32_35, position_gov, budget_70_90k, 
goal_promotion, goal_strong, exam_willing, 
difficulty_medium, location_local

川大:
10+10+10+10+10+10+7+10 = 77分

党校:
10+10+2+10+0+0+5+10 = 47分

✅ 川大77 > 党校47 → 配置正确
```

### 测试案例2: 30岁事业编,预算6万,只要证书

```
用户标签:
age_28_32, position_institution, budget_40_70k,
goal_promotion, goal_weak, exam_willing,
difficulty_easy, location_local

川农:
10+10+10+10+10+10+10+10 = 80分

川大:
10+9+2+10+5+10+3+10 = 59分

✅ 川农80 > 川大59 → 配置正确
```

### 测试案例3: 38岁公务员,预算4万,不想考

```
用户标签:
age_35_plus, position_gov, budget_0_40k,
goal_promotion, goal_weak, exam_unwilling,
difficulty_easy, location_local

党校:
10+10+10+10+10+10+10+10 = 80分

川大:
5+10+0+10+5+0+3+10 = 43分

✅ 党校80 > 川大43 → 配置正确
```

---

## 🎓 配置作业答案

### 作业1: 电子科技大学

```json
{
  "name": "电子科技大学",
  "tuition_min": 84000,
  "复试线_2025": 170,
  
  "match_weights": {
    "age_25_28": 6,
    "age_28_32": 10,
    "age_32_35": 10,
    "age_35_plus": 4,
    
    "budget_0_40k": 0,
    "budget_40_70k": 2,
    "budget_70_90k": 10,   // 学费8.4万,和川大一样
    "budget_90_160k": 8,
    "budget_160k_plus": 5,
    
    "goal_promotion": 10,
    "goal_selection": 10,
    "goal_transfer": 9,
    "goal_prestige": 9,
    "goal_strong": 10,
    "goal_weak": 6,
    
    "position_gov": 9,
    "position_institution": 10,
    "position_soe": 9,     // 理工科,国企更青睐
    "position_private": 7,
    
    "education_bachelor": 10,
    "education_junior": 5,
    "education_master": 8,
    
    "time_limited": 10,
    "time_abundant": 8,
    "time_tight": 5,
    
    "exam_willing": 10,
    "exam_neutral": 5,
    "exam_unwilling": 0,
    
    "difficulty_easy": 5,     // 复试线170,比川大低
    "difficulty_medium": 10,  // 中等难度
    "difficulty_hard": 7,
    
    "location_local": 10,
    "location_province": 7,
    "location_neighbor": 5,
    "location_remote": 3
  }
}
```

### 作业2: 重庆市委党校

```json
{
  "name": "中共重庆市委党校",
  "tuition_min": 35000,
  "复试线_2025": 210,
  
  "match_weights": {
    "age_25_28": 3,
    "age_28_32": 8,
    "age_32_35": 10,
    "age_35_plus": 10,
    
    "budget_0_40k": 10,    // 学费3.5万,稍贵于川党校
    "budget_40_70k": 6,    // 但仍在4万档
    "budget_70_90k": 2,
    "budget_90_160k": 0,
    "budget_160k_plus": 0,
    
    "goal_promotion": 10,
    "goal_selection": 4,
    "goal_transfer": 2,
    "goal_prestige": 0,
    "goal_strong": 0,
    "goal_weak": 10,
    
    "position_gov": 10,
    "position_institution": 8,
    "position_soe": 5,
    "position_private": 0,
    
    "education_bachelor": 10,
    "education_junior": 10,
    "education_master": 3,
    
    "time_limited": 10,
    "time_abundant": 5,
    "time_tight": 10,
    
    "exam_willing": 0,
    "exam_neutral": 5,
    "exam_unwilling": 10,
    
    "difficulty_easy": 10,
    "difficulty_medium": 5,
    "difficulty_hard": 0,
    
    "location_local": 10,      // 重庆本地用户
    "location_province": 10,   // 重庆市=省级
    "location_neighbor": 7,    // 四川邻省
    "location_remote": 2
  }
}
```

---

**配置完成!** 🎉

按照这个指南配置42所院校,准确率应该能达到85%+
