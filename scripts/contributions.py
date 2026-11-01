#!/usr/bin/env python3
"""Rebuild the open source contributions section of README.md.

Lists, for each repository below, the pull requests authored by the profile
owner: merged ones first, then the ones still under review. Closed pull
requests that were not merged are left out. The section is written between
the CONTRIBUTIONS:START and CONTRIBUTIONS:END markers.
"""

import json
import os
import re
import sys
import urllib.parse
import urllib.request
from html import escape

AUTHOR = os.environ.get("CONTRIB_AUTHOR", "BenMacha")
README = os.environ.get("CONTRIB_README", "README.md")
SVG = os.environ.get("CONTRIB_SVG", "profile-contrib/prs.svg")
START = "<!-- CONTRIBUTIONS:START -->"
END = "<!-- CONTRIBUTIONS:END -->"

REPOSITORIES = [
    {"repo": "symfony/symfony", "name": "Symfony"},
    {"repo": "api-platform/core", "name": "API Platform"},
    {"repo": "api-platform/api-platform", "name": "API Platform installer"},
    {"repo": "caddyserver/caddy", "name": "Caddy"},
    {
        "repo": "ccmbenchmark/ting",
        "name": "Ting",
        "suffix": " (CCM Benchmark ORM)",
        "notes": [
            "[#120](https://github.com/ccmbenchmark/ting/issues/120) reported an SQL injection"
            " in the PostgreSQL driver, fixed upstream in 4.1.1",
        ],
    },
]


def search(query):
    token = os.environ.get("GITHUB_TOKEN")
    items, page = [], 1
    while True:
        url = "https://api.github.com/search/issues?" + urllib.parse.urlencode(
            {"q": query, "per_page": 100, "page": page, "sort": "created", "order": "desc"}
        )
        request = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json"})
        if token:
            request.add_header("Authorization", "Bearer " + token)
        with urllib.request.urlopen(request) as response:
            data = json.load(response)
        items += data["items"]
        if len(items) >= data["total_count"] or not data["items"]:
            return items
        page += 1


def label(title):
    """Turn "[Form] Fix x" or "fix(doctrine): fix x" into ("Form", "Fix x")."""
    match = re.match(r"^\[([^\]]+)\]\s*(.+)$", title)
    if match:
        return match.group(1), match.group(2)
    match = re.match(r"^(?:feat|fix|chore|docs|refactor|test|ci|perf|build|style)(?:\(([^)]+)\))?!?:\s*(.+)$", title)
    if match:
        return match.group(1), match.group(2)
    match = re.match(r"^([\w/-]+):\s*(.+)$", title)
    if match:
        return match.group(1), match.group(2)
    return None, title


def line(pr):
    scope, text = label(pr["title"])
    prefix = f"**{scope}**: " if scope else ""
    return f"- [#{pr['number']}]({pr['html_url']}) {prefix}{text}"


def section(stats):
    out, total_merged = [], 0
    for config in REPOSITORIES:
        prs = search(f"repo:{config['repo']} is:pr author:{AUTHOR}")
        merged = [p for p in prs if p.get("pull_request", {}).get("merged_at")]
        review = [p for p in prs if p["state"] == "open"]
        stats.append((config["name"], len(merged), len(review)))
        if not merged and not review and not config.get("notes"):
            continue
        total_merged += len(merged)
        out.append(f"### [{config['name']}](https://github.com/{config['repo']}){config.get('suffix', '')}")
        out.append("")
        for note in config.get("notes", []):
            out.append(f"- {note}")
        if config.get("notes"):
            out.append("")
        if merged:
            out.append(f"Merged ({len(merged)}):")
            out.append("")
            out += [line(p) for p in sorted(merged, key=lambda p: p["number"], reverse=True)]
            out.append("")
        if review:
            out.append(f"Under review ({len(review)}):")
            out.append("")
            out += [line(p) for p in sorted(review, key=lambda p: p["number"], reverse=True)]
            out.append("")
    head = f"![Pull requests by project]({SVG})\n\n{total_merged} merged pull requests so far, updated daily.\n"
    return head + "\n" + "\n".join(out).rstrip() + "\n"


def svg(stats):
    """Draw one stacked bar per project: merged, then under review."""
    stats = [s for s in stats if s[1] or s[2]]
    merged = sum(s[1] for s in stats)
    review = sum(s[2] for s in stats)
    width, left, right, top, row = 740, 214, 70, 96, 34
    height = top + row * len(stats) + 20
    scale = (width - left - right) / max([m + r for _, m, r in stats] + [1])
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{merged} merged and {review} under review pull requests">',
        "<style>",
        ".bg{fill:#ffffff;stroke:#d0d7de}.t{fill:#1f2328;font:600 15px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}",
        ".n{fill:#1f2328;font:700 26px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}",
        ".l{fill:#59636e;font:400 13px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}",
        ".m{fill:#8250df}.r{fill:#1a7f37}.track{fill:#eff2f5}",
        "@media (prefers-color-scheme:dark){.bg{fill:#0d1117;stroke:#30363d}.t,.n{fill:#e6edf3}.l{fill:#9198a1}.m{fill:#a371f7}.r{fill:#3fb950}.track{fill:#161b22}}",
        "</style>",
        f'<rect class="bg" x="0.5" y="0.5" width="{width - 1}" height="{height - 1}" rx="8"/>',
        '<text class="t" x="24" y="34">Open source pull requests</text>',
        f'<text class="n" x="24" y="72">{merged}</text><text class="l" x="{24 + 16 * len(str(merged)) + 8}" y="72">merged</text>',
        f'<text class="n" x="{left}" y="72">{review}</text><text class="l" x="{left + 16 * len(str(review)) + 8}" y="72">under review</text>',
        f'<rect class="m" x="{width - 210}" y="25" width="10" height="10" rx="2"/><text class="l" x="{width - 194}" y="34">merged</text>',
        f'<rect class="r" x="{width - 130}" y="25" width="10" height="10" rx="2"/><text class="l" x="{width - 114}" y="34">under review</text>',
    ]
    for i, (name, m, r) in enumerate(stats):
        y = top + i * row
        bar = width - left - right
        parts.append(f'<text class="t" x="24" y="{y + 15}">{escape(name)}</text>')
        parts.append(f'<rect class="track" x="{left}" y="{y + 2}" width="{bar}" height="16" rx="4"/>')
        if m:
            parts.append(f'<rect class="m" x="{left}" y="{y + 2}" width="{max(m * scale, 4):.1f}" height="16" rx="4"/>')
        if r:
            parts.append(f'<rect class="r" x="{left + m * scale:.1f}" y="{y + 2}" width="{max(r * scale, 4):.1f}" height="16" rx="4"/>')
        parts.append(f'<text class="l" x="{width - right + 10}" y="{y + 15}">{m} · {r}</text>')
    parts.append("</svg>")
    return "\n".join(parts) + "\n"


def main():
    with open(README, encoding="utf-8") as handle:
        readme = handle.read()
    if START not in readme or END not in readme:
        sys.exit(f"{README}: missing {START} / {END} markers")
    before, rest = readme.split(START, 1)
    _, after = rest.split(END, 1)
    stats = []
    updated = f"{before}{START}\n{section(stats)}{END}{after}"
    os.makedirs(os.path.dirname(SVG) or ".", exist_ok=True)
    with open(SVG, "w", encoding="utf-8") as handle:
        handle.write(svg(stats))
    if updated != readme:
        with open(README, "w", encoding="utf-8") as handle:
            handle.write(updated)
        print("README.md updated")
    else:
        print("README.md unchanged")


if __name__ == "__main__":
    main()
