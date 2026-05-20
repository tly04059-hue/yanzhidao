#!/usr/bin/env python3
"""Inspect party-school V2 xlsx files without third-party dependencies."""

from __future__ import annotations

import json
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkgrel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def col_to_index(cell_ref: str) -> int:
    letters = "".join(ch for ch in cell_ref if ch.isalpha())
    value = 0
    for ch in letters:
        value = value * 26 + (ord(ch.upper()) - ord("A") + 1)
    return value - 1


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    try:
        data = zf.read("xl/sharedStrings.xml")
    except KeyError:
        return []
    root = ET.fromstring(data)
    strings: list[str] = []
    for si in root.findall("main:si", NS):
        parts = []
        for t in si.findall(".//main:t", NS):
            parts.append(t.text or "")
        strings.append("".join(parts))
    return strings


def workbook_sheets(zf: zipfile.ZipFile) -> list[tuple[str, str]]:
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_map = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels.findall("pkgrel:Relationship", NS)
    }
    sheets = []
    for sheet in workbook.findall(".//main:sheet", NS):
        name = sheet.attrib.get("name", "")
        rid = sheet.attrib.get(f"{{{NS['rel']}}}id", "")
        target = rel_map.get(rid, "")
        path = "xl/" + target.lstrip("/")
        sheets.append((name, path))
    return sheets


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return "".join(t.text or "" for t in cell.findall(".//main:t", NS)).strip()

    value_node = cell.find("main:v", NS)
    if value_node is None or value_node.text is None:
        return ""

    raw = value_node.text.strip()
    if cell_type == "s":
        try:
            return shared_strings[int(raw)].strip()
        except (ValueError, IndexError):
            return raw
    return raw


def read_sheet(zf: zipfile.ZipFile, path: str, shared_strings: list[str]) -> list[list[str]]:
    root = ET.fromstring(zf.read(path))
    rows: list[list[str]] = []
    for row in root.findall(".//main:sheetData/main:row", NS):
        values: list[str] = []
        for cell in row.findall("main:c", NS):
            ref = cell.attrib.get("r", "")
            idx = col_to_index(ref)
            while len(values) < idx:
                values.append("")
            values.append(cell_value(cell, shared_strings))
        while values and values[-1] == "":
            values.pop()
        rows.append(values)
    return rows


def inspect_file(path: Path) -> dict:
    with zipfile.ZipFile(path) as zf:
        shared_strings = read_shared_strings(zf)
        sheets = []
        for name, sheet_path in workbook_sheets(zf):
            rows = read_sheet(zf, sheet_path, shared_strings)
            non_empty_rows = [row for row in rows if any(cell for cell in row)]
            max_cols = max((len(row) for row in non_empty_rows), default=0)
            sheets.append(
                {
                    "name": name,
                    "row_count": len(non_empty_rows),
                    "max_cols": max_cols,
                    "preview_rows": non_empty_rows[:12],
                }
            )
    return {
        "file": str(path),
        "sheets": sheets,
    }


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: inspect_party_v2_xlsx.py <xlsx> [<xlsx> ...]")
    result = [inspect_file(Path(arg)) for arg in sys.argv[1:]]
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
