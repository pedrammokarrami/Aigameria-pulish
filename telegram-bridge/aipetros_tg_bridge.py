#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AIPETROS Telegram Bridge

Inbound (Telegram -> agent):
  Every message the user sends (to their own Saved Messages, or any DM to this
  account) is appended to queue/inbox.jsonl and POSTed to the webhook if one is
  configured. The agent picks it up either through the webhook, or through the
  local queue poller (queue/poll.sh) — no public URL required.

Outbound (agent -> Telegram):
  POST http://127.0.0.1:8770/send  {"text": "..."}  -> delivered as "🤖 ...".
"""

import asyncio
import json
import os
import sys
import time
from pathlib import Path

from aiohttp import web
from telethon import TelegramClient, events
from telethon.sessions import StringSession

BRIDGE = Path(__file__).resolve().parent
QUEUE = BRIDGE / 'queue'
INBOX = QUEUE / 'inbox.jsonl'
WEBHOOK_FILE = BRIDGE / 'webhook_url.txt'
SESSION_FILE = BRIDGE / 'session_new.txt'
ENV_LOCAL = Path(r'C:/Users/ELI/Desktop/petros-cinama/.env.local')
PORT = 8770

QUEUE.mkdir(exist_ok=True)

# ── credentials ──────────────────────────────────────────────────────────
env: dict[str, str] = {}
if ENV_LOCAL.exists():
    for line in ENV_LOCAL.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()

API_ID = int(env.get('TG_API_ID') or os.environ.get('TG_API_ID') or 0)
API_HASH = env.get('TG_API_HASH') or os.environ.get('TG_API_HASH') or ''
if not API_ID or not API_HASH:
    print('ERROR: TG_API_ID / TG_API_HASH missing (checked .env.local + env)')
    sys.exit(1)

SESSION_STR = SESSION_FILE.read_text(encoding='utf-8').strip() if SESSION_FILE.exists() else ''
if not SESSION_STR:
    print(f'ERROR: {SESSION_FILE} missing')
    sys.exit(1)

client = TelegramClient(StringSession(SESSION_STR), API_ID, API_HASH)
last_chat_id: int | None = None

AIPETROS_BASE = os.environ.get('AIPETROS_BASE', 'http://127.0.0.1:3000')


async def ask_aipetros(text: str) -> str:
    """Ask the local AIPETROS server for a professional answer."""
    import aiohttp
    fa = any('\u0600' <= ch <= '\u06FF' for ch in text)
    # Game detection → coach session (5 structured modules) vs symbiote (chat answer)
    game = 'fc27'
    low = text.lower()
    if any(k in low for k in ['cs2', 'counter', 'کانتر', 'ایم', 'اسنایپر', 'snip']):
        game = 'cs2'
    elif any(k in low for k in ['gta', 'گتا', 'هایست', 'heist']):
        game = 'gta'
    elif any(k in low for k in ['valorant', 'ولورانت']):
        game = 'valorant'

    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=45)) as http:
            async with http.get(
                f'{AIPETROS_BASE}/api/ai/coach-session',
                params={'gameId': game, 'realm': {'fc27': 'sports', 'cs2': 'shooter', 'gta': 'story', 'valorant': 'shooter'}[game], 'q': text},
            ) as resp:
                if resp.ok:
                    data = await resp.json()
                    session = (data or {}).get('session') or {}
                    mods = session.get('modules') or []
                    if mods:
                        head = session.get('telemetry') or {}
                        parts = []
                        if fa:
                            parts.append(f"\U0001F9EA کلاس حرفه‌ای مربی · OVR {head.get('ovr', '?')}")
                            for m in mods:
                                parts.append(f"\n\n{m.get('titleFa', '')}\n" + '\n'.join('▸ ' + l for l in (m.get('linesFa') or [])[:4]))
                            clips = [c for m in mods for c in (m.get('clips') or [])][:3]
                            if clips:
                                parts.append('\n\n\U0001F3AC فیلم‌های آموزشی:\n' + '\n'.join(f"• {c.get('title', '')[:70]} — https://youtu.be/{c.get('youtubeId', '')}" for c in clips))
                        else:
                            parts.append(f"\U0001F9EA Pro coach class · OVR {head.get('ovr', '?')}")
                            for m in mods:
                                parts.append(f"\n\n{m.get('titleEn', '')}\n" + '\n'.join('▸ ' + l for l in (m.get('linesEn') or [])[:4]))
                        return ''.join(parts)[:3500]
    except Exception as exc:  # noqa: BLE001
        print(f'coach-session failed: {exc}')

    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=45)) as http:
            async with http.post(
                f'{AIPETROS_BASE}/api/ai/symbiote',
                json={'message': text, 'activeSection': 'coach', 'gameName': 'EA SPORTS FC 27'},
            ) as resp:
                if resp.ok:
                    data = await resp.json()
                    reply = str((data or {}).get('reply', '')).strip()
                    if reply:
                        return reply[:3500]
    except Exception as exc:  # noqa: BLE001
        print(f'symbiote failed: {exc}')

    return ('الان به سرور AIPETROS وصل نشدم — سرور خاموشه؟' if fa
            else 'I could not reach the local AIPETROS server — is it running?')


async def deliver(text: str, chat_id: int | None) -> None:
    body = text if text.startswith('\U0001F916') else '\U0001F916 ' + text
    try:
        await client.send_message(chat_id if chat_id else 'me', body, parse_mode=None, link_preview=False)
    except Exception as exc:  # noqa: BLE001
        print(f'send failed: {exc}')


async def answer_and_send(text: str, chat_id: int | None) -> None:
    answer = await ask_aipetros(text)
    await deliver(answer, chat_id)


def load_webhook() -> str:
    return WEBHOOK_FILE.read_text(encoding='utf-8').strip() if WEBHOOK_FILE.exists() else ''


def enqueue(text: str, chat_id: int) -> None:
    """Append to the local inbox (durable fallback for the agent)."""
    rec = {'text': text, 'chatId': chat_id, 'ts': int(time.time() * 1000)}
    with INBOX.open('a', encoding='utf-8') as fh:
        fh.write(json.dumps(rec, ensure_ascii=False) + '\n')


async def push_to_webhook(text: str, chat_id: int) -> None:
    webhook = load_webhook()
    if not webhook:
        return
    import aiohttp
    try:
        async with aiohttp.ClientSession() as http:
            await http.post(
                webhook,
                json={'path': '/tg-message', 'text': text, 'chatId': chat_id},
                timeout=aiohttp.ClientTimeout(total=10),
            )
    except Exception as exc:  # noqa: BLE001
        print(f'webhook POST failed: {exc}')


@client.on(events.NewMessage(chats='me'))
async def on_saved(event):
    """No outgoing/incoming filter: a message you send from your phone arrives
    here as a normal update, and one sent by this bridge is skipped by prefix."""
    global last_chat_id
    text = (event.message.message or '').strip()
    if not text or text.startswith('\U0001F916'):
        return
    last_chat_id = event.chat_id
    enqueue(text, event.chat_id)
    await push_to_webhook(text, event.chat_id)
    asyncio.create_task(answer_and_send(text, event.chat_id))


@client.on(events.NewMessage())
async def on_any_message(event):
    """Direct messages to this account also count as prompts."""
    global last_chat_id
    if event.chat_id == 'me':
        return  # already handled above
    text = (event.message.message or '').strip()
    if not text or text.startswith('\U0001F916'):
        return
    last_chat_id = event.chat_id
    enqueue(text, event.chat_id)
    await push_to_webhook(text, event.chat_id)
    asyncio.create_task(answer_and_send(text, event.chat_id))


async def handle_send(request: web.Request):
    global last_chat_id
    try:
        payload = await request.json()
    except Exception:
        return web.json_response({'error': 'bad json'}, status=400)
    text = str(payload.get('text', '')).strip()
    chat_id = payload.get('chat_id') or last_chat_id
    if not text:
        return web.json_response({'error': 'empty text'}, status=400)
    if not text.startswith('\U0001F916'):
        text = '\U0001F916 ' + text
    try:
        await client.send_message(chat_id if chat_id else 'me', text, parse_mode=None, link_preview=False)
        return web.json_response({'ok': True})
    except Exception as exc:  # noqa: BLE001
        return web.json_response({'error': str(exc)}, status=500)


async def handle_test_answer(request: web.Request):
    """POST /test-answer {"text"} → run the AIPETROS pipeline and deliver it."""
    try:
        payload = await request.json()
    except Exception:
        return web.json_response({'error': 'bad json'}, status=400)
    text = str(payload.get('text', '')).strip()
    if not text:
        return web.json_response({'error': 'empty text'}, status=400)
    chat_id = payload.get('chat_id') or last_chat_id
    answer = await ask_aipetros(text)
    await deliver(answer, chat_id)
    return web.json_response({'ok': True, 'answer': answer[:300]})


async def handle_inbox(request: web.Request):
    """GET /inbox?after=<ts> → queued user messages (used by the local poller)."""
    after = int(request.query.get('after', '0'))
    out = []
    if INBOX.exists():
        for line in INBOX.read_text(encoding='utf-8').splitlines():
            if not line.strip():
                continue
            try:
                rec = json.loads(line)
            except Exception:
                continue
            if rec.get('ts', 0) > after:
                out.append(rec)
    return web.json_response({'messages': out})


async def main():
    await client.start()
    me = await client.get_me()
    print(f'BRIDGE ONLINE as {me.first_name} (@{me.username}) id={me.id}', flush=True)
    print(f'sender: http://127.0.0.1:{PORT}/send | inbox: {INBOX}', flush=True)
    print(f'webhook configured: {bool(load_webhook())}', flush=True)
    print('Send a message to your own Saved Messages — the agent picks it up.', flush=True)

    app = web.Application()
    app.router.add_post('/send', handle_send)
    app.router.add_get('/inbox', handle_inbox)
    app.router.add_post('/test-answer', handle_test_answer)
    app.router.add_get('/health', lambda r: web.json_response({'ok': True, 'webhook': bool(load_webhook())}))
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host='127.0.0.1', port=PORT)
    await site.start()
    # Stay connected so incoming messages keep firing the handlers.
    while True:
        await asyncio.sleep(3600)


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('bridge stopped')
