import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sortByTrend, SEED_POSTS } from '../../lib/cinemaData'
import {
  addPost, toggleLikePost, toggleLikeStream,
  connectAccount, disconnectAccount, setStreamLive,
} from '../../lib/cinemaStore'
import { useCinemaState } from '../../lib/useCinemaState'

const TAG_LABELS = { theory: 'تئوری', review: 'نقد', log: 'گزارش', clip: 'کلیپ' }

/**
 * Underground Social Club — Mr. Robot atmosphere: dark, secure, terminal.
 * Real account connectors (IMDb / Twitch), post feed, likes, and the
 * trending stream of the day driven by the decayed-likes algorithm.
 */
export default function SocialClub({ onClose }) {
  const { persona, posts, streams, accounts } = useCinemaState((s) => ({
    persona: s.persona, posts: s.posts, streams: s.streams, accounts: s.accounts,
  }))
  const [tab, setTab] = useState('feed') // feed | accounts | trending
  const [draft, setDraft] = useState('')
  const [tag, setTag] = useState('theory')
  const author = persona?.handle || 'anon_'+Math.random().toString(36).slice(2, 6)

  const feed = useMemo(() => [...posts].sort((a, b) => b.likes - a.likes), [posts])
  const trending = useMemo(() => sortByTrend(streams), [streams])
  const topStream = trending[0]

  const submit = () => {
    if (!draft.trim()) return
    addPost({ author, tag, text: draft.trim() })
    setDraft('')
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/75 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl"
        style={{
          background: 'rgba(8,9,10,0.94)',
          border: '1px solid rgba(120,32,32,0.35)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header — terminal strip */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5" style={{ background: 'linear-gradient(180deg, rgba(120,32,32,0.14), transparent)' }}>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#d96a5a" strokeWidth="1.8">
              <rect x="4" y="10" width="16" height="10" rx="1.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
            </svg>
            <div>
              <div className="font-mono text-[10px] tracking-[0.4em] text-[#d96a5a]">fsociety//aipetros</div>
              <div className="text-xs text-white/60">سوشال کلاب زیرزمینی — نقد، تئوری، نشت</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(['feed', 'trending', 'accounts']).map((t) => (
              <button
                key={t} type="button" onClick={() => setTab(t)}
                className="cursor-pointer rounded px-2.5 py-1 font-mono text-[11px]"
                style={{
                  color: tab === t ? '#d96a5a' : 'rgba(255,255,255,0.45)',
                  background: tab === t ? 'rgba(120,32,32,0.18)' : 'transparent',
                  boxShadow: tab === t ? 'inset 0 0 0 1px rgba(217,106,90,0.4)' : 'none',
                }}
              >
                {t === 'feed' ? '/feed' : t === 'trending' ? '/trending' : '/accounts'}
              </button>
            ))}
            <button type="button" onClick={onClose} className="cursor-pointer rounded px-2 py-1 font-mono text-[11px] text-white/40 hover:text-white">[esc]</button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ---------------- feed ---------------- */}
          {tab === 'feed' && (
            <motion.div key="feed" className="flex min-h-0 flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* composer */}
              <div className="border-b border-white/10 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[#d96a5a]">{author}@</span>
                  {Object.entries(TAG_LABELS).map(([id, fa]) => (
                    <button
                      key={id} type="button" onClick={() => setTag(id)}
                      className="cursor-pointer rounded px-2 py-0.5 text-[10px]"
                      style={{ color: tag === id ? '#d96a5a' : 'rgba(255,255,255,0.4)', boxShadow: tag === id ? 'inset 0 0 0 1px rgba(217,106,90,0.35)' : 'none' }}
                    >{fa}</button>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                    placeholder="نقد، تئوری یا نشت امروز…"
                    className="flex-1 rounded-lg border border-white/10 bg-black/50 px-3 py-2 font-mono text-xs text-white/85 outline-none focus:border-[#d96a5a]/60"
                  />
                  <button type="button" onClick={submit} className="cursor-pointer rounded-lg bg-[#d96a5a]/15 px-4 py-2 font-mono text-[11px] text-[#d96a5a]" style={{ boxShadow: 'inset 0 0 0 1px rgba(217,106,90,0.45)' }}>
                    ارسال
                  </button>
                </div>
              </div>

              {/* posts */}
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
                {feed.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-[#d96a5a]">{p.author}</span>
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40">{TAG_LABELS[p.tag] || p.tag}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-6 text-white/75">{p.text}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleLikePost(p.id)}
                        className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-[11px]"
                        style={{ color: p.likedByMe ? '#d96a5a' : 'rgba(255,255,255,0.45)', boxShadow: p.likedByMe ? 'inset 0 0 0 1px rgba(217,106,90,0.4)' : 'none' }}
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={p.likedByMe ? '#d96a5a' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3Zm0 0 4.2-7.3a1.5 1.5 0 0 1 2.7 1.2L13 10h6a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 21H7" /></svg>
                        {p.likes}
                      </button>
                      <span className="font-mono text-[10px] text-white/25">{new Date(p.time).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ---------------- trending ---------------- */}
          {tab === 'trending' && (
            <motion.div key="trending" className="min-h-0 flex-1 overflow-y-auto px-5 py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {topStream && (
                <div className="mb-4 rounded-xl p-4" style={{ background: 'linear-gradient(160deg, rgba(120,32,32,0.2), rgba(0,0,0,0.3))', boxShadow: 'inset 0 0 0 1px rgba(217,106,90,0.35)' }}>
                  <div className="font-mono text-[10px] tracking-[0.35em] text-[#d96a5a]">TREND OF THE DAY</div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white/90">{topStream.title}</div>
                      <div className="font-mono text-[11px] text-white/45">{topStream.owner} · {topStream.likes} لایک · {topStream.live ? 'در حال پخش' : 'آرشیو'}</div>
                    </div>
                    {topStream.url && (
                      <a href={topStream.url} target="_blank" rel="noreferrer" className="rounded-lg bg-[#d96a5a]/15 px-3 py-1.5 font-mono text-[11px] text-[#d96a5a]">تماشا</a>
                    )}
                  </div>
                </div>
              )}
              {trending.map((s, i) => (
                <div key={s.id} className="mb-2 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-white/25">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <div className="text-xs text-white/85">{s.title}</div>
                      <div className="font-mono text-[10px] text-white/40">{s.owner} · {s.likes} لایک</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.owner === author && (
                      <button
                        type="button"
                        onClick={() => setStreamLive(s.id, !s.live)}
                        className="cursor-pointer rounded px-2 py-1 font-mono text-[10px]"
                        style={{ color: s.live ? '#d96a5a' : 'rgba(255,255,255,0.4)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}
                      >
                        {s.live ? 'LIVE ●' : 'GO LIVE'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleLikeStream(s.id)}
                      className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px]"
                      style={{ color: s.likedByMe ? '#d96a5a' : 'rgba(255,255,255,0.45)' }}
                    >
                      ▲ {s.likes}
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ---------------- accounts ---------------- */}
          {tab === 'accounts' && (
            <motion.div key="accounts" className="min-h-0 flex-1 overflow-y-auto px-5 py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-3 font-mono text-[10px] tracking-[0.35em] text-white/35">IDENTITY PORTS — امن، محلی، بدون سرور واسط</div>
              <div className="grid gap-3 md:grid-cols-3">
                <AccountPort
                  kind="imdb" label="IMDb" sub="کیولیشن و لیست‌ها" accent="#f5c518"
                  account={accounts.imdb}
                  onConnect={(u) => connectAccount('imdb', { user: u, at: Date.now() })}
                  onDisconnect={() => disconnectAccount('imdb')}
                />
                <AccountPort
                  kind="twitch" label="Twitch" sub="استریم و کلیپ" accent="#a970ff"
                  account={accounts.twitch}
                  onConnect={(u) => connectAccount('twitch', { user: u, at: Date.now() })}
                  onDisconnect={() => disconnectAccount('twitch')}
                />
                <AccountPort
                  kind="letterboxd" label="Letterboxd" sub="دیاری سینمایی" accent="#00e054"
                  account={accounts.letterboxd}
                  onConnect={(u) => connectAccount('letterboxd', { user: u, at: Date.now() })}
                  onDisconnect={() => disconnectAccount('letterboxd')}
                />
              </div>
              <p className="mt-4 font-mono text-[10px] leading-5 text-white/30">
                // اتصال‌ها به صورت امن در همین دستگاه نگهداری می‌شوند. برای همگام‌سازی سمت سرور، پورت OAuth سامانه را فعال کنید.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

function AccountPort({ kind, label, sub, accent, account, onConnect, onDisconnect }) {
  const [val, setVal] = useState('')
  const [connected, setConnected] = useState(!!account)

  if (connected && account) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: accent }}>{label}</span>
          <span className="font-mono text-[9px] tracking-widest" style={{ color: accent }}>● LINKED</span>
        </div>
        <div className="mt-1 font-mono text-xs text-white/70">{account.user}</div>
        <button type="button" onClick={() => { onDisconnect(); setConnected(false) }} className="mt-3 cursor-pointer rounded border border-white/15 px-2.5 py-1 text-[10px] text-white/50 hover:text-white">
          قطع اتصال
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white/80">{label}</span>
        <span className="font-mono text-[9px] tracking-widest text-white/30">○ OFF</span>
      </div>
      <div className="mt-1 text-[10px] text-white/40">{sub}</div>
      <div className="mt-3 flex gap-1.5">
        <input
          value={val} onChange={(e) => setVal(e.target.value)}
          placeholder="username"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 font-mono text-[11px] text-white/85 outline-none focus:border-white/30"
        />
        <button
          type="button"
          onClick={() => { if (val.trim()) { onConnect(val.trim()); setConnected(true) } }}
          className="cursor-pointer rounded-lg px-3 py-1.5 font-mono text-[10px]"
          style={{ color: accent, boxShadow: `inset 0 0 0 1px ${accent}55` }}
        >
          LINK
        </button>
      </div>
    </div>
  )
}
