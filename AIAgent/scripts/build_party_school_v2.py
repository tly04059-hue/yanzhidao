#!/usr/bin/env python3
"""Build party-school L1/L2 data from Sichuan/Chongqing V2 workbooks."""

from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True
sys.path.append(str(Path(__file__).resolve().parent))

from inspect_party_v2_xlsx import inspect_file, read_shared_strings, read_sheet, workbook_sheets  # noqa: E402

import zipfile  # noqa: E402


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "schoolData/sourceData/party"
SOURCES = {
    "sc": SOURCE_DIR / "四川党校在职研究生信息库V2.xlsx",
    "cq": SOURCE_DIR / "重庆党校在职研究生信息库V2.xlsx",
}
L1_OUTPUT = ROOT / "schoolData/standardized/party/party_school_l1_v2.json"
PUBLISH_OUTPUT = ROOT / "schoolData/publish/party_school_miniapp_publish.json"
MINIAPP_OUTPUT = ROOT / "miniapp/src/data/party-school-miniapp-publish.json"
DX_OUTPUT = ROOT / "schoolData/dx_data.json"
REPORT_OUTPUT = ROOT / "schoolData/standardized/party/party_school_v2_build_report.json"

SCHOOL_META = {
    "sc": {
        "region": "sc",
        "province": "四川",
        "city": "成都",
        "school_code": "89651",
        "school_short_name": "四川党校",
        "school_name": "中共四川省委党校(四川行政学院)",
        "school_label": "(89651)中共四川省委党校(四川行政学院)",
        "party_member_required": "是",
        "work_years_required": 3,
        "eligible_regions": ["四川"],
        "total_plan": "600人",
        "tuition_total": 21600,
        "tuition_text": "7200元/年,3年合计21600元(按学年缴纳)",
        "class_time": "每年集中4次,每次5天,安排在1、2、7、8月",
        "class_location": "成都市青羊区光华村街43号、56号",
        "class_mode": "非全日制;集中培养+分散培养相结合;集中期间住校封闭管理",
        "admission_rate_latest": "9.8%(含弃考,2025)",
        "actual_exam_rate_latest": "15%(不含弃考,2025口径)",
        "display_note": "前台展示 2026 招生计划和 2025 最新分数/报录口径；完整 FAQ、特殊政策、历年数据保留在信息库。",
    },
    "cq": {
        "region": "cq",
        "province": "重庆",
        "city": "重庆",
        "school_code": "89650",
        "school_short_name": "重庆党校",
        "school_name": "中共重庆市委党校(重庆行政学院)",
        "school_label": "(89650)中共重庆市委党校(重庆行政学院)",
        "party_member_required": "否",
        "work_years_required": 2,
        "eligible_regions": ["重庆", "四川"],
        "total_plan": "900人",
        "tuition_total": 24000,
        "tuition_text": "8000元/年,3年合计24000元(按学年缴纳)",
        "class_time": "每月集中1次,每次3天左右(含周末),寒暑假不上课",
        "class_location": "重庆市九龙坡区渝州路132号",
        "class_mode": "在职学习,非全日制;不脱产学习",
        "admission_rate_latest": "13.5%(含弃考,2025)",
        "actual_exam_rate_latest": "22.5%(不含弃考,2025口径)",
        "display_note": "前台展示 2026 招生计划和 2025 最新分数/报录口径；完整 FAQ、川渝党校对比、历年数据保留在信息库。",
    },
}


def compact(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").replace("\n", " ")).strip()


def first_number(value: str) -> int | None:
    match = re.search(r"(\d+(?:\.\d+)?)", str(value or ""))
    return int(float(match.group(1))) if match else None


def read_workbook(path: Path) -> dict[str, list[list[str]]]:
    with zipfile.ZipFile(path) as zf:
        shared_strings = read_shared_strings(zf)
        return {name: read_sheet(zf, sheet_path, shared_strings) for name, sheet_path in workbook_sheets(zf)}


def key_value_rows(rows: list[list[str]]) -> list[dict[str, str]]:
    result = []
    for row in rows:
        if len(row) >= 2 and row[0] and row[1]:
            result.append({"field": compact(row[0]), "value": compact(row[1])})
    return result


def table_after_header(rows: list[list[str]], first_header: str) -> list[dict[str, str]]:
    for idx, row in enumerate(rows):
        if row and compact(row[0]) == first_header:
            headers = [compact(item) for item in row]
            records = []
            for data_row in rows[idx + 1 :]:
                if not any(data_row):
                    if records:
                        break
                    continue
                if compact(data_row[0]) in {"分专业历年录取分数线", "专业"} and records:
                    break
                record = {
                    headers[col_idx]: compact(data_row[col_idx]) if col_idx < len(data_row) else ""
                    for col_idx in range(len(headers))
                    if headers[col_idx]
                }
                records.append(record)
            return records
    return []


def special_table(rows: list[list[str]], headers_first_cell: str) -> list[dict[str, str]]:
    return table_after_header(rows, headers_first_cell)


def split_lines(value: str) -> list[str]:
    return [compact(item) for item in re.split(r"\n|;|；", str(value or "")) if compact(item)]


def normalize_plan(plan: str) -> tuple[int | None, int | None]:
    total = first_number(plan)
    minority_match = re.search(r"民族专项\s*(\d+)", plan)
    minority = int(minority_match.group(1)) if minority_match else None
    return total, minority


def score_lookup(rows: list[list[str]]) -> dict[str, dict[str, str]]:
    records = special_table(rows, "专业")
    return {record.get("专业", ""): record for record in records if record.get("专业")}


def latest_score(record: dict[str, str]) -> str:
    return record.get("2025(满分300)") or record.get("2025") or record.get("2025民族专项") or "待定"


def build_region(region: str, workbook: dict[str, list[list[str]]], source_file: Path) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    meta = SCHOOL_META[region]
    core_rows = workbook.get("核心信息速查", [])
    major_rows = table_after_header(workbook.get("专业详情", []), "专业")
    yearly_rows = table_after_header(workbook.get("历年数据分析", []), "年份")
    score_rows = score_lookup(workbook.get("历年数据分析", []))
    faq_rows = table_after_header(workbook.get("常见问题FAQ", []), "分类")
    special_rows = (
        table_after_header(workbook.get("特殊政策", []), "政策类别")
        or table_after_header(workbook.get("重庆vs四川对比", []), "对比维度")
    )
    core_kv = key_value_rows(core_rows)

    records: list[dict[str, Any]] = []
    frontend_programs = []
    programs = []
    for row in major_rows:
        major = row.get("专业", "")
        plan_text = row.get("招生计划", "")
        plan, minority_plan = normalize_plan(plan_text)
        score_record = score_rows.get(major, {})
        direction = row.get("专业方向(2025级分班情况)", "") or row.get("考试科目", "")
        exam_subjects = row.get("考试科目", "政治理论+专业科目")
        if region == "sc":
            exam_subjects = f"政治理论+{major}专业科目"

        record_id = f"dx-{region}-{major}".lower()
        program = {
            "record_id": record_id,
            "system": "党校系",
            "program_type": "党校",
            "school_code": meta["school_code"],
            "school_name": meta["school_name"],
            "school_label": meta["school_label"],
            "school_short_name": meta["school_short_name"],
            "province": meta["province"],
            "city": meta["city"],
            "major_name": major,
            "major_label": major,
            "training_direction": direction,
            "enrollment_total": plan,
            "enrollment_display": plan_text,
            "minority_plan": minority_plan,
            "degree_type": "党校在职研究生毕业证(单证,无学位证)",
            "exam_type": "党校自主命题,不参加全国管理类联考",
            "national_exam_required": False,
            "party_member_required": meta["party_member_required"],
            "work_years_required": meta["work_years_required"],
            "junior_college_allowed": "否",
            "eligible_regions": meta["eligible_regions"],
            "tuition_total": meta["tuition_total"],
            "tuition_text": meta["tuition_text"],
            "duration_years": 3,
            "study_mode": "非全日制",
            "class_time": meta["class_time"],
            "class_location": meta["class_location"],
            "class_mode": meta["class_mode"],
            "exam_subjects": exam_subjects,
            "core_courses": split_lines(row.get("核心课程", "").replace("、", "\n")),
            "suitable_positions": split_lines(row.get("适合岗位", "").replace("、", "\n")),
            "reference_books": split_lines(row.get("参考书目", "") or row.get("参考书目(2026)", "")),
            "latest_score": latest_score(score_record),
            "score_year": 2025,
            "score_history": score_record,
            "admission_rate_latest": meta["admission_rate_latest"],
            "actual_exam_rate_latest": meta["actual_exam_rate_latest"],
            "source_file": str(source_file.relative_to(ROOT)),
            "source_sheet": "专业详情",
            "publish_status": "ready",
        }
        records.append(program)
        programs.append(
            {
                "major": major,
                "direction": direction,
                "plan": plan_text,
                "minority_plan": f"{minority_plan}人" if minority_plan else "无",
                "exam_subjects": exam_subjects,
                "core_courses": "、".join(program["core_courses"][:8]),
                "suitable_positions": "、".join(program["suitable_positions"][:10]),
                "reference_books": "\n".join(program["reference_books"][:3]),
            }
        )
        frontend_programs.append(
            {
                "major": major,
                "training_direction": direction,
                "program_plan": plan_text,
                "online_count": "暂无公开分专业上线人数",
                "applicants_latest": "暂无公开分专业报考人数",
                "admitted_latest": f"{plan}人" if plan else plan_text,
                "admission_rate": meta["admission_rate_latest"],
                "actual_exam_admission_rate": meta["actual_exam_rate_latest"],
                "latest_score": latest_score(score_record),
            }
        )

    blocks = [
        {
            "id": "overview",
            "title": "院校概况",
            "type": "key_value",
            "items": [{"label": item["field"], "value": item["value"]} for item in core_kv[:11]],
        },
        {
            "id": "policy",
            "title": "招生与报考政策",
            "type": "key_value",
            "items": [{"label": item["field"], "value": item["value"]} for item in core_kv[11:24]],
        },
        {
            "id": "study",
            "title": "培养与上课安排",
            "type": "key_value",
            "items": [{"label": item["field"], "value": item["value"]} for item in core_kv[24:]],
        },
        {
            "id": "history",
            "title": "历年报录与分数线",
            "type": "table",
            "headers": list(yearly_rows[0].keys()) if yearly_rows else [],
            "rows": [{"cells": list(item.values())} for item in yearly_rows],
        },
        {
            "id": "score_lines",
            "title": "分专业历年录取分数线",
            "type": "table",
            "headers": list(next(iter(score_rows.values())).keys()) if score_rows else [],
            "rows": [{"cells": list(item.values())} for item in score_rows.values()],
        },
        {
            "id": "faq",
            "title": "常见问题 FAQ",
            "type": "table",
            "headers": list(faq_rows[0].keys()) if faq_rows else [],
            "rows": [{"cells": list(item.values())} for item in faq_rows],
        },
    ]
    if special_rows:
        blocks.append(
            {
                "id": "special_policy" if region == "sc" else "sc_cq_compare",
                "title": "特殊政策" if region == "sc" else "重庆 vs 四川党校对比",
                "type": "table",
                "headers": list(special_rows[0].keys()),
                "rows": [{"cells": list(item.values())} for item in special_rows],
            }
        )

    region_payload = {
        "region": region,
        "province": meta["province"],
        "category": "DX",
        "category_name": "党校在职研究生",
        "data_source": source_file.name,
        "school": {
            "school_code": meta["school_code"],
            "school_name": meta["school_name"],
            "school_label": meta["school_label"],
            "location": meta["class_location"],
            "website": next((item["value"] for item in core_kv if item["field"] == "官方网站"), ""),
            "application_url": next((item["value"] for item in core_kv if item["field"] == "报名网址"), ""),
            "phone": next((item["value"] for item in core_kv if item["field"] == "联系方式"), ""),
            "recognition": next((item["value"] for item in core_kv if item["field"] == "证书认可度"), ""),
            "core_difference": "",
        },
        "overview": core_kv,
        "programs": programs,
        "annual_data": yearly_rows,
        "score_lines": list(score_rows.values()),
        "faq": faq_rows,
        "special_policy_or_comparison": special_rows,
        "frontend": {
            "display_year": "2026 招生计划 / 2025 最新分数与报录口径",
            "school_name": meta["school_name"],
            "province": meta["province"],
            "total_plan": meta["total_plan"],
            "tuition": meta["tuition_text"],
            "class_location": meta["class_location"],
            "class_mode": meta["class_time"],
            "display_note": meta["display_note"],
            "programs": frontend_programs,
            "blocks": blocks,
        },
    }
    return region_payload, records


def publish_record(record: dict[str, Any]) -> dict[str, Any]:
    school_id = record["school_code"]
    return {
        "id": record["record_id"],
        "school_id": school_id,
        "program_id": record["record_id"],
        "school_name": record["school_name"],
        "school_label": record["school_label"],
        "program_type": "党校",
        "degree_type": "单证",
        "exam_type": "免全国联考",
        "province": record["province"],
        "city": record["city"],
        "school_level_display": "党校",
        "department_label": "在职研究生部",
        "major_category_label": "党校在职研究生",
        "major_label": record["major_label"],
        "direction": record["training_direction"],
        "enrollment": record["enrollment_total"],
        "tuition_min": record["tuition_total"],
        "tuition_max": record["tuition_total"],
        "duration": 3,
        "study_mode": "非全日制",
        "class_time": record["class_time"],
        "class_location": record["class_location"],
        "exam_subjects": record["exam_subjects"],
        "latest_score": record["latest_score"],
        "score_year": record["score_year"],
        "adjustment": "不适用",
        "junior_college_allowed": record["junior_college_allowed"],
        "retired_soldier_plan": "不适用",
        "minority_backbone_plan": f"{record['minority_plan']}人" if record.get("minority_plan") else "不适用",
        "notes": f"报考条件：党员要求{record['party_member_required']}；本科；工作满{record['work_years_required']}年。",
        "description": "适合体制内学历硬条件补齐、单位内部认可、低预算在职提升；学信网不可查，需确认本单位认可口径。",
        "admission_analysis": f"{record['admission_rate_latest']}；{record['actual_exam_rate_latest']}",
        "retest_info": "党校自主命题考试，拟录取后按学校要求完成资格审查。",
        "tags": ["党校系", record["school_short_name"], "免联考", "单证", "低学费", "体制内"],
        "filter_tags": ["党校系", record["school_short_name"], record["province"], "免联考", "低预算"],
        "sort_signals": {
            "cost_score": 9,
            "difficulty_score": 5 if record["school_short_name"] == "重庆党校" else 6,
            "work_friendly_score": 8 if record["school_short_name"] == "重庆党校" else 7,
            "recognition_score": 8,
        },
        "publish": {
            "source_record_id": record["record_id"],
            "source_file": record["source_file"],
            "display_scope": "miniapp_l2_core_fields",
        },
    }


def main() -> None:
    regions: dict[str, Any] = {}
    records: list[dict[str, Any]] = []
    source_inspection = []
    for region, source in SOURCES.items():
        workbook = read_workbook(source)
        region_payload, region_records = build_region(region, workbook, source)
        regions[region] = region_payload
        records.extend(region_records)
        source_inspection.append(inspect_file(source))

    l1_payload = {
        "metadata": {
            "dataset": "party_school_l1_v2",
            "generated_at": str(date.today()),
            "source_files": [str(path.relative_to(ROOT)) for path in SOURCES.values()],
            "record_count": len(records),
            "region_count": len(regions),
            "grain": "学校 -> 专业",
            "frontend_rule": "L1 保留完整信息库；L2 和 dx_data.frontend 只展示核心字段。",
        },
        "records": records,
        "regions": regions,
    }
    publish_records = [publish_record(record) for record in records]
    publish_payload = {
        "metadata": {
            "dataset": "party_school_miniapp_publish",
            "generated_at": str(date.today()),
            "source_dataset": "schoolData/standardized/party/party_school_l1_v2.json",
            "record_count": len(publish_records),
            "school_count": len({item["school_id"] for item in publish_records}),
            "program_type": "党校",
            "display_note": "党校 L2 发布层只放前台核心字段；FAQ、特殊政策、历年数据留在 L1/dx_data。",
        },
        "records": publish_records,
    }
    dx_payload = {
        "generated_at": str(date.today()),
        "data_scope": "四川、重庆党校在职研究生 V2 数据；来源于两个 V2 xlsx",
        "schema_version": "party_school_v2_l1_with_frontend",
        "regions": regions,
    }
    report = {
        "generated_at": str(date.today()),
        "source_files": [str(path.relative_to(ROOT)) for path in SOURCES.values()],
        "l1_record_count": len(records),
        "l2_publish_count": len(publish_records),
        "regions": {
            key: {
                "school": value["school"]["school_name"],
                "program_count": len(value["programs"]),
                "faq_count": len(value["faq"]),
                "block_count": len(value["frontend"]["blocks"]),
            }
            for key, value in regions.items()
        },
        "outputs": [
            str(L1_OUTPUT.relative_to(ROOT)),
            str(PUBLISH_OUTPUT.relative_to(ROOT)),
            str(MINIAPP_OUTPUT.relative_to(ROOT)),
            str(DX_OUTPUT.relative_to(ROOT)),
        ],
        "source_inspection": source_inspection,
    }

    L1_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLISH_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    REPORT_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    L1_OUTPUT.write_text(json.dumps(l1_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    PUBLISH_OUTPUT.write_text(json.dumps(publish_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    MINIAPP_OUTPUT.write_text(json.dumps(publish_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    DX_OUTPUT.write_text(json.dumps(dx_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT_OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"ok": True, "report": report}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
