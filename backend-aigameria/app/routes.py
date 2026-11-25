"""Routes — FastAPI REST API, gameId-isolated, EN/FA language safe."""
import json
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Query

from . import cache, config, isolation
from .db import get_db

router = APIRouter(prefix="/api/v1")

FALLBACK_STREAM = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"


def _lang(value: str) -> str:
    lang = (value or "en").lower()[:2]
    if lang not in ("en", "fa"):
        raise HTTPException(status_code=422, detail="lang must be 'en' or 'fa'")
    return lang


def _game_row(game_id: str) -> Any:
    row = get_db().execute("SELECT * FROM games WHERE game_id = ?", (game_id.lower().strip(),)).fetchone()
    if not row:
        # Unknown game → isolated 404, never another game's data.
        raise HTTPException(status_code=404, detail=f"unknown game '{game_id}'")
    return row


def _topic_rows(game_id: str) -> list[dict[str, Any]]:
    rows = get_db().execute(
        "SELECT * FROM topics WHERE game_id = ? ORDER BY topic_id", (game_id,)
    ).fetchall()
    items = [dict(r) for r in rows]
    # Final isolation gate — defensive (data is already WHERE-scoped).
    return isolation.assert_isolated(game_id, items)


def _localize(item: dict[str, Any], lang: str, fields: list[tuple[str, str]]) -> dict[str, Any]:
    out: dict[str, Any] = {"game_id": item["game_id"], "topic_id": item["topic_id"]}
    for en_field, fa_field in fields:
        val = item[en_field] if lang == "en" else item[fa_field]
        if lang == "en" and isinstance(val, str):
            val = isolation.sanitize_en_text(val)
        out[en_field.replace("_en", "").replace("_fa", "")] = val
    return out


@router.get("/health")
def health() -> dict[str, Any]:
    return {"success": True, "service": "aigameria-api", "stream_cache_ttl": config.STREAM_CACHE_TTL_SECONDS}


@router.get("/games")
def list_games(lang: str = Query(default="en")) -> dict[str, Any]:
    lang = _lang(lang)
    rows = get_db().execute("SELECT * FROM games ORDER BY game_id").fetchall()
    items = []
    for row in rows:
        d = dict(row)
        name = d["name_en"] if lang == "en" else d["name_fa"]
        items.append({
            "game_id": d["game_id"],
            "name": name,
            "realm": d["realm"],
            "rating_label": d["rating_label_en"] if lang == "en" else isolation.sanitize_en_text(d["rating_label_en"]),
            "rating_value": d["rating_value"],
            "accent_color": d["accent_color"],
        })
    return {"success": True, "data": {"games": items}}


@router.get("/games/{game_id}")
def get_game(game_id: str, lang: str = Query(default="en")) -> dict[str, Any]:
    lang = _lang(lang)
    d = dict(_game_row(game_id))
    topics = _topic_rows(d["game_id"])
    topic_items = []
    for t in topics:
        topic_items.append({
            **_localize(t, lang, [("headline_en", "headline_fa"), ("label_en", "label_fa")]),
            "video_url": t["video_url"],
            "poster_url": t["poster_url"],
            "stage": {
                "mode": t["stage_mode"],
                "title": t["stage_title"] if lang == "en" else isolation.sanitize_en_text(t["stage_title"]),
                "subtitle": t["stage_subtitle"] if lang == "en" else isolation.sanitize_en_text(t["stage_subtitle"]),
                "markers": json.loads(t["stage_markers"]),
            },
        })
    return {"success": True, "data": {"game": {**d}, "topics": topic_items}}


@router.get("/coach/{game_id}/topics/{topic_id}")
def coach_topic(game_id: str, topic_id: str, lang: str = Query(default="en")) -> dict[str, Any]:
    """Topic-locked coaching: tips strictly for (gameId, topicId) — nothing else."""
    lang = _lang(lang)
    game = dict(_game_row(game_id))
    row = get_db().execute(
        "SELECT * FROM topics WHERE game_id = ? AND topic_id = ?",
        (game["game_id"], topic_id),
    ).fetchone()
    if not row:
        # Missing data → isolated empty response for THIS game (never others').
        return {"success": True, "data": {"game_id": game["game_id"], "topic": None, "tips": []}}
    item = dict(row)
    tips = json.loads(item["tips_en"] if lang == "en" else item["tips_fa"])
    if lang == "en":
        tips = [isolation.sanitize_en_text(t) for t in tips]
    return {
        "success": True,
        "data": {
            "game_id": game["game_id"],
            "topic": _localize(item, lang, [("headline_en", "headline_fa"), ("label_en", "label_fa")]),
            "tips": tips,
            "video_url": item["video_url"],
            "poster_url": item["poster_url"],
        },
    }


@router.get("/media/stream/{game_id}")
def media_stream(game_id: str, topic_id: str = Query(default="")) -> dict[str, Any]:
    """Resolve a free direct stream link for (gameId, topic) with the 8-hour
    cache (TTL = 28800s). Metadata only — never downloads/stores video files."""
    game = dict(_game_row(game_id))
    cache_key = f"stream::{game['game_id']}::{topic_id.lower()}"

    def producer() -> tuple[str, str]:
        row = None
        if topic_id:
            row = get_db().execute(
                "SELECT video_url FROM topics WHERE game_id = ? AND topic_id = ?",
                (game["game_id"], topic_id),
            ).fetchone()
        candidate = row["video_url"] if row else FALLBACK_STREAM
        # HEAD probe: 200 + video/* → direct; anything else → known-good fallback.
        try:
            with httpx.Client(timeout=8, follow_redirects=True) as client:
                resp = client.head(candidate)
                ctype = resp.headers.get("content-type", "")
                if resp.status_code == 200 and (ctype.startswith("video/") or ctype == ""):
                    return candidate, "direct"
        except Exception:
            pass
        return FALLBACK_STREAM, "fallback"

    try:
        entry = cache.get_or_refresh(cache_key, game["game_id"], producer)
    except cache.ControlledCacheError as err:
        raise HTTPException(status_code=503, detail=f"stream source unavailable: {err}") from err
    return {
        "success": True,
        "data": {
            "game_id": game["game_id"],
            "topic_id": topic_id,
            "url": entry["url"],
            "source": entry["source"],
            "from_cache": bool(entry.get("from_cache")),
            "stale": bool(entry.get("stale", False)),
            "expires_at": entry["expires_at"],
            "ttl_seconds": config.STREAM_CACHE_TTL_SECONDS,
        },
    }


@router.get("/stage/{game_id}")
def stage(game_id: str, topic_id: str = Query(default="")) -> dict[str, Any]:
    """Stage/projector data for Ai-petros-game-analyz (strictly per gameId)."""
    game = dict(_game_row(game_id))
    if topic_id:
        row = get_db().execute(
            "SELECT * FROM topics WHERE game_id = ? AND topic_id = ?",
            (game["game_id"], topic_id),
        ).fetchone()
    else:
        row = get_db().execute(
            "SELECT * FROM topics WHERE game_id = ? ORDER BY topic_id LIMIT 1",
            (game["game_id"],),
        ).fetchone()
    if not row:
        return {"success": True, "data": {"game_id": game["game_id"], "stage": None}}
    item = dict(row)
    # Football pitch only for football games (defense-in-depth vs data errors).
    if item["stage_mode"] == "pitch" and not game["is_football"]:
        item["stage_mode"] = "map"
    return {
        "success": True,
        "data": {
            "game_id": game["game_id"],
            "stage": {
                "mode": item["stage_mode"],
                "title": item["stage_title"],
                "subtitle": item["stage_subtitle"],
                "markers": json.loads(item["stage_markers"]),
            },
            "topic_id": item["topic_id"],
        },
    }


@router.get("/gamepad/{game_id}")
def gamepad(game_id: str, lang: str = Query(default="en")) -> dict[str, Any]:
    """Button/combos data for Petros-gamepad (strictly per gameId)."""
    lang = _lang(lang)
    game = dict(_game_row(game_id))
    rows = get_db().execute(
        "SELECT * FROM combo_moves WHERE game_id = ? ORDER BY skill_id", (game["game_id"],)
    ).fetchall()
    items = [dict(r) for r in rows]
    items = isolation.assert_isolated(game["game_id"], items)
    out = []
    for it in items:
        steps = json.loads(it["steps_en"] if lang == "en" else it["steps_fa"])
        if lang == "en":
            steps = [isolation.sanitize_en_text(s) for s in steps]
        out.append({"skill_id": it["skill_id"], "steps": steps, "timing_ms": it["timing_ms"]})
    return {"success": True, "data": {"game_id": game["game_id"], "combos": out}}


@router.get("/ava/{game_id}")
def ava(game_id: str, topic_id: str = Query(default=""), lang: str = Query(default="en")) -> dict[str, Any]:
    """AVA hologram coach text/state, synced with game + topic + language."""
    lang = _lang(lang)
    game = dict(_game_row(game_id))
    row = get_db().execute(
        "SELECT * FROM topics WHERE game_id = ? AND topic_id = ?",
        (game["game_id"], topic_id),
    ).fetchone() if topic_id else None
    headline = row["headline_en"] if (row and lang == "en") else (
        row["headline_fa"] if row else ("Coaching session ready" if lang == "en" else "جلسه مربیگری آماده است")
    )
    if lang == "en":
        headline = isolation.sanitize_en_text(str(headline))
    return {
        "success": True,
        "data": {
            "game_id": game["game_id"],
            "lang": lang,
            "state": "coaching",
            "text": headline,
        },
    }
