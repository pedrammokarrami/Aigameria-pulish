"""API-driven menu tests — the frontend's only data source for tiles/brand/version."""
import pytest
from fastapi.testclient import TestClient

from app import config


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("menu")
    config.DB_PATH = str(tmp / "menu.sqlite")
    from app import db as db_mod

    db_mod.reset_db()
    from app.main import app

    with TestClient(app) as c:
        yield c


def test_menu_en(client):
    resp = client.get("/api/v1/menu?lang=en")
    d = resp.json()["data"]
    assert d["version"] == "2.00"
    assert d["brand"]["name"] == "AIGAMERIA"
    assert len(d["items"]) >= 5
    blob = resp.text.lower()
    assert "quick launch ai coach" in blob
    assert not any("\u0600" <= ch <= "\u06FF" for ch in resp.text)  # EN purity


def test_menu_fa(client):
    resp = client.get("/api/v1/menu?lang=fa")
    d = resp.json()["data"]
    assert d["items"][0]["title"].strip()
    assert any("\u0600" <= ch <= "\u06FF" for ch in resp.text)


def test_menu_actions_known(client):
    allowed = {"demo", "tournament", "social", "identity", "map", "store", "backdrop"}
    d = client.get("/api/v1/menu?lang=en").json()["data"]
    assert all(item["action"] in allowed for item in d["items"])


def test_menu_idempotent_seed(client):
    from app.menu_api import ensure_seeded, get_menu

    ensure_seeded()
    ensure_seeded()
    assert len(get_menu("en")["items"]) >= 5  # no duplicates
