export default function HumidityDisplay({ value }: { value?: number }) {
  const roundedValue = value === undefined ? "—" : Math.round(value)

  return (
    <section className="humidity-display" aria-label="현재 습도">
      <p className="humidity-value t-value">
        {roundedValue}
        <span>%</span>
      </p>
      <p className="humidity-label t-caption">현재 습도</p>
      <span className="sr-only" aria-live="polite">
        현재 습도 {roundedValue}퍼센트
      </span>
    </section>
  )
}
