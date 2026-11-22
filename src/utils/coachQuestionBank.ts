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

/** Live suggestions: ranked matching questions (empty query → starter questions). */
export function suggestCoachQuestions(query: string, gameId: LobbyGameId, limit = 6): string[] {
  const bank = COACH_SAMPLE_QUESTIONS[gameId] ?? COACH_SAMPLE_QUESTIONS.fc27;
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return bank.slice(0, limit);
  const tokens = normalizedQuery.split(' ').filter(Boolean);
  const scored = bank
    .map((q) => {
      const hay = normalize(q);
      let score = 0;
      for (const token of tokens) if (hay.includes(token)) score += 1;
      return { q, score };
    })
    .filter((e) => e.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((e) => e.q);
}
