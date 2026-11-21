/**
 * Persistent cinema hub state — localStorage backed, pub/sub store.
 * Persona identity, social club posts, streams, likes, connected accounts.
 */
import { SEED_POSTS, SEED_STREAMS } from './cinemaData'

const KEY = 'aipetros.cinema.state.v1'

const defaultState = () => ({
  persona: null, // { primary, secondary, age, gender, tastes, handle }
  accounts: { imdb: null, twitch: null, telegram: null },
  telegramChannel: null, // { title, username, createdAt }
  posts: SEED_POSTS,
  streams: SEED_STREAMS,
})

let state = load()
const listeners = new Set()

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...defaultState(), ...JSON.parse(raw) }
  } catch { /* corrupted → fresh */ }
  return defaultState()
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* quota */ }
}

function emit() {
  for (const fn of listeners) fn(state)
}

export function getState() {
  return state
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function setState(patch) {
  state = { ...state, ...patch }
  persist()
  emit()
}

/* ---------------- persona ---------------- */
export function setPersona(persona) { setState({ persona }) }
export function clearPersona() { setState({ persona: null }) }

/* ---------------- accounts ---------------- */
export function connectAccount(kind, payload) {
  setState({ accounts: { ...state.accounts, [kind]: payload } })
}
export function disconnectAccount(kind) {
  setState({ accounts: { ...state.accounts, [kind]: null } })
}
export function setTelegramChannel(channel) { setState({ telegramChannel: channel }) }

/* ---------------- posts & likes ---------------- */
export function addPost({ author, tag, text }) {
  const post = { id: `p${Date.now()}`, author, tag, text, likes: 0, likedByMe: false, time: Date.now() }
  setState({ posts: [post, ...state.posts] })
  return post
}

export function toggleLikePost(id) {
  setState({
    posts: state.posts.map((p) =>
      p.id === id
        ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
        : p,
    ),
  })
}

/* ---------------- streams & likes ---------------- */
export function addStream({ owner, title, url, live = true }) {
  const stream = { id: `st${Date.now()}`, owner, title, url, likes: 0, likedByMe: false, live, time: Date.now() }
  setState({ streams: [stream, ...state.streams] })
  return stream
}

export function toggleLikeStream(id) {
  setState({
    streams: state.streams.map((s) =>
      s.id === id
        ? { ...s, likedByMe: !s.likedByMe, likes: s.likes + (s.likedByMe ? -1 : 1) }
        : s,
    ),
  })
}

export function setStreamLive(id, live) {
  setState({ streams: state.streams.map((s) => (s.id === id ? { ...s, live } : s)) })
}
