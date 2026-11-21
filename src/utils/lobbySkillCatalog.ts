import type { RealmId } from '../types/spatial';

export type LobbyGameId = 'fc27' | 'cs2' | 'gta' | 'valorant';

export interface LobbyGameTab {
  id: LobbyGameId;
  label: string;
  catalogGameId: string;
  catalogGameName: string;
  realm: RealmId;
  accentHex: string;
}

export interface LobbyCategoryChip {
  id: string;
  labelFa: string;
}

export interface LobbySkillCardItem {
  id: string;
  num: string;
  gameId: LobbyGameId;
  topicId: string;
  titleFa: string;
  categoryId: string;
  categoryLabelFa: string;
  combos: string[];
  keywords: string[];
  problemQuery: string;
}

export const LOBBY_GAME_TABS: LobbyGameTab[] = [
  {
    id: 'fc27',
    label: 'FC 27',
    catalogGameId: 'fc27',
    catalogGameName: 'EA SPORTS FC 27',
    realm: 'sports',
    accentHex: '#10B981',
  },
  {
    id: 'cs2',
    label: 'CS2',
    catalogGameId: 'cs2',
    catalogGameName: 'Counter-Strike 2',
    realm: 'shooter',
    accentHex: '#22D3EE',
  },
  {
    id: 'gta',
    label: 'GTA',
    catalogGameId: 'gta',
    catalogGameName: 'GTA V / GTA VI Online',
    realm: 'story',
    accentHex: '#EC4899',
  },
  {
    id: 'valorant',
    label: 'Valorant',
    catalogGameId: 'valorant',
    catalogGameName: 'VALORANT',
    realm: 'shooter',
    accentHex: '#FF4655',
  },
];

export const LOBBY_CATEGORIES_BY_GAME: Record<LobbyGameId, LobbyCategoryChip[]> = {
  fc27: [
    { id: 'all', labelFa: 'همه' },
    { id: 'shoot', labelFa: 'شوت' },
    { id: 'defense', labelFa: 'دفاع' },
    { id: 'attack', labelFa: 'حمله' },
    { id: 'pass', labelFa: 'پاس' },
  ],
  cs2: [
    { id: 'all', labelFa: 'همه' },
    { id: 'aim', labelFa: 'ایم' },
    { id: 'smoke', labelFa: 'اسموک' },
    { id: 'peek', labelFa: 'پیک' },
    { id: 'clutch', labelFa: 'کلاچ' },
  ],
  gta: [
    { id: 'all', labelFa: 'همه' },
    { id: 'heist', labelFa: 'هایست' },
    { id: 'flank', labelFa: 'فلنک' },
    { id: 'cover', labelFa: 'کاور' },
    { id: 'escape', labelFa: 'فرار' },
  ],
  valorant: [
    { id: 'all', labelFa: 'همه' },
    { id: 'aim', labelFa: 'ایم' },
    { id: 'utility', labelFa: 'ابلیتی' },
    { id: 'peek', labelFa: 'پیک' },
    { id: 'defense', labelFa: 'دفاع' },
  ],
};

export const LOBBY_SKILLS_BY_GAME: Record<LobbyGameId, LobbySkillCardItem[]> = {
  fc27: [
    {
      id: 'fc27-01',
      num: '01',
      gameId: 'fc27',
      topicId: 'sp-break-press',
      titleFa: 'شکستن پرس سنگین ۴-۲-۳-۱',
      categoryId: 'attack',
      categoryLabelFa: 'تاکتیک حمله',
      combos: ['L1', 'R1', 'X', '4-2-3-1', '۴-۲-۳-۱'],
      keywords: ['پرس', 'حمله', 'تاکتیک', 'سوییچ', 'press', 'attack', '4231'],
      problemQuery: 'شکستن پرس سنگین ۴-۲-۳-۱',
    },
    {
      id: 'fc27-02',
      num: '02',
      gameId: 'fc27',
      topicId: 'sp-through-ball',
      titleFa: 'پاس عمقی دقیق (L1+R1+△)',
      categoryId: 'pass',
      categoryLabelFa: 'تکنیک پاس',
      combos: ['L1', 'R1', '△', 'L1+R1+△', 'triangle', 'مثلث'],
      keywords: ['پاس', 'عمقی', 'تروبال', 'فرار', 'through ball', 'pass'],
      problemQuery: 'پاس عمقی دقیق L1+R1+△',
    },
    {
      id: 'fc27-03',
      num: '03',
      gameId: 'fc27',
      topicId: 'sp-finesse-shot',
      titleFa: 'شوت کاتدار زمانبندی سبز',
      categoryId: 'shoot',
      categoryLabelFa: 'تکنیک شوت',
      combos: ['R1', '◯', 'R1+◯', 'circle', 'دایره', 'green timed'],
      keywords: ['شوت', 'کاتدار', 'فینس', 'زمانبندی', 'سبز', 'finesse', 'shot'],
      problemQuery: 'شوت کاتدار زمانبندی سبز',
    },
    {
      id: 'fc27-04',
      num: '04',
      gameId: 'fc27',
      topicId: 'sp-custom-tactics',
      titleFa: 'تنظیمات دفاعی و عمق ۷۱',
      categoryId: 'defense',
      categoryLabelFa: 'دفاع',
      combos: ['L2', 'R1', '71', '۷۱', 'jockey'],
      keywords: ['دفاع', 'عمق', 'تاکتیک', 'آفساید', 'تنظیمات', 'defense', 'depth'],
      problemQuery: 'تنظیمات دفاعی و عمق ۷۱',
    },
  ],
  cs2: [
    {
      id: 'cs2-01',
      num: '01',
      gameId: 'cs2',
      topicId: 'sh-recoil-strafe',
      titleFa: 'کانتر-استریف و وان‌تپ دقیق (A/D)',
      categoryId: 'aim',
      categoryLabelFa: 'ایم حرفه‌ای',
      combos: ['A/D', 'A', 'D', 'LMB', 'counter-strafe'],
      keywords: ['ایم', 'وان تپ', 'هدشات', 'کانتر استریف', 'ریکویل', 'aim', 'strafe'],
      problemQuery: 'کانتر استریف و وان تپ CS2',
    },
    {
      id: 'cs2-02',
      num: '02',
      gameId: 'cs2',
      topicId: 'sh-smoke-exec',
      titleFa: 'اسموک پنجره میراژ و ورود سایت A',
      categoryId: 'smoke',
      categoryLabelFa: 'تاکتیک اسموک',
      combos: ['Jumpthrow', 'Smoke', '4', 'Space'],
      keywords: ['اسموک', 'میراژ', 'پنجره', 'سایت', 'mirage', 'window', 'smoke'],
      problemQuery: 'اسموک پنجره میراژ CS2',
    },
    {
      id: 'cs2-03',
      num: '03',
      gameId: 'cs2',
      topicId: 'sh-sniper-peek',
      titleFa: 'جگل پیک و ضداسنایپر مید',
      categoryId: 'peek',
      categoryLabelFa: 'تکنیک پیک',
      combos: ['A-D', 'Q', 'AWP', 'Shift'],
      keywords: ['پیک', 'اسنایپر', 'جگل', 'مید', 'peek', 'jiggle', 'awp'],
      problemQuery: 'جگل پیک و ضد اسنایپر CS2',
    },
    {
      id: 'cs2-04',
      num: '04',
      gameId: 'cs2',
      topicId: 'sh-final-zone',
      titleFa: 'کلاچ ۱ به ۲ و مدیریت پست‌پلنت',
      categoryId: 'clutch',
      categoryLabelFa: 'تاکتیک کلاچ',
      combos: ['Shift', 'E', 'C4', 'Flash'],
      keywords: ['کلاچ', 'بمب', 'پست پلنت', 'راند آخر', 'clutch', 'post-plant'],
      problemQuery: 'کلاچ پست پلنت CS2',
    },
  ],
  gta: [
    {
      id: 'gta-01',
      num: '01',
      gameId: 'gta',
      topicId: 'st-stealth-heist',
      titleFa: 'فلنک سریع پنت‌هاوس (L2+R2+◯)',
      categoryId: 'flank',
      categoryLabelFa: 'تکنیک فلنک',
      combos: ['L2', 'R2', '◯', 'L2+R2+◯', 'roll'],
      keywords: ['فلنک', 'رول', 'پنت هاوس', 'حمله', 'flank', 'roll'],
      problemQuery: 'فلنک سریع پنت هاوس GTA',
    },
    {
      id: 'gta-02',
      num: '02',
      gameId: 'gta',
      topicId: 'st-boss-dodge',
      titleFa: 'کاور تاکتیکی و پیک سریع (R1)',
      categoryId: 'cover',
      categoryLabelFa: 'کاور و پیک',
      combos: ['R1', 'L2', 'cover', 'peek'],
      keywords: ['کاور', 'پیک', 'اسنایپر', 'دفاع', 'cover', 'r1'],
      problemQuery: 'کاور تاکتیکی و پیک سریع GTA',
    },
    {
      id: 'gta-03',
      num: '03',
      gameId: 'gta',
      topicId: 'st-build-craft',
      titleFa: 'مسیر مخفی هایست کازینو بدون آلارم',
      categoryId: 'heist',
      categoryLabelFa: 'استراتژی هایست',
      combos: ['L3', 'Stealth', 'EMP', 'Hacker'],
      keywords: ['هایست', 'کازینو', 'مخفی', 'آلارم', 'heist', 'casino', 'stealth'],
      problemQuery: 'هایست کازینو مخفی کاری GTA',
    },
    {
      id: 'gta-04',
      num: '04',
      gameId: 'gta',
      topicId: 'st-speedrun-route',
      titleFa: 'فرار حرفه‌ای از پلیس ۵ ستاره در تونل',
      categoryId: 'escape',
      categoryLabelFa: 'مسیر فرار',
      combos: ['R1', 'Handbrake', 'Nitro', 'Tunnel'],
      keywords: ['فرار', 'پلیس', 'پنج ستاره', 'تونل', 'دریفت', 'escape', 'police'],
      problemQuery: 'فرار از پلیس ۵ ستاره GTA',
    },
  ],
  valorant: [
    {
      id: 'val-01',
      num: '01',
      gameId: 'valorant',
      topicId: 'sh-recoil-strafe',
      titleFa: 'ددزنینگ و برست ۲ تیره وندال (A-D)',
      categoryId: 'aim',
      categoryLabelFa: 'ایم وندال',
      combos: ['A-D', 'LMB', 'Vandal', 'Deadzone'],
      keywords: ['ایم', 'وندال', 'برست', 'ددزنینگ', 'هدشات', 'vandal', 'deadzone', 'aim'],
      problemQuery: 'ددزنینگ و برست وندال Valorant',
    },
    {
      id: 'val-02',
      num: '02',
      gameId: 'valorant',
      topicId: 'sh-smoke-exec',
      titleFa: 'پاپ‌فلش و ورود سریع دوئلیست به سایت',
      categoryId: 'utility',
      categoryLabelFa: 'ابلیتی تیمی',
      combos: ['Q', 'E', 'C', 'Flash', 'Dash'],
      keywords: ['فلش', 'ابلیتی', 'دوئلیست', 'جت', 'اسموک', 'utility', 'flash', 'entry'],
      problemQuery: 'پاپ فلش و ورود دوئلیست Valorant',
    },
    {
      id: 'val-03',
      num: '03',
      gameId: 'valorant',
      topicId: 'sh-sniper-peek',
      titleFa: 'اسلایس پای و ضد اپراتور در لانگ',
      categoryId: 'peek',
      categoryLabelFa: 'زاویه‌گیری',
      combos: ['A/D', 'Shift', 'Jump-Peek', 'Operator'],
      keywords: ['پیک', 'اسلایس', 'اپراتور', 'لانگ', 'peek', 'slice', 'operator'],
      problemQuery: 'اسلایس پای و ضد اپراتور Valorant',
    },
    {
      id: 'val-04',
      num: '04',
      gameId: 'valorant',
      topicId: 'sh-final-zone',
      titleFa: 'ری‌تیک هماهنگ و نگه داشتن کراس‌فایر',
      categoryId: 'defense',
      categoryLabelFa: 'دفاع سایت',
      combos: ['Crossfire', 'Smoke', 'Defuse', '4'],
      keywords: ['دفاع', 'ری تیک', 'کراس فایر', 'سایت', 'defense', 'retake', 'crossfire'],
      problemQuery: 'ری تیک و کراس فایر Valorant',
    },
  ],
};

const PERSIAN_DIGIT_MAP: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

export function normalizeLobbySearchText(value: string): string {
  return value
    .replace(/[۰-۹٠-٩]/g, (ch) => PERSIAN_DIGIT_MAP[ch] ?? ch)
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/‌/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function resolveLobbyGameFromAppState(
  selectedGameId: string,
  activeRealm: RealmId
): LobbyGameId {
  const norm = selectedGameId.trim().toLowerCase();
  if (norm === 'fc27') return 'fc27';
  if (norm === 'cs2') return 'cs2';
  if (norm === 'gta') return 'gta';
  if (norm === 'valorant') return 'valorant';
  if (activeRealm === 'shooter') return 'cs2';
  if (activeRealm === 'story') return 'gta';
  return 'fc27';
}

export function getLobbyGameTab(gameId: LobbyGameId): LobbyGameTab {
  return LOBBY_GAME_TABS.find((tab) => tab.id === gameId) ?? LOBBY_GAME_TABS[0];
}

export function filterLobbySkills(
  gameId: LobbyGameId,
  categoryId: string,
  searchQuery: string
): LobbySkillCardItem[] {
  const skills = LOBBY_SKILLS_BY_GAME[gameId] ?? LOBBY_SKILLS_BY_GAME.fc27;
  const normalizedQuery = normalizeLobbySearchText(searchQuery);

  return skills.filter((skill) => {
    if (categoryId && categoryId !== 'all' && skill.categoryId !== categoryId) {
      return false;
    }
    if (!normalizedQuery) return true;

    const haystack = normalizeLobbySearchText(
      [
        skill.num,
        skill.titleFa,
        skill.categoryLabelFa,
        ...skill.combos,
        ...skill.keywords,
      ].join(' ')
    );

    const tokens = normalizedQuery.split(' ').filter(Boolean);
    return tokens.every((token) => haystack.includes(token));
  });
}
