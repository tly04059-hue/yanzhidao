#!/usr/bin/env python3
"""Build recommendation strategy L1/L2 data for the miniapp."""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "courseRecommendationStrategy/sourceData/recommendation_strategy_seed.json"
L1_OUTPUT = ROOT / "courseRecommendationStrategy/standardized/recommendation_strategy_l1.json"
PUBLISH_OUTPUT = ROOT / "courseRecommendationStrategy/publish/recommendation_strategies_miniapp_publish.json"
MINIAPP_OUTPUT = ROOT / "miniapp/src/data/recommendation-strategies-publish.json"
REPORT_OUTPUT = ROOT / "courseRecommendationStrategy/recommendation_strategy_build_report.json"
DOC_OUTPUT = ROOT / "project_docs/19-推荐方案库L2发布结构与测一测接入口径.md"


def validate_strategy(strategy: dict[str, Any]) -> list[str]:
    required = ["strategy_id", "priority", "status", "primary_path", "program_type", "reason", "school_query"]
    return [field for field in required if field not in strategy or strategy.get(field) in ("", None)]


def build_payload() -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    strategies = source.get("strategies", [])
    errors = []
    for strategy in strategies:
        missing = validate_strategy(strategy)
        if missing:
            errors.append({"strategy_id": strategy.get("strategy_id", ""), "missing": missing})
    if errors:
        raise ValueError(json.dumps(errors, ensure_ascii=False))

    active = sorted(
        [strategy for strategy in strategies if strategy.get("status") == "active"],
        key=lambda item: (-int(item.get("priority", 0)), item["strategy_id"]),
    )
    l1_payload = {
        "metadata": {
            "dataset": "recommendation_strategy_l1",
            "generated_at": str(date.today()),
            "source_file": str(SOURCE.relative_to(ROOT)),
            "record_count": len(strategies),
            "active_count": len(active),
        },
        "records": strategies,
    }
    publish_payload = {
        "metadata": {
            "dataset": "recommendation_strategies_miniapp_publish",
            "generated_at": str(date.today()),
            "version": source.get("metadata", {}).get("version", "2026-05-minimum"),
            "strategy_count": len(active),
            "match_inputs": ["system", "province", "education", "age", "goal", "budget", "study_time", "math_base"],
            "display_note": "测一测提交后按相似度匹配预生成策略，不实时生成全新方案。",
        },
        "strategies": active,
    }
    report = {
        "generated_at": str(date.today()),
        "source_count": len(strategies),
        "publish_count": len(active),
        "program_counts": count_by(active, "program_type"),
        "strategy_ids": [strategy["strategy_id"] for strategy in active],
        "outputs": [
            str(L1_OUTPUT.relative_to(ROOT)),
            str(PUBLISH_OUTPUT.relative_to(ROOT)),
            str(MINIAPP_OUTPUT.relative_to(ROOT)),
        ],
    }
    return l1_payload, publish_payload, report


def count_by(items: list[dict[str, Any]], key: str) -> dict[str, int]:
    result: dict[str, int] = {}
    for item in items:
        value = str(item.get(key, "待确认"))
        result[value] = result.get(value, 0) + 1
    return result


def write_doc(report: dict[str, Any]) -> None:
    lines = [
        "# 推荐方案库 L2 发布结构与测一测接入口径",
        "",
        f"> 更新时间：{report['generated_at']}  ",
        "> 来源：`courseRecommendationStrategy/sourceData/recommendation_strategy_seed.json`  ",
        "> 输出：`courseRecommendationStrategy/publish/recommendation_strategies_miniapp_publish.json`、`miniapp/src/data/recommendation-strategies-publish.json`",
        "",
        "## 1. 本次生成",
        "",
        f"- 发布策略数：{report['publish_count']}",
        f"- 策略分布：{json.dumps(report['program_counts'], ensure_ascii=False)}",
        "",
        "## 2. 接入口径",
        "",
        "1. 测一测不实时生成全新策略，而是用 8 题答案匹配预生成策略。",
        "2. L2 策略只保存前台可展示的路径、原因、风险、院校筛选规则和本周计划。",
        "3. 院校推荐由小程序用 `school_query` 到院校 L2 发布库里筛选。",
        "4. 策略库已经接入 `projectOps` 更新、同步和校验流水线。",
        "",
        "## 3. 后续",
        "",
        "- 根据真实留资和咨询反馈扩充策略数量。",
        "- 把用户反馈与策略命中率写入数据飞轮。",
        "- 为党校完整院校库并入后补充更细的党校策略。",
    ]
    DOC_OUTPUT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    l1_payload, publish_payload, report = build_payload()
    L1_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLISH_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    L1_OUTPUT.write_text(json.dumps(l1_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    PUBLISH_OUTPUT.write_text(json.dumps(publish_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    MINIAPP_OUTPUT.write_text(json.dumps(publish_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT_OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_doc(report)
    print(json.dumps({"ok": True, "report": report}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
