/**
 * Aigameria v1.02 — FCM HTTP v1 push sender.
 * Authenticates with the firebase-adminsdk service account (JSON, path from
 * env FCM_SERVICE_ACCOUNT) by signing an RS256 JWT with node:crypto — zero
 * external dependencies. Sends to the device registry (user_devices.fcm_token).
 */
import { createSign, createHash } from 'node:crypto';
import fs from 'node:fs';
import { getDb, nowIso } from './db';

interface SaKey {
  client_email: string;
  private_key: string;
  project_id: string;
}

let saCache: SaKey | null = null;
let oauthCache: { token: string; expiresAt: number } | null = null;

function loadSa(): SaKey | null {
  if (saCache) return saCache;
  const path = process.env.FCM_SERVICE_ACCOUNT;
  if (!path) return null;
  try {
    saCache = JSON.parse(fs.readFileSync(path, 'utf8')) as SaKey;
    return saCache;
  } catch (exc) {
    console.error('[push] cannot read service account:', (exc as Error).message);
    return null;
  }
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

async function getAccessToken(): Promise<string | null> {
  const sa = loadSa();
  if (!sa) return null;
  if (oauthCache && oauthCache.expiresAt > Date.now() + 60_000) return oauthCache.token;
  const iat = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: undefined }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat,
    exp: iat + 3600,
  }));
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(sa.private_key.replace(/\\n/g, '\n'));
  const assertion = `${header}.${claims}.${signature.toString('base64url')}`;
  try {
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }).toString(),
    });
    if (!resp.ok) return null;
    const json = (await resp.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    oauthCache = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
    return oauthCache.token;
  } catch {
    return null;
  }
}

export interface PushMessage { title: string; body: string; url?: string; tag?: string }

/** Sends to every device registered for the user. Returns per-token results. */
export async function sendToUser(userId: string, msg: PushMessage): Promise<{ sent: number; failed: number }> {
  const rows = getDb().prepare('SELECT fcm_token FROM user_devices WHERE user_id = ? AND fcm_token IS NOT NULL').all(userId) as Array<{ fcm_token: string }>;
  if (!rows.length) return { sent: 0, failed: 0 };
  const accessToken = await getAccessToken();
  if (!accessToken) return { sent: 0, failed: rows.length };
  let sent = 0, failed = 0;
  for (const { fcm_token } of rows) {
    try {
      const resp = await fetch('https://fcm.googleapis.com/v1/projects/aigameria-476ab/messages:send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token: fcm_token,
            notification: { title: msg.title, body: msg.body },
            webpush: {
              fcmOptions: { link: msg.url ?? 'https://aipetros.xyz/' },
              notification: { icon: '/favicon.svg', badge: '/favicon.svg' },
            },
            data: { url: msg.url ?? '/', tag: msg.tag ?? '' },
          },
        }),
      });
      if (resp.ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}

/** Runtime push config for the web client (firebase web config + VAPID public). */
const FIREBASE_WEB_CONFIG = {
  apiKey: process.env.FCM_WEB_API_KEY ?? 'AIzaSyDrOD3VILHkYG9NYGK9pHKF-iJs7cGpKz4',
  authDomain: 'aigameria-476ab.firebaseapp.com',
  projectId: 'aigameria-476ab',
  storageBucket: 'aigameria-476ab.firebasestorage.app',
  messagingSenderId: '351322992462',
  appId: '1:351322992462:web:4080090dbf5b5c184bf81f',
};
export function pushConfig(): typeof FIREBASE_WEB_CONFIG & { vapidPublicKey: string; webPushEnabled: boolean } {
  const enabled = Boolean(process.env.FCM_SERVICE_ACCOUNT && fs.existsSync(process.env.FCM_SERVICE_ACCOUNT));
  return { ...FIREBASE_WEB_CONFIG, vapidPublicKey: process.env.VAPID_PUBLIC ?? '', webPushEnabled: enabled };
}
