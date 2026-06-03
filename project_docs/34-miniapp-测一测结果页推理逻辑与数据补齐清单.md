# Miniapp 测一测结果页推理逻辑与数据补齐清单

> 更新时间：2026-06-02  
> 范围：`miniapp/src/data/quiz-runtime.ts`、`quiz-normalization.ts`、`recommendation-strategy.ts`、`peer-insights.ts`、`result-presentation.ts`、`pages/result/index.vue`  
> 目的：记录当前 9 题测一测后的推荐链路、推理规则、案例匹配口径，以及后续需要补齐的规范源文件，方便继续优化时不再出现“推荐、案例、说明牛头不对马嘴”的问题。

## 1. 当前结论

现在结果页的核心原则是：**先形成一份统一 runtime，再让结果页和长图页只读这一份 runtime**。

当前链路为：

```text
9 题答案 + DP 追问答案
-> prepareQuizInput()
-> buildNormalizedQuizAnswers()
-> getLocalRecommendation()
-> getPeerInsights()
-> buildResultPresentation()
-> buildZexiaoRuntime()
-> yz_quiz_runtime
```

结果页与长图页都应该只消费 `yz_quiz_runtime.presentation` 和 `yz_quiz_runtime.zexiao`，不要各自重新推导推荐结果。

## 2. 当前已接入的数据源

| 数据源 | 当前用途 | 风险 |
|---|---|---|
| `schooltool/data/cases.json` | 真实案例主数据，包含 `case_id`、画像、选择路径、学校、反思等字段 | 需要继续校验字段完整性和脱敏质量 |
| `schooltool/data/peer_profile_cache.json` | 同画像聚合、路径比例、相似案例 id | 如果精确画像样本少，会进入 fallback |
| `schooltool/data/students_map.json` | fallback chain 与画像桶映射 | 用户已提醒此文件可能不完全真实，不能无条件当作权威 |
| `schooltool/data/zexiao.json` | 择校长图/择校页展示素材 | 需要和 runtime 推荐结果保持一致 |
| `miniapp/src/data/199exam-miniapp-school-publish-sc-cq.json` | 统考非全院校库 | 学费、分数线、学制等字段可能有“待定/无”，前端已要求不展示 |
| `miniapp/src/data/party-school-miniapp-publish.json` | 党校院校库 | 党校是否可报、党员要求、单位认可仍要按最新简章核对 |
| `miniapp/src/data/recommendation-strategies-publish.json` | 旧策略数据 | 当前核心推荐主要走代码内规则，后续应迁移进 `rules.json` |

## 3. 当前 runtime contract

`yz_quiz_runtime` 至少应包含这些字段：

```ts
type QuizRuntime = {
  version: string
  generatedAt: string
  normalized: NormalizedQuizAnswers
  skipped: SkipResolution[]
  skipNotice: string
  dp: {
    answers: Record<string, string>
    lines: Array<{ label: string; text: string }>
  }
  recommendation: LocalRecommendation
  peer: PeerInsights
  presentation: ResultPresentation
  zexiao: ZexiaoRuntime
}
```

约束：

- `normalized` 是所有推理的唯一用户画像输入。
- `recommendation` 负责路径和院校推荐。
- `peer` 负责同画像、相似案例、K-NN/同行聚合。
- `presentation` 负责结果页展示文案。
- `zexiao` 负责保存长图/择校页展示文案。
- 页面不应再直接调用 `buildResultPresentation()` 重新生成内容。

## 4. 9 题 normalize 规则

### 4.1 系统

| value | 展示 | 策略归类 |
|---|---|---|
| `dangzheng` | 党政机关 | 党政机关 |
| `gongjianfa` | 公检法纪检 | 公检法纪检 |
| `education` | 教育系统 | 教育医疗 |
| `medical` | 医疗系统 | 教育医疗 |
| `guoqi` | 国企央企 | 国有企业 |
| `bank_finance` | 银行金融 | 国有企业 |
| `xiangzhen` | 乡镇街道 | 乡镇街道 |
| `other_shiye` | 其他事业编 | 教育医疗 |

### 4.2 地区

| value | 省份 | 展示 | 特殊标记 |
|---|---|---|---|
| `sichuan` | 四川 | 四川 | 非民族州 |
| `sichuan_minzu` | 四川 | 四川民族州 | 民族地区 |
| `chongqing` | 重庆 | 重庆 | 重庆 |

### 4.3 目标

| value | 归一结果 | 展示 |
|---|---|---|
| `promotion_in_unit` | 晋升 | 本单位晋升 |
| `lianxuan` | 遴选 | 遴选/调任 |
| `defensive` | 防御 | 防御/提升下限 |
| `zhicheng` | 职称 | 职称评审 |
| `transfer_civil_servant` | 转行 | 转公务员 |
| `other` | 防御 | 学历提升/个人成长 |

### 4.4 预算

| value | 数值 | 展示 |
|---|---:|---|
| `2-5万` | 25000 | 2-5 万 |
| `5-10万` | 65000 | 5-10 万 |
| `10万+` | 100000 | 10 万 + |

兼容旧缓存：

| 历史 value | 兼容到 |
|---|---|
| `2-3w` | 2-5 万 |
| `5-8w` | 5-10 万 |
| `8w+` | 10 万 + |

### 4.5 DP 与英数基础

| 条件 | `math_base` |
|---|---|
| 未测试或没填 | `unknown` |
| 理科思维 | `normal` |
| 文科思维 | `weak` |
| 偏理解/思考 | `normal` |
| 偏背诵/重复 | `weak` |

### 4.6 跳题补值

当前跳题补值是真实逻辑，不是文案：

| 题号 | 字段 | 默认值 | 默认含义 |
|---:|---|---|---|
| Q5 | 年龄 | `31-35` | 31-35 |
| Q6 | 目标 | `defensive` | 防御/提升下限 |
| Q8 | 预算 | `5-10万` | 5-10 万 |

后续建议：把这张默认值表迁移到 `rules.json` 或单独 `normalization_rules.json`，并在 runtime 里保留 `skipped` 明细。

## 5. 当前路径推荐规则

当前推荐不是 AI 自由生成，而是代码规则生成。入口为 `getLocalRecommendation()`。

### 5.1 先判断是否必须走双证

强双证场景：

- 用户明确 `must_dual_degree = true`。
- 目标是 `遴选`。
- 目标是 `转行`。
- 目标是 `职称`。

这些场景默认优先统考非全，党校只能作为低成本备选，不能反客为主。

### 5.2 党校路径可选条件

当前党校可选条件：

- 非大专。
- 不强制双证。
- 四川：必须是党员或预备党员。
- 重庆：当前代码允许非党员进入重庆党校在职路径，但仍需最新招生简章核验。
- 目标偏 `晋升` 或 `防御`。

### 5.3 主要规则 id

| ruleId | 场景 | 主路径 |
|---|---|---|
| `B001` | 大专 | MPA 双证 |
| `E002` | 教育/医疗 + 职称 | MPA/MEM 双证 |
| `P004` | 公检法纪检 | MPA 双证 |
| `P004+R008` | 公检法纪检 + 预算很低 + 不强双证 | 党校法学/法律 |
| `P003` | 国央企/金融 + 31-40 岁窗口 | MBA/MPA 双证 |
| `P003+R008` | 国央企窗口 + 低预算 | 党校 |
| `P005` | 四川民族地区 + 党员 + 不强双证 | 党校 |
| `P002` | 遴选/转行/职称等强双证目标 | MPA/MBA/MEM |
| `P001` | 体制内内部使用 + 晋升/防御 | 党校 |
| `E001-CQ` | 重庆非党员 + 内部使用目标 | 重庆党校在职路径 |
| `DEFAULT` | 兜底 | 默认双证路径 |

## 6. 院校推荐排序逻辑

当前院校排序不是单纯按学校名，而是加权评分：

| 因子 | 作用 |
|---|---|
| 省份匹配 | 同省优先，党校权重更高 |
| 学习方式 | 非全日制优先，全日制扣分 |
| 预算匹配 | 学费在预算内加分，超预算扣分 |
| 学费低 | 有学费数据且越低越加分 |
| 偏好学校名 | 只作为小权重，不再压过画像匹配 |
| 专业/方向匹配 | 党校专业方向权重更高 |
| 系统贴合 | 政法、财经、教育、医疗等关键词加分 |
| 民族地区 | 西昌/凉山等特殊场景加分 |
| 学校层级 | 985/211 少量加分 |
| 分数线 | 较低分数线加分，高分线扣分 |

关键修复：

- 不能因为“四川大学”在偏好列表里，就长期重复推荐四川大学。
- 不能把备选方案写成固定四川大学。
- 备选必须来自第二候选路径，并保留 `ruleId` 和 `school sourceRecordId`。

## 7. 政策层面展示逻辑

政策说明不再固定生成，而是按用户画像生成。

### 7.1 党校路径政策项

| 条件 | 展示项 |
|---|---|
| 目标是晋升/防御 | 内部使用 |
| 预算 <= 65000 或担心学费 | 成本控制 |
| 英数弱/未知或担心考试 | 考试压力 |
| 有岗位且目标是内部使用 | 岗位场景 |
| 以上都没有 | 单位口径 |

注意：`成本控制` 只能在预算敏感时展示，不能无条件展示。

### 7.2 统考非全政策项

| 目标 | 展示项 |
|---|---|
| 遴选/转行 | 双证资格、国民教育序列、路径通用性 |
| 职称 | 职称口径、外部认可、长期回报 |
| 其他 | 双证通用性、考试门槛、路径弹性 |

注意：所有政策文案必须包含“最终以单位口径/最新简章为准”的风险边界，不能把推荐写成承诺。

## 8. 相似案例与真实作用逻辑

当前相似案例入口为 `getPeerInsights()`。

### 8.1 案例来源分级

| caseSource | 含义 | 展示策略 |
|---|---|---|
| `exact` | 同系统、同地区、同年龄段命中 | 可展示多条 |
| `fallback` | 精确样本不足，按 fallback chain 降维 | 可展示多条，但要标明降维 |
| `heuristic` | 无可用同画像案例，仅按相似度计算 | 最多展示 1 条，并标明近似参考 |

### 8.2 医疗职称场景

如果用户是医疗系统 + 职称：

- 优先 MEM / MPA / 医护 / 医科类案例。
- 排除明显国企案例。
- 如果主推荐不是党校，则优先非党校案例。
- 如果没有直接 MEM 真实案例，需要展示 proxyHint，说明当前用医科类 MPA/医护双证案例作近似参考。

### 8.3 公检法遴选场景

如果用户是公检法纪检 + 遴选：

- 优先政法、法院、检察、公安、纪委、法学、法律信号。
- 没有法律/政法信号的案例大幅降权。
- 如果没有政法系统双证上岸样本，需要展示 proxyHint，说明当前是体制内公务员遴选 MPA 近似参考。

### 8.4 展示底线

- 真实作用必须来自 `reflection` 或 `key_quote`。
- 页面必须显示 `sourceLabel`，不能把近似案例包装成精准案例。
- 近似案例最多展示 1 条。
- 没有可展示案例时，显示“案例库暂无真实作用匹配”，不能编造。

## 9. 当前 provenance 设计

结果页 runtime 已写入：

```ts
provenance: {
  primaryRuleId: string
  secondaryRuleId: string
  primarySchoolRecordId: string
  secondarySchoolRecordId: string
  peerBucketKey: string
  peerCaseSource: 'exact' | 'fallback' | 'heuristic'
  missingRuntimeSources: string[]
}
```

当前 `missingRuntimeSources` 固定包含：

```text
policy_basis.json
rules.json
path_options.json
schools_meta.json
```

含义：这些规范源文件还没有接入 runtime，所以页面不能假装“所有规则都有规范文件依据”。

## 10. 需要补齐的规范源文件

### 10.1 `rules.json`

作用：把当前写在代码里的规则迁移为可审计规则表。

建议结构：

```json
{
  "version": "rules-v1",
  "updated_at": "2026-06-02",
  "rules": [
    {
      "rule_id": "P001",
      "name": "体制内内部使用优先党校",
      "priority": 100,
      "when": {
        "education_not": ["大专"],
        "goal_in": ["晋升", "防御"],
        "must_dual_degree": false,
        "party_path_eligible": true
      },
      "primary_path": "党校",
      "secondary_path": "MPA",
      "policy_keys": ["internal_use", "unit_acceptance", "budget_if_sensitive"],
      "risk_keys": ["party_school_unit_scope"],
      "evidence_keys": ["party_school_admission", "unit_acceptance"]
    }
  ]
}
```

你需要提供/确认：

- 每条规则是否成立。
- 优先级是否正确。
- 哪些条件是硬条件，哪些只是加分条件。
- 每条规则对应哪些政策依据。
- 每条规则的风险边界。

### 10.2 `policy_basis.json`

作用：把页面里的政策说明从“经验文案”变成“有出处的政策口径”。

建议结构：

```json
{
  "version": "policy-basis-v1",
  "items": [
    {
      "policy_key": "unit_acceptance",
      "title": "单位认可口径",
      "summary": "党校路径主要用于体制内内部认可场景，是否可用于遴选、调任、职称，以单位和当地政策口径为准。",
      "applies_to": ["党校"],
      "source_type": "manual_policy_note",
      "source_name": "研知道内部政策口径说明",
      "source_url": "",
      "last_verified_at": "2026-06-02",
      "display_level": "must_show_boundary"
    }
  ]
}
```

你需要提供/确认：

- 哪些政策判断可以公开展示。
- 哪些只能写成“建议核对”，不能写成定论。
- 如果有官方链接、招生简章、单位文件口径，给到标题、链接、年份即可。
- 如果没有官方链接，就标为 `manual_policy_note`，页面展示时必须更谨慎。

### 10.3 `schools_meta.json`

作用：给院校推荐提供更稳定的学校元信息，避免只靠学费/学校名排序。

建议结构：

```json
{
  "version": "schools-meta-v1",
  "schools": [
    {
      "school_id": "scdx",
      "school_name": "四川大学",
      "program_type": "MPA",
      "province": "四川",
      "city": "成都",
      "is_985": true,
      "is_211": true,
      "fit_systems": ["党政机关", "教育系统", "国企央企"],
      "fit_goals": ["遴选", "转行", "职称"],
      "risk_notes": ["学费较高", "竞争压力较高"],
      "avoid_when": [
        { "budget_max": 30000, "reason": "预算明显不足" }
      ],
      "source_record_ids": ["..."]
    }
  ]
}
```

你需要提供/确认：

- 哪些学校适合哪些系统和目标。
- 哪些学校只是“名气强”，但不适合某类用户。
- 哪些字段为空、无、待定时不得展示。
- 学费、分数线、学制的最新年份。

### 10.4 `path_options.json`

作用：统一 A 党校、B 统考非全、MPA/MBA/MEM 的路径定义。

建议结构：

```json
{
  "version": "path-options-v1",
  "paths": [
    {
      "path_id": "A_DANGXIAO",
      "label": "党校在职研究生",
      "certificate_type": "单证",
      "exam_type": "校考/主观题",
      "best_for": ["内部使用", "晋升防御", "低预算", "不想押英数"],
      "not_for": ["强双证", "跨系统遴选", "明确职称双证要求"],
      "must_show_risks": ["单位口径", "不能替代双证硬门槛"]
    }
  ]
}
```

你需要提供/确认：

- 每条路径能解决什么。
- 每条路径不能解决什么。
- 哪些场景必须推荐，哪些只能备选。
- 页面允许怎么说，不能怎么说。

## 11. 你需要做什么

你不需要写代码，也不需要一次性整理成很完整的 JSON。最有用的是先给出业务口径。

建议你按这个顺序提供：

1. 确认 `rules.json` 里的核心规则。
   先确认 P001/P002/P003/P004/P005/E002/R008 这些规则是否符合你们真实经验。

2. 给政策依据。
   有官方链接最好；没有链接也可以给“我们内部怎么判断、哪些话不能说死”。

3. 给学校适配口径。
   比如“四川大学什么时候适合，什么时候不适合”“西南政法大学适合哪些政法/遴选场景”“MEM 哪些学校更适合医护/技术岗”。

4. 标记案例可信度。
   对 `cases.json` 里的案例，确认哪些是真实完整案例，哪些只是弱摘要，哪些不适合在结果页引用。

5. 确认 `students_map.json` 的真实性。
   如果这个文件是模拟/半模拟数据，要标记为 `derived_or_estimated`，不能作为强统计展示。

## 12. 你不需要做什么

- 不需要你手工写 TypeScript。
- 不需要你一开始就填完整 JSON。
- 不需要把所有政策都查成官方链接后才继续。
- 不需要给用户个人隐私数据，案例只需要脱敏字段。

## 13. 后续开发接入顺序

建议下一轮按这个顺序做：

1. 建 `rules.json`，把当前代码规则迁移进去。
2. 建 `path_options.json`，统一党校/统考/MPA/MBA/MEM 的路径定义。
3. 建 `policy_basis.json`，给政策说明加来源和边界。
4. 建 `schools_meta.json`，让院校排序更稳定。
5. 给 `cases.json` 增加 `case_quality`、`source_type`、`display_allowed`。
6. 让 `getLocalRecommendation()` 从规则文件读取，而不是写死规则。
7. 让 `getPeerInsights()` 读取案例可信度，低可信案例不进结果页。
8. 重新跑 3-5 组标准画像冒烟清单。

## 14. 验收标准

每次迭代后至少跑这些画像：

| 编号 | 画像 | 重点验证 |
|---|---|---|
| S1 | 四川党政机关 + 党员 + 晋升/防御 + 低预算 | 是否推荐党校，是否不过度承诺 |
| S2 | 医疗系统 + 职称 + 技术/医护岗 | 是否优先双证/MEM/MPA，案例是否医护相关 |
| S3 | 国央企 + 31-40 + 管理岗 | MBA/MPA/党校备选是否合理 |
| S4 | 公检法纪检 + 遴选 | 是否优先 MPA/政法相关，案例不能乱跳 |
| S5 | 四川民族州 + 党员 + 防御 | 是否正确进入民族地区党校逻辑 |

通过标准：

- 首选推荐、政策说明、真实案例、备选方案四块互相不打架。
- 每条展示内容都能追溯到答案、规则、院校库或案例库。
- 没有匹配数据时明确说“近似参考”或“不足”，不能编造。
- 结果页和长图页展示同一份 runtime，不出现口径漂移。

