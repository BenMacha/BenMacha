#!/usr/bin/env python3
"""Collect the GitHub numbers drawn in profile-contrib/github-stats.svg.

Reads, through the GitHub GraphQL API, the contribution calendar of the last
52 weeks, the contributions of the current year (total, commits, pull
requests, issues, reviews), the public repositories, the stars of the owner's
own repositories, the followers and the top languages by bytes across the
owner's own non-fork repositories. Writes them to profile-contrib/github-stats.json.

If the API cannot be read (no token, network or API error), the last JSON is
kept as it is and the script exits 0, so the drawing step still runs.

Standard library only. Token from GITHUB_TOKEN (the Actions token is enough,
everything read here is public).
"""

import datetime as dt
import json
import os
import sys
import urllib.request

LOGIN = os.environ.get("STATS_LOGIN", "BenMacha")
OUTPUT = os.environ.get("STATS_OUTPUT", "profile-contrib/github-stats.json")
TOP_LANGUAGES = 6
API = "https://api.github.com/graphql"

PROFILE = """
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    followers { totalCount }
    publicRepos: repositories(privacy: PUBLIC) { totalCount }
    calendar: contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
    year: contributionsCollection(from: $from, to: $to) {
      contributionCalendar { totalContributions }
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
    }
  }
}
"""

REPOS = """
query($login: String!, $after: String) {
  user(login: $login) {
    repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, first: 100, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        stargazerCount
        languages(first: 20, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
    }
  }
}
"""


def graphql(query, variables):
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise RuntimeError("GITHUB_TOKEN is not set")
    body = json.dumps({"query": query, "variables": variables}).encode()
    request = urllib.request.Request(
        API,
        data=body,
        headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
            "User-Agent": f"{LOGIN}-profile-readme",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.load(response)
    if data.get("errors"):
        raise RuntimeError("; ".join(e.get("message", "?") for e in data["errors"]))
    return data["data"]


def collect():
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
    start = now.replace(month=1, day=1, hour=0, minute=0, second=0)
    user = graphql(PROFILE, {"login": LOGIN, "from": start.isoformat(), "to": now.isoformat()})["user"]
    if not user:
        raise RuntimeError(f"user {LOGIN} not found")

    weeks = user["calendar"]["contributionCalendar"]["weeks"]
    days = [
        {"date": d["date"], "count": d["contributionCount"]}
        for week in weeks
        for d in week["contributionDays"]
    ]
    # The calendar covers about 53 weeks; keep the last 52 full weeks plus the current one.
    first = len(days) - (52 * 7 + dt.date.fromisoformat(days[-1]["date"]).isoweekday() % 7 + 1)
    days = days[max(0, first):]

    stars, languages, after = 0, {}, None
    while True:
        page = graphql(REPOS, {"login": LOGIN, "after": after})["user"]["repositories"]
        for repo in page["nodes"]:
            stars += repo["stargazerCount"]
            for edge in repo["languages"]["edges"]:
                name = edge["node"]["name"]
                entry = languages.setdefault(name, {"name": name, "color": edge["node"]["color"] or "#8b8b8b", "bytes": 0})
                entry["bytes"] += edge["size"]
        if not page["pageInfo"]["hasNextPage"]:
            break
        after = page["pageInfo"]["endCursor"]
    total_bytes = sum(entry["bytes"] for entry in languages.values()) or 1
    top = sorted(languages.values(), key=lambda entry: entry["bytes"], reverse=True)[:TOP_LANGUAGES]
    for entry in top:
        entry["share"] = round(entry["bytes"] * 100 / total_bytes, 1)

    year = user["year"]
    return {
        "login": LOGIN,
        "updated": now.isoformat().replace("+00:00", "Z"),
        "year": now.year,
        "contributions_year": year["contributionCalendar"]["totalContributions"],
        "contributions_calendar": sum(d["count"] for d in days),
        "commits": year["totalCommitContributions"],
        "pull_requests": year["totalPullRequestContributions"],
        "issues": year["totalIssueContributions"],
        "reviews": year["totalPullRequestReviewContributions"],
        "public_repos": user["publicRepos"]["totalCount"],
        "stars": stars,
        "followers": user["followers"]["totalCount"],
        "languages": top,
        "days": days,
    }


def main():
    try:
        stats = collect()
    except Exception as error:  # no token, network, HTTP or API error: keep the last numbers
        print(f"{OUTPUT}: not updated ({error})", file=sys.stderr)
        return
    os.makedirs(os.path.dirname(OUTPUT) or ".", exist_ok=True)
    # "updated" changes every run; keep the file as it is when nothing else changed.
    try:
        with open(OUTPUT, encoding="utf-8") as handle:
            previous = json.load(handle)
    except (OSError, ValueError):
        previous = {}
    if {**previous, "updated": None} == {**stats, "updated": None}:
        print(f"{OUTPUT} unchanged")
        return
    with open(OUTPUT, "w", encoding="utf-8") as handle:
        handle.write(json.dumps(stats, indent=1) + "\n")
    print(f"{OUTPUT} updated")


if __name__ == "__main__":
    main()
