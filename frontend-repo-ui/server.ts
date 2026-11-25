import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  normalizeRuntimeConfig,
  type HologramRuntimeConfig,
} from './src/modules/hologram/utils/hologramConfig';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const VIDEO_CACHE_TTL_SECONDS = 28800;
const ALLOWED_GEMINI_VOICES = new Set(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']);

interface CachedMediaRecord {
  gameId: string;
  skillId: string;
  title: string;
  url: string;
  kind: string;
  cachedAt: number;
  expiresAt: number;
}

interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

const serverVideoCache = new Map<string, CachedMediaRecord>();

function createGeminiClient(apiVersion?: string): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      ...(apiVersion ? { apiVersion } : {}),
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isRtlScript(text: string): 'fa' | 'ar' | null {
  const arabicScript = text.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g);
  if (!arabicScript || arabicScript.length === 0) return null;
  const persianSpecific = text.match(/[پچژگکی]/g);
  if (persianSpecific && persianSpecific.length > 0) return 'fa';
  if (/(مرحبا|أهلا|كيف|شكرا|العربية)/u.test(text)) return 'ar';
  return 'fa';
}

function buildInitialHologramConfig(): HologramRuntimeConfig {
  return normalizeRuntimeConfig({
    glbUrl: process.env.HOLOGRAM_GLB_URL || '/models/avatar.glb',
    backgroundUrl: process.env.HOLOGRAM_BG_URL || null,
    voice: {
      language: process.env.VOICE_LANGUAGE || 'auto',
      persianRegister: process.env.VOICE_PERSIAN_REGISTER || 'natural_spoken',
      gender: process.env.VOICE_GENDER || 'male',
      age: process.env.VOICE_AGE || 'middle_aged',
      tone: process.env.VOICE_TONE || 'tactical_serious',
      presetId: process.env.VOICE_PRESET || 'vanguard-ops',
      voiceName: process.env.VOICE_GEMINI_NAME || 'Fenrir',
      pitch: process.env.VOICE_PITCH ? Number(process.env.VOICE_PITCH) : 0.96,
      speed: process.env.VOICE_SPEED ? Number(process.env.VOICE_SPEED) : 1.0,
      expressiveness: process.env.VOICE_EXPRESSIVENESS
        ? Number(process.env.VOICE_EXPRESSIVENESS)
        : 0.62,
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  let hologramConfig: HologramRuntimeConfig = buildInitialHologramConfig();

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      app: 'AIGAMERIA',
      videoCacheTtlSeconds: VIDEO_CACHE_TTL_SECONDS,
    });
  });

  // --- Clean Live-API-Ready AIGAMERIA Endpoints (Zero Hardcoded Data) ---
  // Configure UPSTREAM_API_BASE_URL in .env to proxy to an external backend,
  // or set VITE_API_BASE_URL on the frontend to connect directly.
  const upstreamBase = (process.env.UPSTREAM_API_BASE_URL || '').replace(/\/+$/, '');

  async function proxyUpstreamOrEmpty(
    req: express.Request,
    res: express.Response,
    emptyPayload: unknown,
  ) {
    if (!upstreamBase) {
      return res.json(emptyPayload);
    }
    try {
      const targetUrl = `${upstreamBase}${req.originalUrl}`;
      const upstream = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(req.headers['accept-language']
            ? { 'Accept-Language': String(req.headers['accept-language']) }
            : {}),
          ...(req.headers.authorization
            ? { Authorization: String(req.headers.authorization) }
            : {}),
        },
      });
      if (upstream.status === 204 || upstream.status === 404) {
        return res.status(upstream.status).end();
      }
      const text = await upstream.text();
      res.status(upstream.status);
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      return res.send(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upstream API unreachable.';
      return res.status(502).json({ error: message });
    }
  }

  app.get('/api/aigameria/games', (req, res) =>
    proxyUpstreamOrEmpty(req, res, { games: [], categories: [] }),
  );

  app.get('/api/aigameria/skills', (req, res) =>
    proxyUpstreamOrEmpty(req, res, { skills: [] }),
  );

  app.get('/api/aigameria/skills/:skillId/stage', (req, res) =>
    proxyUpstreamOrEmpty(req, res, {
      gameId: '',
      skillId: String(req.params.skillId),
      stageCommand: null,
    }),
  );

  app.get('/api/aigameria/skills/:skillId/video', (req, res) =>
    proxyUpstreamOrEmpty(req, res, {
      gameId: '',
      skillId: String(req.params.skillId),
      video: null,
      ttlSeconds: VIDEO_CACHE_TTL_SECONDS,
    }),
  );

  app.get('/api/aigameria/skills/:skillId/controller', (req, res) =>
    proxyUpstreamOrEmpty(req, res, {
      gameId: '',
      skillId: String(req.params.skillId),
      sequences: null,
    }),
  );

  app.get('/api/aigameria/skills/:skillId/coaching', (req, res) =>
    proxyUpstreamOrEmpty(req, res, {
      gameId: '',
      skillId: String(req.params.skillId),
      summary: '',
      coachingSteps: [],
      quickPrompts: [],
    }),
  );

  // --- 8-Hour (28800s) TTL Video Cache Routes ---
  app.get('/api/video-cache/:gameId/:skillId', (req, res) => {
    const key = `${String(req.params.gameId).toLowerCase()}::${String(req.params.skillId).toLowerCase()}`;
    const record = serverVideoCache.get(key);
    const now = Date.now();
    if (!record || now >= record.expiresAt) {
      if (record) serverVideoCache.delete(key);
      return res.status(404).json({ ok: false, error: 'Cache miss or expired' });
    }
    const remainingSec = Math.max(0, Math.floor((record.expiresAt - now) / 1000));
    res.setHeader('Cache-Control', `public, max-age=${remainingSec}`);
    return res.json({
      ok: true,
      ttlSeconds: VIDEO_CACHE_TTL_SECONDS,
      remainingSeconds: remainingSec,
      record,
    });
  });

  app.post('/api/video-cache', (req, res) => {
    const { gameId, skillId, title, url, kind } = req.body ?? {};
    if (
      typeof gameId !== 'string' ||
      typeof skillId !== 'string' ||
      typeof title !== 'string' ||
      typeof url !== 'string'
    ) {
      return res.status(400).json({ ok: false, error: 'Invalid video cache payload.' });
    }
    const now = Date.now();
    const record: CachedMediaRecord = {
      gameId: gameId.trim().toLowerCase(),
      skillId: skillId.trim().toLowerCase(),
      title: title.trim().slice(0, 160),
      url: url.trim().slice(0, 2000),
      kind: typeof kind === 'string' ? kind : 'native',
      cachedAt: now,
      expiresAt: now + VIDEO_CACHE_TTL_SECONDS * 1000,
    };
    serverVideoCache.set(`${record.gameId}::${record.skillId}`, record);
    res.setHeader('Cache-Control', `public, max-age=${VIDEO_CACHE_TTL_SECONDS}`);
    return res.json({
      ok: true,
      ttlSeconds: VIDEO_CACHE_TTL_SECONDS,
      record,
    });
  });

  // --- Aipetros-live-avatar-hologram Runtime Config & GLB Proxy ---
  app.get('/api/config', (_req, res) => {
    const clientGlbUrl =
      hologramConfig.glbUrl && /^https?:\/\//i.test(hologramConfig.glbUrl)
        ? '/api/glb'
        : hologramConfig.glbUrl;
    res.json({
      ...hologramConfig,
      glbUrl: clientGlbUrl,
    });
  });

  app.post('/api/config', (req, res) => {
    const incoming = req.body && typeof req.body === 'object' ? req.body : {};
    hologramConfig = normalizeRuntimeConfig({
      glbUrl: 'glbUrl' in incoming ? incoming.glbUrl : hologramConfig.glbUrl,
      backgroundUrl:
        'backgroundUrl' in incoming ? incoming.backgroundUrl : hologramConfig.backgroundUrl,
      voice: {
        ...hologramConfig.voice,
        ...(incoming.voice && typeof incoming.voice === 'object' ? incoming.voice : {}),
      },
    });
    res.json({ ok: true, config: hologramConfig });
  });

  app.get('/api/glb', async (_req, res) => {
    if (!hologramConfig.glbUrl || !/^https?:\/\//i.test(hologramConfig.glbUrl)) {
      return res.status(404).json({ error: 'No remote GLB model URL is configured.' });
    }
    try {
      const upstream = await fetch(hologramConfig.glbUrl);
      if (!upstream.ok) {
        return res.status(502).json({ error: `Upstream GLB fetch failed (${upstream.status}).` });
      }
      const arrayBuf = await upstream.arrayBuffer();
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'model/gltf-binary');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.send(Buffer.from(arrayBuf));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch configured GLB model.';
      return res.status(502).json({ error: msg });
    }
  });

  // --- Aipetros-live-avatar-hologram VoicePipelineService /api/chat ---
  app.post('/api/chat', async (req, res) => {
    try {
      const rawMessage = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
      if (!rawMessage) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }
      if (rawMessage.length > 2400) {
        return res.status(400).json({ error: 'Message is too long.' });
      }

      const ai = createGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured in server secrets.',
        });
      }

      const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
      const history: ChatHistoryItem[] = rawHistory
        .slice(-10)
        .filter(
          (item: unknown): item is ChatHistoryItem =>
            typeof item === 'object' &&
            item !== null &&
            ((item as ChatHistoryItem).role === 'user' || (item as ChatHistoryItem).role === 'model') &&
            typeof (item as ChatHistoryItem).text === 'string' &&
            (item as ChatHistoryItem).text.trim().length > 0,
        );

      const customSystemPrompt =
        typeof req.body?.systemPrompt === 'string' && req.body.systemPrompt.trim().length > 20
          ? req.body.systemPrompt.trim().slice(0, 2200)
          : null;
      const requestedLang = typeof req.body?.targetLang === 'string' ? req.body.targetLang : 'en';
      const fallbackRtl = isRtlScript(rawMessage);
      const preferredLang = requestedLang || fallbackRtl || 'en';

      const imageContext =
        req.body?.imageContext &&
        typeof req.body.imageContext.base64 === 'string' &&
        typeof req.body.imageContext.mimeType === 'string' &&
        req.body.imageContext.mimeType.startsWith('image/')
          ? {
              base64: req.body.imageContext.base64,
              mimeType: req.body.imageContext.mimeType,
            }
          : null;

      const userParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      if (imageContext) {
        userParts.push({
          inlineData: {
            mimeType: imageContext.mimeType,
            data: imageContext.base64,
          },
        });
      }
      userParts.push({ text: rawMessage });

      const contents = [
        ...history.map((turn) => ({
          role: turn.role,
          parts: [{ text: turn.text }],
        })),
        {
          role: 'user' as const,
          parts: userParts,
        },
      ];

      const systemInstruction =
        customSystemPrompt ??
        [
          'You are AVA, the tactical 3D holographic gaming coach inside AIGAMERIA.',
          'Keep every reply natural for spoken voice delivery: concise (1 to 3 short sentences, under 55 words), plain prose with no markdown, bullet lists, asterisks, or emojis.',
          preferredLang === 'fa'
            ? 'Respond naturally and clearly in fluent modern Persian (RTL).'
            : 'Respond naturally and fluently in crisp English with zero non-English words.',
        ].join(' ');

      const candidateModels = [
        { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
        { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
      ];

      let responseText = '';
      let lastError: unknown = null;
      for (const candidate of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: candidate.model,
            contents,
            config: {
              systemInstruction,
              thinkingConfig: {
                thinkingLevel: candidate.thinkingLevel,
              },
            },
          });
          responseText = (response.text ?? '').replace(/[*_`#]/g, '').trim();
          if (responseText) break;
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          const isTransient = /503|UNAVAILABLE|high demand|overloaded|429|RESOURCE_EXHAUSTED/i.test(msg);
          if (!isTransient) throw err;
          await new Promise((r) => setTimeout(r, 350));
        }
      }

      if (!responseText) {
        if (lastError) throw lastError;
        return res.status(502).json({ error: 'Empty response received from language model.' });
      }

      const detectedRtl = isRtlScript(responseText);
      const replyLang = detectedRtl ?? preferredLang;
      return res.json({
        reply: responseText,
        lang: replyLang,
        dir: replyLang === 'fa' || replyLang === 'ar' ? 'rtl' : 'ltr',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate reply.';
      return res.status(500).json({ error: message });
    }
  });

  // --- Aipetros-live-avatar-hologram /api/transcribe ---
  app.post('/api/transcribe', async (req, res) => {
    try {
      const data = typeof req.body?.data === 'string' ? req.body.data.trim() : '';
      const mimeType =
        typeof req.body?.mimeType === 'string' && req.body.mimeType.startsWith('audio/')
          ? req.body.mimeType
          : 'audio/webm';
      const language = typeof req.body?.language === 'string' ? req.body.language : 'auto';
      if (!data) {
        return res.status(400).json({ error: 'Audio payload is required.' });
      }
      const ai = createGeminiClient();
      if (!ai) {
        return res.status(503).json({ error: 'GEMINI_API_KEY is not configured in server secrets.' });
      }
      const prompt =
        language === 'auto'
          ? 'Transcribe this spoken audio accurately in its original language (including Persian or English). Return only the plain transcript text.'
          : `Transcribe this spoken audio accurately in language code "${language}". Return only the plain transcript text.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [{ inlineData: { mimeType, data } }, { text: prompt }],
        },
      });
      const transcript = (response.text ?? '').trim();
      if (!transcript) {
        return res.status(422).json({ error: 'Could not detect clear speech in this audio clip.' });
      }
      return res.json({ transcript });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Audio transcription failed.';
      return res.status(500).json({ error: message });
    }
  });

  // --- Aipetros-live-avatar-hologram /api/tts ---
  app.post('/api/tts', async (req, res) => {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const lang = typeof req.body?.lang === 'string' ? req.body.lang : 'en';
    const rawVoice = typeof req.body?.voiceName === 'string' ? req.body.voiceName : 'Fenrir';
    const voiceName = ALLOWED_GEMINI_VOICES.has(rawVoice) ? rawVoice : 'Fenrir';
    const rawStyle =
      typeof req.body?.style === 'string' && req.body.style.trim().length > 0
        ? req.body.style.trim().slice(0, 240)
        : lang === 'fa'
          ? 'Warm, natural, clear Persian voice with calm conversational pacing'
          : 'Clear, articulate natural conversational voice';

    if (!text) {
      return res.status(400).json({ error: 'Text is required for speech synthesis.' });
    }

    const attempts: Array<{ apiVersion: string; includeMetadata: boolean }> = [
      { apiVersion: 'v1beta', includeMetadata: true },
      { apiVersion: 'v1beta', includeMetadata: false },
      { apiVersion: 'v1alpha', includeMetadata: false },
    ];

    for (const attempt of attempts) {
      try {
        const ai = createGeminiClient(attempt.apiVersion);
        if (!ai) break;
        const part = attempt.includeMetadata
          ? { text, speechMetadata: { style: rawStyle } }
          : { text };
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [{ role: 'user', parts: [part] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });
        const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        const base64Audio = inlineData?.data;
        if (base64Audio) {
          return res.json({
            audioBase64: base64Audio,
            mimeType: inlineData?.mimeType || 'audio/wav',
            mode: 'audio',
          });
        }
      } catch {
        // Try next API version / fallback cleanly to browser SpeechSynthesis
      }
    }
    return res.json({ audioBase64: null, mode: 'speechSynthesis' });
  });

  // --- Focused Skill Coaching Route (used by Screen 2 inline prompt bar) ---
  app.post('/api/coach', async (req, res) => {
    const { prompt, gameId, gameName, skillTitle, language } = req.body ?? {};
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ ok: false, error: 'A tactical prompt is required.' });
    }

    const ai = createGeminiClient();
    if (!ai) {
      return res.status(503).json({
        ok: false,
        error: 'GEMINI_API_KEY is not configured in server secrets.',
      });
    }

    const lang = language === 'fa' ? 'fa' : 'en';
    const safeGameName = typeof gameName === 'string' ? gameName : String(gameId ?? 'Game');
    const safeSkill = typeof skillTitle === 'string' ? skillTitle : 'Active Tactical Skill';

    const languageDirective =
      lang === 'fa'
        ? 'Respond exclusively in clear, natural spoken Persian (Farsi) with crisp gaming terminology.'
        : 'Respond exclusively in crisp, concise English. Never include any Persian or Arabic words or repository names.';

    const systemInstruction = [
      `You are AVA, the tactical gaming coach inside AIGAMERIA.`,
      `Active Game: ${safeGameName} (gameId: ${String(gameId ?? 'unknown')}).`,
      `Active Skill: ${safeSkill}.`,
      `Stay strictly inside ${safeGameName} mechanics, maps, inputs, and timing. Never mention unrelated games (e.g., never mention football during a shooter session).`,
      languageDirective,
      'Give 2 to 3 concise, high-impact actionable tactical cues in under 75 words.',
    ].join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt.trim(),
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });
      const reply = response.text?.trim();
      if (!reply) {
        return res.status(502).json({ ok: false, error: 'Coach returned an empty response.' });
      }
      return res.json({
        ok: true,
        reply,
        gameId,
        language: lang,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to reach Gemini coaching service.';
      return res.status(502).json({ ok: false, error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AIGAMERIA server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start AIGAMERIA server:', err);
  process.exit(1);
});
