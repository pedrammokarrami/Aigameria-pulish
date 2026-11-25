/**
 * Complete ISO 639-1 World Languages registry powered by the platform's
 * standard Intl.DisplayNames API — supports searching and selecting
 * every world language by English name, native endonym, or ISO code.
 */

export interface WorldLanguageOption {
  code: string;
  englishName: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

const RTL_LANGUAGE_CODES = new Set([
  'ar', // Arabic
  'dv', // Divehi
  'fa', // Persian
  'he', // Hebrew
  'ku', // Kurdish
  'ps', // Pashto
  'sd', // Sindhi
  'ug', // Uyghur
  'ur', // Urdu
  'yi', // Yiddish
]);

/** Full standard ISO 639-1 world language codes (184 languages). */
export const ISO_639_1_CODES: readonly string[] = [
  'aa', 'ab', 'ae', 'af', 'ak', 'am', 'an', 'ar', 'as', 'av', 'ay', 'az',
  'ba', 'be', 'bg', 'bi', 'bm', 'bn', 'bo', 'br', 'bs',
  'ca', 'ce', 'ch', 'co', 'cr', 'cs', 'cu', 'cv', 'cy',
  'da', 'de', 'dv', 'dz',
  'ee', 'el', 'en', 'eo', 'es', 'et', 'eu',
  'fa', 'ff', 'fi', 'fj', 'fo', 'fr', 'fy',
  'ga', 'gd', 'gl', 'gn', 'gu', 'gv',
  'ha', 'he', 'hi', 'ho', 'hr', 'ht', 'hu', 'hy', 'hz',
  'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'io', 'is', 'it', 'iu',
  'ja', 'jv',
  'ka', 'kg', 'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kv', 'kw', 'ky',
  'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv',
  'mg', 'mh', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my',
  'na', 'nb', 'nd', 'ne', 'ng', 'nl', 'nn', 'no', 'nr', 'nv', 'ny',
  'oc', 'oj', 'om', 'or', 'os',
  'pa', 'pi', 'pl', 'ps', 'pt',
  'qu',
  'rm', 'rn', 'ro', 'ru', 'rw',
  'sa', 'sc', 'sd', 'se', 'sg', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st', 'su', 'sv', 'sw',
  'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty',
  'ug', 'uk', 'ur', 'uz',
  've', 'vi', 'vo',
  'wa', 'wo',
  'xh',
  'yi', 'yo',
  'za', 'zh', 'zu',
];

export function isRtlLanguageCode(code: string): boolean {
  const base = code.trim().toLowerCase().split(/[-_]/)[0] ?? '';
  return RTL_LANGUAGE_CODES.has(base);
}

/** Standard English fallback names for ISO 639-1 codes sometimes omitted in minimal ICU builds. */
const FALLBACK_ENGLISH_NAMES: Record<string, string> = {
  aa: 'Afar',
  ab: 'Abkhazian',
  ae: 'Avestan',
  an: 'Aragonese',
  av: 'Avaric',
  ay: 'Aymara',
  ba: 'Bashkir',
  bi: 'Bislama',
  ch: 'Chamorro',
  co: 'Corsican',
  cr: 'Cree',
  cu: 'Church Slavic',
  cv: 'Chuvash',
  dv: 'Divehi',
  fj: 'Fijian',
  gn: 'Guarani',
  ho: 'Hiri Motu',
  ht: 'Haitian Creole',
  hz: 'Herero',
  ia: 'Interlingua',
  ie: 'Interlingue',
  ik: 'Inupiaq',
  io: 'Ido',
  iu: 'Inuktitut',
  kg: 'Kongo',
  kj: 'Kuanyama',
  kr: 'Kanuri',
  kv: 'Komi',
  la: 'Latin',
  li: 'Limburgish',
  mh: 'Marshallese',
  na: 'Nauru',
  ng: 'Ndonga',
  nr: 'South Ndebele',
  nv: 'Navajo',
  ny: 'Nyanja',
  oc: 'Occitan',
  oj: 'Ojibwa',
  pi: 'Pali',
  sc: 'Sardinian',
  sm: 'Samoan',
  ss: 'Swati',
  st: 'Southern Sotho',
  tl: 'Tagalog',
  tn: 'Tswana',
  ts: 'Tsonga',
  tw: 'Twi',
  ty: 'Tahitian',
  ve: 'Venda',
  vo: 'Volapük',
  wa: 'Walloon',
  za: 'Zhuang',
};

let cachedLanguages: WorldLanguageOption[] | null = null;

function safeDisplayName(locale: string, code: string): string | null {
  try {
    if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') {
      return null;
    }
    const dn = new Intl.DisplayNames([locale], { type: 'language' });
    const result = dn.of(code);
    if (!result || result.toLowerCase() === code.toLowerCase()) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

export function getAllWorldLanguages(): WorldLanguageOption[] {
  if (cachedLanguages) return cachedLanguages;

  const enNames =
    typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
      ? new Intl.DisplayNames(['en'], { type: 'language' })
      : null;

  const list: WorldLanguageOption[] = ISO_639_1_CODES.map((code) => {
    let englishName = FALLBACK_ENGLISH_NAMES[code] ?? code.toUpperCase();
    try {
      const resolved = enNames?.of(code);
      if (resolved && resolved.toLowerCase() !== code.toLowerCase()) {
        englishName = resolved;
      }
    } catch {
      // Fallback already populated
    }

    const nativeResolved = safeDisplayName(code, code);
    const nativeName = nativeResolved ?? englishName;

    return {
      code,
      englishName,
      nativeName,
      dir: isRtlLanguageCode(code) ? 'rtl' : 'ltr',
    };
  });

  // Sort alphabetically by English name for fast scannability
  list.sort((a, b) => a.englishName.localeCompare(b.englishName, 'en'));
  cachedLanguages = list;
  return list;
}

export function getWorldLanguageByCode(code: string): WorldLanguageOption {
  const normalized = code.trim().toLowerCase().split(/[-_]/)[0] || 'en';
  const match = getAllWorldLanguages().find((lang) => lang.code === normalized);
  if (match) return match;
  return {
    code: normalized,
    englishName: normalized.toUpperCase(),
    nativeName: normalized.toUpperCase(),
    dir: isRtlLanguageCode(normalized) ? 'rtl' : 'ltr',
  };
}

export function searchWorldLanguages(query: string): WorldLanguageOption[] {
  const all = getAllWorldLanguages();
  const q = query.trim().toLowerCase();
  if (!q) return all;

  const exactCode: WorldLanguageOption[] = [];
  const startsWithMatch: WorldLanguageOption[] = [];
  const containsMatch: WorldLanguageOption[] = [];

  for (const lang of all) {
    const code = lang.code.toLowerCase();
    const en = lang.englishName.toLowerCase();
    const native = lang.nativeName.toLowerCase();

    if (code === q) {
      exactCode.push(lang);
    } else if (en.startsWith(q) || native.startsWith(q) || code.startsWith(q)) {
      startsWithMatch.push(lang);
    } else if (en.includes(q) || native.includes(q)) {
      containsMatch.push(lang);
    }
  }

  return [...exactCode, ...startsWithMatch, ...containsMatch];
}
