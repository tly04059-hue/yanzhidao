#!/usr/bin/env python3
"""Validate publish data, privacy constraints, and minimum release readiness."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "projectOps/config/data-pipeline.json"
REPORT = ROOT / "projectOps/reports/latest-check-report.json"
PII_PATTERN = re.compile(r"1[3-9]\d{9}|\d{17}[0-9Xx]")

JSON_FILES = [
    "schoolData/publish/199exam_miniapp_school_publish_sc_cq.json",
    "miniapp/src/data/199exam-miniapp-school-publish-sc-cq.json",
    "schoolData/publish/party_school_miniapp_publish.json",
    "miniapp/src/data/party-school-miniapp-publish.json",
    "studentCases/publish/student_cases_miniapp_publish.json",
    "miniapp/src/data/student-cases-publish.json",
    "studentCases/standardized/student_cases_l1_anonymized.json",
    "courseRecommendationStrategy/publish/recommendation_strategies_miniapp_publish.json",
    "miniapp/src/data/recommendation-strategies-publish.json",
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def add_error(errors: list[str], condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def main() -> None:
    config = load_json(CONFIG)
    minimum = config["minimum_checks"]
    errors: list[str] = []
    warnings: list[str] = []
    json_checks = []

    for relative in JSON_FILES:
        path = ROOT / relative
        try:
            payload = load_json(path)
            json_checks.append({"path": relative, "ok": True, "top_level_type": type(payload).__name__})
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{relative} JSON 解析失败：{exc}")
            json_checks.append({"path": relative, "ok": False, "error": str(exc)})

    school_payload = load_json(ROOT / "miniapp/src/data/199exam-miniapp-school-publish-sc-cq.json")
    school_records = school_payload.get("records", [])
    party_school_payload = load_json(ROOT / "miniapp/src/data/party-school-miniapp-publish.json")
    party_school_records = party_school_payload.get("records", [])
    combined_school_records = school_records + party_school_records
    program_counts = Counter(record.get("program_type", "") for record in combined_school_records)
    province_counts = Counter(record.get("province", "") for record in combined_school_records)
    add_error(errors, len(school_records) >= minimum["school_publish_records_min"], "院校发布记录数低于最低要求")
    for program_type in minimum["school_program_types_required"]:
        add_error(errors, program_counts.get(program_type, 0) > 0, f"院校发布数据缺少 {program_type}")
    for province in minimum["school_provinces_required"]:
        add_error(errors, province_counts.get(province, 0) > 0, f"院校发布数据缺少省份：{province}")

    case_payload = load_json(ROOT / "miniapp/src/data/student-cases-publish.json")
    cases = case_payload.get("cases", [])
    case_system_counts = Counter(case.get("system", "") for case in cases)
    add_error(errors, len(cases) >= minimum["student_publish_cases_min"], "学生案例发布数低于最低要求")
    for system in minimum["student_case_systems_required"]:
        add_error(errors, case_system_counts.get(system, 0) > 0, f"学生案例缺少系统：{system}")

    strategy_payload = load_json(ROOT / "miniapp/src/data/recommendation-strategies-publish.json")
    strategies = strategy_payload.get("strategies", [])
    strategy_program_counts = Counter(strategy.get("program_type", "") for strategy in strategies)
    add_error(errors, len(strategies) >= minimum["recommendation_strategy_min"], "推荐策略数量低于最低要求")
    for program_type in minimum["recommendation_program_types_required"]:
        add_error(errors, strategy_program_counts.get(program_type, 0) > 0, f"推荐策略缺少路径：{program_type}")

    pii_hits = {}
    for relative in [
        "studentCases/publish/student_cases_miniapp_publish.json",
        "miniapp/src/data/student-cases-publish.json",
        "studentCases/standardized/student_cases_l1_anonymized.json",
    ]:
        text = (ROOT / relative).read_text(encoding="utf-8")
        hits = PII_PATTERN.findall(text)
        pii_hits[relative] = len(hits)
        add_error(errors, len(hits) == 0, f"{relative} 疑似包含手机号或身份证号")

    report = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "ok": not errors,
        "errors": errors,
        "warnings": warnings,
        "json_checks": json_checks,
        "school_summary": {
            "record_count": len(school_records),
            "party_school_record_count": len(party_school_records),
            "combined_record_count": len(combined_school_records),
            "program_counts": dict(program_counts),
            "province_counts": dict(province_counts),
        },
        "case_summary": {
            "case_count": len(cases),
            "system_counts": dict(case_system_counts),
        },
        "recommendation_strategy_summary": {
            "strategy_count": len(strategies),
            "program_counts": dict(strategy_program_counts),
        },
        "privacy_scan": pii_hits,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"ok": not errors, "report": str(REPORT.relative_to(ROOT)), "errors": errors, "warnings": warnings}, ensure_ascii=False, indent=2))
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
