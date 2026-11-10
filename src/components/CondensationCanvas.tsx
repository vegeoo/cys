import { useEffect, useRef } from "react"

type Drop = {
  x: number
  y: number
  previousY: number
  radius: number
  speed: number
  wobble: number
  phase: number
  opacity: number
}

type Trail = {
  x: number
  fromY: number
  toY: number
  radius: number
  life: number
}

const createDrop = (
  width: number,
  height: number,
  level: number,
  anywhere = false,
): Drop => {
  const radius = 1.4 + Math.random() * (2.5 + level * 7)
  return {
    x: Math.random() * width,
    y: anywhere ? Math.random() * height : -radius * 3,
    previousY: 0,
    radius,
    speed: 5 + Math.random() * 13 + radius * (2 + level * 2),
    wobble: 0.15 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
    opacity: 0,
  }
}

export default function CondensationCanvas({ level }: { level: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const levelRef = useRef(level)
  const dropsRef = useRef<Drop[]>([])
  const trailsRef = useRef<Trail[]>([])

  useEffect(() => {
    levelRef.current = level
  }, [level])

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    if (!canvas || !host) return

    const context = canvas.getContext("2d")
    if (!context) return

    const size = { width: 0, height: 0, dpr: 1 }
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    let reducedMotion = motionQuery.matches
    let frameId = 0
    let lastTime = performance.now()
    let visualLevel = levelRef.current
    let mergeTick = 0
    const css = getComputedStyle(document.documentElement)
    const fogRgb = css.getPropertyValue("--fog-rgb").trim()
    const lightRgb = css.getPropertyValue("--drop-light-rgb").trim()
    const midRgb = css.getPropertyValue("--drop-mid-rgb").trim()
    const darkRgb = css.getPropertyValue("--drop-dark-rgb").trim()
    const clearRgb = css.getPropertyValue("--clear-rgb").trim()

    const resize = () => {
      const bounds = host.getBoundingClientRect()
      size.width = Math.max(1, bounds.width)
      size.height = Math.max(1, bounds.height)
      size.dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(size.width * size.dpr)
      canvas.height = Math.round(size.height * size.dpr)
      context.setTransform(size.dpr, 0, 0, size.dpr, 0, 0)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    resize()

    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches
    }
    motionQuery.addEventListener("change", onMotionChange)

    const mergeNearbyDrops = (drops: Drop[]) => {
      for (let index = 0; index < drops.length; index += 1) {
        const first = drops[index]
        if (!first || first.radius > 13) continue
        for (
          let otherIndex = index + 1;
          otherIndex < Math.min(drops.length, index + 14);
          otherIndex += 1
        ) {
          const second = drops[otherIndex]
          if (!second) continue
          const distance = Math.hypot(first.x - second.x, first.y - second.y)
          if (distance < (first.radius + second.radius) * 0.7) {
            first.radius = Math.min(
              15,
              Math.sqrt(first.radius ** 2 + second.radius ** 2),
            )
            first.speed = Math.max(first.speed, second.speed) * 1.06
            drops.splice(otherIndex, 1)
            break
          }
        }
      }
    }

    const drawDrop = (drop: Drop) => {
      const stretch = 1 + Math.min(1.25, drop.speed / 38)
      context.save()
      context.translate(drop.x, drop.y)
      context.scale(1, stretch)
      const gradient = context.createRadialGradient(
        -drop.radius * 0.3,
        -drop.radius * 0.38,
        drop.radius * 0.12,
        0,
        0,
        drop.radius,
      )
      gradient.addColorStop(0, `rgba(${lightRgb},${drop.opacity * 0.78})`)
      gradient.addColorStop(0.38, `rgba(${midRgb},${drop.opacity * 0.18})`)
      gradient.addColorStop(0.8, `rgba(${darkRgb},${drop.opacity * 0.16})`)
      gradient.addColorStop(1, `rgba(${lightRgb},${drop.opacity * 0.48})`)
      context.fillStyle = gradient
      context.beginPath()
      context.arc(0, 0, drop.radius, 0, Math.PI * 2)
      context.fill()
      context.restore()
    }

    const render = (now: number) => {
      const delta = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000))
      lastTime = now
      visualLevel +=
        (levelRef.current - visualLevel) *
        Math.min(1, delta * (levelRef.current > visualLevel ? 1.25 : 0.48))

      const width = size.width
      const height = size.height
      const areaFactor = Math.min(1.5, (width * height) / 850000)
      const targetDrops = Math.floor(
        Math.pow(visualLevel, 1.45) * (reducedMotion ? 28 : 118) * areaFactor,
      )
      const drops = dropsRef.current
      const trails = trailsRef.current

      if (
        drops.length < targetDrops &&
        Math.random() < delta * (8 + visualLevel * 75)
      ) {
        drops.push(
          createDrop(
            width,
            height,
            visualLevel,
            drops.length < targetDrops / 2,
          ),
        )
      }

      context.clearRect(0, 0, width, height)
      const fogOpacity = 0.04 + Math.pow(visualLevel, 1.18) * 0.67
      context.fillStyle = `rgba(${fogRgb},${fogOpacity})`
      context.fillRect(0, 0, width, height)

      context.globalCompositeOperation = "destination-out"
      for (let index = trails.length - 1; index >= 0; index -= 1) {
        const trail = trails[index]
        trail.life -= delta * (0.2 + (1 - visualLevel) * 0.85)
        if (trail.life <= 0) {
          trails.splice(index, 1)
          continue
        }
        context.strokeStyle = `rgba(${clearRgb},${trail.life * 0.52})`
        context.lineWidth = trail.radius * 1.35
        context.lineCap = "round"
        context.beginPath()
        context.moveTo(trail.x, trail.fromY)
        context.lineTo(trail.x, trail.toY)
        context.stroke()
      }

      context.globalCompositeOperation = "source-over"
      for (let index = drops.length - 1; index >= 0; index -= 1) {
        const drop = drops[index]
        const active = index < targetDrops
        drop.opacity +=
          ((active ? 0.33 + visualLevel * 0.58 : 0) - drop.opacity) *
          Math.min(1, delta * 1.8)
        drop.previousY = drop.y

        if (!reducedMotion) {
          drop.phase += delta * drop.wobble
          drop.x += Math.sin(drop.phase) * delta * drop.wobble
          drop.y += drop.speed * delta * (0.32 + visualLevel * 1.28)
        }

        if (
          !reducedMotion &&
          drop.radius > 3.8 &&
          drop.y - drop.previousY > 0.15 &&
          Math.random() < delta * 8
        ) {
          trails.push({
            x: drop.x,
            fromY: Math.max(0, drop.y - drop.radius * 5),
            toY: drop.y,
            radius: drop.radius,
            life: 0.75,
          })
        }

        if (drop.y > height + drop.radius * 4) {
          if (active) {
            Object.assign(drop, createDrop(width, height, visualLevel))
          } else {
            drops.splice(index, 1)
            continue
          }
        }

        if (drop.opacity < 0.015 && !active) {
          drops.splice(index, 1)
          continue
        }

        drawDrop(drop)
      }

      if (trails.length > 180) trails.splice(0, trails.length - 180)
      mergeTick += 1
      if (!reducedMotion && mergeTick % 18 === 0 && visualLevel > 0.45) {
        mergeNearbyDrops(drops)
      }

      frameId = requestAnimationFrame(render)
    }

    frameId = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      motionQuery.removeEventListener("change", onMotionChange)
    }
  }, [])

  return <canvas ref={canvasRef} className="condensation-canvas" />
}
