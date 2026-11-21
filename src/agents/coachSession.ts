import { computeCompositeDNA } from '../utils/aipetrosRules.ts';
import type { EcosystemState } from '../types/aipetros.ts';
import { topicsByRealm, type CoachKnowledgeTopic } from './coachKnowledge.ts';
import {
  buildEnglishQuery,
  gatherLiveWebIntel,
  type LiveIntelResult,
} from './liveWebIntel.ts';
import type { RealmId } from '../types/spatial.ts';
import {
  discoverRealCoachClips,
  type RealCoachClip,
} from '../services/realClipAgentService.ts';

/**
 * AIPETROS Professional Coach Session — one question, one complete class.
 * Every session ships 5 pro modules: finishing timing, optimal formation,
 * live player updates, last-match mistake review, and today's training plan.
 * Each module carries its own on-topic tutorial clips (score-filtered).
 */

export interface CoachSessionModule {
  id: string;
  titleFa: string;
  titleEn: string;
  linesFa: string[];
  linesEn: string[];
  stats: Array<{ labelFa: string; labelEn: string; value: number; max: number }>;
  clips: RealCoachClip[];
  sources: Array<{ title: string; url: string; source: string }>;
}

export interface CoachSession {
  gameId: string;
  gameName: string;
  realm: RealmId;
  query: string;
  generatedAtIso: string;
  isFa: boolean;
  telemetry: {
    ovr: number;
    strongest: { name: string; val: number };
    weakest: { name: string; val: number };
    lastMatch: { opponent: string; result: string; score: string; metrics: string } | null;
  };
  modules: CoachSessionModule[];
}

const CLIP_CACHE_TTL_MS = 10 * 60 * 1000;
const sessionCache = new Map<string, { at: number; session: CoachSession }>();

export function clearCoachSessionCache(): void {
  sessionCache.clear();
}

function isFaQuery(query: string): boolean {
  return /[\u0600-\u06FF]/.test(query);
}

/* ---------------- Module clip discovery (per-module, on-topic) ---------------- */

async function discoverModuleClips(
  gameId: string,
  gameName: string,
  realm: RealmId,
  moduleQuery: string,
  fetcher: typeof fetch
): Promise<RealCoachClip[]> {
  try {
    const result = await discoverRealCoachClips(
      { gameId, gameName, realm, userQuery: moduleQuery },
      { fetcher }
    );
    const fresh = result.clips.filter((c) => c.youtubeId && !c.youtubeId.startsWith('fallback'));
    return fresh.slice(0, 3);
  } catch {
    return [];
  }
}

/* ---------------- Module 4: real mistake review from telemetry ---------------- */

function buildMistakeReview(state: EcosystemState, isFa: boolean): {
  linesFa: string[];
  linesEn: string[];
  stats: CoachSessionModule['stats'];
} {
  const { profile, matches } = state;
  const dna = profile.skillDNA;
  const latest = matches[0];
  const recent = matches.slice(0, 5);
  const wins = recent.filter((m) => m.result === 'win').length;

  // Deterministic mistake extraction from the metrics summary + DNA
  const metrics = latest?.metricsSummary ?? '';
  const possession = Number(metrics.match(/(\d{1,3})% ?Poss/i)?.[1] ?? 0);
  const passAcc = Number(metrics.match(/(\d{1,3})% ?Pass/i)?.[1] ?? 0);
  const xg = Number(metrics.match(/([\d.]+) ?xG/i)?.[1] ?? 0);

  const linesFa: string[] = [];
  const linesEn: string[] = [];
  if (latest) {
    linesFa.push(`بازی آخر: ${latest.result === 'win' ? 'برد' : latest.result === 'loss' ? 'باخت' : 'تساوی'} ${latest.scoreDisplay} مقابل ${latest.opponent}.`);
    linesEn.push(`Last match: ${latest.result} ${latest.scoreDisplay} vs ${latest.opponent}.`);
    if (possession >= 55 && xg > 0 && xg < 1.5) {
      linesFa.push('اشتباه اصلی: مالکیت بالا ولی خطر کم — تو حرفت تو محوطه جا خالی نمی‌سازی؛ ۲-۱-۲ پرس را با یک پاس عمقی بشکن.');
      linesEn.push('Main mistake: high possession, low danger — no box occupation; break the block with one through ball.');
    }
    if (passAcc > 0 && passAcc < 82) {
      linesFa.push(`دقت پاس ${passAcc}٪ پایینه — پاس‌های عرضی ریسکی رو حذف کن؛ رو به جلو با موس بزن نه با فشار.`);
      linesEn.push(`Pass accuracy ${passAcc}% is low — cut risky sideways passes; play forward with patience.`);
    }
    if (latest.result === 'loss') {
      linesFa.push('باخت: اولین گل رو دیر خوردی؟ ۱۵ دقیقه اول رو با خط دفاع ۴۵ مدیریت کن تا ریتم نگیری.');
      linesEn.push('Loss: concede early? Manage the first 15 minutes with a 45 line before committing.');
    }
    if (dna.riskDiscipline < 80) {
      linesFa.push(`ریسک دیسیپلین ${dna.riskDiscipline}/100 ضعیف‌ترین محورته — قبل از هر پاس تو محوطه خودی، چک ۳‌زاویه‌ای کن.`);
      linesEn.push(`Risk discipline ${dna.riskDiscipline}/100 is your weakest axis — 3-angle check before deep passes.`);
    }
  } else {
    linesFa.push('بازی تاییدشده‌ای ثبت نشده — یک بازی آنلاین رو با اسکرین‌شات بفرست تا تحلیل دقیق بدم.');
    linesEn.push('No verified matches yet — send one online match screenshot for a precise review.');
  }
  if (recent.length) {
    linesFa.push(`روند ۵ بازی: ${wins} برد — ${wins >= 3 ? 'ریتم خوبه، روی جزئیات فینیش تمرکز کن.' : 'فرم نوسانیه، اول ریتم ورودی رو درست کن.'}`);
    linesEn.push(`Last 5: ${wins}W — ${wins >= 3 ? 'good rhythm, polish finishing.' : 'inconsistent form, fix input rhythm first.'}`);
  }
  return {
    linesFa,
    linesEn,
    stats: [
      { labelFa: 'مالکیت', labelEn: 'Possession', value: possession || 50, max: 100 },
      { labelFa: 'دقت پاس', labelEn: 'Pass accuracy', value: passAcc || 85, max: 100 },
      { labelFa: 'xG', labelEn: 'xG', value: Math.round((xg || 1.2) * 100), max: 400 },
    ],
  };
}

/* ---------------- Module builders from the knowledge base ---------------- */

function kbLines(topics: CoachKnowledgeTopic[], isFa: boolean): { linesFa: string[]; linesEn: string[] } {
  const linesFa = topics.flatMap((t) => t.lessonsFa.slice(0, 3));
  const linesEn = topics.flatMap((t) => t.lessonsEn.slice(0, 3));
  return { linesFa, linesEn };
}

function fmtPatchLines(intel: LiveIntelResult, isFa: boolean): string[] {
  return intel.sources
    .filter((s) => s.source === 'steamnews' || s.source === 'reddit')
    .slice(0, 3)
    .map((s) => `${s.title} — ${s.snippet.slice(0, 110)}`);
}

/* ---------------- Main session builder ---------------- */

export async function buildCoachSession(
  input: {
    gameId: string;
    gameName?: string;
    realm: RealmId;
    query?: string;
  },
  options: { state: EcosystemState; fetcher?: typeof fetch; force?: boolean }
): Promise<CoachSession> {
  const realm = input.realm;
  const gameId = input.gameId;
  const gameName = input.gameName ?? gameId.toUpperCase();
  const query = (input.query ?? '').trim();
  const isFa = query ? isFaQuery(query) : true;
  const state = options.state;
  const started = Date.now();

  const cacheKey = `${gameId}:${realm}:${query.toLowerCase()}`;
  const cached = sessionCache.get(cacheKey);
  if (!options.force && cached && Date.now() - cached.at < CLIP_CACHE_TTL_MS) {
    return cached.session;
  }

  const fetcher = options.fetcher ?? globalThis.fetch;
  const dna = state.profile.skillDNA;
  const ovr = computeCompositeDNA(dna);
  const axes = [
    { name: 'Spatial Passing', val: dna.spatialPassing },
    { name: 'Tactical Vision', val: dna.tacticalVision },
    { name: 'Trap Anticipation', val: dna.trapAnticipation },
    { name: 'Endgame Composure', val: dna.endgameComposure },
    { name: 'Tempo Control', val: dna.tempoControl },
    { name: 'Risk Discipline', val: dna.riskDiscipline },
  ].sort((a, b) => a.val - b.val);
  const weakest = axes[0];
  const strongest = axes[axes.length - 1];
  const latest = state.matches[0];

  const kbTopics = topicsByRealm(realm);
  const queryEn = query ? buildEnglishQuery(query) : '';

  // Live intel + per-module clips, all in parallel
  const [intel, finishingClips, formationClips, updatesClips, mistakesClips, trainingClips] =
    await Promise.all([
      gatherLiveWebIntel(`${query || gameName} update meta players`, { gameName: realm === 'sports' ? 'EA SPORTS FC 27' : gameName, fetcher }),
      discoverModuleClips(gameId, gameName, realm, `${gameName} shooting timing green window tutorial`, fetcher),
      discoverModuleClips(gameId, gameName, realm, `${gameName} best formation custom tactics guide`, fetcher),
      discoverModuleClips(gameId, gameName, realm, `${gameName} best players meta after update`, fetcher),
      discoverModuleClips(gameId, gameName, realm, `${gameName} common mistakes beginners avoid`, fetcher),
      discoverModuleClips(gameId, gameName, realm, `${gameName} training drills improve fast`, fetcher),
    ]);

  const patchLines = fmtPatchLines(intel, isFa);
  const mistakeReview = buildMistakeReview(state, isFa);
  const finishingTopics = kbTopics.filter((t) => /finish|shot|finishing|sp-finishing/.test(t.id) || t.keywords.some((k) => /شوت|فینس/.test(k)));
  const formationTopics = kbTopics.filter((t) => /formation|tactic|press/.test(t.id));
  const trainingTopics = kbTopics.filter((t) => t.drills.length > 0).slice(0, 2);

  const modules: CoachSessionModule[] = [
    {
      id: 'finishing',
      titleFa: '⚽ شوت‌زنی حرفه‌ای — کی و چطور',
      titleEn: '⚽ Pro finishing — when & how',
      linesFa: [
        ...(finishingTopics.length ? finishingTopics.flatMap((t) => t.lessonsFa.slice(0, 2)) : kbLines(kbTopics.slice(0, 1), isFa).linesFa),
        'قدرت شوت: نوار ۲-۳ سلول کافیه؛ پرکردن کامل = توپ بلند و بی‌دقت.',
        'فینس شوت: زاویه ۴۵ درجه داخل محوطه + زمان‌بندی سبز = بالاترین تبدیل.',
        'اولین تاچ رو کنترل کن، تاچ دوم شوت — شوت با اولین تاچ فقط وقتی دروازه‌باز باشه.',
      ],
      linesEn: [
        'Power: 2-3 bars is enough; full power = wild miss.',
        'Finesse: 45° inside the box + green timing = best conversion.',
        'Control first touch, shoot second touch — first-touch shots only on open goal.',
      ],
      stats: [{ labelFa: 'دقت فینیش تو', labelEn: 'Your finishing', value: dna.trapAnticipation, max: 100 }],
      clips: finishingClips,
      sources: intel.sources.filter((s) => /shoot|finish|goal/i.test(s.title)).slice(0, 2),
    },
    {
      id: 'formation',
      titleFa: '🧩 بهترین ترکیب و نقش‌ها',
      titleEn: '🧩 Best formation & roles',
      linesFa: [
        ...(formationTopics.length ? formationTopics.flatMap((t) => t.lessonsFa.slice(0, 2)) : []),
        'انتخاب بر اساس تیم تو: مهره‌های قوی وسط → 4-2-3-1؛ وینگ‌های سریع → 4-3-3؛ دفاع فشرده → 4-2-1-3.',
        'نقش‌ها: CDM باید بهترین بازیکن دفاعی باشه؛ CAM نزدیک‌ترین به استایل تو.',
        'پرس بعد از پاس عرضی فعال بشه، نه همه‌جا — مهم‌ترین تنظیم متا فعلی.',
      ],
      linesEn: [
        'Pick by your squad: strong central mids → 4-2-3-1; fast wingers → 4-3-3; compact block → 4-2-1-3.',
        'Roles: your best defensive player must be the CDM; CAM matches your style.',
        'Press after sideways passes only — the single most important current meta setting.',
      ],
      stats: [{ labelFa: 'بینش تاکتیکی تو', labelEn: 'Tactical vision', value: dna.tacticalVision, max: 100 }],
      clips: formationClips,
      sources: intel.sources.filter((s) => /formation|tactic/i.test(s.title + s.snippet)).slice(0, 2),
    },
    {
      id: 'player-updates',
      titleFa: '📈 آپدیت‌های بازیکن و متا — همین حالا',
      titleEn: '📈 Player updates & meta — right now',
      linesFa: patchLines.length
        ? [
            ...patchLines,
            'بعد از هر پچ: قیمت بازیکن‌های متا ۲۴ ساعت اول بالا می‌ره — قبل از خرید صبر کن.',
            'کارت‌های untradeable رو نگه دار؛ برای SBC فقط لیگ کم‌مصرف خرج کن.',
          ]
        : [
            'اتصال زنده برقرار نشد — منابع آفلاین: بعد از هر پچ اول فیکس‌های دفاع/پرس رو چک کن.',
            'بازیکن‌های آپدیت‌شده با شتاب و فینیش بهتر رو برای متا اولویت بده.',
          ],
      linesEn: patchLines.length
        ? [...patchLines, 'After each patch, meta player prices spike 24h — wait before buying.', 'Keep untradeables; spend only cheap-league players in SBCs.']
        : ['Live feed unavailable — offline guidance: check defense/press fixes first after each patch.'],
      stats: [],
      clips: updatesClips,
      sources: intel.sources.slice(0, 4),
    },
    {
      id: 'mistakes',
      titleFa: '🔍 تحلیل اشتباهات بازی آخر (از دیتای واقعی تو)',
      titleEn: '🔍 Last-match mistake review (your real data)',
      linesFa: mistakeReview.linesFa,
      linesEn: mistakeReview.linesEn,
      stats: mistakeReview.stats,
      clips: mistakesClips,
      sources: [],
    },
    {
      id: 'training',
      titleFa: `🏋️ تمرین امروز — تمرکز روی ${isFa ? weakest.name : weakest.name} (${weakest.val}/100)`,
      titleEn: `🏋️ Today's training — focus: ${weakest.name} (${weakest.val}/100)`,
      linesFa: [
        ...trainingTopics.flatMap((t) => t.drills.map((d) => `${d}: ${t.titleFa} — ${t.lessonsFa[0].slice(0, 80)}…`)),
        '۵ دقیقه warmup ایستگاه آزاد → ۲۰ دقیقه دریل هدفمند روی ضعیف‌ترین محور → ۵ دقیقه مرور باخت‌ها.',
        'هر روز فقط ۱ محور؛ تغییر روزانه = هیچ‌چیز فیکس نمی‌شه.',
      ],
      linesEn: [
        '5-min free warmup → 20-min targeted drill on the weakest axis → 5-min loss review.',
        'One axis per day; daily switching fixes nothing.',
      ],
      stats: [{ labelFa: 'OVR کل تو', labelEn: 'Overall OVR', value: ovr, max: 100 }],
      clips: trainingClips,
      sources: [],
    },
  ];

  const session: CoachSession = {
    gameId,
    gameName,
    realm,
    query,
    generatedAtIso: new Date().toISOString(),
    isFa,
    telemetry: {
      ovr,
      strongest: { name: strongest.name, val: strongest.val },
      weakest: { name: weakest.name, val: weakest.val },
      lastMatch: latest
        ? { opponent: latest.opponent, result: latest.result, score: latest.scoreDisplay, metrics: latest.metricsSummary }
        : null,
    },
    modules,
  };
  sessionCache.set(cacheKey, { at: Date.now(), session });
  return session;
}
