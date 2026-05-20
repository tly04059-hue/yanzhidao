# publish 发布层

这里存放小程序可直接读取的数据。

发布层数据必须满足：

1. 字段完整度达到当前阶段要求。
2. 数据已人工或脚本审核。
3. 可追溯到标准化层和源数据。
4. 字段尽量精简，避免把内部来源、匹配状态、待核实内容暴露给前台。

建议文件：

| 文件 | 用途 |
| --- | --- |
| `miniapp_school_publish.json` | 小程序院校库一期展示数据。 |
| `miniapp_path_compare_publish.json` | 管综/党校路径对比数据。 |
| `miniapp_school_filters.json` | 小程序筛选维度和选项。 |

当前运行中的 `schoolData/data.json` 和 `schoolData/dx_data.json` 暂不移动，后续确认小程序读取逻辑后再迁移。
