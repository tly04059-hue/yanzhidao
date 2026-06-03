# cases.json 前端接入指引

> 版本：v0.3 | 日期：2026-05-29（v0.2 → v0.3：cases.json 升至 v0.5.1 · 125 条 · 29 公开字段）
> 适用文件：`data/derived-from-context/cases.json`（**v0.5.1/V6 正式消费版 · 125 条 · 29 公开字段**）
> 配套 schema：`docs/cases-json-schema-v0.3-spec.md`（路径名留 v0.3 · 内部已升 v0.5.1）
> 目标：给前端同事接 V6 `#11/#14/#17/#22/#23/#24/#29` 时直接照抄字段、DOM 锚点和 `loadCases` 模式。

---

## 1. 读取模式

正式前端只读 `data/derived-from-context/cases.json`，不要读 `_sync-工作区`、M8、投稿目录或 stage1 工作区。

```js
const CASES_URL = './data/derived-from-context/cases.json';

async function loadCases() {
  const resp = await fetch(CASES_URL, { cache: 'no-cache' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json();
  const cases = json?.data?.cases || [];
  return {
    meta: json._meta || json.meta || {},
    cases,
    total: json?._meta?.total || json?.data?.case_count || cases.length,
    pageSize: json?._meta?.page_size || 10,
  };
}
```

`file://` 下 `fetch()` 可能失败；本地联调用 `python3 -m http.server` 或前端项目 dev server。

---

## 2. V6 动态点 → DOM → 字段

| 动态点 | 页面 / DOM 锚点 | 读取字段 | 渲染规则 |
|---|---|---|---|
| #11 真实作用 | `#result` 内“真实作用”卡；建议新增 `#result-real-effect-list` | `reflection`, `system`, `reason_tags`, `chosen_path` | 按用户画像筛出相近 case，优先展示 `reflection`；无匹配时用 `copy.json` 兜底 |
| #14 5a 相似个案卡 | `#result` 内 5a；建议新增 `#result-peer-cases` | `display_name`, `age_concrete`, `unit_narrative`, `education`, `edu_modifier`, `work_years`, `is_party_member`, `chosen_school`, `outcome`, `key_quote`, `profile_combo_id` | K-NN 或画像过滤后取 3-4 条；标题用姓名/年龄/单位叙事，正文用学校+金句 |
| #17 5b 双卡理由聚合 | `#result` 内 5b；建议新增 `#result-reason-compare` | `reason_keywords`, `reason_tags`, `chosen_path`, `chosen_path_label` | 按 A/B 两条路径分别聚合 top tags/keywords，生成两侧理由卡 |
| #22 案例库筛选 chip | `#cases-filter-system`, `#cases-filter-others` | `system_chip`, `education`, `age_band`, `chosen_path` | chip 值直接等值过滤；展示文字可用 `chosen_path_label` |
| #23 案例卡列表 | `#cases-list` | `display_name`, `age_concrete`, `unit_narrative`, `education`, `edu_modifier`, `work_years`, `chosen_school`, `key_quote`, `system_chip`, `chosen_path_label`, `completeness_score`, `display_priority` | 排序建议：`display_priority desc` → `completeness_score desc` → `case_id asc` |
| #24 滚动加载 | `#cases-load-more` | `_meta.total`, `_meta.page_size`, `data.case_count` | 默认 10 条/页；按钮文案显示剩余数量 |
| #29 长图相似故事 4 张 | `#zexiao` §6；建议新增 `#zexiao-similar-stories` | `story_summary`, `story_tags`, `narrative_choose`, `key_quote`, `display_name`, `age_concrete`, `unit_narrative`, `chosen_school` | 从 `zexiao.json` 契约拿场景，再到 `cases.json` 取 4 条故事卡 |

当前 `6.0-实现稿-claude.html` 已接通 #22/#23/#24；#11/#14/#17/#29 仍需前端继续接。

---

## 3. 案例卡渲染模板

```js
function renderCaseCard(c) {
  const age = c.age_concrete || c.age_band || '';
  const edu = [c.edu_modifier, c.education].filter(Boolean).join('');
  const work = c.work_years ? `工龄 ${c.work_years}` : '';
  const party = c.is_party_member === true ? ' · 党员' : '';
  const unit = c.unit_narrative || `${c.region || ''}${c.system_chip || c.system || ''}`;
  const title = `${c.display_name} · ${age}${party}${unit ? ' · ' + unit : ''}`;

  return `
    <div class="card" data-case-id="${escapeHtml(c.case_id)}">
      <h3 class="case-card-title">${escapeHtml(title)}</h3>
      ${edu || work ? `<p class="text-sm text-2">${escapeHtml([edu, work].filter(Boolean).join(' · '))}</p>` : ''}
      ${c.chosen_school ? `<p class="mt-3">选了：<b class="text-accent">${escapeHtml(c.chosen_school)}</b></p>` : ''}
      ${c.key_quote ? `<p class="text-sm text-2" style="font-style: italic;">"${escapeHtml(truncate(c.key_quote, 100))}"</p>` : ''}
      <div class="mt-3">
        ${c.system_chip ? `<span class="chip chip-accent">${escapeHtml(c.system_chip)}</span>` : ''}
        ${edu ? `<span class="chip">${escapeHtml(edu)}</span>` : ''}
        ${c.chosen_path_label ? `<span class="chip chip-success">${escapeHtml(c.chosen_path_label)}</span>` : ''}
      </div>
    </div>
  `;
}
```

---

## 4. 过滤与分页约定

```js
const state = {
  all: [],
  filtered: [],
  page: 0,
  pageSize: 10,
  filters: {
    system_chip: '',
    education: '',
    age_band: '',
    chosen_path: '',
  },
};

function applyCaseFilters() {
  state.filtered = state.all.filter(c =>
    Object.entries(state.filters).every(([key, value]) => !value || c[key] === value)
  );
  state.filtered.sort((a, b) =>
    (b.display_priority || 0) - (a.display_priority || 0) ||
    (b.completeness_score || 0) - (a.completeness_score || 0) ||
    String(a.case_id).localeCompare(String(b.case_id))
  );
  state.page = 0;
}

function visibleCases() {
  return state.filtered.slice(0, (state.page + 1) * state.pageSize);
}
```

---

## 5. 兜底规则

| 字段 | 兜底 |
|---|---|
| `age_concrete` | 用 `age_band` |
| `unit_narrative` | 用 `region + system_chip` |
| `education + edu_modifier` | 只展示有值部分 |
| `key_quote` | 用 `reflection`；再无则隐藏金句行 |
| `reason_tags/reason_keywords` | 无值则不进入 #17 聚合 |
| `story_summary` | 无值则用 `narrative_choose` + `chosen_school` 拼短句 |

---

## 6. 隐私边界

- 前端只展示无 `_` 前缀字段。
- 不展示 `_touding_case_id / _m8_case_id / _full_text_ref / _party_inferred_via`。
- 不反查 M8、报名表、投稿原文。
- 不展示真实姓名、单位全称、详细地址、老师名、联系方式。
- 具体年龄只允许展示 `age_concrete` 的“约 N 岁 / N 岁左右”口径。

---

## 6.5 v0.4 新增 4 字段（2026-05-29 升级 · 仅投稿 27 case 完整 · 旧 29 + v04 69 数据源缺失不补）

| 字段 | 类型 | 派生来源 | 前端用法 | 填充率 |
|---|---|---|---|---|
| `study_method` | string ~120 字 | 方法栈 + 学习模式 | 详情页"她怎么学的"段 · 用 `<details>` 折叠展开 | 27/27 ✓ |
| `turning_point` | string ~160 字 | 转折点 + 触发场景 | 详情页"决策瞬间"段 · 强故事感 | 26/27 |
| `engaged_products` | array[1-8] | 研知道方法引用关键词扫 | 详情页"她用了哪些产品"list · 用 chip 风格展示 | 26/27 |
| `prep_duration` | string 短 | 总耗时段 regex | #22 chip 加"备考时长"维度（"2 个月" / "9 年" 等）| 26/27 |

**接通建议**：#14 5a 相似个案卡的详情页（`<details>` 展开段）和 #29 长图故事卡，可以消费这 4 个新字段为详情页 TMDR 弹药段。前端示例：

```js
// 在 #14 卡片基础上加详情段
function renderCaseDetail(c) {
  return `
    <details>
      <summary>她怎么学的 / 决策瞬间 / 她用了哪些产品</summary>
      ${c.study_method ? `<p><b>方法：</b>${escapeHtml(c.study_method)}</p>` : ''}
      ${c.turning_point ? `<p><b>决策瞬间：</b>${escapeHtml(c.turning_point)}</p>` : ''}
      ${(c.engaged_products || []).length ? `<p><b>用过的产品：</b>${c.engaged_products.map(p => `<span class="chip">${escapeHtml(p)}</span>`).join('')}</p>` : ''}
      ${c.prep_duration ? `<p><b>备考时长：</b>${escapeHtml(c.prep_duration)}</p>` : ''}
    </details>
  `;
}
```

**降级**：旧 29 + v04 69 条这 4 字段为空 · 详情页 `<details>` 段对它们隐藏（用 `c.study_method && ...` 判空守卫）。

---

## 7. 当前接入状态

| 动态点 | 状态 | 说明 |
|---|---|---|
| #22 | 已接 | `#cases-filter-system` 已按 `system_chip` 筛选 |
| #23 | 已接 | `#cases-list` 已渲染案例卡 |
| #24 | 已接 | `#cases-load-more` 已按 10 条分页 |
| #11 | 待接 | 需要把 `reflection` 接入结果页真实作用区 |
| #14 | 待接 | 需要把相似个案卡从静态改为 cases/peer_profile 驱动 |
| #17 | 待接 | 需要做 A/B 路径理由聚合 |
| #29 | 待接 | 需要把长图 4 张故事卡接到 cases/zexiao |
