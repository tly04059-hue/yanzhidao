# 选校诊断小程序

> 研知道学历决策全链路的入口型产品
> 工程位置：`研知道/03-产品与服务/选校工具/`
> 更新：2026-05-29 README 对齐 V6 动态化、案例库 125 条正式消费层与非案例库派生 JSON 复核

---

## 当前状态 · 2026-05-29

- ✅ V6 实现稿当前对接目标：`apps/当前原型/6.0-实现稿-claude.html`
- ✅ 案例库正式消费层：`data/derived-from-context/cases.json`，125 条，V6 字段完整，strict 脱敏通过
- ✅ 三阶段数据通路已收口：M8 内部底账 → `_sync` 工作区 → `data/derived-from-context`
- ✅ `V6-动态点清单.md` 是前端动态化接入清单；#11/#14/#17/#22/#23/#24/#29 消费 cases
- ✅ 非案例库派生 JSON 已复核：students_map 已落地；strategy_pool 供 V6 matchStrategy；quotes_for_v6 已纳入正式层；peer_profile_cache v0.2 已按 students_map 43 桶索引 cases；zexiao 为长图聚合契约

---

## 文档分层（按职责）

### 1. 战略 · 为什么做

| 文档 | 版本 | 用途 |
|---|---|---|
| [docs/01-产品开发文档.md](./docs/01-产品开发文档.md) | v3.0 | **总控** · 战略对齐 · Phase 1-5 · 验证标准 · 边界 |

### 2. 策划 · PRD 上层抽象

| 文档 | 版本 | 用途 |
|---|---|---|
| [docs/小程序策划-v1.md](./docs/小程序策划-v1.md) | v1 | 三层飞轮位置 · 业务版图角色 · 为什么这样做 |

### 3. 需求 · 怎么做

| 文档 | 版本 | 用途 |
|---|---|---|
| [docs/02-产品需求文档-V1.md](./docs/02-产品需求文档-V1.md) | v3.3 | V1 详细需求 · 页面清单 · 跳转 · 推荐接口 · 埋点 |
| [docs/PRD-文案统一策划原则.md](./docs/PRD-文案统一策划原则.md) | v0.1 | 文案纪律 · 来源指针 · 3 元规则 · 信任公式 |

### 4. 设计 · 推荐 + 内容

| 文档 | 版本 | 用途 |
|---|---|---|
| [docs/05-院校库与路径库设计.md](./docs/05-院校库与路径库设计.md) | — | V1 院校项目与路径库范围 · 内容核验顺序 |
| [docs/06-推荐逻辑规则表.md](./docs/06-推荐逻辑规则表.md) | v0.8 | 17 规则单元 · 3 元规则 · 6 类规则类型 |
| [docs/专项/01-诊断逻辑与推荐引擎.md](./docs/专项/01-诊断逻辑与推荐引擎.md) | v2.1 | 诊断引擎专题 |
| [docs/专项/02-了解Tab-内容体系.md](./docs/专项/02-了解Tab-内容体系.md) | v2.0 | 了解 Tab 内容架构 |
| [docs/专项/03-内容审核清单.md](./docs/专项/03-内容审核清单.md) | v0.3 | **内容生产权威** · 6 组硬条款 · PRD §九 引用 |

### 5. 视觉 · 真相源

| 文档 | 用途 |
|---|---|
| [设计/design.md](./设计/design.md) | 赤土橙 · 思源 · 12 场景 · 17 章规范 |
| [设计/designer_guide.md](./设计/designer_guide.md) | 设计师协作指南 |
| [设计/error_cases.md](./设计/error_cases.md) | 12 错误案例 |

### 6. 原型 · 可点击

| 原型 | 状态 |
|---|---|
| [设计/原型/院校库-可视化决策图-v0.3.html](./设计/原型/院校库-可视化决策图-v0.3.html) | **v0.3 定稿（2026-05-20）** |
| [设计/原型/地图原型-V3.html](./设计/原型/地图原型-V3.html) | V3 |

### 7. 技术 · 数据契约

| 文档 | 版本 | 用途 |
|---|---|---|
| [docs/03-技术方案.md](./docs/03-技术方案.md) | v1.2 | 前后端框架 · API 清单 · 数据表 · AI 推荐架构 |
| [docs/04-数据字典.md](./docs/04-数据字典.md) | v0.6 | 系统核心对象 · 字段定义 |
| [docs/09-数据来源与上下文库映射规则.md](./docs/09-数据来源与上下文库映射规则.md) | v0.10 | 上下文库 → 派生 JSON → 小程序运行时 |
| [docs/数据通路.md](./docs/数据通路.md) | v1.6 | 原始数据 → M8 SSOT → _sync → 前端 JSON 的三阶段工程通路 |
| [docs/V6-动态点清单.md](./docs/V6-动态点清单.md) | v0.9 | V6 前端动态化接入清单 |
| [docs/cases-json-schema-v0.3-spec.md](./docs/cases-json-schema-v0.3-spec.md) | v0.5.1 | cases.json V6 消费 schema |
| [docs/cases-json-前端接入指引.md](./docs/cases-json-前端接入指引.md) | v0.3 | cases.json 29 公开字段 → V6 DOM 锚点 / loadCases 接入模板 |
| [docs/字段口径对照表.md](./docs/字段口径对照表.md) | v1.2 | 多源 value_mapping / PC / chip 字段口径 |
| [docs/数据脱敏规则.md](./docs/数据脱敏规则.md) | v1 | **派生 JSON 上线强制硬规则**（2026-05-20 ww 拍板） |
| [data/derived-from-context/](./data/derived-from-context/) | — | 正式前端消费 JSON + `_sync_state.json` 元数据 |

---

## 数据治理（详见 09 文档）

- 上下文库（`02-市场与用户/` + `01-战略定位/`）为**唯一可信源**
- 小程序运行时通过 `data/derived-from-context/` 派生层消费
- 每份派生文件标注 `_meta.source` 版本号，便于检测上下文库更新
- 含学员真实数据的派生 JSON **强制过 `数据脱敏规则` 才能上线**
- 派生约束元数据不对外暴露（09 §十.bis）

## 阅读顺序建议

**首次接手**：1 → 2 → 3 → 4（专项 01/03）→ 5 → 6（v0.3 定稿）

**前端实施（V6）**：`apps/当前原型/6.0-实现稿-claude.html` → `docs/V6-动态点清单.md` → `data/derived-from-context/` → `docs/字段口径对照表.md` / `docs/cases-json-schema-v0.3-spec.md` / `docs/cases-json-前端接入指引.md`

**内容生产**：3 PRD-文案统一策划原则 → 4 专项/03 内容审核清单 → 4 专项/02 了解 Tab 体系

**数据接入**：`docs/数据通路.md` → `09` 派生规则 → 数据脱敏规则 → `data/derived-from-context/`

## 当前保留/清理原则

- 正式前端只读 `data/derived-from-context/*.json`，不读 `_sync-工作区`。
- `_sync-工作区` 只保留工作报告、复核记录和必要源稿；dryrun / apply-candidate / bak / pycache 可清理。
- 案例库当前权威文件是 `cases.json`，数量 125；v04/v05 中间候选已经消化。
- 历史文档只放 `docs/archive/` 或 `_sync-工作区` 留档区，不参与 V6 当前决策。

---

## 归档历史

[docs/archive/](./docs/archive/) — 旧版本 / 一次性文档

**2026-05-20 归档**：

- `10-06对账清单-v3.3.md` — 一次性对账，已落地 06
- `专项/04-系统分析与优化建议.md` — 2026-03 一次性分析

**2026-05-20 原型清理**（不可逆，已 rm）：

- `设计/原型/_archive/` — 院校库 v0.1·v0.2 / 长文 v0.2·v0.3 旧版本
- `设计/原型/了解Tab-长文全景-v0.6.html`
- `设计/原型/_build_*.py` / `_screenshot_*.js` / `_map_svg.json` / `_student_cities*.json` / `_v0*.png` / `_v06_*.png` / `__pycache__/`
- 保留：`地图原型-V3.html` + `院校库-可视化决策图-v0.3.html`（v0.3 定稿）

**2026-05-19 删除**：

- `00-开发步骤总规划.md` → 被 01 §四 阶段规划覆盖
- `07-前后端开发拆解.md` → 被 03 + 04 覆盖
- `08-V1-协作推进计划.md` → 单人 + AI 项目不需要
- `plans/2026-03-06-选校诊断工具-phase1.md` → 当时是 Vue3 + Express，已过时
- `superpowers/specs/2026-03-19-院校库Agent系统设计.md` → 已走 M9 + L2 skill 路径
