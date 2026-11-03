#!/usr/bin/env python3
"""Refresh the profile data and rebuild the generated sections of README.md.

Everything comes from profile-contrib/profile.json (the editable data) and from
public APIs:

- Open source contributions: every public pull request authored by the profile
  owner in a repository owned by someone else (GitHub search), grouped by
  repository. Pull requests closed without merge are kept and listed apart,
  open ones note an approval. Names, logos, notes and order come from the "contributions" overrides of
  profile.json; a repository found for the first time gets its own name and a
  neutral mark. Written to profile-contrib/stats.json.
- Packages: every package of the vendor on Packagist, with its description,
  repository and total downloads. Written to profile-contrib/packages.json.

If an API cannot be read, the last good data is kept and the README is still
rebuilt from it. The README sections are written between the markers
<!-- NAME:START --> and <!-- NAME:END --> (ORGS, STACK, PACKAGES, CONTRIBUTIONS).
"""

import json
import os
import re
import sys
import urllib.parse
import urllib.request

PROFILE = os.environ.get("CONTRIB_PROFILE", "profile-contrib/profile.json")
README = os.environ.get("CONTRIB_README", "README.md")
STATS = os.environ.get("CONTRIB_STATS", "profile-contrib/stats.json")
DOWNLOADS = os.environ.get("CONTRIB_DOWNLOADS", "profile-contrib/packages.json")


def load(path, default):
    try:
        with open(path, encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, ValueError):
        return default


def save(path, data):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def get_json(url, github=False):
    request = urllib.request.Request(url, headers={"User-Agent": "profile-readme", "Accept": "application/vnd.github+json"})
    token = os.environ.get("GITHUB_TOKEN")
    if github and token:
        request.add_header("Authorization", "Bearer " + token)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


# ---------------------------------------------------------------- contributions


def search(query):
    items, page = [], 1
    while True:
        url = "https://api.github.com/search/issues?" + urllib.parse.urlencode(
            {"q": query, "per_page": 100, "page": page, "sort": "created", "order": "desc"}
        )
        data = get_json(url, github=True)
        items += data["items"]
        if len(items) >= min(data["total_count"], 1000) or not data["items"]:
            return items
        page += 1


def contributions(profile):
    """The contributed projects, from the GitHub search. Raises on API errors."""
    login = profile.get("login", "BenMacha")
    config = profile.get("contributions", {})
    overrides = config.get("overrides", {})
    owners = {o.lower() for o in config.get("exclude_owners", [login])}
    skip = {r.lower() for r in config.get("exclude_repos", [])}
    repos = {}
    for item in search(f"is:pr is:public author:{login} -user:{login}"):
        repo = item["repository_url"].split("/repos/", 1)[1]
        if repo.split("/")[0].lower() in owners or repo.lower() in skip:
            continue
        merged = bool(item.get("pull_request", {}).get("merged_at"))
        state = "merged" if merged else ("open" if item["state"] == "open" else "closed")
        pr = {"number": item["number"], "title": item["title"], "url": item["html_url"], "state": state, "created": item["created_at"][:10]}
        if state == "open":
            # approved: the latest decisive review is an approval, the merge is pending
            reviews = get_json(f"https://api.github.com/repos/{repo}/pulls/{item['number']}/reviews?per_page=100", github=True)
            decisive = [r["state"] for r in reviews if r["state"] in ("APPROVED", "CHANGES_REQUESTED")]
            pr["approved"] = bool(decisive) and decisive[-1] == "APPROVED"
        if state == "closed":
            pr["closed"] = (item.get("closed_at") or "")[:10]
        repos.setdefault(repo, []).append(pr)
    order = {name.lower(): i for i, name in enumerate(config.get("order", []))}
    projects = []
    for repo, prs in repos.items():
        # closed without merge stay listed: rejections are part of the history
        extra = overrides.get(repo, {})
        if not prs and not extra.get("notes"):
            continue
        prs.sort(key=lambda p: p["number"], reverse=True)
        projects.append(
            {
                "repo": repo,
                "name": extra.get("name", repo.split("/")[1]),
                "logo": extra.get("logo", "repo"),
                "suffix": extra.get("suffix", ""),
                "notes": extra.get("notes", []),
                "merged": sum(p["state"] == "merged" for p in prs),
                "review": sum(p["state"] == "open" for p in prs),
                "approved": sum(bool(p.get("approved")) for p in prs),
                "closed": sum(p["state"] == "closed" for p in prs),
                "prs": prs,
            }
        )
    projects.sort(key=lambda p: (order.get(p["repo"].lower(), len(order)), -p["merged"], -(p["merged"] + p["review"]), p["name"].lower()))
    return {
        "merged": sum(p["merged"] for p in projects),
        "review": sum(p["review"] for p in projects),
        "approved": sum(p["approved"] for p in projects),
        "closed": sum(p["closed"] for p in projects),
        "projects": projects,
    }


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
    tag = " *(approved, merge pending)*" if pr.get("approved") else ""
    return f"- [#{pr['number']}]({pr['url']}) {prefix}{text}{tag}"


def contributions_section(stats):
    out = [
        "![Open source pull request line: pull requests reviewed, merged or under review](profile-contrib/pr-machine.svg)",
        "",
        "![Open source card index: one drawer per contributed project, one card per pull request, green tab merged, red tab under review](profile-contrib/pr-cabinet.svg)",
        "",
        f"{stats.get('merged', 0)} merged, {stats.get('review', 0)} under review ({stats.get('approved', 0)} approved) and {stats.get('closed', 0)} closed without merge, updated hourly. "
        "Rejected pull requests stay listed: the reviews they got are part of the work.",
        "",
    ]
    for p in stats.get("projects", []):
        merged = [x for x in p["prs"] if x["state"] == "merged"]
        review = sorted((x for x in p["prs"] if x["state"] == "open"), key=lambda x: not x.get("approved"))
        closed = [x for x in p["prs"] if x["state"] == "closed"]
        out += [f"### [{p['name']}](https://github.com/{p['repo']}){p.get('suffix', '')}", ""]
        if p.get("notes"):
            out += [f"- {note}" for note in p["notes"]] + [""]
        if merged:
            out += [f"Merged ({len(merged)}):", ""] + [line(x) for x in merged] + [""]
        if review:
            out += [f"Under review ({len(review)}):", ""] + [line(x) for x in review] + [""]
        if closed:
            out += [f"Closed without merge ({len(closed)}):", ""] + [line(x) for x in closed] + [""]
    return "\n".join(out).rstrip() + "\n"


# ---------------------------------------------------------------- packages


def packages(profile, previous):
    """Every package of the vendor on Packagist. A package that cannot be read keeps its last data."""
    config = profile.get("packages", {})
    vendor = config.get("vendor", "benmacha")
    skip = set(config.get("exclude", []))
    last = {p["name"]: p for p in previous}
    try:
        names = get_json(f"https://packagist.org/packages/list.json?vendor={urllib.parse.quote(vendor)}")["packageNames"]
    except Exception as error:  # network, HTTP or format error: keep the last list
        print(f"packages: list not updated ({error})", file=sys.stderr)
        names = list(last)
    out = []
    for name in names:
        if name in skip:
            continue
        entry = dict(last.get(name, {"name": name, "downloads": 0, "description": "", "repository": f"https://packagist.org/packages/{name}"}))
        try:
            data = get_json(f"https://packagist.org/packages/{name}.json")["package"]
            entry.update(
                {
                    "downloads": int(data["downloads"]["total"]),
                    "description": (data.get("description") or "").strip(),
                    "repository": data.get("repository") or entry["repository"],
                }
            )
        except Exception as error:
            print(f"{name}: not updated ({error})", file=sys.stderr)
        entry["what"] = config.get("overrides", {}).get(name, {}).get("what") or short(entry["description"]) or name.split("/")[1]
        out.append(entry)
    order = {name: i for i, name in enumerate(config.get("overrides", {}))}
    out.sort(key=lambda p: (order.get(p["name"], len(order)), p["name"]))
    return out


def short(text, size=30):
    text = re.split(r"[:.;(]", text or "")[0].strip()
    return text if len(text) <= size else text[: size - 1].rstrip() + "…"


def previous_packages():
    data = load(DOWNLOADS, [])
    if isinstance(data, dict) and "packages" in data:
        return data["packages"]
    if isinstance(data, dict):  # older format: {"vendor/name": downloads}
        return [{"name": k, "downloads": v, "description": "", "repository": f"https://packagist.org/packages/{k}"} for k, v in data.items()]
    return []


def packages_section(profile, items):
    vendor = profile.get("packages", {}).get("vendor", "benmacha")
    alt = "; ".join(f"{p['name']}, {(p['description'] or p['what']).rstrip('.')}" for p in items)
    links = " · ".join(f"[{p['name'].split('/')[1]}]({p['repository'].removesuffix('.git')})" for p in items)
    out = [f"![Packages on Packagist: {alt}](profile-contrib/packages.svg)", "", f"{links} · [all on Packagist](https://packagist.org/packages/{vendor}/)"]
    also = profile.get("packages", {}).get("also")
    if also:
        out += ["", also]
    return "\n".join(out) + "\n"


# ---------------------------------------------------------------- organizations and stack


def orgs_section(profile):
    orgs = profile.get("organizations", [])
    alt = ", ".join(f"{o['name']} ({o['what'].lower()}, {', '.join(l['label'] for l in o.get('links', []))})" for o in orgs)
    links = " — ".join(" · ".join(f"[{l['label'] if i else o['name']}]({l['url']})" for i, l in enumerate(o.get("links", []))) for o in orgs)
    return f"![Organizations and projects: {alt}](profile-contrib/orgs.svg)\n\n{links}\n"


def stack_section(profile):
    groups = [g for shelf in profile.get("stack", {}).get("shelves", []) for g in shelf]
    alt = " ".join(f"{g['label']}: {', '.join(item[0] for item in g['items'])}." for g in groups)
    return f"![Tech stack. {alt}](profile-contrib/stack.svg)\n"


# ---------------------------------------------------------------- README


def replace(readme, name, body):
    start, end = f"<!-- {name}:START -->", f"<!-- {name}:END -->"
    if start not in readme or end not in readme:
        print(f"{README}: missing {start} / {end} markers, section left as is", file=sys.stderr)
        return readme
    before, rest = readme.split(start, 1)
    _, after = rest.split(end, 1)
    return f"{before}{start}\n{body}{end}{after}"


def main():
    profile = load(PROFILE, {})
    try:
        stats = contributions(profile)
        save(STATS, stats)
    except Exception as error:  # network, HTTP or API error: keep the last data
        print(f"{STATS}: not updated ({error})", file=sys.stderr)
        stats = load(STATS, {"merged": 0, "review": 0, "projects": []})
    items = packages(profile, previous_packages())
    save(DOWNLOADS, {"vendor": profile.get("packages", {}).get("vendor", "benmacha"), "packages": items})

    with open(README, encoding="utf-8") as handle:
        readme = handle.read()
    updated = readme
    updated = replace(updated, "ORGS", orgs_section(profile))
    updated = replace(updated, "STACK", stack_section(profile))
    updated = replace(updated, "PACKAGES", packages_section(profile, items))
    if stats.get("projects") and all("prs" in p for p in stats["projects"]):
        updated = replace(updated, "CONTRIBUTIONS", contributions_section(stats))
    if updated != readme:
        with open(README, "w", encoding="utf-8") as handle:
            handle.write(updated)
        print("README.md updated")
    else:
        print("README.md unchanged")


if __name__ == "__main__":
    main()
