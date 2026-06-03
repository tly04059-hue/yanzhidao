#!/usr/bin/env python3
"""
把两套案例数据合并成统一的 cases-unified.json：
  来源 1：studentCases/standardized/student_cases_l1_anonymized.json（75条，报名表来源）
  来源 2：courseRecommendationStrategy/cases.json（125条，M8案例库来源）

输出：miniapp/src/data/cases-unified.json

运行方式：
  python3 AIAgent/scripts/build_unified_cases.py
"""

from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path

sys.dont_write_bytecode = True

ROOT = Path(__file__).parent.parent.parent

SC_STANDARDIZED = ROOT / "studentCases/standardized/student_cases_l1_anonymized.json"
SC_PUBLISH      = ROOT / "studentCases/publish/student_cases_miniapp_publish.json"
M8_CASES        = ROOT / "courseRecommendationStrategy/cases.json"
OUTPUT          = ROOT / "miniapp/src/data/cases-unified.json"

# M8 内部元数据 tag，不纳入展示
M8_INTERNAL_TAGS = {
    "25党校上岸", "26管综MPA", "党校路径", "统考非全双证",
    "M8-resync", "system_unknown_storied", "心得型", "25 届投稿",
    "一战上岸", "二战", "专业班", "奖金班",
}

# system_tag 规范化（统一两个来源的不同写法）
SYSTEM_TAG_NORM = {
    "国企央企": "国央企",
    "公检法":   "公检法纪检",
}

# outcome 规范化（统一到 4 个值）
OUTCOME_NORM = {
    "已上岸": "上岸",
    "上岸":   "上岸",
    "已录取": "已录取",
    "未录取": "未录取",
    "未上岸": "未上岸",
}

# 路径 → 筛选 tag
PATH_FILTER_TAG = {
    "A": "党校在职研究生",
    "B": None,  # 由 program_type 决定
}

PROGRAM_FILTER_TAG = {
    "MPA": "统考MPA",
    "MBA": "统考MBA",
    "MEM": "统考MEM",
    "党校": "党校在职研究生",
}


# ─── 工具函数 ──────────────────────────────────────────────

def normalize_system_tag(tag: str) -> str:
    return SYSTEM_TAG_NORM.get(tag, tag) or "其他"


def normalize_outcome(raw: str) -> str:
    return OUTCOME_NORM.get(raw, raw)


def normalize_age_band(raw: str) -> str:
    """统一年龄段格式，方便筛选 tag 使用。"""
    raw = raw.strip()
    if not raw or raw == "?":
        return ""
    # M8 格式："25-30 岁段"、"35-40 岁段" → 去掉"岁段"和空格
    raw = re.sub(r"\s*岁段.*$", "", raw)
    # "45+" 或 "45+ " → "40+"
    if re.match(r"4[5-9]\+?|[5-9]\d\+?", raw):
        return "40+"
    return raw


def age_band_filter_tag(age_band: str) -> str:
    """把年龄段映射到筛选 tag（宽段保留，显示时用）。"""
    if not age_band:
        return ""
    # 宽段（如 "25-35"、"30-40"）：保留原值，前端可选择合并展示
    return age_band


def build_filter_tags(case: dict) -> list[str]:
    """
    从 unified case 的关键字段重建统一筛选 tag 列表。
    确保 200 条数据的 tags 口径一致，筛选逻辑不受来源差异影响。
    """
    tags: list[str] = []

    # 系统
    if case["system_tag"]:
        tags.append(case["system_tag"])

    # 年龄段
    ab = age_band_filter_tag(case["age_band"])
    if ab:
        tags.append(ab)

    # 路径 / 项目类型
    pt = PROGRAM_FILTER_TAG.get(case["program_type"], "")
    if pt:
        tags.append(pt)

    # 结果
    if case["outcome"]:
        tags.append(case["outcome"])

    return tags


# ─── SC 转换 ──────────────────────────────────────────────

def sc_score_string(record: dict) -> str:
    system = record.get("system", "")
    if system == "管综系":
        test  = (record.get("baseline") or {}).get("test_total")
        goal  = (record.get("goals")    or {}).get("target_total")
        if test and goal:
            return f"测评 {int(test)} 分 → 目标 {int(goal)} 分"
    elif system == "党校系":
        total = (record.get("result") or {}).get("total_score")
        if total:
            return f"总分 {int(float(total))} 分"
    return ""


def sc_study_time_string(record: dict) -> str:
    system = record.get("system", "")
    if system == "管综系":
        weekly = (record.get("study_time") or {}).get("weekly", "")
        return weekly
    elif system == "党校系":
        dur = (record.get("result") or {}).get("total_study_duration")
        if dur:
            try:
                return f"累计 {int(float(dur))} 小时"
            except (ValueError, TypeError):
                return str(dur)
    return ""


def sc_chosen_school(record: dict) -> str:
    school  = record.get("party_school") or ""
    program = (record.get("target") or {}).get("target_program", "")
    target  = (record.get("target") or {}).get("target_school", "")

    if record.get("system") == "党校系":
        s = school or target
        return f"{s} · {program}" if (s and program) else (s or program)
    else:
        # 管综系
        s = target
        return f"{s} · {program}" if (s and program) else (s or program)


def transform_sc(record: dict, publish_map: dict) -> dict:
    case_id = record["case_id"]
    pub     = publish_map.get(case_id, {})

    system  = record.get("system", "")
    path    = "A" if system == "党校系" else "B"

    target      = record.get("target") or {}
    profile     = record.get("profile") or {}
    persona     = record.get("persona") or {}

    program_type  = record.get("program_type") or target.get("target_program") or ""
    party_school  = record.get("party_school", "")
    system_tag    = normalize_system_tag(persona.get("system_tag", "其他"))
    age_band      = normalize_age_band(profile.get("age_band", ""))
    outcome       = normalize_outcome(record.get("admission_status", ""))
    chosen_school = sc_chosen_school(record)

    case: dict = {
        "id":            case_id,
        "source":        "sc",
        "display_alias": record.get("display_alias", ""),
        "age_band":      age_band,
        "region":        "",
        "system_tag":    system_tag,
        "position_tag":  persona.get("position_tag", ""),
        "goal_tag":      persona.get("goal_tag") or [],
        "path":          path,
        "program_type":  program_type,
        "party_school":  party_school,
        "chosen_school": chosen_school,
        "outcome":       outcome,
        "key_quote":     "",
        "score":         sc_score_string(record),
        "study_time":    sc_study_time_string(record),
        "risk":          pub.get("risk", ""),
        "advice":        pub.get("advice", ""),
        "tags":          [],  # 下面统一重建
    }
    case["tags"] = build_filter_tags(case)
    return case


# ─── M8 转换 ──────────────────────────────────────────────

def m8_program_type_and_school(chosen_school: str, chosen_path: str) -> tuple[str, str]:
    """从 chosen_school 字段推断 program_type 和 party_school。"""
    if chosen_path == "A":
        if "四川党校" in chosen_school or "省委党校" in chosen_school:
            party_school = "四川党校"
        elif "重庆党校" in chosen_school:
            party_school = "重庆党校"
        else:
            party_school = "四川党校"
        return "党校", party_school
    else:
        for pt in ("MPA", "MBA", "MEM"):
            if pt in chosen_school:
                return pt, ""
        return "MPA", ""


def transform_m8(case: dict) -> dict:
    chosen_path   = case.get("chosen_path", "A")
    chosen_school = case.get("chosen_school", "")
    program_type, party_school = m8_program_type_and_school(chosen_school, chosen_path)

    system_tag = normalize_system_tag(case.get("system_chip", "其他"))
    age_band   = normalize_age_band(case.get("age_band", ""))
    outcome    = normalize_outcome(case.get("outcome", ""))

    # tags：去掉内部元数据 tag
    raw_tags    = [t for t in (case.get("tags") or []) if t not in M8_INTERNAL_TAGS]

    unified: dict = {
        "id":            case["case_id"],
        "source":        "m8",
        "display_alias": case.get("display_name", ""),
        "age_band":      age_band,
        "region":        case.get("region", ""),
        "system_tag":    system_tag,
        "position_tag":  "",
        "goal_tag":      case.get("reason_tags") or [],
        "path":          chosen_path,
        "program_type":  program_type,
        "party_school":  party_school,
        "chosen_school": chosen_school,
        "outcome":       outcome,
        "key_quote":     case.get("key_quote", ""),
        "score":         "",
        "study_time":    "",
        "risk":          "",
        "advice":        "",
        "tags":          [],
    }
    unified["tags"] = build_filter_tags(unified)
    # 追加 M8 原有的有效 display tag（不重复）
    for t in raw_tags:
        if t not in unified["tags"]:
            unified["tags"].append(t)
    return unified


# ─── 排序 ──────────────────────────────────────────────────

OUTCOME_ORDER  = {"上岸": 0, "已录取": 1, "未录取": 2, "未上岸": 3, "": 4}
PROGRAM_ORDER  = {"MPA": 0, "MBA": 1, "MEM": 2, "党校": 3}
SYSTEM_ORDER   = {
    "党政机关": 0, "乡镇街道": 1, "教育系统": 2,
    "医疗系统": 3, "公检法纪检": 4, "国央企": 5,
    "银行金融": 6, "其他": 7,
}

def sort_key(c: dict) -> tuple:
    return (
        OUTCOME_ORDER.get(c["outcome"], 4),
        PROGRAM_ORDER.get(c["program_type"], 9),
        SYSTEM_ORDER.get(c["system_tag"], 8),
        c["display_alias"],
    )


# ─── 主流程 ────────────────────────────────────────────────

def main() -> None:
    sc_records   = json.loads(SC_STANDARDIZED.read_text("utf-8"))["records"]
    sc_pub_cases = json.loads(SC_PUBLISH.read_text("utf-8"))["cases"]
    m8_cases     = json.loads(M8_CASES.read_text("utf-8"))["data"]["cases"]

    publish_map = {c["id"]: c for c in sc_pub_cases}

    unified: list[dict] = []
    for r in sc_records:
        unified.append(transform_sc(r, publish_map))
    for c in m8_cases:
        unified.append(transform_m8(c))

    unified.sort(key=sort_key)

    sc_count  = sum(1 for c in unified if c["source"] == "sc")
    m8_count  = sum(1 for c in unified if c["source"] == "m8")
    up_count  = sum(1 for c in unified if c["outcome"] in ("上岸", "已录取"))
    no_count  = sum(1 for c in unified if c["outcome"] in ("未录取", "未上岸"))

    output = {
        "_meta": {
            "version":      "v1.0",
            "generated_at": str(date.today()),
            "total":        len(unified),
            "sc_count":     sc_count,
            "m8_count":     m8_count,
            "up_count":     up_count,
            "no_count":     no_count,
            "sources": [
                str(SC_STANDARDIZED.relative_to(ROOT)),
                str(M8_CASES.relative_to(ROOT)),
            ],
            "update_note": (
                "更新数据时：报名表新数据 → 跑 build_student_cases_from_sources.py → "
                "再跑本脚本；M8 案例库新数据 → 更新 courseRecommendationStrategy/cases.json → "
                "再跑本脚本"
            ),
        },
        "cases": unified,
    }

    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"✓ 已写入 {OUTPUT.relative_to(ROOT)}")
    print(f"  总计 {len(unified)} 条：SC {sc_count} + M8 {m8_count}")
    print(f"  上岸/录取 {up_count} 条，未录取/未上岸 {no_count} 条")


if __name__ == "__main__":
    main()
