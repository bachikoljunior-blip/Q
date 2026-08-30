#!/usr/bin/env python3
"""Publish the approved Jira Automation Guard free MVP to GitHub Pages root.

The script is deterministic and also updates repository workflows so future
research refreshes cannot silently revoke or bypass an approved build.
"""
from __future__ import annotations

import json
import shutil
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRODUCT = ROOT / 'product' / 'jira-automation-guard'
ACTIVE = ROOT / 'research' / 'ACTIVE_CANDIDATE.json'
EXPECTED = 'jira-automation-rule-guard'


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(textwrap.dedent(content).lstrip(), encoding='utf-8')


def validate_approval() -> dict:
    active = json.loads(ACTIVE.read_text(encoding='utf-8'))
    assert active['status'] == 'BUILD_APPROVED'
    assert active['build_approved'] is True
    assert active['candidate_id'] == EXPECTED
    assert active.get('approval_scope') == 'FREE_MVP_ONLY'
    approved = active.get('approved_build') or {}
    assert approved.get('path') == 'product/jira-automation-guard'
    assert 'payment' in approved.get('forbidden', [])
    return active


def publish_public_files() -> None:
    required = [
        'index.html', 'styles.css', 'core.js', 'app.js', 'privacy.html', 'stats.html',
        'sample-before.json', 'sample-after.json', 'README.md',
    ]
    for name in required:
        assert (PRODUCT / name).is_file(), f'missing product file: {name}'

    index = (PRODUCT / 'index.html').read_text(encoding='utf-8')
    index = index.replace(
        '<meta property="og:type" content="website">',
        '<meta property="og:type" content="website">\n'
        '  <meta property="og:url" content="https://bachikoljunior-blip.github.io/Q/">\n'
        '  <meta property="og:image" content="https://bachikoljunior-blip.github.io/Q/og.svg">',
    )
    index = index.replace(
        '<title>Jira Automation Guard — export JSONのlint・差分・移行preflight</title>',
        '<title>Jira Automation Guard — export JSONのlint・差分・移行preflight</title>\n'
        '  <link rel="canonical" href="https://bachikoljunior-blip.github.io/Q/">\n'
        '  <link rel="icon" href="icon.svg" type="image/svg+xml">\n'
        '  <link rel="manifest" href="manifest.webmanifest">',
    )
    index = index.replace(
        '<a class="ghost small" href="privacy.html">プライバシー</a>',
        '<a class="ghost small" href="stats.html">検証数字</a>\n'
        '      <a class="ghost small" href="privacy.html">プライバシー</a>',
    )
    (ROOT / 'index.html').write_text(index, encoding='utf-8')

    for name in ['styles.css', 'core.js', 'app.js', 'privacy.html', 'stats.html', 'sample-before.json', 'sample-after.json']:
        shutil.copyfile(PRODUCT / name, ROOT / name)

    manifest = {
        'name': 'Jira Automation Guard',
        'short_name': 'Automation Guard',
        'description': 'Jira Automation export JSONのlint・差分・移行preflight',
        'start_url': './',
        'scope': './',
        'display': 'standalone',
        'background_color': '#07111f',
        'theme_color': '#07111f',
        'icons': [{'src': 'icon.svg', 'sizes': 'any', 'type': 'image/svg+xml'}],
    }
    (ROOT / 'manifest.webmanifest').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    write('icon.svg', '''
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#62d8c5"/><stop offset="1" stop-color="#86e8d2"/></linearGradient></defs>
          <rect width="512" height="512" rx="112" fill="#07111f"/>
          <path d="M128 128h256v256H128z" fill="none" stroke="url(#g)" stroke-width="28" rx="42"/>
          <path d="M178 194h156M178 256h112M178 318h156" stroke="url(#g)" stroke-width="24" stroke-linecap="round"/>
          <circle cx="350" cy="256" r="22" fill="url(#g)"/>
        </svg>
    ''')
    write('og.svg', '''
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#07111f"/><stop offset="1" stop-color="#132b45"/></linearGradient>
            <linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#62d8c5"/><stop offset="1" stop-color="#8cebd6"/></linearGradient>
          </defs>
          <rect width="1200" height="630" rx="32" fill="url(#bg)"/>
          <circle cx="1080" cy="90" r="240" fill="#263f6c" opacity=".22"/>
          <circle cx="120" cy="580" r="300" fill="#1d7d7d" opacity=".16"/>
          <rect x="72" y="78" width="74" height="74" rx="20" fill="url(#a)"/>
          <text x="109" y="125" text-anchor="middle" font-size="28" font-weight="800" fill="#062019" font-family="Arial, sans-serif">JG</text>
          <text x="72" y="232" font-size="65" font-weight="800" fill="#eff6ff" font-family="Arial, sans-serif">Jira Automation Guard</text>
          <text x="72" y="318" font-size="40" font-weight="700" fill="#62d8c5" font-family="Arial, sans-serif">export JSONを、移行前に読める状態へ。</text>
          <text x="72" y="398" font-size="27" fill="#b3c6da" font-family="Arial, sans-serif">rule lint · normalized diff · hard-coded reference inventory · Markdown docs</text>
          <rect x="72" y="462" width="620" height="68" rx="34" fill="#10283d" stroke="#31516d"/>
          <text x="102" y="506" font-size="23" fill="#d8e9f7" font-family="Arial, sans-serif">Jira接続不要 · ブラウザ内処理 · 無料MVP</text>
        </svg>
    ''')

    write('robots.txt', '''
        User-agent: *
        Allow: /
        Sitemap: https://bachikoljunior-blip.github.io/Q/sitemap.xml
    ''')
    write('sitemap.xml', '''
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://bachikoljunior-blip.github.io/Q/</loc><lastmod>2026-08-30</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
          <url><loc>https://bachikoljunior-blip.github.io/Q/privacy.html</loc><lastmod>2026-08-30</lastmod><changefreq>yearly</changefreq><priority>0.2</priority></url>
        </urlset>
    ''')


SAFE_SYNC_GUARD = """    if current.get('build_approved') is True:\n        print(json.dumps({'status': current.get('status'), 'candidate_id': current.get('candidate_id'), 'action': 'approved candidate preserved'}, ensure_ascii=False))\n        return 0\n"""


def patch_sync_tool() -> None:
    path = ROOT / 'research' / 'tools' / 'sync_active_research.py'
    text = path.read_text(encoding='utf-8')
    if "approved candidate preserved" in text:
        return
    needle = '    current = json.loads(ACTIVE.read_text(encoding="utf-8"))\n'
    assert needle in text, 'sync tool layout changed'
    text = text.replace(needle, needle + SAFE_SYNC_GUARD, 1)
    path.write_text(text, encoding='utf-8')


def patch_research_smoke() -> None:
    path = ROOT / 'tests' / 'research-tools.smoke.py'
    text = path.read_text(encoding='utf-8')
    start = "active = json.loads((ROOT / 'research/ACTIVE_CANDIDATE.json').read_text(encoding='utf-8'))\n"
    assert start in text
    pattern = (
        start
        + "assert active['build_approved'] is False\n"
        + "assert active['status'] in {'NO_ACTIVE_CANDIDATE', 'RESEARCH_ONLY'}\n"
        + "assert not (ROOT / 'product').exists() or not any((ROOT / 'product').rglob('*'))\n"
    )
    replacement = start + """if active['build_approved']:\n    assert active['status'] == 'BUILD_APPROVED'\n    assert active['candidate_id'] == 'jira-automation-rule-guard'\n    assert (ROOT / 'product/jira-automation-guard/core.js').is_file()\nelse:\n    assert active['status'] in {'NO_ACTIVE_CANDIDATE', 'RESEARCH_ONLY'}\n    assert not (ROOT / 'product').exists() or not any((ROOT / 'product').rglob('*'))\n"""
    if pattern in text:
        text = text.replace(pattern, replacement, 1)
    assert "candidate_id'] == 'jira-automation-rule-guard'" in text
    path.write_text(text, encoding='utf-8')


def common_validation_python(extra: str = '') -> str:
    return textwrap.dedent(f'''\
        import json
        from pathlib import Path
        active = json.loads(Path('research/ACTIVE_CANDIDATE.json').read_text(encoding='utf-8'))
        if active['build_approved']:
            assert active['status'] == 'BUILD_APPROVED'
            assert active['candidate_id'] == 'jira-automation-rule-guard'
            assert Path('product/jira-automation-guard/core.js').is_file()
        else:
            assert active['status'] in {{'NO_ACTIVE_CANDIDATE', 'RESEARCH_ONLY'}}
            assert not Path('product').exists() or not any(Path('product').rglob('*'))
        {extra}
        print({{'status': active['status'], 'candidate_id': active.get('candidate_id')}})
    ''')


def write_workflows() -> None:
    write('.github/workflows/marketplace-scan.yml', f'''
        name: Marketplace opportunity scan
        on:
          push:
            branches: [main]
            paths: ['research/tools/marketplace_signal_scan.py', '.github/workflows/marketplace-scan.yml']
          schedule:
            - cron: '27 20 * * 1'
          workflow_dispatch:
        concurrency:
          group: marketplace-opportunity-scan
          cancel-in-progress: true
        permissions:
          contents: write
        jobs:
          scan:
            runs-on: ubuntu-latest
            timeout-minutes: 15
            steps:
              - uses: actions/checkout@v4
                with: {{fetch-depth: 0}}
              - uses: actions/setup-python@v5
                with: {{python-version: '3.12'}}
              - name: Run public marketplace signal scan
                env: {{GITHUB_TOKEN: '${{{{ secrets.GITHUB_TOKEN }}}}'}}
                run: python research/tools/marketplace_signal_scan.py
              - name: Validate scanner output and governance boundary
                run: |
                  python scripts/check_prebuild_gate.py
                  python - <<'PY'
        {textwrap.indent(common_validation_python("data = json.loads(Path('research/marketplace_scan/latest.json').read_text(encoding='utf-8'))\nassert data['status'] == 'RESEARCH_ONLY'\nassert isinstance(data['clusters'], list)"), '          ').rstrip()}
                  PY
              - name: Commit refreshed evidence
                run: |
                  if git diff --quiet -- research/marketplace_scan; then exit 0; fi
                  git config user.name 'github-actions[bot]'
                  git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
                  git add research/marketplace_scan
                  git commit -m 'Refresh marketplace opportunity signals [skip ci]'
                  git pull --rebase origin main
                  git push
    ''')

    write('.github/workflows/exact-match-queue.yml', f'''
        name: Exact-workflow candidate queue
        on:
          push:
            branches: [main]
            paths: ['research/tools/exact_match_queue.py', '.github/workflows/exact-match-queue.yml']
          schedule:
            - cron: '53 20 * * 1'
          workflow_dispatch:
        concurrency:
          group: exact-workflow-candidate-queue
          cancel-in-progress: true
        permissions:
          contents: write
        jobs:
          scan:
            runs-on: ubuntu-latest
            timeout-minutes: 20
            steps:
              - uses: actions/checkout@v4
                with: {{fetch-depth: 0}}
              - uses: actions/setup-python@v5
                with: {{python-version: '3.12'}}
              - name: Run exact-workflow search queue
                run: python research/tools/exact_match_queue.py
              - name: Validate research boundary
                run: |
                  python scripts/check_prebuild_gate.py
                  python - <<'PY'
        {textwrap.indent(common_validation_python("queue = json.loads(Path('research/candidate_queue/latest.json').read_text(encoding='utf-8'))\nassert queue['status'] == 'RESEARCH_ONLY'\nassert queue['candidate_count'] >= 5\nassert all(len(row['searches']) >= 12 for row in queue['candidates'])"), '          ').rstrip()}
                  PY
              - name: Commit refreshed queue
                run: |
                  if git diff --quiet -- research/candidate_queue; then exit 0; fi
                  git config user.name 'github-actions[bot]'
                  git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
                  git add research/candidate_queue
                  git commit -m 'Refresh exact-workflow candidate queue [skip ci]'
                  git pull --rebase origin main
                  git push
    ''')

    write('.github/workflows/candidate-deep-dive.yml', f'''
        name: Candidate evidence deep dive
        on:
          push:
            branches: [main]
            paths: ['research/tools/deep_dive_candidate.py', 'research/candidate_queue/**', '.github/workflows/candidate-deep-dive.yml']
          schedule:
            - cron: '19 21 * * 1'
          workflow_dispatch:
        concurrency:
          group: candidate-evidence-deep-dive
          cancel-in-progress: true
        permissions:
          contents: write
        jobs:
          deepen:
            runs-on: ubuntu-latest
            timeout-minutes: 15
            steps:
              - uses: actions/checkout@v4
                with: {{fetch-depth: 0}}
              - uses: actions/setup-python@v5
                with: {{python-version: '3.12'}}
              - name: Deep-dive first queued candidate
                run: python research/tools/deep_dive_candidate.py
              - name: Validate research boundary
                run: |
                  python scripts/check_prebuild_gate.py
                  python - <<'PY'
        {textwrap.indent(common_validation_python("report = json.loads(Path('research/deep_dive/latest.json').read_text(encoding='utf-8'))\nassert report['status'] in {'NO_CANDIDATE_TO_DEEP_DIVE','RESEARCH_ONLY','MANUAL_FINAL_REVIEW_REQUIRED','REJECT_EXACT_DUPLICATE'}"), '          ').rstrip()}
                  PY
              - name: Commit refreshed deep-dive evidence
                run: |
                  if git diff --quiet -- research/deep_dive; then exit 0; fi
                  git config user.name 'github-actions[bot]'
                  git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
                  git add research/deep_dive
                  git commit -m 'Refresh candidate deep-dive evidence [skip ci]'
                  git pull --rebase origin main
                  git push
    ''')

    write('.github/workflows/sync-research-candidate.yml', f'''
        name: Sync research candidate safely
        on:
          push:
            branches: [main]
            paths: ['research/deep_dive/**', 'research/tools/sync_active_research.py', '.github/workflows/sync-research-candidate.yml']
          workflow_dispatch:
        concurrency:
          group: sync-research-candidate
          cancel-in-progress: true
        permissions:
          contents: write
        jobs:
          sync:
            runs-on: ubuntu-latest
            timeout-minutes: 5
            steps:
              - uses: actions/checkout@v4
                with: {{fetch-depth: 0}}
              - uses: actions/setup-python@v5
                with: {{python-version: '3.12'}}
              - name: Preserve approved builds or sync research-only state
                run: python research/tools/sync_active_research.py
              - name: Validate state
                run: |
                  python scripts/check_prebuild_gate.py
                  python - <<'PY'
        {textwrap.indent(common_validation_python(), '          ').rstrip()}
                  PY
              - name: Commit state if changed
                run: |
                  if git diff --quiet -- research/ACTIVE_CANDIDATE.json; then exit 0; fi
                  git config user.name 'github-actions[bot]'
                  git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
                  git add research/ACTIVE_CANDIDATE.json
                  git commit -m 'Sync research candidate state [skip ci]'
                  git pull --rebase origin main
                  git push
    ''')

    write('.github/workflows/research-loop-check.yml', f'''
        name: Research loop checks
        on:
          push:
            branches: [main]
            paths: ['research/**', 'tests/research-tools.smoke.py', 'scripts/check_prebuild_gate.py', '.github/workflows/research-loop-check.yml']
          workflow_dispatch:
        concurrency:
          group: research-loop-check-${{{{ github.ref }}}}
          cancel-in-progress: true
        permissions:
          contents: read
        jobs:
          validate:
            runs-on: ubuntu-latest
            timeout-minutes: 7
            steps:
              - uses: actions/checkout@v4
              - uses: actions/setup-python@v5
                with: {{python-version: '3.12'}}
              - name: Compile research tools
                run: python -m py_compile research/tools/*.py scripts/check_prebuild_gate.py
              - name: Run research smoke tests
                run: python tests/research-tools.smoke.py
              - name: Enforce prebuild gate
                run: |
                  python scripts/check_prebuild_gate.py
                  python - <<'PY'
        {textwrap.indent(common_validation_python(), '          ').rstrip()}
                  PY
    ''')

    write('.github/workflows/approve-jira-guard.yml', '''
        name: Approve Jira Automation Guard free MVP
        on:
          push:
            branches: [main]
            paths: ['research/CANDIDATE_JIRA_AUTOMATION_GUARD.md', 'research/tools/approve_jira_automation_guard.py', '.github/workflows/approve-jira-guard.yml']
          workflow_dispatch:
        concurrency:
          group: approve-jira-automation-guard
          cancel-in-progress: true
        permissions:
          contents: write
        jobs:
          approve:
            runs-on: ubuntu-latest
            timeout-minutes: 6
            steps:
              - uses: actions/checkout@v4
                with: {fetch-depth: 0}
              - uses: actions/setup-python@v5
                with: {python-version: '3.12'}
              - name: Validate stored evidence and approve free MVP only
                run: python research/tools/approve_jira_automation_guard.py
              - name: Validate prebuild gate
                run: |
                  python scripts/check_prebuild_gate.py
                  python - <<'PY'
                  import json
                  from pathlib import Path
                  active=json.loads(Path('research/ACTIVE_CANDIDATE.json').read_text(encoding='utf-8'))
                  assert active['status']=='BUILD_APPROVED'
                  assert active['build_approved'] is True
                  assert active['approval_scope']=='FREE_MVP_ONLY'
                  assert active['candidate_id']=='jira-automation-rule-guard'
                  print(active['approved_build'])
                  PY
              - name: Commit approval state
                run: |
                  if git diff --quiet -- research/ACTIVE_CANDIDATE.json; then exit 0; fi
                  git config user.name 'github-actions[bot]'
                  git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
                  git add research/ACTIVE_CANDIDATE.json
                  git commit -m 'Approve Jira Automation Guard free MVP [skip ci]'
                  git pull --rebase origin main
                  git push
    ''')

    write('.github/workflows/smoke.yml', '''
        name: Jira Automation Guard smoke test
        on:
          push:
            branches: [main]
            paths:
              - 'product/jira-automation-guard/**'
              - 'tests/jira-automation-guard.smoke.js'
              - 'index.html'
              - 'styles.css'
              - 'core.js'
              - 'app.js'
              - 'privacy.html'
              - 'stats.html'
              - 'sample-before.json'
              - 'sample-after.json'
              - 'manifest.webmanifest'
              - 'robots.txt'
              - 'sitemap.xml'
              - 'research/ACTIVE_CANDIDATE.json'
              - 'scripts/check_prebuild_gate.py'
              - '.github/workflows/smoke.yml'
          workflow_dispatch:
        concurrency:
          group: jira-automation-guard-smoke-${{ github.ref }}
          cancel-in-progress: true
        permissions:
          contents: read
        jobs:
          validate:
            runs-on: ubuntu-latest
            timeout-minutes: 7
            steps:
              - uses: actions/checkout@v4
              - uses: actions/setup-python@v5
                with: {python-version: '3.12'}
              - name: Validate approved scope
                run: python scripts/check_prebuild_gate.py
              - name: Check JavaScript syntax
                run: |
                  node --check product/jira-automation-guard/core.js
                  node --check product/jira-automation-guard/app.js
                  node --check core.js
                  node --check app.js
              - name: Run product core smoke
                run: node tests/jira-automation-guard.smoke.js
              - name: Validate static release
                run: |
                  python - <<'PY'
                  import json
                  import xml.etree.ElementTree as ET
                  from html.parser import HTMLParser
                  from pathlib import Path
                  class Parser(HTMLParser): pass
                  required=['index.html','styles.css','core.js','app.js','privacy.html','stats.html','sample-before.json','sample-after.json','manifest.webmanifest','robots.txt','sitemap.xml','product/jira-automation-guard/index.html']
                  for name in required: assert Path(name).is_file(), name
                  for name in ['index.html','privacy.html','stats.html','product/jira-automation-guard/index.html']: Parser().feed(Path(name).read_text(encoding='utf-8'))
                  json.loads(Path('manifest.webmanifest').read_text(encoding='utf-8'))
                  json.loads(Path('sample-before.json').read_text(encoding='utf-8'))
                  json.loads(Path('sample-after.json').read_text(encoding='utf-8'))
                  ET.parse('sitemap.xml')
                  html=Path('index.html').read_text(encoding='utf-8')
                  for marker in ['Jira Automation Guard','beforeFile','afterFile','analyzeBtn','downloadMarkdownBtn','proInterestBtn']: assert marker in html, marker
                  for obsolete in ['FBA補てん原価監査','字幕Preflight','つづきから']: assert obsolete not in html, obsolete
                  print('static release validation passed')
                  PY
              - name: Serve and smoke HTTP
                run: |
                  python -m http.server 8765 --bind 127.0.0.1 >/tmp/http.log 2>&1 &
                  pid=$!
                  trap 'kill $pid' EXIT
                  for i in {1..10}; do curl -fsS http://127.0.0.1:8765/ >/tmp/index && break; sleep 1; done
                  grep -q 'Jira Automation Guard' /tmp/index
                  curl -fsS http://127.0.0.1:8765/core.js | grep -q 'buildReport'
                  curl -fsS http://127.0.0.1:8765/sample-before.json | python -m json.tool >/dev/null
                  curl -fsS http://127.0.0.1:8765/privacy.html | grep -q '入力JSON'
                  curl -fsS http://127.0.0.1:8765/stats.html | grep -q '有料開発Gate'
    ''')


def main() -> int:
    active = validate_approval()
    publish_public_files()
    patch_sync_tool()
    patch_research_smoke()
    write_workflows()
    print(json.dumps({
        'candidate': active['candidate_id'],
        'published': 'https://bachikoljunior-blip.github.io/Q/',
        'scope': active['approval_scope'],
    }, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
