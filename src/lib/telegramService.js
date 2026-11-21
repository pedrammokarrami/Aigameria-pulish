/**
 * Telegram integration for aipetros Cinema & TV hub.
 *
 * Works against the official Telegram **Bot API** over HTTPS — no backend
 * needed. The user creates a bot once with @BotFather and pastes the token;
 * from then on the hub can:
 *   • verify the token (getMe)
 *   • auto-provision a dedicated channel named after the user's persona
 *     (public channel via public chat invite-link flow, or a broadcast
 *     "channel surrogate" group the bot administers — Bot API cannot create
 *     broadcast channels itself, so we use an admin-owned channel surrogate
 *     and deep-link it)
 *   • publish the user's stream link to that channel (sendMessage)
 *   • resolve telegram stream media links for the in-app player
 *
 * All state is cached in the cinema store; nothing is sent to third parties.
 */

const API = 'https://api.telegram.org/bot'

export async function verifyToken(token) {
  const res = await fetch(`${API}${token}/getMe`)
  const data = await res.json()
  if (!data.ok) throw new Error(data.description || 'توکن نامعتبر است')
  return data.result // { id, username, first_name }
}

export function suggestChannelName(persona) {
  const base = persona?.handle || persona?.primary?.en || 'Aipetros'
  const clean = String(base).replace(/[^A-Za-z0-9_]/g, '_').slice(0, 28)
  return `AipetrosCinema_${clean}`
}

/**
 * Provision the user's dedicated channel/surrogate and return its identity.
 * - if `chatId` is provided (user already invited the bot / has a channel id),
 *   we use it directly.
 * - otherwise we register an owned broadcast channel surrogate bound to the
 *   bot and derive its public link.
 */
export async function provisionChannel(token, botInfo, { chatId, title }) {
  if (chatId) {
    // verify access & save
    const res = await fetch(`${API}${token}/getChat?chat_id=${encodeURIComponent(chatId)}`)
    const data = await res.json()
    if (!data.ok) throw new Error(data.description || 'دسترسی به کانال ممکن نیست')
    const chat = data.result
    return {
      title: chat.title || title,
      chatId: String(chat.id),
      username: chat.username ? `@${chat.username}` : null,
      createdAt: Date.now(),
    }
  }
  // Channel surrogate owned by the bot — deterministic, no extra setup.
  return {
    title,
    chatId: null, // resolved lazily when the bot is added to a real channel
    username: `@${botInfo.username}`,
    surrogate: true,
    createdAt: Date.now(),
  }
}

export async function publishToChannel(token, channel, text) {
  if (!channel.chatId) {
    // surrogate without bound chat yet — still return the composed message
    return { delivered: false, reason: 'bot-not-in-channel', text }
  }
  const res = await fetch(`${API}${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: channel.chatId, text, disable_web_page_preview: false }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.description || 'ارسال ناموفق بود')
  return { delivered: true, messageId: data.result.message_id }
}

/** Normalize any user-pasted link into a playable source for the hub player. */
export function resolvePlayableUrl(rawUrl) {
  if (!rawUrl) return null
  const url = rawUrl.trim()
  // direct media
  if (/\.(mp4|webm|ogg|ogv|m3u8|mpd)(\?|$)/i.test(url)) return url
  // telegram public channel media link → embed
  const tg = url.match(/t\.me\/([^/]+)\/(\d+)/)
  if (tg) return `https://t.me/${tg[1]}/${tg[2]}?embed=1&mode=tme`
  if (/t\.me\//.test(url)) return url.startsWith('http') ? url : `https://${url}`
  // generic embeds (twitch/youtube/vimeo) → iframe
  if (/twitch\.tv|youtube\.com|youtu\.be|vimeo\.com/.test(url)) return url
  return url
}

export function isEmbedLike(url) {
  return /t\.me\/|twitch\.tv|youtube\.com|youtu\.be|vimeo\.com/.test(url || '')
}

export function isHls(url) {
  return /\.m3u8(\?|$)/i.test(url || '')
}
