import type { LobbyGameId } from './lobbySkillCatalog';

/**
 * Real-question bank per game — powers the live suggestion box:
 * as the user types, matching questions surface automatically and are clickable.
 */

const COACH_SAMPLE_QUESTIONS: Record<LobbyGameId, string[]> = {
  fc27: [
    'بهترین ترکیب فرماسیون برای فشار بالاست؟',
    'کی شوت بزنم تا گل نگیره؟',
    'بهترین حالت درست کردن SBC چیه؟',
    'چه بازیکن‌هایی بعد از پچ آپدیت شدن؟',
    'دفاع عمق ۷۱ بهتره یا فشار ۸۰؟',
    'چطور پاس عمقی دقیق بدم؟',
    'فینس شوت از کجا بزنم؟',
    'بهترین استراتژی کرنر چیه؟',
    'پنالتی رو کجا بزنم که در نمیشه؟',
    'بهترین پلیرهای مترایال الان کیان؟',
    'چطور ضرب آزاد بزنم؟',
    'درrible دابل‌اسکیل چطور اجرا شه؟',
    'دقایق آخر چطور بازی رو مدیریت کنم؟',
    'بهترین کامبوی فانتزی برای میدان؟',
  ],
  cs2: [
    'چطور ایمم رو بهتر کنم؟',
    'کروس‌هیر کجا بذارم که سریع هدشات بزنم؟',
    'اکونومی روند درست چیه؟',
    'اسموک درست وسایت چطوری اجرا کنم؟',
    'کانتر-استرِیف دقیقاً چیه؟',
    'چطور پرس حریف رو بشکنم؟',
    'فلش‌شات تمرینش چیه؟',
    'دیفنس چطور ری‌تیک کنم؟',
    'پشت‌سر چطور دک می‌زنم که نمکشم؟',
    'بهترین اسلحه برای اکو راند؟',
    'چطور ساید B رو دفاع کنم؟',
    'گرنید لیاین نقطه درست چیه؟',
  ],
  valorant: [
    'بهترین لوداوت ویکچر برای سایت A؟',
    'اسموک هایندر چطوری بندازم؟',
    'سایت A اتک چطور اجرا شه؟',
    'ایم ترینگ روزانه چیه؟',
    'اکونومی راند چطور مدیریت شه؟',
    'بهترین ایجنت برای دیفنس کدومه؟',
    'چطور کلانچ رو برنده شم؟',
    'فلش لاین درست کجاست؟',
    'چطور پشت اسپایک پنچ کنم؟',
    'ببهترین استراتژی راند آخر؟',
  ],
  gta: [
    'هیست کاسینو چطوری انجام بدم؟',
    'چطور سریع پول جمع کنم؟',
    'بهترین راننده برای مأموریت؟',
    'کجا پناه بگیرم وقتی ۵ ستاره شدم؟',
    'بهترین ماشین برای تعقیب؟',
    'مأموریت VIP چطور شروع کنم؟',
    'چطور تو دیفنس هیست زنده بمونم؟',
    'بهترین استراتژی تعقیب پلیس؟',
  ],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064A\u0649]/g, 'ی')
    .replace(/[\u0643]/g, 'ک')
    .replace(/[\u200c\u200f\u200e]/g, ' ')
    .replace(/[؟?.,،!!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Live suggestions: forgiving near-match (typing anything shows close questions).
 *  If the typed words directly hit ANOTHER game's bank (e.g. «فرماسیون» while in shooter),
 *  that game's questions win — the user is clearly asking about that domain. */
export function suggestCoachQuestions(query: string, gameId: LobbyGameId, limit = 6): string[] {
  const bank = COACH_SAMPLE_QUESTIONS[gameId] ?? COACH_SAMPLE_QUESTIONS.fc27;
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return bank.slice(0, limit);
  const tokens = normalizedQuery.split(' ').filter(Boolean);
  const rank = (list: string[]) => {
    const scored = list
      .map((q) => {
        const hay = normalize(q);
        let score = 0;
        for (const token of tokens) {
          if (hay.includes(token)) score += 3;             // direct word hit
          else if (hay.split(' ').some((w) => w.startsWith(token.slice(0, Math.max(2, token.length - 1))) || token.startsWith(w.slice(0, 3)))) score += 1; // near/partial
        }
        return { q, score, direct: score >= 3 };
      })
      .filter((e) => e.score > 0);
    scored.sort((a, b) => b.score - a.score);
    return scored;
  };
  const local = rank(bank);
  if (local.some((e) => e.direct)) return local.slice(0, limit).map((e) => e.q);
  // cross-game: another game's bank has direct word hits
  const otherGames = (Object.keys(COACH_SAMPLE_QUESTIONS) as LobbyGameId[]).filter((g) => g !== gameId);
  for (const g of otherGames) {
    const cross = rank(COACH_SAMPLE_QUESTIONS[g]);
    if (cross.some((e) => e.direct)) return cross.slice(0, limit).map((e) => e.q);
  }
  if (local.length > 0) return local.slice(0, limit).map((e) => e.q);
  return bank.slice(0, limit); // off-topic → still show near suggestions
}
