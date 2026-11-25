import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ISO_639_1_CODES,
  getAllWorldLanguages,
  getWorldLanguageByCode,
  isRtlLanguageCode,
  searchWorldLanguages,
} from './worldLanguages';

test('loads full ISO 639-1 world languages catalog with English and native names', () => {
  const all = getAllWorldLanguages();
  assert.equal(all.length, ISO_639_1_CODES.length);
  assert.ok(all.length >= 180, 'Expected full world language catalog (180+ languages)');

  const fa = getWorldLanguageByCode('fa');
  assert.equal(fa.code, 'fa');
  assert.equal(fa.dir, 'rtl');
  assert.ok(fa.englishName.toLowerCase().includes('persian'));

  const ja = getWorldLanguageByCode('ja');
  assert.equal(ja.code, 'ja');
  assert.equal(ja.dir, 'ltr');
  assert.ok(ja.englishName.toLowerCase().includes('japanese'));
});

test('supports instant search across ISO codes, English names, and native scripts', () => {
  const byEnglish = searchWorldLanguages('persian');
  assert.ok(byEnglish.some((l) => l.code === 'fa'));

  const byNativePersian = searchWorldLanguages('فارسی');
  assert.ok(byNativePersian.some((l) => l.code === 'fa'));

  const byIsoCode = searchWorldLanguages('de');
  assert.equal(byIsoCode[0]?.code, 'de');

  const bySpanish = searchWorldLanguages('español');
  assert.ok(bySpanish.some((l) => l.code === 'es'));
});

test('accurately classifies RTL and LTR writing directions', () => {
  for (const rtl of ['fa', 'ar', 'he', 'ur', 'ps', 'ku']) {
    assert.equal(isRtlLanguageCode(rtl), true, `Expected ${rtl} to be RTL`);
  }
  for (const ltr of ['en', 'fr', 'de', 'es', 'ja', 'ko', 'zh', 'tr']) {
    assert.equal(isRtlLanguageCode(ltr), false, `Expected ${ltr} to be LTR`);
  }
});
