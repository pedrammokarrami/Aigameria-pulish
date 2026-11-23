import type { MasterHubId } from '../components/spatial/MasterHubSwitcher';

/**
 * Voice persona engine — Web Speech API only (open, built into the browser,
 * zero paid API). Three user-specified personas:
 *  • tacticalCoach — excited male voice (the " Ferguson style" tactician)
 *  • mapGuide      — calm, fully friendly female voice
 *  • uiHelper      — young male, playful tone
 *
 * Voice matching is heuristic: prefer a voice whose lang matches the app
 * language, then common female/male name patterns, then fall back to the
 * default voice with persona pitch/rate shaping.
 */

export type VoicePersonaId = 'tacticalCoach' | 'mapGuide' | 'uiHelper';

interface PersonaProfile {
  female: boolean;
  pitch: number;
  rate: number;
}

const PERSONAS: Record<VoicePersonaId, PersonaProfile> = {
  tacticalCoach: { female: false, pitch: 0.95, rate: 1.12 }, // energetic, commanding
  mapGuide: { female: true, pitch: 1.05, rate: 0.92 }, // calm, friendly
  uiHelper: { female: false, pitch: 1.25, rate: 1.18 }, // young, playful
};

const FEMALE_HINTS = /(female|woman|zira|hala|salma|samantha|victoria|karen|moira|tessa|fiona|susan|farida|google\s*(us|uk)?\s*english|amira|laila|zeina|maria)/i;
const MALE_HINTS = /(male|man|hamed|hamed|hendi|david|mark|daniel|alex|fred|george|maged|naayf|tarik|hamed|philip|rishi)/i;

function pickVoice(lang: string, female: boolean): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const langPrefix = lang.slice(0, 2).toLowerCase();
  const sameLang = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
  const pool = sameLang.length ? sameLang : voices;
  const genderMatch = pool.filter((v) =>
    female ? FEMALE_HINTS.test(v.name) : MALE_HINTS.test(v.name)
  );
  if (genderMatch.length) return genderMatch[0];
  return pool[0] ?? null;
}

/** Speak text with the given persona and app language. Fire-and-forget. */
export function speakWithPersona(
  persona: VoicePersonaId,
  text: string,
  lang: string,
  hub?: MasterHubId
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  if (!text?.trim()) return false;
  try {
    window.speechSynthesis.cancel();
    const profile = PERSONAS[persona];
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(lang || 'fa', profile.female);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || (lang || 'fa');
    // persona tone shaping on top of the matched voice
    utterance.pitch = Math.min(2, profile.pitch);
    utterance.rate = profile.rate;
    // subtle hub-flavored energy for the tactical coach
    if (persona === 'tacticalCoach' && hub === 'audio') utterance.pitch = Math.min(2, profile.pitch + 0.05);
    utterance.onend = () => window.speechSynthesis && (window.speechSynthesis as SpeechSynthesis).cancel.toString();
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
