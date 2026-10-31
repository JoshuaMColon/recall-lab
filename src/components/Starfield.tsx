import { useEffect, useRef } from 'react'

/**
 * Fixed, decorative starfield behind the whole app.
 * - Dark theme: a twinkling field with a rare, faint shooting star.
 * - Light theme: a pale star chart with a few constellation lines.
 * - Static single frame under prefers-reduced-motion or Save-Data; paused while the tab is hidden.
 * - ~30 fps, star count scales with area (capped), DPR capped at 2, so it stays cheap on phones.
 */
type Star = { x: number; y: number; r: number; a: number; tw: number; ph: number; tint: 0 | 1 | 2 }
type Const = { pts: [number, number][] }

const FRAME_MS = 1000 / 30

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function prefersStatic() {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return Boolean(reduce || conn?.saveData)
}

export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let w = 0
    let h = 0
    let stars: Star[] = []
    let consts: Const[] = []
    let raf = 0
    let last = 0
    let shoot: { x: number; y: number; vx: number; vy: number; life: number } | null = null
    let nextShoot = performance.now() + 9000
    let still = prefersStatic()
    let starRgb = '236 238 254'
    const dark = () => document.documentElement.dataset.theme === 'dark'

    function build() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas!.width = Math.round(w * dpr)
      canvas!.height = Math.round(h * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      const rand = rng(0x5eed + Math.round(w / 50) * 31 + Math.round(h / 50))
      starRgb = getComputedStyle(document.documentElement).getPropertyValue('--star').trim() || starRgb
      const isDark = dark()
      const n = Math.min(isDark ? 220 : 120, Math.round((w * h) / (isDark ? 5200 : 9000)))
      stars = Array.from({ length: n }, () => {
        const big = rand() < 0.08
        return {
          x: rand() * w,
          y: rand() * h,
          r: big ? 1.1 + rand() * 0.8 : 0.35 + rand() * 0.75,
          a: big ? 0.75 + rand() * 0.25 : 0.25 + rand() * 0.5,
          tw: 0.4 + rand() * 1.4,
          ph: rand() * Math.PI * 2,
          tint: rand() < 0.12 ? 1 : rand() < 0.1 ? 2 : 0,
        }
      })
      // A handful of small constellations: random walks of 4–6 points.
      const count = Math.max(2, Math.min(6, Math.round((w * h) / 260000)))
      consts = Array.from({ length: count }, () => {
        let x = rand() * w
        let y = rand() * h
        const pts: [number, number][] = [[x, y]]
        const len = 4 + Math.floor(rand() * 3)
        for (let i = 1; i < len; i++) {
          const ang = rand() * Math.PI * 2
          const d = 40 + rand() * 70
          x = Math.max(8, Math.min(w - 8, x + Math.cos(ang) * d))
          y = Math.max(8, Math.min(h - 8, y + Math.sin(ang) * d))
          pts.push([x, y])
        }
        return { pts }
      })
    }

    function draw(t: number) {
      const isDark = dark()
      const star = starRgb
      const gold = isDark ? '255 214 140' : '170 110 20'
      const violet = isDark ? '190 170 255' : '90 63 209'
      ctx!.clearRect(0, 0, w, h)

      // constellation lines (both themes, much fainter in dark)
      ctx!.lineWidth = 1
      ctx!.strokeStyle = `rgb(${violet} / ${isDark ? 0.1 : 0.16})`
      for (const c of consts) {
        ctx!.beginPath()
        c.pts.forEach(([x, y], i) => (i ? ctx!.lineTo(x, y) : ctx!.moveTo(x, y)))
        ctx!.stroke()
        for (const [x, y] of c.pts) {
          ctx!.fillStyle = `rgb(${violet} / ${isDark ? 0.45 : 0.5})`
          ctx!.beginPath()
          ctx!.arc(x, y, 1.6, 0, Math.PI * 2)
          ctx!.fill()
        }
      }

      const k = still ? 0 : t / 1000
      for (const s of stars) {
        const tw = still ? 1 : 0.55 + 0.45 * Math.sin(k * s.tw + s.ph)
        const alpha = s.a * tw * (isDark ? 1 : 0.55)
        const col = s.tint === 1 ? gold : s.tint === 2 ? violet : star
        ctx!.fillStyle = `rgb(${col} / ${alpha.toFixed(3)})`
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fill()
        if (isDark && s.r > 1.2) {
          ctx!.fillStyle = `rgb(${col} / ${(alpha * 0.18).toFixed(3)})`
          ctx!.beginPath()
          ctx!.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2)
          ctx!.fill()
        }
      }

      if (!still && isDark) {
        if (!shoot && t > nextShoot) {
          shoot = { x: Math.random() * w * 0.7 + w * 0.2, y: Math.random() * h * 0.35, vx: -7, vy: 3, life: 1 }
        }
        if (shoot) {
          const tail = 14
          const g = ctx!.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * tail, shoot.y - shoot.vy * tail)
          g.addColorStop(0, `rgb(255 240 210 / ${0.7 * shoot.life})`)
          g.addColorStop(1, 'rgb(255 240 210 / 0)')
          ctx!.strokeStyle = g
          ctx!.lineWidth = 1.4
          ctx!.beginPath()
          ctx!.moveTo(shoot.x, shoot.y)
          ctx!.lineTo(shoot.x - shoot.vx * tail, shoot.y - shoot.vy * tail)
          ctx!.stroke()
          shoot.x += shoot.vx
          shoot.y += shoot.vy
          shoot.life -= 0.025
          if (shoot.life <= 0 || shoot.x < -50) {
            shoot = null
            nextShoot = t + 12000 + Math.random() * 14000
          }
        }
      }
    }

    function loop(t: number) {
      raf = requestAnimationFrame(loop)
      if (t - last < FRAME_MS) return
      last = t
      draw(t)
    }

    function start() {
      cancelAnimationFrame(raf)
      if (still || document.hidden) draw(performance.now())
      else raf = requestAnimationFrame(loop)
    }

    build()
    start()

    let resizeTimer = 0
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        build()
        start()
      }, 150)
    }
    const onVis = () => (document.hidden ? cancelAnimationFrame(raf) : start())
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const onMotion = () => {
      still = prefersStatic()
      start()
    }
    const themeObs = new MutationObserver(() => {
      build()
      start()
    })
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVis)
    mq?.addEventListener?.('change', onMotion)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(resizeTimer)
      themeObs.disconnect()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
      mq?.removeEventListener?.('change', onMotion)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
}
