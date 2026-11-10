import { useEffect, useRef, useState } from "react"
import type { Reading } from "../lib/device"
import { SENSOR_MAX } from "../product"

const HEIGHT = 200
const PADDING = { left: 40, right: 8, top: 8, bottom: 20 }

export default function SensorChart({ readings }: { readings: Reading[] }) {
  const containerRef = useRef<HTMLElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const chartWidth = Math.max(width, PADDING.left + PADDING.right + 1)
  const plotWidth = chartWidth - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom
  const x = (index: number) =>
    PADDING.left + (index * plotWidth) / Math.max(readings.length - 1, 1)
  const y = (value: number) =>
    PADDING.top +
    (1 - Math.min(Math.max(value, 0), SENSOR_MAX) / SENSOR_MAX) * plotHeight
  const points = readings
    .map((row, index) => `${x(index)},${y(row.value)}`)
    .join(" ")
  const currentValue = readings.at(-1)?.value

  return (
    <section
      ref={containerRef}
      className="chart-section"
      aria-label="실시간 센서값"
    >
      {readings.length === 0 ? (
        <p className="chart-empty t-body">
          센서를 연결하면 값이 여기에 그려집니다.
        </p>
      ) : (
        <svg
          width={chartWidth}
          height={HEIGHT}
          role="img"
          aria-label={`센서값 추이, 현재 ${currentValue?.toLocaleString("ko-KR")}`}
        >
          {[SENSOR_MAX, SENSOR_MAX / 2, 0].map((tick) => (
            <g key={tick}>
              <line
                className="chart-grid-line"
                x1={PADDING.left}
                x2={chartWidth - PADDING.right}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text
                className="chart-label"
                x={PADDING.left - PADDING.right}
                y={y(tick) + 4}
                textAnchor="end"
              >
                {Math.round(tick).toLocaleString("ko-KR")}
              </text>
            </g>
          ))}
          <polyline className="chart-line" points={points} />
          <text className="chart-label" x={PADDING.left} y={HEIGHT - 2}>
            −60s
          </text>
          <text
            className="chart-label"
            x={chartWidth - PADDING.right}
            y={HEIGHT - 2}
            textAnchor="end"
          >
            지금
          </text>
        </svg>
      )}
    </section>
  )
}
