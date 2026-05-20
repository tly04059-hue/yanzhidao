#!/usr/bin/env python3
"""Sync L2 publish data into miniapp runtime data files."""

from __future__ import annotations

import filecmp
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / "projectOps/reports/latest-sync-report.json"

SYNC_PAIRS = [
    (
        ROOT / "schoolData/publish/199exam_miniapp_school_publish_sc_cq.json",
        ROOT / "miniapp/src/data/199exam-miniapp-school-publish-sc-cq.json",
    ),
    (
        ROOT / "schoolData/publish/party_school_miniapp_publish.json",
        ROOT / "miniapp/src/data/party-school-miniapp-publish.json",
    ),
    (
        ROOT / "studentCases/publish/student_cases_miniapp_publish.json",
        ROOT / "miniapp/src/data/student-cases-publish.json",
    ),
    (
        ROOT / "courseRecommendationStrategy/publish/recommendation_strategies_miniapp_publish.json",
        ROOT / "miniapp/src/data/recommendation-strategies-publish.json",
    ),
]


def main() -> None:
    items = []
    failed = False
    for src, dest in SYNC_PAIRS:
        if not src.exists():
            failed = True
            items.append({"source": str(src.relative_to(ROOT)), "dest": str(dest.relative_to(ROOT)), "ok": False, "reason": "source_missing"})
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        changed = not dest.exists() or not filecmp.cmp(src, dest, shallow=False)
        if changed:
            shutil.copyfile(src, dest)
        items.append(
            {
                "source": str(src.relative_to(ROOT)),
                "dest": str(dest.relative_to(ROOT)),
                "ok": True,
                "changed": changed,
                "bytes": dest.stat().st_size,
            }
        )
    report = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "items": items,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"ok": not failed, "report": str(REPORT.relative_to(ROOT)), "items": items}, ensure_ascii=False, indent=2))
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
