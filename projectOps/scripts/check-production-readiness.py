#!/usr/bin/env python3
"""Check P0 production readiness items that can be verified locally."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[2]
REPORT_PATH = ROOT / "projectOps" / "reports" / "latest-production-readiness-report.json"
CONFIG_PATH = ROOT / "projectOps" / "config" / "production-readiness.json"
ENV_PRODUCTION_PATH = ROOT / "miniapp" / ".env.production"
MANIFEST_PATH = ROOT / "miniapp" / "src" / "manifest.json"
MP_WEIXIN_BUILD_DIR = ROOT / "miniapp" / "dist" / "build" / "mp-weixin"


def read_env_value(path: Path, key: str) -> str:
    if not path.exists():
        return ""
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        if name.strip() == key:
            return value.strip()
    return ""


def strip_jsonc_comments(text: str) -> str:
    result: list[str] = []
    in_string = False
    escape = False
    i = 0
    while i < len(text):
        ch = text[i]
        nxt = text[i + 1] if i + 1 < len(text) else ""
        if in_string:
            result.append(ch)
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            i += 1
            continue
        if ch == '"':
            in_string = True
            result.append(ch)
            i += 1
            continue
        if ch == "/" and nxt == "/":
            i += 2
            while i < len(text) and text[i] not in "\r\n":
                i += 1
            continue
        if ch == "/" and nxt == "*":
            i += 2
            while i + 1 < len(text) and not (text[i] == "*" and text[i + 1] == "/"):
                i += 1
            i += 2
            continue
        result.append(ch)
        i += 1
    return "".join(result)


def add_check(checks: list[dict], key: str, ok: bool, message: str, level: str = "error") -> None:
    checks.append({
        "key": key,
        "ok": ok,
        "level": "ok" if ok else level,
        "message": message
    })


def main() -> int:
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    checks: list[dict] = []
    api_base_url = read_env_value(ENV_PRODUCTION_PATH, "VITE_API_BASE_URL")
    parsed = urlparse(api_base_url)

    add_check(
        checks,
        "api_base_url_present",
        bool(api_base_url),
        f"miniapp/.env.production VITE_API_BASE_URL={api_base_url or '未配置'}"
    )
    add_check(
        checks,
        "api_base_url_https",
        parsed.scheme == "https",
        "生产 API 必须使用 HTTPS"
    )
    add_check(
        checks,
        "api_base_url_no_localhost",
        parsed.hostname not in {"127.0.0.1", "localhost", "::1", None},
        "生产 API 不能使用本地地址"
    )
    add_check(
        checks,
        "api_base_url_expected",
        api_base_url == config["expected_api_base_url"],
        f"建议生产 API 固定为 {config['expected_api_base_url']}",
        level="warning"
    )

    manifest = json.loads(strip_jsonc_comments(MANIFEST_PATH.read_text(encoding="utf-8")))
    mp_weixin = manifest.get("mp-weixin", {})
    appid = str(mp_weixin.get("appid", "")).strip()
    url_check = bool(mp_weixin.get("setting", {}).get("urlCheck"))

    add_check(
        checks,
        "mp_weixin_appid_present",
        bool(appid),
        "miniapp/src/manifest.json 需要填写微信小程序 AppID"
    )
    add_check(
        checks,
        "mp_weixin_url_check_enabled",
        url_check,
        "真机提测前建议开启微信 URL 合法域名校验，并在微信后台配置 request 合法域名"
    )
    add_check(
        checks,
        "mp_weixin_build_exists",
        MP_WEIXIN_BUILD_DIR.exists(),
        "微信小程序构建目录 miniapp/dist/build/mp-weixin 存在"
    )

    errors = [item for item in checks if not item["ok"] and item["level"] == "error"]
    warnings = [item for item in checks if not item["ok"] and item["level"] == "warning"]
    report = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "ok": not errors,
        "checks": checks,
        "errors": errors,
        "warnings": warnings,
        "manual_checks": config["manual_checks"]
    }
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "ok": report["ok"],
        "report": str(REPORT_PATH.relative_to(ROOT)),
        "error_count": len(errors),
        "warning_count": len(warnings)
    }, ensure_ascii=False, indent=2))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
