# cases.json v0.5.1 schema spec · V6 消费版

> **版本**：v0.5.1（2026-05-29 交接前元信息同步 · 125 条 · 29 公开字段）
> **历史**：v0.4（2026-05-29 早晨 · 26 字段 · 加 4 详情页/TMDR 弹药）· v0.3（2026-05-28 · 22 字段 V6 消费版）· v0.2（2026-05-27 · 13 字段）

**v0.4 → v0.5 升级**（2026-05-29 ww 钦定 · 数据侧准备好等前端场景）：

| 新字段 | 来源 15 维 | 待前端场景 | 用途 |
|---|---|---|---|
| `mindset_arc` | 心态曲线 | 待找场景 | 详情页"她的心路历程"段 · 强用户共情 |
| `obstacles` | 阻力源 | 待找场景 | 详情页"她遇到的困难"段 · 用户代入 + 销售 TMDR 痛点识别 |
| `prior_failure` | 失败模式 | 待找场景 | 详情页"她踩过的坑"段 · 多战/未上岸 case 强卖点 · 首战上岸 case 留空 |

**v0.5 填充率**（投稿 27 case）：mindset_arc 27/27 / obstacles 27/27 / prior_failure 15/27（合理 · 仅多战/未上岸 case 有失败模式）
> **设计原则**：需求驱动（v6 7 个动态点反推），非供给驱动（M8 15 维全搬）
> **对账权威**：`V6-动态点清单.md v0.9` #11/#14/#17/#22/#23/#24/#29
> **派生脚本**：`scripts/derive_v6_consumer_cases.py` + `scripts/derive_v04_v6_cases.py`
> **工作区产物**：dryrun/apply-candidate 已 prune；保留 `_sync-工作区/可删除-cases-v04-v6-merge-report.md` 作合并留档
> **正式产物**：`data/derived-from-context/cases.json`（125 条：旧 29 条 + v04 69 条党校/管综源 + 投稿 27 条 V6 完整字段）

**v0.3 → v0.4 升级**（2026-05-29 subagent 审计后 ww 钦定）：

| 新字段 | 来源 15 维 | V6 消费点 | 用途 |
|---|---|---|---|
| `study_method` | 方法栈 + 学习模式 | #14 详情页 | "她怎么学的"段 · TMDR 销售刚需 |
| `turning_point` | 转折点 + 触发场景 | #14 详情页 | "决策瞬间"段 |
| `engaged_products` | 研知道方法引用（list）| #14 详情页 | "她用了哪些产品"段 · 营销+TMDR 直接复用 |
| `prep_duration` | 总耗时段 | #22 chip | 备考时长筛选维度 |

**新派生侧脱敏**：含老师真名脱敏（姚智鑫 → 姚老师）+ 所有叙事字段（含 v0.4 新字段）走 1C age 模糊化 + 地址敏感词替换。

---

## 1. 字段总览

22 个公开字段 + 5 个内部字段（`_` 前缀）。

### 1.1 标识字段（2）

| 字段 | 类型 | 来源 | 说明 |
|---|---|---|---|
| `case_id` | string | 派生 | `C001-C126`，跳 `C007`，共 125 条 |
| `profile_combo_id` | string | derive_students_map / cases 派生 | `PC1-PC23`，4 维 (system+region+age+path) 归位 |

### 1.2 卡片标题字段（10 · 用于 #14 #23 #29）

| 字段 | 类型 | 来源 | V6 动态点 | 说明 |
|---|---|---|---|---|
| `display_name` | string | 派送层脱敏前=真名 / 后=X 同学 | #14 #23 #29 | 卡片首行姓名 |
| `age_band` | string | M8-csv 年龄段映射 | #22 chip | "35-40 岁段" |
| `age_concrete` | string | 报名表年龄 + 笔名兜底 → 1C 模糊化 | #14 #23 卡片 | **"约 37 岁"**（1C 模糊化 · 见数据脱敏规则.md §三 第 1 层 1C 例外）|
| `system` | string | M8-csv 工作单位类型 | - | 10 类 SSOT（市直机关/县级民政/...）|
| `system_chip` | string | system → 4 大类映射 | #22 chip | "党政机关"/"教育系统"/"医疗系统"/"国央企"/"其他" |
| `region` | string | 报名表地址 → 地级市脱敏 | #22 chip + #14 卡片 | "阿坝"/"成都" |
| `education` | string | 报名表最高学历解析 | #22 chip + #14 卡片 | "本科"/"大专"/"研究生" |
| `edu_modifier` | string | 同上 | #14 卡片 | "全日制"/"自考"/"网教"/"函授"/"非全日制" |
| `work_years` | string | 报名表毕业时间 → 算工龄 | #14 卡片 | "8 年" |
| `unit_narrative` | string | 真实单位 → region+单位类型脱敏 | #14 卡片 | "阿坝某县委机关" |
| `is_party_member` | bool/null | 文本强信号 / 路径 A 兜底推断 | #14 卡片"党员"标 | true/null（不确定的 null） |

### 1.3 决策字段（4）

| 字段 | 类型 | V6 动态点 | 说明 |
|---|---|---|---|
| `chosen_path` | string | #22 chip | "A"/"B"（单字母）|
| `chosen_path_label` | string | #14 #22 #23 | "党校在职研究生"/"统考非全研究生" |
| `chosen_school` | string | #14 #23 #29 | "四川党校 · 政治学" |
| `outcome` | string | #14 | "上岸"/"未上岸"/"在读中"/"弃考" |

### 1.4 内容字段（8 · 核心 · 用于 #11 #14 #17 #29 · v0.4 含 4 新增）

| 字段 | 类型 | 来源 | V6 动态点 | 说明 |
|---|---|---|---|---|
| `key_quote` | string | OCR 精选金句 / structured.json | #14 #23 #29 | 卡片斜体金句 |
| `narrative_choose` | string | 动机 + 触发场景拼 | #14 #29 | "想到了'先把学历这件事做了不掉队'，最终选了..." |
| `reflection` | string | 上岸反思 / 给后人建议 | **#11** | 真实作用反馈原句（**关键**）|
| `story_summary` | string | 工龄+学历+region+chip+age+chosen 拼 | #29 | "8 年工龄本科，阿坝党政机关，37 岁，选四川党校 · 政治学，已上岸。" |
| **`study_method` v0.4 新** | string | 方法栈 + 学习模式 | **#14 详情页** | "她怎么学的"段 · 含 1V1/云课堂/计划表/碎片时段等具体方法 · TMDR 销售弹药 |
| **`turning_point` v0.4 新** | string | 转折点 + 触发场景 | **#14 详情页** | "决策瞬间"段 · 含关键事件 + 上岸宣告 |
| **`engaged_products` v0.4 新** | array<string> | 研知道方法引用（关键词扫）| **#14 详情页** | "她用了哪些产品"list · 含一页纸/云自习/密训/题库/老师/班型等 · 8 关键词上限 |
| **`prep_duration` v0.4 新** | string | 总耗时段 | **#22 chip** | "2 个月" / "9 年（2016 起多战）" / "20 天" 等 · 备考时长筛选维度 |

### 1.5 聚合 + 排序字段（5）

| 字段 | 类型 | V6 动态点 | 说明 |
|---|---|---|---|
| `reason_keywords` | array<string> | **#17** | 选择理由原文短词（最多 5）· 聚合源 |
| `reason_tags` | array<string> | **#17** | 14 类枚举（学历兜底/晋升/遴选/体制内认可/学费低/不考英数/给孩子榜样/圆梦/同事影响/年龄焦虑/政策推动/自我提升/坚持型/学渣翻身）|
| `story_tags` | array<string> | **#29** | 11 类场景标签（宝妈/民族州/纪检公检法/市直机关党员/乡镇基层/医护/国央企/35+ 焦虑/40+ 转型/考研多战/0 基础上岸）|
| `completeness_score` | int 0-100 | **#23** | 排序键 · 15 维填充率 × 4（封顶 100）|
| `display_priority` | int | **#23** | 已发公众号=10 / 存稿=5 · 排序辅助 |

### 1.6 兼容字段（保留）

| 字段 | 类型 | 说明 |
|---|---|---|
| `tags` | array<string> | M8 旧字段 · #23 chip 展示备用 |
| `key_quote_source` | string | 内部溯源 |

### 1.7 内部字段（`_` 前缀 · 不前端展示）

| 字段 | 说明 |
|---|---|
| `_touding_case_id` | 25-TD-001 · 投稿叙事溯源（C100~C126 有值） |
| `_m8_case_id` | 25-SC-624 · M8-csv 溯源（C100~C126 有值） |
| `_full_text_ref` | 投稿 full.md / structured.json 溯源（C100~C126 有值） |
| `_dim_count` | extracted_dimensions 填充数 |
| `_party_inferred_via` | text-explicit / full-md-explicit / rule-inferred:四川党校强制党员 / unknown |

---

## 2. _meta 层（支持 #24 分页）

```json
{
  "meta": {
    "version": "v0.3 · v6-consumer-aligned",
    "derived_at": "2026-05-28",
    "schema_aligned_with": "V6-动态点清单.md v0.6 · #11/#14/#17/#22/#23/#24/#29",
    "source": "正式 cases.json：旧 29 兼容补齐 + 投稿 27 完整字段 + v04 69 保守行数据摘要",
    "total": 125,
    "page_size": 10,
    "privacy": "...",
    "dryrun": false
  },
  "data": {
    "cases": [ ... ]
  }
}
```

---

## 3. V6 动态点 × 字段消费矩阵

| 字段 | #11 | #14 | #17 | #22 | #23 | #24 | #29 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| case_id | | ○ | | | ○ | ○ | |
| profile_combo_id | | ★ | ○ | | | | |
| display_name | | ★ | | | ★ | | ★ |
| age_band | | | | ★ | | | |
| age_concrete | | ★ | | | ★ | | ○ |
| system | | | ○ | | | | |
| **system_chip** | | | | ★ | | | |
| region | | ★ | | ★ | ★ | | ○ |
| **education** | | ★ | | ★ | ★ | | |
| edu_modifier | | ★ | | | ★ | | |
| work_years | | ★ | | | ★ | | |
| unit_narrative | | ★ | | | ★ | | ○ |
| is_party_member | | ★ | | | ○ | | |
| chosen_path | | | | ★ | ★ | | |
| chosen_path_label | | ★ | | ★ | ★ | | |
| chosen_school | | ★ | | | ★ | | ★ |
| outcome | | ★ | | | ★ | | |
| key_quote | | ★ | | | ★ | | ★ |
| narrative_choose | | ★ | | | | | ★ |
| **reflection** | **★** | | | | | | |
| **story_summary** | | | | | | | **★** |
| **reason_keywords** | | | **★** | | | | |
| **reason_tags** | | | **★** | | | | |
| **story_tags** | | | | | | | **★** |
| **completeness_score** | | | | | ★ | | |
| display_priority | | | | | ★ | | |
| _meta.total | | | | | | ★ | |
| _meta.page_size | | | | | | ★ | |

★ = 必用字段 · ○ = 辅助字段 · 空 = 不用

---

## 4. 数据源映射

| v0.3 字段 | 数据源 | 派生逻辑 |
|---|---|---|
| `case_id`, `profile_combo_id`, `display_name`, `age_band`, `system`, `region`, `chosen_path`, `chosen_school`, `outcome`, `key_quote`, `tags` | 可删除-cases-v05-profile-enriched-draft.json | 直接读 |
| `age_concrete` | 24-25 报名表`年龄` + ALIAS_AGE（笔名兜底）+ M8-csv `年龄段` 兜底 | 优先报名表 |
| `education`, `edu_modifier` | 24-25 报名表`最高学历` + M8-csv `学历类型` 兜底 | EDU_PARSE 正则 |
| `work_years` | 24-25 报名表`毕业时间` | 2025 - 毕业年 |
| `unit_narrative` | M8-csv `工作单位全称` | desensitize_unit_narrative() · region+单位类型脱敏 |
| `is_party_member`, `_party_inferred_via` | extracted_dimensions / full.md / 路径 A 兜底 | infer_party_member() |
| `chosen_path_label` | chosen_path | PATH_LABEL 映射 |
| `system_chip` | system | SYSTEM_TO_CHIP 映射（10 → 4+其他）|
| `narrative_choose` | extracted_dimensions[动机+触发场景] | build_narrative_choose() |
| `reflection` | extracted_dimensions[上岸反思+给后人建议] | build_reflection() |
| `story_summary` | work_years + edu + region + chip + age + chosen_school + outcome 拼 | build_story_summary() |
| `reason_keywords`, `reason_tags` | extracted_dimensions[动机+触发场景+给后人建议+上岸反思] | REASON_KEYWORDS 字典 |
| `story_tags` | 全 dimensions + region + system + chosen_school + ext.特殊标签 | STORY_TAG_KEYWORDS 字典 |
| `completeness_score` | extracted_dimensions 填充率 | min(100, filled × 4) |
| `display_priority` | M8 数据状态 / ext 发布状态 | 已发=10 / 存稿=5 |

---

## 5. SYSTEM_TO_CHIP 映射表

| `system` (10 类 SSOT) | `system_chip` (V6 4 大类) |
|---|---|
| 市直机关 / 县级民政 / 市直政法 / 基层公职 | 党政机关 |
| 教育系统 / 高校 | 教育系统 |
| 医院 | 医疗系统 |
| 央企 / 国企 / 省属国企 / 银行金融 | 国央企 |
| system_unknown_storied | 其他 |

---

## 6. 历史 dry-run 字段填充率（27 投稿 case）

本节是 27 投稿 case 在进入正式 125 条库前的字段填充记录。当前正式 `cases.json` 已 apply，不再存在 active dryrun 文件。

| 字段 | 填充率 | 备注 |
|---|---|---|
| age_concrete | 21/27 | 6 个笔名（早春/道家和尚/清风徐来/刘洋洋/小小/左先生）无报名表数据 |
| education | 27/27 ✓ | M8-csv 兜底全覆盖 |
| work_years | 20/27 | 报名表毕业时间缺失 |
| unit_narrative | 19/27 | M8-csv `工作单位全称` 22/27 空（56% 报名表缺失率）|
| is_party_member True | 27/27 | 全部 `rule-inferred:四川党校强制党员` |
| narrative_choose | 26/27 | |
| reflection | 27/27 ✓ | |
| story_summary | 27/27 ✓ | |
| reason_keywords/tags | 22/27 | 5 case 动机/反思字段空 · 关键词字典命中 |
| story_tags | 22/27 | |
| completeness_score 60-69 | 7 | 高完整度 |
| completeness_score 50-59 | 16 | 中 |
| completeness_score < 50 | 4 | 低（笔名 + doc/wps 解析受损 case）|

---

## 7. 派生工序

```
源数据：
  ├─ 可删除-cases-v05-profile-enriched-draft.json（PC + system + region 已就绪）
  ├─ 24-25 报名表.xlsx（年龄/学历/毕业时间）
  ├─ M8-学员案例.csv（27 投稿行 14 字段 已 ww stage1 补全）
  └─ M8-学员案例-投稿结构化扩展字段.json（15 维 sidecar）
              ↓
       derive_v6_consumer_cases.py（纯 Python · 0 LLM 调用）
              ↓
       _sync 工作区历史 dryrun / apply-candidate（已 prune）
              ↓
       [内部候选/工作稿] → 走脱敏（display_name + region + unit_narrative）
              ↓
       data/derived-from-context/cases.json（v0.3 正式 · 给小程序消费）
```

---

## 8. 与 v0.2 旧 schema 的兼容性

**100% 向后兼容**：v0.3 保留了 v0.2 全部 13 字段，新增 9 个。前端可以渐进式接入：
- 阶段 1：用 v0.2 13 字段（已经在用）
- 阶段 2：接入 system_chip + education + chosen_path_label（#22 chip 筛选）
- 阶段 3：接入 age_concrete + work_years + unit_narrative + is_party_member（#14 #23 卡片标题）
- 阶段 4：接入 reflection + narrative_choose + story_summary（#11 #29 内容段）
- 阶段 5：接入 reason_keywords + reason_tags + story_tags + completeness_score（#17 #23 聚合排序）

---

## 9. 与其他文档的关系

| 文档 | 关系 |
|---|---|
| `M8-字段定义与脱敏规则.md` §六 | **上游 SSOT**：sidecar 27 字段 + 15 维定义 + _quotes_pool 5 tag · 本 schema 的内容字段来源 |
| `数据脱敏规则.md` v1.2 | **出口校验**：派送 cases.json 时必过 · 含 1C `age_concrete` 模糊化例外 |
| `V6-动态点清单.md` v0.6 | **下游消费**：#11 #14 #17 #22 #23 #24 #29 共 7 处对应 |
| `数据通路.md` v1.4 | **数据流定位**：本 schema 是阶段 2 对齐/检查 → 阶段 3 正式前端消费层的契约 |
| `derive_v6_consumer_cases.py` | **派生脚本**：实现本 schema 的派生逻辑 |
| `_sync-工作区/README.md` | **工作区状态**：过程产物归档 + 上下游索引 |

---

## 10. 已知限制 + 后续优化

1. **6 笔名 case** 无报名表精准数据（早春/道家和尚/清风徐来/刘洋洋/小小/左先生）→ age_concrete 缺（1C 模糊后仍空）
2. **22/27 case** 单位字段 M8 中空白 → unit_narrative 走 chip 兜底（"成都某党政机关单位"）
3. **关键词字典** REASON_KEYWORDS / STORY_TAG_KEYWORDS 需持续迭代（当前 14+11 类）
4. **is_party_member** 投稿 27 条多为党校 A 路径；v04 69 条引入后已出现 B 路径与 unknown/false/null 分布
5. **completeness_score** 当前 max 60+；待 v0.4 引入更多源（考后访谈分析）后能上 80+
6. **旧 29 条 C001-C029** 已补齐 V6 兼容字段，避免前端全量读取缺字段；其中 `reflection` / `narrative_choose` 使用原 `key_quote` 兜底，不额外编造新的真实叙事。
7. **v04 69 条 C031-C099** 已补齐 V6 字段并合并；`key_quote/reflection` 是行数据摘要或考研动机摘要，`key_quote_source` 已标注非投稿原文摘句，后续可继续补真实原文锚点。
