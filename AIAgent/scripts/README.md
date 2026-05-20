# AIAgent scripts

本目录保存数据飞轮和数据清洗相关脚本，不承载小程序运行时代码。

| 脚本 | 用途 |
| --- | --- |
| `extract_199exam_sample.py` | 从 `schoolData/sourceData/199exam/管综院校字段表.xlsx` 示例行提取 5 条管综 L1 样例记录，用于验证字段拆分、学费换算、年度嵌套和完整度计算。 |
| `scan_199exam_source_completeness.py` | 扫描 `全量院校表_研招网主表补全.xlsx` 对 L1 字段的匹配度和完整度，输出 JSON 与 Markdown 报告。 |
| `generate_199exam_backfill_tasks.py` | 根据字段完整度扫描报告生成管综字段补齐任务表，输出 JSON、CSV 和 Markdown。 |
| `generate_199exam_school_lookup.py` | 生成“学校名称 -> 省份/学校代码”补齐对照表；省份可按来源推导，学校代码无稳定来源时不硬猜。 |
| `build_199exam_l1_master.py` | 基于全量管综主表和学校对照表生成正式 L1 主数据初版。 |
| `build_199exam_l2_publish.py` | 从管综 L1 主数据和 MEM HTML 标准化记录生成小程序 L2 发布数据和筛选项。 |
| `build_mem_from_199exam_html.py` | 从研招网 MEM HTML 抓取文件重建 `schoolData/mem.json`，并同步输出 MEM L1 标准化记录和提取报告。 |
| `inspect_student_case_sources.py` | 只读检查学生案例 Excel 源表，输出 sheet、字段、样例行和完整度摘要。 |
| `build_student_cases_from_sources.py` | 从党校/管综学生案例源表生成匿名 L1 案例库和小程序 L2 发布案例库。 |
| `build_recommendation_strategies_l2.py` | 从推荐策略种子生成 L1 标准化策略库和小程序 L2 发布策略库。 |
