#!/usr/bin/env python3
"""Generate a backfill task table from the 199-exam completeness report."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import date
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REPORT = ROOT / "schoolData/standardized/199exam/199exam_source_completeness_report.json"
DEFAULT_JSON = ROOT / "schoolData/standardized/199exam/199exam_field_backfill_tasks.json"
DEFAULT_CSV = ROOT / "schoolData/standardized/199exam/199exam_field_backfill_tasks.csv"
DEFAULT_P0_CSV = ROOT / "schoolData/standardized/199exam/199exam_field_backfill_tasks_P0.csv"
DEFAULT_MD = ROOT / "project_docs/09-管综字段补齐任务表.md"


TASK_RULES: dict[str, dict[str, str]] = {
    "province": {
        "priority": "P0",
        "task_group": "地域基础字段",
        "owner_role": "数据同事",
        "suggested_source": "学校名称-省份对照表、研招网学校库、现有云贵川渝清单、学校官网",
        "task_type": "补齐/查表",
        "acceptance_criteria": "所有记录 province 不为空；同一学校省份一致；省份值使用标准省级行政区名称。",
        "reason": "省份是小程序第二筛选维度，也是推荐策略的基础过滤字段。",
    },
    "school_code": {
        "priority": "P0",
        "task_group": "学校编码字段",
        "owner_role": "数据同事",
        "suggested_source": "研招网院校库、全量院校表研招网主表部分、学校代码公开表",
        "task_type": "补齐/查表",
        "acceptance_criteria": "能查到研招网代码的学校必须补齐；无法确认时保留空值并标记 needs_review，不允许臆造代码。",
        "reason": "学校代码用于 school_id、去重、后续数据更新和 code/name/label 规则。",
    },
    "department_code": {
        "priority": "P1",
        "task_group": "院系编码字段",
        "owner_role": "数据同事",
        "suggested_source": "研招网招生专业目录、院校招生目录、全量院校表研招网主表部分",
        "task_type": "补齐/查表",
        "acceptance_criteria": "有研招网院系编号则补齐 department_code；无编号时 department_name 和 department_label 必须保留，department_code 可为空。",
        "reason": "院系代码有利于招生目录更新对齐，但一期前台可以先展示院系名称。",
    },
    "junior_college_allowed": {
        "priority": "P0",
        "task_group": "报考条件字段",
        "owner_role": "教研/数据同事",
        "suggested_source": "院校招生简章、专业目录、研招网备注、学校研究生院官网",
        "task_type": "人工确认",
        "acceptance_criteria": "字段值统一为 是/否/需条件/未确认；未确认不得默认写否。",
        "reason": "是否接受大专报考是用户路径判断和测一测推荐的重要限制条件。",
    },
    "school_level": {
        "priority": "P1",
        "task_group": "院校标签字段",
        "owner_role": "数据同事",
        "suggested_source": "现有学校标签、985/211/双一流名单、教育部公开名单",
        "task_type": "规则补齐",
        "acceptance_criteria": "L1 可保留 985/211/双一流/普通等完整标签；同一学校标签一致。",
        "reason": "院校标签用于推荐排序、名校认可型策略和前台筛选。",
    },
    "school_level_display": {
        "priority": "P1",
        "task_group": "院校标签字段",
        "owner_role": "数据同事",
        "suggested_source": "由 school_level 规则映射",
        "task_type": "自动推导/复核",
        "acceptance_criteria": "管综前台展示值只使用 985/211/双非；985 优先于 211。",
        "reason": "这是前台展示和筛选字段，需要与老板确认的三个选项一致。",
    },
    "retired_soldier_plan": {
        "priority": "P1",
        "task_group": "专项计划字段",
        "owner_role": "教研/数据同事",
        "suggested_source": "研招网专业目录、招生简章、备注字段",
        "task_type": "人工确认/文本解析",
        "acceptance_criteria": "字段值统一为 是/否/未确认；来源备注中提到退役计划时必须标注来源。",
        "reason": "专项计划影响部分用户可报考路径，不能简单默认。",
    },
    "minority_backbone_plan": {
        "priority": "P1",
        "task_group": "专项计划字段",
        "owner_role": "教研/数据同事",
        "suggested_source": "研招网专业目录、招生简章、备注字段",
        "task_type": "人工确认/文本解析",
        "acceptance_criteria": "字段值统一为 是/否/未确认；来源备注中提到少骨/少干计划时必须标注来源。",
        "reason": "少骨/少干计划影响特殊用户路径和备注展示。",
    },
    "class_time": {
        "priority": "P1",
        "task_group": "上课安排字段",
        "owner_role": "数据同事",
        "suggested_source": "MBA大师详情库、学校招生简章、项目官网",
        "task_type": "补齐/标准化",
        "acceptance_criteria": "覆盖率提升到 90% 以上；保留原文，同时可派生 周末/集中/平时/线上 等标签。",
        "reason": "上课方式直接影响在职用户选择，是前台一期核心字段。",
    },
    "direction_code": {
        "priority": "P2",
        "task_group": "研究方向字段",
        "owner_role": "数据同事",
        "suggested_source": "研招网专业目录、源表方向字段",
        "task_type": "补齐/标准化",
        "acceptance_criteria": "方向有编号时保留 direction_code；无编号时允许为空，但 direction 和 direction_label 不得丢失。",
        "reason": "方向编号有助于目录对齐，但对一期前台展示不是强阻塞。",
    },
    "admission_rate": {
        "priority": "P2",
        "task_group": "录取分析字段",
        "owner_role": "教研/数据同事",
        "suggested_source": "录取情况、分数段统计、MBA大师详情库、院校复试录取名单",
        "task_type": "二次解析/人工复核",
        "acceptance_criteria": "能够从复试人数和录取人数计算时自动生成；无法确认时保留为空，不要用不可靠文本估算。",
        "reason": "录取率用于策略和风险提示，准确性优先于覆盖率。",
    },
    "logo_url": {
        "priority": "P3",
        "task_group": "展示资源字段",
        "owner_role": "运营/数据同事",
        "suggested_source": "研招网学校 logo、学校官网、现有学校Logo字段",
        "task_type": "补齐/可后置",
        "acceptance_criteria": "前台需要展示 logo 时再补；不影响一期核心数据发布。",
        "reason": "展示体验字段，不应阻塞 L1 主数据清洗。",
    },
    "retest_info_by_year.2025.notes": {
        "priority": "P1",
        "task_group": "复试考情字段",
        "owner_role": "教研/数据同事",
        "suggested_source": "复试信息、学校复试细则、招生学院官网",
        "task_type": "二次解析",
        "acceptance_criteria": "先保留 notes 原文；后续拆分 written_exam/interview_content/interview_format/reference_books/score_calculation。",
        "reason": "复试信息覆盖高，但还不是结构化字段，适合二期解析。",
    },
    "first_choice_admission_by_year.2025.score_band_analysis": {
        "priority": "P1",
        "task_group": "录取分析字段",
        "owner_role": "教研/数据同事",
        "suggested_source": "录取分析、分数段统计、录取名单、MBA大师分数段库",
        "task_type": "二次解析",
        "acceptance_criteria": "先保留原文；后续拆分复试人数、录取人数、复录比、录取率、分数段。",
        "reason": "这是后续推荐策略、风险提示和案例对比的重要输入。",
    },
    "first_choice_admission_by_year.2024.score_line": {
        "priority": "P2",
        "task_group": "历史分数线字段",
        "owner_role": "数据同事",
        "suggested_source": "2024分数线、学校官网、MBA大师详情库",
        "task_type": "补齐/查表",
        "acceptance_criteria": "覆盖率提升到 85% 以上；无法确认时标记未确认。",
        "reason": "历史分数线支持趋势判断，但一期可先展示最新分数线。",
    },
    "first_choice_admission_by_year.2023.score_line": {
        "priority": "P2",
        "task_group": "历史分数线字段",
        "owner_role": "数据同事",
        "suggested_source": "2023分数线、学校官网、MBA大师详情库",
        "task_type": "补齐/查表",
        "acceptance_criteria": "覆盖率提升到 85% 以上；无法确认时标记未确认。",
        "reason": "历史分数线支持趋势判断，但一期可先展示最新分数线。",
    },
    "first_choice_admission_by_year.2022.score_line": {
        "priority": "P2",
        "task_group": "历史分数线字段",
        "owner_role": "数据同事",
        "suggested_source": "2022分数线、学校官网、MBA大师详情库",
        "task_type": "补齐/查表",
        "acceptance_criteria": "覆盖率提升到 85% 以上；无法确认时标记未确认。",
        "reason": "历史分数线支持趋势判断，但一期可先展示最新分数线。",
    },
    "adjustment_admission_by_year.*.quota": {
        "priority": "P2",
        "task_group": "调剂录取字段",
        "owner_role": "教研/数据同事",
        "suggested_source": "调剂公告、复试调剂名单、学校研究生院官网、研招网调剂系统公告",
        "task_type": "人工补充/另找来源",
        "acceptance_criteria": "按年度补 quota/rounds/qualification_line；quota > 0 时 adjustment 应推导为 是。",
        "reason": "全量主表无年度调剂名额，属于策略增强字段，不阻塞一期但对调剂机会型策略很重要。",
    },
}


def task_from_field(item: dict[str, Any], index: int) -> dict[str, Any]:
    target = item["target_path"]
    rule = TASK_RULES.get(target, {})
    priority = rule.get("priority", "P2")
    return {
        "task_id": f"199-BF-{index:03d}",
        "priority": priority,
        "task_group": rule.get("task_group", "字段补齐"),
        "target_path": target,
        "current_coverage": item["coverage"],
        "current_coverage_display": f"{item['coverage']:.2%}",
        "match_status": item["match_status"],
        "source_columns": item.get("source_columns", []),
        "task_type": rule.get("task_type", "补齐/复核"),
        "suggested_source": rule.get("suggested_source", "源表、官网或人工确认"),
        "owner_role": rule.get("owner_role", "待分配"),
        "owner": "待分配",
        "status": "todo",
        "phase": "L1_backfill",
        "due_batch": "2026-05-data-cleaning",
        "reason": rule.get("reason", item.get("note", "")),
        "acceptance_criteria": rule.get("acceptance_criteria", "字段覆盖率达到 80% 以上，来源可追溯。"),
        "notes": item.get("note", ""),
    }


def priority_rank(task: dict[str, Any]) -> tuple[int, str]:
    order = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
    return order.get(task["priority"], 9), task["target_path"]


def load_report(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def build_tasks(report: dict[str, Any]) -> dict[str, Any]:
    source_items = report["needs_manual_or_parser_fields"]
    tasks = [task_from_field(item, index + 1) for index, item in enumerate(source_items)]
    tasks.sort(key=priority_rank)
    for index, task in enumerate(tasks, start=1):
        task["task_id"] = f"199-BF-{index:03d}"

    return {
        "metadata": {
            "generated_at": str(date.today()),
            "source_report": "schoolData/standardized/199exam/199exam_source_completeness_report.json",
            "task_count": len(tasks),
            "status_values": ["todo", "doing", "review", "done", "blocked"],
            "priority_values": ["P0", "P1", "P2", "P3"],
            "note": "管综 L1 字段补齐任务表；owner 字段由实际项目负责人分配。",
        },
        "summary": {
            "by_priority": count_by(tasks, "priority"),
            "by_owner_role": count_by(tasks, "owner_role"),
            "by_task_group": count_by(tasks, "task_group"),
        },
        "tasks": tasks,
    }


def count_by(tasks: list[dict[str, Any]], key: str) -> dict[str, int]:
    result: dict[str, int] = {}
    for task in tasks:
        value = task[key]
        result[value] = result.get(value, 0) + 1
    return result


def write_csv(payload: dict[str, Any], path: Path) -> None:
    write_csv_rows(payload["tasks"], path)


def write_csv_rows(tasks: list[dict[str, Any]], path: Path) -> None:
    columns = [
        "task_id",
        "priority",
        "task_group",
        "target_path",
        "current_coverage_display",
        "match_status",
        "source_columns",
        "task_type",
        "suggested_source",
        "owner_role",
        "owner",
        "status",
        "due_batch",
        "reason",
        "acceptance_criteria",
        "notes",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        for task in tasks:
            row = {key: task.get(key, "") for key in columns}
            row["source_columns"] = "、".join(task.get("source_columns", []))
            writer.writerow(row)


def write_markdown(payload: dict[str, Any], path: Path) -> None:
    meta = payload["metadata"]
    summary = payload["summary"]
    tasks = payload["tasks"]
    lines = [
        "# 管综字段补齐任务表",
        "",
        f"> 更新时间：{meta['generated_at']}  ",
        "> 来源：`schoolData/standardized/199exam/199exam_source_completeness_report.json`  ",
        "> 目的：把低覆盖、需解析、需人工确认的 L1 字段拆成可执行任务，方便同事认领和推进。",
        "",
        "## 1. 任务概况",
        "",
        "| 指标 | 数量 |",
        "| --- | ---: |",
        f"| 任务总数 | {meta['task_count']} |",
    ]
    for priority in ["P0", "P1", "P2", "P3"]:
        lines.append(f"| {priority} | {summary['by_priority'].get(priority, 0)} |")

    lines.extend(
        [
            "",
            "责任角色分布：",
            "",
            "```json",
            json.dumps(summary["by_owner_role"], ensure_ascii=False, indent=2),
            "```",
            "",
            "## 2. 任务表",
            "",
            "| ID | 优先级 | 分组 | L1 字段 | 当前覆盖率 | 任务类型 | 建议来源 | 责任角色 | 状态 | 验收标准 |",
            "| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- |",
        ]
    )
    for task in tasks:
        lines.append(
            "| {task_id} | {priority} | {task_group} | `{target_path}` | {coverage} | {task_type} | {source} | {owner_role} | {status} | {criteria} |".format(
                task_id=task["task_id"],
                priority=task["priority"],
                task_group=task["task_group"],
                target_path=task["target_path"],
                coverage=task["current_coverage_display"],
                task_type=task["task_type"],
                source=task["suggested_source"],
                owner_role=task["owner_role"],
                status=task["status"],
                criteria=task["acceptance_criteria"],
            )
        )

    lines.extend(
        [
            "",
            "## 3. 优先级说明",
            "",
            "- `P0`：一期发布、筛选或推荐强相关，优先补齐。",
            "- `P1`：一期体验或 L1 质量重要字段，建议本轮补齐或至少明确状态。",
            "- `P2`：二期策略增强字段，可排入后续批次。",
            "- `P3`：展示资源或非阻塞字段，可后置。",
            "",
            "## 4. 状态说明",
            "",
            "- `todo`：待处理。",
            "- `doing`：处理中。",
            "- `review`：待审核。",
            "- `done`：已完成并通过验收。",
            "- `blocked`：缺少来源或无法确认。",
            "",
            "## 5. 使用建议",
            "",
            "1. 数据同事先处理 P0，确保 L1 主数据和一期发布字段不被卡住。",
            "2. 教研同事重点确认大专报考、专项计划、复试考情、录取分析。",
            "3. 所有补齐结果必须保留来源，不确定的字段写 `未确认`，不要默认写 `否`。",
            "4. 完成补齐后，重新运行字段扫描脚本，比较覆盖率变化。",
        ]
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate 199-exam field backfill task table.")
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--json-output", type=Path, default=DEFAULT_JSON)
    parser.add_argument("--csv-output", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--p0-csv-output", type=Path, default=DEFAULT_P0_CSV)
    parser.add_argument("--md-output", type=Path, default=DEFAULT_MD)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    payload = build_tasks(load_report(args.report))
    args.json_output.parent.mkdir(parents=True, exist_ok=True)
    args.json_output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_csv(payload, args.csv_output)
    write_csv_rows([task for task in payload["tasks"] if task["priority"] == "P0"], args.p0_csv_output)
    write_markdown(payload, args.md_output)
    print(
        json.dumps(
            {
                "ok": True,
                "json_output": str(args.json_output.relative_to(ROOT)),
                "csv_output": str(args.csv_output.relative_to(ROOT)),
                "p0_csv_output": str(args.p0_csv_output.relative_to(ROOT)),
                "md_output": str(args.md_output.relative_to(ROOT)),
                "task_count": payload["metadata"]["task_count"],
                "summary": payload["summary"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
