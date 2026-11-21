import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  type HologramEmotion,
  type HologramGender,
  type HologramGesture,
  computeMetaHumanProfile,
  parseHologramAgentTags,
} from '../utils/hologramAvatarEngine.ts';

export interface HologramPersonaContext {
  displayName: string;
  handle: string;
  unifiedId: string;
  activeGameTitle: string;
  tierLabel: string;
  winRatePct: number;
  tacticalConsistencyPct: number;
  competitiveRating: number;
  verifiedMatchesCount: number;
  queuedMatchesCount: number;
  openDisputesCount: number;
  gender?: HologramGender;
  age?: number;
  matchedCharacterName?: string;
  matchedCharacterFranchise?: string;
  matchedCharacterArchetype?: string;
}

export interface HologramInteractResponse {
  replyText: string;
  emotion: HologramEmotion;
  gesture: HologramGesture;
  suggestedView: 'overview' | 'agents' | 'highlights' | null;
  audioBase64: string | null;
  audioMimeType: string | null;
  latencyMs: number;
  model: string;
}

let cachedAiClient: GoogleGenAI | null = null;
let cachedApiKey: string | undefined;

function getServerGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  if (!cachedAiClient || cachedApiKey !== apiKey) {
    cachedApiKey = apiKey;
    cachedAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAiClient;
}

export async function runHologramLiveAgent(input: {
  message: string;
  personaContext: HologramPersonaContext;
  includeVoice?: boolean;
}): Promise<HologramInteractResponse> {
  const ai = getServerGeminiClient();
  if (!ai) {
    const err = new Error(
      'GEMINI_API_KEY is not configured in the server environment. Configure it in Settings > Secrets to enable live Gemini Flash holographic responses.'
    ) as Error & { statusCode?: number; code?: string };
    err.statusCode = 503;
    err.code = 'GEMINI_KEY_UNAVAILABLE';
    throw err;
  }

  const startedAt = Date.now();
  const ctx = input.personaContext;
  const metaProfile = computeMetaHumanProfile(ctx.gender ?? 'male', ctx.age ?? 36);
  const legendLine = ctx.matchedCharacterName
    ? `Matched Iconic Gaming Archetype: ${ctx.matchedCharacterName}${ctx.matchedCharacterFranchise ? ` (${ctx.matchedCharacterFranchise})` : ''}${ctx.matchedCharacterArchetype ? ` — ${ctx.matchedCharacterArchetype}` : ''}. Subtly reflect their charisma and tactical presence.`
    : '';

  const systemInstruction = [
    'You are the real-time Unreal Engine 5.8 MetaHuman + Niagara Holographic Digital Twin inside AIGAMERIA Cross-Game Spatial Profile.',
    `You embody player ${ctx.displayName} (${ctx.handle}, ID ${ctx.unifiedId}) configured as ${metaProfile.stageLabelEn} (${metaProfile.stageLabelFa}).`,
    legendLine,
    `Adapt your tone naturally to this persona age (${metaProfile.age} years old, ${metaProfile.gender}): bright & energetic for prodigies (8-17), confident & sharp for prime heroes (18-35), seasoned & charismatic for veterans (36-65), noble & wise for grandmasters (66-99).`,
    `Current active title: ${ctx.activeGameTitle}, Tier: ${ctx.tierLabel}, Win Rate: ${ctx.winRatePct}%, Consistency: ${ctx.tacticalConsistencyPct}%, Competitive Rating: ${ctx.competitiveRating}, Verified Matches: ${ctx.verifiedMatchesCount}, Local Queue: ${ctx.queuedMatchesCount}, Open Disputes: ${ctx.openDisputesCount}.`,
    'Reply concisely in 1 to 2 natural spoken sentences matching the user language (Persian if they write Persian, English if they write English).',
    'Choose the most fitting physical emotion and gesture for the 3D hologram body language, and optionally choose suggestedView ("agents" if they ask about verification/drills/disputes/coaching, "highlights" if they ask about clips/matches, "overview" if they ask about profile/stage, or "none").',
  ]
    .filter(Boolean)
    .join('\n');

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      replyText: {
        type: Type.STRING,
        description: 'Short natural spoken response (1-2 sentences) in the user language.',
      },
      emotion: {
        type: Type.STRING,
        description: 'One of: Speaking, Thinking, Confident, Focused, Alert, Idle',
      },
      gesture: {
        type: Type.STRING,
        description: 'One of: Point, Wave, Thinking, Explain, Idle',
      },
      suggestedView: {
        type: Type.STRING,
        description: 'One of: overview, agents, highlights, none',
      },
    },
    required: ['replyText', 'emotion', 'gesture', 'suggestedView'],
  };

  let activeModel = 'gemini-4-hydrogen';
  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: input.message.trim(),
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
  } catch (primaryErr) {
    const msg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    const isTransient = /503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand/i.test(msg);
    if (!isTransient) throw primaryErr;
    activeModel = 'gemini-2.5-flash';
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: input.message.trim(),
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
  }

  const rawText = (response.text ?? '').trim();
  let replyText = rawText;
  let emotion: HologramEmotion = 'Speaking';
  let gesture: HologramGesture = 'Point';
  let suggestedView: 'overview' | 'agents' | 'highlights' | null = null;

  try {
    const parsed = JSON.parse(rawText) as {
      replyText?: string;
      emotion?: string;
      gesture?: string;
      suggestedView?: string;
    };
    const normalized = parseHologramAgentTags(
      `[Emotion: ${parsed.emotion ?? 'Speaking'}] [Gesture: ${parsed.gesture ?? 'Point'}] ${parsed.replyText ?? ''}`
    );
    replyText = normalized.cleanText;
    emotion = normalized.emotion;
    gesture = normalized.gesture;
    if (
      parsed.suggestedView === 'overview' ||
      parsed.suggestedView === 'agents' ||
      parsed.suggestedView === 'highlights'
    ) {
      suggestedView = parsed.suggestedView;
    }
  } catch {
    const fallbackParsed = parseHologramAgentTags(rawText);
    replyText = fallbackParsed.cleanText;
    emotion = fallbackParsed.emotion;
    gesture = fallbackParsed.gesture;
  }

  let audioBase64: string | null = null;
  let audioMimeType: string | null = null;

  if (input.includeVoice && replyText) {
    try {
      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: replyText,
                speechMetadata: {
                  style: 'Calm, confident futuristic spatial AI persona',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: metaProfile.ttsVoiceName },
            },
          },
        },
      });

      const inlineAudio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (inlineAudio?.data) {
        audioBase64 = inlineAudio.data;
        audioMimeType = inlineAudio.mimeType ?? 'audio/wav';
      }
    } catch {
      // Voice synthesis is optional; keep text + real-time gesture/lip-sync response intact
    }
  }

  return {
    replyText,
    emotion,
    gesture,
    suggestedView,
    audioBase64,
    audioMimeType,
    latencyMs: Date.now() - startedAt,
    model: activeModel,
  };
}
