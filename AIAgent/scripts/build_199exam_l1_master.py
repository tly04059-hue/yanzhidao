#!/usr/bin/env python3
"""Build the initial L1 master JSON for 199-exam programs."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True

from extract_199exam_sample import (
    clean_direction,
    clean_string,
    get_path,
    is_empty,
    number_or_string,
    order_record,
    parse_label_code_name,
    read_sheet_rows,
    study_mode_code,
)
from scan_199exam_source_completeness import (
    exam_subjects_from_source_or_program,
    major_category_from_source_or_program,
    major_from_source_or_program,
    parse_duration,
    parse_school_level_display,
    parse_tuition,
)


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT / "schoolData/sourceData/199exam/全量院校表_研招网主表补全.xlsx"
DEFAULT_LOOKUP = ROOT / "schoolData/standardized/199exam/199exam_school_identity_lookup.json"
DEFAULT_OUTPUT = ROOT / "schoolData/standardized/199exam/199exam_school_program_master.json"
DEFAULT_REPORT = ROOT / "schoolData/standardized/199exam/199exam_school_program_master.report.json"
DEFAULT_MD = ROOT / "project_docs/11-管综L1正式主数据初版生成报告.md"
DEFAULT_SHEET = "全量院校表"


PHASE1_STRICT_FIELDS = [
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
    "junior_college_allowed",
]

DEFERRED_FIELDS = {"junior_college_allowed"}
PRIORITY_PROVINCES = {"四川", "重庆"}


def short_hash(value: str, length: int = 10) -> str:
    return hashlib.sha1(value.encode("utf-8")).hexdigest()[:length]


def header_map(rows: dict[int, dict[str, Any]]) -> dict[str, str]:
    return {clean_string(value): column for column, value in rows[1].items() if clean_string(value)}


def value(row: dict[str, Any], headers: dict[str, str], name: str) -> str:
    column = headers.get(name)
    return clean_string(row.get(column)) if column else ""


def normalized_row(row: dict[str, Any], headers: dict[str, str]) -> dict[str, Any]:
    return {name: row.get(column) for name, column in headers.items()}


def load_lookup(path: Path) -> dict[str, dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return {item["school_name"]: item for item in payload["records"]}


def school_identity(row: dict[str, Any], lookup: dict[str, dict[str, Any]]) -> dict[str, str]:
    school_name = clean_string(row.get("学校名称")) or clean_string(row.get("学校"))
    item = lookup.get(school_name, {})
    school_code = clean_string(item.get("school_code")) or clean_string(row.get("学校代码"))
    province = clean_string(item.get("province")) or clean_string(row.get("地区"))
    school_label = f"({school_code}){school_name}" if school_code else school_name
    school_id = school_code or f"pending-{short_hash(school_name)}"
    return {
        "school_id": school_id,
        "school_code": school_code,
        "school_name": school_name,
        "school_label": school_label,
        "province": province,
        "identity_status": clean_string(item.get("status")) or "needs_review",
        "identity_confidence": clean_string(item.get("confidence")) or "",
        "identity_review_notes": clean_string(item.get("review_notes")),
    }


def parse_department(value_text: Any) -> tuple[str, str, str]:
    code, name, label = parse_label_code_name(value_text)
    if not label:
        return "", "", ""
    return code, name, label


def parse_direction_from_row(row: dict[str, Any]) -> tuple[str, str, str]:
    raw = clean_string(row.get("方向")) or clean_string(row.get("项目名称")) or clean_string(row.get("标准项目名称"))
    code, direction, label = clean_direction(raw)
    direction = re.sub(r"^[()（）]+|[()（）]+$", "", direction).strip()
    direction = re.sub(r"^\((非全|全日|非全日制|全日制)\)", "", direction).strip()
    if not direction:
        direction = clean_string(row.get("标准项目名称"))
    if not label:
        label = raw or direction
    return code, direction, label


def score_line_parts(score_line: str) -> tuple[Any, Any, Any]:
    parts = re.findall(r"\d+(?:\.\d+)?", clean_string(score_line))
    values = []
    for part in parts[:3]:
        number = float(part)
        values.append(int(number) if number.is_integer() else number)
    while len(values) < 3:
        values.append(None)
    return values[0], values[1], values[2]


def latest_score(row: dict[str, Any]) -> str:
    return clean_string(row.get("最新分数线")) or clean_string(row.get("今年分数线"))


def build_year_score_data(row: dict[str, Any]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for year in ["2025", "2024", "2023", "2022"]:
        score = clean_string(row.get(f"{year}分数线"))
        if score:
            result[year] = {"score_line": score}
    analysis_parts = [
        clean_string(row.get("录取分析")),
        clean_string(row.get("分数段统计")),
        clean_string(row.get("总成绩计算方式")),
    ]
    analysis = "\n".join(part for part in analysis_parts if part)
    if analysis:
        result.setdefault("2025", {})["score_band_analysis"] = analysis
    return result


def build_retest_data(row: dict[str, Any]) -> dict[str, dict[str, Any]]:
    retest = clean_string(row.get("复试信息"))
    if not retest:
        return {}
    data = {"notes": retest}
    calculation = clean_string(row.get("总成绩计算方式"))
    if calculation:
        data["total_score_calculation"] = calculation
    return {"2025": data}


def build_adjustment_data(_row: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {}


def build_tags(record: dict[str, Any]) -> list[str]:
    tags = ["管综"]
    for key in ["program_type", "province", "city", "school_level_display", "study_mode", "class_time"]:
        text = clean_string(record.get(key))
        if text and text not in tags:
            tags.append(text)
    if record.get("province") in PRIORITY_PROVINCES and "川渝优先" not in tags:
        tags.append("川渝优先")
    return tags


def quality(record: dict[str, Any]) -> dict[str, Any]:
    strict_missing = [field for field in PHASE1_STRICT_FIELDS if is_empty(get_path(record, field))]
    operational_fields = [field for field in PHASE1_STRICT_FIELDS if field not in DEFERRED_FIELDS]
    operational_missing = [field for field in operational_fields if is_empty(get_path(record, field))]
    strict_score = round((len(PHASE1_STRICT_FIELDS) - len(strict_missing)) / len(PHASE1_STRICT_FIELDS), 4)
    operational_score = round((len(operational_fields) - len(operational_missing)) / len(operational_fields), 4)
    review_status = "needs_review" if strict_missing else "draft"
    return {
        "completeness_score": strict_score,
        "operational_completeness_score": operational_score,
        "missing_fields": strict_missing,
        "deferred_fields": sorted(DEFERRED_FIELDS),
        "operational_missing_fields": operational_missing,
        "review_status": review_status,
        "publish_ready": False,
        "phase1_completeness_pass": strict_score >= 0.8,
        "operational_phase1_pass": operational_score >= 0.8,
    }


def make_ids(record: dict[str, Any], row_number: int) -> None:
    program = clean_string(record.get("program_type")).lower() or "unknown"
    school = clean_string(record.get("school_code")) or f"pending-{short_hash(clean_string(record.get('school_name')))}"
    department = clean_string(record.get("department_code")) or f"dept-{short_hash(clean_string(record.get('department_name')))}"
    major = clean_string(record.get("major_code")) or f"major-{short_hash(clean_string(record.get('major_name')))}"
    direction = clean_string(record.get("direction_code")) or f"dir-{short_hash(clean_string(record.get('direction')))}"
    mode = study_mode_code(clean_string(record.get("study_mode")))
    record["program_id"] = f"199-{program}-{school}-2026"
    record["track_id"] = f"{school}-{department}-{major}-{direction}-{mode}"
    record["record_id"] = f"199-{program}-{school}-{department}-{major}-{direction}-{mode}-r{row_number}"


def normalize_record(row: dict[str, Any], row_number: int, lookup: dict[str, dict[str, Any]]) -> dict[str, Any]:
    identity = school_identity(row, lookup)
    department_code, department_name, department_label = parse_department(row.get("院系") or row.get("学院"))
    direction_code, direction, direction_label = parse_direction_from_row(row)
    score = latest_score(row)
    total_score = number_or_string(row.get("总分"))
    english_score = number_or_string(row.get("英语"))
    comprehensive_score = number_or_string(row.get("综合"))
    if is_empty(total_score) and score:
        total_score, english_score, comprehensive_score = score_line_parts(score)

    school_level = clean_string(row.get("院校性质")) or clean_string(row.get("学校标签"))
    school_level_display = parse_school_level_display(school_level)
    program_type = clean_string(row.get("项目")) or clean_string(row.get("请求专业类型"))
    city = clean_string(row.get("城市")) or clean_string(row.get("学校所在地"))

    record: dict[str, Any] = {
        "school_id": identity["school_id"],
        "program_type": program_type,
        "province": identity["province"],
        "city": city,
        "study_mode": clean_string(row.get("学习方式")) or clean_string(row.get("项目类型")),
        "duration": parse_duration(row.get("学制")) or parse_duration(row.get("学费")),
        "tuition_min": parse_tuition(row.get("学费")),
        "tuition_max": parse_tuition(row.get("学费")),
        "junior_college_allowed": "",
        "school_code": identity["school_code"],
        "school_name": identity["school_name"],
        "school_label": identity["school_label"],
        "school_level": school_level,
        "school_level_display": school_level_display,
        "department_code": department_code,
        "department_name": department_name,
        "department_label": department_label,
        "department": department_label,
        "major_category_code": major_category_from_source_or_program(row, "code"),
        "major_category_name": major_category_from_source_or_program(row, "name"),
        "major_category_label": major_category_from_source_or_program(row, "label"),
        "major_code": major_from_source_or_program(row, "code"),
        "major_name": major_from_source_or_program(row, "name"),
        "major_label": major_from_source_or_program(row, "label"),
        "direction_code": direction_code,
        "direction": direction,
        "direction_label": direction_label,
        "enrollment": number_or_string(row.get("招生人数")),
        "exam_subjects": exam_subjects_from_source_or_program(row),
        "latest_score": score,
        "score_year": number_or_string(row.get("最新分数线年份")),
        "total_score": total_score,
        "english_score": english_score,
        "comprehensive_score": comprehensive_score,
        "admission": clean_string(row.get("录取情况")),
        "admission_rate": clean_string(row.get("录取率")),
        "class_location": clean_string(row.get("上课地点")),
        "class_time": clean_string(row.get("上课方式")),
        "adjustment": clean_string(row.get("是否接受调剂")),
        "retired_soldier_plan": clean_string(row.get("退役计划")),
        "minority_backbone_plan": clean_string(row.get("少民计划")),
        "notes": clean_string(row.get("备注")),
        "description": clean_string(row.get("学校简介")),
        "website": clean_string(row.get("官网")),
        "logo_url": clean_string(row.get("学校Logo")),
        "interview": clean_string(row.get("是否提前面试")),
        "retest_info_by_year": build_retest_data(row),
        "first_choice_admission_by_year": build_year_score_data(row),
        "adjustment_admission_by_year": build_adjustment_data(row),
        "identity": {
            "status": identity["identity_status"],
            "confidence": identity["identity_confidence"],
            "review_notes": identity["identity_review_notes"],
        },
        "source": {
            "source_file": "schoolData/sourceData/199exam/全量院校表_研招网主表补全.xlsx",
            "source_sheet": "全量院校表",
            "source_row": row_number,
            "source_url": clean_string(row.get("官网")),
            "batch_id": "2026-05-l1-initial",
            "updated_at": str(date.today()),
            "source_merge_status": clean_string(row.get("匹配状态")),
            "source_project_id": clean_string(row.get("项目ID")),
        },
    }
    make_ids(record, row_number)
    record["tags"] = build_tags(record)
    record["quality"] = quality(record)
    return order_record(record)


def build_master(source_path: Path, lookup_path: Path, output_path: Path, report_path: Path, md_path: Path) -> dict[str, Any]:
    rows = read_sheet_rows(source_path, DEFAULT_SHEET)
    headers = header_map(rows)
    lookup = load_lookup(lookup_path)
    records = []
    for row_number, raw in sorted(rows.items()):
        if row_number == 1:
            continue
        row = normalized_row(raw, headers)
        program_type = clean_string(row.get("项目")) or clean_string(row.get("请求专业类型"))
        if program_type not in {"MPA", "MBA", "MEM"}:
            continue
        records.append(normalize_record(row, row_number, lookup))

    program_counts = Counter(record["program_type"] for record in records)
    province_counts = Counter(clean_string(record.get("province")) or "空" for record in records)
    priority_records = [record for record in records if record.get("province") in PRIORITY_PROVINCES]
    report = {
        "generated_at": str(date.today()),
        "record_count": len(records),
        "program_counts": dict(program_counts),
        "province_counts": dict(province_counts),
        "priority_region_record_count": len(priority_records),
        "priority_region_school_count": len({record["school_name"] for record in priority_records}),
        "records_with_school_code": sum(1 for record in records if not is_empty(record.get("school_code"))),
        "records_with_province": sum(1 for record in records if not is_empty(record.get("province"))),
        "records_operational_phase1_pass": sum(1 for record in records if record["quality"]["operational_phase1_pass"]),
        "records_strict_phase1_pass": sum(1 for record in records if record["quality"]["phase1_completeness_pass"]),
        "top_missing_fields": dict(Counter(field for record in records for field in record["quality"]["missing_fields"]).most_common(20)),
        "notes": [
            "junior_college_allowed 按用户确认先全部留空。",
            "school_code 只使用现有可追溯来源，未查到不硬猜。",
            "当前源表只包含 MPA/MBA；MEM 数据待追加。",
        ],
    }

    payload = {
        "metadata": {
            "dataset": "199exam_school_program_master",
            "version": "2026-05-l1-initial",
            "source_files": [
                "schoolData/sourceData/199exam/全量院校表_研招网主表补全.xlsx",
                "schoolData/standardized/199exam/199exam_school_identity_lookup.json",
            ],
            "record_grain": "program_school_department_major_direction_study_mode",
            "updated_at": str(date.today()),
            "record_count": len(records),
            "program_scope": sorted(program_counts),
            "deferred_fields": sorted(DEFERRED_FIELDS),
            "notes": report["notes"],
        },
        "records": records,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_markdown_report(report, md_path)
    return report


def write_markdown_report(report: dict[str, Any], path: Path) -> None:
    lines = [
        "# 管综 L1 正式主数据初版生成报告",
        "",
        f"> 更新时间：{report['generated_at']}  ",
        "> 输出：`schoolData/standardized/199exam/199exam_school_program_master.json`  ",
        "> 口径：`junior_college_allowed` 先留空；学校代码只用现有可追溯来源；优先关注四川、重庆。",
        "",
        "## 1. 生成结果",
        "",
        "| 指标 | 数量 |",
        "| --- | ---: |",
        f"| L1 记录数 | {report['record_count']} |",
        f"| 川渝记录数 | {report['priority_region_record_count']} |",
        f"| 川渝学校数 | {report['priority_region_school_count']} |",
        f"| 有省份记录数 | {report['records_with_province']} |",
        f"| 有学校代码记录数 | {report['records_with_school_code']} |",
        f"| 运营口径一期达标记录数 | {report['records_operational_phase1_pass']} |",
        f"| 严格口径一期达标记录数 | {report['records_strict_phase1_pass']} |",
        "",
        "项目分布：",
        "",
        "```json",
        json.dumps(report["program_counts"], ensure_ascii=False, indent=2),
        "```",
        "",
        "## 2. 缺失字段 Top 20",
        "",
        "```json",
        json.dumps(report["top_missing_fields"], ensure_ascii=False, indent=2),
        "```",
        "",
        "## 3. 注意事项",
        "",
        "1. 当前源表只包含 MPA/MBA，MEM 明天到数据后再追加。",
        "2. `junior_college_allowed` 按确认口径先留空，不作为本轮阻塞。",
        "3. `school_code` 不硬猜，查不到就空着。",
        "4. 四川和重庆在现有对照表中已有较完整学校代码，可优先进入 L2 发布准备。",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build initial 199-exam L1 master JSON.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--lookup", type=Path, default=DEFAULT_LOOKUP)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--md-output", type=Path, default=DEFAULT_MD)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    report = build_master(args.source, args.lookup, args.output, args.report, args.md_output)
    print(
        json.dumps(
            {
                "ok": True,
                "output": str(args.output.relative_to(ROOT)),
                "report": str(args.report.relative_to(ROOT)),
                "md_output": str(args.md_output.relative_to(ROOT)),
                "summary": report,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
