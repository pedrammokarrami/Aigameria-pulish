/**
 * Aigameria v1.02 — FCM web-push client.
 * Fetches the runtime config (firebase web config + VAPID public key) from the
 * server, registers the messaging service worker, requests the browser
 * notification permission, obtains the FCM registration token and persists it
 * to the real user record via POST /api/v1/auth/device (fcm_token).
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';

const SESSION_KEY = 'aigameria_session_v2';
const DEVICE_KEY = 'aigameria_fcm_token_v1';

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export interface PushConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidPublicKey: string;
}

let cachedConfig: PushConfig | null = null;

async function loadConfig(): Promise<PushConfig | null> {
  if (cachedConfig) return cachedConfig;
  try {
    const res = await fetch('/api/v1/push/config');
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; data?: PushConfig };
    cachedConfig = json?.data ?? null;
    return cachedConfig;
  } catch {
    return null;
  }
}

function readSessionToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

/** Registers FCM + persists the token. Never throws — push is best-effort. */
export async function initFcmPush(): Promise<{ ok: boolean; reason?: string }> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return { ok: false, reason: 'no-sw' };
  if (!(await isSupported())) return { ok: false, reason: 'unsupported' };
  const token = readSessionToken();
  if (!token) return { ok: false, reason: 'not-logged-in' };

  const cfg = await loadConfig();
  if (!cfg) return { ok: false, reason: 'no-config' };

  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, reason: 'permission-' + perm };
  }

  try {
    app = app ?? initializeApp(cfg);
    messaging = messaging ?? getMessaging(app);
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    const fcmToken = await getToken(messaging, {
      vapidKey: cfg.vapidPublicKey,
      serviceWorkerRegistration: reg,
    });
    if (!fcmToken) return { ok: false, reason: 'no-token' };

    // Persist to the real device registry (server-side user_devices.fcm_token).
    const existing = localStorage.getItem(DEVICE_KEY);
    const res = await fetch('/api/v1/auth/device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fcmToken, platform: 'web', userAgent: navigator.userAgent.slice(0, 300) }),
    });
    if (res.ok) localStorage.setItem(DEVICE_KEY, fcmToken);
    else if (existing) localStorage.removeItem(DEVICE_KEY);
    return { ok: res.ok, reason: res.ok ? undefined : 'device-post-' + res.status };
  } catch (exc) {
    return { ok: false, reason: 'error:' + String((exc as Error)?.message ?? exc).slice(0, 80) };
  }
}
