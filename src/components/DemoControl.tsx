type Props = {
  value: number
  onChange: (value: number) => void
}

export default function DemoControl({ value, onChange }: Props) {
  const roundedValue = Math.round(value)

  return (
    <label className="demo-control">
      <span className="demo-label t-label">
        데모 습도 <b>{roundedValue}%</b>
      </span>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={roundedValue}
        aria-label="데모 습도"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}
