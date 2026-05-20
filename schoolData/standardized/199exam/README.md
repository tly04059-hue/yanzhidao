# 管综 L1 标准化数据目录

> 适用范围：MPA、MEM、MBA 管综院校库。

## 1. 目录定位

本目录用于保存管综院校库 L1 标准化数据。

L1 是完整信息库，不直接等同于小程序前台展示数据。前台发布数据应从 L1 中筛选、审核、裁剪后进入 L2 发布层。

## 2. 建议文件

| 文件 | 用途 |
| --- | --- |
| `199exam_school_program_master.json` | 管综院校项目标准主表。后续清洗真实数据时生成。 |
| `199exam_school_program_master.meta.json` | 可选。记录数据批次、来源、更新时间、完整度摘要。 |

## 3. 主文件结构

```json
{
  "metadata": {
    "dataset": "199exam_school_program_master",
    "version": "2026-05-initial",
    "record_grain": "program_school_department_major_direction_study_mode",
    "source_files": [],
    "updated_at": "2026-05-14"
  },
  "records": []
}
```

## 4. 记录粒度

标准化记录的最小粒度为：

```text
项目 -> 学校 -> 院系 -> 专业类别 -> 专业 -> 研究方向 -> 学习方式
```

同一学校可能因为项目、院系、专业、方向或学习方式不同，产生多条记录。

## 5. 必须遵守

1. 前台可以展示合并文本，但 L1 必须同时保留 `code/name/label`。
2. 学费单位统一为元。
3. 研究方向不写学习方式。
4. 年度复试、年度一志愿、年度调剂数据按年份嵌套。
5. 原始来源、sheet、行号、批次必须可追溯。
