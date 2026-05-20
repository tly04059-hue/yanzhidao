#!/usr/bin/env python3
"""Run the minimum update -> sync -> check -> build pipeline."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / "projectOps/reports/latest-release-report.json"


def run(command: list[str]) -> dict[str, object]:
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    return {
        "command": command,
        "returncode": result.returncode,
        "stdout_tail": result.stdout[-3000:],
        "stderr_tail": result.stderr[-3000:],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run release pipeline.")
    parser.add_argument("--target", choices=["h5", "mp-weixin", "all"], default="h5")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    commands = [
        ["python3", "projectOps/scripts/update-all.py"],
        ["python3", "projectOps/scripts/sync-miniapp-data.py"],
        ["python3", "projectOps/scripts/check-all.py"],
        ["python3", "projectOps/scripts/build-miniapp.py", "--target", args.target],
    ]
    results = []
    ok = True
    for command in commands:
        result = run(command)
        results.append(result)
        if result["returncode"] != 0:
            ok = False
            break
    report = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "target": args.target,
        "ok": ok,
        "results": results,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"ok": ok, "report": str(REPORT.relative_to(ROOT)), "target": args.target}, ensure_ascii=False, indent=2))
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
