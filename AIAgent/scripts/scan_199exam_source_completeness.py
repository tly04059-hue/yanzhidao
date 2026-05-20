#!/usr/bin/env python3
"""Scan the full 199-exam source table for L1 field match and completeness."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from typing import Any, Callable

sys.dont_write_bytecode = True

from extract_199exam_sample import (
    clean_direction,
    clean_string,
    is_empty,
    number_or_string,
    parse_label_code_name,
    read_sheet_rows,
    yuan_from_ten_thousand,
)


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT / "schoolData/sourceData/199exam/全量院校表_研招网主表补全.xlsx"
DEFAULT_JSON = ROOT / "schoolData/standardized/199exam/199exam_source_completeness_report.json"
DEFAULT_MD = ROOT / "project_docs/08-全量管综院校数据字段匹配与完整度扫描报告.md"
DEFAULT_SHEET = "全量院校表"


MAJOR_CATEGORY_BY_PREFIX = {
    "1251": "工商管理",
    "1252": "公共管理",
    "1253": "会计",
    "1254": "旅游管理",
    "1255": "图书情报",
    "1256": "工程管理",
    "1257": "审计",
}

MAJOR_BY_PROGRAM = {
    "MBA": ("125100", "工商管理"),
    "MPA": ("125200", "公共管理"),
}

MAJOR_CATEGORY_BY_PROGRAM = {
    "MBA": ("1251", "工商管理"),
    "MPA": ("1252", "公共管理"),
    "MEM": ("1256", "工程管理"),
}


def parse_school_level_display(value: Any) -> str:
    text = clean_string(value)
    if "985" in text:
        return "985"
    if "211" in text:
        return "211"
    if text:
        return "双非"
    return ""


def parse_tuition(value: Any) -> int | float | None:
    text = clean_string(value)
    if not text:
        return None
    match = re.search(r"(\d+(?:\.\d+)?)\s*(?:W|w|万)", text)
    if match:
        number = float(match.group(1))
        yuan = number * 10000
        return int(yuan) if yuan.is_integer() else yuan
    return yuan_from_ten_thousand(text)


def parse_duration(value: Any) -> Any:
    text = clean_string(value)
    if not text:
        return None
    match = re.search(r"(\d+(?:\.\d+)?)\s*年", text)
    if match:
        number = float(match.group(1))
        return int(number) if number.is_integer() else number
    return number_or_string(text)


def parse_major_category(value: Any, part: str) -> str:
    code, _name, _label = parse_label_code_name(value)
    prefix = code[:4]
    name = MAJOR_CATEGORY_BY_PREFIX.get(prefix, "")
    if part == "code":
        return prefix
    if part == "name":
        return name
    if part == "label":
        return f"({prefix}){name}" if prefix and name else ""
    return ""


def major_from_source_or_program(row: dict[str, Any], part: str) -> str:
    code, name, label = parse_label_code_name(row.get("专业代码"))
    if not code:
        code, name = MAJOR_BY_PROGRAM.get(clean_string(row.get("项目")), ("", ""))
        label = f"({code}){name}" if code and name else ""
    return {"code": code, "name": name, "label": label}[part]


def major_category_from_source_or_program(row: dict[str, Any], part: str) -> str:
    code = major_from_source_or_program(row, "code")
    prefix = code[:4]
    name = MAJOR_CATEGORY_BY_PREFIX.get(prefix, "")
    if not prefix:
        prefix, name = MAJOR_CATEGORY_BY_PROGRAM.get(clean_string(row.get("项目")), ("", ""))
    label = f"({prefix}){name}" if prefix and name else ""
    return {"code": prefix, "name": name, "label": label}[part]


def exam_subjects_from_source_or_program(row: dict[str, Any]) -> str:
    text = clean_string(row.get("考试科目"))
    if text:
        return text
    if clean_string(row.get("项目")) in {"MBA", "MPA", "MEM"}:
        return "199管理类综合能力+204英语(二)"
    return ""


def combine_school_label(row: dict[str, Any]) -> str:
    code = clean_string(row.get("学校代码"))
    name = clean_string(row.get("学校名称"))
    if code and name:
        return f"({code}){name}"
    return name


def latest_score(row: dict[str, Any]) -> str:
    return clean_string(row.get("最新分数线")) or clean_string(row.get("今年分数线"))


def retest_info_2025(row: dict[str, Any]) -> str:
    return clean_string(row.get("复试信息"))


def admission_analysis_2025(row: dict[str, Any]) -> str:
    parts = [
        clean_string(row.get("录取分析")),
        clean_string(row.get("分数段统计")),
        clean_string(row.get("总成绩计算方式")),
    ]
    return "\n".join(part for part in parts if part)


def score_line_by_year(header: str) -> Callable[[dict[str, Any]], str]:
    return lambda row: clean_string(row.get(header))


def cell(header: str) -> Callable[[dict[str, Any]], Any]:
    return lambda row: row.get(header)


def parsed_label(header: str, part: str) -> Callable[[dict[str, Any]], str]:
    def getter(row: dict[str, Any]) -> str:
        code, name, label = parse_label_code_name(row.get(header))
        return {"code": code, "name": name, "label": label}[part]

    return getter


def parsed_direction(part: str) -> Callable[[dict[str, Any]], str]:
    def getter(row: dict[str, Any]) -> str:
        code, direction, label = clean_direction(row.get("方向"))
        return {"code": code, "direction": direction, "label": label}[part]

    return getter


def field(
    target: str,
    source_columns: list[str],
    status: str,
    transform: str,
    getter: Callable[[dict[str, Any]], Any],
    note: str = "",
) -> dict[str, Any]:
    return {
        "target_path": target,
        "source_columns": source_columns,
        "match_status": status,
        "transform": transform,
        "note": note,
        "getter": getter,
    }


FIELD_DEFINITIONS = [
    field("program_type", ["项目"], "auto", "trim", cell("项目")),
    field("province", ["地区"], "auto", "trim", cell("地区")),
    field("city", ["城市"], "auto", "trim", cell("城市")),
    field("study_mode", ["学习方式"], "auto", "trim", cell("学习方式")),
    field("duration", ["学制", "学费"], "auto", "parse years from 学制, fallback 学费", lambda row: parse_duration(row.get("学制")) or parse_duration(row.get("学费"))),
    field("tuition_min", ["学费"], "auto", "parse W/万 to yuan", lambda row: parse_tuition(row.get("学费"))),
    field("tuition_max", ["学费"], "auto", "same as tuition_min when single value", lambda row: parse_tuition(row.get("学费"))),
    field("junior_college_allowed", ["是否接受大专报考"], "auto", "trim", cell("是否接受大专报考")),
    field("school_code", ["学校代码"], "auto", "trim", cell("学校代码")),
    field("school_name", ["学校名称"], "auto", "trim", cell("学校名称")),
    field("school_label", ["学校代码", "学校名称"], "derived", "combine code and name", combine_school_label),
    field("school_level", ["院校性质", "学校标签"], "auto", "prefer 院校性质", lambda row: clean_string(row.get("院校性质")) or clean_string(row.get("学校标签"))),
    field("school_level_display", ["院校性质", "学校标签"], "derived", "map to 985/211/双非", lambda row: parse_school_level_display(row.get("院校性质") or row.get("学校标签"))),
    field("department_code", ["院系"], "auto", "parse label", parsed_label("院系", "code")),
    field("department_name", ["院系"], "auto", "parse label", parsed_label("院系", "name")),
    field("department_label", ["院系"], "auto", "preserve label", parsed_label("院系", "label")),
    field("major_category_code", ["专业代码", "项目"], "derived", "derive from major code prefix, fallback program type", lambda row: major_category_from_source_or_program(row, "code")),
    field("major_category_name", ["专业代码", "项目"], "derived", "derive from major code prefix, fallback program type", lambda row: major_category_from_source_or_program(row, "name")),
    field("major_category_label", ["专业代码", "项目"], "derived", "derive from major code prefix, fallback program type", lambda row: major_category_from_source_or_program(row, "label")),
    field("major_code", ["专业代码", "项目"], "derived", "parse label, fallback program type", lambda row: major_from_source_or_program(row, "code")),
    field("major_name", ["专业代码", "项目"], "derived", "parse label, fallback program type", lambda row: major_from_source_or_program(row, "name")),
    field("major_label", ["专业代码", "项目"], "derived", "preserve label, fallback program type", lambda row: major_from_source_or_program(row, "label")),
    field("direction_code", ["方向"], "auto", "parse leading direction code", parsed_direction("code")),
    field("direction", ["方向", "标准项目名称"], "auto", "parse and remove study-mode words", lambda row: parsed_direction("direction")(row) or clean_string(row.get("标准项目名称"))),
    field("direction_label", ["方向"], "auto", "preserve label", parsed_direction("label")),
    field("enrollment", ["招生人数"], "auto", "number_or_string", lambda row: number_or_string(row.get("招生人数"))),
    field("exam_subjects", ["考试科目", "项目"], "derived", "source value, fallback common 199 exam subjects", exam_subjects_from_source_or_program),
    field("latest_score", ["最新分数线", "今年分数线"], "auto", "prefer latest score", latest_score),
    field("score_year", ["最新分数线年份"], "auto", "trim", cell("最新分数线年份")),
    field("total_score", ["总分"], "auto", "number_or_string", lambda row: number_or_string(row.get("总分"))),
    field("english_score", ["英语"], "auto", "number_or_string", lambda row: number_or_string(row.get("英语"))),
    field("comprehensive_score", ["综合"], "auto", "number_or_string", lambda row: number_or_string(row.get("综合"))),
    field("admission", ["录取情况"], "auto", "trim", cell("录取情况")),
    field("admission_rate", ["录取率"], "auto", "trim", cell("录取率")),
    field("class_location", ["上课地点"], "auto", "trim", cell("上课地点")),
    field("class_time", ["上课方式"], "auto", "trim", cell("上课方式")),
    field("adjustment", ["是否接受调剂"], "auto", "trim", cell("是否接受调剂")),
    field("retired_soldier_plan", ["退役计划"], "auto", "trim", cell("退役计划")),
    field("minority_backbone_plan", ["少民计划"], "auto", "trim", cell("少民计划")),
    field("notes", ["备注"], "auto", "trim", cell("备注")),
    field("description", ["学校简介"], "auto", "trim", cell("学校简介")),
    field("website", ["官网"], "auto", "trim", cell("官网")),
    field("logo_url", ["学校Logo"], "auto", "trim", cell("学校Logo")),
    field("interview", ["是否提前面试"], "auto", "trim", cell("是否提前面试")),
    field("retest_info_by_year.2025.notes", ["复试信息"], "partial", "store unstructured retest info under 2025 notes", retest_info_2025, "复试内容较完整，但尚未拆成笔试、面试、形式、参考书等字段。"),
    field("first_choice_admission_by_year.2025.score_line", ["2025分数线", "最新分数线"], "auto", "trim", score_line_by_year("2025分数线")),
    field("first_choice_admission_by_year.2024.score_line", ["2024分数线"], "auto", "trim", score_line_by_year("2024分数线")),
    field("first_choice_admission_by_year.2023.score_line", ["2023分数线"], "auto", "trim", score_line_by_year("2023分数线")),
    field("first_choice_admission_by_year.2022.score_line", ["2022分数线"], "auto", "trim", score_line_by_year("2022分数线")),
    field("first_choice_admission_by_year.2025.score_band_analysis", ["录取分析", "分数段统计"], "partial", "store unstructured admission analysis", admission_analysis_2025, "可保留深度文本，但复试人数、录取人数、复录比等结构化字段需要解析或人工确认。"),
    field("adjustment_admission_by_year.*.quota", [], "manual", "no stable source column", lambda _row: "", "全量主表只有是否接受调剂，没有年度调剂名额、轮次和复试资格线。"),
]


def build_header_map(rows: dict[int, dict[str, Any]], header_row: int = 1) -> dict[str, str]:
    headers = {}
    for column, header in rows[header_row].items():
        text = clean_string(header)
        if text:
            headers[text] = column
    return headers


def normalize_row(raw_row: dict[str, Any], headers: dict[str, str]) -> dict[str, Any]:
    return {header: raw_row.get(column) for header, column in headers.items()}


def scan_source(source_path: Path, sheet_name: str) -> dict[str, Any]:
    rows_by_number = read_sheet_rows(source_path, sheet_name)
    headers = build_header_map(rows_by_number)
    data_rows = [
        (row_number, normalize_row(row, headers))
        for row_number, row in rows_by_number.items()
        if row_number > 1 and not is_empty(row.get(headers.get("项目", "")))
    ]

    program_counter = Counter(clean_string(row.get("项目")) for _row_number, row in data_rows)
    school_name_count = len(
        {
            clean_string(row.get("学校名称")) or clean_string(row.get("学校"))
            for _row_number, row in data_rows
            if not is_empty(row.get("学校名称")) or not is_empty(row.get("学校"))
        }
    )
    school_code_count = len(
        {
            clean_string(row.get("学校代码"))
            for _row_number, row in data_rows
            if not is_empty(row.get("学校代码"))
        }
    )

    field_results = []
    for definition in FIELD_DEFINITIONS:
        non_empty = 0
        examples = []
        for row_number, row in data_rows:
            value = definition["getter"](row)
            if not is_empty(value):
                non_empty += 1
                if len(examples) < 3:
                    examples.append({"row": row_number, "value": value})
        field_results.append(
            {
                "target_path": definition["target_path"],
                "source_columns": definition["source_columns"],
                "match_status": definition["match_status"],
                "transform": definition["transform"],
                "non_empty_count": non_empty,
                "total_count": len(data_rows),
                "coverage": round(non_empty / len(data_rows), 4) if data_rows else 0,
                "examples": examples,
                "note": definition["note"],
            }
        )

    auto_like = [item for item in field_results if item["match_status"] in {"auto", "derived"}]
    partial = [item for item in field_results if item["match_status"] == "partial"]
    manual = [item for item in field_results if item["match_status"] == "manual"]
    phase1_targets = {
        "program_type",
        "province",
        "city",
        "study_mode",
        "duration",
        "tuition_min",
        "school_code",
        "school_name",
        "school_label",
        "school_level_display",
        "department_code",
        "department_name",
        "department_label",
        "major_category_code",
        "major_category_name",
        "major_category_label",
        "major_code",
        "major_name",
        "major_label",
        "direction_code",
        "direction",
        "direction_label",
        "enrollment",
        "latest_score",
        "class_location",
        "class_time",
        "adjustment",
    }
    phase1_results = [item for item in field_results if item["target_path"] in phase1_targets]

    return {
        "metadata": {
            "generated_at": str(date.today()),
            "source_file": str(source_path.relative_to(ROOT)),
            "source_sheet": sheet_name,
            "data_rows": len(data_rows),
            "school_count": school_name_count,
            "school_with_code_count": school_code_count,
            "headers": list(headers.keys()),
            "program_distribution": dict(program_counter),
        },
        "summary": {
            "field_count": len(field_results),
            "auto_or_derived_fields": len(auto_like),
            "partial_fields": len(partial),
            "manual_fields": len(manual),
            "phase1_field_count": len(phase1_results),
            "phase1_fields_coverage_ge_80": sum(1 for item in phase1_results if item["coverage"] >= 0.8),
            "phase1_min_coverage": min((item["coverage"] for item in phase1_results), default=0),
        },
        "field_results": field_results,
        "auto_cleanable_fields": [item for item in field_results if item["match_status"] in {"auto", "derived"} and item["coverage"] >= 0.8],
        "needs_manual_or_parser_fields": [item for item in field_results if item["match_status"] in {"partial", "manual"} or item["coverage"] < 0.8],
    }


def markdown_table(rows: list[dict[str, Any]]) -> str:
    lines = [
        "| L1 字段 | 状态 | 来源列 | 覆盖率 | 处理方式 | 备注 |",
        "| --- | --- | --- | ---: | --- | --- |",
    ]
    status_label = {
        "auto": "可自动清洗",
        "derived": "可自动推导",
        "partial": "可部分清洗",
        "manual": "需人工补充",
    }
    for item in rows:
        source = "、".join(item["source_columns"]) if item["source_columns"] else "无稳定来源列"
        note = item["note"] or ""
        lines.append(
            f"| `{item['target_path']}` | {status_label.get(item['match_status'], item['match_status'])} | {source} | {item['coverage']:.2%} | {item['transform']} | {note} |"
        )
    return "\n".join(lines)


def write_markdown(report: dict[str, Any], output_path: Path) -> None:
    field_results = report["field_results"]
    auto_rows = [item for item in field_results if item["match_status"] in {"auto", "derived"} and item["coverage"] >= 0.8]
    manual_rows = report["needs_manual_or_parser_fields"]
    low_coverage_rows = [item for item in field_results if item["coverage"] < 0.8]
    meta = report["metadata"]
    summary = report["summary"]

    content = f"""# 全量管综院校数据字段匹配与完整度扫描报告

> 更新时间：{meta['generated_at']}  
> 扫描源：`{meta['source_file']}` / `{meta['source_sheet']}`  
> 目的：判断真实全量管综院校数据源中，哪些 L1 字段能自动清洗，哪些字段需要人工补充或进一步解析。

## 1. 数据概况

| 指标 | 结果 |
| --- | ---: |
| 数据行数 | {meta['data_rows']} |
| 学校名称数 | {meta['school_count']} |
| 有研招网学校代码的学校数 | {meta['school_with_code_count']} |
| 源表字段数 | {len(meta['headers'])} |
| L1 扫描字段数 | {summary['field_count']} |
| 可自动/推导字段数 | {summary['auto_or_derived_fields']} |
| 可部分清洗字段数 | {summary['partial_fields']} |
| 需人工补充字段数 | {summary['manual_fields']} |
| 一期字段数 | {summary['phase1_field_count']} |
| 一期覆盖率 >= 80% 字段数 | {summary['phase1_fields_coverage_ge_80']} |
| 一期最低字段覆盖率 | {summary['phase1_min_coverage']:.2%} |

项目分布：

```json
{json.dumps(meta['program_distribution'], ensure_ascii=False, indent=2)}
```

## 2. 结论

这张全量主表可以作为正式 L1 清洗的主数据源。它对一期核心字段中的项目、学校名称、城市、学习方式、学制、学费、院系名称、专业、方向、招生人数、分数线、上课地点、是否调剂等字段覆盖度较高，可以进入自动清洗流程。

需要特别注意的是：当前全量主表只有 MPA 和 MBA，没有 MEM；省份、研招网学校代码、院系代码、院校性质、是否接受大专、退役计划、少骨计划等字段覆盖不足，需要查表补齐或人工确认。专业类别字段在源表中没有单独列，但可以从项目类型或专业代码前四位自动推导。复试考情和录取分析有较多文本信息，但尚未按字段表拆成笔试内容、面试内容、复试人数、录取人数、复录比、调剂名额等结构化字段；调剂深度数据目前没有稳定来源列。

## 3. 可自动清洗字段

{markdown_table(auto_rows)}

## 4. 需要人工补充或进一步解析字段

{markdown_table(manual_rows)}

## 5. 覆盖率低于 80% 的字段

{markdown_table(low_coverage_rows)}

## 6. 建议

1. 以 `全量院校表_研招网主表补全.xlsx` 作为管综 L1 正式清洗主表。
2. 当前主表只覆盖 MPA/MBA，MEM 需要另找源表或后续补充。
3. 专业类别采用专业代码前四位或项目类型自动推导，先覆盖 MPA/MBA/MEM 的 `1252/1251/1256`。
4. 学校代码、省份、院系代码、专项计划字段需要建立补齐表，不建议在主清洗脚本里硬猜。
5. 一期发布层可以先使用覆盖率达标字段，低覆盖或深度字段先留在 L1 信息库。
6. 对 `复试信息`、`录取分析`、`分数段统计` 单独做二次解析脚本，不要直接混入一期展示字段。
7. 调剂年度名额、轮次、复试资格线目前需要人工补或另找来源。
"""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scan full 199-exam source completeness for L1 fields.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--sheet", default=DEFAULT_SHEET)
    parser.add_argument("--json-output", type=Path, default=DEFAULT_JSON)
    parser.add_argument("--md-output", type=Path, default=DEFAULT_MD)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    report = scan_source(args.source, args.sheet)
    args.json_output.parent.mkdir(parents=True, exist_ok=True)
    args.json_output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_markdown(report, args.md_output)
    print(
        json.dumps(
            {
                "ok": True,
                "json_output": str(args.json_output.relative_to(ROOT)),
                "md_output": str(args.md_output.relative_to(ROOT)),
                "data_rows": report["metadata"]["data_rows"],
                "summary": report["summary"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
