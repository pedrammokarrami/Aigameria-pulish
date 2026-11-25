"""Standalone pipeline entry: python pipeline/sync.py"""
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import config  # noqa: E402
from app.seed_sync import rotate_logs, run_sync  # noqa: E402

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    config  # touch import for env-driven DB path
    changed = run_sync()
    rotate_logs()
    print(changed)
