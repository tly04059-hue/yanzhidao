#!/usr/bin/env python3
"""Generate school name -> province/school code lookup table for 199-exam data."""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True

from extract_199exam_sample import clean_string, is_empty, read_sheet_rows


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT / "schoolData/sourceData/199exam/全量院校表_研招网主表补全.xlsx"
DEFAULT_AIA_BASIC = ROOT / "AIAgent/data/schools_basic_info.json"
DEFAULT_JSON = ROOT / "schoolData/standardized/199exam/199exam_school_identity_lookup.json"
DEFAULT_CSV = ROOT / "schoolData/standardized/199exam/199exam_school_identity_lookup.csv"
DEFAULT_MD = ROOT / "project_docs/10-管综学校省份与学校代码补齐对照表.md"


CITY_TO_PROVINCE = {
    "北京": "北京",
    "北京城区": "北京",
    "上海": "上海",
    "上海辖区": "上海",
    "天津": "天津",
    "重庆": "重庆",
    "重庆城区": "重庆",
    "成都": "四川",
    "绵阳": "四川",
    "德阳": "四川",
    "南充": "四川",
    "泸州": "四川",
    "雅安": "四川",
    "凉山彝族自治州": "四川",
    "昆明": "云南",
    "贵阳": "贵州",
    "遵义": "贵州",
    "兰州": "甘肃",
    "西安": "陕西",
    "咸阳": "陕西",
    "延安": "陕西",
    "汉中": "陕西",
    "乌鲁木齐": "新疆",
    "石河子": "新疆",
    "克拉玛依": "新疆",
    "拉萨": "西藏",
    "西宁": "青海",
    "银川": "宁夏",
    "呼和浩特": "内蒙古",
    "通辽": "内蒙古",
    "太原": "山西",
    "石家庄": "河北",
    "保定": "河北",
    "秦皇岛": "河北",
    "唐山": "河北",
    "邯郸": "河北",
    "郑州": "河南",
    "开封": "河南",
    "洛阳": "河南",
    "新乡": "河南",
    "焦作": "河南",
    "信阳": "河南",
    "河南信阳": "河南",
    "武汉": "湖北",
    "宜昌": "湖北",
    "荆州": "湖北",
    "十堰": "湖北",
    "黄石": "湖北",
    "长沙": "湖南",
    "湘潭": "湖南",
    "衡阳": "湖南",
    "株洲": "湖南",
    "张家界": "湖南",
    "湘西": "湖南",
    "广州": "广东",
    "深圳": "广东",
    "珠海": "广东",
    "汕头": "广东",
    "湛江": "广东",
    "佛山": "广东",
    "东莞": "广东",
    "南宁": "广西",
    "桂林": "广西",
    "百色": "广西",
    "海口": "海南",
    "海南省海口市": "海南",
    "南京": "江苏",
    "江苏省南京市": "江苏",
    "苏州": "江苏",
    "无锡": "江苏",
    "常州": "江苏",
    "徐州": "江苏",
    "扬州": "江苏",
    "南通": "江苏",
    "镇江": "江苏",
    "连云港": "江苏",
    "杭州": "浙江",
    "浙江杭州": "浙江",
    "宁波": "浙江",
    "温州": "浙江",
    "金华": "浙江",
    "绍兴": "浙江",
    "舟山": "浙江",
    "海宁": "浙江",
    "合肥": "安徽",
    "芜湖": "安徽",
    "蚌埠": "安徽",
    "淮南": "安徽",
    "淮北": "安徽",
    "马鞍山": "安徽",
    "福州": "福建",
    "厦门": "福建",
    "泉州": "福建",
    "南昌": "江西",
    "赣州": "江西",
    "济南": "山东",
    "青岛": "山东",
    "山东省青岛市": "山东",
    "烟台": "山东",
    "潍坊": "山东",
    "淄博": "山东",
    "泰安": "山东",
    "曲阜": "山东",
    "聊城": "山东",
    "滨州": "山东",
    "哈尔滨": "黑龙江",
    "黑龙江省哈尔滨市": "黑龙江",
    "大庆": "黑龙江",
    "长春": "吉林",
    "吉林": "吉林",
    "延边朝鲜族自治州": "吉林",
    "沈阳": "辽宁",
    "大连": "辽宁",
    "抚顺": "辽宁",
    "阜新": "辽宁",
    "葫芦岛": "辽宁",
    "鞍山": "辽宁",
}


def load_json_list(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else []


def header_map(rows: dict[int, dict[str, Any]]) -> dict[str, str]:
    return {clean_string(value): column for column, value in rows[1].items() if clean_string(value)}


def value(row: dict[str, Any], headers: dict[str, str], name: str) -> str:
    column = headers.get(name)
    return clean_string(row.get(column)) if column else ""


def split_city_tokens(city_text: str) -> list[str]:
    parts = re.split(r"[,，、/；;]+", clean_string(city_text))
    return [part.strip() for part in parts if part.strip()]


def province_from_city(city_text: str) -> tuple[str, str]:
    tokens = split_city_tokens(city_text)
    if not tokens:
        return "", ""
    provinces = []
    unknown = []
    for token in tokens:
        province = CITY_TO_PROVINCE.get(token)
        if province:
            provinces.append(province)
        else:
            unknown.append(token)
    unique = sorted(set(provinces))
    if len(unique) == 1 and not unknown:
        return unique[0], "city_mapping"
    if len(unique) == 1 and unknown:
        return unique[0], f"city_mapping_with_unknown_tokens:{'|'.join(unknown)}"
    return "", "multi_province_city_needs_review" if unique else "city_unknown"


def add_source(target: dict[str, set[str]], key: str, value_text: str) -> None:
    if value_text:
        target[key].add(value_text)


def build_lookup(source_path: Path, aia_basic_path: Path) -> dict[str, Any]:
    rows = read_sheet_rows(source_path, "全量院校表")
    headers = header_map(rows)

    known_by_school: dict[str, dict[str, set[str]]] = defaultdict(lambda: defaultdict(set))
    school_rows: dict[str, dict[str, Any]] = {}

    aia_regions = {
        clean_string(item.get("name")): clean_string(item.get("region"))
        for item in load_json_list(aia_basic_path)
        if clean_string(item.get("name")) and clean_string(item.get("region"))
    }

    for row_number, row in rows.items():
        if row_number == 1:
            continue
        school_name = value(row, headers, "学校名称") or value(row, headers, "学校")
        if not school_name:
            continue

        info = school_rows.setdefault(
            school_name,
            {
                "school_name": school_name,
                "row_count": 0,
                "programs": set(),
                "cities": set(),
                "current_provinces": set(),
                "current_school_codes": set(),
                "source_rows": [],
            },
        )
        info["row_count"] += 1
        info["source_rows"].append(row_number)
        add_source(info, "programs", value(row, headers, "项目") or value(row, headers, "请求专业类型"))
        add_source(info, "cities", value(row, headers, "城市"))
        add_source(info, "current_provinces", value(row, headers, "地区"))
        add_source(info, "current_school_codes", value(row, headers, "学校代码"))

        province = value(row, headers, "地区")
        school_code = value(row, headers, "学校代码")
        if province:
            known_by_school[school_name]["province"].add(province)
        if school_code:
            known_by_school[school_name]["school_code"].add(school_code)

    records = []
    for school_name, info in sorted(school_rows.items()):
        current_provinces = sorted(info["current_provinces"])
        current_codes = sorted(info["current_school_codes"])
        cities = sorted(info["cities"])

        province = ""
        province_source = ""
        review_notes = []

        if len(current_provinces) == 1:
            province = current_provinces[0]
            province_source = "source_region"
        elif school_name in aia_regions:
            province = aia_regions[school_name]
            province_source = "AIAgent/schools_basic_info"
        else:
            city_candidates = []
            city_sources = []
            for city in cities:
                city_province, source = province_from_city(city)
                if city_province:
                    city_candidates.append(city_province)
                if source:
                    city_sources.append(f"{city}:{source}")
            unique_city_provinces = sorted(set(city_candidates))
            if len(unique_city_provinces) == 1:
                province = unique_city_provinces[0]
                province_source = "city_mapping"
            elif len(unique_city_provinces) > 1:
                review_notes.append(f"城市跨省或多校区: {'; '.join(city_sources)}")

        school_code = current_codes[0] if len(current_codes) == 1 else ""
        school_code_source = "source_school_code" if school_code else ""
        if len(current_codes) > 1:
            review_notes.append(f"同校出现多个学校代码: {','.join(current_codes)}")

        if not province:
            review_notes.append("province 待人工确认")
        if not school_code:
            review_notes.append("school_code 待人工补齐")

        status = "auto_ready" if province and school_code else "needs_review"
        confidence = "high" if province_source in {"source_region", "AIAgent/schools_basic_info"} and school_code else "medium" if province else "low"

        records.append(
            {
                "school_name": school_name,
                "province": province,
                "province_source": province_source,
                "school_code": school_code,
                "school_code_source": school_code_source,
                "status": status,
                "confidence": confidence,
                "row_count": info["row_count"],
                "programs": sorted(info["programs"]),
                "cities": cities,
                "current_provinces": current_provinces,
                "current_school_codes": current_codes,
                "source_rows_sample": info["source_rows"][:10],
                "review_notes": "；".join(review_notes),
            }
        )

    return {
        "metadata": {
            "generated_at": str(date.today()),
            "source_file": str(source_path.relative_to(ROOT)),
            "source_sheet": "全量院校表",
            "source_rows": sum(item["row_count"] for item in records),
            "school_count": len(records),
            "auto_ready_count": sum(1 for item in records if item["status"] == "auto_ready"),
            "needs_review_count": sum(1 for item in records if item["status"] == "needs_review"),
            "note": "学校代码不会硬猜；无稳定来源时保持为空并标记 needs_review。",
        },
        "records": records,
    }


def write_csv(payload: dict[str, Any], path: Path) -> None:
    columns = [
        "school_name",
        "province",
        "province_source",
        "school_code",
        "school_code_source",
        "status",
        "confidence",
        "row_count",
        "programs",
        "cities",
        "current_provinces",
        "current_school_codes",
        "source_rows_sample",
        "review_notes",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        for record in payload["records"]:
            row = {key: record.get(key, "") for key in columns}
            for key in ["programs", "cities", "current_provinces", "current_school_codes", "source_rows_sample"]:
                row[key] = "、".join(str(item) for item in record.get(key, []))
            writer.writerow(row)


def write_markdown(payload: dict[str, Any], path: Path) -> None:
    meta = payload["metadata"]
    needs_review = [item for item in payload["records"] if item["status"] == "needs_review"]
    top_missing_code = [item for item in needs_review if not item["school_code"]][:30]
    lines = [
        "# 管综学校省份与学校代码补齐对照表",
        "",
        f"> 更新时间：{meta['generated_at']}  ",
        f"> 来源：`{meta['source_file']}` / `{meta['source_sheet']}`  ",
        "> 目的：为 P0 字段 `province` 和 `school_code` 准备可追溯的学校级补齐对照表。",
        "",
        "## 1. 汇总",
        "",
        "| 指标 | 数量 |",
        "| --- | ---: |",
        f"| 源数据行数 | {meta['source_rows']} |",
        f"| 学校名称数 | {meta['school_count']} |",
        f"| 自动就绪学校数 | {meta['auto_ready_count']} |",
        f"| 仍需人工复核学校数 | {meta['needs_review_count']} |",
        "",
        "## 2. 重要规则",
        "",
        "1. `school_code` 不硬猜；没有稳定来源时留空并标记 `needs_review`。",
        "2. `province` 优先使用源表已有地区，其次使用 AIAgent 基础数据，再使用城市映射。",
        "3. 多城市跨省或来源冲突时标记人工复核。",
        "4. 同一学校补齐后，应回填到该学校所有 MPA/MBA 记录。",
        "",
        "## 3. 前 30 个需要补学校代码的学校",
        "",
        "| 学校名称 | 推断省份 | 城市 | 项目 | 行数 | 备注 |",
        "| --- | --- | --- | --- | ---: | --- |",
    ]
    for item in top_missing_code:
        lines.append(
            f"| {item['school_name']} | {item['province'] or '待确认'} | {'、'.join(item['cities'])} | {'、'.join(item['programs'])} | {item['row_count']} | {item['review_notes']} |"
        )
    lines.extend(
        [
            "",
            "## 4. 输出文件",
            "",
            "- `schoolData/standardized/199exam/199exam_school_identity_lookup.csv`",
            "- `schoolData/standardized/199exam/199exam_school_identity_lookup.json`",
        ]
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate school identity lookup table for 199-exam data.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--aia-basic", type=Path, default=DEFAULT_AIA_BASIC)
    parser.add_argument("--json-output", type=Path, default=DEFAULT_JSON)
    parser.add_argument("--csv-output", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--md-output", type=Path, default=DEFAULT_MD)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    payload = build_lookup(args.source, args.aia_basic)
    args.json_output.parent.mkdir(parents=True, exist_ok=True)
    args.json_output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_csv(payload, args.csv_output)
    write_markdown(payload, args.md_output)
    print(
        json.dumps(
            {
                "ok": True,
                "json_output": str(args.json_output.relative_to(ROOT)),
                "csv_output": str(args.csv_output.relative_to(ROOT)),
                "md_output": str(args.md_output.relative_to(ROOT)),
                "metadata": payload["metadata"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
