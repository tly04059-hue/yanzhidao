# standardized 标准化层

这里存放清洗后的院校库标准数据。

建议文件：

| 文件 | 用途 |
| --- | --- |
| `school_program_master.json` | 院校/项目/方向标准主表。 |
| `school_program_master.meta.json` | 数据批次、来源、字段完整度、审核状态。 |
| `admission_stats_master.json` | 分数线、录取分析、分数段等统计数据。 |

当前阶段先建立结构，不急着迁移现有 `data.json` 和 `dx_data.json`。

生成规则：

1. 从 `sourceData/` 读取源数据。
2. 清洗为稳定字段。
3. 每条数据保留 `source_file`、`source_row`、`batch_id`。
4. 不直接给前台展示，先进入发布层筛选。
