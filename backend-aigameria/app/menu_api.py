"""API-driven menu + brand metadata — the single source of truth for every
menu tile, label and version shown in the frontend (zero hardcoded UI data).

Menu tiles live in menu_items (editable rows); brand/version in brand_meta.
GET /api/v1/menu localizes by lang and the frontend renders exactly what the
API returns — nothing else.
"""
import logging
from typing import Any

from .db import get_db

log = logging.getLogger("aigameria.menu")

DEFAULT_MENU_ITEMS: list[dict[str, Any]] = [
    {"id": "demo", "title_en": "Quick Launch AI Coach", "title_fa": "شروع سریع تحلیل مربی",
     "subtitle_en": "Jump into the tactical scene and voice coach", "subtitle_fa": "ورود فوری به صحنهٔ تاکتیکی و مربی هوشمند",
     "accent_hex": "#34D399", "badge_en": "Live Game", "badge_fa": "بازی زنده", "action": "demo"},
    {"id": "tournament", "title_en": "3D Tournament Hub", "title_fa": "هاب تورنمنت ۳بعدی",
     "subtitle_en": "Brackets, live prediction arenas & prize leagues", "subtitle_fa": "رقابت‌ها، جدول حذفی و جوایز لیگ",
     "accent_hex": "#FBBF24", "badge_en": "Tournament", "badge_fa": "تورنمنت", "action": "tournament"},
    {"id": "social", "title_en": "Enter Social Club", "title_fa": "ورود به سوشال کلاب",
     "subtitle_en": "Squad chats, underground clubs & clip sharing", "subtitle_fa": "گپ گیمرها، کلاب‌ها و اشتراک‌گذاری کلیپ",
     "accent_hex": "#38BDF8", "badge_en": "Clubs & Chat", "badge_fa": "کلاب و چت", "action": "social"},
    {"id": "identity", "title_en": "Spatial ID Profile", "title_fa": "پروفایل هویت (Spatial ID)",
     "subtitle_en": "3D gamer card & custom procedural identity", "subtitle_fa": "شناسنامهٔ سه‌بعدی و کاراکتر شخصی‌سازی‌شده",
     "accent_hex": "#818CF8", "badge_en": "3D Identity", "badge_fa": "هویت سه‌بعدی", "action": "identity"},
    {"id": "map", "title_en": "3D Neighborhood Map", "title_fa": "نقشهٔ محلهٔ سه‌بعدی",
     "subtitle_en": "Live neighborhood radar with your real location", "subtitle_fa": "رادار زندهٔ محله با موقعیت واقعی",
     "accent_hex": "#22D3EE", "badge_en": "Map", "badge_fa": "نقشه", "action": "map"},
    {"id": "store", "title_en": "AIGAMERIA Store", "title_fa": "فروشگاه AIGAMERIA",
     "subtitle_en": "Gear, collections & gaming goods", "subtitle_fa": "تجهیزات، کلکسیون‌ها و کالای گیمینگ",
     "accent_hex": "#F472B6", "badge_en": "Store", "badge_fa": "فروشگاه", "action": "store"},
]

DEFAULT_BRAND: dict[str, str] = {
    "name": "AIGAMERIA",
    "tagline_en": "play · learn · win",
    "tagline_fa": "بازی کن · یاد بگیر · ببر",
    "version": "2.00",
}


def ensure_seeded() -> None:
    """Idempotent seed — never wipes valid rows (safe on the 6h timer)."""
    db = get_db()
    count = db.execute("SELECT COUNT(*) c FROM menu_items").fetchone()["c"]
    if count == 0:
        for i, item in enumerate(DEFAULT_MENU_ITEMS):
            db.execute(
                "INSERT OR IGNORE INTO menu_items (id, sort_order, title_en, title_fa, subtitle_en, "
                "subtitle_fa, accent_hex, badge_en, badge_fa, action) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (item["id"], i, item["title_en"], item["title_fa"], item["subtitle_en"],
                 item["subtitle_fa"], item["accent_hex"], item["badge_en"], item["badge_fa"], item["action"]),
            )
    meta = {r["key"]: r["value"] for r in db.execute("SELECT key, value FROM brand_meta").fetchall()}
    for key, value in DEFAULT_BRAND.items():
        if key not in meta:
            db.execute("INSERT OR IGNORE INTO brand_meta (key, value) VALUES (?,?)", (key, value))
    db.commit()


def get_menu(lang: str = "en") -> dict[str, Any]:
    ensure_seeded()
    db = get_db()
    en = lang != "fa"
    items = [
        {
            "id": r["id"],
            "title": (r["title_en"] if en else r["title_fa"]).strip(),
            "subtitle": (r["subtitle_en"] if en else r["subtitle_fa"]).strip(),
            "accent_hex": r["accent_hex"],
            "badge": (r["badge_en"] if en else r["badge_fa"]).strip(),
            "action": r["action"],
        }
        for r in db.execute("SELECT * FROM menu_items ORDER BY sort_order ASC").fetchall()
    ]
    brand = {r["key"]: r["value"] for r in db.execute("SELECT key, value FROM brand_meta").fetchall()}
    return {
        "version": brand.get("version", "2.00"),
        "brand": {
            "name": brand.get("name", "AIGAMERIA"),
            "tagline": brand.get("tagline_en" if en else "tagline_fa", brand.get("tagline_en", "")),
        },
        "items": items,
    }
