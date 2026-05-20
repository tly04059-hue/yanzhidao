#!/usr/bin/env python3
"""Run the minimum data update pipeline."""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "projectOps/config/data-pipeline.json"
REPORT = ROOT / "projectOps/reports/latest-update-report.json"


def run_step(step: dict[str, Any]) -> dict[str, Any]:
    started_at = datetime.now().isoformat(timespec="seconds")
    command = step["command"]
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    outputs = []
    for output in step.get("outputs", []):
        path = ROOT / output
        outputs.append(
            {
                "path": output,
                "exists": path.exists(),
                "size": path.stat().st_size if path.exists() else 0,
            }
        )
    return {
        "id": step["id"],
        "name": step["name"],
        "command": command,
        "started_at": started_at,
        "finished_at": datetime.now().isoformat(timespec="seconds"),
        "returncode": result.returncode,
        "stdout_tail": result.stdout[-4000:],
        "stderr_tail": result.stderr[-4000:],
        "outputs": outputs,
    }


def main() -> None:
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    executable_steps = [step for step in config["steps"] if step["id"] != "sync_miniapp_data"]
    report = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "pipeline_version": config["version"],
        "steps": [],
    }
    failed = False
    for step in executable_steps:
        step_report = run_step(step)
        report["steps"].append(step_report)
        if step_report["returncode"] != 0 or not all(item["exists"] for item in step_report["outputs"]):
            failed = True
            break
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"ok": not failed, "report": str(REPORT.relative_to(ROOT))}, ensure_ascii=False, indent=2))
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
