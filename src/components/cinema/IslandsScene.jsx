import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { CATEGORIES } from '../../lib/cinemaData'

/**
 * Floating-island scene (Three.js).
 * Each category = a textured plane (its looping environment video) mounted on
 * a rocky island silhouette, floating in layered fog. Isometric-feel camera
 * with a very slow orbital drift + soft parallax toward the pointer.
 *
 * Performance: only the focused island's video decodes in real time; the
 * others are paused on a poster frame. Island meshes bob gently.
 */
export default function IslandsScene({ focusedId, onSelect }) {
  const mountRef = useRef(null)
  const islandsRef = useRef([]) // { id, video, group, screen, baseY, phase }
  const uiRef = useRef({ focusedId, onSelect })
  uiRef.current = { focusedId, onSelect }

  /* ---------------- mount: build the scene ---------------- */
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth
    const height = mount.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0b0e12, 0.05)

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
    camera.position.set(0, 3.2, 15.5)
    camera.lookAt(0, 0, 0)

    /* ---------- lighting: physically motivated, no neon ---------- */
    scene.add(new THREE.HemisphereLight(0x8899aa, 0x1a140e, 0.55))
    const key = new THREE.DirectionalLight(0xfff2dd, 1.15)
    key.position.set(6, 10, 6)
    scene.add(key)
    const rimLight = new THREE.DirectionalLight(0x4d6070, 0.5)
    rimLight.position.set(-8, 3, -6)
    scene.add(rimLight)

    /* ---------- layered cloud volume (billboards) ---------- */
    const cloudTex = (() => {
      const c = document.createElement('canvas')
      c.width = c.height = 128
      const g = c.getContext('2d')
      const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64)
      grd.addColorStop(0, 'rgba(210,216,222,0.55)')
      grd.addColorStop(0.4, 'rgba(180,188,196,0.22)')
      grd.addColorStop(1, 'rgba(160,170,180,0)')
      g.fillStyle = grd
      g.fillRect(0, 0, 128, 128)
      return new THREE.CanvasTexture(c)
    })()
    const clouds = []
    for (let i = 0; i < 26; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: cloudTex, transparent: true, depthWrite: false, opacity: 0.5,
      }))
      const a = (i / 26) * Math.PI * 2 + Math.random() * 0.4
      const r = 7 + Math.random() * 9
      s.position.set(Math.cos(a) * r, -3.5 + Math.random() * 7, Math.sin(a) * r)
      const scale = 4 + Math.random() * 7
      s.scale.set(scale, scale * 0.42, 1)
      scene.add(s)
      clouds.push(s)
    }

    /* ---------- islands: video diorama + rock base ---------- */
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x2c2622, roughness: 0.95, metalness: 0.05, flatShading: true })
    const rockBottomMat = new THREE.MeshStandardMaterial({ color: 0x1d1916, roughness: 1, flatShading: true })

    const islands = []
    CATEGORIES.forEach((cat, idx) => {
      const group = new THREE.Group()
      group.position.set(...cat.islandPos)
      group.rotation.y = cat.islandRot

      const video = document.createElement('video')
      video.src = cat.env
      video.muted = true
      video.loop = true
      video.playsInline = true
      video.preload = 'metadata'
      video.dataset.islandId = cat.id

      const videoTex = new THREE.VideoTexture(video)
      videoTex.colorSpace = THREE.SRGBColorSpace
      videoTex.minFilter = THREE.LinearFilter

      const shell = new THREE.Mesh(
        new THREE.BoxGeometry(4.62, 2.85, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x3a332e, roughness: 0.85, metalness: 0.15 }),
      )
      shell.position.set(0, 1.42, -0.28)

      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(4.4, 2.48),
        new THREE.MeshBasicMaterial({ map: videoTex }),
      )
      screen.position.y = 1.55
      screen.rotation.x = -0.06

      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 1.6, 0.55, 9, 1), rockMat)
      base.position.y = -0.05
      base.rotation.y = idx * 0.8

      const bottom = new THREE.Mesh(new THREE.ConeGeometry(2.45, 2.6, 8, 3), rockBottomMat)
      bottom.position.y = -1.7
      bottom.rotation.y = idx * 1.3
      bottom.rotation.x = Math.PI

      group.add(shell, screen, base, bottom)
      scene.add(group)
      islands.push({ id: cat.id, video, group, screen, baseY: cat.islandPos[1], phase: Math.random() * Math.PI * 2 })
    })
    islandsRef.current = islands

    /* ---------- gentle pointer parallax ---------- */
    const pointer = { x: 0, y: 0 }
    const onPointerMove = (e) => {
      const r = mount.getBoundingClientRect()
      pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2
      pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2
    }

    /* ---------- click picking (via screen meshes) ---------- */
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    let downAt = 0
    const onDown = () => { downAt = performance.now() }
    const onUp = (e) => {
      if (performance.now() - downAt > 350) return // drag, not a click
      const r = mount.getBoundingClientRect()
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1
      raycaster.setFromCamera(ndc, camera)
      const hits = raycaster.intersectObjects(islands.map((i) => i.screen))
      if (hits.length) {
        const hit = islands.find((i) => i.screen === hits[0].object)
        if (hit) uiRef.current.onSelect?.(hit.id)
      }
    }

    mount.addEventListener('pointermove', onPointerMove)
    mount.addEventListener('pointerdown', onDown)
    mount.addEventListener('pointerup', onUp)

    /* ---------- loop: slow orbit, bobbing, spring focus scale ---------- */
    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()

      const orbAngle = Math.sin(t * 0.06) * 0.28
      camera.position.x = Math.sin(orbAngle) * 15.5 + pointer.x * 0.6
      camera.position.z = Math.cos(orbAngle) * 15.5
      camera.position.y = 3.2 - pointer.y * 0.5
      camera.lookAt(0, 0.2, 0)

      islands.forEach((isl) => {
        isl.group.position.y = isl.baseY + Math.sin(t * 0.5 + isl.phase) * 0.14
        isl.group.rotation.z = Math.sin(t * 0.35 + isl.phase) * 0.015
        const target = uiRef.current.focusedId === isl.id ? 1.18 : 1
        isl.group.scale.lerp(new THREE.Vector3(target, target, target), 0.045)
      })

      clouds.forEach((c, i) => {
        c.position.x += Math.sin(t * 0.05 + i) * 0.0012
        c.material.opacity = 0.32 + Math.sin(t * 0.2 + i * 1.7) * 0.14
      })

      renderer.render(scene, camera)
    }
    tick()

    /* initial decode: only the focused island */
    islands.forEach((isl) => {
      if (isl.id === uiRef.current.focusedId) isl.video.play().catch(() => {})
    })

    return () => {
      cancelAnimationFrame(raf)
      mount.removeEventListener('pointermove', onPointerMove)
      mount.removeEventListener('pointerdown', onDown)
      mount.removeEventListener('pointerup', onUp)
      islands.forEach((i) => {
        i.video.pause()
        i.video.removeAttribute('src')
        i.video.load()
      })
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material]
          mats.forEach((m) => {
            if (m.map && m.map !== cloudTex) m.map.dispose()
            m.dispose()
          })
        }
      })
      cloudTex.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  /* ---------------- focus change → decode only focused video ---------------- */
  useEffect(() => {
    for (const isl of islandsRef.current) {
      if (isl.id === focusedId) {
        if (isl.video.paused) isl.video.play().catch(() => {})
      } else if (!isl.video.paused) {
        isl.video.pause()
      }
    }
  }, [focusedId])

  return <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
}
