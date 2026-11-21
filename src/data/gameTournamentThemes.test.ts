import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAME_THEMES,
  TOURNAMENT_GAME_ORDER,
  getRosterCountDisplay,
  resolveTournamentGameFromLobby,
} from './gameTournamentThemes';

test('GAME_THEMES defines all 10 games with unique primary colors and unique display font stacks', () => {
  assert.deepEqual(TOURNAMENT_GAME_ORDER, [
    'FC27',
    'NBA2K',
    'FORTNITE',
    'DOTA2',
    'F1',
    'WARZONE',
    'CS2',
    'GTA',
    'RDR2',
    'APEX',
  ]);

  const primaryColors = new Set<string>();
  const displayFonts = new Set<string>();

  for (const gameId of TOURNAMENT_GAME_ORDER) {
    const cfg = GAME_THEMES[gameId];
    assert.ok(cfg, `Missing config for ${gameId}`);
    assert.equal(cfg.id, gameId);
    assert.equal(cfg.metrics.length, 3, `${gameId} must have exactly 3 labeled metrics`);
    assert.ok(cfg.standings.length >= 6, `${gameId} must have full standings`);
    assert.ok(
      cfg.roster.slots.some((s) => !s.filled && Boolean(s.emptyLabel)),
      `${gameId} must include an interactive empty slot`
    );
    assert.ok(cfg.turntableVideo?.src, `${gameId} must include a turntable video`);
    primaryColors.add(cfg.colors.primary);
    displayFonts.add(cfg.fonts.display);
  }

  assert.equal(primaryColors.size, 10, 'Each game must have a unique primary color');
  assert.equal(displayFonts.size, 10, 'Each game must have a unique native display font stack');
});

test('GAME_THEMES matches exact native palettes, turntable videos, roles, metrics, and CTAs per game', () => {
  assert.equal(GAME_THEMES.FC27.colors.primary, '#00E676');
  assert.equal(GAME_THEMES.FC27.primaryCtaFa, 'ورود به رختکن مسابقه');
  assert.match(GAME_THEMES.FC27.fonts.display, /Barlow Condensed/);
  assert.equal(
    GAME_THEMES.FC27.turntableVideo?.src,
    '/assets/aistudio/gemini_generated_video_9528C2CF_39592eeb.mp4'
  );

  assert.equal(GAME_THEMES.NBA2K.colors.primary, '#F97316');
  assert.equal(GAME_THEMES.NBA2K.primaryCtaFa, 'ورود به زمین مسابقه');
  assert.match(GAME_THEMES.NBA2K.fonts.display, /Oswald/);
  assert.equal(
    GAME_THEMES.NBA2K.turntableVideo?.src,
    '/assets/aistudio/Generated_Video_November_19__2026_-_7_18PM_3bc26c22.mp4'
  );

  assert.equal(GAME_THEMES.FORTNITE.colors.primary, '#3B82F6');
  assert.equal(GAME_THEMES.FORTNITE.primaryCtaFa, 'پرش از بتل‌باس');
  assert.match(GAME_THEMES.FORTNITE.fonts.display, /Anton/);
  assert.equal(
    GAME_THEMES.FORTNITE.turntableVideo?.src,
    '/assets/aistudio/Generated_Video_November_19__2026_-_7_22PM_7c7ceebc.mp4'
  );

  assert.equal(GAME_THEMES.DOTA2.colors.primary, '#0EA5E9');
  assert.equal(GAME_THEMES.DOTA2.primaryCtaFa, 'ورود به درفت هیرو');
  assert.match(GAME_THEMES.DOTA2.fonts.display, /Cormorant Garamond/);
  assert.equal(
    GAME_THEMES.DOTA2.turntableVideo?.src,
    '/assets/aistudio/Generated_Video_November_19__2026_-_7_20PM_52aa0d65.mp4'
  );

  assert.equal(GAME_THEMES.F1.colors.primary, '#FF1E00');
  assert.equal(GAME_THEMES.F1.primaryCtaFa, 'ورود به پیت‌لین مسابقه');
  assert.match(GAME_THEMES.F1.fonts.display, /Rajdhani/);
  assert.equal(
    GAME_THEMES.F1.turntableVideo?.src,
    '/assets/aistudio/Generated_Video_November_19__2026_-_7_17PM_e04c8376.mp4'
  );

  assert.equal(GAME_THEMES.WARZONE.colors.primary, '#F59E0B');
  assert.equal(GAME_THEMES.WARZONE.primaryCtaFa, 'استقرار اسکواد در لابی');
  assert.match(GAME_THEMES.WARZONE.metrics[2].labelFa, /هر کیل ۱ امتیاز/);
  assert.equal(
    GAME_THEMES.WARZONE.turntableVideo?.src,
    '/assets/aistudio/Generated_Video_November_19__2026_-_7_08PM_3cc65f72.mp4'
  );

  assert.equal(GAME_THEMES.CS2.colors.primary, '#DE6B24');
  assert.equal(GAME_THEMES.CS2.primaryCtaFa, 'آماده ورود به مچ');
  assert.match(GAME_THEMES.CS2.fonts.display, /Teko/);
  assert.equal(
    GAME_THEMES.CS2.turntableVideo?.src,
    '/assets/aistudio/Generated_Video_November_19__2026_-_7_15PM_673d3703.mp4'
  );

  assert.equal(GAME_THEMES.GTA.colors.primary, '#EC4899');
  assert.equal(GAME_THEMES.GTA.primaryCtaFa, 'شروع عملیات کرو');
  assert.match(GAME_THEMES.GTA.fonts.display, /Bebas Neue/);
  assert.equal(
    GAME_THEMES.GTA.turntableVideo?.src,
    '/assets/aistudio/Generated_Video_November_19__2026_-_7_10PM_c43d137b.mp4'
  );

  assert.equal(GAME_THEMES.RDR2.colors.primary, '#B91C1C');
  assert.equal(GAME_THEMES.RDR2.primaryCtaFa, 'ورود به دوئل دسته');
  assert.match(GAME_THEMES.RDR2.fonts.display, /Cinzel/);
  assert.match(GAME_THEMES.RDR2.fonts.persianHeading, /Lalezar/);
  assert.equal(
    GAME_THEMES.RDR2.turntableVideo?.src,
    '/assets/aistudio/Generated_Video_November_19__2026_-_7_11PM_edf6640f.mp4'
  );

  assert.equal(GAME_THEMES.APEX.colors.primary, '#DA292A');
  assert.equal(GAME_THEMES.APEX.primaryCtaFa, 'آماده پرش (Drop)');
  assert.match(GAME_THEMES.APEX.fonts.display, /Orbitron/);
  assert.equal(
    GAME_THEMES.APEX.turntableVideo?.src,
    '/assets/aistudio/Generated_Video_November_19__2026_-_7_12PM_50a21d7a.mp4'
  );
});

test('getRosterCountDisplay updates Persian roster counts when an empty slot is filled', () => {
  const fcEmpty = getRosterCountDisplay(GAME_THEMES.FC27, {});
  assert.equal(fcEmpty.headerTextFa, 'باشگاه شما (۱۰ از ۱۱)');

  const fcFilled = getRosterCountDisplay(GAME_THEMES.FC27, { 'fc-gk': true });
  assert.equal(fcFilled.filled, 11);
  assert.equal(fcFilled.headerTextFa, 'باشگاه شما (۱۱ از ۱۱)');

  const apexEmpty = getRosterCountDisplay(GAME_THEMES.APEX, {});
  assert.equal(apexEmpty.headerTextFa, 'اسکواد شما (۲ از ۳)');
});

test('resolveTournamentGameFromLobby maps lobby ids to TournamentGameId cleanly', () => {
  assert.equal(resolveTournamentGameFromLobby('fc27'), 'FC27');
  assert.equal(resolveTournamentGameFromLobby('nba2k'), 'NBA2K');
  assert.equal(resolveTournamentGameFromLobby('fortnite'), 'FORTNITE');
  assert.equal(resolveTournamentGameFromLobby('dota2'), 'DOTA2');
  assert.equal(resolveTournamentGameFromLobby('f1'), 'F1');
  assert.equal(resolveTournamentGameFromLobby('cs2'), 'CS2');
  assert.equal(resolveTournamentGameFromLobby('gta'), 'GTA');
  assert.equal(resolveTournamentGameFromLobby('RDR2'), 'RDR2');
  assert.equal(resolveTournamentGameFromLobby('warzone'), 'WARZONE');
  assert.equal(resolveTournamentGameFromLobby('valorant'), 'APEX');
});
