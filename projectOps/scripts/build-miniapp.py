#!/usr/bin/env python3
"""Run miniapp type-check and build through one controlled entrypoint."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MINIAPP = ROOT / "miniapp"
REPORT = ROOT / "projectOps/reports/latest-build-report.json"

BUILD_COMMANDS = {
    "h5": ["npm", "run", "build:h5"],
    "mp-weixin": ["npm", "run", "build:mp-weixin"],
}


def run(command: list[str]) -> dict[str, object]:
    result = subprocess.run(command, cwd=MINIAPP, text=True, capture_output=True)
    return {
        "command": command,
        "returncode": result.returncode,
        "stdout_tail": result.stdout[-4000:],
        "stderr_tail": result.stderr[-4000:],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build miniapp.")
    parser.add_argument("--target", choices=["h5", "mp-weixin", "all"], default="h5")
    parser.add_argument("--skip-type-check", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    commands = []
    if not args.skip_type_check:
        commands.append(["npm", "run", "type-check"])
    if args.target == "all":
        commands.extend([BUILD_COMMANDS["h5"], BUILD_COMMANDS["mp-weixin"]])
    else:
        commands.append(BUILD_COMMANDS[args.target])

    results = [run(command) for command in commands]
    ok = all(result["returncode"] == 0 for result in results)
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
