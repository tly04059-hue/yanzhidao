#!/usr/bin/env python3
"""Inspect student case Excel source files without third-party dependencies."""

from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[2]
SOURCE_FILES = [
    ROOT / "studentCases/sourceData/党校已上岸学员案例信息汇总表.xlsx",
    ROOT / "studentCases/sourceData/管综已上岸学员案例信息汇总表.xlsx",
]
OUTPUT = ROOT / "studentCases/student_case_source_inspection.json"

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkgrel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def cell_ref_to_col(ref: str) -> int:
    letters = re.sub(r"[^A-Z]", "", ref.upper())
    col = 0
    for char in letters:
        col = col * 26 + (ord(char) - ord("A") + 1)
    return max(col - 1, 0)


def read_xml(zf: zipfile.ZipFile, name: str) -> ET.Element:
    return ET.fromstring(zf.read(name))


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = read_xml(zf, "xl/sharedStrings.xml")
    strings = []
    for si in root.findall("main:si", NS):
        parts = [node.text or "" for node in si.findall(".//main:t", NS)]
        strings.append("".join(parts))
    return strings


def read_sheet_map(zf: zipfile.ZipFile) -> dict[str, str]:
    workbook = read_xml(zf, "xl/workbook.xml")
    rels = read_xml(zf, "xl/_rels/workbook.xml.rels")
    rel_map = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels.findall("pkgrel:Relationship", NS)
    }
    result = {}
    for sheet in workbook.findall(".//main:sheet", NS):
        name = sheet.attrib.get("name", "")
        rel_id = sheet.attrib.get(f"{{{NS['rel']}}}id", "")
        target = rel_map.get(rel_id, "")
        if target:
            result[name] = "xl/" + target.lstrip("/")
    return result


def read_cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    value_node = cell.find("main:v", NS)
    inline_node = cell.find("main:is/main:t", NS)
    if cell_type == "inlineStr":
        return (inline_node.text or "").strip() if inline_node is not None else ""
    if value_node is None:
        return ""
    raw = value_node.text or ""
    if cell_type == "s":
        try:
            return shared_strings[int(raw)].strip()
        except (ValueError, IndexError):
            return raw.strip()
    return raw.strip()


def read_sheet_rows(zf: zipfile.ZipFile, sheet_path: str, shared_strings: list[str]) -> list[list[str]]:
    root = read_xml(zf, sheet_path)
    rows: list[list[str]] = []
    for row in root.findall(".//main:sheetData/main:row", NS):
        values: dict[int, str] = {}
        max_col = 0
        for cell in row.findall("main:c", NS):
            col = cell_ref_to_col(cell.attrib.get("r", "A1"))
            values[col] = read_cell_value(cell, shared_strings)
            max_col = max(max_col, col)
        rows.append([values.get(index, "") for index in range(max_col + 1)])
    return rows


def normalize_rows(rows: list[list[str]]) -> tuple[list[str], list[dict[str, str]]]:
    non_empty_rows = [row for row in rows if any(value.strip() for value in row)]
    if not non_empty_rows:
        return [], []
    header = [value.strip() or f"未命名字段{index + 1}" for index, value in enumerate(non_empty_rows[0])]
    records = []
    for row in non_empty_rows[1:]:
        padded = row + [""] * (len(header) - len(row))
        record = {header[index]: padded[index].strip() for index in range(len(header))}
        if any(record.values()):
            records.append(record)
    return header, records


def completeness(records: list[dict[str, str]], headers: list[str]) -> dict[str, dict[str, Any]]:
    result = {}
    total = len(records)
    for header in headers:
        filled = sum(1 for record in records if record.get(header, "").strip())
        result[header] = {
            "filled": filled,
            "total": total,
            "rate": round(filled / total, 4) if total else 0,
        }
    return result


def inspect_file(path: Path) -> dict[str, Any]:
    with zipfile.ZipFile(path) as zf:
        shared_strings = read_shared_strings(zf)
        sheet_map = read_sheet_map(zf)
        sheets = []
        for sheet_name, sheet_path in sheet_map.items():
            rows = read_sheet_rows(zf, sheet_path, shared_strings)
            headers, records = normalize_rows(rows)
            sheets.append(
                {
                    "sheet_name": sheet_name,
                    "headers": headers,
                    "row_count": len(records),
                    "sample_rows": records[:3],
                    "completeness": completeness(records, headers),
                }
            )
        return {
            "source_file": str(path.relative_to(ROOT)),
            "sheet_count": len(sheets),
            "sheets": sheets,
        }


def main() -> None:
    payload = {
        "generated_at": "2026-05-15",
        "sources": [inspect_file(path) for path in SOURCE_FILES],
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
