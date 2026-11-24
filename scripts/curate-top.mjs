#!/usr/bin/env node
/**
 * Curated Top-10 per genre × section for the AIGAMERIA homepage.
 *
 * Reads the local knowledge store (.data/aipetros.sqlite — filled by
 * scripts/knowledge-ingest.mjs, 100% local, no external AI) and ranks the
 * BEST 10 items per section for every game genre:
 *
 *   sections:
 *     trends    — live-harvested cards (they carry a real source URL), newest first
 *     tricks    — trick + glitch cards (cheat cards are AWARENESS-only, flagged)
 *     tutorials — question/qa coaching cards, best-known first
 *
 * Output: public/data/curated-top.json  → served statically, the homepage
 * fetches it (no server change, no external API).
 *
 * Usage: node scripts/curate-top.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const DB_FILE = path.join(ROOT, '..', '.data', 'aipetros.sqlite');
const db = new DatabaseSync(DB_FILE);

/** genre → game ids (knowledge store ids) */
const GENRES = {
  sports: ['fc27', 'ea-sports-fc-27-and-ea-sports-fc-26', 'efootball', 'nba2k', 'mlb', 'rocket-league'],
  shooter: ['cod', 'call-of-duty-modern-warfare-4-warzone-hq', 'cs2', 'valorant', 'overwatch-2', 'the-finals', 'delta-force', 'battlefield-6', 'arena-breakout-infinite', 'escape-from-tarkov', 'hunt-showdown-1896', 'war-thunder', 'world-of-tanks'],
  'battle-royale': ['fortnite', 'pubg-battlegrounds', 'apex-legends', 'marvel-rivals', 'the-finals'],
  'open-world-story': ['gta', 'red-dead-redemption-2', 'cyberpunk-2077', 'the-witcher-3-wild-hunt', 'elden-ring', 'elden-ring-nightreign', 'the-elder-scrolls-v-skyrim-special-edition', 'kingdom-come-deliverance-ii', 'fallout-4', 'monster-hunter-wilds', 'monster-hunter-world', 'baldur-s-gate-3', 'crimson-desert', 'phantom-blade-zero'],
  racing: ['forza-horizon', 'forza-horizon-6', 'f1-25'],
  'survival-sandbox': ['minecraft', 'rust', 'valheim', 'terraria', '7-days-to-die', 'dayz', 'project-zomboid', 'once-human', 'enshrouded', 'palworld', 'the-isle', 'don-t-starve-together'],
  'mmo-moba': ['dota2', 'league-of-legends', 'world-of-warcraft', 'final-fantasy-xiv-online', 'path-of-exile', 'path-of-exile-2', 'genshin-impact', 'honkai-star-rail', 'warframe', 'old-school-runescape', 'deadlock', 'eternal-return'],
  horror: ['dead-by-daylight', 'r-e-p-o', 'it-takes-two', 'peak'],
};

const SECTION_KINDS = {
  trends: null, // handled below (cards with a live source URL)
  tricks: ['trick', 'glitch'],
  tutorials: ['question', 'qa'],
};

const cards = db.prepare(`
  SELECT game_id, kind, dedupe_key, title, body, source, url, updated_at
  FROM knowledge_cards
  ORDER BY updated_at DESC
`).all();

const out = {
  generatedAt: new Date().toISOString(),
  note: 'Curated locally by the AIGAMERIA daily agent. Zero external AI. Cheat cards are awareness-only.',
  genres: {},
};

for (const [genre, ids] of Object.entries(GENRES)) {
  const mine = cards.filter((c) => ids.includes(c.game_id));
  if (mine.length === 0) continue;

  const trim = (c, kind) => ({
    game: c.game_id,
    kind,
    title: c.title,
    summary: (c.body || '').slice(0, 220),
    source: c.source || 'aigameria-knowledge',
    url: c.url || null,
    awarenessOnly: kind === 'cheat',
    updatedAt: c.updated_at,
  });

  const live = mine.filter((c) => c.url && c.url.startsWith('http'));
  const trends = [
    ...live.filter((c) => c.kind !== 'cheat'),
    ...live.filter((c) => c.kind === 'cheat'),
  ]
    .slice(0, 10)
    .map((c) => trim(c, c.kind));

  const tricks = SECTION_KINDS.tricks
    .flatMap((kind) => mine.filter((c) => c.kind === kind))
    .slice(0, 10)
    .map((c) => trim(c, c.kind));

  const cheats = mine.filter((c) => c.kind === 'cheat').slice(0, 10).map((c) => trim(c, 'cheat'));

  const tutorials = SECTION_KINDS.tutorials
    .flatMap((kind) => mine.filter((c) => c.kind === kind))
    .slice(0, 10)
    .map((c) => trim(c, c.kind));

  out.genres[genre] = {
    games: ids.filter((id) => mine.some((c) => c.game_id === id)),
    counts: { cards: mine.length, trends: trends.length, tricks: tricks.length, cheatAwareness: cheats.length, tutorials: tutorials.length },
    trends,
    tricks,
    cheatAwareness: cheats,
    tutorials,
  };
}

const OUT_DIR = path.join(ROOT, '..', 'public', 'data');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'curated-top.json'), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(ROOT, '..', 'logs', 'curated-top-summary.json'), JSON.stringify(
  Object.fromEntries(Object.entries(out.genres).map(([g, v]) => [g, v.counts])), null, 2));

for (const [g, v] of Object.entries(out.genres)) {
  console.log(`[curate] ${g}: cards=${v.counts.cards} trends=${v.counts.trends} tricks=${v.counts.tricks} cheatA=${v.counts.cheatAwareness} tutorials=${v.counts.tutorials}`);
}
console.log('[curate] wrote public/data/curated-top.json');
