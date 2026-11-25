"""SQLite storage (stdlib sqlite3). Metadata + text only — never video files."""
import sqlite3
import threading
from pathlib import Path

from . import config

_conn: sqlite3.Connection | None = None
_lock = threading.Lock()


def _connect() -> sqlite3.Connection:
    Path(config.DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(config.DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def get_db() -> sqlite3.Connection:
    global _conn
    with _lock:
        if _conn is None:
            _conn = _connect()
        return _conn


SCHEMA = """
CREATE TABLE IF NOT EXISTS games (
  game_id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_fa TEXT NOT NULL,
  realm TEXT NOT NULL,
  is_football INTEGER NOT NULL DEFAULT 0,
  rating_label_en TEXT NOT NULL,
  rating_value INTEGER NOT NULL,
  stat_one_label_en TEXT NOT NULL,
  stat_one_value INTEGER NOT NULL,
  stat_two_label_en TEXT NOT NULL,
  stat_two_value INTEGER NOT NULL,
  accent_color TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS topics (
  dedupe_key TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(game_id),
  topic_id TEXT NOT NULL,
  label_en TEXT NOT NULL,
  label_fa TEXT NOT NULL,
  headline_en TEXT NOT NULL,
  headline_fa TEXT NOT NULL,
  tips_en TEXT NOT NULL,          -- JSON array
  tips_fa TEXT NOT NULL,          -- JSON array
  video_url TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  stage_mode TEXT NOT NULL,
  stage_title TEXT NOT NULL,
  stage_subtitle TEXT NOT NULL,
  stage_markers TEXT NOT NULL,    -- JSON array
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS stream_cache (
  cache_key TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT NOT NULL,           -- direct | fallback
  expires_at INTEGER NOT NULL     -- unix seconds; TTL = 28800
);
CREATE TABLE IF NOT EXISTS combo_moves (
  dedupe_key TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  steps_en TEXT NOT NULL,         -- JSON array of button steps
  steps_fa TEXT NOT NULL,
  timing_ms INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_topics_game ON topics(game_id);
CREATE INDEX IF NOT EXISTS idx_combo_game ON combo_moves(game_id);
CREATE INDEX IF NOT EXISTS idx_stream_game ON stream_cache(game_id);
"""


def init_db() -> None:
    get_db().executescript(SCHEMA)
    get_db().commit()


def reset_db() -> None:
    """Close and forget the cached connection (tests switch DB paths)."""
    global _conn
    with _lock:
        if _conn is not None:
            try:
                _conn.close()
            except Exception:
                pass
            _conn = None
