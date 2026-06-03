# 案例库 L1 / L2 字段改造方案（system / position / goal / party_member）

> 更新时间：2026-05-22  
> 范围：`studentCases/standardized/student_cases_l1_anonymized.json`、`studentCases/schemas/student_cases_miniapp_publish.schema.json`、`studentCases/publish/student_cases_miniapp_publish.json`  
> 目标：把 `system_tag / position_tag / goal_tag / party_member_tag` 这 4 个字段，定成一版可直接实施的 L1 / L2 字段改造方案，并明确与现有 `tags[]`、旧页面的兼容方式。

## 1. 本次改造的原则

1. **先加字段，不先删字段**
   - 旧的 `tags[]`、`profile` 文本、`target` 文本继续保留。
   - 新字段先进入 L1 和 L2，前台逐步切换读取顺序。

2. **L1 放结构化真值，L2 放前台可直接消费的简化字段**
   - L1 负责保留来源清晰、可回溯的结构。
   - L2 负责让小程序和结果页少做二次猜测。

3. **兼容旧页面**
   - 旧案例库页面仍可继续读 `title / profile / target / tags[]`。
   - 结果页同行匹配后续优先改读新字段。

4. **党校系和管综系分开处理**
   - 管综系优先走规则抽取。
   - 党校系允许更多 `待确认`，并预留人工补标入口。

## 2. 现状问题

### 2.1 L1 当前结构

当前 L1 大致是：

```json
{
  "case_id": "case-199-1415a95c8d",
  "system": "管综系",
  "program_type": "MPA",
  "profile": {
    "age_band": "25岁以下",
    "work_function": "交通管理"
  },
  "target": {
    "target_program": "MPA",
    "target_school": "重庆院校",
    "motivation": "体制内公务员,学历提升,提高学习能力"
  },
  "tags": ["体制内", "学历提升"]
}
```

问题：

- `system_tag / position_tag / goal_tag / party_member_tag` 没有结构化字段。
- 同行匹配只能去 `work_function / motivation / tags[] / 文本` 里猜。

### 2.2 L2 当前结构

当前 L2 大致是：

```json
{
  "id": "case-199-dde10fc97d",
  "system": "管综系",
  "program_type": "MPA",
  "party_school": "",
  "title": "刘女士｜MPA 案例 · 30-35 · 四川大学",
  "profile": "30-35 · 精神文明建设 · 首次备考",
  "target": "MPA · 四川大学",
  "tags": ["MPA", "遴选", "体制内", "学历提升"]
}
```

问题：

- L2 没有可直接读取的画像字段。
- 结果页同行匹配如果只用 L2，只能继续全文匹配。

## 3. 建议的 L1 改造方案

### 3.1 改造目标

在不破坏现有字段的前提下，给 L1 增加一组**标准化匹配画像字段**。

### 3.2 建议新增字段位置

建议放在 `persona` 下，不要继续散落在 `profile / target / tags` 之间。

#### 新的 L1 结构建议

```json
{
  "case_id": "case-199-1415a95c8d",
  "system": "管综系",
  "program_type": "MPA",
  "profile": {
    "age_band": "25岁以下",
    "work_function": "交通管理"
  },
  "target": {
    "target_program": "MPA",
    "target_school": "重庆院校",
    "motivation": "体制内公务员,学历提升,提高学习能力"
  },
  "persona": {
    "system_tag": "公检法纪检",
    "position_tag": "公安系统",
    "goal_tag": ["学历提升"],
    "party_member_tag": "待确认"
  },
  "tags": ["MPA", "学历提升", "公安系统"]
}
```

### 3.3 为什么新建 `persona`

优点：

- 把“用于同行匹配的字段”集中在一个地方。
- 不污染 `profile` 的原始画像字段。
- 以后还可以继续往 `persona` 下补：
  - `education_level_tag`
  - `study_time_tag`
  - `math_base_tag`
  - `english_base_tag`

### 3.4 L1 字段定义

| 字段 | 类型 | 必填建议 | 说明 |
| --- | --- | --- | --- |
| `persona.system_tag` | `string` | 是 | 无法判断时写 `待确认` |
| `persona.position_tag` | `string` | 是 | 无法判断时写 `待确认` |
| `persona.goal_tag` | `string[]` | 是 | 无法判断时写 `["待确认"]` |
| `persona.party_member_tag` | `string` | 是 | 无法判断时写 `待确认` |

### 3.5 L1 不建议做的事

- 不建议把这 4 个字段直接塞回 `profile`
- 不建议只写到 `tags[]`
- 不建议只在 L2 增加，而 L1 没有结构化来源

## 4. 建议的 L2 改造方案

### 4.1 改造目标

让前台结果页和案例库页面，能直接读取这 4 个字段，而不是反解析文案。

### 4.2 建议新增字段位置

L2 不需要完整复制 L1 的复杂结构，建议把常用字段**平铺**到 case 顶层。

#### 新的 L2 结构建议

```json
{
  "id": "case-199-dde10fc97d",
  "system": "管综系",
  "program_type": "MPA",
  "party_school": "",
  "system_tag": "公检法纪检",
  "position_tag": "公安系统",
  "goal_tag": ["学历提升"],
  "party_member_tag": "待确认",
  "title": "刘女士｜MPA 案例 · 30-35 · 四川大学",
  "profile": "30-35 · 精神文明建设 · 首次备考",
  "target": "MPA · 四川大学",
  "tags": ["MPA", "学历提升", "公安系统"]
}
```

### 4.3 为什么 L2 用平铺

原因很简单：

- 小程序页面读顶层字段更直接
- 结果页同行匹配逻辑更轻
- 旧页面想继续只读 `title/profile/tags` 也不受影响

### 4.4 L2 字段定义

| 字段 | 类型 | 必填建议 | 说明 |
| --- | --- | --- | --- |
| `system_tag` | `string` | 是 | 无法判断时 `待确认` |
| `position_tag` | `string` | 是 | 无法判断时 `待确认` |
| `goal_tag` | `string[]` | 是 | 无法判断时 `["待确认"]` |
| `party_member_tag` | `string` | 是 | 无法判断时 `待确认` |

## 5. Schema 改造建议

### 5.1 L1 Schema

当前仓库里还没有独立的 `student_cases_l1_anonymized.schema.json`。

建议新增：

```text
studentCases/schemas/student_cases_l1_anonymized.schema.json
```

建议至少约束：

```json
{
  "persona": {
    "type": "object",
    "required": ["system_tag", "position_tag", "goal_tag", "party_member_tag"],
    "properties": {
      "system_tag": { "type": "string" },
      "position_tag": { "type": "string" },
      "goal_tag": { "type": "array", "items": { "type": "string" } },
      "party_member_tag": { "type": "string" }
    }
  }
}
```

### 5.2 L2 Publish Schema

当前发布 schema 在：

- [student_cases_miniapp_publish.schema.json](/Users/march/yanzhidao/studentCases/schemas/student_cases_miniapp_publish.schema.json)

建议在 `cases.items.properties` 里新增：

```json
{
  "system_tag": { "type": "string" },
  "position_tag": { "type": "string" },
  "goal_tag": { "type": "array", "items": { "type": "string" } },
  "party_member_tag": { "type": "string" }
}
```

建议进入 `required`：

- `system_tag`
- `position_tag`
- `goal_tag`
- `party_member_tag`

原因：

- 这几个字段要变成“发布层的正式能力”，而不是可有可无的临时补丁。

## 6. `tags[]` 的角色怎么处理

改造后，`tags[]` 不删除，但角色要降级。

### 6.1 改造前

`tags[]` 兼任：

- 页面筛选
- 展示标签
- 同行匹配
- 兜底全文检索

### 6.2 改造后

`tags[]` 只保留 3 个职责：

1. 案例库页面筛选
2. 展示标签
3. 旧逻辑兼容

结果页同行匹配的读取顺序建议改成：

1. 先读结构化字段：`system_tag / position_tag / goal_tag / party_member_tag`
2. 再读 `tags[]`
3. 最后才回退到全文文本

## 7. Filters 结构要不要一起改

建议一起改。

当前 L2 schema 里的 `filters` 还是旧口径：

- `systems`
- `program_types`
- `party_schools`
- `tags`

建议扩展成：

```json
{
  "filters": {
    "systems": [],
    "program_types": [],
    "party_schools": [],
    "positions": [],
    "goals": [],
    "party_members": [],
    "tags": []
  }
}
```

说明：

- 这一步不要求前台马上启用全部筛选。
- 但发布层先把结构留出来，后面页面能力才不会被 schema 卡住。

## 8. 与旧页面兼容方案

### 第一步

先只改数据结构：

- L1 新增 `persona`
- L2 新增 4 个顶层字段
- `tags[]` 保持不变

前台页面暂时不改。

### 第二步

结果页同行匹配优先读新字段。

### 第三步

案例库页面如果后面要做更细筛选，再接 `positions / goals / party_members`。

### 这样做的好处

- 不会一次性把旧页面推翻
- 可以先让结果页收益最大化
- 案例库页面的 UI 改造可以后置

## 9. 数据生成链路建议

建议后续生成顺序改成：

1. 源表 -> L1 原始匿名结构
2. L1 原始匿名结构 -> 补 `persona`
3. L1 + `persona` -> 生成 L2 发布层
4. L2 发布层同步写 `tags[]`

也就是说，**标签字段的真源头应该是 L1 的 `persona`，不是前台临时拼出来的 `tags[]`。**

## 10. 建议的最小实施改动

如果只做最小够用版本，建议这次实施范围是：

1. 新增 `student_cases_l1_anonymized.schema.json`
2. 扩展 `student_cases_miniapp_publish.schema.json`
3. 在 L1 加 `persona`
4. 在 L2 case 顶层加：
   - `system_tag`
   - `position_tag`
   - `goal_tag`
   - `party_member_tag`
5. 扩展 `filters`：
   - `positions`
   - `goals`
   - `party_members`

## 11. 本轮建议结论

最终建议采用：

- **L1：新增 `persona` 对象**
- **L2：新增 4 个顶层字段**
- **`tags[]` 保留，但从“主数据承载层”降级为“兼容和展示层”**

这是当前改动成本和后续可维护性之间最平衡的一版方案。
