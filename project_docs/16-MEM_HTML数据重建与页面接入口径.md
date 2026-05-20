# MEM HTML 数据重建与页面接入口径

> 更新时间：2026-05-18  
> 来源：`schoolData/sourceData/199exam/html`  
> 输出：`schoolData/mem.json`、`schoolData/standardized/199exam/199exam_mem_school_program_master.json`

## 1. 生成结果

| 地区 | 学校数 | 招生方向数 |
| --- | ---: | ---: |
| scData | 8 | 32 |
| cqData | 5 | 39 |
| ynData | 4 | 19 |
| gzData | 2 | 7 |

源 HTML 文件数：14。
L1 标准化记录数：97。

## 2. 落库口径

1. `mem.json` 采用与 `data.json` 兼容的地区结构：`scData/cqData/ynData/gzData -> MEM`。
2. MEM 四个细分专业不拆成四个顶层项目，而是保留在每条 `program.major` 和 `extensions.mem_by_major` 中。
3. HTML 中的 tooltip 信息被提取到 `notes`、`enrollment`、`exam_subjects`、`tuition`、`duration` 等字段。
4. 当前源 HTML 不包含复试线、拟录取分析和录取率，这些字段留空，不伪造。
5. L1 标准化记录同步输出，后续可并入小程序 L2 管综发布数据。

## 3. 后续注意

后续如果 HTML 源文件更新，直接重跑 `AIAgent/scripts/build_mem_from_199exam_html.py`，不要手工改 `mem.json`。
