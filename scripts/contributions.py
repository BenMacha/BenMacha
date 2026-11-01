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

AUTHOR = os.environ.get("CONTRIB_AUTHOR", "BenMacha")
README = os.environ.get("CONTRIB_README", "README.md")
STATS = os.environ.get("CONTRIB_STATS", "profile-contrib/stats.json")
MACHINE = os.environ.get("CONTRIB_MACHINE", "profile-contrib/pr-machine.svg")
DOWNLOADS = os.environ.get("CONTRIB_DOWNLOADS", "profile-contrib/packages.json")

PACKAGES = [
    "benmacha/diagram-bundle",
    "benmacha/mousetracker",
    "benmacha/audit-bundle",
    "benmacha/templatebundle",
]
START = "<!-- CONTRIBUTIONS:START -->"
END = "<!-- CONTRIBUTIONS:END -->"

REPOSITORIES = [
    {"repo": "symfony/symfony", "name": "Symfony", "logo": "symfony"},
    {"repo": "api-platform/core", "name": "API Platform", "logo": "initials:AP"},
    {"repo": "api-platform/api-platform", "name": "API Platform installer", "logo": "initials:AP"},
    {"repo": "caddyserver/caddy", "name": "Caddy", "logo": "caddy"},
    {
        "repo": "ccmbenchmark/ting",
        "name": "Ting",
        "logo": "database",
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
        stats.append((config["name"], len(merged), len(review), config.get("logo", "")))
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
    head = (
        f"![Open source pull requests machine]({MACHINE})\n\n"
        f"{total_merged} merged pull requests so far, updated hourly.\n"
    )
    return head + "\n" + "\n".join(out).rstrip() + "\n"


def downloads():
    """Total Packagist downloads per package. A package that cannot be read keeps its last number."""
    try:
        with open(DOWNLOADS, encoding="utf-8") as handle:
            totals = json.load(handle)
    except (OSError, ValueError):
        totals = {}
    for name in PACKAGES:
        url = f"https://packagist.org/packages/{name}.json"
        request = urllib.request.Request(url, headers={"User-Agent": f"{AUTHOR}-profile-readme"})
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                totals[name] = int(json.load(response)["package"]["downloads"]["total"])
        except Exception as error:  # network, HTTP or format error: keep the last known number
            print(f"{name}: downloads not updated ({error})", file=sys.stderr)
    return {name: totals[name] for name in PACKAGES if name in totals}


def stats_json(stats):
    """The same numbers as the chart, for scripts/pr_machine.mjs."""
    projects = [
        {"name": name, "merged": merged, "review": review, "logo": logo} for name, merged, review, logo in stats
    ]
    return json.dumps(
        {
            "merged": sum(p["merged"] for p in projects),
            "review": sum(p["review"] for p in projects),
            "projects": projects,
        },
        indent=2,
    ) + "\n"


def main():
    with open(README, encoding="utf-8") as handle:
        readme = handle.read()
    if START not in readme or END not in readme:
        sys.exit(f"{README}: missing {START} / {END} markers")
    before, rest = readme.split(START, 1)
    _, after = rest.split(END, 1)
    stats = []
    updated = f"{before}{START}\n{section(stats)}{END}{after}"
    os.makedirs(os.path.dirname(STATS) or ".", exist_ok=True)
    with open(STATS, "w", encoding="utf-8") as handle:
        handle.write(stats_json(stats))
    with open(DOWNLOADS, "w", encoding="utf-8") as handle:
        handle.write(json.dumps(downloads(), indent=2) + "\n")
    if updated != readme:
        with open(README, "w", encoding="utf-8") as handle:
            handle.write(updated)
        print("README.md updated")
    else:
        print("README.md unchanged")


if __name__ == "__main__":
    main()
