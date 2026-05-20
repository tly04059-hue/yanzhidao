#!/usr/bin/env python3
"""Build anonymized student case data from source Excel files."""

from __future__ import annotations

import hashlib
import json
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True

from inspect_student_case_sources import ROOT, SOURCE_FILES, inspect_file

STANDARDIZED_OUTPUT = ROOT / "studentCases/standardized/student_cases_l1_anonymized.json"
PUBLISH_OUTPUT = ROOT / "studentCases/publish/student_cases_miniapp_publish.json"
MINIAPP_OUTPUT = ROOT / "miniapp/src/data/student-cases-publish.json"
REPORT_OUTPUT = ROOT / "studentCases/student_case_build_report.json"
DOC_OUTPUT = ROOT / "project_docs/17-学生案例库L1L2生成与小程序接入口径.md"

PRIVATE_FIELDS = {"姓名", "电话", "联系方式", "身份证号", "邮寄地址"}
PROGRAM_ORDER = {"MPA": 1, "MEM": 2, "MBA": 3, "党校": 4}
SYSTEM_ORDER = {"管综系": 1, "党校系": 2}
DX_SCHOOL_ORDER = {"四川党校": 1, "重庆党校": 2}


def clean(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def to_number(value: Any) -> float | None:
    text = clean(value)
    if not text:
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", text)
    if not match:
        return None
    try:
        return float(match.group(0))
    except ValueError:
        return None


def int_or_none(value: Any) -> int | None:
    number = to_number(value)
    if number is None:
        return None
    return int(number)


def age_band(age: Any) -> str:
    number = int_or_none(age)
    if number is None:
        return "年龄待确认"
    if number < 25:
        return "25岁以下"
    if number <= 30:
        return "25-30"
    if number <= 35:
        return "30-35"
    return "35+"


def anonymized_id(prefix: str, source_file: str, row_number: int) -> str:
    digest = hashlib.sha1(f"{source_file}:{row_number}".encode("utf-8")).hexdigest()[:10]
    return f"{prefix}-{digest}"


def display_alias(row: dict[str, str]) -> str:
    name = clean(row.get("姓名", ""))
    gender = clean(row.get("性别", ""))
    surname = name[:1] if name else "某"
    suffix = "女士" if gender == "女" else "先生" if gender == "男" else "同学"
    return f"{surname}{suffix}"


def normalize_program(value: str) -> str:
    text = clean(value).upper()
    if "MPA" in text or "公共管理" in text:
        return "MPA"
    if "MEM" in text or "工程管理" in text:
        return "MEM"
    if "MBA" in text or "工商管理" in text:
        return "MBA"
    return clean(value) or "待确认"


def normalize_dx_school(row: dict[str, str]) -> str:
    combined = " ".join(clean(row.get(key, "")) for key in ("工作单位名称", "邮寄地址"))
    if "重庆" in combined:
        return "重庆党校"
    return "四川党校"


def parse_excel_date(value: str) -> str:
    text = clean(value)
    if not text:
        return ""
    if re.match(r"^\d{4}[/-]\d{1,2}[/-]\d{1,2}$", text):
        parts = re.split(r"[/-]", text)
        return f"{int(parts[0]):04d}-{int(parts[1]):02d}-{int(parts[2]):02d}"
    number = to_number(text)
    if number and 30000 < number < 60000:
        # Excel serial date, using 1899-12-30 convention.
        return (datetime(1899, 12, 30) + timedelta(days=int(number))).strftime("%Y-%m-%d")
    return text


def education_level(value: str) -> str:
    text = clean(value)
    if "研究生" in text or "硕士" in text:
        return "研究生"
    if "本科" in text:
        return "本科"
    if "专科" in text or "大专" in text:
        return "大专"
    return text or "学历待确认"


def study_time_tag(value: str) -> str:
    number = to_number(value)
    if number is None:
        return "学习时间待确认"
    if number <= 1.5:
        return "时间少"
    if number <= 3:
        return "时间适中"
    return "时间充足"


def math_tag(value: str) -> str:
    text = clean(value)
    if any(key in text for key in ("未及格", "初中", "90分以下")):
        return "数学基础弱"
    if any(key in text for key in ("中下", "90~110", "90-110")):
        return "数学中下"
    if text:
        return "数学基础可用"
    return "数学待确认"


def english_tag(value: str) -> str:
    text = clean(value)
    if any(key in text for key in ("四级", "学位英语", "通过")):
        return "英语有基础"
    if any(key in text for key in ("未及格", "90分以下")):
        return "英语基础弱"
    if text:
        return "英语待提升"
    return "英语待确认"


def motivation_tags(value: str) -> list[str]:
    text = clean(value)
    tags = []
    mapping = {
        "遴选": "遴选",
        "晋升": "晋升",
        "提拔": "晋升",
        "转岗": "转岗",
        "体制": "体制内",
        "公务员": "体制内",
        "国企": "国企",
        "学历": "学历提升",
        "弥补遗憾": "自我提升",
    }
    for keyword, tag in mapping.items():
        if keyword in text and tag not in tags:
            tags.append(tag)
    return tags


def classify_work_unit(value: str) -> str:
    text = clean(value)
    if not text:
        return "单位类型待确认"
    if any(key in text for key in ("人民政府", "局", "委员会", "法院", "检察", "公安", "税务", "财政", "镇", "乡")):
        return "体制内/机关事业单位"
    if "国企" in text or "集团" in text:
        return "国企/企业"
    if "学校" in text or "医院" in text:
        return "事业单位"
    return "单位类型待确认"


def risk_and_advice(tags: list[str], system: str, program_type: str) -> tuple[str, str]:
    if "数学基础弱" in tags and system == "管综系":
        return (
            "数学基础是主要风险，择校不宜只看院校名气。",
            "优先选择分数线稳定、招生人数相对充足、学费和上课方式匹配的院校，再安排数学基础补齐。",
        )
    if "时间少" in tags:
        return (
            "可投入时间偏少，容易出现计划中断。",
            "先用每周最小学习计划稳住英语词汇和基础题，再做院校范围收缩。",
        )
    if system == "党校系":
        return (
            "重点看是否符合体制内使用场景，以及专业方向是否匹配岗位。",
            "优先参考同年龄、同学历、同岗位系统的党校案例，再比较四川党校和重庆党校的报考要求。",
        )
    if program_type == "MBA":
        return (
            "MBA 更容易受学费、城市和上课方式约束。",
            "先锁定预算和上课地点，再比较复试压力与院校认可度。",
        )
    return (
        "需要同时平衡目标院校、基础水平和备考时间。",
        "先按专业方向和城市筛选，再结合分数线、学费、招生人数做保底和冲刺组合。",
    )


def build_case_title(system: str, program_type: str, band: str, target: str) -> str:
    if system == "党校系":
        return f"{band} 党校案例 · {target or '岗位匹配'}"
    return f"{program_type} 案例 · {band} · {target or '目标院校待确认'}"


def read_source_records() -> list[tuple[str, str, int, dict[str, str]]]:
    records = []
    for source_path in SOURCE_FILES:
        inspected = inspect_file(source_path)
        sheet = inspected["sheets"][0]
        headers = sheet["headers"]
        rows = inspect_file_with_rows(source_path)
        for index, row in enumerate(rows, start=2):
            record = {header: row.get(header, "") for header in headers}
            records.append((str(source_path.relative_to(ROOT)), sheet["sheet_name"], index, record))
    return records


def inspect_file_with_rows(path: Path) -> list[dict[str, str]]:
    inspected = inspect_file(path)
    # Re-read by temporarily using the richer internals exposed through inspect_file output shape is not possible,
    # so keep a compact XML reader here by importing helpers from the inspection module.
    from inspect_student_case_sources import normalize_rows, read_shared_strings, read_sheet_map, read_sheet_rows
    import zipfile

    with zipfile.ZipFile(path) as zf:
        shared_strings = read_shared_strings(zf)
        sheet_map = read_sheet_map(zf)
        first_sheet_path = next(iter(sheet_map.values()))
        raw_rows = read_sheet_rows(zf, first_sheet_path, shared_strings)
    _, records = normalize_rows(raw_rows)
    return records


def build_management_case(source_file: str, row_number: int, row: dict[str, str]) -> tuple[dict[str, Any], dict[str, Any]]:
    program_type = normalize_program(row.get("意向专业", ""))
    band = age_band(row.get("年龄"))
    tags = [
        "管综系",
        program_type,
        band,
        math_tag(row.get("数学基础", "")),
        english_tag(row.get("英语基础", "")),
        study_time_tag(row.get("日均学习时长", "")),
        clean(row.get("备考经验", "")) or "备考经验待确认",
    ]
    tags.extend(motivation_tags(row.get("考研动机", "")))
    tags = list(dict.fromkeys([tag for tag in tags if tag]))
    risk, advice = risk_and_advice(tags, "管综系", program_type)
    case_id = anonymized_id("case-199", source_file, row_number)
    target_school = clean(row.get("意向院校", ""))
    alias = display_alias(row)
    l1 = {
        "case_id": case_id,
        "source_file": source_file,
        "source_row_number": row_number,
        "display_alias": alias,
        "system": "管综系",
        "program_type": program_type,
        "admission_status": "已上岸",
        "profile": {
            "gender": clean(row.get("性别", "")),
            "age": int_or_none(row.get("年龄")),
            "age_band": band,
            "graduated_school": clean(row.get("毕业院校", "")),
            "undergraduate_major": clean(row.get("所学专业", "")),
            "work_function": clean(row.get("工作职能", "")),
            "class_type": clean(row.get("班型", "")),
            "enrollment_date": parse_excel_date(row.get("入班时间", "")),
        },
        "target": {
            "target_program": program_type,
            "target_school": target_school,
            "motivation": clean(row.get("考研动机", "")),
        },
        "baseline": {
            "experience": clean(row.get("备考经验", "")),
            "math_base": clean(row.get("数学基础", "")),
            "english_base": clean(row.get("英语基础", "")),
            "test_total": int_or_none(row.get("测试总分")),
            "test_math": int_or_none(row.get("数学")),
            "test_logic": int_or_none(row.get("逻辑")),
            "test_english": int_or_none(row.get("英语")),
        },
        "goals": {
            "target_total": int_or_none(row.get("目标总分")),
            "target_math": int_or_none(row.get("目标数学")),
            "target_logic": int_or_none(row.get("目标逻辑")),
            "target_writing": int_or_none(row.get("目标写作")),
            "target_english": int_or_none(row.get("目标英语")),
        },
        "study_time": {
            "weekly": clean(row.get("每周学习时长", "")),
            "daily": clean(row.get("日均学习时长", "")),
        },
        "tags": tags,
        "privacy": {
            "anonymized": True,
            "removed_fields": sorted(PRIVATE_FIELDS.intersection(row.keys())),
        },
    }
    l2 = {
        "id": case_id,
        "system": "管综系",
        "program_type": program_type,
        "party_school": "",
        "display_alias": alias,
        "title": f"{alias}｜{build_case_title('管综系', program_type, band, target_school)}",
        "profile": f"{band} · {clean(row.get('工作职能', '岗位待确认'))} · {clean(row.get('备考经验', '备考经验待确认'))}",
        "target": f"{program_type} · {target_school or '目标院校待确认'}",
        "baseline": f"{clean(row.get('数学基础', '数学待确认'))}；{clean(row.get('英语基础', '英语待确认'))}",
        "score": f"测评 {clean(row.get('测试总分', '待确认'))} 分 → 目标 {clean(row.get('目标总分', '待确认'))} 分",
        "study_time": f"{clean(row.get('每周学习时长', '待确认'))}；{clean(row.get('日均学习时长', '待确认'))}",
        "result": "已上岸案例",
        "risk": risk,
        "advice": advice,
        "tags": tags,
        "sort_order": SYSTEM_ORDER["管综系"] * 1000 + PROGRAM_ORDER.get(program_type, 99) * 100 + row_number,
    }
    return l1, l2


def build_dx_case(source_file: str, row_number: int, row: dict[str, str]) -> tuple[dict[str, Any], dict[str, Any] | None]:
    party_school = normalize_dx_school(row)
    program_type = "党校"
    band = age_band(row.get("年龄"))
    admitted = clean(row.get("是否录取", "")) == "是"
    referenced = clean(row.get("是否参考", "")) == "是"
    major = clean(row.get("专业", ""))
    tags = [
        "党校系",
        party_school,
        band,
        education_level(row.get("最高学历", "")),
        major,
        "已录取" if admitted else "未录取",
        "已参考" if referenced else "未参考",
    ]
    tags = list(dict.fromkeys([tag for tag in tags if tag]))
    risk, advice = risk_and_advice(tags, "党校系", program_type)
    case_id = anonymized_id("case-dx", source_file, row_number)
    alias = display_alias(row)
    l1 = {
        "case_id": case_id,
        "source_file": source_file,
        "source_row_number": row_number,
        "display_alias": alias,
        "system": "党校系",
        "program_type": program_type,
        "party_school": party_school,
        "admission_status": "已录取" if admitted else "未录取",
        "exam_status": "已参考" if referenced else "未参考",
        "profile": {
            "gender": clean(row.get("性别", "")),
            "age": int_or_none(row.get("年龄")),
            "age_band": band,
            "education_level": education_level(row.get("最高学历", "")),
            "graduation_time": clean(row.get("毕业时间", "")),
            "graduated_school": clean(row.get("毕业院校", "")),
            "undergraduate_major": clean(row.get("所学专业", "")),
            "work_unit_type": classify_work_unit(row.get("工作单位名称", "")),
            "enrollment_date": parse_excel_date(row.get("入班时间", "")),
        },
        "target": {
            "target_program": major,
            "target_school": party_school,
        },
        "result": {
            "total_score": to_number(row.get("考试成绩总分")),
            "politics_theory": to_number(row.get("政治理论")),
            "politics_major": to_number(row.get("政治学")),
            "minority_bonus": to_number(row.get("少数民族加分")),
            "total_study_duration": clean(row.get("总学习时长", "")),
        },
        "tags": tags,
        "privacy": {
            "anonymized": True,
            "removed_fields": sorted(PRIVATE_FIELDS.intersection(row.keys())),
        },
    }
    l2 = None
    if admitted:
        total_score = clean(row.get("考试成绩总分", ""))
        l2 = {
            "id": case_id,
            "system": "党校系",
            "program_type": program_type,
            "party_school": party_school,
            "display_alias": alias,
            "title": f"{alias}｜{build_case_title('党校系', program_type, band, major)}",
            "profile": f"{band} · {education_level(row.get('最高学历', ''))} · {major or '专业待确认'}",
            "target": f"{party_school} · {major or '专业待确认'}",
            "baseline": f"原专业：{clean(row.get('所学专业', '待确认'))}",
            "score": f"总分 {total_score or '待确认'}；政治理论 {clean(row.get('政治理论', '待确认'))}；专业课 {clean(row.get('政治学', '待确认'))}",
            "study_time": f"总学习时长 {clean(row.get('总学习时长', '待确认'))}",
            "result": "已录取案例",
            "risk": risk,
            "advice": advice,
            "tags": tags,
            "sort_order": SYSTEM_ORDER["党校系"] * 1000 + DX_SCHOOL_ORDER.get(party_school, 99) * 100 + row_number,
        }
    return l1, l2


def build_payload() -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    l1_records = []
    l2_cases = []
    source_counts: dict[str, int] = {}
    for source_file, _sheet_name, row_number, row in read_source_records():
        source_counts[source_file] = source_counts.get(source_file, 0) + 1
        if "管综" in source_file:
            l1, l2 = build_management_case(source_file, row_number, row)
        else:
            l1, l2 = build_dx_case(source_file, row_number, row)
        l1_records.append(l1)
        if l2:
            l2_cases.append(l2)

    l2_cases.sort(key=lambda item: item["sort_order"])
    l1_payload = {
        "metadata": {
            "dataset": "student_cases_l1_anonymized",
            "generated_at": str(date.today()),
            "source_files": list(source_counts.keys()),
            "record_count": len(l1_records),
            "privacy_note": "L1 不复制姓名、电话、联系方式、身份证号、邮寄地址；仅保留匿名 case_id 和画像字段。",
        },
        "records": sorted(
            l1_records,
            key=lambda item: (
                SYSTEM_ORDER.get(item["system"], 99),
                PROGRAM_ORDER.get(item["program_type"], 99),
                item.get("party_school", ""),
                item["case_id"],
            ),
        ),
    }
    publish_payload = {
        "metadata": {
            "dataset": "student_cases_miniapp_publish",
            "generated_at": str(date.today()),
            "source_record_count": len(l1_records),
            "publish_case_count": len(l2_cases),
            "display_scope": "小程序案例库匿名发布层",
            "hierarchy": {
                "top_level": ["管综系", "党校系"],
                "management_exam_order": ["MPA", "MEM", "MBA"],
                "party_school_order": ["四川党校", "重庆党校"],
            },
            "privacy_note": "前台发布层不包含姓名、电话、身份证号、地址。",
        },
        "filters": ["全部", "管综系", "党校系", "MPA", "MEM", "MBA", "四川党校", "重庆党校", "25-30", "30-35", "35+"],
        "cases": l2_cases,
    }
    report = {
        "generated_at": str(date.today()),
        "source_counts": source_counts,
        "l1_record_count": len(l1_records),
        "l2_publish_count": len(l2_cases),
        "l2_by_system": count_by(l2_cases, "system"),
        "l2_by_program": count_by(l2_cases, "program_type"),
        "l2_by_party_school": count_by([case for case in l2_cases if case["system"] == "党校系"], "party_school"),
        "notes": [
            "党校源表没有显式学校字段，当前按工作/地址文本含重庆推断重庆党校，其余归为四川党校。",
            "党校 L2 只发布是否录取=是的案例；未录取记录保留在 L1，用于后续风险分析。",
            "管综源文件名为已上岸案例，当前 18 条均进入 L2；后续如果补充录取结果字段，应同步更新判断逻辑。",
        ],
    }
    return l1_payload, publish_payload, report


def count_by(items: list[dict[str, Any]], key: str) -> dict[str, int]:
    result: dict[str, int] = {}
    for item in items:
        value = clean(item.get(key, "")) or "待确认"
        result[value] = result.get(value, 0) + 1
    return result


def write_doc(report: dict[str, Any]) -> None:
    lines = [
        "# 学生案例库 L1/L2 生成与小程序接入口径",
        "",
        f"> 更新时间：{report['generated_at']}  ",
        "> 来源：`studentCases/sourceData/党校已上岸学员案例信息汇总表.xlsx`、`studentCases/sourceData/管综已上岸学员案例信息汇总表.xlsx`",
        "",
        "## 1. 本次生成",
        "",
        f"- L1 匿名标准化记录：{report['l1_record_count']} 条",
        f"- L2 小程序发布案例：{report['l2_publish_count']} 条",
        f"- 按系统：{json.dumps(report['l2_by_system'], ensure_ascii=False)}",
        f"- 按管综专业：{json.dumps(report['l2_by_program'], ensure_ascii=False)}",
        f"- 按党校：{json.dumps(report['l2_by_party_school'], ensure_ascii=False)}",
        "",
        "## 2. 展示层级",
        "",
        "1. 一级：`管综系`、`党校系`。",
        "2. 管综系排序：`MPA -> MEM -> MBA`。",
        "3. 党校系排序：`四川党校 -> 重庆党校`。",
        "4. 前台案例只展示匿名画像、目标、基础、成绩/学习时长、风险提示和建议。",
        "5. 案例标题可使用“姓氏+女士/先生”的 `display_alias` 增强真实感，但不得展示全名。",
        "",
        "## 3. 隐私规则",
        "",
        "前台和 L1 标准化文件均不复制姓名、电话、联系方式、身份证号、邮寄地址。源表作为 L0 保留在 `studentCases/sourceData`。`display_alias` 只保留姓氏称呼，例如“张女士”“陈先生”。",
        "",
        "## 4. 注意事项",
        "",
    ]
    lines.extend(f"- {note}" for note in report["notes"])
    DOC_OUTPUT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    l1_payload, publish_payload, report = build_payload()
    STANDARDIZED_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLISH_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    STANDARDIZED_OUTPUT.write_text(json.dumps(l1_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    PUBLISH_OUTPUT.write_text(json.dumps(publish_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    MINIAPP_OUTPUT.write_text(json.dumps(publish_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT_OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_doc(report)
    print(json.dumps({"ok": True, "report": report}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
