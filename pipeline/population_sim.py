#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AIGAMERIA population simulator (population_sim.py)
==================================================

8-hour statistical campaign driver. Creates a large synthetic population of
AIGAMERIA users (varied language, location/region, platform, games, playstyle,
casual→hardcore) and drives their journeys through the REAL local API
(behavior events + coach sessions), in scheduled chunks — so the 8-hour run
never blocks anything.

Modes:
    --run-chunk     process the next chunk of users (called every ~30 min)
    --final-report  aggregate all profiles + live checks into the full
                    statistical report and print it (delivered by scheduler)

State: pipeline/population/state.json (+ report at pipeline/population/final_report.json)
"""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
import urllib.request
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any

ROOT = os.path.dirname(os.path.abspath(__file__))
POP_DIR = os.path.join(ROOT, "population")
STATE_FILE = os.path.join(POP_DIR, "state.json")
FINAL_FILE = os.path.join(POP_DIR, "final_report.json")
REPORT_DIR = os.path.join(ROOT, "..", "logs", "population-report.json")

POPULATION_SIZE = 500
CHUNK_SIZE = 36  # users per 30-min run → ~14 runs ≈ 7h + report run
ENDPOINT = os.environ.get("AIGAMERIA_ENDPOINT", "http://127.0.0.1:3000")
UA = "AIGAMERIA-PopSim/1.0"

LANGS = ["fa", "en", "es", "de", "tr", "fr", "ar", "ru"]
REGIONS = ["EU", "MENA", "NA", "LATAM", "APAC", "TR"]
PLATFORMS = ["pc", "console", "mobile", "tablet"]
PLAYSTYLES = ["casual", "regular", "hardcore", "explorer", "creator", "competitive"]
GAMES = [
    ("fc27", "sports"), ("nba2k27", "sports"), ("efootball", "sports"),
    ("cs2", "shooter"), ("valorant", "shooter"), ("cod", "shooter"),
    ("gta", "story"), ("cyberpunk", "story"), ("elden-ring", "story"),
    ("dota2", "strategy"), ("civ", "strategy"),
]
QUERIES = {
    "sports": ["best formation after patch", "finesse timing green window", "meta squad update", "penalty technique"],
    "shooter": ["crosshair placement after patch", "mirage smoke lineup", "economy buy rounds", "counter strafe aim"],
    "story": ["heist payout guide", "best side quests", "vehicle handling tips", "story choices matter"],
    "strategy": ["build order meta", "lane control tips", "patch update nerfs", "macro strategy"],
}


def seeded_users() -> list[dict[str, Any]]:
    rng = random.Random(20261125)
    users: list[dict[str, Any]] = []
    for i in range(POPULATION_SIZE):
        game, realm = rng.choice(GAMES)
        users.append(
            {
                "uid": f"pop_{i:04d}",
                "lang": rng.choice(LANGS),
                "region": rng.choice(REGIONS),
                "platform": rng.choice(PLATFORMS),
                "playstyle": rng.choice(PLAYSTYLES),
                "game": game,
                "realm": realm,
                "eventCount": {"casual": rng.randint(2, 6), "regular": rng.randint(6, 14),
                                "hardcore": rng.randint(15, 30), "explorer": rng.randint(8, 16),
                                "creator": rng.randint(8, 18), "competitive": rng.randint(12, 26)}[rng.choice(["x"]) if False else "x"] if False else rng.choice(
                    {"casual": [2, 3, 4, 5, 6], "regular": [6, 8, 10, 12, 14], "hardcore": [15, 18, 22, 26, 30],
                     "explorer": [8, 10, 12, 16], "creator": [9, 12, 15, 18], "competitive": [12, 16, 20, 24]}[rng.choice(
                        ["casual", "regular", "hardcore", "explorer", "creator", "competitive"])]
                ),
                "queries": QUERIES[realm],
            }
        )
    # keep the sampled playstyle consistent with eventCount (re-derive)
    for u in users:
        if u["eventCount"] <= 6:
            u["playstyle"] = "casual"
        elif u["eventCount"] <= 14:
            u["playstyle"] = "regular" if u["eventCount"] <= 12 else "explorer"
        elif u["eventCount"] <= 20:
            u["playstyle"] = "creator" if u["playstyle"] in ("creator", "competitive") else "regular"
        else:
            u["playstyle"] = "hardcore" if u["playstyle"] == "hardcore" else "competitive"
    return users


def http_post(path: str, body: dict[str, Any]) -> bool:
    try:
        req = urllib.request.Request(
            ENDPOINT + path, data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": UA}, method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except Exception:
        return False


def http_get(path: str) -> dict[str, Any] | None:
    try:
        req = urllib.request.Request(ENDPOINT + path, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8", "replace"))
    except Exception:
        return None


def journey_events(user: dict[str, Any], rng: random.Random) -> list[tuple[str, dict[str, Any], int]]:
    """A realistic journey: session start → game select → clicks/questions/dwell."""
    events: list[tuple[str, dict[str, Any], int]] = []
    n = user["eventCount"]
    now = datetime.now(timezone.utc)
    events.append(("session_start", {"gameId": user["game"], "lang": user["lang"], "platform": user["platform"]}, 0))
    events.append(("game_select", {"gameId": user["game"], "lang": user["lang"], "platform": user["platform"]}, 0))
    remaining = max(0, n - 3)
    for i in range(remaining):
        age_hours = rng.choice([0, 0, 1, 2, 3, 5, 8, 12, 24, 48])  # within freshness window mostly
        kind = rng.choices(["question", "card_click", "dwell", "scroll"], weights=[4, 3, 2, 1])[0]
        if kind == "question":
            events.append(("question", {"gameId": user["game"], "query": rng.choice(user["queries"]), "lang": user["lang"]}, age_hours))
        elif kind == "dwell":
            events.append(("dwell", {"gameId": user["game"], "dwellMs": rng.choice([8000, 20000, 40000, 60000, 90000])}, age_hours))
        else:
            events.append((kind, {"gameId": user["game"], "category": user["realm"]}, age_hours))
    return events


def load_state() -> dict[str, Any]:
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, encoding="utf-8") as f:
            return json.load(f)
    users = seeded_users()
    os.makedirs(POP_DIR, exist_ok=True)
    state = {"users": users, "cursor": 0, "chunks_done": 0, "started_at": datetime.now(timezone.utc).isoformat(timespec="seconds")}
    save_state(state)
    return state


def save_state(state: dict[str, Any]) -> None:
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False)
    os.replace(tmp, STATE_FILE)


def run_chunk() -> int:
    state = load_state()
    cursor = state["cursor"]
    if cursor >= len(state["users"]):
        print("population fully simulated")
        return 0
    chunk = state["users"][cursor : cursor + CHUNK_SIZE]
    rng = random.Random(cursor)
    posted = 0
    for user in chunk:
        for kind, payload, age_h in journey_events(user, rng):
            if age_h:
                payload = dict(payload)
                payload["occurredAt"] = (datetime.now(timezone.utc) - timedelta(hours=age_h)).isoformat(timespec="seconds")
            if http_post("/api/v1/behavior/event", {"userId": user["uid"], "kind": kind, "payload": payload}):
                posted += 1
    state["cursor"] = cursor + len(chunk)
    state["chunks_done"] += 1
    state["last_posted"] = posted
    save_state(state)
    print(f"chunk {state['chunks_done']}: {len(chunk)} users, {posted} events (cursor={state['cursor']}/{len(state['users'])})")
    return 0


def final_report() -> int:
    state = load_state()
    users = state["users"]
    scenarios = Counter()
    games = Counter()
    categories = Counter()
    playstyles = Counter()
    patterns = Counter()
    confidences: list[float] = []
    api_errors = 0
    for user in users:
        resp = http_get(f"/api/v1/behavior/profile?userId={user['uid']}")
        if not resp or not resp.get("success"):
            api_errors += 1
            continue
        profile = resp["data"]["profile"]
        scenarios[profile["scenario"]] += 1
        for g in profile["topGames"]:
            games[g["gameId"]] += 1
        for c in profile["topCategories"]:
            categories[c["category"]] += 1
        playstyles[profile["playstyle"]] += 1
        if profile.get("searchPattern"):
            patterns[profile["searchPattern"]] += 1
        confidences.append(profile["confidence"])

    # live site checks
    health = http_get("/api/health")
    live_ok = bool(health and health.get("success"))

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "population": len(users),
        "api_errors": api_errors,
        "scenarios": dict(scenarios),
        "top_games": games.most_common(10),
        "top_categories": categories.most_common(6),
        "playstyles": dict(playstyles),
        "search_patterns": dict(patterns),
        "avg_confidence": round(sum(confidences) / len(confidences), 3) if confidences else 0,
        "language_mix": dict(Counter(u["lang"] for u in users)),
        "region_mix": dict(Counter(u["region"] for u in users)),
        "platform_mix": dict(Counter(u["platform"] for u in users)),
        "live_api_ok": live_ok,
        "chunks_run": state.get("chunks_done"),
    }
    os.makedirs(os.path.dirname(REPORT_DIR), exist_ok=True)
    for path in (FINAL_FILE, REPORT_DIR):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
    print(json.dumps(report, ensure_ascii=False))
    return 0 if api_errors == 0 else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-chunk", action="store_true")
    parser.add_argument("--final-report", action="store_true")
    args = parser.parse_args()
    if args.final_report:
        return final_report()
    return run_chunk()


if __name__ == "__main__":
    sys.exit(main())
