#!/usr/bin/env python3
"""Extract sample 199-exam school records from the field template workbook.

This script intentionally uses only Python standard library modules so it can
run in the current project without installing spreadsheet dependencies.
"""

from __future__ import annotations

import argparse
import json
import re
import zipfile
from datetime import date
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MAPPING = ROOT / "schoolData/mappings/199exam_field_mapping.json"
DEFAULT_OUTPUT = ROOT / "schoolData/standardized/199exam/199exam_school_program_master.sample.json"
NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}

PHASE1_REQUIRED_FIELDS = [
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
]


def column_number(column: str) -> int:
    number = 0
    for char in column:
        number = number * 26 + ord(char.upper()) - 64
    return number


def column_name(number: int) -> str:
    name = ""
    while number:
        number, remainder = divmod(number - 1, 26)
        name = chr(65 + remainder) + name
    return name


def split_cell_ref(cell_ref: str) -> tuple[str, int]:
    match = re.match(r"^([A-Z]+)(\d+)$", cell_ref)
    if not match:
        raise ValueError(f"Invalid cell reference: {cell_ref}")
    return match.group(1), int(match.group(2))


def read_shared_strings(xlsx: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in xlsx.namelist():
        return []
    root = ET.fromstring(xlsx.read("xl/sharedStrings.xml"))
    strings: list[str] = []
    for item in root.findall("main:si", NS):
        strings.append("".join(node.text or "" for node in item.findall(".//main:t", NS)))
    return strings


def resolve_sheet_path(xlsx: zipfile.ZipFile, sheet_name: str) -> str:
    workbook = ET.fromstring(xlsx.read("xl/workbook.xml"))
    rels = ET.fromstring(xlsx.read("xl/_rels/workbook.xml.rels"))
    rel_targets = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels.findall("rel:Relationship", NS)
    }

    for sheet in workbook.findall("main:sheets/main:sheet", NS):
        if sheet.attrib.get("name") != sheet_name:
            continue
        rel_id = sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        target = rel_targets[rel_id]
        if target.startswith("/"):
            return target.lstrip("/")
        return f"xl/{target}"

    raise ValueError(f"Sheet not found: {sheet_name}")


def parse_cell_value(cell: ET.Element, shared_strings: list[str]) -> Any:
    cell_type = cell.attrib.get("t")

    if cell_type == "inlineStr":
        inline = cell.find("main:is", NS)
        if inline is None:
            return ""
        return "".join(node.text or "" for node in inline.findall(".//main:t", NS)).strip()

    value_node = cell.find("main:v", NS)
    if value_node is None or value_node.text is None:
        return ""

    raw = value_node.text
    if cell_type == "s":
        return shared_strings[int(raw)].strip()
    if cell_type == "b":
        return raw == "1"
    if cell_type in {"str", "e"}:
        return raw.strip()

    try:
        number = float(raw)
    except ValueError:
        return raw.strip()
    return int(number) if number.is_integer() else number


def read_sheet_rows(xlsx_path: Path, sheet_name: str) -> dict[int, dict[str, Any]]:
    with zipfile.ZipFile(xlsx_path) as xlsx:
        shared_strings = read_shared_strings(xlsx)
        sheet_path = resolve_sheet_path(xlsx, sheet_name)
        root = ET.fromstring(xlsx.read(sheet_path))

    rows: dict[int, dict[str, Any]] = {}
    for cell in root.findall(".//main:c", NS):
        ref = cell.attrib.get("r", "")
        if not ref:
            continue
        column, row_number = split_cell_ref(ref)
        rows.setdefault(row_number, {})[column] = parse_cell_value(cell, shared_strings)
    return rows


def is_empty(value: Any) -> bool:
    return value is None or (isinstance(value, str) and value.strip() == "")


def clean_string(value: Any) -> str:
    if is_empty(value):
        return ""
    return str(value).strip()


def number_or_string(value: Any) -> Any:
    if is_empty(value):
        return None
    if isinstance(value, (int, float)):
        return value
    text = clean_string(value)
    try:
        number = float(text)
    except ValueError:
        return text
    return int(number) if number.is_integer() else number


def parse_label_code_name(value: Any) -> tuple[str, str, str]:
    label = clean_string(value)
    if not label:
        return "", "", ""
    match = re.match(r"^（([^）]+)）(.+)$|^\(([^)]+)\)(.+)$", label)
    if not match:
        return "", label, label
    code = clean_string(match.group(1) or match.group(3))
    name = clean_string(match.group(2) or match.group(4))
    return code, name, label


def clean_direction(value: Any) -> tuple[str, str, str]:
    code, name, label = parse_label_code_name(value)
    if not label:
        return "", "", ""
    direction = name or label
    direction = re.sub(r"(非全日制|全日制|非全|全日)", "", direction).strip()
    return code, direction, label


def yuan_from_ten_thousand(value: Any) -> int | float | None:
    number = number_or_string(value)
    if number is None or isinstance(number, str):
        return None
    yuan = number * 10000
    return int(yuan) if float(yuan).is_integer() else yuan


def school_level_display(value: Any) -> str:
    text = clean_string(value)
    if text == "985":
        return "985"
    if text == "211":
        return "211"
    if text:
        return "双非"
    return ""


def set_path(record: dict[str, Any], path: str, value: Any) -> None:
    keys = path.split(".")
    target = record
    for key in keys[:-1]:
        target = target.setdefault(key, {})
    target[keys[-1]] = value


def get_path(record: dict[str, Any], path: str) -> Any:
    target: Any = record
    for key in path.split("."):
        if not isinstance(target, dict) or key not in target:
            return None
        target = target[key]
    return target


def apply_mapping(record: dict[str, Any], column: str, value: Any) -> None:
    if is_empty(value):
        return

    if column == "G":
        tuition = yuan_from_ten_thousand(value)
        record["tuition_min"] = tuition
        record["tuition_max"] = tuition
        return

    if column == "I":
        code, name, label = parse_label_code_name(value)
        record["school_code"] = code
        record["school_name"] = name
        record["school_label"] = label
        record["school_id"] = code
        return

    if column == "J":
        text = clean_string(value)
        record["school_level"] = text
        record["school_level_display"] = school_level_display(text)
        return

    if column == "K":
        code, name, label = parse_label_code_name(value)
        record["department_code"] = code
        record["department_name"] = name
        record["department_label"] = label
        record["department"] = label
        return

    if column == "L":
        code, name, label = parse_label_code_name(value)
        record["major_category_code"] = code
        record["major_category_name"] = name
        record["major_category_label"] = label
        return

    if column == "M":
        code, name, label = parse_label_code_name(value)
        record["major_code"] = code
        record["major_name"] = name
        record["major_label"] = label
        return

    if column == "N":
        code, direction, label = clean_direction(value)
        record["direction_code"] = code
        record["direction"] = direction
        record["direction_label"] = label
        return

    direct_number_columns = {"F", "O", "P", "Q", "R", "S", "T"}
    if column in direct_number_columns:
        value = number_or_string(value)
    else:
        value = clean_string(value)

    # Remaining direct and nested fields come from the mapping table.
    target_path = COLUMN_TARGETS.get(column)
    if not target_path:
        return
    set_path(record, target_path, value)


def study_mode_code(study_mode: str) -> str:
    if study_mode == "非全日制":
        return "nonfull"
    if study_mode == "全日制":
        return "full"
    return "unknown"


def slug_text(value: Any, fallback: str) -> str:
    text = clean_string(value)
    if not text:
        return fallback
    ascii_text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return ascii_text or fallback


def derive_latest_score(record: dict[str, Any]) -> None:
    parts = [record.get("total_score"), record.get("english_score"), record.get("comprehensive_score")]
    if all(not is_empty(part) for part in parts):
        record["latest_score"] = "/".join(str(part) for part in parts)
    elif not is_empty(parts[0]):
        record["latest_score"] = str(parts[0])
    else:
        record["latest_score"] = ""


def derive_adjustment(record: dict[str, Any]) -> None:
    has_adjustment_quota = False
    for year_data in record.get("adjustment_admission_by_year", {}).values():
        quota = year_data.get("quota") if isinstance(year_data, dict) else None
        if isinstance(quota, (int, float)) and quota > 0:
            has_adjustment_quota = True
        elif isinstance(quota, str):
            try:
                has_adjustment_quota = float(quota.strip()) > 0
            except ValueError:
                pass
    if has_adjustment_quota:
        record["adjustment"] = "是"
    elif "adjustment" not in record:
        record["adjustment"] = ""


def derive_ids(record: dict[str, Any], source_row: int, version_year: str) -> None:
    program = slug_text(record.get("program_type"), "unknown")
    school = slug_text(record.get("school_code"), "school")
    department = slug_text(record.get("department_code"), "dept")
    major = slug_text(record.get("major_code"), "major")
    direction = slug_text(record.get("direction_code"), f"dir{source_row}")
    mode = study_mode_code(clean_string(record.get("study_mode")))

    record["school_id"] = clean_string(record.get("school_id")) or school
    record["program_id"] = f"199-{program}-{school}-{version_year}"
    record["track_id"] = f"{school}-{department}-{major}-{direction}-{mode}"
    record["record_id"] = f"199-{program}-{school}-{department}-{major}-{direction}-{mode}-r{source_row}"


def build_tags(record: dict[str, Any]) -> list[str]:
    tags = ["管综"]
    for key in ["program_type", "province", "city", "school_level_display", "study_mode", "class_time"]:
        value = clean_string(record.get(key))
        if value and value not in tags:
            tags.append(value)
    return tags


def calculate_quality(record: dict[str, Any]) -> dict[str, Any]:
    missing = [field for field in PHASE1_REQUIRED_FIELDS if is_empty(get_path(record, field))]
    completeness = round((len(PHASE1_REQUIRED_FIELDS) - len(missing)) / len(PHASE1_REQUIRED_FIELDS), 4)
    return {
        "completeness_score": completeness,
        "missing_fields": missing,
        "review_status": "draft",
        "publish_ready": False,
        "phase1_completeness_pass": completeness >= 0.8,
    }


def normalize_record(row: dict[str, Any], row_number: int, source_file: str, sheet_name: str, version_year: str) -> dict[str, Any]:
    record: dict[str, Any] = {}

    for column in sorted(MAPPED_COLUMNS, key=column_number):
        apply_mapping(record, column, row.get(column))

    derive_latest_score(record)
    derive_adjustment(record)
    derive_ids(record, row_number, version_year)
    record["tags"] = build_tags(record)
    record["source"] = {
        "source_file": source_file,
        "source_sheet": sheet_name,
        "source_row": row_number,
        "batch_id": f"{version_year}-05-sample",
        "updated_at": str(date.today()),
    }
    record["quality"] = calculate_quality(record)
    return order_record(record)


def order_record(record: dict[str, Any]) -> dict[str, Any]:
    preferred_order = [
        "record_id",
        "school_id",
        "program_id",
        "track_id",
        "program_type",
        "province",
        "city",
        "study_mode",
        "duration",
        "tuition_min",
        "tuition_max",
        "junior_college_allowed",
        "school_code",
        "school_name",
        "school_label",
        "school_level",
        "school_level_display",
        "department_code",
        "department_name",
        "department_label",
        "department",
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
        "total_score",
        "english_score",
        "comprehensive_score",
        "latest_retest_count",
        "latest_admitted_count",
        "admission_rate",
        "class_location",
        "class_time",
        "adjustment",
        "retired_soldier_plan",
        "minority_backbone_plan",
        "notes",
        "retest_info_by_year",
        "first_choice_admission_by_year",
        "adjustment_admission_by_year",
        "tags",
        "source",
        "quality",
    ]
    ordered = {key: record[key] for key in preferred_order if key in record}
    for key, value in record.items():
        if key not in ordered:
            ordered[key] = value
    return ordered


def load_mapping(path: Path) -> dict[str, Any]:
    mapping = json.loads(path.read_text(encoding="utf-8"))
    if mapping.get("mapping_id") != "199exam_field_mapping_v1":
        raise ValueError(f"Unexpected mapping_id: {mapping.get('mapping_id')}")
    return mapping


def build_column_targets(mapping: dict[str, Any]) -> dict[str, str]:
    targets: dict[str, str] = {}
    for item in mapping["columns"]:
        target_path = item.get("target_path")
        if not target_path or ";" in target_path:
            continue
        targets[item["column"]] = target_path
    return targets


def extract_sample(mapping_path: Path, output_path: Path, limit: int, version_year: str) -> dict[str, Any]:
    global COLUMN_TARGETS, MAPPED_COLUMNS

    mapping = load_mapping(mapping_path)
    COLUMN_TARGETS = build_column_targets(mapping)
    MAPPED_COLUMNS = [item["column"] for item in mapping["columns"] if item.get("target_path")]

    source_file = mapping["source_file"]
    sheet_name = mapping["source_sheet"]
    start_row = int(mapping["source_data_start_row"])
    source_path = ROOT / source_file
    rows = read_sheet_rows(source_path, sheet_name)

    records: list[dict[str, Any]] = []
    row_number = start_row
    while row_number <= max(rows) and len(records) < limit:
        row = rows.get(row_number, {})
        if not is_empty(row.get("B")):
            records.append(normalize_record(row, row_number, source_file, sheet_name, version_year))
        row_number += 1

    dataset = {
        "metadata": {
            "dataset": "199exam_school_program_master_sample",
            "version": f"{version_year}-05-sample",
            "source_files": [source_file, str(mapping_path.relative_to(ROOT))],
            "record_grain": mapping["record_grain"],
            "source_data_start_row": start_row,
            "sample_limit": limit,
            "generated_at": str(date.today()),
            "record_count": len(records),
            "notes": "Sample output generated from 管综院校字段表.xlsx example rows. Not for frontend publishing.",
        },
        "records": records,
        "validation": {
            "all_records_keep_code_name_label": all(
                not is_empty(record.get("school_code"))
                and not is_empty(record.get("school_name"))
                and not is_empty(record.get("school_label"))
                and not is_empty(record.get("department_code"))
                and not is_empty(record.get("department_name"))
                and not is_empty(record.get("department_label"))
                and not is_empty(record.get("major_category_code"))
                and not is_empty(record.get("major_category_name"))
                and not is_empty(record.get("major_category_label"))
                and not is_empty(record.get("major_code"))
                and not is_empty(record.get("major_name"))
                and not is_empty(record.get("major_label"))
                for record in records
            ),
            "tuition_converted_to_yuan": all(
                is_empty(record.get("tuition_min")) or record.get("tuition_min", 0) >= 10000
                for record in records
            ),
            "records_passing_phase1_completeness": sum(
                1 for record in records if record["quality"]["phase1_completeness_pass"]
            ),
        },
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return dataset


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract five sample L1 records from 管综院校字段表.xlsx.")
    parser.add_argument("--mapping", type=Path, default=DEFAULT_MAPPING)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--version-year", default="2026")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    dataset = extract_sample(args.mapping, args.output, args.limit, args.version_year)
    print(
        json.dumps(
            {
                "ok": True,
                "output": str(args.output.relative_to(ROOT)),
                "record_count": dataset["metadata"]["record_count"],
                "validation": dataset["validation"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


COLUMN_TARGETS: dict[str, str] = {}
MAPPED_COLUMNS: list[str] = []


if __name__ == "__main__":
    main()
