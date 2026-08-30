#!/usr/bin/env python3
"""Keep live Jira Automation Guard metrics uncontaminated by local/E2E tests."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ACTION = 'jira-automation-guard-live-v1'


def patch_app(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    text = text.replace("const COUNTER_ACTION = 'jira-automation-guard';", f"const COUNTER_ACTION = '{ACTION}';")
    marker = "function track(key, { once = false } = {}) {\n"
    guard = "function track(key, { once = false } = {}) {\n  if (['localhost', '127.0.0.1', '::1'].includes(location.hostname) || new URLSearchParams(location.search).has('no-track')) return;\n"
    if guard not in text:
        assert marker in text
        text = text.replace(marker, guard, 1)
    path.write_text(text, encoding='utf-8')


def patch_stats(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    text = text.replace("action='jira-automation-guard'", f"action='{ACTION}'")
    path.write_text(text, encoding='utf-8')


def main() -> int:
    patch_app(ROOT / 'product/jira-automation-guard/app.js')
    patch_stats(ROOT / 'product/jira-automation-guard/stats.html')
    # Root copies may already exist; keep them aligned immediately.
    if (ROOT / 'app.js').exists():
        patch_app(ROOT / 'app.js')
    if (ROOT / 'stats.html').exists():
        patch_stats(ROOT / 'stats.html')
    print({'counter_action': ACTION, 'local_tracking': 'disabled'})
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
