#!/usr/bin/env python3
"""Build miniapp L2 publish data for 199-exam programs."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True

from extract_199exam_sample import clean_string, is_empty


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_L1 = ROOT / "schoolData/standardized/199exam/199exam_school_program_master.json"
DEFAULT_MEM_L1 = ROOT / "schoolData/standardized/199exam/199exam_mem_school_program_master.json"
DEFAULT_OUTPUT = ROOT / "schoolData/publish/199exam_miniapp_school_publish_sc_cq.json"
DEFAULT_FILTERS = ROOT / "schoolData/publish/199exam_miniapp_school_filters_sc_cq.json"
DEFAULT_REPORT = ROOT / "schoolData/publish/199exam_miniapp_school_publish_sc_cq.report.json"
DEFAULT_MD = ROOT / "project_docs/12-川渝管综L2小程序发布数据生成报告.md"
MINIAPP_OUTPUT = ROOT / "miniapp/src/data/199exam-miniapp-school-publish-sc-cq.json"

PROGRAM_ORDER = {"MPA": 1, "MEM": 2, "MBA": 3}
PROVINCE_ORDER = {"四川": 1, "重庆": 2, "云南": 3, "贵州": 4}
PUBLISH_PROVINCES = {"四川", "重庆", "云南", "贵州"}
PUBLISH_PROGRAMS = {"MPA", "MBA"}
MEM_PUBLISH_PROVINCES = {"四川", "重庆", "云南", "贵州"}
TUITION_BAND_ORDER = ["5万以内", "5-10万", "10-15万", "15-25万", "25万以上", "学费待确认"]
SCORE_BAND_ORDER = ["170以下", "170-179", "180-189", "190-199", "200以上", "分数线待确认"]


def tuition_band(value: Any) -> str:
    if not isinstance(value, (int, float)):
        return "学费待确认"
    wan = value / 10000
    if wan <= 5:
        return "5万以内"
    if wan <= 10:
        return "5-10万"
    if wan <= 15:
        return "10-15万"
    if wan <= 25:
        return "15-25万"
    return "25万以上"


def score_band(value: Any) -> str:
    if not isinstance(value, (int, float)):
        return "分数线待确认"
    if value < 170:
        return "170以下"
    if value < 180:
        return "170-179"
    if value < 190:
        return "180-189"
    if value < 200:
        return "190-199"
    return "200以上"


def class_time_tags(value: str) -> list[str]:
    text = clean_string(value)
    tags = []
    if "周末" in text:
        tags.append("周末班")
    if "集中" in text:
        tags.append("集中班")
    if "线上" in text:
        tags.append("线上")
    if "白天" in text or "周一" in text or "周五" in text:
        tags.append("工作日")
    return tags


def compact_text(value: Any, limit: int = 160) -> str:
    text = re.sub(r"\s+", " ", clean_string(value)).strip()
    if len(text) <= limit:
        return text
    return text[:limit].rstrip() + "..."


def normalize_publish_city(province: str, city: str) -> str:
    text = clean_string(city)
    if province == "重庆" and "重庆" in text:
        return "重庆"
    if province == "四川" and "成都" in text:
        return "成都"
    return text


def load_school_city_lookup() -> dict[str, str]:
    lookup_path = ROOT / "schoolData/standardized/199exam/199exam_school_identity_lookup.json"
    if not lookup_path.exists():
        return {}
    payload = json.loads(lookup_path.read_text(encoding="utf-8"))
    result = {}
    for record in payload.get("records", []):
        school_name = clean_string(record.get("school_name"))
        cities = [clean_string(city) for city in record.get("cities", []) if clean_string(city)]
        if school_name and cities:
            result[school_name] = cities[0].split(",")[0].split("，")[0]
    return result


def parse_tuition_yuan(value: Any) -> float | None:
    text = clean_string(value)
    if not text:
        return None
    match = re.search(r"([0-9.]+)\s*(?:W|w|万)", text)
    if match:
        return float(match.group(1)) * 10000
    match = re.search(r"([0-9.]+)\s*元", text)
    if match:
        return float(match.group(1))
    return None


def parse_duration(value: Any) -> float | str | None:
    text = clean_string(value)
    if not text:
        return None
    match = re.search(r"([0-9.]+)\s*年", text)
    if match:
        return float(match.group(1))
    return text


def retest_summary(record: dict[str, Any]) -> str:
    year_data = record.get("retest_info_by_year", {}).get("2025", {})
    return compact_text(year_data.get("notes", ""), 140)


def admission_summary(record: dict[str, Any]) -> str:
    parts = []
    if clean_string(record.get("admission")):
        parts.append(f"录取情况：{clean_string(record.get('admission'))}")
    if clean_string(record.get("admission_rate")):
        parts.append(f"录取率：{clean_string(record.get('admission_rate'))}")
    latest_year = clean_string(record.get("score_year")) or "最新"
    if clean_string(record.get("latest_score")):
        parts.append(f"{latest_year}分数线：{clean_string(record.get('latest_score'))}")
    return "；".join(parts)


def cost_score(value: Any) -> int:
    if not isinstance(value, (int, float)):
        return 5
    if value <= 50000:
        return 10
    if value <= 100000:
        return 8
    if value <= 150000:
        return 6
    if value <= 250000:
        return 4
    return 2


def difficulty_score(total_score: Any) -> int:
    if not isinstance(total_score, (int, float)):
        return 5
    if total_score < 170:
        return 4
    if total_score < 180:
        return 5
    if total_score < 190:
        return 7
    if total_score < 200:
        return 8
    return 9


def recognition_score(record: dict[str, Any]) -> int:
    level = clean_string(record.get("school_level_display"))
    if level == "985":
        return 10
    if level == "211":
        return 8
    return 5


def work_friendly_score(record: dict[str, Any]) -> int:
    score = 5
    text = clean_string(record.get("class_time"))
    if clean_string(record.get("study_mode")) == "非全日制":
        score += 2
    if "周末" in text:
        score += 2
    if "集中" in text:
        score += 1
    return min(score, 10)


def filter_tags(record: dict[str, Any]) -> list[str]:
    province = clean_string(record.get("province"))
    city = normalize_publish_city(province, record.get("city", ""))
    tags = [
        "管综",
        clean_string(record.get("program_type")),
        province,
        city,
        clean_string(record.get("study_mode")),
        clean_string(record.get("school_level_display")),
        tuition_band(record.get("tuition_min")),
        score_band(record.get("total_score")),
    ]
    tags.extend(class_time_tags(clean_string(record.get("class_time"))))
    return [tag for tag in tags if tag]


def publish_record(record: dict[str, Any]) -> dict[str, Any]:
    publish_id = record["record_id"]
    item = {
        "id": publish_id,
        "school_id": record["school_id"],
        "program_id": record["program_id"],
        "school_name": record["school_name"],
        "school_label": record.get("school_label", record["school_name"]),
        "short_name": record["school_name"],
        "program_type": record["program_type"],
        "degree_type": "双证",
        "exam_type": "全国联考",
        "province": record["province"],
        "city": normalize_publish_city(record.get("province", ""), record.get("city", "")),
        "school_level": record.get("school_level", ""),
        "school_level_display": record.get("school_level_display", ""),
        "department_label": record.get("department_label", ""),
        "major_category_label": record.get("major_category_label", ""),
        "major_label": record.get("major_label", ""),
        "direction": record.get("direction", ""),
        "enrollment": record.get("enrollment"),
        "tuition_min": record.get("tuition_min"),
        "tuition_max": record.get("tuition_max"),
        "duration": record.get("duration"),
        "study_mode": record.get("study_mode", ""),
        "class_time": record.get("class_time", ""),
        "class_location": record.get("class_location", ""),
        "exam_subjects": record.get("exam_subjects", ""),
        "latest_score": record.get("latest_score", ""),
        "total_score": record.get("total_score"),
        "english_score": record.get("english_score"),
        "comprehensive_score": record.get("comprehensive_score"),
        "score_year": record.get("score_year", ""),
        "adjustment": record.get("adjustment", ""),
        "junior_college_allowed": "",
        "retired_soldier_plan": record.get("retired_soldier_plan", ""),
        "minority_backbone_plan": record.get("minority_backbone_plan", ""),
        "notes": compact_text(record.get("notes", ""), 160),
        "description": compact_text(record.get("description", ""), 180),
        "admission_analysis": admission_summary(record),
        "retest_info": retest_summary(record),
        "tags": record.get("tags", []),
        "filter_tags": filter_tags(record),
        "sort_signals": {
            "cost_score": cost_score(record.get("tuition_min")),
            "difficulty_score": difficulty_score(record.get("total_score")),
            "work_friendly_score": work_friendly_score(record),
            "recognition_score": recognition_score(record),
        },
        "publish": {
            "phase": "phase1_sc_cq",
            "version": "2026-05-l2-sc-cq-initial",
            "published_at": str(date.today()),
            "source_record_id": record["record_id"],
        },
    }
    return item


def publish_mem_record(record: dict[str, Any], city_lookup: dict[str, str]) -> dict[str, Any]:
    school_code = clean_string(record.get("school_code")) or clean_string(record.get("school_name"))
    school_name = clean_string(record.get("school_name"))
    province = clean_string(record.get("province"))
    tuition = parse_tuition_yuan(record.get("tuition"))
    duration = parse_duration(record.get("duration") or record.get("tuition"))
    city = normalize_publish_city(province, city_lookup.get(school_name, province))
    return {
        "id": record["record_id"],
        "school_id": school_code,
        "program_id": f"199-mem-{school_code}-2026".lower(),
        "school_name": school_name,
        "school_label": record.get("school_label", school_name),
        "short_name": school_name,
        "program_type": "MEM",
        "degree_type": "双证",
        "exam_type": "全国联考",
        "province": province,
        "city": city,
        "school_level": "",
        "school_level_display": "",
        "department_label": record.get("department_label", ""),
        "major_category_label": "(1256)工程管理",
        "major_label": record.get("major_label", ""),
        "direction": record.get("direction", ""),
        "enrollment": record.get("enrollment") or None,
        "tuition_min": tuition,
        "tuition_max": tuition,
        "duration": duration,
        "study_mode": record.get("study_mode", ""),
        "class_time": record.get("class_time", "") or record.get("study_mode", ""),
        "class_location": city,
        "exam_subjects": record.get("exam_subjects", ""),
        "latest_score": "",
        "total_score": None,
        "english_score": None,
        "comprehensive_score": None,
        "score_year": "",
        "adjustment": "",
        "junior_college_allowed": "",
        "retired_soldier_plan": record.get("retired_soldier_plan", ""),
        "minority_backbone_plan": record.get("minority_backbone_plan", ""),
        "notes": compact_text(record.get("notes", ""), 160),
        "description": compact_text("研招网 MEM HTML 抓取数据，部分学费、分数线和上课地点字段待人工补齐。", 180),
        "admission_analysis": "",
        "retest_info": "",
        "tags": ["管综", "MEM", province, city, record.get("study_mode", "")],
        "filter_tags": filter_tags(
            {
                "province": province,
                "city": city,
                "program_type": "MEM",
                "study_mode": record.get("study_mode", ""),
                "school_level_display": "",
                "tuition_min": tuition,
                "total_score": None,
                "class_time": record.get("class_time", "") or record.get("study_mode", ""),
            }
        ),
        "sort_signals": {
            "cost_score": cost_score(tuition),
            "difficulty_score": difficulty_score(None),
            "work_friendly_score": work_friendly_score(
                {"study_mode": record.get("study_mode", ""), "class_time": record.get("class_time", "") or record.get("study_mode", "")}
            ),
            "recognition_score": 5,
        },
        "publish": {
            "phase": "phase1_199exam_with_mem",
            "version": "2026-05-l2-199exam-with-mem",
            "published_at": str(date.today()),
            "source_record_id": record["record_id"],
        },
    }


def is_publish_candidate(record: dict[str, Any]) -> bool:
    if record.get("province") not in PUBLISH_PROVINCES:
        return False
    if record.get("program_type") not in PUBLISH_PROGRAMS:
        return False
    if not record.get("quality", {}).get("operational_phase1_pass"):
        return False
    required = [
        "school_id",
        "program_id",
        "school_name",
        "program_type",
        "province",
        "city",
        "tuition_min",
        "tuition_max",
        "duration",
        "study_mode",
        "class_time",
        "latest_score",
    ]
    return all(not is_empty(record.get(field)) for field in required)


def sort_key(item: dict[str, Any]) -> tuple[Any, ...]:
    return (
        PROGRAM_ORDER.get(item.get("program_type"), 99),
        PROVINCE_ORDER.get(item.get("province"), 99),
        item.get("city", ""),
        item.get("school_name", ""),
        item.get("major_label", ""),
        item.get("direction", ""),
    )


def unique_values(records: list[dict[str, Any]], key: str) -> list[Any]:
    values = sorted({record.get(key) for record in records if not is_empty(record.get(key))})
    return values


def ordered_values(values: set[str], order: list[str]) -> list[str]:
    rank = {value: index for index, value in enumerate(order)}
    return sorted(values, key=lambda value: (rank.get(value, 999), value))


def build_filters(records: list[dict[str, Any]]) -> dict[str, Any]:
    all_tags = sorted({tag for record in records for tag in record.get("filter_tags", []) if tag})
    return {
        "metadata": {
            "dataset": "199exam_miniapp_school_filters_sc_cq",
            "version": "2026-05-l2-sc-cq-initial",
            "generated_at": str(date.today()),
            "source_file": "schoolData/publish/199exam_miniapp_school_publish_sc_cq.json",
        },
        "filters": {
            "program_type": ordered_values({record["program_type"] for record in records}, ["MPA", "MEM", "MBA"]),
            "province": ordered_values({record["province"] for record in records}, ["四川", "重庆", "云南", "贵州"]),
            "city": unique_values(records, "city"),
            "study_mode": unique_values(records, "study_mode"),
            "school_level_display": ordered_values({record["school_level_display"] for record in records if record.get("school_level_display")}, ["985", "211", "双非"]),
            "tuition_band": ordered_values({tuition_band(record.get("tuition_min")) for record in records}, TUITION_BAND_ORDER),
            "score_band": ordered_values({score_band(record.get("total_score")) for record in records}, SCORE_BAND_ORDER),
            "filter_tags": all_tags,
        },
        "sort_order": {
            "program_type": ["MPA", "MEM", "MBA"],
            "province": ["四川", "重庆", "云南", "贵州"],
        },
    }


def build_publish(l1_path: Path, mem_l1_path: Path, output_path: Path, filters_path: Path, report_path: Path, md_path: Path) -> dict[str, Any]:
    l1 = json.loads(l1_path.read_text(encoding="utf-8"))
    source_records = l1["records"]
    selected = [publish_record(record) for record in source_records if is_publish_candidate(record)]

    mem_source_count = 0
    mem_selected = []
    if mem_l1_path.exists():
        mem_l1 = json.loads(mem_l1_path.read_text(encoding="utf-8"))
        mem_records = mem_l1.get("records", [])
        mem_source_count = len(mem_records)
        city_lookup = load_school_city_lookup()
        mem_selected = [
            publish_mem_record(record, city_lookup)
            for record in mem_records
            if record.get("province") in MEM_PUBLISH_PROVINCES
        ]
        selected.extend(mem_selected)

    selected.sort(key=sort_key)

    program_counts = Counter(record["program_type"] for record in selected)
    province_counts = Counter(record["province"] for record in selected)
    school_count = len({record["school_name"] for record in selected})
    missing_required = []
    required = json.loads((ROOT / "schoolData/schemas/miniapp_school_publish.schema.json").read_text(encoding="utf-8"))["required"]
    for record in selected:
        missing = [field for field in required if is_empty(record.get(field))]
        if missing:
            missing_required.append({"id": record["id"], "missing": missing})

    payload = {
        "metadata": {
            "dataset": "199exam_miniapp_school_publish_sc_cq",
            "version": "2026-05-l2-sc-cq-initial",
            "generated_at": str(date.today()),
            "source_file": str(l1_path.relative_to(ROOT)),
            "mem_source_file": str(mem_l1_path.relative_to(ROOT)) if mem_l1_path.exists() else "",
            "scope": {
                "province": ["四川", "重庆", "云南", "贵州"],
                "program_type": ["MPA", "MEM", "MBA"],
                "note": "MPA/MBA 当前发布川渝可发布子集；MEM 当前发布四川、重庆、云南、贵州 HTML 抓取子集。",
            },
            "record_count": len(selected),
            "school_count": school_count,
            "frontend_note": "一期小程序发布层，只包含适合前台展示的核心字段。",
        },
        "records": selected,
    }
    filters = build_filters(selected)
    report = {
        "generated_at": str(date.today()),
        "record_count": len(selected),
        "school_count": school_count,
        "program_counts": dict(program_counts),
        "province_counts": dict(province_counts),
        "missing_required_count": len(missing_required),
        "missing_required": missing_required[:50],
        "source_l1_record_count": len(source_records),
        "mem_source_l1_record_count": mem_source_count,
        "mem_publish_count": len(mem_selected),
        "excluded_count": len(source_records) - (len(selected) - len(mem_selected)),
        "notes": [
            "MPA/MBA 仍按完整度门槛发布四川/重庆可发布子集。",
            "MEM 已从研招网 HTML 标准化记录并入同一 L2 发布结构，范围为四川/重庆/云南/贵州。",
            "junior_college_allowed 先按用户确认留空，不作为发布阻塞字段。",
            "复试和录取深度信息仅输出摘要，完整信息仍保留在 L1。",
            "MEM 源 HTML 不含复试线、录取率等字段，发布层保留为空，前台显示待定。",
        ],
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    filters_path.write_text(json.dumps(filters, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    MINIAPP_OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_markdown(report, md_path)
    return report


def write_markdown(report: dict[str, Any], path: Path) -> None:
    lines = [
        "# 管综 L2 小程序发布数据生成报告",
        "",
        f"> 更新时间：{report['generated_at']}  ",
        "> 输出：`schoolData/publish/199exam_miniapp_school_publish_sc_cq.json`  ",
        "> 范围：MPA/MBA 川渝可发布子集；MEM 四川/重庆/云南/贵州 HTML 子集。",
        "",
        "## 1. 生成结果",
        "",
        "| 指标 | 数量 |",
        "| --- | ---: |",
        f"| 发布记录数 | {report['record_count']} |",
        f"| 学校数 | {report['school_count']} |",
        f"| MEM 发布记录数 | {report['mem_publish_count']} |",
        f"| 必需字段缺失记录数 | {report['missing_required_count']} |",
        f"| 从 L1 排除记录数 | {report['excluded_count']} |",
        "",
        "项目分布：",
        "",
        "```json",
        json.dumps(report["program_counts"], ensure_ascii=False, indent=2),
        "```",
        "",
        "省份分布：",
        "",
        "```json",
        json.dumps(report["province_counts"], ensure_ascii=False, indent=2),
        "```",
        "",
        "## 2. 发布口径",
        "",
        "1. 管综展示顺序固定为 `MPA -> MEM -> MBA`。",
        "2. MPA/MBA 当前沿用四川、重庆可发布子集；MEM 当前并入四川、重庆、云南、贵州。",
        "3. `junior_college_allowed` 先留空，不作为阻塞字段。",
        "4. 前台只展示核心字段；深度复试和录取分析仍保留在 L1。",
        "5. MEM 源 HTML 没有复试线和录取率时，发布层留空，页面显示待定。",
        "6. 发布记录保留 `source_record_id`，方便回溯 L1。",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Sichuan/Chongqing 199-exam L2 publish JSON.")
    parser.add_argument("--l1", type=Path, default=DEFAULT_L1)
    parser.add_argument("--mem-l1", type=Path, default=DEFAULT_MEM_L1)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--filters", type=Path, default=DEFAULT_FILTERS)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--md-output", type=Path, default=DEFAULT_MD)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    report = build_publish(args.l1, args.mem_l1, args.output, args.filters, args.report, args.md_output)
    print(
        json.dumps(
            {
                "ok": True,
                "output": str(args.output.relative_to(ROOT)),
                "filters": str(args.filters.relative_to(ROOT)),
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
