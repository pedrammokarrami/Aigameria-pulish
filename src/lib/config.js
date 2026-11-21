/**
 * Timeline of intro.mp4.
 * Three segments, each bound to one menu button.
 */
export const SEGMENTS = {
  cinema: { start: 0.0, end: 3.6 },
  music: { start: 3.8, end: 6.7 },
  gaming: { start: 6.9, end: 10.0 },
}

/** Halo / rim-light color per section (AAA palette, no neon) */
export const THEMES = {
  cinema: {
    rim: '240, 169, 56', // warm amber
    glow: 'rgba(240, 169, 56, 0.55)',
    accent: '#f0a938',
  },
  music: {
    rim: '212, 175, 92', // warm gold
    glow: 'rgba(212, 175, 92, 0.5)',
    accent: '#d4af5c',
  },
  gaming: {
    rim: '84, 190, 160', // tactical teal
    glow: 'rgba(84, 190, 160, 0.5)',
    accent: '#54bea0',
  },
}

/**
 * Mechanical click — synthesized with Web Audio API.
 * A short filtered transient + soft body thud, like a high-quality
 * physical toggle switch. No external audio file needed.
 */
let audioCtx = null

export function playMechanicalClick(volume = 0.5) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioCtx.state === 'suspended') audioCtx.resume()

    const t = audioCtx.currentTime
    const master = audioCtx.createGain()
    master.gain.value = volume
    master.connect(audioCtx.destination)

    // -- transient: sharp metallic tick (noise burst through bandpass) ----
    const noiseLen = 0.045
    const noiseBuffer = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * noiseLen), audioCtx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      // decaying noise
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.5)
    }
    const noise = audioCtx.createBufferSource()
    noise.buffer = noiseBuffer

    const bp = audioCtx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2600
    bp.Q.value = 1.4

    const hp = audioCtx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 900

    const tickGain = audioCtx.createGain()
    tickGain.gain.setValueAtTime(0.9, t)
    tickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)

    noise.connect(bp)
    bp.connect(hp)
    hp.connect(tickGain)
    tickGain.connect(master)
    noise.start(t)
    noise.stop(t + noiseLen)

    // -- body: soft low thud (damped sine) --------------------------------
    const osc = audioCtx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(210, t)
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.07)

    const bodyGain = audioCtx.createGain()
    bodyGain.gain.setValueAtTime(0.35, t)
    bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09)

    osc.connect(bodyGain)
    bodyGain.connect(master)
    osc.start(t)
    osc.stop(t + 0.1)

    // -- subtle secondary "release" tick, 30ms later ----------------------
    const osc2 = audioCtx.createOscillator()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(3200, t + 0.03)
    const gain2 = audioCtx.createGain()
    gain2.gain.setValueAtTime(0.12, t + 0.03)
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    osc2.connect(gain2)
    gain2.connect(master)
    osc2.start(t + 0.03)
    osc2.stop(t + 0.06)
  } catch {
    /* audio unavailable — fail silently */
  }
}
