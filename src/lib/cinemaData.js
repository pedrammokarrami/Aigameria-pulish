/**
 * AIPETROS — Cinema & TV Hub data layer.
 * Categories, floating-island environments, 50+ cinematic personas,
 * underground club seed content, stream/telegram helpers.
 */

/* ------------------------------------------------------------------ */
/*  1. Categories — five floating 3D islands                           */
/* ------------------------------------------------------------------ */

export const CATEGORIES = [
  {
    id: 'film',
    fa: 'فیلم سینمایی',
    en: 'CINEMATIC FILM',
    env: '/cinama/room3d/Camera_orbiting_floating_theater…_790162cd_1080p.mp4',
    mood: 'سالن نوآر کلاسیک · نور پروژکتور · باران',
    palette: { rim: '240, 169, 56', accent: '#f0a938' }, // amber noir
    islandPos: [-4.6, 0.4, 0.6],
    islandRot: 0.35,
  },
  {
    id: 'series',
    fa: 'سریال',
    en: 'SERIES',
    env: '/cinama/room3d/Desert_motel_and_RV_laboratory_32cee182_1080p.mp4',
    mood: 'اتاق مانیتورینگ جنایی · صحرای خشن',
    palette: { rim: '205, 133, 84', accent: '#cd8554' }, // gritty rust
    islandPos: [4.6, -0.5, -0.8],
    islandRot: -0.3,
  },
  {
    id: 'anime',
    fa: 'انیمه',
    en: 'ANIME',
    env: '/cinama/room3d/Tokyo_alleyway_diorama_orbiting_98aba98d_1080p.mp4',
    mood: 'کوچه توکیو · باران · فانوس‌های اتمسفریک',
    palette: { rim: '235, 130, 160', accent: '#eb82a0' }, // lantern rose
    islandPos: [0, 1.4, -4.6],
    islandRot: 0.12,
  },
  {
    id: 'documentary',
    fa: 'مستند',
    en: 'DOCUMENTARY',
    env: '/cinama/room3d/Floating_urban_diorama_in_night_bbd59ffd_1080p.mp4',
    mood: 'طبیعت وحشی در مه · دوریان بی‌رحم',
    palette: { rim: '150, 178, 150', accent: '#96b296' }, // fog sage
    islandPos: [-3.2, -1.5, -3.4],
    islandRot: -0.2,
  },
  {
    id: 'tv',
    fa: 'تلویزیون و کلایمکس',
    en: 'TV / CLIMAX',
    env: '/cinama/room3d/Floating_television_studio_diora…_5f71d8cf_1080p.mp4',
    mood: 'استودیوی رترو دهه ۸۰ · دیوار CRT',
    palette: { rim: '190, 120, 120', accent: '#be7878' }, // warm CRT crimson
    islandPos: [3.4, 1.8, 3.2],
    islandRot: 0.5,
  },
]

/* ------------------------------------------------------------------ */
/*  2. Persona system — 50+ cinematic identities (age 8..99)           */
/* ------------------------------------------------------------------ */

export const TASTES = [
  { id: 'noir', fa: 'نوآر' },
  { id: 'epic', fa: 'حماسی' },
  { id: 'mindbend', fa: 'ذهن‌درگیر' },
  { id: 'slowburn', fa: 'آهسته و عمیق' },
  { id: 'slice', fa: 'روزمره واقعی' },
  { id: 'shonen', fa: 'شونن پرقوّه' },
  { id: 'nature', fa: 'طبیعت وحشی' },
  { id: 'retro', fa: 'رترو آنالوگ' },
  { id: 'hardcore', fa: 'خشن و بی‌رحم' },
  { id: 'poetic', fa: 'شاعرانه' },
]

export const GENDERS = [
  { id: 'any', fa: 'مهم نیست' },
  { id: 'male', fa: 'مرد' },
  { id: 'female', fa: 'زن' },
]

const P = (fa, en, roles, minAge, maxAge, gender, tastes, desc) => ({
  fa, en, roles, minAge, maxAge, gender, tastes, desc,
})

export const PERSONAS = [
  P('آرشیویست', 'The Archivist', ['archive', 'curation'], 12, 99, 'any', ['noir', 'retro', 'poetic'], 'نگهبان سلولوئید؛ هر فریم برای او یک سند تاریخی است.'),
  P('تحلیل‌گر فریم', 'Frame Analyst', ['analysis'], 14, 99, 'any', ['mindbend', 'slowburn'], 'کادر به کادر می‌بیند؛ میزانسن برای او زبان است.'),
  P('منتقد زیرزمینی', 'Underground Critic', ['criticism'], 16, 99, 'any', ['hardcore', 'mindbend'], 'از استخرها و شبکه‌های زیرزمینی نقد می‌نویسد.'),
  P('پروژکسیونيست شب', 'Night Projectionist', ['operations'], 18, 99, 'any', ['noir', 'retro'], 'چراغ اتاق فرست را همیشه خاموش نگه می‌دارد.'),
  P('شکارچی اسپویلر', 'Spoil Hunter', ['community'], 10, 60, 'any', ['mindbend', 'shonen'], 'تئوری‌ها را زودتر از همه می‌بوید.'),
  P('مورخ سریال', 'Serial Historian', ['archive', 'analysis'], 15, 99, 'any', ['slowburn', 'slice'], 'قوس‌های روایی چندفصلی را مثل نقشه می‌خواند.'),
  P('اوترودو سینما', 'Cinema Outro', ['criticism', 'curation'], 20, 99, 'any', ['poetic', 'slowburn'], 'عاشق سکوت پایانی و نوار سیاه آخر.'),
  P('مسترپایک', 'Masterpike', ['curation'], 22, 99, 'male', ['epic', 'hardcore'], 'غول کات‌های حماسی و مونتاژ نبرد.'),
  P('بانوی نوآر', 'Noir Dame', ['curation', 'criticism'], 18, 99, 'female', ['noir', 'poetic'], 'سایه‌ی کلمنتی پنجره را از نور بهتر می‌شناسد.'),
  P('دوپلگت', 'The Double', ['community'], 13, 40, 'any', ['mindbend', 'hardcore'], 'شکاک به هر راویِ غیرقابل‌اعتماد.'),
  P('گارسون سالن', 'Usher Ghost', ['operations'], 8, 70, 'any', ['retro', 'poetic'], 'روح مهربان ردیف آخر؛ صدای جانه را می‌شناسد.'),
  P('بیدرد‌مان', 'Binge Warden', ['community'], 10, 50, 'any', ['slice', 'shonen'], 'شب تا صبح سشن می‌سازد؛ قهوه‌اش افسانه‌ای است.'),
  P('مستندنگار', 'Docu Scribe', ['analysis', 'curation'], 16, 99, 'any', ['nature', 'slowburn'], 'حقیقت را در کوه و مه جست‌وجو می‌کند.'),
  P('بیابانگرد', 'Dust Drifter', ['community'], 14, 80, 'any', ['hardcore', 'epic'], 'متل‌های صحرایی برایش کتاب مقدس است.'),
  P('کوهنورد قاب', 'Frame Alpinist', ['curation'], 12, 90, 'any', ['nature', 'poetic'], 'قله‌ها را در شات‌های واید می‌بیند.'),
  P('مه‌نورد', 'Fog Runner', ['community'], 10, 70, 'any', ['nature', 'mindbend'], 'در مه، جزئیات را بهتر از همه می‌بیند.'),
  P('انیمه‌شناس کهن', 'Senpai Canonist', ['archive', 'analysis'], 14, 99, 'any', ['shonen', 'poetic'], 'سکه‌های کمپانی را مثل شجره‌نامه حفظ است.'),
  P('توکویودیتی', 'Tokyodite', ['community'], 8, 45, 'any', ['shonen', 'slice'], 'کوچه‌های بارانی توکیو خانه‌ی دومش است.'),
  P('فانوس‌دار', 'Lantern Keeper', ['curation'], 10, 85, 'any', ['poetic', 'slice'], 'نور گرم فانوس را به نئون ترجیح می‌دهد.'),
  P('شینوبی سلیقه', 'Taste Shinobi', ['criticism'], 12, 60, 'any', ['shonen', 'hardcore'], 'سلیقه‌اش بی‌صدا و مرگبار است.'),
  P('شیماتسو', 'Shimatsu', ['analysis'], 16, 99, 'female', ['slice', 'poetic'], 'پنج‌فریمی که همه‌چیز را می‌گوید.'),
  P('کلکسیونر CRT', 'CRT Collector', ['archive', 'operations'], 18, 99, 'any', ['retro'], 'برایش فسفرگرین مقدس‌تر از ۴K است.'),
  P('دستکارچی آنالوگ', 'Analog Hand', ['operations'], 20, 99, 'male', ['retro', 'noir'], 'کانکتورها را با دست گرم می‌کند.'),
  P('گنجور شبکده', 'Late Night Buff', ['community'], 12, 75, 'any', ['retro', 'slice'], 'کلایمکس نیمه‌شبی است که او را بیدار نگه می‌دارد.'),
  P('کارگردان تماشاگر', 'Audience Auteur', ['analysis', 'community'], 14, 99, 'any', ['epic', 'poetic'], 'از صندلی، دوربینی می‌کند.'),
  P('تروریست پلات', 'Plot Terrorist', ['community', 'criticism'], 15, 65, 'any', ['mindbend', 'hardcore'], 'نظریه‌های توطئه‌ی روایی را مثل بمب می‌کارد.'),
  P('قطع‌کن گریه', 'Cry Cutter', ['community'], 8, 90, 'female', ['poetic', 'slice'], 'دقیقاً می‌داند کدام سکانس اشک می‌آورد.'),
  P('عقاب تایتل', 'Title Hawk', ['curation'], 10, 80, 'any', ['epic', 'noir'], 'تیتراژها را نمی‌پرد؛ می‌بلعد.'),
  P('ماتریانِ استودیو', 'Studio Matriarch', ['archive'], 30, 99, 'female', ['retro', 'epic'], 'حافظه‌ی زنده‌ی عصر طلایی.'),
  P('وسترن‌گاورنر', 'Westernward', ['curation'], 14, 95, 'male', ['epic', 'hardcore'], 'افق‌های کالبدی را می‌پرستد.'),
  P('جاسوس دوجانبه', 'Double Agent', ['community'], 14, 70, 'any', ['mindbend', 'hardcore'], 'همیشه دو تئوری موازی دارد.'),
  P('سگ نگهبان اسپویلر', 'Spoiler Hound', ['community'], 9, 50, 'male', ['mindbend', 'shonen'], 'شیپور اسپویلر را می‌دمد تا همه بدانند.'),
  P('رادیو درام', 'Radio Drama', ['operations'], 25, 99, 'any', ['retro', 'poetic'], 'صدا را به تصویر ترجیح می‌دهد.'),
  P('عکاس حساس', 'Stillness Photographer', ['curation', 'analysis'], 12, 99, 'any', ['poetic', 'nature'], 'هر فریم یک عکس ثابت است.'),
  P('موج‌سوار گیف', 'Gif Surfer', ['community'], 8, 35, 'any', ['shonen', 'slice'], 'لحظه‌های بازنشرشدنی را می‌جوید.'),
  P('دختر پشت‌صحنه', 'Backstage Girl', ['operations', 'community'], 10, 60, 'female', ['slice', 'poetic'], 'جهان را از پشت دوربین می‌فهمد.'),
  P('پیرمرد سالن چهار', 'House Four Elder', ['archive'], 55, 99, 'male', ['noir', 'retro'], 'پنجاه سال است ردیف چهار سالن چهار نشسته.'),
  P('بچه‌ی سینما', 'Cinema Kid', ['community'], 8, 14, 'any', ['shonen', 'epic'], 'اولین سینما برایش معبد است.'),
  P('مادربزرگ فیلم‌ها', 'Reel Grandmother', ['archive', 'curation'], 60, 99, 'female', ['poetic', 'retro'], 'ملودیم‌های قدیمی را با حوصله می‌چیند.'),
  P('منتقد دانشگاهی', 'Academic Critic', ['criticism', 'analysis'], 22, 99, 'any', ['mindbend', 'slowburn'], 'با فول‌نوت و سنجش نظری می‌بیند.'),
  P('برادر سکشن', 'Section Brother', ['operations'], 16, 70, 'male', ['hardcore', 'epic'], 'سالن‌های استخر و شبکه‌های موازی.'),
  P('دفترچی دیالوگ', 'Dialogue Clerk', ['archive'], 12, 90, 'any', ['slowburn', 'poetic'], 'جملات ماندگار را می‌نویسد و نگه می‌دارد.'),
  P('روزنویس تماشا', 'Watch Diarist', ['community'], 10, 85, 'female', ['slice', 'poetic'], 'هر شب یک سطر از تماشایش می‌نویسد.'),
  P('شب‌زنده‌دار', 'All-Nighter', ['community'], 16, 45, 'any', ['mindbend', 'hardcore'], 'برنامه‌ی خوابش را سینما تعیین می‌کند.'),
  P('سیاه‌پوش ژانر', 'Genre Mourner', ['criticism'], 18, 99, 'any', ['noir', 'hardcore'], 'برای ژانرهای مرده عزادار و نگهبان است.'),
  P('هوادار رنگ', 'Colorist Fan', ['analysis'], 12, 80, 'any', ['poetic', 'retro'], 'پالت را قبل از پلات دیده است.'),
  P('صدای باب‌سفر', 'Voice Voyager', ['curation'], 12, 90, 'any', ['epic', 'nature'], 'دوبله و گویندگی را نیمه‌ی دوم فیلم می‌داند.'),
  P('نبض مستقل', 'Indie Pulse', ['community', 'curation'], 16, 70, 'any', ['slice', 'poetic'], 'فیلم‌های مستقل را زودتر از جشنwareها می‌بیند.'),
  P('نگهبان اسپویل‌فری', 'Spoiler-Free Warden', ['community'], 10, 99, 'any', ['slice', 'epic'], 'از هر اسپویلر با دیوار دفاع می‌کند.'),
  P('تراریوم‌بد', 'Terrariumist', ['curation'], 14, 88, 'female', ['nature', 'slowburn'], 'طبیعت‌های کوچک را بزرگ می‌بیند.'),
  P('کمپ‌ساز', 'Camp Builder', ['community'], 12, 75, 'male', ['nature', 'epic'], 'هر مستند برایش یک برنامه‌ی کمپ است.'),
  P('رتیکال‌بد', 'Rectal-Analog', ['operations'], 30, 99, 'male', ['retro'], 'VHS بهش می‌گه ولی با افتخار.'),
  P('سین‌فیل چهارفصل', 'Cinephile Four Seasons', ['curation', 'analysis'], 20, 99, 'any', ['poetic', 'slowburn'], 'سال را با چهار سکانس می‌سنجد.'),
  P('پرتره‌ی شب', 'Night Portrait', ['criticism', 'curation'], 18, 99, 'female', ['noir', 'poetic'], 'چهره‌ها را در نور کم می‌شناسد.'),
]

export const ROLE_LABELS = {
  archive: 'آرشیو',
  curation: 'کیوریشن',
  analysis: 'تحلیل',
  criticism: 'نقد',
  community: 'کامیونیتی',
  operations: 'عملیات',
}

export function filterPersonas({ age, gender, tastes }) {
  return PERSONAS.filter((p) => {
    if (age != null && (age < p.minAge || age > p.maxAge)) return false
    if (gender && gender !== 'any' && p.gender !== 'any' && p.gender !== gender) return false
    if (tastes && tastes.length && !tastes.some((t) => p.tastes.includes(t))) return false
    return true
  })
}

/* ------------------------------------------------------------------ */
/*  3. Underground Social Club — seed content (Mr. Robot atmosphere)  */
/* ------------------------------------------------------------------ */

export const SEED_POSTS = [
  { id: 's1', author: 'f_society_04', tag: 'theory', text: 'کادر پایانی اپیزود ۷ یک قرینه‌ی کامل از سکانس افتتاحیه است. راوی از اول دروغ می‌گفت.', likes: 187, likedByMe: false, time: Date.now() - 1000 * 60 * 42 },
  { id: 's2', author: 'noir_dame', tag: 'review', text: 'نوآر جدید سالن شهر: نورپردازی ۱۰، فیلمنامه ۶. بارانِ صحنه‌ی بندر را دوباره ببینید.', likes: 96, likedByMe: false, time: Date.now() - 1000 * 60 * 90 },
  { id: 's3', author: 'crt_collector', tag: 'log', text: 'امشب کلایمکس را روی CRT واقعی ضبط کردم. فسفر گرین هیچ‌وقت پیر نمی‌شود.', likes: 143, likedByMe: false, time: Date.now() - 1000 * 60 * 150 },
  { id: 's4', author: 'tokyodite', tag: 'theory', text: 'فانوس قرمز در اپ ۳ سه بار تکرار شده. هیچ اتفاقی بی‌دلیل در این انیمه نیست.', likes: 74, likedByMe: false, time: Date.now() - 1000 * 60 * 220 },
]

export const SEED_STREAMS = [
  { id: 'st1', owner: 'archive_kid', title: 'ماراتن نوآر — شب دوم', url: '', likes: 312, likedByMe: false, live: true, time: Date.now() - 1000 * 60 * 30 },
  { id: 'st2', owner: 'fog_runner', title: 'استریم مستند مه‌آلود', url: '', likes: 98, likedByMe: false, live: false, time: Date.now() - 1000 * 60 * 300 },
]

export const TREND_DECAY_HALF_LIFE_MS = 1000 * 60 * 60 * 20 // 20h

/** Trending score: likes with exponential time decay (half-life), live boost. */
export function trendScore(item, now = Date.now()) {
  const age = Math.max(0, now - item.time)
  const decay = Math.pow(0.5, age / TREND_DECAY_HALF_LIFE_MS)
  const liveBoost = item.live ? 1.6 : 1
  return item.likes * (0.35 + 0.65 * decay) * liveBoost
}

export function sortByTrend(items) {
  const now = Date.now()
  return [...items].sort((a, b) => trendScore(b, now) - trendScore(a, now))
}
