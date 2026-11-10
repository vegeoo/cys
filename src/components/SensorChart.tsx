import type { Reading } from "../lib/device"

const WIDTH = 360
const HEIGHT = 58
const PADDING = { left: 2, right: 2, top: 5, bottom: 15 }

export default function SensorChart({ readings }: { readings: Reading[] }) {
  if (readings.length < 2) return null

  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom
  const x = (index: number) =>
    PADDING.left + (index * plotWidth) / Math.max(1, readings.length - 1)
  const y = (value: number) =>
    PADDING.top + (1 - Math.min(100, Math.max(0, value)) / 100) * plotHeight
  const points = readings
    .map((reading, index) => `${x(index)},${y(reading.value)}`)
    .join(" ")
  const currentValue = Math.round(readings.at(-1)?.value ?? 0)

  return (
    <section className="sensor-chart" aria-label="최근 습도 추이">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`최근 습도 추이, 현재 ${currentValue}%`}
      >
        <polyline points={points} />
        <text x={PADDING.left} y={HEIGHT - 1}>
          60초 전
        </text>
        <text x={WIDTH - PADDING.right} y={HEIGHT - 1} textAnchor="end">
          지금
        </text>
      </svg>
    </section>
  )
}
