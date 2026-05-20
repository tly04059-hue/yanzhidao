#!/usr/bin/env python3
"""Build MEM display data from yanzhao HTML snapshots."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup

sys.dont_write_bytecode = True


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_DIR = ROOT / "schoolData/sourceData/199exam/html"
DEFAULT_OUTPUT = ROOT / "schoolData/mem.json"
DEFAULT_L1_OUTPUT = ROOT / "schoolData/standardized/199exam/199exam_mem_school_program_master.json"
DEFAULT_REPORT = ROOT / "schoolData/standardized/199exam/199exam_mem_html_extract_report.json"
DEFAULT_MD = ROOT / "project_docs/16-MEM_HTML数据重建与页面接入口径.md"

REGION_BY_SUFFIX = {
    "sc": ("scData", "sc", "四川"),
    "cq": ("cqData", "cq", "重庆"),
    "yn": ("ynData", "yn", "云南"),
    "gz": ("gzData", "gz", "贵州"),
    "qz": ("gzData", "gz", "贵州"),
}

REGION_ORDER = ["scData", "cqData", "ynData", "gzData"]
MAJOR_CODE_TO_NAME = {
    "125601": "工程管理",
    "125602": "项目管理",
    "125603": "工业工程与管理",
    "125604": "物流工程与管理",
}


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def strip_hidden_text(node: Any) -> str:
    soup = BeautifulSoup(str(node), "html.parser")
    for hidden in soup.select(".ivu-tooltip-popper, .ivu-poptip-popper"):
        hidden.decompose()
    return clean_text(soup.get_text(" ", strip=True))


def parse_filename(path: Path) -> tuple[str, str, str, str, str]:
    match = re.match(r"\((\d{6})\)(.+?)([a-z]+)\.html$", path.name)
    if not match:
        raise ValueError(f"无法识别 MEM HTML 文件名：{path.name}")
    major_code, major_name, suffix = match.groups()
    if suffix not in REGION_BY_SUFFIX:
        raise ValueError(f"无法识别地区后缀：{path.name}")
    region_key, region_code, province = REGION_BY_SUFFIX[suffix]
    return region_key, region_code, province, major_code, major_name


def split_school_label(label: str) -> tuple[str, str]:
    text = clean_text(label)
    match = re.match(r"^\(([^)]+)\)(.+)$", text)
    if match:
        return match.group(1), match.group(2)
    return "", text


def normalize_tag(value: str) -> str:
    text = clean_text(value).replace("“", "").replace("”", "")
    if text == "双一流建设高校":
        return "双一流建设高校"
    return text


def parse_enrollment(cell: Any) -> tuple[str, str]:
    tooltip = clean_text(" ".join(item.get_text(" ", strip=True) for item in cell.select(".ivu-tooltip-inner")))
    match = re.search(r"(?:专业|研究方向)\s*[:：]\s*(\d+)", tooltip)
    if match:
        return match.group(1), tooltip
    visible = strip_hidden_text(cell)
    match = re.search(r"(\d+)", visible)
    return (match.group(1) if match else ""), tooltip or visible


def parse_exam_subjects(cell: Any) -> str:
    subjects: list[str] = []
    for item in cell.select(".kskm-detail .item"):
        item_soup = BeautifulSoup(str(item), "html.parser")
        for span in item_soup.find_all("span"):
            span.decompose()
        text = clean_text(item_soup.get_text(" ", strip=True))
        if not text or "无" in text:
            continue
        text = text.replace("(", "").replace(")", "")
        subjects.append(text)
    return "+".join(subjects)


def parse_detail_url(cell: Any) -> str:
    for link in cell.find_all("a"):
        href = link.get("href", "")
        if "yjfxdetail" in href:
            return urljoin("https://yz.chsi.com.cn", href)
    return ""


def parse_tuition_and_duration(notes: str) -> tuple[str, str]:
    duration = ""
    tuition = ""
    duration_match = re.search(r"学制\s*[:：]\s*([0-9.]+)\s*年", notes)
    if duration_match:
        duration = f"{duration_match.group(1)}年"
    tuition_match = re.search(r"学费\s*[:：]\s*([0-9.]+)\s*元", notes)
    if tuition_match:
        amount = float(tuition_match.group(1))
        wan = amount / 10000
        tuition = f"{wan:g}W"
    if tuition and duration:
        return f"{tuition}丨{duration}", duration
    return tuition, duration


def parse_class_time(notes: str) -> str:
    match = re.search(r"(周末|集中|脱产|线上|晚班|白天)[^。；;，,]*", notes)
    return clean_text(match.group(0)) if match else ""


def parse_row(headers: list[str], cells: list[Any], source: dict[str, str]) -> dict[str, Any]:
    cell_map = dict(zip(headers, cells))
    direction_cell = cell_map.get("研究方向")
    notes = ""
    if direction_cell:
        notes = clean_text(" ".join(item.get_text(" ", strip=True) for item in direction_cell.select(".ivu-tooltip-inner")))

    enrollment, enrollment_raw = parse_enrollment(cell_map.get("拟招生人数")) if cell_map.get("拟招生人数") else ("", "")
    tuition, duration = parse_tuition_and_duration(notes)

    program = {
        "department": strip_hidden_text(cell_map.get("院系所")) if cell_map.get("院系所") else "",
        "exam_type": strip_hidden_text(cell_map.get("考试方式")) if cell_map.get("考试方式") else "",
        "major": strip_hidden_text(cell_map.get("专业")) if cell_map.get("专业") else f"({source['major_code']}){source['major_name']}",
        "study_mode": strip_hidden_text(cell_map.get("学习方式")) if cell_map.get("学习方式") else "",
        "tuition": tuition,
        "direction": strip_hidden_text(direction_cell) if direction_cell else "",
        "notes": notes,
        "veteran_plan": strip_hidden_text(cell_map.get("退役计划")) if cell_map.get("退役计划") else "",
        "minority_plan": strip_hidden_text(cell_map.get("少骨计划")) if cell_map.get("少骨计划") else "",
        "enrollment": enrollment,
        "exam_subjects": parse_exam_subjects(cell_map.get("考试科目")) if cell_map.get("考试科目") else "",
        "last_year_score": "",
        "this_year_score": "",
        "admission": "",
        "admission_rate": "",
        "adjustment": "",
        "class_time": parse_class_time(notes),
        "duration": duration,
        "source_major_code": source["major_code"],
        "source_major_name": source["major_name"],
        "source_file": source["source_file"],
        "source_detail_url": parse_detail_url(cell_map.get("更多")) if cell_map.get("更多") else "",
        "enrollment_raw": enrollment_raw,
    }
    return program


def parse_html_file(path: Path) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    region_key, region_code, province, major_code, major_name = parse_filename(path)
    soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="ignore"), "html.parser")
    source = {
        "region_key": region_key,
        "region_code": region_code,
        "province": province,
        "major_code": major_code,
        "major_name": major_name,
        "source_file": str(path.relative_to(ROOT)),
    }

    schools: list[dict[str, Any]] = []
    for item in soup.select(".zy-item"):
        name_node = item.select_one(".yx-name")
        if not name_node:
            continue
        school_code, school_name = split_school_label(name_node.get_text(" ", strip=True))
        logo = item.select_one(".yx-img")
        area = clean_text(item.select_one(".yx-area").get_text(" ", strip=True) if item.select_one(".yx-area") else province)
        tags = [normalize_tag(tag.get_text(" ", strip=True)) for tag in item.select(".yx-tag") if clean_text(tag.get_text(" ", strip=True))]
        headers = [clean_text(th.get_text(" ", strip=True)) for th in item.select(".ivu-table-header th")]
        programs = []
        for row in item.select(".ivu-table-body tbody tr"):
            cells = row.find_all("td", recursive=False)
            if not cells or len(cells) < 4:
                continue
            program = parse_row(headers, cells, source)
            if program["major"] or program["direction"]:
                programs.append(program)
        schools.append(
            {
                "school_code": school_code,
                "school_name": school_name,
                "location": area or province,
                "tags": tags,
                "logo_url": logo.get("src", "") if logo else "",
                "programs": programs,
            }
        )
    return source, schools


def merge_school(target: dict[str, Any], school: dict[str, Any]) -> None:
    key = school["school_code"] or school["school_name"]
    if key not in target:
        target[key] = {**school, "programs": []}
    existing = target[key]
    existing_tags = list(dict.fromkeys([*existing.get("tags", []), *school.get("tags", [])]))
    existing["tags"] = existing_tags
    if not existing.get("logo_url") and school.get("logo_url"):
        existing["logo_url"] = school["logo_url"]
    existing["programs"].extend(school.get("programs", []))


def build_payload(source_dir: Path) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    region_schools: dict[str, dict[str, dict[str, Any]]] = {key: {} for key in REGION_ORDER}
    source_files = []
    l1_records = []
    counts_by_file = {}
    counts_by_major: dict[str, Counter[str]] = defaultdict(Counter)

    for path in sorted(source_dir.glob("*.html")):
        source, schools = parse_html_file(path)
        source_files.append(source["source_file"])
        counts_by_file[source["source_file"]] = {
            "region": source["province"],
            "major_code": source["major_code"],
            "major_name": source["major_name"],
            "school_count": len(schools),
            "program_count": sum(len(school.get("programs", [])) for school in schools),
        }
        counts_by_major[source["region_key"]][source["major_name"]] += sum(len(school.get("programs", [])) for school in schools)
        for school in schools:
            merge_school(region_schools[source["region_key"]], school)
            for program in school.get("programs", []):
                l1_records.append(
                    {
                        "record_id": "-".join(
                            [
                                "mem",
                                source["region_code"],
                                school.get("school_code") or school.get("school_name"),
                                program.get("department", ""),
                                program.get("major", ""),
                                program.get("study_mode", ""),
                                program.get("direction", ""),
                            ]
                        ),
                        "program_type": "MEM",
                        "province": source["province"],
                        "school_code": school.get("school_code", ""),
                        "school_name": school.get("school_name", ""),
                        "school_label": f"({school.get('school_code', '')}){school.get('school_name', '')}" if school.get("school_code") else school.get("school_name", ""),
                        "department_label": program.get("department", ""),
                        "major_code": source["major_code"],
                        "major_name": source["major_name"],
                        "major_label": program.get("major", ""),
                        "study_mode": program.get("study_mode", ""),
                        "direction": program.get("direction", ""),
                        "enrollment": program.get("enrollment", ""),
                        "tuition": program.get("tuition", ""),
                        "duration": program.get("duration", ""),
                        "exam_subjects": program.get("exam_subjects", ""),
                        "retired_soldier_plan": program.get("veteran_plan", ""),
                        "minority_backbone_plan": program.get("minority_plan", ""),
                        "notes": program.get("notes", ""),
                        "source_file": program.get("source_file", ""),
                    }
                )

    mem_json: dict[str, Any] = {}
    for region_key in REGION_ORDER:
        region_code = region_key[:2]
        province = {"scData": "四川", "cqData": "重庆", "ynData": "云南", "gzData": "贵州"}[region_key]
        schools = sorted(region_schools[region_key].values(), key=lambda item: (item.get("school_code", ""), item.get("school_name", "")))
        total_programs = sum(len(school.get("programs", [])) for school in schools)
        mem_json[region_key] = {
            "MEM": {
                "region": region_code,
                "province": province,
                "major": "工程管理(MEM)",
                "major_code": "1256",
                "total_schools": len(schools),
                "total_programs": total_programs,
                "data_source": "研招网 MEM HTML 抓取数据（schoolData/sourceData/199exam/html）",
                "extensions": {
                    "class_time": {
                        "default_by_school": {},
                        "by_school_and_mode": {},
                    },
                    "admission_analysis_by_school_department": {},
                    "exam_26_by_school": {},
                    "mem_by_major": dict(counts_by_major[region_key]),
                    "source_files": [file for file, meta in counts_by_file.items() if meta["region"] == province],
                    "extract_note": "该文件为 yanzhidao_schooldata.html 展示友好结构；完整标准化记录同步输出到 standardized/199exam。",
                },
                "schools": schools,
            }
        }

    l1_payload = {
        "metadata": {
            "dataset": "199exam_mem_school_program_master",
            "generated_at": str(date.today()),
            "source_dir": str(source_dir.relative_to(ROOT)),
            "source_files": source_files,
            "record_count": len(l1_records),
        },
        "records": l1_records,
    }
    report = {
        "generated_at": str(date.today()),
        "source_file_count": len(source_files),
        "source_files": source_files,
        "region_summary": {
            region_key: {
                "school_count": mem_json[region_key]["MEM"]["total_schools"],
                "program_count": mem_json[region_key]["MEM"]["total_programs"],
                "mem_by_major": mem_json[region_key]["MEM"]["extensions"]["mem_by_major"],
            }
            for region_key in REGION_ORDER
        },
        "file_summary": counts_by_file,
        "l1_record_count": len(l1_records),
    }
    return mem_json, l1_payload, report


def write_markdown(report: dict[str, Any], path: Path) -> None:
    lines = [
        "# MEM HTML 数据重建与页面接入口径",
        "",
        f"> 更新时间：{report['generated_at']}  ",
        "> 来源：`schoolData/sourceData/199exam/html`  ",
        "> 输出：`schoolData/mem.json`、`schoolData/standardized/199exam/199exam_mem_school_program_master.json`",
        "",
        "## 1. 生成结果",
        "",
        "| 地区 | 学校数 | 招生方向数 |",
        "| --- | ---: | ---: |",
    ]
    for region_key, summary in report["region_summary"].items():
        lines.append(f"| {region_key} | {summary['school_count']} | {summary['program_count']} |")
    lines.extend(
        [
            "",
            f"源 HTML 文件数：{report['source_file_count']}。",
            f"L1 标准化记录数：{report['l1_record_count']}。",
            "",
            "## 2. 落库口径",
            "",
            "1. `mem.json` 采用与 `data.json` 兼容的地区结构：`scData/cqData/ynData/gzData -> MEM`。",
            "2. MEM 四个细分专业不拆成四个顶层项目，而是保留在每条 `program.major` 和 `extensions.mem_by_major` 中。",
            "3. HTML 中的 tooltip 信息被提取到 `notes`、`enrollment`、`exam_subjects`、`tuition`、`duration` 等字段。",
            "4. 当前源 HTML 不包含复试线、拟录取分析和录取率，这些字段留空，不伪造。",
            "5. L1 标准化记录同步输出，后续可并入小程序 L2 管综发布数据。",
            "",
            "## 3. 后续注意",
            "",
            "后续如果 HTML 源文件更新，直接重跑 `AIAgent/scripts/build_mem_from_199exam_html.py`，不要手工改 `mem.json`。",
        ]
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build MEM JSON from 199exam HTML snapshots.")
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--l1-output", type=Path, default=DEFAULT_L1_OUTPUT)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--md-output", type=Path, default=DEFAULT_MD)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    mem_json, l1_payload, report = build_payload(args.source_dir)
    args.output.write_text(json.dumps(mem_json, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.l1_output.parent.mkdir(parents=True, exist_ok=True)
    args.l1_output.write_text(json.dumps(l1_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_markdown(report, args.md_output)
    print(json.dumps({"ok": True, "summary": report}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
