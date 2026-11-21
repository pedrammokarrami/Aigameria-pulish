import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Hls from 'hls.js'
import { sortByTrend } from '../../lib/cinemaData'
import { addStream, toggleLikeStream, setTelegramChannel, connectAccount } from '../../lib/cinemaStore'
import { useCinemaState } from '../../lib/useCinemaState'
import {
  verifyToken, suggestChannelName, provisionChannel, publishToChannel,
  resolvePlayableUrl, isHls, isEmbedLike,
} from '../../lib/telegramService'

/**
 * Stream Studio — decentralized streaming + Telegram integration.
 * 1. Connect a Telegram bot token (Bot API over HTTPS, no backend).
 * 2. Auto-provision the user's dedicated channel (named after their persona).
 * 3. Publish a stream link → it becomes a playable source in the hub player.
 * 4. Streams get likes; the decayed-likes algorithm crowns the trend of the day.
 */
export default function StreamStudio({ onClose }) {
  const { persona, streams, accounts, telegramChannel } = useCinemaState((s) => ({
    persona: s.persona, streams: s.streams, accounts: s.accounts, telegramChannel: s.telegramChannel,
  }))
  const [tab, setTab] = useState('telegram') // telegram | player | trending
  const [token, setToken] = useState('')
  const [bot, setBot] = useState(null)
  const [busy, setBusy] = useState('')
  const [log, setLog] = useState([])
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [nowPlaying, setNowPlaying] = useState(null) // stream object
  const author = persona?.handle || 'anon_' + Math.random().toString(36).slice(2, 6)

  const pushLog = (line) => setLog((l) => [...l.slice(-6), `[${new Date().toLocaleTimeString('fa-IR')}] ${line}`])
  const trending = sortByTrend(streams)

  /* ---------- telegram connect + channel provisioning ---------- */
  const connect = async () => {
    if (!token.trim()) return
    setBusy('verify')
    try {
      const info = await verifyToken(token.trim())
      setBot(info)
      connectAccount('telegram', { user: info.username, at: Date.now() })
      pushLog(`bot verified: @${info.username}`)

      const chanTitle = `Aipetros Cinema — ${persona?.primary?.fa || author}`
      const chan = await provisionChannel(token.trim(), info, {
        title: chanTitle,
        chatId: telegramChannel?.chatId || null,
      })
      setTelegramChannel(chan)
      pushLog(chan.chatId ? `channel bound: ${chan.title}` : `channel surrogate ready: ${suggestChannelName(persona)}`)
      pushLog('برای اتصال کانال واقعی، ربات را به‌عنوان ادمین کانال اضافه کنید؛ شناسه‌ی کانال خودکار تشخیص داده می‌شود.')
    } catch (e) {
      pushLog(`error: ${e.message}`)
    } finally {
      setBusy('')
    }
  }

  const announce = async (stream) => {
    if (!telegramChannel) return pushLog('اول کانال را بسازید.')
    const linkText = stream.url ? `\n▶ ${stream.url}` : ''
    try {
      const r = await publishToChannel(token.trim(), telegramChannel, `📡 ${stream.title} — توسط ${stream.owner} در Aipetros${linkText}`)
      pushLog(r.delivered ? 'در کانال منتشر شد ✓' : 'پیام آماده انتشار — ربات را داخل کانال ادمین کنید')
    } catch (e) {
      pushLog(`error: ${e.message}`)
    }
  }

  /* ---------- stream publish + player ---------- */
  const publish = () => {
    if (!url.trim()) return
    const st = addStream({ owner: author, title: title.trim() || `استریم ${author}`, url: url.trim(), live: true })
    setNowPlaying(st)
    announce(st)
    setUrl('')
    setTitle('')
    pushLog('استریم ثبت شد و به‌عنوان ترند پیشنهاد شد.')
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/75 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl"
        style={{
          background: 'rgba(10,10,11,0.94)',
          border: '1px solid rgba(240,169,56,0.22)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5" style={{ background: 'linear-gradient(180deg, rgba(240,169,56,0.08), transparent)' }}>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#f0a938" strokeWidth="1.8">
              <path d="M12 3v10M12 21v-4M5.6 5.6l7 7M18.4 5.6l-7 7M3 12h4M17 12h4" />
            </svg>
            <div>
              <div className="text-[10px] tracking-[0.45em] text-amber/80">AIPETROS STREAM</div>
              <div className="text-xs text-white/60">استریم غیرمتمرکز · تلگرام · ترند روز</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {([['telegram', 'تلگرام'], ['player', 'پخش'], ['trending', 'ترند']]).map(([id, fa]) => (
              <button
                key={id} type="button" onClick={() => setTab(id)}
                className="cursor-pointer rounded px-2.5 py-1 text-[11px]"
                style={{
                  color: tab === id ? '#f0a938' : 'rgba(255,255,255,0.45)',
                  background: tab === id ? 'rgba(240,169,56,0.1)' : 'transparent',
                  boxShadow: tab === id ? 'inset 0 0 0 1px rgba(240,169,56,0.4)' : 'none',
                }}
              >{fa}</button>
            ))}
            <button type="button" onClick={onClose} className="cursor-pointer rounded px-2 py-1 text-[11px] text-white/40 hover:text-white">✕</button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {/* ---------------- telegram ---------------- */}
            {tab === 'telegram' && (
              <motion.div key="tg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <SectionTitle fa="اتصال حساب تلگرام و ساخت کانال خودکار" />
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[11px] leading-6 text-white/55">
                    توکن ربات را از <span className="font-mono text-amber/80">@BotFather</span> بگیرید و اینجا وارد کنید.
                    همه‌چیز مستقیماً با Telegram Bot API از همین مرورگر انجام می‌شود؛ هیچ سرور واسطی در کار نیست.
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      value={token} onChange={(e) => setToken(e.target.value)}
                      placeholder="123456:AA...bot token"
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-white/85 outline-none focus:border-amber/60"
                    />
                    <motion.button
                      type="button" onClick={connect} disabled={busy === 'verify'}
                      whileTap={{ scale: 0.97 }}
                      className="cursor-pointer rounded-lg px-4 py-2 text-xs font-bold"
                      style={{ color: '#f0a938', boxShadow: 'inset 0 0 0 1.5px rgba(240,169,56,0.6)' }}
                    >
                      {busy === 'verify' ? 'در حال بررسی…' : 'اتصال و ساخت کانال'}
                    </motion.button>
                  </div>
                </div>

                {telegramChannel && (
                  <div className="rounded-xl border border-amber/30 bg-amber/5 p-4">
                    <div className="text-[10px] tracking-[0.35em] text-amber/80">CHANNEL READY</div>
                    <div className="mt-1 text-sm text-white/90">{telegramChannel.title}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-white/50">
                      {telegramChannel.chatId ? `chat_id: ${telegramChannel.chatId}` : 'وضعیت: کانال نمایشی (ربات را به کانال واقعی ادمین کنید تا chat_id قفل شود)'}
                      {telegramChannel.username ? ` · ${telegramChannel.username}` : ''}
                    </div>
                  </div>
                )}

                <ConsoleLog lines={log} />
              </motion.div>
            )}

            {/* ---------------- player / publish ---------------- */}
            {tab === 'player' && (
              <motion.div key="pl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <SectionTitle fa="انتشار لینک استریم و پخش زنده داخل هاب" />
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      value={url} onChange={(e) => setUrl(e.target.value)}
                      placeholder="لینک استریم (m3u8 / mp4 / t.me / twitch / youtube)"
                      className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-white/85 outline-none focus:border-amber/60"
                    />
                    <input
                      value={title} onChange={(e) => setTitle(e.target.value)}
                      placeholder="عنوان استریم"
                      className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white/85 outline-none focus:border-amber/60"
                    />
                  </div>
                  <button
                    type="button" onClick={publish}
                    className="mt-2.5 cursor-pointer rounded-lg px-4 py-2 text-xs font-bold"
                    style={{ color: '#f0a938', boxShadow: 'inset 0 0 0 1.5px rgba(240,169,56,0.6)' }}
                  >
                    انتشار در سوشال کلاب + شروع پخش
                  </button>
                </div>
                {nowPlaying ? (
                  <StreamPlayer stream={nowPlaying} onLike={() => toggleLikeStream(nowPlaying.id)} />
                ) : (
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] p-8 text-center text-xs text-white/40">
                    هنوز چیزی در حال پخش نیست — یک لینک منتشر کنید.
                  </div>
                )}
              </motion.div>
            )}

            {/* ---------------- trending ---------------- */}
            {tab === 'trending' && (
              <motion.div key="tr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                <SectionTitle fa="ترند روز — الگوریتم لایک با میرایی زمانی" />
                {trending.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] p-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-white/25">{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <div className="text-xs text-white/85">{s.title}{s.live && <span className="ml-2 font-mono text-[9px] text-amber/80">● LIVE</span>}</div>
                        <div className="font-mono text-[10px] text-white/40">{s.owner} · {s.likes} لایک</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => { setNowPlaying(s); setTab('player') }} className="cursor-pointer rounded px-2.5 py-1 text-[10px] text-amber/85" style={{ boxShadow: 'inset 0 0 0 1px rgba(240,169,56,0.4)' }}>
                        پخش
                      </button>
                      <button type="button" onClick={() => toggleLikeStream(s.id)} className="cursor-pointer rounded px-2 py-1 text-[11px]" style={{ color: s.likedByMe ? '#f0a938' : 'rgba(255,255,255,0.45)' }}>
                        ▲ {s.likes}
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------- in-hub player: hls.js for m3u8, video for mp4, iframe for embeds ---------- */
function StreamPlayer({ stream, onLike }) {
  const url = resolvePlayableUrl(stream.url)
  const videoRef = useRef(null)
  const hlsRef = useRef(null)

  useEffect(() => {
    if (!url) return
    if (isEmbedLike(url) || isHls(url) === false && /\.(mp4|webm)/i.test(url)) {
      return // handled by tags below
    }
    if (isHls(url) && videoRef.current) {
      const video = videoRef.current
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url
        video.play().catch(() => {})
        return () => { video.removeAttribute('src') }
      }
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 30 })
        hls.loadSource(url)
        hls.attachMedia(video)
        hls.play()
        hlsRef.current = hls
        return () => hls.destroy()
      }
    }
  }, [url])

  return (
    <div className="overflow-hidden rounded-xl border border-amber/25 bg-black">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-2">
        <div className="flex items-center gap-2">
          {stream.live && <span className="font-mono text-[9px] tracking-widest text-[#d96a5a]">● LIVE</span>}
          <span className="text-xs text-white/85">{stream.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-white/40">{stream.owner}</span>
          <button type="button" onClick={onLike} className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px]" style={{ color: stream.likedByMe ? '#f0a938' : 'rgba(255,255,255,0.45)' }}>
            ▲ {stream.likes}
          </button>
        </div>
      </div>

      <div className="aspect-video w-full bg-black">
        {isEmbedLike(url) ? (
          <iframe src={url} title={stream.title} className="h-full w-full border-0" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen />
        ) : isHls(url) ? (
          <video ref={videoRef} className="h-full w-full object-contain" controls autoPlay playsInline />
        ) : (
          <video src={url} className="h-full w-full object-contain" controls autoPlay playsInline />
        )}
      </div>
    </div>
  )
}

function SectionTitle({ fa }) {
  return <div className="text-xs font-semibold text-white/80">{fa}</div>
}

function ConsoleLog({ lines }) {
  if (!lines.length) return null
  return (
    <div className="rounded-xl border border-white/8 bg-black/60 p-3 font-mono text-[10px] leading-5 text-white/45">
      {lines.map((l, i) => (
        <div key={i} className={l.startsWith('[error') || l.includes('error') ? 'text-[#d96a5a]' : ''}>{l}</div>
      ))}
    </div>
  )
}
